export default async function handler(req, res) {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: "Missing code" });

  const url = `https://data.cftc.gov/resource/jun7-ak4f.json?cftc_contract_market_code=${encodeURIComponent(code)}&$order=report_date_as_yyyy_mm_dd DESC&$limit=20&$select=market_and_exchange_names,report_date_as_yyyy_mm_dd,open_interest_all,noncomm_positions_long_all,noncomm_positions_short_all,change_in_noncomm_long_all,change_in_noncomm_short_all`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`CFTC error: ${response.status}`);
    const data = await response.json();
    res.setHeader("Cache-Control", "s-maxage=3600");
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
