import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getProperties } from "../services/api";

const I = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d={d} />
  </svg>
);
const ic = {
  search:   "m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z",
  shield:   "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  location: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z",
  link:     "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
  home:     "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
  x:        "M18 6 6 18 M6 6l12 12",
};

export default function PublicVerify() {
  const [searchParams] = useSearchParams();
  const [query,   setQuery]   = useState(searchParams.get("q") || "");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true); setSearched(true);
    try {
      const { data } = await getProperties({ search: query.trim() });
      setResults(data);
    } catch { setResults([]); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--ivory)" }}>
      {/* Header */}
      <div style={{ background: "var(--forest)", padding: "0 48px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 64, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 30, height: 30, background: "var(--green)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <I d={ic.location} size={14} />
            </div>
            <span style={{ fontFamily: "Manrope", fontWeight: 800, fontSize: 18, color: "white" }}>Plotify</span>
          </Link>
          <Link to="/login" className="btn btn-sm" style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.2)" }}>
            Sign In
          </Link>
        </div>

        {/* Hero search */}
        <div style={{ padding: "48px 0 56px", maxWidth: 600 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", background: "rgba(40,122,104,0.3)", border: "1px solid rgba(40,122,104,0.5)", borderRadius: 4, fontSize: 11, fontWeight: 700, color: "#6FD5BF", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>
            <I d={ic.shield} size={11} /> Public Land Registry
          </div>
          <h1 style={{ fontFamily: "Manrope", fontSize: "clamp(28px,4vw,46px)", fontWeight: 800, color: "white", marginBottom: 12, lineHeight: 1.1 }}>
            Verify any land record<br />instantly.
          </h1>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", marginBottom: 28 }}>
            Search by Land ID, title, or location. No login required.
          </p>

          <form onSubmit={handleSearch} style={{ display: "flex", gap: 10 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <I d={ic.search} size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(0,0,0,0.4)" }} />
              <input
                type="text"
                style={{ width: "100%", padding: "13px 14px 13px 44px", borderRadius: 7, border: "none", fontSize: 15, outline: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
                placeholder="e.g. Westlands, PLT-0042, survey number…"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-lg" style={{ background: "var(--green)", color: "white", whiteSpace: "nowrap" }}>
              <I d={ic.search} size={16} />
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Results */}
      <div style={{ padding: "36px 48px", maxWidth: 1100, margin: "0 auto" }}>
        {loading && (
          <div style={{ textAlign: "center", padding: 48 }}>
            <div style={{ width: 36, height: 36, border: "3px solid var(--soft-sage)", borderTopColor: "var(--forest)", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 12px" }} />
            <p style={{ color: "var(--text-muted)" }}>Searching records…</p>
          </div>
        )}

        {!loading && !searched && (
          <div style={{ textAlign: "center", padding: "48px 24px" }}>
            <div style={{ width: 60, height: 60, background: "var(--soft-sage)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "var(--sage)" }}>
              <I d={ic.search} size={28} />
            </div>
            <h3 style={{ fontFamily: "Manrope", fontWeight: 700, marginBottom: 8 }}>Search to verify a land record</h3>
            <p style={{ color: "var(--text-muted)", maxWidth: 400, margin: "0 auto" }}>Enter a property title, location or Land ID above to find and verify ownership records.</p>
          </div>
        )}

        {!loading && searched && results?.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 24px" }}>
            <div style={{ width: 60, height: 60, background: "#FEF3C7", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "#D97706" }}>
              <I d={ic.x} size={28} />
            </div>
            <h3 style={{ fontFamily: "Manrope", fontWeight: 700, marginBottom: 8 }}>No records found</h3>
            <p style={{ color: "var(--text-muted)" }}>No land records match "{query}". Check the spelling or try a different search.</p>
          </div>
        )}

        {!loading && results?.length > 0 && (
          <>
            <div style={{ marginBottom: 16, fontSize: 14, color: "var(--text-muted)" }}>
              {results.length} record{results.length !== 1 ? "s" : ""} found for "<strong>{query}</strong>"
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {results.map(p => (
                <div key={p.id} className="card" style={{ padding: 0 }}>
                  <div style={{ padding: "20px 24px", display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
                    {/* Left info */}
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <span style={{ fontFamily: "monospace", fontSize: 11, color: "var(--text-muted)", background: "var(--ivory)", padding: "2px 8px", borderRadius: 3, border: "1px solid var(--border-light)" }}>
                          PLT-{String(p.id).padStart(4, "0")}
                        </span>
                        <span style={{ padding: "3px 10px", borderRadius: 4, fontSize: 12, fontWeight: 500, background: p.status === "active" ? "#DCFCE7" : "#FEF3C7", color: p.status === "active" ? "#166534" : "#92400E" }}>
                          {p.status === "active" ? "✓ Verified" : "Pending"}
                        </span>
                      </div>
                      <h3 style={{ fontFamily: "Manrope", fontSize: 17, fontWeight: 700, marginBottom: 4 }}>{p.title}</h3>
                      <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{p.location}</p>
                    </div>

                    {/* Middle details */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px 24px", minWidth: 280 }}>
                      {[["Area", `${p.area?.toLocaleString()} m²`], ["Registered", p.registered_at ? new Date(p.registered_at).toLocaleDateString() : "—"], ["Owner", p.owner_username]].map(([k, v]) => (
                        <div key={k}>
                          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>{k}</div>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{v}</div>
                        </div>
                      ))}
                    </div>

                    {/* Tx hash */}
                    <div style={{ flexShrink: 0, textAlign: "right" }}>
                      {p.tx_hash
                        ? <div style={{ fontFamily: "monospace", fontSize: 11, color: "var(--green)", background: "var(--soft-sage)", padding: "4px 10px", borderRadius: 4, border: "1px solid var(--border)" }}>
                            <I d={ic.link} size={11} /> {p.tx_hash.slice(0, 16)}…
                          </div>
                        : <div style={{ fontSize: 12, color: "var(--text-muted)" }}>No blockchain record</div>}
                    </div>
                  </div>

                  <div style={{ borderTop: "1px solid var(--border-light)", padding: "10px 24px", background: "var(--ivory)", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }}>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      This record is publicly verifiable. Sensitive owner details are protected.
                    </span>
                    <Link to="/login" style={{ fontSize: 13, color: "var(--green)", fontWeight: 500 }}>Login to view full details →</Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
