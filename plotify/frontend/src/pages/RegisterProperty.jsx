import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createProperty } from "../services/api";

const Ico = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>
    <path d={d} />
  </svg>
);
const ic = {
  check: "M20 6 9 17l-5-5",
  info:  "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 16v-4 M12 8h.01",
  map:   "M9 20l-5.447-2.724A1 1 0 0 1 3 16.382V5.618a1 1 0 0 1 1.447-.894L9 7m0 13V7m0 13 6-3m-6-10 6-3m0 0 5.447 2.724A1 1 0 0 1 21 7.618v10.764a1 1 0 0 1-1.447.894L15 17m0-13v13",
  file:  "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6",
  hash:  "M4 9h16 M4 15h16 M10 3 8 21 M16 3l-2 18",
};

const STEPS = ["Land Info", "Owner Details", "Documents", "Review"];

export default function RegisterProperty() {
  const navigate = useNavigate();
  const [step,    setStep]    = useState(0);
  const [busy,    setBusy]    = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState(null);
  const [form,    setForm]    = useState({ title:"", location:"", area:"", description:"", ownerNote:"" });
  const [docFile, setDocFile] = useState(null);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    if (step === 0) {
      if (!form.title.trim())    return "Property title is required.";
      if (!form.location.trim()) return "Location is required.";
      if (!form.area || isNaN(parseFloat(form.area)) || parseFloat(form.area) <= 0) return "Area must be a positive number.";
    }
    return null;
  };

  const nextStep = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    setStep(s => Math.min(s + 1, 3));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError(""); setBusy(true);
    try {
      const { data } = await createProperty({ title: form.title.trim(), location: form.location.trim(), area: parseFloat(form.area), description: form.description.trim() || undefined });
      setSuccess(data);
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed. Please try again.");
    } finally { setBusy(false); }
  };

  if (success) return (
    <div className="page-content" style={{ maxWidth: 600, margin: "0 auto" }}>
      <div style={{ background:"white", borderRadius:14, padding:40, border:"1px solid #EAEDEA", textAlign:"center", boxShadow:"0 4px 16px rgba(0,0,0,0.06)" }}>
        <div style={{ width:60, height:60, borderRadius:"50%", background:"rgba(40,122,104,0.1)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px", color:"#287A68" }}>
          <Ico d={ic.check} size={28} />
        </div>
        <h2 style={{ fontFamily:"Manrope,sans-serif", fontSize:22, fontWeight:800, marginBottom:10 }}>Property Registered!</h2>
        <p style={{ fontSize:14, color:"#6B7280", marginBottom:20 }}>
          <strong>{success.title}</strong> has been submitted. A Land Officer will review it shortly.
        </p>
        {success.tx_hash
          ? <div style={{ fontFamily:"monospace", fontSize:12, background:"#E9EFE7", padding:"10px 14px", borderRadius:8, marginBottom:24, wordBreak:"break-all", border:"1px solid #D1D9CF" }}>
              <div style={{ fontSize:11, color:"#287A68", fontWeight:600, marginBottom:4 }}>BLOCKCHAIN TX</div>
              {success.tx_hash}
            </div>
          : <div style={{ fontSize:13, color:"#9CA3AF", background:"#F8F7F2", padding:"10px 14px", borderRadius:8, marginBottom:24 }}>
              Stored off-chain — blockchain node not connected.
            </div>}
        <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
          <button className="btn btn-primary" onClick={() => navigate(`/properties/${success.id}`)}>View Property</button>
          <button className="btn btn-ghost" onClick={() => { setSuccess(null); setForm({ title:"", location:"", area:"", description:"", ownerNote:"" }); setStep(0); }}>Register Another</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page-content">
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily:"Manrope,sans-serif", fontSize:22, fontWeight:800, marginBottom:3 }}>Register Land</h1>
          <p style={{ fontSize:14, color:"#6B7280" }}>Submit your land details for officer review and blockchain registration.</p>
        </div>

        {/* Stepper */}
        <div style={{ display:"flex", alignItems:"center", background:"white", borderRadius:14, padding:"20px 32px", border:"1px solid #EAEDEA", marginBottom:24 }}>
          {STEPS.map((label, i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
                <div style={{
                  width:34, height:34, borderRadius:"50%",
                  background: i < step ? "#287A68" : i === step ? "#173F35" : "transparent",
                  border:`2px solid ${i < step ? "#287A68" : i === step ? "#173F35" : "#DDE3DC"}`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:12, fontWeight:700, color: i <= step ? "white" : "#9CA3AF", transition:"all 0.2s"
                }}>
                  {i < step ? <Ico d={ic.check} size={13} /> : i + 1}
                </div>
                <span style={{ fontSize:11, fontWeight: i === step ? 600 : 400, color: i === step ? "#173F35" : "#9CA3AF", whiteSpace:"nowrap" }}>{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex:1, height:2, background: i < step ? "#287A68" : "#EAEDEA", margin:"0 10px", marginBottom:18 }} />
              )}
            </div>
          ))}
        </div>

        {/* Two-column layout: form + live summary */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 340px", gap:20, alignItems:"start" }}>

          {/* ── Form card ─────────────────────────────────────────────────── */}
          <div style={{ background:"white", border:"1px solid #EAEDEA", borderRadius:14, overflow:"hidden" }}>
            <div style={{ padding:"16px 24px", borderBottom:"1px solid #EAEDEA", fontFamily:"Manrope,sans-serif", fontWeight:700, fontSize:15 }}>
              {["Land Information","Owner Details","Document Upload","Review & Submit"][step]}
            </div>
            <div style={{ padding:28 }}>
              {error && (
                <div style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 14px", borderRadius:8, background:"#FEF2F2", border:"1px solid #FCA5A5", color:"#B91C1C", fontSize:13, marginBottom:20 }}>
                  <Ico d={ic.info} size={15} />{error}
                </div>
              )}

              <form onSubmit={step < 3 ? (e) => { e.preventDefault(); nextStep(); } : handleSubmit} noValidate>

                {step === 0 && <>
                  <div style={{ marginBottom:18 }}>
                    <label style={{ display:"block", fontSize:13, fontWeight:500, color:"#374151", marginBottom:6 }}>Property Title <span style={{ color:"#DC2626" }}>*</span></label>
                    <input className="form-input" placeholder="e.g. Plot 24 – Andheri West, Block A" value={form.title} onChange={set("title")} />
                  </div>
                  <div style={{ marginBottom:18 }}>
                    <label style={{ display:"block", fontSize:13, fontWeight:500, color:"#374151", marginBottom:6 }}>Location / Address <span style={{ color:"#DC2626" }}>*</span></label>
                    <input className="form-input" placeholder="e.g. Andheri West, Mumbai" value={form.location} onChange={set("location")} />
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:18 }}>
                    <div>
                      <label style={{ display:"block", fontSize:13, fontWeight:500, color:"#374151", marginBottom:6 }}>Area (m²) <span style={{ color:"#DC2626" }}>*</span></label>
                      <input className="form-input" type="number" placeholder="e.g. 150" min="0" step="any" value={form.area} onChange={set("area")} />
                    </div>
                    <div>
                      <label style={{ display:"block", fontSize:13, fontWeight:500, color:"#374151", marginBottom:6 }}>Property Type</label>
                      <select className="form-select">
                        <option>Residential Plot</option>
                        <option>Agricultural Land</option>
                        <option>Commercial Plot</option>
                        <option>Industrial Land</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ display:"block", fontSize:13, fontWeight:500, color:"#374151", marginBottom:6 }}>Description</label>
                    <textarea className="form-textarea" placeholder="Survey number, boundary details, landmark references…" value={form.description} onChange={set("description")} />
                  </div>
                </>}

                {step === 1 && <>
                  <div style={{ padding:"14px 16px", background:"#F0FDF4", borderRadius:9, border:"1px solid #BBF7D0", marginBottom:20, display:"flex", gap:10 }}>
                    <Ico d={ic.info} size={16} style={{ color:"#16A34A", marginTop:1 }} />
                    <p style={{ fontSize:13, color:"#166534", margin:0, lineHeight:1.6 }}>
                      Your account is automatically set as the property owner. Your wallet address (if configured) is used for on-chain registration.
                    </p>
                  </div>
                  <div>
                    <label style={{ display:"block", fontSize:13, fontWeight:500, color:"#374151", marginBottom:6 }}>Additional Ownership Notes</label>
                    <textarea className="form-textarea" placeholder="Joint ownership details, inherited from, purchase reference…" value={form.ownerNote} onChange={set("ownerNote")} />
                  </div>
                </>}

                {step === 2 && (
                  <div>
                    <div
                      style={{ border:"2px dashed #DDE3DC", borderRadius:10, padding:"36px 24px", textAlign:"center", cursor:"pointer", transition:"border-color 0.15s, background 0.15s", marginBottom:16 }}
                      onClick={() => document.getElementById("doc-upload")?.click()}
                      onMouseOver={e => { e.currentTarget.style.borderColor="#287A68"; e.currentTarget.style.background="#F0FDF4"; }}
                      onMouseOut={e  => { e.currentTarget.style.borderColor="#DDE3DC"; e.currentTarget.style.background="transparent"; }}
                    >
                      <div style={{ width:48, height:48, background:"#E9EFE7", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px", color:"#8DA99B" }}>
                        <Ico d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M17 8l-5-5-5 5 M12 3v12" size={22} />
                      </div>
                      <p style={{ fontWeight:600, fontSize:14, marginBottom:4, color:"#111827" }}>
                        {docFile ? docFile.name : "Click to upload documents"}
                      </p>
                      <p style={{ fontSize:12, color:"#9CA3AF" }}>Title deed, sale agreement, survey map — PDF, PNG, JPG, DOCX · max 16 MB</p>
                      <input id="doc-upload" type="file" accept=".pdf,.png,.jpg,.jpeg,.docx" style={{ display:"none" }} onChange={e => setDocFile(e.target.files[0] || null)} />
                    </div>
                    <p style={{ fontSize:12, color:"#9CA3AF", padding:"10px 14px", background:"#F8F7F2", borderRadius:7, border:"1px solid #EAEDEA" }}>
                      Documents can also be uploaded later from the Documents page after registration.
                    </p>
                  </div>
                )}

                {step === 3 && (
                  <div>
                    <div style={{ background:"#F8F7F2", borderRadius:10, border:"1px solid #EAEDEA", overflow:"hidden", marginBottom:20 }}>
                      {[
                        ["Property Title", form.title],
                        ["Location",       form.location],
                        ["Area",           form.area ? `${parseFloat(form.area).toLocaleString("en-IN")} m²` : "—"],
                        ["Description",    form.description || "—"],
                        ["Notes",          form.ownerNote || "—"],
                        ["Document",       docFile ? docFile.name : "Not uploaded"],
                      ].map(([k, v]) => (
                        <div key={k} style={{ display:"flex", padding:"12px 18px", borderBottom:"1px solid #EAEDEA", gap:16 }}>
                          <span style={{ fontSize:13, color:"#9CA3AF", width:130, flexShrink:0 }}>{k}</span>
                          <span style={{ fontSize:13, fontWeight:500, color:"#111827" }}>{v}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ padding:"12px 16px", background:"rgba(23,63,53,0.04)", borderRadius:8, border:"1px solid rgba(23,63,53,0.1)", fontSize:13, color:"#374151" }}>
                      <strong>What happens next:</strong> A Land Officer will verify your documents and approve the registration. Once approved, the record is permanently written to the blockchain.
                    </div>
                  </div>
                )}

                <div style={{ display:"flex", gap:10, marginTop:24 }}>
                  {step > 0 && <button type="button" className="btn btn-ghost" onClick={() => { setStep(s => s - 1); setError(""); }}>Back</button>}
                  <button type="submit" className="btn btn-primary" style={{ flex:1, justifyContent:"center" }} disabled={busy}>
                    {busy
                      ? <><div style={{ width:14, height:14, border:"2px solid rgba(255,255,255,0.4)", borderTopColor:"white", borderRadius:"50%", animation:"spin 0.6s linear infinite" }} />&nbsp;Submitting…</>
                      : step < 3 ? "Continue →" : "Submit for Review"
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* ── Live summary card ────────────────────────────────────────── */}
          <div style={{ position:"sticky", top:80, display:"flex", flexDirection:"column", gap:16 }}>
            <div style={{ background:"white", border:"1px solid #EAEDEA", borderRadius:14, overflow:"hidden" }}>
              <div style={{ padding:"14px 20px", borderBottom:"1px solid #EAEDEA", background:"linear-gradient(135deg,#173F35 0%,#1E5445 100%)" }}>
                <div style={{ fontFamily:"Manrope,sans-serif", fontWeight:700, fontSize:13, color:"white" }}>Live Preview</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", marginTop:2 }}>Updates as you type</div>
              </div>
              <div style={{ padding:20 }}>
                {/* Cadastral mini-sketch */}
                <div style={{ background:"linear-gradient(135deg,#0F2B23,#173F35)", borderRadius:9, padding:16, marginBottom:16, position:"relative", overflow:"hidden" }}>
                  <div style={{ position:"absolute", inset:0, opacity:0.07, backgroundImage:"linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)", backgroundSize:"16px 16px" }}/>
                  <svg viewBox="0 0 160 100" style={{ width:"100%", opacity:0.6 }}>
                    <rect x="10" y="10" width="60" height="45" rx="2" fill="rgba(40,122,104,0.4)" stroke="#287A68" strokeWidth="1.5"/>
                    <rect x="78" y="10" width="72" height="80" rx="2" fill="none" stroke="#287A68" strokeWidth="1"/>
                    <rect x="10" y="63" width="60" height="27" rx="2" fill="none" stroke="#287A68" strokeWidth="1"/>
                    <line x1="0" y1="55" x2="160" y2="55" stroke="#287A68" strokeWidth="2"/>
                    <line x1="72" y1="0" x2="72" y2="100" stroke="#287A68" strokeWidth="2"/>
                    <circle cx="40" cy="35" r="4" fill="#6FD5BF"/>
                    <circle cx="40" cy="35" r="8" fill="none" stroke="#6FD5BF" strokeWidth="1" opacity="0.5"/>
                  </svg>
                  <div style={{ textAlign:"center", marginTop:8 }}>
                    <div style={{ fontFamily:"monospace", fontSize:10, color:"#6FD5BF" }}>
                      {form.title ? `PLT-NEW` : "PLT-????"}
                    </div>
                  </div>
                </div>

                {[
                  ["Title",    form.title    || "—"],
                  ["Location", form.location || "—"],
                  ["Area",     form.area ? `${parseFloat(form.area).toLocaleString("en-IN")} m²` : "—"],
                ].map(([k, v]) => (
                  <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #F3F4F6" }}>
                    <span style={{ fontSize:12, color:"#9CA3AF" }}>{k}</span>
                    <span style={{ fontSize:12, fontWeight:500, color:"#111827", textAlign:"right", maxWidth:160, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{v}</span>
                  </div>
                ))}

                <div style={{ marginTop:14 }}>
                  <div style={{ fontSize:11, fontWeight:600, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 }}>After Approval</div>
                  {["Written to blockchain","SHA-256 document hash","Immutable ownership record"].map(f => (
                    <div key={f} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                      <div style={{ width:16, height:16, borderRadius:"50%", background:"rgba(40,122,104,0.12)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <Ico d={ic.check} size={9} style={{ color:"#287A68" }} />
                      </div>
                      <span style={{ fontSize:12, color:"#4B5563" }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Progress indicator */}
            <div style={{ background:"white", border:"1px solid #EAEDEA", borderRadius:14, padding:"16px 20px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                <span style={{ fontSize:12, color:"#9CA3AF" }}>Completion</span>
                <span style={{ fontSize:12, fontWeight:600, color:"#173F35" }}>{Math.round(((step + (step === 3 ? 1 : 0)) / 4) * 100)}%</span>
              </div>
              <div style={{ height:6, background:"#F3F4F6", borderRadius:3, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${((step + (step === 3 ? 1 : 0)) / 4) * 100}%`, background:"#287A68", borderRadius:3, transition:"width 0.4s ease" }}/>
              </div>
              <div style={{ fontSize:11, color:"#9CA3AF", marginTop:6 }}>Step {step + 1} of {STEPS.length}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
