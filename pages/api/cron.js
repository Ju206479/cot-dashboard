// pages/api/cron.js
// Déclenché chaque samedi à 7h UTC (= 8h Paris)
// Dans vercel.json : { "crons": [{ "path": "/api/cron", "schedule": "0 7 * * 6" }] }

import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const SOURCES = [
  { url: "https://www.cftc.gov/dea/futures/deacmesf.htm", codes: ["099741", "232741", "096742", "112741"] },
  { url: "https://www.cftc.gov/dea/futures/deanybtsf.htm", codes: ["098662"] },
];

const CODE_LABEL = {
  "099741": "EUR",
  "232741": "AUD",
  "096742": "GBP",
  "112741": "NZD",
  "098662": "USD",
};

function parseBlock(text, targetCode) {
  const blocks = text.split(/\n(?=[A-Z])/);
  for (const block of blocks) {
    const codeMatch = block.match(/Code-(\w+)/);
    if (!codeMatch || codeMatch[1].trim() !== targetCode) continue;

    const dateMatch = block.match(/AS OF (\d{2}\/\d{2}\/\d{2})/);
    if (!dateMatch) continue;
    const [mm, dd, yy] = dateMatch[1].split("/");
    const date = `20${yy}-${mm}-${dd}`;

    const lines = block
      .split("\n")
      .filter(l => /^\s*-?[\d,\s]+$/.test(l.trim()) && l.trim().length > 5);

    if (lines.length < 2) continue;

    const parseNums = l => l.trim().split(/\s+/).map(n => parseInt(n.replace(/,/g, ""), 10));
    const commitments = parseNums(lines[0]);
    const changes = parseNums(lines[1]);

    return {
      date,
      long: commitments[0],
      short: commitments[1],
      chLong: changes[0],
      chShort: changes[1],
    };
  }
  return null;
}

export default async function handler(req, res) {
  // Sécurité : Vercel envoie ce header sur les crons
  if (req.headers["x-vercel-cron"] !== "1" && req.query.secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const results = [];

  for (const source of SOURCES) {
    const response = await fetch(source.url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!response.ok) continue;
    const text = await response.text();

    for (const code of source.codes) {
      const parsed = parseBlock(text, code);
      if (!parsed) continue;

      // Récupère l'historique existant
      const existing = await redis.get(`cot:${code}`) || [];
      
      // Évite les doublons (même date)
      if (existing[0]?.date === parsed.date) continue;

      // Ajoute la nouvelle semaine en tête
      const updated = [parsed, ...existing];
      await redis.set(`cot:${code}`, updated);

      results.push({ code, label: CODE_LABEL[code], date: parsed.date });
    }
  }

  res.status(200).json({ ok: true, saved: results });
}
