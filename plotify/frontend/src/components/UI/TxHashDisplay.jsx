import { useState } from "react";

/**
 * TxHashDisplay — shows a truncated blockchain tx hash with a click-to-copy tooltip.
 *
 * Props:
 *   hash  {string}  — full hex transaction hash
 *   label {string?} — optional prefix label (default: "Tx")
 */
export default function TxHashDisplay({ hash, label = "Tx" }) {
  const [copied, setCopied] = useState(false);

  if (!hash) return <span className="text-muted">—</span>;

  const short = `${hash.slice(0, 8)}…${hash.slice(-6)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <span
      className="tx-hash"
      onClick={handleCopy}
      title={copied ? "Copied!" : hash}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleCopy()}
    >
      <i className="bi bi-link-45deg me-1" aria-hidden="true" />
      {label}: {short}
      {copied && <span className="ms-1 text-success" style={{ fontSize: "0.7rem" }}>✓ Copied</span>}
    </span>
  );
}
