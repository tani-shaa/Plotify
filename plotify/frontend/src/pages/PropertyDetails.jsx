import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getProperty, getTransfersForProperty, getDocumentsForProperty } from "../services/api";

const Ico = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    style={{ flexShrink: 0 }}>
    <path d={d} />
  </svg>
);
const ic = {
  back:     "M19 12H5 M12 5l-7 7 7 7",
  flag:     "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z M4 22v-7",
  transfer: "M7 16V4m0 0L3 8m4-4 4 4 M17 8v12m0 0 4-4m-4 4-4-4",
  file:     "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6",
  link:     "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
  check:    "M20 6 9 17l-5-5",
  copy:     "M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-2 M10 2h4a2 2 0 0 1 2 2v2H8V4a2 2 0 0 1 2-2z",
  shield:   "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  map:      "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z",
};

const TABS = ["Details", "Ownership History", "Documents"];

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
  : "—";

function CopyHash({ hash }) {
  const [copied, setCopied] = useState(false);
  if (!hash) return <span style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>Not anchored on-chain</span>;
  const copy = async () => {
    await navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <span style={{
        fontFamily: "monospace", fontSize: 12, color: "var(--green)",
        background: "var(--soft-sage)", padding: "5px 10px",
        borderRadius: 5, border: "1px solid var(--border)",
        wordBreak: "break-all", flex: 1,
      }}>
        {hash}
      </span>
      <button
        onClick={copy}
        className="btn btn-ghost btn-xs"
        title={copied ? "Copied!" : "Copy hash"}
        style={{ flexShrink: 0 }}
      >
        <Ico d={copied ? ic.check : ic.copy} size={13} />
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

export default function PropertyDetails() {
  const { id } = useParams();
  const [property,  setProperty]  = useState(null);
  const [transfers, setTransfers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [tab,       setTab]       = useState(0);

  useEffect(() => {
    Promise.all([
      getProperty(id),
      getTransfersForProperty(id),
      getDocumentsForProperty(id),
    ])
      .then(([p, t, d]) => {
        setProperty(p.data);
        setTransfers(t.data);
        setDocuments(d.data);
      })
      .catch(() => setError("Failed to load property details."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="page-content" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
      <div style={{ width: 34, height: 34, border: "3px solid var(--soft-sage)", borderTopColor: "var(--forest)", borderRadius: "50%" }} className="animate-spin" />
    </div>
  );

  if (error || !property) return (
    <div className="page-content">
      <div className="form-alert error">
        <Ico d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 8v4 M12 16h.01" size={16} />
        {error || "Property not found."}
      </div>
      <Link to="/properties" className="btn btn-ghost btn-sm"><Ico d={ic.back} size={13} /> Back to Properties</Link>
    </div>
  );

  const statusMap = {
    active:           { cls: "badge-active",   label: "Active" },
    pending_transfer: { cls: "badge-pending",  label: "Pending Transfer" },
  };
  const st = statusMap[property.status] || { cls: "badge-neutral", label: property.status };
  const approvedTransfers = transfers.filter(t => t.status === "approved");

  return (
    <div className="page-content">

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 24 }}>
        <Link to="/properties" className="btn btn-ghost btn-icon btn-sm" aria-label="Back">
          <Ico d={ic.back} size={14} />
        </Link>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
            <h1 style={{ fontFamily: "Manrope, sans-serif", fontSize: 20, fontWeight: 800, letterSpacing: "-0.01em" }}>
              {property.title}
            </h1>
            <span className={`badge ${st.cls}`}>{st.label}</span>
          </div>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
            <span style={{ fontFamily: "monospace", fontSize: 11 }}>PLT-{String(property.id).padStart(4, "0")}</span>
            {" · "}{property.location}
            {" · "}{property.area?.toLocaleString("en-IN")} m²
          </p>
        </div>
        <Link to="/transfers" className="btn btn-primary btn-sm">
          <Ico d={ic.transfer} size={13} /> Request Transfer
        </Link>
      </div>

      {/* Tab nav */}
      <div style={{ display: "flex", gap: 0, borderBottom: "2px solid var(--border-light)", marginBottom: 24 }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            padding: "9px 20px",
            border: "none", background: "none", cursor: "pointer",
            fontSize: 14, fontWeight: tab === i ? 600 : 400,
            color: tab === i ? "var(--forest)" : "var(--text-muted)",
            borderBottom: tab === i ? "2px solid var(--forest)" : "2px solid transparent",
            marginBottom: -2, transition: "all 0.12s",
          }}>
            {t}
            {t === "Documents" && documents.length > 0 && (
              <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 600,
                background: "var(--soft-sage)", color: "var(--forest)",
                padding: "1px 6px", borderRadius: 10 }}>
                {documents.length}
              </span>
            )}
            {t === "Ownership History" && approvedTransfers.length > 0 && (
              <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 600,
                background: "var(--soft-sage)", color: "var(--forest)",
                padding: "1px 6px", borderRadius: 10 }}>
                {approvedTransfers.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── TAB 0: Details ───────────────────────────────────────────── */}
      {tab === 0 && (
        <div className="grid-2" style={{ alignItems: "start" }}>

          {/* Property info */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-header-title">Property Information</div>
              </div>
              <Ico d={ic.map} size={16} style={{ color: "var(--text-muted)" }} />
            </div>
            <div>
              {[
                ["Land ID",         `PLT-${String(property.id).padStart(4, "0")}`],
                ["Title",           property.title],
                ["Location",        property.location],
                ["Area",            `${property.area?.toLocaleString("en-IN") ?? "—"} m²`],
                ["Current Owner",   property.owner_username],
                ["Registered",      fmtDate(property.registered_at)],
                ["Blockchain ID",   property.blockchain_id ? `#${property.blockchain_id}` : "Not anchored"],
              ].map(([k, v]) => (
                <div key={k} style={{
                  display: "flex", padding: "11px 20px",
                  borderBottom: "1px solid var(--border-light)", gap: 16,
                }}>
                  <span style={{ fontSize: 12, color: "var(--text-muted)", width: 130, flexShrink: 0, fontWeight: 500 }}>{k}</span>
                  <span style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Blockchain record */}
            <div className="card">
              <div className="card-header">
                <div className="card-header-title">Blockchain Record</div>
                <Ico d={ic.shield} size={16} style={{ color: "var(--green)" }} />
              </div>
              <div className="card-body">
                {property.tx_hash ? (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12, color: "#166534", fontSize: 13, fontWeight: 600 }}>
                      <Ico d={ic.check} size={14} /> Record anchored on-chain
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>Transaction Hash</div>
                    <CopyHash hash={property.tx_hash} />
                  </>
                ) : (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--soft-sage)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--sage)", flexShrink: 0 }}>
                      <Ico d={ic.shield} size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>Off-chain only</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
                        This property has no blockchain record yet. It will be anchored when an admin approves it.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {property.description && (
              <div className="card">
                <div className="card-header"><div className="card-header-title">Notes</div></div>
                <div className="card-body">
                  <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7 }}>{property.description}</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="card">
              <div className="card-header"><div className="card-header-title">Actions</div></div>
              <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
                <Link to="/transfers" className="btn btn-ghost btn-sm" style={{ justifyContent: "flex-start" }}>
                  <Ico d={ic.transfer} size={14} /> Request Ownership Transfer
                </Link>
                <Link to="/documents" className="btn btn-ghost btn-sm" style={{ justifyContent: "flex-start" }}>
                  <Ico d={ic.file} size={14} /> Upload Document
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 1: Ownership History ──────────────────────────────── */}
      {tab === 1 && (
        <div style={{ maxWidth: 680 }}>
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-header-title">Ownership Timeline</div>
                <div className="card-header-sub">{approvedTransfers.length + 1} record{approvedTransfers.length !== 0 ? "s" : ""}</div>
              </div>
            </div>
            <div className="card-body" style={{ padding: "28px 28px" }}>
              <div className="timeline">
                {/* Registration */}
                <div className="timeline-item">
                  <div className="timeline-dot first" />
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
                    <Ico d={ic.flag} size={13} style={{ color: "var(--forest)" }} />
                    <span className="timeline-title">Property Registered</span>
                  </div>
                  <div className="timeline-sub">Initial owner: <strong>{property.owner_username}</strong></div>
                  <div className="timeline-time" style={{ marginTop: 4 }}>{fmtDate(property.registered_at)}</div>
                  {property.tx_hash && (
                    <div className="timeline-tx">
                      <Ico d={ic.link} size={11} style={{ color: "var(--green)" }} />
                      <span style={{ fontFamily: "monospace", fontSize: 11, color: "var(--green)" }}>
                        {property.tx_hash.slice(0, 20)}…
                      </span>
                    </div>
                  )}
                </div>

                {/* Transfers */}
                {approvedTransfers.map(t => (
                  <div className="timeline-item" key={t.id}>
                    <div className="timeline-dot" />
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
                      <Ico d={ic.transfer} size={13} style={{ color: "var(--green)" }} />
                      <span className="timeline-title">Ownership Transferred</span>
                    </div>
                    <div className="timeline-sub">
                      <strong>{t.from_username}</strong> → <strong>{t.to_username}</strong>
                    </div>
                    {t.note && <div className="timeline-note">"{t.note}"</div>}
                    <div className="timeline-time" style={{ marginTop: 4 }}>{fmtDate(t.requested_at)}</div>
                    {t.tx_hash && (
                      <div className="timeline-tx">
                        <Ico d={ic.link} size={11} style={{ color: "var(--green)" }} />
                        <span style={{ fontFamily: "monospace", fontSize: 11, color: "var(--green)" }}>
                          {t.tx_hash.slice(0, 20)}…
                        </span>
                      </div>
                    )}
                  </div>
                ))}

                {approvedTransfers.length === 0 && (
                  <div className="timeline-item">
                    <div className="timeline-dot muted" />
                    <div style={{ fontSize: 13, color: "var(--text-muted)", fontStyle: "italic" }}>
                      No ownership transfers recorded yet.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: Documents ─────────────────────────────────────── */}
      {tab === 2 && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-header-title">Uploaded Documents</div>
              <div className="card-header-sub">{documents.length} document{documents.length !== 1 ? "s" : ""}</div>
            </div>
            <Link to="/documents" className="btn btn-primary btn-sm">
              <Ico d={ic.file} size={13} /> Upload Document
            </Link>
          </div>
          {documents.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Ico d={ic.file} size={24} /></div>
              <h3>No documents uploaded</h3>
              <p>Upload a title deed, survey map or other supporting document for this property.</p>
              <Link to="/documents" className="btn btn-primary btn-sm">Upload now</Link>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Filename</th>
                    <th>Type</th>
                    <th>Uploaded By</th>
                    <th>Date</th>
                    <th>SHA-256</th>
                    <th>On-chain Tx</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map(doc => (
                    <tr key={doc.id}>
                      <td style={{ fontWeight: 500 }}>{doc.filename}</td>
                      <td>
                        <span className="badge badge-forest" style={{ fontSize: 11 }}>
                          {doc.doc_type?.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td style={{ color: "var(--text-muted)" }}>{doc.uploader_username || "—"}</td>
                      <td style={{ color: "var(--text-muted)" }}>{fmtDate(doc.uploaded_at)}</td>
                      <td>
                        <span className="cell-mono" title={doc.sha256_hash}>
                          {doc.sha256_hash?.slice(0, 12)}…
                        </span>
                      </td>
                      <td>
                        {doc.tx_hash
                          ? <span className="cell-mono" title={doc.tx_hash}>{doc.tx_hash.slice(0, 10)}…</span>
                          : <span style={{ fontSize: 12, color: "var(--text-subtle)" }}>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
