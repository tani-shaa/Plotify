import { useState, useEffect } from "react";
import { uploadDocument, verifyDocument, getProperties } from "../services/api";

const Ico = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    style={{ flexShrink: 0 }}>
    <path d={d} />
  </svg>
);

const ic = {
  upload:  "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M17 8l-5-5-5 5 M12 3v12",
  shield:  "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  check:   "M20 6 9 17l-5-5",
  x:       "M18 6 6 18 M6 6l12 12",
  info:    "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 16v-4 M12 8h.01",
  hash:    "M4 9h16 M4 15h16 M10 3 8 21 M16 3l-2 18",
  copy:    "M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-2 M10 2h4a2 2 0 0 1 2 2v2H8V4a2 2 0 0 1 2-2z",
  file:    "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6",
};

function Toast({ toast }) {
  if (!toast) return null;
  const colors = { success: "#166534", error: "#991B1B", warning: "#92400E" };
  const bgs    = { success: "#F0FDF4", error: "#FEF2F2", warning: "#FFFBEB" };
  const borders= { success: "#BBF7D0", error: "#FECACA", warning: "#FDE68A" };
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      padding: "14px 18px", background: bgs[toast.type] || "white",
      border: `1px solid ${borders[toast.type] || "#EAEDEA"}`,
      borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
      fontSize: 13, color: colors[toast.type] || "#111827",
      display: "flex", alignItems: "center", gap: 10,
      minWidth: 280, animation: "fadeUp 0.2s ease",
    }}>
      <Ico d={toast.type === "success" ? ic.check : ic.info} size={16} />
      {toast.msg}
    </div>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button onClick={copy} className="btn btn-ghost btn-xs" title={copied ? "Copied!" : "Copy"}>
      <Ico d={copied ? ic.check : ic.copy} size={12} />
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export default function DocumentVerification() {
  const [tab,        setTab]        = useState("upload");
  const [properties, setProperties] = useState([]);
  const [toast,      setToast]      = useState(null);

  // Upload state
  const [upFile,    setUpFile]    = useState(null);
  const [upPropId,  setUpPropId]  = useState("");
  const [upDocType, setUpDocType] = useState("title_deed");
  const [upBusy,    setUpBusy]    = useState(false);
  const [upResult,  setUpResult]  = useState(null);
  const [upError,   setUpError]   = useState("");
  const [upDrag,    setUpDrag]    = useState(false);

  // Verify state
  const [vFile,  setVFile]  = useState(null);
  const [vDocId, setVDocId] = useState("");
  const [vHash,  setVHash]  = useState("");
  const [vBusy,  setVBusy]  = useState(false);
  const [vResult,setVResult]= useState(null);
  const [vError, setVError] = useState("");

  const addToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    getProperties().then(r => setProperties(r.data));
  }, []);

  // Reset result when switching tabs
  const switchTab = (t) => {
    setTab(t);
    setUpResult(null); setUpError("");
    setVResult(null);  setVError("");
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setUpError(""); setUpResult(null);
    if (!upFile)   { setUpError("Please select a file."); return; }
    if (!upPropId) { setUpError("Please select a property."); return; }
    const fd = new FormData();
    fd.append("file", upFile);
    fd.append("property_id", upPropId);
    fd.append("doc_type", upDocType);
    setUpBusy(true);
    try {
      const { data } = await uploadDocument(fd);
      setUpResult(data);
      addToast("Document uploaded and hashed successfully.");
    } catch (err) {
      setUpError(err.response?.data?.error || "Upload failed. Please try again.");
    } finally {
      setUpBusy(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setVError(""); setVResult(null);
    if (!vFile)             { setVError("Please select a file to verify."); return; }
    if (!vDocId && !vHash)  { setVError("Provide either a Document ID or the expected SHA-256 hash."); return; }
    const fd = new FormData();
    fd.append("file", vFile);
    if (vDocId) fd.append("document_id", vDocId);
    else        fd.append("expected_hash", vHash.trim());
    setVBusy(true);
    try {
      const { data } = await verifyDocument(fd);
      setVResult(data);
    } catch (err) {
      setVError(err.response?.data?.error || "Verification failed. Please try again.");
    } finally {
      setVBusy(false);
    }
  };

  const DOC_TYPES = [
    { value: "title_deed",    label: "Title Deed" },
    { value: "survey_map",    label: "Survey Map" },
    { value: "sale_agreement",label: "Sale Agreement" },
    { value: "other",         label: "Other" },
  ];

  return (
    <div className="page-content">
      <Toast toast={toast} />

      {/* Header */}
      <div className="page-header">
        <div className="page-header-text">
          <h1>Document Verification</h1>
          <p>Upload, hash and verify property documents using SHA-256 cryptography.</p>
        </div>
      </div>

      {/* How it works */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 }}>
        {[
          [ic.upload, "Upload & Hash", "Files are SHA-256 hashed before storage. The hash can be anchored on-chain."],
          [ic.hash,   "Tamper Detection", "Any modification — even one character — produces a completely different hash."],
          [ic.shield, "Verify Integrity", "Re-hash a file at any time to confirm it matches the original stored hash."],
        ].map(([ico, title, desc]) => (
          <div key={title} style={{
            background: "white", border: "1px solid var(--border-light)",
            borderRadius: 10, padding: "16px 18px",
            display: "flex", alignItems: "flex-start", gap: 12,
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: "var(--soft-sage)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--forest)", flexShrink: 0 }}>
              <Ico d={ico} size={17} />
            </div>
            <div>
              <div style={{ fontFamily: "Manrope, sans-serif", fontWeight: 700, fontSize: 13, marginBottom: 3 }}>{title}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tab switcher */}
      <div style={{ display: "flex", gap: 3, background: "white", borderRadius: 9, padding: 4,
        border: "1.5px solid var(--border-light)", marginBottom: 20, width: "fit-content" }}>
        {[["upload","Upload & Hash"], ["verify","Verify Document"]].map(([t, l]) => (
          <button key={t} onClick={() => switchTab(t)} className={`btn btn-sm ${tab === t ? "btn-primary" : "btn-ghost"}`}
            style={{ borderRadius: 7 }}>
            <Ico d={t === "upload" ? ic.upload : ic.shield} size={13} />
            {l}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 640 }}>
        {/* ─── Upload Tab ─────────────────────────────────────── */}
        {tab === "upload" && (
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-header-title">Upload & Hash Document</div>
                <div className="card-header-sub">Files are SHA-256 hashed and optionally anchored on-chain</div>
              </div>
              <Ico d={ic.upload} size={16} style={{ color: "var(--text-muted)" }} />
            </div>
            <div className="card-body" style={{ padding: 28 }}>
              {upError && (
                <div className="form-alert error" style={{ marginBottom: 20 }}>
                  <Ico d={ic.info} size={15} /> {upError}
                </div>
              )}

              {upResult && (
                <div style={{ padding: "16px 18px", background: "#F0FDF4",
                  borderRadius: 9, border: "1px solid #BBF7D0", marginBottom: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8,
                    color: "#166534", fontWeight: 600, fontSize: 13, marginBottom: 12 }}>
                    <Ico d={ic.check} size={16} /> Document uploaded and hashed successfully
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500, marginBottom: 5 }}>SHA-256 Hash</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <code style={{ fontFamily: "monospace", fontSize: 11, background: "white",
                      padding: "7px 12px", borderRadius: 6, border: "1px solid #BBF7D0",
                      wordBreak: "break-all", flex: 1, color: "#166534" }}>
                      {upResult.sha256_hash}
                    </code>
                    <CopyButton text={upResult.sha256_hash} />
                  </div>
                  {upResult.tx_hash && (
                    <div style={{ marginTop: 10, fontSize: 12, color: "var(--green)", display: "flex", alignItems: "center", gap: 6 }}>
                      <Ico d={ic.shield} size={13} />
                      On-chain Tx: <span style={{ fontFamily: "monospace" }}>{upResult.tx_hash.slice(0, 20)}…</span>
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleUpload} noValidate>
                <div className="form-group">
                  <label className="form-label">Property <span className="required">*</span></label>
                  <select className="form-select" value={upPropId} onChange={e => setUpPropId(e.target.value)}>
                    <option value="">— Select a property —</option>
                    {properties.map(p => (
                      <option key={p.id} value={p.id}>
                        PLT-{String(p.id).padStart(4,"0")} · {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Document Type</label>
                  <select className="form-select" value={upDocType} onChange={e => setUpDocType(e.target.value)}>
                    {DOC_TYPES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">File <span className="required">*</span></label>
                  <div
                    onDragOver={e => { e.preventDefault(); setUpDrag(true); }}
                    onDragLeave={() => setUpDrag(false)}
                    onDrop={e => { e.preventDefault(); setUpDrag(false); const f = e.dataTransfer.files[0]; if (f) setUpFile(f); }}
                    onClick={() => document.getElementById("up-file-input")?.click()}
                    style={{
                      border: `2px dashed ${upDrag ? "var(--green)" : upFile ? "var(--green)" : "var(--border)"}`,
                      borderRadius: 9, padding: "28px 20px", textAlign: "center",
                      cursor: "pointer", transition: "border-color 0.15s, background 0.15s",
                      background: upDrag ? "var(--soft-sage)" : "transparent",
                    }}
                  >
                    <div style={{ width: 44, height: 44, background: "var(--soft-sage)", borderRadius: 10,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      margin: "0 auto 12px", color: "var(--sage)" }}>
                      <Ico d={upFile ? ic.file : ic.upload} size={22} />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)", marginBottom: 4 }}>
                      {upFile ? upFile.name : "Click to upload or drag and drop"}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      PDF, PNG, JPG, DOCX · Max 16 MB
                    </div>
                    <input id="up-file-input" type="file" accept=".pdf,.png,.jpg,.jpeg,.docx"
                      style={{ display: "none" }} onChange={e => setUpFile(e.target.files[0] || null)} />
                  </div>
                  {upFile && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                      marginTop: 8, padding: "8px 12px", background: "var(--soft-sage)",
                      borderRadius: 7, border: "1px solid var(--border)" }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{upFile.name}</span>
                      <button type="button" className="btn btn-ghost btn-xs"
                        onClick={e => { e.stopPropagation(); setUpFile(null); }}>
                        Clear
                      </button>
                    </div>
                  )}
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={upBusy}>
                  {upBusy
                    ? <><div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.35)", borderTopColor: "white", borderRadius: "50%" }} className="animate-spin" /> Uploading…</>
                    : <><Ico d={ic.upload} size={15} /> Upload & Hash</>
                  }
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ─── Verify Tab ─────────────────────────────────────── */}
        {tab === "verify" && (
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-header-title">Verify Document Integrity</div>
                <div className="card-header-sub">Re-hash a file to confirm it hasn't been modified</div>
              </div>
              <Ico d={ic.shield} size={16} style={{ color: "var(--green)" }} />
            </div>
            <div className="card-body" style={{ padding: 28 }}>
              {vError && (
                <div className="form-alert error" style={{ marginBottom: 20 }}>
                  <Ico d={ic.info} size={15} /> {vError}
                </div>
              )}

              {vResult && (
                <div style={{
                  padding: "16px 18px", borderRadius: 9, marginBottom: 24,
                  background: vResult.match ? "#F0FDF4" : "#FEF2F2",
                  border: `1px solid ${vResult.match ? "#BBF7D0" : "#FECACA"}`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9, fontWeight: 700,
                    color: vResult.match ? "#166534" : "#991B1B", marginBottom: 14, fontSize: 14 }}>
                    <Ico d={vResult.match ? ic.check : ic.x} size={18} />
                    {vResult.match
                      ? "Document is authentic — hash matches."
                      : "Hash mismatch — document may have been modified."}
                  </div>
                  {[
                    ["Computed hash", vResult.actual_hash],
                    ["Expected hash", vResult.stored_hash || vResult.expected_hash],
                  ].filter(([,v]) => v).map(([label, hash]) => (
                    <div key={label} style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500, marginBottom: 4 }}>{label}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <code style={{ fontFamily: "monospace", fontSize: 11, background: "white",
                          padding: "5px 10px", borderRadius: 5, border: "1px solid var(--border)",
                          wordBreak: "break-all", flex: 1 }}>
                          {hash}
                        </code>
                        <CopyButton text={hash} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleVerify} noValidate>
                <div className="form-group">
                  <label className="form-label">File to verify <span className="required">*</span></label>
                  <div
                    onClick={() => document.getElementById("v-file-input")?.click()}
                    style={{
                      border: `2px dashed ${vFile ? "var(--green)" : "var(--border)"}`,
                      borderRadius: 9, padding: "22px 20px", textAlign: "center",
                      cursor: "pointer", transition: "border-color 0.15s",
                    }}
                    onMouseOver={e => e.currentTarget.style.borderColor = "var(--green)"}
                    onMouseOut={e  => e.currentTarget.style.borderColor = vFile ? "var(--green)" : "var(--border)"}
                  >
                    <div style={{ fontSize: 14, color: vFile ? "var(--text-primary)" : "var(--text-muted)", fontWeight: vFile ? 500 : 400 }}>
                      {vFile ? vFile.name : "Click to choose a file"}
                    </div>
                    <input id="v-file-input" type="file" style={{ display: "none" }}
                      onChange={e => setVFile(e.target.files[0] || null)} />
                  </div>
                </div>

                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 12 }}>
                  Compare against:
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Document ID</label>
                    <input className="form-input" type="number" placeholder="e.g. 7"
                      value={vDocId} onChange={e => { setVDocId(e.target.value); setVHash(""); }} />
                    <div className="form-hint">From your upload confirmation</div>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">SHA-256 Hash</label>
                    <input className="form-input" placeholder="64-character hex string"
                      value={vHash} onChange={e => { setVHash(e.target.value); setVDocId(""); }}
                      maxLength={64} style={{ fontFamily: "monospace", fontSize: 12 }} />
                    <div className="form-hint">Or paste the expected hash directly</div>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={vBusy}>
                  {vBusy
                    ? <><div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.35)", borderTopColor: "white", borderRadius: "50%" }} className="animate-spin" /> Verifying…</>
                    : <><Ico d={ic.shield} size={15} /> Verify Document</>
                  }
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
