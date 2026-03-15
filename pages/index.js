import { useState, useEffect } from "react";

const INSTRUMENTS = [
  { label: "EUR", code: "099741" },
  { label: "GBP", code: "096742" },
  { label: "AUD", code: "232741" },
  { label: "NZD", code: "112741" },
  { label: "USD", code: "098662" },
  { label: "S&P 500", code: "13874A" },
  { label: "BTC", code: "133741" },
];

function formatNum(n) {
  if (n === null || n === undefined || isNaN(n)) return "—";
  return Number(n).toLocaleString("fr-FR");
}

function netColor(val) {
  const v = Number(val);
  if (v > 50000)  return { bg: "#1B5E20", text: "#fff" }; // vert foncé
  if (v > 30000)  return { bg: "#2E7D32", text: "#fff" }; // vert moyen-foncé
  if (v > 10000)  return { bg: "#4CAF50", text: "#111" }; // vert normal
  if (v > 0)      return { bg: "#A5D6A7", text: "#111" }; // vert clair
  if (v > -10000) return { bg: "#FFCDD2", text: "#111" }; // rouge clair
  if (v > -30000) return { bg: "#E53935", text: "#fff" }; // rouge normal
  if (v > -50000) return { bg: "#C62828", text: "#fff" }; // rouge moyen-foncé
  return { bg: "#7B0000", text: "#fff" };                  // rouge foncé
}

function changeColor(val) {
  const v = Number(val);
  if (v > 5000)  return { bg: "#4CAF50", text: "#111" };
  if (v > 0)     return { bg: "#A5D6A7", text: "#111" };
  if (v > -5000) return { bg: "#FFCDD2", text: "#111" };
  return { bg: "#E53935", text: "#fff" };
}

function InstrumentTable({ instrument }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/cot?code=${instrument.code}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setRows(data.value || []);
        setLoading(false);
      })
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
    <div style={{ padding: 20, color: "#F44336" }}>
      ⚠️ {error === "No data yet — cron not run yet"
        ? "Aucune donnée pour l'instant — le cron n'a pas encore tourné."
        : `Erreur : ${error}`}
    </div>
  );

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            {["DATE", "LONG", "SHORT", "CH. LONG", "CH. SHORT", "NET (L-S)"].map(c => (
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
            const net = row.long - row.short;
            const netC = netColor(net);
            const chLongC = changeColor(row.chLong);
            const chShortC = changeColor(-row.chShort);
            const dateFormatted = row.date
              ? new Date(row.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
              : "—";

            return (
              <tr key={i} style={{ background: i % 2 === 0 ? "#161616" : "#1d1d1d" }}>
                <td style={{ padding: "8px 14px", color: "#ccc", border: "1px solid #2a2a2a", whiteSpace: "nowrap" }}>
                  {dateFormatted}
                </td>
                <td style={{ padding: "8px 14px", textAlign: "right", color: "#90EE90", border: "1px solid #2a2a2a", fontFamily: "monospace" }}>
                  {formatNum(row.long)}
                </td>
                <td style={{ padding: "8px 14px", textAlign: "right", color: "#FF8A80", border: "1px solid #2a2a2a", fontFamily: "monospace" }}>
                  {formatNum(row.short)}
                </td>
                <td style={{ padding: "8px 14px", textAlign: "right", background: chLongC.bg, color: chLongC.text, border: "1px solid #111", fontFamily: "monospace", fontWeight: 600 }}>
                  {row.chLong >= 0 ? "+" : ""}{formatNum(row.chLong)}
                </td>
                <td style={{ padding: "8px 14px", textAlign: "right", background: chShortC.bg, color: chShortC.text, border: "1px solid #111", fontFamily: "monospace", fontWeight: 600 }}>
                  {row.chShort >= 0 ? "+" : ""}{formatNum(row.chShort)}
                </td>
                <td style={{ padding: "8px 14px", textAlign: "right", background: netC.bg, color: netC.text, border: "1px solid #111", fontFamily: "monospace", fontWeight: 700, fontSize: 14 }}>
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
            Non-Commercial Positions · CFTC · Mise à jour chaque samedi 8h
          </div>
        </div>
        <div style={{ fontSize: 11, color: "#666", background: "#1a1a1a", border: "1px solid #333", padding: "6px 12px", borderRadius: 6 }}>
          Publication CFTC : chaque vendredi ~15h30 EST
        </div>
      </div>

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

      <div style={{ border: "1px solid #2a2a2a", borderTop: "none", background: "#111" }}>
        <div style={{
          padding: "14px 20px", borderBottom: "1px solid #2a2a2a",
          display: "flex", alignItems: "center", gap: 16, background: "#141414"
        }}>
          <div style={{ background: "#E8A820", color: "#111", padding: "4px 14px", borderRadius: 4, fontWeight: 700, fontSize: 16 }}>
            {INSTRUMENTS[active].label}
          </div>
          <div style={{ color: "#888", fontSize: 12 }}>
            Positions Non-Commerciales · Accumulées depuis mars 2026
          </div>
        </div>
        <InstrumentTable instrument={INSTRUMENTS[active]} />
      </div>

      <div style={{ padding: "16px 20px", display: "flex", gap: 20, flexWrap: "wrap", fontSize: 11, color: "#666", marginTop: 8 }}>
        <span style={{ color: "#1B5E20" }}>■</span> Net &gt; 50k
        <span style={{ color: "#4CAF50" }}>■</span> Net 10k→50k
        <span style={{ color: "#A5D6A7" }}>■</span> Net 0→10k
        <span style={{ color: "#FFCDD2" }}>■</span> Net 0→-10k
        <span style={{ color: "#E53935" }}>■</span> Net -10k→-50k
        <span style={{ color: "#7B0000" }}>■</span> Net &lt; -50k
        <span style={{ marginLeft: "auto" }}>Source : CFTC COT Report</span>
      </div>
    </div>
  );
}
