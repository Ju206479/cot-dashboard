export default async function handler(req, res) {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: "Missing code" });

  const url = `https://publicreporting.cftc.gov/api/odata/v1/CorrectionsOtherFuturesCombined?$select=Market_and_Exchange_Names,_Report_Date_as_YYYY_MM_DD,Open_Interest_All,NonComm_Positions_Long_All,NonComm_Positions_Short_All,Change_in_NonComm_Long_All,Change_in_NonComm_Short_All&$filter=CFTC_Contract_Market_Code eq '${code}'&$orderby=_Report_Date_as_YYYY_MM_DD desc&$top=20`;

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
