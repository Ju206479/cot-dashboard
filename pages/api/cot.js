export default async function handler(req, res) {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: "Missing code" });

  const url = `https://data.cftc.gov/resource/jun7-ak4f.json?cftc_contract_market_code=${encodeURIComponent(code)}&$order=report_date_as_yyyy_mm_dd DESC&$limit=20&$select=market_and_exchange_names,report_date_as_yyyy_mm_dd,open_interest_all,noncomm_positions_long_all,noncomm_positions_short_all,change_in_noncomm_long_all,change_in_noncomm_short_all`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`CFTC error: ${response.status}`);
    const data = await response.json();

    // Normalise les champs pour correspondre au format attendu par le frontend
    const value = data.map(row => ({
      Market_and_Exchange_Names: row.market_and_exchange_names,
      _Report_Date_as_YYYY_MM_DD: row.report_date_as_yyyy_mm_dd,
      Open_Interest_All: row.open_interest_all,
      NonComm_Positions_Long_All: row.noncomm_positions_long_all,
      NonComm_Positions_Short_All: row.noncomm_positions_short_all,
      Change_in_NonComm_Long_All: row.change_in_noncomm_long_all,
      Change_in_NonComm_Short_All: row.change_in_noncomm_short_all,
    }));

    res.setHeader("Cache-Control", "s-maxage=3600");
    res.status(200).json({ value });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
