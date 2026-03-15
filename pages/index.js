import { useState, useEffect } from "react";

const INSTRUMENTS = [
  { label: "EUR", name: "EURO FX", code: "099741" },
  { label: "GBP", name: "BRITISH POUND", code: "096742" },
  { label: "AUD", name: "AUSTRALIAN DOLLAR", code: "232741" },
  { label: "NZD", name: "NEW ZEALAND DOLLAR", code: "112741" },
  { label: "USD", name: "USD INDEX", code: "098662" },
  { label: "S&P 500", name: "E-MINI S&P 500", code: "13874+" },
];

function formatNum(n) {
  if (n === null || n === undefined || isNaN(n)) return "—";
  return Number(n).toLocaleString("fr-FR");
}

function netColor(val) {
  const v = Number(val);
  if (v > 80000) return "#006400";
  if (v > 50000) return "#228B22";
  if (v > 25000) return "#4CAF50";
  if (v > 10000) return "#8BC34A";
  if (v > 0) return "#CDDC39";
  if (v > -10000) return "#FF9800";
  if (v > -25000) return "#F44336";
  if (v > -50000) return "#C62828";
  return "#7B0000";
}

function changeColor(val) {
  const v = Number(val);
  if (v > 10000) return "#006400";
  if (v > 5000) return "#4CAF50";
  if (v > 0) return "#8BC34A";
  if (v > -5000) return "#F44336";
  return "#C62828";
}

function textColor(bg) {
  return ["#1a1a1a", "#7B0000", "#C62828", "#006400", "#228B22"].includes(bg) ? "#fff" : "#111";
}

