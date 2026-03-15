const INSTRUMENTS = {
  "099741": "EURO FX",
  "096742": "BRITISH POUND",
  "232741": "AUSTRALIAN DOLLAR",
  "112741": "NEW ZEALAND DOLLAR",
  "098662": "U.S. DOLLAR INDEX",
  "13874A": "E-MINI S&P 500",
};

function parseBlocks(text, targetCode) {
  const results = [];
  // Chaque bloc commence par le nom du marché et contient "Code-XXXXXX"
  const blocks = text.split(/\n(?=[A-Z])/);

  for (const block of blocks) {
    const codeMatch = block.match(/Code-(\w+)/);
    if (!codeMatch) continue;
    const code = codeMatch[1].trim();
    if (code !== targetCode) continue;

    // Extraire la date
    const dateMatch = block.match(/AS OF (\d{2}\/\d{2}\/\d{2})/);
    if (!dateMatch) continue;
    const [mm, dd, yy] = dateMatch[1].split("/");
    const date = `20${yy}-${mm}-${dd}`;

    // Les lignes de chiffres : COMMITMENTS puis CHANGES
    const lines = block.split("\n").filter(l => /^\s*[\d,\s-]+$/.test(l.trim()) && l.trim().length > 0);

    if (lines.length < 2) continue;

    const parseNums = line => line.trim().split(/\s+/).map(n => parseInt(n.replace(/,/g, ""), 10));

    const commitments = parseNums(lines[0]);
    const changes = parseNums(lines[1]);

    // Format: LONG | SHORT | SPREADS | ...
    const long = commitments[0];
    const short = commitments[1];
    const chLong = changes[0];
    const chShort = changes[1];

    results.push({
      _Report_Date_as_YYYY_MM_DD: date,
      NonComm_Positions_Long_All: long,
      NonComm_Positions_Short_All: short,
      Change_in_NonComm_Long_All: chLong,
      Change_in_NonComm_Short_All: chShort,
    });
  }

  return results;
}

export default async function handler(req, res) {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: "Missing code" });

  // Normalise le code (13874+ → 13874A)
  const normalizedCode = code.replace("+", "A");

  try {
    const response = await fetch("https://www.cftc.gov/dea/futures/deacmesf.htm", {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    if (!response.ok) throw new Error(`CFTC error: ${response.status}`);
    const text = await response.text();

    const value = parseBlocks(text, normalizedCode);

    if (value.length === 0) {
      return res.status(404).json({ error: `No data found for code ${normalizedCode}` });
    }

    res.setHeader("Cache-Control", "s-maxage=3600");
    res.status(200).json({ value });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
