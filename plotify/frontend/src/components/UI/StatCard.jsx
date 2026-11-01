/**
 * StatCard — displays a single dashboard metric.
 *
 * Props:
 *   label   {string}  — metric name
 *   value   {number}  — metric value
 *   icon    {string}  — Bootstrap Icons class e.g. "bi-house"
 *   color   {string}  — optional CSS color for the icon (default: var(--plotify-primary))
 */
export default function StatCard({ label, value, icon, color }) {
  return (
    <div className="stat-card">
      <div className="d-flex align-items-center justify-content-between mb-2">
        <span className="stat-label">{label}</span>
        <i
          className={`bi ${icon}`}
          style={{ fontSize: "1.4rem", color: color || "var(--plotify-primary)" }}
          aria-hidden="true"
        />
      </div>
      <div className="stat-value">{value ?? "—"}</div>
    </div>
  );
}
