/**
 * StatusBadge — renders a coloured pill for property/transfer status values.
 *
 * Props:
 *   status {string} — e.g. "active", "pending", "approved", "rejected", "pending_transfer"
 */
const LABELS = {
  active:           "Active",
  pending_transfer: "Pending Transfer",
  pending:          "Pending",
  approved:         "Approved",
  rejected:         "Rejected",
};

export default function StatusBadge({ status }) {
  const label = LABELS[status] ?? status;
  return (
    <span
      className={`badge badge-status-${status}`}
      style={{ borderRadius: "6px", fontSize: "0.75rem", padding: "0.3em 0.65em" }}
    >
      {label}
    </span>
  );
}
