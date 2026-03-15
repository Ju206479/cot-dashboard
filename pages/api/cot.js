export default async function handler(req, res) {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: "Missing code" });

  const url = `https://publicreporting.cftc.gov/api/odata/v1/CorrectionsOtherFuturesCombined?%24select=Market_and_Exchange_Names%2C_Report_Date_as_YYYY_MM_DD%2COpen_Interest_All%2CNonComm_Positions_Long_All%2CNonComm_Positions_Short_All%2CChange_in_NonComm_Long_All%2CChange_in_NonComm_Short_All&%24filter=CFTC_Contract_Market_Code%20eq%20'${encodeURIComponent(code)}'&%24orderby=_Report_Date_as_YYYY_MM_DD%20desc&%24top=20`;

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