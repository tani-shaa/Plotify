/**
 * ConfirmDialog — simple modal confirmation dialog built on Bootstrap.
 *
 * Props:
 *   show     {boolean}
 *   title    {string}
 *   message  {string}
 *   onConfirm {() => void}
 *   onCancel  {() => void}
 *   confirmLabel {string}  (default: "Confirm")
 *   confirmVariant {string} (default: "danger")
 */
export default function ConfirmDialog({
  show,
  title = "Are you sure?",
  message,
  onConfirm,
  onCancel,
  confirmLabel   = "Confirm",
  confirmVariant = "danger",
}) {
  if (!show) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="modal-backdrop fade show"
        onClick={onCancel}
        aria-hidden="true"
      />

      <div
        className="modal fade show d-block"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="confirm-dialog-title">{title}</h5>
              <button
                type="button"
                className="btn-close"
                onClick={onCancel}
                aria-label="Close"
              />
            </div>
            {message && (
              <div className="modal-body">
                <p className="mb-0">{message}</p>
              </div>
            )}
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onCancel}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`btn btn-${confirmVariant}`}
                onClick={onConfirm}
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
