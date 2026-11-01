/**
 * FormField — labelled form input / textarea / select wrapper.
 *
 * Props:
 *   label       {string}
 *   id          {string}
 *   type        {string}   (default: "text") — use "textarea" or "select" for those variants
 *   value       {string}
 *   onChange    {(e) => void}
 *   error       {string?}  — validation error message
 *   required    {boolean}
 *   placeholder {string?}
 *   children    {ReactNode} — <option> elements when type="select"
 *   ...rest                 — passed to the input/textarea/select element
 */
export default function FormField({
  label,
  id,
  type = "text",
  value,
  onChange,
  error,
  required = false,
  placeholder,
  children,
  ...rest
}) {
  const inputClass = `form-control${error ? " is-invalid" : ""}`;

  let control;
  if (type === "textarea") {
    control = (
      <textarea
        id={id}
        className={inputClass}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        rows={3}
        {...rest}
      />
    );
  } else if (type === "select") {
    control = (
      <select
        id={id}
        className={`form-select${error ? " is-invalid" : ""}`}
        value={value}
        onChange={onChange}
        required={required}
        {...rest}
      >
        {children}
      </select>
    );
  } else {
    control = (
      <input
        id={id}
        type={type}
        className={inputClass}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        {...rest}
      />
    );
  }

  return (
    <div className="mb-3">
      <label htmlFor={id} className="form-label fw-medium">
        {label}
        {required && <span className="text-danger ms-1" aria-hidden="true">*</span>}
      </label>
      {control}
      {error && <div className="invalid-feedback">{error}</div>}
    </div>
  );
}
