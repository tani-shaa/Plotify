import { useEffect, useState } from "react";
import { getStats, getAnomalies } from "../services/api";
import { useAuth } from "../context/AuthContext";

const Ico = ({ d, size = 16, stroke = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={stroke} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink:0, display:"block" }}>
    <path d={d} />
  </svg>
);
const ic = {
  home:     "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  chart:    "M18 20V10 M12 20V4 M6 20v-6",
  check:    "M22 11.08V12a10 10 0 1 1-5.93-9.14",
  file:     "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z",
  alert:    "M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01",
  users:    "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M23 21v-2a4 4 0 0 0-3-3.87",
  transfer: "M7 16V4m0 0L3 8m4-4 4 4 M17 8v12m0 0 4-4m-4 4-4-4",
  brain:    "M12 2a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5z M12 12v10 M8 16H4m16 0h-4",
  shield:   "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  info:     "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 16v-4 M12 8h.01",
};

/* ─── Animated bar ───────────────────────────────────────────────────────── */
function ProgressBar({ pct, color, delay = 0 }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(pct), 300 + delay); return () => clearTimeout(t); }, [pct, delay]);
  return (
    <div style={{ height:8, background:"#F3F4F6", borderRadius:4, overflow:"hidden" }}>
      <div style={{ height:"100%", width:`${w}%`, background:color, borderRadius:4, transition:"width 0.9s ease" }} />
    </div>
  );
}

