import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getProperties } from "../services/api";
import { PageSkeleton } from "../components/UI/Skeleton";

const Ico = ({ d, size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>
    <path d={d} />
  </svg>
);
const ic = {
  search: "m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z",
  plus:   "M12 5v14 M5 12h14",
  eye:    "M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  x:      "M18 6 6 18 M6 6l12 12",
  copy:   "M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-2 M10 2h4a2 2 0 0 1 2 2v2H8V4a2 2 0 0 1 2-2z",
  filter: "M3 6h18 M7 12h10 M11 18h4",
  sort:   "M3 6l9-4 9 4 M12 2v12 M8 22l4-4 4 4",
};

const STATUS_STYLE = {
  active:           { bg:"#DCFCE7", color:"#166534", label:"Active" },
  pending_transfer: { bg:"#FEF3C7", color:"#92400E", label:"Pending Transfer" },
};
const ALL_STATUSES = ["all","active","pending_transfer"];

// Consistent Indian date format
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}) : "—";

function TxPill({ hash }) {
  const [copied, setCopied] = useState(false);
  if (!hash) return <span style={{ fontSize:11, color:"#D1D5DB", fontStyle:"italic" }}>Off-chain</span>;
  const copy = async (e) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(hash);
    setCopied(true); setTimeout(() => setCopied(false), 1800);
  };
  return (
    <span onClick={copy} title={copied ? "Copied!" : hash} style={{
      display:"inline-flex", alignItems:"center", gap:4,
      fontFamily:"monospace", fontSize:11, color:"#287A68",
      background:"#E9EFE7", padding:"3px 8px", borderRadius:4,
      cursor:"pointer", border:"1px solid #D1D9CF", transition:"background 0.12s",
    }}>
      {hash.slice(0,8)}… <Ico d={ic.copy} size={11} />
      {copied && <span style={{ color:"#16A34A", fontFamily:"sans-serif" }}>✓</span>}
    </span>
  );
}

