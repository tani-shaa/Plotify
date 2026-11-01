import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Ico = ({ d, size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true" style={{ flexShrink: 0, display: "block" }}>
    <path d={d} />
  </svg>
);

const ic = {
  grid:     "M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z",
  home:     "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
  plus:     "M12 5v14 M5 12h14",
  transfer: "M7 16V4m0 0L3 8m4-4 4 4 M17 8v12m0 0 4-4m-4 4-4-4",
  history:  "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8 M3 3v5h5 M12 7v5l4 2",
  file:     "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6",
  chart:    "M18 20V10 M12 20V4 M6 20v-6",
  search:   "m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z",
  users:    "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
  logout:   "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
  location: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z",
  verify:   "M9 12 11 14 15 10 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
};

const CITIZEN_LINKS = [
  { to: "/dashboard",     icon: ic.grid,     label: "Dashboard" },
  { to: "/properties",    icon: ic.home,     label: "My Properties" },
  { to: "/register-land", icon: ic.plus,     label: "Register Land" },
  { to: "/transfers",     icon: ic.transfer, label: "Transfers" },
  { to: "/history",       icon: ic.history,  label: "Ownership History" },
  { to: "/documents",     icon: ic.file,     label: "Documents" },
];

const ADMIN_LINKS = [
  { to: "/dashboard",  icon: ic.grid,     label: "Dashboard" },
  { to: "/properties", icon: ic.home,     label: "Properties" },
  { to: "/transfers",  icon: ic.transfer, label: "Transfers" },
  { to: "/users",      icon: ic.users,    label: "Users" },
  { to: "/insights",   icon: ic.chart,    label: "Insights" },
  { to: "/documents",  icon: ic.file,     label: "Documents" },
];

const PUBLIC_LINKS = [
  { to: "/verify", icon: ic.verify, label: "Verify Land" },
];

function NavItem({ to, icon, label }) {
  return (
    <NavLink to={to} end={to === "/dashboard"}
      className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
    >
      <span className="nav-icon"><Ico d={icon} size={15} /></span>
      {label}
    </NavLink>
  );
}

export default function Sidebar() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate  = useNavigate();
  const links     = isAdmin ? ADMIN_LINKS : CITIZEN_LINKS;
  const initials  = (user?.username || "U").slice(0, 2).toUpperCase();
  const roleLabel = isAdmin
    ? "Administrator"
    : user?.role === "officer" ? "Land Officer" : "Citizen";

  return (
    <nav className="sidebar">

      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Ico d={ic.location} size={17} />
        </div>
        <div>
          <div className="sidebar-logo-wordmark">Plotify</div>
          <div className="sidebar-logo-sub">Land Registry</div>
        </div>
      </div>

      {/* Primary nav */}
      <div className="sidebar-nav">
        <div className="sidebar-section">Main</div>
        {links.map(l => <NavItem key={l.to} {...l} />)}

        <div className="sidebar-section" style={{ marginTop: 12 }}>Public</div>
        {PUBLIC_LINKS.map(l => <NavItem key={l.to} {...l} />)}
      </div>

      {/* User footer */}
      <div className="sidebar-footer">
        <div className="sidebar-avatar">{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 500, color: "white",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {user?.username}
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>
            {roleLabel}
          </div>
        </div>
        <button
          onClick={() => { signOut(); navigate("/"); }}
          title="Sign out"
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "rgba(255,255,255,0.35)", padding: 4, display: "flex",
            flexShrink: 0, transition: "color 0.12s", borderRadius: 4,
          }}
          onMouseOver={e => e.currentTarget.style.color = "white"}
          onMouseOut={e  => e.currentTarget.style.color = "rgba(255,255,255,0.35)"}
          aria-label="Sign out"
        >
          <Ico d={ic.logout} size={15} />
        </button>
      </div>
    </nav>
  );
}