/* ─── Anomaly score bar ───────────────────────────────────────────────────── */
function ScoreBar({ score }) {
  // score is negative (more negative = more anomalous), range roughly -1 to 0
  const pct = Math.min(Math.round(Math.abs(score) * 100), 100);
  const color = pct > 70 ? "#EF4444" : pct > 40 ? "#F59E0B" : "#287A68";
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(pct), 200); return () => clearTimeout(t); }, [pct]);
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <div style={{ flex:1, height:6, background:"#F3F4F6", borderRadius:3, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${w}%`, background:color, borderRadius:3, transition:"width 0.8s ease" }} />
      </div>
      <span style={{ fontSize:11, fontFamily:"monospace", color, fontWeight:700, minWidth:36, textAlign:"right" }}>{score}</span>
    </div>
  );
}

/* ─── Stat card ──────────────────────────────────────────────────────────── */
function StatCard({ label, value, icon, bg, color }) {
  return (
    <div style={{ background:"white", border:"1px solid #EAEDEA", borderRadius:14, padding:"22px 24px", boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:14 }}>
        <div style={{ width:44, height:44, borderRadius:11, background:bg, display:"flex", alignItems:"center", justifyContent:"center", color }}>
          <Ico d={icon} size={20} />
        </div>
      </div>
      <div style={{ fontFamily:"Manrope,sans-serif", fontSize:30, fontWeight:800, color:"#111827", lineHeight:1, marginBottom:6 }}>{value ?? "—"}</div>
      <div style={{ fontSize:13, color:"#6B7280" }}>{label}</div>
    </div>
  );
}

export default function Insights() {
  const { isAdmin } = useAuth();
  const [stats,     setStats]     = useState(null);
  const [anomalies, setAnomalies] = useState(null);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    const calls = [getStats()];
    if (isAdmin) calls.push(getAnomalies());
    Promise.all(calls)
      .then(([sRes, aRes]) => { setStats(sRes.data); if (aRes) setAnomalies(aRes.data); })
      .finally(() => setLoading(false));
  }, [isAdmin]);

  if (loading) return (
    <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", minHeight:400 }}>
      <div style={{ width:36, height:36, border:"3px solid #E9EFE7", borderTopColor:"#173F35", borderRadius:"50%", animation:"spin 0.7s linear infinite" }} />
    </div>
  );

  const total    = stats?.total_transfers    ?? 0;
  const approved = stats?.approved_transfers ?? 0;
  const pending  = stats?.pending_transfers  ?? 0;
  const rejected = Math.max(0, total - approved - pending);

  return (
    <div className="page-content">
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .fade-in { animation: fadeIn 0.5s ease forwards; }
      `}</style>

      <div className="page-header" style={{ marginBottom:24 }}>
        <h1 style={{ fontFamily:"Manrope,sans-serif", fontSize:22, fontWeight:800 }}>Insights & Analytics</h1>
        <p style={{ fontSize:14, color:"#6B7280", marginTop:3 }}>Platform statistics and ML-powered anomaly detection.</p>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
        <StatCard label="Total Properties"   value={stats?.total_properties}  icon={ic.home}     bg="rgba(23,63,53,0.08)"  color="#173F35" />
        <StatCard label="Total Transfers"    value={total}                    icon={ic.transfer} bg="rgba(245,158,11,0.1)" color="#D97706" />
        <StatCard label="Approved Transfers" value={approved}                 icon={ic.check}    bg="rgba(40,122,104,0.1)" color="#287A68" />
        <StatCard label="Total Documents"    value={stats?.total_documents}   icon={ic.file}     bg="rgba(37,99,235,0.08)" color="#2563EB" />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>

        {/* Transfer breakdown */}
        <div style={{ background:"white", border:"1px solid #EAEDEA", borderRadius:14, boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
          <div style={{ padding:"18px 22px", borderBottom:"1px solid #EAEDEA" }}>
            <div style={{ fontFamily:"Manrope,sans-serif", fontWeight:700, fontSize:15 }}>Transfer Status Breakdown</div>
            <div style={{ fontSize:12, color:"#9CA3AF", marginTop:2 }}>Cumulative transfer outcomes</div>
          </div>
          <div style={{ padding:"22px" }}>
            {total === 0 ? (
              <p style={{ fontSize:13, color:"#9CA3AF" }}>No transfers recorded yet.</p>
            ) : (
              [["Approved", approved, "#287A68", 0], ["Pending", pending, "#F59E0B", 100], ["Rejected", rejected, "#EF4444", 200]].map(([label, count, color, delay]) => {
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={label} style={{ marginBottom:20 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{ width:8, height:8, borderRadius:"50%", background:color }} />
                        <span style={{ fontSize:14, fontWeight:500, color:"#374151" }}>{label}</span>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <span style={{ fontFamily:"Manrope,sans-serif", fontWeight:700, fontSize:14 }}>{count}</span>
                        <span style={{ fontSize:12, color:"#9CA3AF" }}>{pct}%</span>
                      </div>
                    </div>
                    <ProgressBar pct={pct} color={color} delay={delay} />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Summary numbers */}
        <div style={{ background:"white", border:"1px solid #EAEDEA", borderRadius:14, boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
          <div style={{ padding:"18px 22px", borderBottom:"1px solid #EAEDEA" }}>
            <div style={{ fontFamily:"Manrope,sans-serif", fontWeight:700, fontSize:15 }}>Platform Summary</div>
            <div style={{ fontSize:12, color:"#9CA3AF", marginTop:2 }}>Key registry metrics</div>
          </div>
          <div>
            {[
              [ic.users,    "#287A68", "Registered Users",   stats?.total_users],
              [ic.home,     "#173F35", "Active Properties",  stats?.active_properties],
              [ic.transfer, "#D97706", "Pending Transfers",  pending],
              [ic.file,     "#2563EB", "Documents Uploaded", stats?.total_documents],
            ].map(([ico, col, label, val]) => (
              <div key={label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 22px", borderBottom:"1px solid #F3F4F6" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:32, height:32, borderRadius:8, background:`${col}12`, display:"flex", alignItems:"center", justifyContent:"center", color:col }}>
                    <Ico d={ico} size={14} />
                  </div>
                  <span style={{ fontSize:13, color:"#4B5563" }}>{label}</span>
                </div>
                <span style={{ fontFamily:"Manrope,sans-serif", fontWeight:700, fontSize:16, color:"#111827" }}>
                  {val ?? "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── ML Anomaly Detection (admin only) ──────────────────────────── */}
      {isAdmin && (
        <div style={{ background:"white", border:"1px solid #EAEDEA", borderRadius:14, overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
          {/* Header */}
          <div style={{ padding:"18px 22px", borderBottom:"1px solid #EAEDEA", background:"linear-gradient(135deg,#173F35 0%,#1E5445 100%)" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:40, height:40, borderRadius:10, background:"rgba(255,255,255,0.1)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Ico d={ic.brain} size={20} stroke="white" />
                </div>
                <div>
                  <div style={{ fontFamily:"Manrope,sans-serif", fontWeight:700, fontSize:16, color:"white" }}>
                    ML Anomaly Detection
                  </div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.55)", marginTop:1 }}>
                    Scikit-learn Isolation Forest · Admin only
                  </div>
                </div>
              </div>
              <span style={{ padding:"5px 12px", borderRadius:20, fontSize:11, fontWeight:700, background:"rgba(255,255,255,0.15)", color:"white", letterSpacing:"0.05em" }}>
                LIVE
              </span>
            </div>
          </div>

          {/* How it works */}
          <div style={{ padding:"16px 22px", background:"#F8F7F2", borderBottom:"1px solid #EAEDEA", display:"flex", gap:24, flexWrap:"wrap" }}>
            {[
              ["Transfer Count", "How many times a property has been transferred"],
              ["Days Since Reg.", "Age of the property since registration"],
              ["Avg. Interval",   "Average days between consecutive transfers"],
            ].map(([k, v]) => (
              <div key={k} style={{ minWidth:160 }}>
                <div style={{ fontSize:11, fontWeight:700, color:"#287A68", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:2 }}>{k}</div>
                <div style={{ fontSize:12, color:"#6B7280" }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Results */}
          <div style={{ padding:"20px 22px" }}>
            {!anomalies ? (
              <div style={{ color:"#9CA3AF", fontSize:13 }}>Loading anomaly analysis…</div>
            ) : anomalies.message ? (
              <div style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"16px", background:"#F8F7F2", borderRadius:10, border:"1px solid #EAEDEA" }}>
                <Ico d={ic.info} size={18} stroke="#8DA99B" />
                <div>
                  <div style={{ fontSize:14, fontWeight:600, marginBottom:3 }}>Not enough data</div>
                  <div style={{ fontSize:13, color:"#6B7280" }}>{anomalies.message}</div>
                  <div style={{ fontSize:12, color:"#9CA3AF", marginTop:6 }}>Register at least 5 properties to enable Isolation Forest analysis.</div>
                </div>
              </div>
            ) : anomalies.anomalies?.length === 0 ? (
              <div style={{ textAlign:"center", padding:"32px 24px" }}>
                <div style={{ width:56, height:56, background:"#DCFCE7", borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px", color:"#16A34A" }}>
                  <Ico d={ic.shield} size={26} />
                </div>
                <div style={{ fontFamily:"Manrope,sans-serif", fontWeight:700, fontSize:16, marginBottom:6 }}>No Anomalies Detected</div>
                <div style={{ fontSize:13, color:"#6B7280", maxWidth:360, margin:"0 auto" }}>
                  The Isolation Forest model found no unusual transfer patterns across all {stats?.total_properties} registered properties.
                </div>
              </div>
            ) : (
              <>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16, padding:"12px 16px", background:"#FEF3C7", borderRadius:9, border:"1px solid #FDE68A" }}>
                  <Ico d={ic.alert} size={18} stroke="#D97706" />
                  <span style={{ fontSize:13, fontWeight:600, color:"#92400E" }}>
                    {anomalies.anomalies.length} propert{anomalies.anomalies.length === 1 ? "y" : "ies"} flagged with unusual transfer patterns.
                  </span>
                </div>
                <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead>
                      <tr style={{ background:"#F8F7F2" }}>
                        {["Property","Location","Transfers","Days Since Reg.","Avg. Interval","Anomaly Score"].map(h => (
                          <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em", color:"#9CA3AF", borderBottom:"1px solid #EAEDEA" }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {anomalies.anomalies.map((a, i) => (
                        <tr key={a.property_id} style={{ borderBottom:"1px solid #F3F4F6", animation:`fadeIn 0.4s ease ${i*0.1}s both` }}>
                          <td style={{ padding:"13px 14px", fontWeight:500 }}>{a.property_title || `Property #${a.property_id}`}</td>
                          <td style={{ padding:"13px 14px", color:"#6B7280", fontSize:13 }}>{a.property_location || "—"}</td>
                          <td style={{ padding:"13px 14px", fontFamily:"Manrope,sans-serif", fontWeight:700 }}>{a.transfer_count}</td>
                          <td style={{ padding:"13px 14px", color:"#6B7280", fontSize:13 }}>{a.days_since_reg?.toFixed(0)}d</td>
                          <td style={{ padding:"13px 14px", color:"#6B7280", fontSize:13 }}>{a.avg_days_between?.toFixed(1)}d</td>
                          <td style={{ padding:"13px 14px", minWidth:160 }}>
                            <ScoreBar score={a.anomaly_score} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
