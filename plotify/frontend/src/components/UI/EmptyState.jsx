/**
 * EmptyState — shown when a list or page has no data.
 *
 * Props:
 *   icon     {string}   Bootstrap Icons class (default: "bi-inbox")
 *   title    {string}
 *   message  {string?}  optional sub-text
 *   action   {ReactNode?} optional CTA button
 */
export default function EmptyState({
  icon    = "bi-inbox",
  title   = "Nothing here yet",
  message,
  action,
}) {
  return (
    <div className="empty-state">
      <i className={`bi ${icon}`} aria-hidden="true" />
      <h5 className="mb-1">{title}</h5>
      {message && <p className="text-muted mb-3" style={{ maxWidth: 360, margin: "0 auto 1rem" }}>{message}</p>}
      {action}
    </div>
  );
}
