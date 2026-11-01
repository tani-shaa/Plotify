import TxHashDisplay from "./TxHashDisplay";

/**
 * OwnershipTimeline — vertical timeline of property ownership changes.
 *
 * Props:
 *   transfers  {Array}  — list of transfer objects (from DB or on-chain)
 *   registeredAt {string} — ISO date of original registration
 *   firstOwner {string} — username of the original owner
 */
export default function OwnershipTimeline({ transfers = [], registeredAt, firstOwner }) {
  return (
    <div className="timeline">
      {/* Registration event */}
      <div className="timeline-item">
        <div className="fw-semibold">
          <i className="bi bi-flag-fill text-success me-1" />
          Property Registered
        </div>
        <div className="text-muted" style={{ fontSize: "0.85rem" }}>
          Owner: <strong>{firstOwner || "—"}</strong>
        </div>
        {registeredAt && (
          <div className="text-muted" style={{ fontSize: "0.8rem" }}>
            {new Date(registeredAt).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Transfer events */}
      {transfers.map((t, idx) => (
        <div className="timeline-item" key={idx}>
          <div className="fw-semibold">
            <i className="bi bi-arrow-right-circle text-warning me-1" />
            Ownership Transferred
          </div>
          <div className="text-muted" style={{ fontSize: "0.85rem" }}>
            {t.from_username || t.from} → {t.to_username || t.to}
          </div>
          {t.note && (
            <div className="text-muted fst-italic" style={{ fontSize: "0.8rem" }}>
              "{t.note}"
            </div>
          )}
          <div className="d-flex align-items-center gap-3 mt-1" style={{ fontSize: "0.8rem" }}>
            {(t.requested_at || t.timestamp) && (
              <span className="text-muted">
                {new Date(t.requested_at || t.timestamp * 1000).toLocaleDateString()}
              </span>
            )}
            {t.tx_hash && <TxHashDisplay hash={t.tx_hash} />}
          </div>
        </div>
      ))}

      {transfers.length === 0 && (
        <p className="text-muted" style={{ fontSize: "0.85rem" }}>
          No ownership transfers yet.
        </p>
      )}
    </div>
  );
}
