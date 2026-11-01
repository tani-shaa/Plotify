import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getStats, getAnomalies, getProperties, getTransfers, getChainStatus
} from "../services/api";
import { useAuth } from "../context/AuthContext";

/* ─── Icons ──────────────────────────────────────────────────────────────── */
const I = ({ d, size = 16, s = "currentColor", sw = 1.8, fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke={s} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink:0, display:"block" }}>
    <path d={d}/>
  </svg>
);
const ic = {
  home:     "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
  check:    "M20 6 9 17l-5-5",
  clock:    "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 6v6l4 2",
  file:     "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6",
  plus:     "M12 5v14 M5 12h14",
  transfer: "M7 16V4m0 0L3 8m4-4 4 4 M17 8v12m0 0 4-4m-4 4-4-4",
  arrow:    "M5 12h14 M12 5l7 7-7 7",
  shield:   "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  alert:    "M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01",
  copy:     "M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-2 M10 2h4a2 2 0 0 1 2 2v2H8V4a2 2 0 0 1 2-2z",
  eye:      "M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  search:   "m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z",
  brain:    "M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.44-4.66z M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.44-4.66z",
  hash:     "M4 9h16 M4 15h16 M10 3 8 21 M16 3l-2 18",
  users:    "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M23 21v-2a4 4 0 0 0-3-3.87",
  x:        "M18 6 6 18 M6 6l12 12",
  chevR:    "m9 18 6-6-6-6",
  link:     "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71 M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
  map:      "M9 20l-5.447-2.724A1 1 0 0 1 3 16.382V5.618a1 1 0 0 1 1.447-.894L9 7m0 13V7m0 13 6-3m-6-10 6-3m0 0 5.447 2.724A1 1 0 0 1 21 7.618v10.764a1 1 0 0 1-1.447.894L15 17m0-13v13",
  activity: "M22 12h-4l-3 9L9 3l-3 9H2",
  cpu:      "M9 2v2H7a2 2 0 0 0-2 2v2H2v2h3v2H2v2h3v2a2 2 0 0 0 2 2h2v2h2v-2h2v2h2v-2h2a2 2 0 0 0 2-2v-2h3v-2h-3v-2h3V9h-3V7a2 2 0 0 0-2-2h-2V2H9z M9 9h6v6H9z",
};

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const fmtDate  = d => d ? new Date(d).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}) : "—";
const fmtShort = d => d ? new Date(d).toLocaleDateString("en-IN",{day:"2-digit",month:"short"}) : "—";
const fmtTime  = d => d ? new Date(d).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}) : "—";

/* ─── Skeleton ───────────────────────────────────────────────────────────── */
const Sk = ({ w="100%", h=14, r=6, mb=0 }) => (
  <div style={{ width:w, height:h, borderRadius:r, marginBottom:mb,
    background:"linear-gradient(90deg,#E9EFE7 25%,#F3F5F1 50%,#E9EFE7 75%)",
    backgroundSize:"200% 100%", animation:"skPulse 1.4s ease infinite" }}/>
);

/* ─── Copy button ────────────────────────────────────────────────────────── */
function CopyBtn({ text, small }) {
  const [ok, setOk] = useState(false);
  if (!text) return null;
  const copy = async e => {
    e.stopPropagation();
    await navigator.clipboard.writeText(text);
    setOk(true); setTimeout(() => setOk(false), 1600);
  };
  return (
    <button onClick={copy} title={ok ? "Copied!" : "Copy"} style={{
      background:"none", border:"none", cursor:"pointer",
      color: ok ? "#287A68" : "#9CA3AF", padding:2, display:"flex",
      transition:"color 0.15s"
    }}>
      <I d={ok ? ic.check : ic.copy} size={small ? 11 : 13} />
    </button>
  );
}

/* ─── Status badge ────────────────────────────────────────────────────────── */
function Badge({ status }) {
  const MAP = {
    active:           ["#DCFCE7","#166534","Active"],
    pending_transfer: ["#FEF3C7","#92400E","Pending Transfer"],
    pending:          ["#FEF3C7","#92400E","Pending"],
    approved:         ["#DCFCE7","#166534","Approved"],
    rejected:         ["#FEE2E2","#991B1B","Rejected"],
  };
  const [bg, color, label] = MAP[status] || ["#F3F4F6","#6B7280", status];
  return <span style={{ padding:"3px 9px", borderRadius:4, fontSize:11, fontWeight:500, background:bg, color, whiteSpace:"nowrap" }}>{label}</span>;
}

/* ─── Chain status pill ──────────────────────────────────────────────────── */
function ChainPill({ chain }) {
  if (!chain) return null;
  const on = chain.connected;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 14px",
      background: on ? "#F0FDF4" : "#F8F7F2",
      border:`1px solid ${on ? "#BBF7D0" : "#E2E8E4"}`,
      borderRadius:8, fontSize:12, flexWrap:"wrap" }}>
      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
        <div style={{ width:7, height:7, borderRadius:"50%",
          background: on ? "#22C55E" : "#9CA3AF",
          boxShadow: on ? "0 0 5px rgba(34,197,94,0.5)" : "none",
          animation: on ? "pulse 2s infinite" : "none" }}/>
        <span style={{ fontWeight:600, color: on ? "#166534" : "#6B7280" }}>
          {on ? "Blockchain Online" : "Blockchain Offline"}
        </span>
      </div>
      {on && <>
        <span style={{ color:"#6B7280" }}>·</span>
        <span style={{ color:"#374151" }}>
          {chain.network_id === 31337 ? "Hardhat Local" : `Chain ${chain.network_id}`}
        </span>
        <span style={{ color:"#6B7280" }}>·</span>
        <span style={{ fontFamily:"monospace", color:"#374151" }}>
          Block #{chain.block_number?.toLocaleString()}
        </span>
        <span style={{ color:"#6B7280" }}>·</span>
        <span style={{ fontFamily:"monospace", fontSize:11, color:"#287A68",
          display:"flex", alignItems:"center", gap:4 }}>
          {chain.contract_address?.slice(0,8)}…{chain.contract_address?.slice(-5)}
          <CopyBtn text={chain.contract_address} small />
        </span>
      </>}
      {!on && chain.error && (
        <span style={{ color:"#9CA3AF", fontStyle:"italic" }}>({chain.error})</span>
      )}
    </div>
  );
}