function InstrumentTable({ instrument }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/cot?code=${encodeURIComponent(instrument.code)}`)
      .then(r => r.json())
      .then(data => { setRows(data.value || []); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [instrument.code]);

  if (loading) return (
    <div style={{ padding: 40, textAlign: "center", color: "#aaa" }}>
      <p style={{ marginBottom: 12 }}>Chargement {instrument.label}...</p>
      <div style={{
        width: 40, height: 40, border: "3px solid #333",
        borderTop: "3px solid #E8A820", borderRadius: "50%",
        animation: "spin 1s linear infinite", margin: "0 auto"
      }} />
    </div>
  );

  if (error) return (
    <div style={{ padding: 20, color: "#F44336" }}>⚠️ Erreur : {error}</div>
  );

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            {["DATE", "LONG", "SHORT", "CH. LONG", "CH. SHORT", "NET POSITION"].map(c => (
              <th key={c} style={{
                background: "#E8A820", color: "#111", padding: "10px 14px",
                textAlign: c === "DATE" ? "left" : "right", fontWeight: 700,
                fontSize: 12, letterSpacing: "0.5px", border: "1px solid #111",
                whiteSpace: "nowrap"
              }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const long = Number(row.NonComm_Positions_Long_All);
            const short = Number(row.NonComm_Positions_Short_All);
            const chLong = Number(row.Change_in_NonComm_Long_All);
            const chShort = Number(row.Change_in_NonComm_Short_All);
            const net = long - short;
            const netBg = netColor(net);
            const chLongBg = changeColor(chLong);
            const chShortBg = changeColor(-chShort);
            const date = row["_Report_Date_as_YYYY_MM_DD"]?.slice(0, 10) || "—";
            const dateFormatted = date !== "—"
              ? new Date(date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
              : "—";

            return (
              <tr key={i} style={{ background: i % 2 === 0 ? "#161616" : "#1d1d1d" }}>
                <td style={{ padding: "8px 14px", color: "#ccc", border: "1px solid #2a2a2a", whiteSpace: "nowrap" }}>
                  {dateFormatted}
                </td>
                <td style={{ padding: "8px 14px", textAlign: "right", color: "#90EE90", border: "1px solid #2a2a2a", fontFamily: "monospace" }}>
                  {formatNum(long)}
                </td>
                <td style={{ padding: "8px 14px", textAlign: "right", color: "#FF8A80", border: "1px solid #2a2a2a", fontFamily: "monospace" }}>
                  {formatNum(short)}
                </td>
                <td style={{ padding: "8px 14px", textAlign: "right", background: chLongBg, color: textColor(chLongBg), border: "1px solid #111", fontFamily: "monospace", fontWeight: 600 }}>
                  {chLong >= 0 ? "+" : ""}{formatNum(chLong)}
                </td>
                <td style={{ padding: "8px 14px", textAlign: "right", background: chShortBg, color: textColor(chShortBg), border: "1px solid #111", fontFamily: "monospace", fontWeight: 600 }}>
                  {chShort >= 0 ? "+" : ""}{formatNum(chShort)}
                </td>
                <td style={{ padding: "8px 14px", textAlign: "right", background: netBg, color: textColor(netBg), border: "1px solid #111", fontFamily: "monospace", fontWeight: 700, fontSize: 14 }}>
                  {net >= 0 ? "+" : ""}{formatNum(net)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function Home() {
  const [active, setActive] = useState(0);

  return (
    <div style={{ minHeight: "100vh", background: "#0d0d0d", color: "#eee", fontFamily: "'Segoe UI', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #1a1a1a; }
        ::-webkit-scrollbar-thumb { background: #E8A820; border-radius: 3px; }
      `}</style>

      {/* Header */}
      <div style={{
        background: "#141414", borderBottom: "2px solid #E8A820",
        padding: "20px 24px", display: "flex", alignItems: "center",
        justifyContent: "space-between", flexWrap: "wrap", gap: 12
      }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#E8A820", letterSpacing: 1 }}>
            📊 COT DASHBOARD
          </div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
            Non-Commercial Positions · CFTC · Données live
          </div>
        </div>
        <div style={{ fontSize: 11, color: "#666", background: "#1a1a1a", border: "1px solid #333", padding: "6px 12px", borderRadius: 6 }}>
          Publication CFTC : chaque vendredi ~15h30 EST
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, padding: "16px 16px 0", borderBottom: "1px solid #2a2a2a", flexWrap: "wrap" }}>
        {INSTRUMENTS.map((inst, i) => (
          <button key={inst.label} onClick={() => setActive(i)} style={{
            padding: "8px 20px",
            background: active === i ? "#E8A820" : "#1a1a1a",
            color: active === i ? "#111" : "#aaa",
            border: active === i ? "2px solid #E8A820" : "2px solid #2a2a2a",
            borderBottom: "none", borderRadius: "6px 6px 0 0",
            cursor: "pointer", fontWeight: active === i ? 700 : 400,
            fontSize: 13, letterSpacing: "0.5px"
          }}>
            {inst.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ border: "1px solid #2a2a2a", borderTop: "none", background: "#111" }}>
        <div style={{
          padding: "14px 20px", borderBottom: "1px solid #2a2a2a",
          display: "flex", alignItems: "center", gap: 16, background: "#141414"
        }}>
          <div style={{ background: "#E8A820", color: "#111", padding: "4px 14px", borderRadius: 4, fontWeight: 700, fontSize: 16 }}>
            {INSTRUMENTS[active].label}
          </div>
          <div style={{ color: "#888", fontSize: 12 }}>
            {INSTRUMENTS[active].name} · 20 dernières semaines · Positions Non-Commerciales
          </div>
        </div>
        <InstrumentTable instrument={INSTRUMENTS[active]} />
      </div>

      {/* Legend */}
      <div style={{ padding: "16px 20px", display: "flex", gap: 20, flexWrap: "wrap", fontSize: 11, color: "#666", marginTop: 8 }}>
        <span>🟢 Net positif fort (&gt;50k)</span>
        <span>🟡 Net légèrement positif</span>
        <span>🟠 Net légèrement négatif</span>
        <span>🔴 Net négatif fort (&lt;-50k)</span>
        <span style={{ marginLeft: "auto" }}>Source : CFTC COT Report</span>
      </div>
    </div>
  );
}
