import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProperties, getTransfersForProperty } from "../services/api";

const Ico = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    style={{ flexShrink: 0 }}>
    <path d={d} />
  </svg>
);

const ic = {
  clock:    "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 6v6l4 2",
  flag:     "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z M4 22v-7",
  transfer: "M7 16V4m0 0L3 8m4-4 4 4 M17 8v12m0 0 4-4m-4 4-4-4",
  link:     "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
  eye:      "M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
};

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })
  : "—";

export default function OwnershipHistory() {
  const [properties,  setProperties]  = useState([]);
  const [selected,    setSelected]    = useState("");
  const [property,    setProperty]    = useState(null);
  const [transfers,   setTransfers]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [loadingTx,   setLoadingTx]   = useState(false);

  useEffect(() => {
    getProperties()
      .then(r => setProperties(r.data))
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = async (id) => {
    setSelected(id);
    if (!id) { setProperty(null); setTransfers([]); return; }
    setLoadingTx(true);
    try {
      const prop = properties.find(p => String(p.id) === String(id));
      setProperty(prop || null);
      const { data } = await getTransfersForProperty(id);
      setTransfers(data.filter(t => t.status === "approved"));
    } finally {
      setLoadingTx(false);
    }
  };

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-text">
          <h1>Ownership History</h1>
          <p>View the complete ownership timeline for any registered property.</p>
        </div>
      </div>

      {/* Property selector */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div className="card-header-title">Select Property</div>
        </div>
        <div className="card-body">
          {loading ? (
            <div style={{ height: 42, background: "var(--soft-sage)", borderRadius: 8 }} className="skel" />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "center" }}>
              <select
                className="form-select"
                value={selected}
                onChange={e => handleSelect(e.target.value)}
              >
                <option value="">— Choose a property to view its ownership history —</option>
                {properties.map(p => (
                  <option key={p.id} value={p.id}>
                    PLT-{String(p.id).padStart(4, "0")} · {p.title} — {p.location}
                  </option>
                ))}
              </select>
              {selected && (
                <Link to={`/properties/${selected}`} className="btn btn-ghost btn-sm">
                  <Ico d={ic.eye} size={13} /> View Property
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Empty — nothing selected */}
      {!selected && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><Ico d={ic.clock} size={24} /></div>
            <h3>Select a property</h3>
            <p>Choose a property from the dropdown above to see its complete ownership timeline, including all transfers and blockchain records.</p>
          </div>
        </div>
      )}

      {/* Loading transfers */}
      {selected && loadingTx && (
        <div style={{ padding: 48, textAlign: "center" }}>
          <div style={{ width: 34, height: 34, border: "3px solid var(--soft-sage)", borderTopColor: "var(--forest)", borderRadius: "50%", margin: "0 auto" }} className="animate-spin" />
        </div>
      )}

      {/* Timeline */}
      {selected && !loadingTx && property && (
        <div style={{ maxWidth: 720 }}>
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-header-title">{property.title}</div>
                <div className="card-header-sub">
                  {property.location} · {property.area?.toLocaleString("en-IN")} m²
                </div>
              </div>
              <span className="badge badge-info" style={{ fontSize: 11 }}>
                {transfers.length + 1} record{transfers.length !== 0 ? "s" : ""}
              </span>
            </div>

            <div className="card-body" style={{ padding: "28px 32px" }}>
              <div className="timeline">
                {/* Registration event */}
                <div className="timeline-item">
                  <div className="timeline-dot first" />
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <Ico d={ic.flag} size={14} style={{ color: "var(--forest)" }} />
                    <span className="timeline-title">Property Registered</span>
                  </div>
                  <div className="timeline-sub">
                    Initial owner: <strong>{property.owner_username}</strong>
                  </div>
                  <div className="timeline-time" style={{ marginTop: 5 }}>
                    {fmtDate(property.registered_at)}
                  </div>
                  {property.tx_hash && (
                    <div className="timeline-tx">
                      <Ico d={ic.link} size={11} style={{ color: "var(--green)" }} />
                      <span style={{ fontFamily: "monospace", fontSize: 11, color: "var(--green)" }}>
                        {property.tx_hash.slice(0, 22)}…
                      </span>
                    </div>
                  )}
                </div>

                {/* Transfer events */}
                {transfers.map(t => (
                  <div className="timeline-item" key={t.id}>
                    <div className="timeline-dot" />
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <Ico d={ic.transfer} size={14} style={{ color: "var(--green)" }} />
                      <span className="timeline-title">Ownership Transferred</span>
                    </div>
                    <div className="timeline-sub">
                      <strong>{t.from_username}</strong>
                      <span style={{ margin: "0 8px", color: "var(--text-subtle)" }}>→</span>
                      <strong>{t.to_username}</strong>
                    </div>
                    {t.note && (
                      <div className="timeline-note">"{t.note}"</div>
                    )}
                    <div className="timeline-time" style={{ marginTop: 5 }}>
                      {fmtDate(t.requested_at)}
                    </div>
                    {t.tx_hash && (
                      <div className="timeline-tx">
                        <Ico d={ic.link} size={11} style={{ color: "var(--green)" }} />
                        <span style={{ fontFamily: "monospace", fontSize: 11, color: "var(--green)" }}>
                          {t.tx_hash.slice(0, 22)}…
                        </span>
                      </div>
                    )}
                  </div>
                ))}

                {transfers.length === 0 && (
                  <div className="timeline-item">
                    <div className="timeline-dot muted" />
                    <div style={{ fontSize: 13, color: "var(--text-muted)", fontStyle: "italic" }}>
                      No ownership transfers recorded yet.
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="card-footer">
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                All ownership changes are recorded permanently on the blockchain.
              </span>
              <Link to={`/properties/${property.id}`} className="btn btn-ghost btn-sm">
                <Ico d={ic.eye} size={13} /> Full Property Details
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
