import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Ico = ({ d, size = 18, stroke = "currentColor", sw = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0, display: "block" }}>
    <path d={d} />
  </svg>
);

/* ── Mini cadastral map — left panel ─────────────────────────────────────── */
function CadastralSVG() {
  return (
    <svg viewBox="0 0 400 280" style={{ width: "100%", maxWidth: 400, opacity: 0.9 }}>
      {/* Road fills */}
      <path d="M0 108 Q200 100 400 104" stroke="#0a1f18" strokeWidth="16" fill="none"/>
      <path d="M0 108 Q200 100 400 104" stroke="#0d2820" strokeWidth="11" fill="none"/>
      <path d="M0 108 Q200 100 400 104" stroke="rgba(255,255,255,0.05)" strokeWidth="1" fill="none" strokeDasharray="16,12"/>
      <path d="M0 204 Q200 196 400 200" stroke="#0a1f18" strokeWidth="16" fill="none"/>
      <path d="M0 204 Q200 196 400 200" stroke="#0d2820" strokeWidth="11" fill="none"/>
      <path d="M138 0 Q132 140 128 280" stroke="#0a1f18" strokeWidth="14" fill="none"/>
      <path d="M138 0 Q132 140 128 280" stroke="#0d2820" strokeWidth="10" fill="none"/>
      <path d="M282 0 Q278 140 274 280" stroke="#0a1f18" strokeWidth="12" fill="none"/>
      <path d="M282 0 Q278 140 274 280" stroke="#0d2820" strokeWidth="8" fill="none"/>

      {/* Parcel fills */}
      <polygon points="10,10 122,8 124,96 8,98" fill="#1a4a38" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8"/>
      <polygon points="8,116 124,114 126,192 6,194" fill="#1f5040" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8"/>
      <polygon points="6,212 126,210 128,272 4,274" fill="#193d30" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8"/>
      {/* Highlighted parcel — teal */}
      <polygon points="146,10 266,8 268,96 144,98" fill="#1e5a4a" stroke="#6FD5BF" strokeWidth="1.4"/>
      <polygon points="144,116 268,114 270,192 142,194" fill="#224538" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8"/>
      <polygon points="142,212 270,210 272,272 140,274" fill="#1b3a2e" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8"/>
      <polygon points="290,8 390,6 392,96 288,98" fill="#163628" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8"/>
      <polygon points="288,114 390,112 392,192 286,194" fill="#1f5040" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8"/>

      {/* Building footprints */}
      {[[16,18,60,46],[68,18,42,44],[16,126,58,48],[70,128,40,42],[152,16,72,56],[152,126,66,52],[296,16,66,52],[296,124,62,48]].map(([x,y,w,h],i)=>(
        <rect key={i} x={x} y={y} width={w} height={h} fill="rgba(0,0,0,0.4)" stroke="rgba(255,255,255,0.15)" strokeWidth="0.6" rx="1"/>
      ))}

      {/* Highlighted parcel label + pin */}
      <text x="207" y="56" textAnchor="middle" fill="#6FD5BF" fontSize="8" fontFamily="monospace" fontWeight="600" letterSpacing="0.8">PLT-0024</text>
      <circle cx="207" cy="72" r="4" fill="#6FD5BF"/>
      <circle cx="207" cy="72" r="4" fill="#6FD5BF">
        <animate attributeName="r" values="4;10;4" dur="2.5s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.8;0;0.8" dur="2.5s" repeatCount="indefinite"/>
      </circle>
      <circle cx="207" cy="72" r="2.5" fill="white"/>

      {/* Survey markers at intersections */}
      {[[133,104],[133,200],[277,104],[277,200]].map(([x,y],i)=>(
        <g key={i}>
          <circle cx={x} cy={y} r="4.5" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
          <circle cx={x} cy={y} r="1.8" fill="rgba(255,255,255,0.4)"/>
          <line x1={x-8} y1={y} x2={x+8} y2={y} stroke="rgba(255,255,255,0.2)" strokeWidth="0.7"/>
          <line x1={x} y1={y-8} x2={x} y2={y+8} stroke="rgba(255,255,255,0.2)" strokeWidth="0.7"/>
        </g>
      ))}
    </svg>
  );
}

const DEMO_ACCOUNTS = [
  { label: "Try as Admin",   username: "admin",        password: "admin123",  role: "admin",   color: "#173F35", badge: "Full access" },
  { label: "Try as Citizen", username: "arjun_sharma", password: "demo1234",  role: "citizen", color: "#287A68", badge: "12 properties" },
  { label: "Try as Citizen", username: "priya_mehta",  password: "demo1234",  role: "citizen", color: "#5a7a6e", badge: "8 properties" },
];