/* ─── Stat card (clickable) ──────────────────────────────────────────────── */
function StatCard({ label, value, icon, accent, sub, onClick }) {
  const [hov, setHov] = useState(false);
  const loading = value == null;
  return (
    <div onClick={onClick} onMouseOver={() => setHov(true)} onMouseOut={() => setHov(false)}
      style={{ background:"white", border:`1.5px solid ${hov && onClick ? accent+"55" : "#EAEDEA"}`,
        borderRadius:10, padding:"18px 20px", cursor: onClick ? "pointer" : "default",
        boxShadow: hov && onClick ? `0 4px 16px ${accent}15` : "0 1px 3px rgba(0,0,0,0.04)",
        transition:"all 0.15s", display:"flex", flexDirection:"column", gap:12 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ fontSize:11, fontWeight:600, color:"#6B7280",
          textTransform:"uppercase", letterSpacing:"0.06em" }}>{label}</div>
        <div style={{ width:32, height:32, borderRadius:8, background:accent+"15",
          display:"flex", alignItems:"center", justifyContent:"center", color:accent }}>
          <I d={icon} size={15} s={accent}/>
        </div>
      </div>
      {loading ? <Sk w="55%" h={30}/> :
        <div style={{ fontFamily:"Space Grotesk,Manrope,sans-serif", fontSize:32, fontWeight:700,
          color:"#111827", lineHeight:1, letterSpacing:"-0.02em", fontVariantNumeric:"tabular-nums" }}>
          {value}
        </div>}
      {sub && <div style={{ fontSize:11, color:"#9CA3AF" }}>{sub}</div>}
    </div>
  );
}

/* ─── Application tracker ────────────────────────────────────────────────── */
function AppTracker({ transfer }) {
  if (!transfer) return null;
  const steps = ["Submitted","Under Review","Verified","Approved","On-Chain"];
  const idx = { pending:1, approved:4, rejected:1 }[transfer.status] ?? 0;
  return (
    <div>
      <div style={{ display:"flex", alignItems:"flex-start" }}>
        {steps.map((s, i) => {
          const done   = i < idx;
          const active = i === idx;
          const last   = i === steps.length - 1;
          return (
            <div key={s} style={{ display:"flex", alignItems:"flex-start",
              flex: last ? 0 : 1, minWidth: last ? "auto" : 0 }}>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
                <div style={{ width:26, height:26, borderRadius:"50%", border:"2px solid",
                  borderColor: done||active ? (done?"#287A68":"#173F35") : "#E2E8E4",
                  background:  done ? "#287A68" : active ? "#173F35" : "white",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:10, fontWeight:700,
                  color: done||active ? "white" : "#9CA3AF",
                  boxShadow: active ? "0 0 0 3px rgba(23,63,53,0.12)" : "none",
                  flexShrink:0, zIndex:1, transition:"all 0.2s" }}>
                  {done ? <I d={ic.check} size={12} s="white"/> : i+1}
                </div>
                <span style={{ fontSize:9, fontWeight:500, textAlign:"center",
                  color: done ? "#287A68" : active ? "#173F35" : "#9CA3AF",
                  whiteSpace:"nowrap" }}>{s}</span>
              </div>
              {!last && (
                <div style={{ flex:1, height:2, marginTop:12, marginLeft:4, marginRight:4,
                  background: done ? "#287A68" : "#E2E8E4",
                  transition:"background 0.3s" }}/>
              )}
            </div>
          );
        })}
      </div>
      {transfer.status === "rejected" && (
        <div style={{ marginTop:12, padding:"9px 13px", background:"#FEF2F2",
          border:"1px solid #FECACA", borderRadius:7,
          fontSize:12, color:"#B91C1C", display:"flex", alignItems:"center", gap:8 }}>
          <I d={ic.alert} size={13} s="#B91C1C"/>
          Transfer rejected — {transfer.note || "see transfer details for reason."}
        </div>
      )}
    </div>
  );
}

