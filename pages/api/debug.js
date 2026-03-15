export default async function handler(req, res) {
  const url = "https://www.cftc.gov/dea/futures/deacmesf.htm";
  const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  const text = await response.text();
  // Renvoie les 3000 premiers caractères pour voir le format
  res.status(200).json({ preview: text.slice(0, 3000) });
}
