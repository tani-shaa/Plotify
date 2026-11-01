import { useEffect } from "react";

/**
 * Toast — individual notification toast.
 *
 * Props:
 *   message  {string}              — the notification text
 *   type     {"success"|"danger"|"warning"|"info"}
 *   onClose  {() => void}          — called when the toast should be removed
 *   duration {number}              — ms before auto-dismiss (default 4000)
 */
export default function Toast({ message, type = "info", onClose, duration = 4000 }) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const icons = {
    success: "bi-check-circle-fill",
    danger:  "bi-x-circle-fill",
    warning: "bi-exclamation-triangle-fill",
    info:    "bi-info-circle-fill",
  };

  return (
    <div
      className={`toast show align-items-center text-bg-${type} border-0`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="d-flex">
        <div className="toast-body d-flex align-items-center gap-2">
          <i className={`bi ${icons[type] || icons.info}`} aria-hidden="true" />
          {message}
        </div>
        <button
          type="button"
          className="btn-close btn-close-white me-2 m-auto"
          onClick={onClose}
          aria-label="Close"
        />
      </div>
    </div>
  );
}

/**
 * ToastContainer — renders a stack of toasts in the bottom-right corner.
 *
 * Props:
 *   toasts    {Array<{id, message, type}>}
 *   onRemove  {(id) => void}
 */
export function ToastContainer({ toasts = [], onRemove }) {
  return (
    <div className="toast-container-fixed" aria-live="polite" aria-atomic="false">
      {toasts.map((t) => (
        <Toast
          key={t.id}
          message={t.message}
          type={t.type}
          onClose={() => onRemove(t.id)}
        />
      ))}
    </div>
  );
}