/* ─── Blockchain explorer strip ─────────────────────────────────────────── */
function BlockchainExplorer({ props, transfers }) {
  const [selected, setSelected] = useState(null);
  const items = [
    ...props.filter(p => p.tx_hash).slice(0, 4).map(p => ({
      id: `PLT-${String(p.id).padStart(4,"0")}`, type:"Registration",
      hash: p.tx_hash, title: p.title, detail: `${p.area?.toLocaleString("en-IN")} m² · ${p.location}`,
      date: p.registered_at, color:"#173F35",
    })),
    ...transfers.filter(t => t.tx_hash).slice(0, 4).map(t => ({
      id: `TRF-${String(t.id).padStart(4,"0")}`, type:"Transfer",
      hash: t.tx_hash, title: t.property_title,
      detail: `${t.from_username} → ${t.to_username}`,
      date: t.resolved_at, color:"#D97706",
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);

  if (items.length === 0) return (
    <div style={{ padding:"32px 20px", textAlign:"center" }}>
      <div style={{ width:48, height:48, background:"#E9EFE7", borderRadius:10,
        display:"flex", alignItems:"center", justifyContent:"center",
        margin:"0 auto 12px", color:"#8DA99B" }}>
        <I d={ic.hash} size={22}/>
      </div>
      <div style={{ fontWeight:600, fontSize:14, marginBottom:4 }}>No blockchain records yet</div>
      <div style={{ fontSize:13, color:"#9CA3AF" }}>Records appear here once anchored on-chain.</div>
    </div>
  );

  return (
    <div>
      {/* Block chain visual */}
      <div style={{ padding:"16px 20px", overflowX:"auto" }}>
        <div style={{ display:"flex", alignItems:"center", gap:0, minWidth:"fit-content" }}>
          {items.map((item, i) => (
            <div key={item.id} style={{ display:"flex", alignItems:"center" }}>
              {/* Block card */}
              <div onClick={() => setSelected(selected?.id===item.id ? null : item)}
                style={{ width:130, padding:"12px 14px", borderRadius:9,
                  border:`1.5px solid ${selected?.id===item.id ? item.color : "#E2E8E4"}`,
                  background: selected?.id===item.id ? item.color+"08" : "white",
                  cursor:"pointer", transition:"all 0.15s",
                  boxShadow: selected?.id===item.id ? `0 3px 12px ${item.color}20` : "0 1px 3px rgba(0,0,0,0.04)" }}
                onMouseOver={e => { if(selected?.id!==item.id) e.currentTarget.style.borderColor=item.color+"88"; }}
                onMouseOut={e  => { if(selected?.id!==item.id) e.currentTarget.style.borderColor="#E2E8E4"; }}>
                {/* Block header */}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                  <span style={{ fontSize:9, fontWeight:700, color:item.color,
                    textTransform:"uppercase", letterSpacing:"0.06em" }}>{item.type}</span>
                  <div style={{ width:6, height:6, borderRadius:"50%", background:item.color }}/>
                </div>
                <div style={{ fontFamily:"monospace", fontSize:10, color:"#374151",
                  marginBottom:6, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {item.id}
                </div>
                <div style={{ fontSize:11, fontWeight:600, color:"#111827", marginBottom:4,
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.title}</div>
                <div style={{ fontFamily:"monospace", fontSize:9, color:"#9CA3AF",
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {item.hash?.slice(0,12)}…
                </div>
              </div>
              {/* Connector arrow */}
              {i < items.length - 1 && (
                <div style={{ display:"flex", alignItems:"center", gap:0,
                  padding:"0 6px", color:"#8DA99B", fontSize:10, flexShrink:0 }}>
                  <svg width="28" height="12" viewBox="0 0 28 12">
                    <line x1="0" y1="6" x2="20" y2="6" stroke="#C9D0CD" strokeWidth="1.5" strokeDasharray="3,3"/>
                    <path d="M18 2 24 6 18 10" stroke="#C9D0CD" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Selected block detail */}
      {selected && (
        <div style={{ margin:"0 16px 16px", padding:"16px 18px",
          background:"linear-gradient(135deg,#F8F7F2,white)",
          border:`1px solid ${selected.color}30`, borderRadius:9 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:10, fontWeight:700, color:selected.color,
                textTransform:"uppercase", letterSpacing:"0.06em",
                background:selected.color+"12", padding:"2px 8px", borderRadius:4 }}>
                {selected.type}
              </span>
              <span style={{ fontFamily:"Manrope,sans-serif", fontWeight:700, fontSize:14 }}>
                {selected.title}
              </span>
            </div>
            <button onClick={() => setSelected(null)}
              style={{ background:"none", border:"none", cursor:"pointer", color:"#9CA3AF", padding:2 }}>
              <I d={ic.x} size={14}/>
            </button>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
            {[
              ["Transaction Hash", selected.hash, true],
              ["Details",          selected.detail, false],
              ["Date",             fmtDate(selected.date), false],
            ].map(([k,v,mono]) => (
              <div key={k}>
                <div style={{ fontSize:11, color:"#9CA3AF", fontWeight:500,
                  marginBottom:4, textTransform:"uppercase", letterSpacing:"0.05em" }}>{k}</div>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ fontSize:12, fontWeight:500, color:"#111827",
                    fontFamily: mono ? "monospace" : "inherit",
                    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{v}</span>
                  {mono && <CopyBtn text={v} small />}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop:12, padding:"8px 12px", background:selected.color+"0A",
            border:`1px solid ${selected.color}20`, borderRadius:6,
            display:"flex", alignItems:"center", gap:8 }}>
            <I d={ic.shield} size={13} s={selected.color}/>
            <span style={{ fontSize:12, color:"#6B7280" }}>
              This record is permanently anchored on the Ethereum blockchain and cannot be altered.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── ML Anomaly card ────────────────────────────────────────────────────── */
function AnomalyCard({ anomalies }) {
  const count = anomalies?.anomalies?.length ?? 0;
  const [exp, setExp] = useState(false);
  if (!anomalies) return null;
  return (
    <div style={{ border:`1px solid ${count>0?"#FDE68A":"#EAEDEA"}`,
      borderRadius:10, background: count>0 ? "#FFFBEB" : "white",
      overflow:"hidden" }}>
      <div style={{ padding:"14px 18px", display:"flex", alignItems:"center",
        justifyContent:"space-between", cursor:"pointer" }} onClick={() => setExp(!exp)}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:8,
            background: count>0 ? "#FEF3C7" : "#DCFCE7",
            border:`1px solid ${count>0?"#FDE68A":"#BBF7D0"}`,
            display:"flex", alignItems:"center", justifyContent:"center",
            color: count>0 ? "#D97706" : "#16A34A" }}>
            <I d={count>0 ? ic.alert : ic.shield} size={16}/>
          </div>
          <div>
            <div style={{ fontFamily:"Manrope,sans-serif", fontWeight:700, fontSize:13, color:"#111827" }}>
              ML Anomaly Detection
            </div>
            <div style={{ fontSize:11, color:"#9CA3AF", marginTop:1 }}>
              Isolation Forest · {count>0 ? `${count} propert${count===1?"y":"ies"} flagged` : "No anomalies detected"}
            </div>
          </div>
        </div>
        <I d={exp?"m18 15-6-6-6 6":"m6 9 6 6 6-6"} size={14} s="#9CA3AF"/>
      </div>
      {exp && (
        <div style={{ borderTop:`1px solid ${count>0?"#FDE68A":"#EAEDEA"}`,
          padding:"14px 18px" }}>
          {count === 0 ? (
            <p style={{ fontSize:13, color:"#6B7280" }}>
              The model found no unusual transfer patterns. Properties are behaving normally.
            </p>
          ) : (
            <>
              <p style={{ fontSize:12, color:"#6B7280", marginBottom:12 }}>
                These properties show unusual transfer frequency. Lower scores indicate stronger anomalies.
              </p>
              {anomalies.anomalies.slice(0,3).map(a => (
                <div key={a.property_id} style={{ display:"flex", alignItems:"center",
                  justifyContent:"space-between", padding:"10px 12px", marginBottom:8,
                  background:"white", borderRadius:7, border:"1px solid #FDE68A" }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:500 }}>
                      {a.property_title || `Property #${a.property_id}`}
                    </div>
                    <div style={{ fontSize:11, color:"#9CA3AF", marginTop:2 }}>
                      {a.transfer_count} transfers · {a.days_since_reg?.toFixed(0)} days since registration · avg {a.avg_days_between?.toFixed(1)} days between transfers
                    </div>
                  </div>
                  <div style={{ textAlign:"right", flexShrink:0, marginLeft:12 }}>
                    <div style={{ fontSize:10, color:"#9CA3AF", marginBottom:2 }}>Anomaly Score</div>
                    <div style={{ fontFamily:"monospace", fontSize:13, fontWeight:700,
                      color: a.anomaly_score < -0.5 ? "#DC2626" : "#D97706" }}>
                      {a.anomaly_score?.toFixed(3)}
                    </div>
                  </div>
                </div>
              ))}
              <Link to="/insights" style={{ fontSize:12, color:"#287A68",
                textDecoration:"none", fontWeight:600, display:"inline-flex",
                alignItems:"center", gap:4, marginTop:4 }}>
                Full analysis <I d={ic.arrow} size={11}/>
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats,      setStats]      = useState(null);
  const [anomalies,  setAnomalies]  = useState(null);
  const [props,      setProps]      = useState(null);
  const [transfers,  setTransfers]  = useState(null);
  const [chain,      setChain]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [propSearch, setPropSearch] = useState("");
  const [txFilter,   setTxFilter]   = useState("all");
  const [greeting,   setGreeting]   = useState("Good morning");

  useEffect(() => {
    const h = new Date().getHours();
    if (h >= 12 && h < 17) setGreeting("Good afternoon");
    else if (h >= 17)      setGreeting("Good evening");

    // Chain status separately — never blocks core data
    getChainStatus()
      .then(r => setChain(r.data))
      .catch(() => setChain({ connected:false, error:"Unavailable" }));

    const calls = [getStats(), getProperties(), getTransfers()];
    if (isAdmin) calls.push(getAnomalies());
    Promise.all(calls)
      .then(([sRes, pRes, tRes, aRes]) => {
        setStats(sRes.data);
        setProps(pRes.data);
        setTransfers(tRes.data);
        if (aRes) setAnomalies(aRes.data);
      })
      .catch(err => { console.error(err); setError("Could not load dashboard data."); })
      .finally(() => setLoading(false));
  }, [isAdmin]);

  const dateStr = new Date().toLocaleDateString("en-IN",
    { weekday:"long", day:"numeric", month:"long", year:"numeric" });

  const myProps     = props     ?? [];
  const myTransfers = transfers ?? [];
  const approved    = stats?.approved_transfers ?? 0;
  const pending     = stats?.pending_transfers  ?? 0;
  const rejected    = Math.max(0,(stats?.total_transfers??0)-approved-pending);
  const total       = stats?.total_transfers ?? 0;

  const filteredProps = myProps.filter(p =>
    p.title.toLowerCase().includes(propSearch.toLowerCase()) ||
    p.location.toLowerCase().includes(propSearch.toLowerCase())
  );
  const filteredTx = txFilter==="all" ? myTransfers
    : myTransfers.filter(t => t.status===txFilter);

  const onChainProps  = myProps.filter(p => p.tx_hash).length;
  const offChainProps = myProps.length - onChainProps;

  /* ── LOADING ─────────────────────────────────────────────────── */
  if (loading) return (
    <div className="page-content">
      <style>{`@keyframes skPulse{0%,100%{background-position:200% 0}50%{background-position:-200% 0}}`}</style>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
        <div><Sk w={140} h={12} mb={8}/><Sk w={220} h={24}/></div>
        <Sk w={150} h={40} r={8}/>
      </div>
      <Sk w="100%" h={44} r={8} mb={16}/>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:20 }}>
        {[...Array(4)].map((_,i) => (
          <div key={i} style={{ background:"white", border:"1px solid #EAEDEA",
            borderRadius:10, padding:20 }}>
            <Sk w="70%" h={11} mb={14}/><Sk w="45%" h={30} mb={8}/><Sk w="80%" h={10}/>
          </div>
        ))}
      </div>
      <div style={{ background:"white", border:"1px solid #EAEDEA", borderRadius:10,
        padding:20, marginBottom:16 }}>
        <Sk w={200} h={13} mb={16}/>
        {[...Array(5)].map((_,i) => (
          <div key={i} style={{ display:"flex", gap:12, padding:"11px 0",
            borderBottom:"1px solid #F3F4F6" }}>
            <Sk w={80} h={12}/><Sk w={180} h={12}/><Sk w={80} h={12}/>
            <Sk w={80} h={12}/><Sk w={80} h={20} r={4}/>
          </div>
        ))}
      </div>
    </div>
  );

  /* ── ERROR ────────────────────────────────────────────────────── */
  if (error) return (
    <div className="page-content" style={{ display:"flex", alignItems:"center",
      justifyContent:"center", minHeight:400 }}>
      <div style={{ textAlign:"center", maxWidth:360 }}>
        <div style={{ width:52, height:52, background:"#FEF2F2", borderRadius:12,
          display:"flex", alignItems:"center", justifyContent:"center",
          margin:"0 auto 14px", color:"#DC2626" }}>
          <I d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 8v4 M12 16h.01" size={24}/>
        </div>
        <h3 style={{ fontFamily:"Manrope,sans-serif", fontWeight:700, marginBottom:8 }}>
          Failed to load dashboard
        </h3>
        <p style={{ fontSize:13, color:"#6B7280", marginBottom:16 }}>{error}</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    </div>
  );

  /* ════════════════════════════════════════════════════════════════════ */
  return (
    <div className="page-content" style={{ paddingBottom:48 }}>
      <style>{`
        @keyframes skPulse   { 0%,100%{background-position:200% 0} 50%{background-position:-200% 0} }
        @keyframes fadeUp    { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse     { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(1.3)} }
        .dash-row { animation: fadeUp 0.4s ease both; }
      `}</style>

      {/* ── WELCOME ─────────────────────────────────────────────── */}
      <div className="dash-row" style={{ display:"flex", alignItems:"flex-start",
        justifyContent:"space-between", marginBottom:16,
        flexWrap:"wrap", gap:12, animationDelay:"0s" }}>
        <div>
          <div style={{ fontSize:12, color:"#9CA3AF", marginBottom:3 }}>{dateStr}</div>
          <h1 style={{ fontFamily:"'Space Grotesk',Manrope,sans-serif", fontSize:22, fontWeight:700,
            color:"#111827", letterSpacing:"-0.02em",
            display:"flex", alignItems:"center", gap:10 }}>
            {greeting}, {user?.username}
            {isAdmin && <span style={{ fontSize:11, fontWeight:600, background:"#E9EFE7",
              color:"#173F35", padding:"2px 9px", borderRadius:20 }}>Admin</span>}
          </h1>
          <p style={{ fontSize:13, color:"#6B7280", marginTop:3 }}>
            Your land registry overview — {myProps.length} propert{myProps.length!==1?"ies":"y"} registered,
            {" "}{onChainProps} on-chain.
          </p>
        </div>
        <Link to="/register-land" style={{
          display:"inline-flex", alignItems:"center", gap:8,
          padding:"10px 20px", background:"#173F35", color:"white",
          borderRadius:8, fontSize:13, fontWeight:600, textDecoration:"none",
          boxShadow:"0 2px 8px rgba(23,63,53,0.25)", transition:"all 0.15s",
          flexShrink:0 }}
          onMouseOver={e => e.currentTarget.style.background="#287A68"}
          onMouseOut={e  => e.currentTarget.style.background="#173F35"}>
          <I d={ic.plus} size={14}/> Register Land
        </Link>
      </div>

      {/* ── CHAIN STATUS ────────────────────────────────────────── */}
      <div className="dash-row" style={{ marginBottom:16, animationDelay:"0.04s" }}>
        <ChainPill chain={chain}/>
      </div>

      {/* ── STAT CARDS ──────────────────────────────────────────── */}
      <div className="dash-row" style={{ display:"grid",
        gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:16,
        animationDelay:"0.08s" }}>
        <StatCard label="Total Properties"   value={stats?.total_properties}
          icon={ic.home}     accent="#173F35" sub="All registered plots"
          onClick={() => navigate("/properties")}/>
        <StatCard label="On-Chain Records"   value={onChainProps}
          icon={ic.shield}   accent="#287A68" sub="Blockchain anchored"
          onClick={() => navigate("/properties")}/>
        <StatCard label="Pending Transfers"  value={stats?.pending_transfers}
          icon={ic.clock}    accent="#D97706" sub="Awaiting admin review"
          onClick={() => navigate("/transfers")}/>
        <StatCard label="Total Documents"    value={stats?.total_documents}
          icon={ic.file}     accent="#2563EB" sub="SHA-256 hashed"
          onClick={() => navigate("/documents")}/>
      </div>

      {/* ── APPLICATION TRACKER ─────────────────────────────────── */}
      {myTransfers.length > 0 && (
        <div className="dash-row" style={{ marginBottom:16, animationDelay:"0.11s" }}>
          <div style={{ background:"white", border:"1px solid #EAEDEA",
            borderRadius:10, padding:"16px 20px",
            boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ display:"flex", alignItems:"center",
              justifyContent:"space-between", marginBottom:16 }}>
              <div>
                <div style={{ fontFamily:"Manrope,sans-serif", fontWeight:700,
                  fontSize:14, color:"#111827" }}>Application Tracker</div>
                <div style={{ fontSize:12, color:"#9CA3AF", marginTop:1 }}>
                  Most recent: {myTransfers[0]?.property_title}
                </div>
              </div>
              <Link to="/transfers" style={{ fontSize:12, fontWeight:500,
                color:"#287A68", textDecoration:"none",
                display:"flex", alignItems:"center", gap:4 }}>
                All <I d={ic.chevR} size={13}/>
              </Link>
            </div>
            <AppTracker transfer={myTransfers[0]}/>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT GRID ───────────────────────────────────── */}
      <div className="dash-row" style={{ display:"grid",
        gridTemplateColumns:"1fr 340px", gap:16, marginBottom:16,
        animationDelay:"0.14s" }}>

        {/* LEFT — Property Portfolio */}
        <div style={{ background:"white", border:"1px solid #EAEDEA",
          borderRadius:10, overflow:"hidden",
          boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
          {/* Header */}
          <div style={{ padding:"14px 20px", borderBottom:"1px solid #EAEDEA",
            display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div>
              <div style={{ fontFamily:"Manrope,sans-serif", fontWeight:700,
                fontSize:14, color:"#111827" }}>My Property Portfolio</div>
              <div style={{ fontSize:12, color:"#9CA3AF", marginTop:1 }}>
                {filteredProps.length} of {myProps.length} shown
              </div>
            </div>
            <Link to="/properties" style={{ fontSize:12, fontWeight:500,
              color:"#287A68", textDecoration:"none",
              display:"flex", alignItems:"center", gap:4 }}>
              Manage all <I d={ic.chevR} size={13}/>
            </Link>
          </div>
          {/* Search */}
          <div style={{ padding:"10px 16px", borderBottom:"1px solid #F3F4F6" }}>
            <div style={{ position:"relative" }}>
              <I d={ic.search} size={13} style={{ position:"absolute", left:10, top:"50%",
                transform:"translateY(-50%)", color:"#9CA3AF" }}/>
              <input className="form-input" style={{ paddingLeft:32, fontSize:13, height:36 }}
                placeholder="Search by title or location…"
                value={propSearch} onChange={e => setPropSearch(e.target.value)}/>
            </div>
          </div>
          {/* Table */}
          {myProps.length === 0 ? (
            <div style={{ padding:"40px 24px", textAlign:"center" }}>
              <div style={{ width:48, height:48, background:"#E9EFE7", borderRadius:10,
                display:"flex", alignItems:"center", justifyContent:"center",
                margin:"0 auto 12px", color:"#8DA99B" }}>
                <I d={ic.home} size={22}/>
              </div>
              <div style={{ fontWeight:600, fontSize:14, marginBottom:5 }}>No properties yet</div>
              <p style={{ fontSize:13, color:"#9CA3AF", marginBottom:14 }}>
                Register your first land parcel to get started.
              </p>
              <Link to="/register-land" className="btn btn-primary btn-sm">
                <I d={ic.plus} size={13}/> Register Land
              </Link>
            </div>
          ) : filteredProps.length === 0 ? (
            <div style={{ padding:"32px", textAlign:"center",
              fontSize:13, color:"#9CA3AF" }}>
              No properties match "{propSearch}"
            </div>
          ) : (
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ background:"#F8F7F2" }}>
                    {["Land ID","Property","Area","Registered","Status","Chain"].map(h => (
                      <th key={h} style={{ padding:"9px 14px", textAlign:"left", fontSize:10,
                        fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em",
                        color:"#9CA3AF", borderBottom:"1px solid #EAEDEA", whiteSpace:"nowrap" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredProps.slice(0,8).map(p => (
                    <tr key={p.id} onClick={() => navigate(`/properties/${p.id}`)}
                      style={{ borderBottom:"1px solid #F3F4F6", cursor:"pointer",
                        transition:"background 0.1s" }}
                      onMouseOver={e => e.currentTarget.style.background="#F8F7F2"}
                      onMouseOut={e  => e.currentTarget.style.background="transparent"}>
                      <td style={{ padding:"10px 14px", fontFamily:"monospace",
                        fontSize:11, color:"#9CA3AF" }}>
                        PLT-{String(p.id).padStart(4,"0")}
                      </td>
                      <td style={{ padding:"10px 14px" }}>
                        <div style={{ fontWeight:500, fontSize:13, color:"#111827" }}>{p.title}</div>
                        <div style={{ fontSize:11, color:"#9CA3AF", marginTop:1 }}>{p.location}</div>
                      </td>
                      <td style={{ padding:"10px 14px", fontSize:12, color:"#6B7280",
                        whiteSpace:"nowrap" }}>
                        {p.area?.toLocaleString("en-IN")} m²
                      </td>
                      <td style={{ padding:"10px 14px", fontSize:11, color:"#9CA3AF",
                        whiteSpace:"nowrap" }}>
                        {fmtDate(p.registered_at)}
                      </td>
                      <td style={{ padding:"10px 14px" }}><Badge status={p.status}/></td>
                      <td style={{ padding:"10px 14px" }}>
                        {p.tx_hash ? (
                          <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                            <div style={{ width:6, height:6, borderRadius:"50%",
                              background:"#22C55E", flexShrink:0 }}/>
                            <span style={{ fontFamily:"monospace", fontSize:10, color:"#287A68" }}>
                              {p.tx_hash.slice(0,8)}…
                            </span>
                            <CopyBtn text={p.tx_hash} small/>
                          </div>
                        ) : (
                          <span style={{ fontSize:11, color:"#9CA3AF", fontStyle:"italic" }}>
                            Off-chain
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

          {/* Transfer breakdown donut */}
          <div style={{ background:"white", border:"1px solid #EAEDEA",
            borderRadius:10, padding:"16px 18px",
            boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ fontFamily:"Manrope,sans-serif", fontWeight:700,
              fontSize:13, marginBottom:2 }}>Transfer Status</div>
            <div style={{ fontSize:11, color:"#9CA3AF", marginBottom:14 }}>
              All-time breakdown
            </div>
            {total === 0 ? (
              <p style={{ fontSize:12, color:"#9CA3AF" }}>No transfers recorded yet.</p>
            ) : (
              <>
                {[["Approved",approved,"#287A68"],["Pending",pending,"#F59E0B"],["Rejected",rejected,"#EF4444"]].map(([l,v,c]) => {
                  const pct = total > 0 ? Math.round((v/total)*100) : 0;
                  return (
                    <div key={l} style={{ marginBottom:12 }}>
                      <div style={{ display:"flex", justifyContent:"space-between",
                        marginBottom:5, fontSize:12 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                          <div style={{ width:8, height:8, borderRadius:"50%",
                            background:c, flexShrink:0 }}/>
                          <span style={{ fontWeight:500, color:"#374151" }}>{l}</span>
                        </div>
                        <span style={{ fontFamily:"Manrope,sans-serif", fontWeight:700 }}>
                          {v} <span style={{ fontWeight:400, color:"#9CA3AF" }}>({pct}%)</span>
                        </span>
                      </div>
                      <div style={{ height:5, background:"#F3F4F6", borderRadius:3 }}>
                        <div style={{ height:"100%", width:`${pct}%`, background:c,
                          borderRadius:3, transition:"width 0.8s ease" }}/>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Quick actions */}
          <div style={{ background:"white", border:"1px solid #EAEDEA",
            borderRadius:10, overflow:"hidden",
            boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ padding:"12px 18px", borderBottom:"1px solid #EAEDEA",
              fontFamily:"Manrope,sans-serif", fontWeight:700, fontSize:13 }}>
              Quick Actions
            </div>
            <div style={{ padding:"10px 12px", display:"grid",
              gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {[
                ["/register-land", ic.plus,     "#173F35", "Register Land",  "New parcel"],
                ["/transfers",     ic.transfer,  "#D97706", "Transfer",       "Request change"],
                ["/documents",     ic.file,      "#2563EB", "Documents",      "Upload & verify"],
                ["/verify",        ic.search,    "#287A68", "Verify",         "Public search"],
              ].map(([to, d, color, label, sub]) => (
                <Link key={to} to={to} style={{ textDecoration:"none" }}>
                  <div style={{ padding:"13px 14px", background:"white",
                    border:"1px solid #EAEDEA", borderRadius:9,
                    cursor:"pointer", transition:"all 0.15s" }}
                    onMouseOver={e => { e.currentTarget.style.borderColor=color;
                      e.currentTarget.style.transform="translateY(-1px)"; }}
                    onMouseOut={e  => { e.currentTarget.style.borderColor="#EAEDEA";
                      e.currentTarget.style.transform="translateY(0)"; }}>
                    <div style={{ width:34, height:34, borderRadius:8, background:color+"15",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      color:color, marginBottom:8 }}>
                      <I d={d} size={16} s={color}/>
                    </div>
                    <div style={{ fontFamily:"Manrope,sans-serif", fontWeight:600,
                      fontSize:12, color:"#111827", marginBottom:2 }}>{label}</div>
                    <div style={{ fontSize:11, color:"#9CA3AF" }}>{sub}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* ML Anomaly (admin only) */}
          {isAdmin && <AnomalyCard anomalies={anomalies}/>}
        </div>
      </div>

      {/* ── TRANSFER TABLE ──────────────────────────────────────── */}
      <div className="dash-row" style={{ marginBottom:16, animationDelay:"0.18s" }}>
        <div style={{ background:"white", border:"1px solid #EAEDEA",
          borderRadius:10, overflow:"hidden",
          boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
          {/* Header + filters */}
          <div style={{ padding:"14px 20px", borderBottom:"1px solid #EAEDEA",
            display:"flex", alignItems:"center", justifyContent:"space-between",
            flexWrap:"wrap", gap:10 }}>
            <div>
              <div style={{ fontFamily:"Manrope,sans-serif", fontWeight:700,
                fontSize:14, color:"#111827" }}>Ownership Transfers</div>
              <div style={{ fontSize:12, color:"#9CA3AF", marginTop:1 }}>
                {filteredTx.length} record{filteredTx.length!==1?"s":""}
              </div>
            </div>
            <div style={{ display:"flex", gap:6 }}>
              {["all","pending","approved","rejected"].map(f => (
                <button key={f} onClick={() => setTxFilter(f)} style={{
                  padding:"4px 12px", borderRadius:20, fontSize:12, fontWeight:500,
                  cursor:"pointer", transition:"all 0.12s", border:"1.5px solid",
                  borderColor: txFilter===f ? "#173F35" : "#E2E8E4",
                  background:  txFilter===f ? "#173F35" : "white",
                  color:       txFilter===f ? "white"   : "#6B7280" }}>
                  {f.charAt(0).toUpperCase()+f.slice(1)}
                </button>
              ))}
            </div>
          </div>
          {myTransfers.length === 0 ? (
            <div style={{ padding:"40px 24px", textAlign:"center" }}>
              <div style={{ width:48, height:48, background:"#E9EFE7", borderRadius:10,
                display:"flex", alignItems:"center", justifyContent:"center",
                margin:"0 auto 12px", color:"#8DA99B" }}>
                <I d={ic.transfer} size={22}/>
              </div>
              <div style={{ fontWeight:600, fontSize:14, marginBottom:5 }}>No transfers yet</div>
              <p style={{ fontSize:13, color:"#9CA3AF" }}>
                Ownership transfers will appear here when initiated.
              </p>
            </div>
          ) : filteredTx.length === 0 ? (
            <div style={{ padding:"28px", textAlign:"center",
              fontSize:13, color:"#9CA3AF" }}>
              No {txFilter} transfers found.
            </div>
          ) : (
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ background:"#F8F7F2" }}>
                    {["Ref","Property","Parties","Requested","Status","Blockchain Tx"].map(h => (
                      <th key={h} style={{ padding:"9px 14px", textAlign:"left", fontSize:10,
                        fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em",
                        color:"#9CA3AF", borderBottom:"1px solid #EAEDEA", whiteSpace:"nowrap" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredTx.slice(0,8).map(t => (
                    <tr key={t.id} style={{ borderBottom:"1px solid #F3F4F6",
                      transition:"background 0.1s" }}
                      onMouseOver={e => e.currentTarget.style.background="#F8F7F2"}
                      onMouseOut={e  => e.currentTarget.style.background="transparent"}>
                      <td style={{ padding:"10px 14px", fontFamily:"monospace",
                        fontSize:11, color:"#9CA3AF" }}>
                        TRF-{String(t.id).padStart(4,"0")}
                      </td>
                      <td style={{ padding:"10px 14px", fontWeight:500, fontSize:13 }}>
                        {t.property_title}
                      </td>
                      <td style={{ padding:"10px 14px" }}>
                        <div style={{ fontSize:12, color:"#6B7280" }}>{t.from_username}</div>
                        <div style={{ fontSize:10, color:"#9CA3AF" }}>→ {t.to_username}</div>
                      </td>
                      <td style={{ padding:"10px 14px", fontSize:11, color:"#9CA3AF",
                        whiteSpace:"nowrap" }}>
                        {fmtDate(t.requested_at)}
                      </td>
                      <td style={{ padding:"10px 14px" }}><Badge status={t.status}/></td>
                      <td style={{ padding:"10px 14px" }}>
                        {t.tx_hash ? (
                          <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                            <div style={{ width:6, height:6, borderRadius:"50%",
                              background:"#22C55E", flexShrink:0 }}/>
                            <span style={{ fontFamily:"monospace", fontSize:10, color:"#287A68" }}>
                              {t.tx_hash.slice(0,10)}…
                            </span>
                            <CopyBtn text={t.tx_hash} small/>
                          </div>
                        ) : t.status === "rejected" ? (
                          <span style={{ fontSize:11, color:"#9CA3AF",
                            fontStyle:"italic" }}>Rejected</span>
                        ) : (
                          <span style={{ fontSize:11, color:"#9CA3AF",
                            fontStyle:"italic" }}>Pending approval</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── BLOCKCHAIN EXPLORER ─────────────────────────────────── */}
      <div className="dash-row" style={{ animationDelay:"0.22s" }}>
        <div style={{ background:"white", border:"1px solid #EAEDEA",
          borderRadius:10, overflow:"hidden",
          boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ padding:"14px 20px", borderBottom:"1px solid #EAEDEA",
            display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div>
              <div style={{ fontFamily:"Manrope,sans-serif", fontWeight:700,
                fontSize:14, color:"#111827",
                display:"flex", alignItems:"center", gap:8 }}>
                <I d={ic.hash} size={15} s="#287A68"/>
                Blockchain Explorer
              </div>
              <div style={{ fontSize:12, color:"#9CA3AF", marginTop:1 }}>
                Click any block to inspect the transaction · {onChainProps} on-chain records
              </div>
            </div>
            <Link to="/history" style={{ fontSize:12, fontWeight:500,
              color:"#287A68", textDecoration:"none",
              display:"flex", alignItems:"center", gap:4 }}>
              Full history <I d={ic.chevR} size={13}/>
            </Link>
          </div>
          <BlockchainExplorer props={myProps} transfers={myTransfers}/>
        </div>
      </div>

    </div>
  );
}