export default function Login() {
  const { signIn } = useAuth();
  const navigate   = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState("");
  const [busy,     setBusy]     = useState(false);
  const [demoIdx,  setDemoIdx]  = useState(null);

  const doLogin = async (u, p, idx = null) => {
    setError("");
    setBusy(true);
    if (idx !== null) setDemoIdx(idx);
    const result = await signIn(u, p);
    setBusy(false);
    setDemoIdx(null);
    if (result.ok) navigate("/dashboard");
    else setError(result.error || "Login failed.");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim() || !password) { setError("Please fill in both fields."); return; }
    doLogin(username.trim(), password);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex" }}>

      {/* ── LEFT: dark forest panel ────────────────────────────────────────── */}
      <div style={{
        width: "46%", minWidth: 380,
        background: "linear-gradient(160deg, #0F2B23 0%, #173F35 55%, #1E5445 100%)",
        display: "flex", flexDirection: "column",
        padding: "40px 48px", position: "relative", overflow: "hidden",
      }}>
        {/* Grid texture */}
        <div style={{ position:"absolute", inset:0, opacity:0.04,
          backgroundImage:"linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)",
          backgroundSize:"32px 32px" }}/>

        {/* Logo */}
        <div style={{ position:"relative", display:"flex", alignItems:"center", gap:10, marginBottom:"auto" }}>
          <div style={{ width:38, height:38, background:"#287A68", borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Ico d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" size={18} stroke="white"/>
          </div>
          <div>
            <div style={{ fontFamily:"Manrope,sans-serif", fontWeight:800, fontSize:20, color:"white", lineHeight:1.1 }}>Plotify</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.45)", letterSpacing:"0.04em" }}>Blockchain Land Registry</div>
          </div>
        </div>

        {/* Cadastral map */}
        <div style={{ position:"relative", flex:1, display:"flex", flexDirection:"column", justifyContent:"center", paddingTop:24 }}>
          <CadastralSVG />
          <div style={{ marginTop:28 }}>
            <h1 style={{ fontFamily:"Manrope,sans-serif", fontSize:"clamp(22px,3vw,32px)", fontWeight:800, color:"white", lineHeight:1.15, marginBottom:10, letterSpacing:"-0.02em" }}>
              Transparent land records,<br />on-chain.
            </h1>
            <p style={{ fontSize:13, color:"rgba(255,255,255,0.5)", lineHeight:1.75, maxWidth:300 }}>
              Every registration, transfer and document is anchored to the Ethereum blockchain — permanent and publicly verifiable.
            </p>
          </div>
        </div>

        {/* Feature pills */}
        <div style={{ position:"relative", display:"flex", gap:10, flexWrap:"wrap", paddingTop:24, borderTop:"1px solid rgba(255,255,255,0.1)", marginTop:24 }}>
          {[
            ["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", "Solidity Smart Contract"],
            ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6", "SHA-256 Documents"],
            ["M18 20V10 M12 20V4 M6 20v-6", "Isolation Forest ML"],
          ].map(([d, label]) => (
            <div key={label} style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 10px", background:"rgba(255,255,255,0.07)", borderRadius:6, border:"1px solid rgba(255,255,255,0.1)" }}>
              <Ico d={d} size={12} stroke="#6FD5BF" sw={2}/>
              <span style={{ fontSize:11, color:"rgba(255,255,255,0.7)", fontWeight:500 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT: form ────────────────────────────────────────────────────── */}
      <div style={{ flex:1, background:"#F8F7F2", display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 48px" }}>
        <div style={{ width:"100%", maxWidth:420 }}>

          {/* Heading */}
          <div style={{ marginBottom:28 }}>
            <h2 style={{ fontFamily:"Manrope,sans-serif", fontSize:26, fontWeight:800, marginBottom:5, letterSpacing:"-0.02em" }}>
              Sign in to Plotify
            </h2>
            <p style={{ fontSize:14, color:"#6B7280" }}>
              Don't have an account?{" "}
              <Link to="/register" style={{ color:"#287A68", fontWeight:600 }}>Create one</Link>
            </p>
          </div>

          {/* ── DEMO LOGIN BUTTONS ────────────────────────────────────────── */}
          <div style={{ marginBottom:24, padding:"18px 18px 14px", background:"white", borderRadius:10, border:"1.5px solid #E2E8E4" }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:12, display:"flex", alignItems:"center", gap:7 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              One-click demo access
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {DEMO_ACCOUNTS.map((acc, i) => (
                <button
                  key={i}
                  type="button"
                  disabled={busy}
                  onClick={() => doLogin(acc.username, acc.password, i)}
                  style={{
                    display:"flex", alignItems:"center", justifyContent:"space-between",
                    padding:"10px 14px", borderRadius:8, border:"1.5px solid #E2E8E4",
                    background: demoIdx === i ? acc.color : "white",
                    cursor:"pointer", transition:"all 0.15s",
                    opacity: busy && demoIdx !== i ? 0.5 : 1,
                  }}
                  onMouseOver={e => { if (!busy) { e.currentTarget.style.background = acc.color; e.currentTarget.style.borderColor = acc.color; e.currentTarget.querySelector(".demo-label").style.color="white"; e.currentTarget.querySelector(".demo-badge").style.color="rgba(255,255,255,0.7)"; }}}
                  onMouseOut={e  => { if (demoIdx !== i) { e.currentTarget.style.background = "white"; e.currentTarget.style.borderColor = "#E2E8E4"; e.currentTarget.querySelector(".demo-label").style.color="#111827"; e.currentTarget.querySelector(".demo-badge").style.color="#9CA3AF"; }}}
                >
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:28, height:28, borderRadius:7, background:acc.color, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <span style={{ fontSize:11, fontWeight:700, color:"white" }}>{acc.role === "admin" ? "A" : "C"}</span>
                    </div>
                    <div style={{ textAlign:"left" }}>
                      <div className="demo-label" style={{ fontSize:13, fontWeight:600, color: demoIdx===i ? "white" : "#111827", transition:"color 0.15s" }}>
                        {acc.label}
                      </div>
                      <div className="demo-badge" style={{ fontSize:11, color: demoIdx===i ? "rgba(255,255,255,0.7)" : "#9CA3AF", marginTop:1, transition:"color 0.15s" }}>
                        @{acc.username} · {acc.badge}
                      </div>
                    </div>
                  </div>
                  {demoIdx === i ? (
                    <div style={{ width:14, height:14, border:"2px solid rgba(255,255,255,0.35)", borderTopColor:"white", borderRadius:"50%", animation:"spin 0.6s linear infinite" }}/>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={demoIdx===i?"white":"#9CA3AF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14 M12 5l7 7-7 7"/></svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
            <div style={{ flex:1, height:1, background:"#E5E7EB" }}/>
            <span style={{ fontSize:12, color:"#9CA3AF" }}>or sign in manually</span>
            <div style={{ flex:1, height:1, background:"#E5E7EB" }}/>
          </div>

          {/* Error */}
          {error && (
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 14px", borderRadius:8, background:"#FEF2F2", border:"1px solid #FCA5A5", color:"#B91C1C", fontSize:13, marginBottom:18 }}>
              <Ico d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 8v4 M12 16h.01" size={16}/>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            <div style={{ marginBottom:16 }}>
              <label style={{ display:"block", fontSize:13, fontWeight:500, color:"#374151", marginBottom:6 }}>Username</label>
              <div style={{ position:"relative" }}>
                <div style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#9CA3AF", display:"flex" }}>
                  <Ico d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" size={15}/>
                </div>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                  autoComplete="username" placeholder="Enter your username"
                  style={{ width:"100%", padding:"11px 14px 11px 40px", border:"1.5px solid #DDE3DC", borderRadius:8, fontSize:14, fontFamily:"inherit", outline:"none", background:"white", color:"#111827", transition:"border-color 0.15s,box-shadow 0.15s" }}
                  onFocus={e=>{e.target.style.borderColor="#287A68";e.target.style.boxShadow="0 0 0 3px rgba(40,122,104,0.12)"}}
                  onBlur={e=>{e.target.style.borderColor="#DDE3DC";e.target.style.boxShadow="none"}}/>
              </div>
            </div>

            <div style={{ marginBottom:20 }}>
              <label style={{ display:"block", fontSize:13, fontWeight:500, color:"#374151", marginBottom:6 }}>Password</label>
              <div style={{ position:"relative" }}>
                <div style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#9CA3AF", display:"flex" }}>
                  <Ico d="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z M7 11V7a5 5 0 0 1 10 0v4" size={15}/>
                </div>
                <input type={showPw?"text":"password"} value={password} onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password" placeholder="Enter your password"
                  style={{ width:"100%", padding:"11px 44px 11px 40px", border:"1.5px solid #DDE3DC", borderRadius:8, fontSize:14, fontFamily:"inherit", outline:"none", background:"white", color:"#111827", transition:"border-color 0.15s,box-shadow 0.15s" }}
                  onFocus={e=>{e.target.style.borderColor="#287A68";e.target.style.boxShadow="0 0 0 3px rgba(40,122,104,0.12)"}}
                  onBlur={e=>{e.target.style.borderColor="#DDE3DC";e.target.style.boxShadow="none"}}/>
                <button type="button" onClick={()=>setShowPw(s=>!s)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#9CA3AF", padding:2, display:"flex" }}>
                  <Ico size={15} d={showPw?"M17.94 17.94A10 10 0 0 1 12 20c-7 0-11-8-11-8a18 18 0 0 1 5.06-5.94M9.9 4.24A9 9 0 0 1 12 4c7 0 11 8 11 8a18 18 0 0 1-2.16 3.19 M1 1l22 22":"M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"}/>
                </button>
              </div>
            </div>

            <button type="submit" disabled={busy} style={{ width:"100%", padding:"12px", background:busy?"#287A68cc":"#173F35", color:"white", border:"none", borderRadius:8, fontSize:14, fontWeight:600, fontFamily:"inherit", cursor:busy?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, transition:"background 0.15s" }}
              onMouseOver={e=>{if(!busy)e.currentTarget.style.background="#287A68"}}
              onMouseOut={e=>{if(!busy)e.currentTarget.style.background="#173F35"}}>
              {busy&&demoIdx===null ? <><div style={{ width:14,height:14,border:"2px solid rgba(255,255,255,0.35)",borderTopColor:"white",borderRadius:"50%",animation:"spin 0.6s linear infinite"}}/>Signing in…</> : "Sign In →"}
            </button>
          </form>

          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    </div>
  );
}