export default function PropertySearch() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [search,     setSearch]     = useState("");
  const [statusFilter, setStatus]   = useState("all");
  const [sortBy,     setSortBy]     = useState("registered_at");
  const [sortDir,    setSortDir]    = useState("desc");
  const [page,       setPage]       = useState(1);
  const [loading,    setLoading]    = useState(true);
  const PER_PAGE = 8;

  const fetchProperties = useCallback(async (q = "") => {
    setLoading(true);
    try {
      const { data } = await getProperties(q ? { search: q } : {});
      setProperties(data);
      setPage(1);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  const handleSearch = (e) => { e.preventDefault(); fetchProperties(search); };

  // Client-side filter + sort
  const filtered = properties
    .filter(p => statusFilter === "all" || p.status === statusFilter)
    .sort((a, b) => {
      const va = a[sortBy] ?? ""; const vb = b[sortBy] ?? "";
      return sortDir === "asc" ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("asc"); }
  };

  if (loading) return <PageSkeleton />;

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ fontFamily:"Manrope,sans-serif", fontSize:22, fontWeight:800, marginBottom:3 }}>My Properties</h1>
          <p style={{ fontSize:13, color:"#9CA3AF" }}>{filtered.length} propert{filtered.length !== 1 ? "ies" : "y"} found</p>
        </div>
        <Link to="/register-land" className="btn btn-primary">
          <Ico d={ic.plus} size={14} /> Register Land
        </Link>
      </div>

      {/* Search + filters */}
      <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
        <form onSubmit={handleSearch} style={{ display:"flex", gap:8, flex:1, minWidth:260 }}>
          <div style={{ position:"relative", flex:1 }}>
            <Ico d={ic.search} size={14} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#9CA3AF" }} />
            <input type="search" className="form-input" style={{ paddingLeft:38 }}
              placeholder="Search by title or location…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary btn-sm">Search</button>
          {search && <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setSearch(""); fetchProperties(); }}><Ico d={ic.x} size={13} /></button>}
        </form>

        {/* Status filter chips */}
        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
          {ALL_STATUSES.map(s => (
            <button key={s} onClick={() => { setStatus(s); setPage(1); }} style={{
              padding:"6px 14px", borderRadius:20, border:"1.5px solid",
              fontSize:12, fontWeight:500, cursor:"pointer", transition:"all 0.12s",
              borderColor: statusFilter === s ? "#173F35" : "#DDE3DC",
              background:  statusFilter === s ? "#173F35" : "white",
              color:       statusFilter === s ? "white"   : "#6B7280",
            }}>
              {s === "all" ? "All" : s === "active" ? "Active" : "Pending Transfer"}
            </button>
          ))}
        </div>
      </div>

      {/* Summary chips */}
      <div style={{ display:"flex", gap:10, marginBottom:16 }}>
        {[
          ["All",              properties.length,                          "#173F35"],
          ["Active",           properties.filter(p=>p.status==="active").length, "#16A34A"],
          ["Pending Transfer", properties.filter(p=>p.status==="pending_transfer").length, "#D97706"],
          ["On-chain",         properties.filter(p=>p.tx_hash).length,    "#2563EB"],
        ].map(([l, n, c]) => (
          <div key={l} style={{ padding:"6px 14px", background:"white", border:"1px solid #EAEDEA", borderRadius:8, fontSize:12 }}>
            <span style={{ color:"#9CA3AF" }}>{l}: </span>
            <span style={{ fontWeight:700, color:c }}>{n}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background:"white", border:"1px solid #EAEDEA", borderRadius:14, overflow:"hidden" }}>
        {paginated.length === 0 ? (
          <div style={{ padding:"48px 24px", textAlign:"center" }}>
            <div style={{ width:52, height:52, background:"#E9EFE7", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px", color:"#8DA99B" }}>
              <Ico d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" size={24} />
            </div>
            <p style={{ fontWeight:600, fontSize:14, marginBottom:4 }}>No properties found</p>
            <p style={{ fontSize:13, color:"#9CA3AF", marginBottom:16 }}>
              {search ? `No results for "${search}".` : "You haven't registered any properties yet."}
            </p>
            <Link to="/register-land" className="btn btn-primary btn-sm">Register your first property</Link>
          </div>
        ) : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ background:"#F8F7F2" }}>
                  {[["Land ID","id"],["Title","title"],["Location","location"],["Area","area"],["Owner","owner_username"],["Status","status"],["Registered","registered_at"],["Blockchain Tx",null]].map(([h, col]) => (
                    <th key={h} onClick={col ? () => toggleSort(col) : undefined} style={{
                      padding:"10px 16px", textAlign:"left", fontSize:11, fontWeight:600,
                      textTransform:"uppercase", letterSpacing:"0.05em", color:"#9CA3AF",
                      borderBottom:"1px solid #EAEDEA", whiteSpace:"nowrap",
                      cursor: col ? "pointer" : "default",
                      userSelect:"none",
                    }}>
                      {h} {col && sortBy === col && (sortDir === "asc" ? "↑" : "↓")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map(p => {
                  const st = STATUS_STYLE[p.status] || { bg:"#F3F4F6", color:"#6B7280", label:p.status };
                  return (
                    <tr key={p.id}
                      onClick={() => navigate(`/properties/${p.id}`)}
                      style={{ borderBottom:"1px solid #F3F4F6", cursor:"pointer", transition:"background 0.1s" }}
                      onMouseOver={e => e.currentTarget.style.background="#F8F7F2"}
                      onMouseOut={e  => e.currentTarget.style.background="transparent"}
                    >
                      <td style={{ padding:"13px 16px", fontFamily:"monospace", fontSize:11, color:"#9CA3AF" }}>PLT-{String(p.id).padStart(4,"0")}</td>
                      <td style={{ padding:"13px 16px", fontWeight:600, fontSize:13, color:"#111827" }}>{p.title}</td>
                      <td style={{ padding:"13px 16px", fontSize:13, color:"#6B7280" }}>{p.location}</td>
                      <td style={{ padding:"13px 16px", fontSize:13 }}>{p.area?.toLocaleString("en-IN")} m²</td>
                      <td style={{ padding:"13px 16px", fontSize:13, color:"#6B7280" }}>{p.owner_username}</td>
                      <td style={{ padding:"13px 16px" }}>
                        <span style={{ padding:"3px 10px", borderRadius:4, fontSize:12, fontWeight:500, background:st.bg, color:st.color }}>{st.label}</span>
                      </td>
                      <td style={{ padding:"13px 16px", fontSize:12, color:"#9CA3AF", whiteSpace:"nowrap" }}>{fmtDate(p.registered_at)}</td>
                      <td style={{ padding:"13px 16px" }} onClick={e => e.stopPropagation()}>
                        <TxPill hash={p.tx_hash} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:14 }}>
          <span style={{ fontSize:12, color:"#9CA3AF" }}>
            Showing {(page-1)*PER_PAGE+1}–{Math.min(page*PER_PAGE, filtered.length)} of {filtered.length}
          </span>
          <div style={{ display:"flex", gap:6 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}>← Prev</button>
            {[...Array(totalPages)].map((_,i) => (
              <button key={i} onClick={() => setPage(i+1)} style={{
                width:32, height:32, borderRadius:7, border:"1.5px solid", fontSize:13, fontWeight:500, cursor:"pointer",
                borderColor: page===i+1 ? "#173F35" : "#EAEDEA",
                background:  page===i+1 ? "#173F35" : "white",
                color:       page===i+1 ? "white"   : "#6B7280",
              }}>{i+1}</button>
            ))}
            <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages}>Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}
