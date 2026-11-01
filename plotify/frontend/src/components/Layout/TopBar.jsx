import { useLocation, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

const Ico = ({ d, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <path d={d} />
  </svg>
);

const PAGES = {
  "/dashboard":     { title: "Dashboard",           sub: "Overview" },
  "/properties":    { title: "My Properties",        sub: "Properties" },
  "/register-land": { title: "Register Land",         sub: "Properties" },
  "/transfers":     { title: "Transfer Requests",     sub: "Transfers" },
  "/history":       { title: "Ownership History",     sub: "Records" },
  "/documents":     { title: "Documents",             sub: "Documents" },
  "/verify":        { title: "Public Verification",   sub: "" },
  "/insights":      { title: "Insights & Analytics",  sub: "Analytics" },
  "/users":         { title: "User Management",       sub: "Admin" },
};

/* ── Sample notifications (real app would fetch these) ──────────────────── */
const SAMPLE_NOTIFS = [
  { id:1, type:"success", icon:"M20 6 9 17l-5-5", color:"#16A34A", bg:"#F0FDF4",
    title:"Transfer approved", body:"Andheri West Plot · Ownership transferred", time:"2m ago", read:false },
  { id:2, type:"info",    icon:"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", color:"#287A68", bg:"#E9EFE7",
    title:"Blockchain confirmed", body:"PLT-0001 anchored · Block #18,432,101", time:"8m ago", read:false },
  { id:3, type:"warning", icon:"M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01", color:"#D97706", bg:"#FFFBEB",
    title:"Pending transfer", body:"BKC Office Space awaiting review", time:"1h ago", read:true },
];

export default function TopBar() {
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [search,    setSearch]    = useState("");
  const [showMenu,  setShowMenu]  = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [notifs,    setNotifs]    = useState(SAMPLE_NOTIFS);

  let page = PAGES[pathname];
  if (!page && pathname.startsWith("/properties/")) {
    page = { title: "Property Details", sub: "Properties" };
  }
  if (pathname === "/dashboard" && user?.role === "admin") {
    page = { title: "Dashboard", sub: "Registry Overview" };
  }

  const initials  = (user?.username || "U").slice(0, 2).toUpperCase();
  const roleLabel = user?.role === "admin"
    ? "Administrator"
    : user?.role === "officer" ? "Land Officer" : "Citizen";

  const unread = notifs.filter(n => !n.read).length;

  const handleSearch = (e) => {
    if (e.key === "Enter" && search.trim()) {
      navigate(`/properties?search=${encodeURIComponent(search.trim())}`);
      setSearch("");
    }
  };

  const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, read: true })));

  return (
    <header className="topbar">
      {/* Left — page context */}
      <div>
        {page?.sub && (
          <div className="topbar-breadcrumb">
            <span>Plotify</span>
            {page.sub && <><span className="sep">›</span><span>{page.sub}</span></>}
          </div>
        )}
        <div className="topbar-title">{page?.title || "Plotify"}</div>
      </div>

      {/* Right */}
      <div className="topbar-right">

        {/* Global search */}
        <label className="topbar-search" aria-label="Search properties">
          <Ico d="m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z" size={14} />
          <input
            type="search"
            placeholder="Search properties…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={handleSearch}
          />
        </label>

        {/* ── Notifications ────────────────────────────────────── */}
        <div style={{ position: "relative" }}>
          <button
            className="notif-btn"
            onClick={() => { setShowNotif(v => !v); setShowMenu(false); }}
            aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
          >
            <Ico d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0" size={16} />
            {unread > 0 && (
              <span className="notif-badge">{unread}</span>
            )}
          </button>

          {showNotif && (
            <>
              <div style={{ position:"fixed", inset:0, zIndex:990 }}
                onClick={() => setShowNotif(false)} />
              <div className="notif-panel">
                {/* Header */}
                <div style={{ padding:"14px 16px", borderBottom:"1px solid var(--border-light)",
                  display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div style={{ fontFamily:"Manrope,sans-serif", fontWeight:700, fontSize:14, color:"var(--text-primary)" }}>
                    Notifications
                    {unread > 0 && (
                      <span style={{ marginLeft:8, fontSize:11, fontWeight:600,
                        background:"#FEE2E2", color:"#991B1B",
                        padding:"1px 7px", borderRadius:10 }}>{unread} new</span>
                    )}
                  </div>
                  {unread > 0 && (
                    <button onClick={markAllRead} style={{ fontSize:12, color:"var(--green)",
                      background:"none", border:"none", cursor:"pointer", fontWeight:500 }}>
                      Mark all read
                    </button>
                  )}
                </div>

                {/* Items */}
                {notifs.map(n => (
                  <div key={n.id} className={`notif-item${n.read ? "" : " unread"}`}
                    onClick={() => setNotifs(prev => prev.map(x => x.id===n.id ? {...x,read:true} : x))}>
                    <div className="notif-icon" style={{ background: n.bg, color: n.color }}>
                      <Ico d={n.icon} size={15} />
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight: n.read ? 400 : 600,
                        color:"var(--text-primary)", marginBottom:2 }}>{n.title}</div>
                      <div style={{ fontSize:12, color:"var(--text-muted)",
                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{n.body}</div>
                      <div style={{ fontSize:11, color:"var(--text-subtle)", marginTop:3 }}>{n.time}</div>
                    </div>
                    {!n.read && (
                      <div style={{ width:7, height:7, borderRadius:"50%",
                        background:"var(--green)", flexShrink:0, marginTop:4 }} />
                    )}
                  </div>
                ))}

                {/* Footer */}
                <div style={{ padding:"10px 16px", borderTop:"1px solid var(--border-light)",
                  textAlign:"center" }}>
                  <Link to="/transfers" onClick={() => setShowNotif(false)}
                    style={{ fontSize:13, color:"var(--green)", fontWeight:500, textDecoration:"none" }}>
                    View all activity →
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── User chip + dropdown ─────────────────────────────── */}
        <div
          className="user-chip"
          onClick={() => { setShowMenu(v => !v); setShowNotif(false); }}
          role="button" tabIndex={0}
          onKeyDown={e => e.key === "Enter" && setShowMenu(v => !v)}
          aria-haspopup="true" aria-expanded={showMenu}
          style={{ position: "relative" }}
        >
          <div className="user-chip-avatar">{initials}</div>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)", lineHeight:1.2 }}>
              {user?.username}
            </div>
            <div style={{ fontSize:10, color:"var(--text-muted)" }}>{roleLabel}</div>
          </div>
          <Ico d="m6 9 6 6 6-6" size={12} />

          {showMenu && (
            <>
              <div style={{ position:"fixed", inset:0, zIndex:990 }}
                onClick={() => setShowMenu(false)} />
              <div style={{
                position:"absolute", top:"calc(100% + 6px)", right:0,
                background:"white", border:"1px solid var(--border-light)",
                borderRadius:10, boxShadow:"0 8px 24px rgba(0,0,0,0.1)",
                minWidth:200, zIndex:1000, overflow:"hidden",
                animation:"fadeUp 0.15s ease",
              }}>
                {/* Header */}
                <div style={{ padding:"14px 16px", borderBottom:"1px solid var(--border-light)",
                  background:"var(--ivory)" }}>
                  <div style={{ fontSize:14, fontWeight:600, color:"var(--text-primary)" }}>
                    {user?.username}
                  </div>
                  <div style={{ fontSize:12, color:"var(--text-muted)", marginTop:1 }}>
                    {roleLabel}
                  </div>
                </div>

                {[
                  ["/dashboard",      "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10", "Dashboard"],
                  ["/properties",     "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z",  "My Properties"],
                  ["/register-land",  "M12 5v14 M5 12h14",                                              "Register Land"],
                ].map(([to, d, label]) => (
                  <Link key={to} to={to} onClick={() => setShowMenu(false)} style={{
                    display:"flex", alignItems:"center", gap:10,
                    padding:"10px 16px", fontSize:13, color:"var(--text-secondary)",
                    textDecoration:"none", transition:"background 0.1s",
                  }}
                    onMouseOver={e => e.currentTarget.style.background="var(--ivory)"}
                    onMouseOut={e  => e.currentTarget.style.background="transparent"}>
                    <Ico d={d} size={14} />
                    {label}
                  </Link>
                ))}

                <div style={{ borderTop:"1px solid var(--border-light)" }} />
                <button onClick={() => { signOut(); navigate("/"); }} style={{
                  display:"flex", alignItems:"center", gap:10, width:"100%",
                  padding:"10px 16px", fontSize:13, color:"#DC2626",
                  background:"none", border:"none", cursor:"pointer",
                  transition:"background 0.1s", textAlign:"left",
                }}
                  onMouseOver={e => e.currentTarget.style.background="#FEF2F2"}
                  onMouseOut={e  => e.currentTarget.style.background="transparent"}>
                  <Ico d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9" size={14} />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
