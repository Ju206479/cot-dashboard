const NASDAQ_KEY = "RzKXfxBZcGxBKY9QxKiw";

// Codes Nasdaq Data Link pour chaque instrument
const DATASET_MAP = {
  "099741": "CFTC/099741_FO_L_CHG", // EUR
  "096742": "CFTC/096742_FO_L_CHG", // GBP
  "232741": "CFTC/232741_FO_L_CHG", // AUD
  "112741": "CFTC/112741_FO_L_CHG", // NZD
  "098662": "CFTC/098662_FO_L_CHG", // USD Index
  "13874+": "CFTC/13874A_FO_L_CHG", // S&P 500
};

export default async function handler(req, res) {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: "Missing code" });

  const dataset = DATASET_MAP[code];
  if (!dataset) return res.status(400).json({ error: "Unknown code" });

  const url = `https://data.nasdaq.com/api/v3/datasets/${dataset}.json?rows=20&api_key=${NASDAQ_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Nasdaq error: ${response.status}`);
    const json = await response.json();

    const cols = json.dataset.column_names;
    const rows = json.dataset.data;

    // Colonnes attendues dans le dataset CFTC Nasdaq
    const dateIdx = cols.indexOf("Date");
    const longIdx = cols.indexOf("Noncommercial Long");
    const shortIdx = cols.indexOf("Noncommercial Short");
    const chLongIdx = cols.indexOf("Change in Noncommercial Long");
    const chShortIdx = cols.indexOf("Change in Noncommercial Short");

    const value = rows.map(row => ({
      _Report_Date_as_YYYY_MM_DD: row[dateIdx],
      NonComm_Positions_Long_All: row[longIdx],
      NonComm_Positions_Short_All: row[shortIdx],
      Change_in_NonComm_Long_All: row[chLongIdx],
      Change_in_NonComm_Short_All: row[chShortIdx],
    }));

    res.setHeader("Cache-Control", "s-maxage=3600");
    res.status(200).json({ value });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
