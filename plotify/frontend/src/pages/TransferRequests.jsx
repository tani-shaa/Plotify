import { useEffect, useState, useCallback } from "react";
import { getTransfers, approveTransfer, rejectTransfer, requestTransfer, getProperties } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { PageSkeleton } from "../components/UI/Skeleton";

const Ico = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d={d} />
  </svg>
);
const ic = {
  plus:     "M12 5v14 M5 12h14",
  check:    "M20 6 9 17l-5-5",
  x:        "M18 6 6 18 M6 6l12 12",
  transfer: "M7 16V4m0 0L3 8m4-4 4 4 M17 8v12m0 0 4-4m-4 4-4-4",
  info:     "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 16v-4 M12 8h.01",
  copy:     "M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-2 M10 2h4a2 2 0 0 1 2 2v2H8V4a2 2 0 0 1 2-2z",
};

const STATUS = {
  pending:  { bg:"#FEF3C7", color:"#92400E", label:"Pending" },
  approved: { bg:"#DCFCE7", color:"#166534", label:"Approved" },
  rejected: { bg:"#FEE2E2", color:"#991B1B", label:"Rejected" },
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}) : "—";

function TxPill({ hash }) {
  const [copied, setCopied] = useState(false);
  if (!hash) return <span style={{ fontSize:11, color:"#D1D5DB", fontStyle:"italic" }}>—</span>;
  const copy = async (e) => { e.stopPropagation(); await navigator.clipboard.writeText(hash); setCopied(true); setTimeout(()=>setCopied(false),1800); };
  return (
    <span onClick={copy} title={copied?"Copied!":hash} style={{ display:"inline-flex", alignItems:"center", gap:4, fontFamily:"monospace", fontSize:11, color:"#287A68", background:"#E9EFE7", padding:"3px 8px", borderRadius:4, cursor:"pointer", border:"1px solid #D1D9CF" }}>
      {hash.slice(0,8)}… <Ico d={ic.copy} size={10} />
      {copied && <span style={{ color:"#16A34A", fontFamily:"sans-serif" }}>✓</span>}
    </span>
  );
}

export default function TransferRequests() {
  const { isAdmin, user } = useAuth();
  const [transfers,    setTransfers]    = useState([]);
  const [myProps,      setMyProps]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm,     setShowForm]     = useState(false);
  const [confirm,      setConfirm]      = useState(null);
  const [toast,        setToast]        = useState(null);
  const [form,         setForm]         = useState({ property_id:"", to_username:"", note:"" });
  const [formBusy,     setFormBusy]     = useState(false);
  const [formErr,      setFormErr]      = useState("");

  const addToast = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),4000); };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [txRes, propRes] = await Promise.all([getTransfers(), getProperties({ owner_id: user?.id })]);
      setTransfers(txRes.data);
      setMyProps(propRes.data.filter(p => p.status === "active"));
    } finally { setLoading(false); }
  }, [user?.id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleAction = async () => {
    if (!confirm) return;
    const { id, action } = confirm;
    setConfirm(null);
    try {
      if (action === "approve") { await approveTransfer(id); addToast("Transfer approved and recorded on-chain."); }
      else                      { await rejectTransfer(id);  addToast("Transfer rejected.", "warning"); }
      fetchAll();
    } catch (err) { addToast(err.response?.data?.error || "Action failed.", "error"); }
  };

  const handleRequest = async (e) => {
    e.preventDefault();
    setFormErr("");
    if (!form.property_id || !form.to_username) { setFormErr("Property and recipient are required."); return; }
    setFormBusy(true);
    try {
      await requestTransfer({ property_id:parseInt(form.property_id), to_username:form.to_username.trim(), note:form.note.trim()||undefined });
      setShowForm(false);
      setForm({ property_id:"", to_username:"", note:"" });
      addToast("Transfer request submitted for review.");
      fetchAll();
    } catch (err) { setFormErr(err.response?.data?.error || "Failed to submit."); }
    finally { setFormBusy(false); }
  };

  if (loading) return <PageSkeleton />;

  const counts = {
    all:      transfers.length,
    pending:  transfers.filter(t => t.status === "pending").length,
    approved: transfers.filter(t => t.status === "approved").length,
    rejected: transfers.filter(t => t.status === "rejected").length,
  };

  const filtered = statusFilter === "all" ? transfers : transfers.filter(t => t.status === statusFilter);

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ fontFamily:"Manrope,sans-serif", fontSize:22, fontWeight:800, marginBottom:3 }}>Transfer Requests</h1>
          <p style={{ fontSize:13, color:"#9CA3AF" }}>Manage property ownership transfer requests</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setFormErr(""); }}>
          <Ico d={ic.plus} size={14} /> New Request
        </button>
      </div>

      {/* Summary chips */}
      <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
        {[["all","All",counts.all,"#173F35"],["pending","Pending",counts.pending,"#D97706"],["approved","Approved",counts.approved,"#16A34A"],["rejected","Rejected",counts.rejected,"#DC2626"]].map(([s,l,n,c]) => (
          <button key={s} onClick={() => setStatusFilter(s)} style={{
            display:"flex", alignItems:"center", gap:6,
            padding:"7px 14px", borderRadius:20, border:"1.5px solid", cursor:"pointer", fontSize:13, fontWeight:500, transition:"all 0.12s",
            borderColor: statusFilter===s ? c : "#DDE3DC",
            background:  statusFilter===s ? c : "white",
            color:       statusFilter===s ? "white" : "#6B7280",
          }}>
            {l}
            <span style={{ fontFamily:"Manrope,sans-serif", fontWeight:700, fontSize:12, background: statusFilter===s ? "rgba(255,255,255,0.25)" : "#F3F4F6", padding:"1px 7px", borderRadius:10, color: statusFilter===s ? "white" : c }}>
              {n}
            </span>
          </button>
        ))}
      </div>

      {/* New request form */}
      {showForm && (
        <div style={{ background:"white", border:"1px solid #EAEDEA", borderRadius:14, marginBottom:20, overflow:"hidden" }}>
          <div style={{ padding:"14px 20px", borderBottom:"1px solid #EAEDEA", fontFamily:"Manrope,sans-serif", fontWeight:700, fontSize:14 }}>
            Request Ownership Transfer
          </div>
          <div style={{ padding:24 }}>
            {formErr && <div style={{ padding:"10px 14px", borderRadius:7, background:"#FEF2F2", border:"1px solid #FCA5A5", color:"#B91C1C", fontSize:13, marginBottom:16, display:"flex", gap:8, alignItems:"center" }}><Ico d={ic.info} size={14} />{formErr}</div>}
            <form onSubmit={handleRequest}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
                <div>
                  <label className="form-label">Property</label>
                  <select className="form-select" value={form.property_id} onChange={e => setForm(f=>({...f,property_id:e.target.value}))}>
                    <option value="">— Select —</option>
                    {myProps.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Recipient Username</label>
                  <input className="form-input" placeholder="e.g. rajesh_kumar" value={form.to_username} onChange={e => setForm(f=>({...f,to_username:e.target.value}))} />
                </div>
                <div>
                  <label className="form-label">Note (optional)</label>
                  <input className="form-input" placeholder="e.g. Sale ₹45L" value={form.note} onChange={e => setForm(f=>({...f,note:e.target.value}))} />
                </div>
              </div>
              <div style={{ display:"flex", gap:10, marginTop:16 }}>
                <button type="submit" className="btn btn-primary btn-sm" disabled={formBusy}>{formBusy?"Submitting…":"Submit Request"}</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ background:"white", border:"1px solid #EAEDEA", borderRadius:14, overflow:"hidden" }}>
        {filtered.length === 0 ? (
          <div style={{ padding:"48px 24px", textAlign:"center" }}>
            <div style={{ width:52, height:52, background:"#E9EFE7", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px", color:"#8DA99B" }}>
              <Ico d={ic.transfer} size={24} />
            </div>
            <p style={{ fontWeight:600, fontSize:14, marginBottom:4 }}>No {statusFilter !== "all" ? statusFilter : ""} transfer requests</p>
            <p style={{ fontSize:13, color:"#9CA3AF" }}>No requests match this filter.</p>
          </div>
        ) : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ background:"#F8F7F2" }}>
                  {["Transfer ID","Property","From","To","Status","Requested","Tx Hash",isAdmin?"Actions":""].filter(Boolean).map(h => (
                    <th key={h} style={{ padding:"10px 16px", textAlign:"left", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em", color:"#9CA3AF", borderBottom:"1px solid #EAEDEA", whiteSpace:"nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, i) => {
                  const st = STATUS[t.status] || STATUS.pending;
                  return (
                    <tr key={t.id} style={{ borderBottom:"1px solid #F3F4F6" }}
                      onMouseOver={e => e.currentTarget.style.background="#F8F7F2"}
                      onMouseOut={e  => e.currentTarget.style.background="transparent"}
                    >
                      <td style={{ padding:"13px 16px", fontFamily:"monospace", fontSize:11, color:"#9CA3AF" }}>TRF-{String(t.id).padStart(4,"0")}</td>
                      <td style={{ padding:"13px 16px", fontWeight:500, fontSize:13 }}>{t.property_title}</td>
                      <td style={{ padding:"13px 16px", fontSize:13, color:"#6B7280" }}>{t.from_username}</td>
                      <td style={{ padding:"13px 16px", fontSize:13, color:"#6B7280" }}>{t.to_username}</td>
                      <td style={{ padding:"13px 16px" }}>
                        <span style={{ padding:"3px 10px", borderRadius:4, fontSize:12, fontWeight:500, background:st.bg, color:st.color }}>
                          {st.label}
                        </span>
                      </td>
                      <td style={{ padding:"13px 16px", fontSize:12, color:"#9CA3AF", whiteSpace:"nowrap" }}>
                        {fmtDate(t.requested_at)}
                      </td>
                      <td style={{ padding:"13px 16px" }}>
                        {t.status === "rejected"
                          ? <span title={t.note || "No reason provided"} style={{ fontSize:11, color:"#DC2626", fontStyle:"italic", cursor:"help", borderBottom:"1px dashed #FCA5A5" }}>
                              Rejected {t.note ? `— "${t.note.slice(0,20)}…"` : ""}
                            </span>
                          : <TxPill hash={t.tx_hash} />}
                      </td>
                      {isAdmin && (
                        <td style={{ padding:"13px 16px" }}>
                          {t.status === "pending" && (
                            <div style={{ display:"flex", gap:6 }}>
                              <button className="btn btn-sm" style={{ background:"rgba(22,163,74,0.08)", color:"#16A34A", border:"1px solid rgba(22,163,74,0.25)", padding:"5px 12px" }}
                                onClick={() => setConfirm({id:t.id, action:"approve"})}>
                                <Ico d={ic.check} size={13} /> Approve
                              </button>
                              <button className="btn btn-sm" style={{ background:"#FEF2F2", color:"#DC2626", border:"1px solid #FECACA", padding:"5px 12px" }}
                                onClick={() => setConfirm({id:t.id, action:"reject"})}>
                                <Ico d={ic.x} size={13} /> Reject
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirm dialog */}
      {confirm && (
        <>
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:1000 }} onClick={() => setConfirm(null)} />
          <div style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", background:"white", borderRadius:14, padding:32, zIndex:1001, minWidth:380, boxShadow:"0 24px 48px rgba(0,0,0,0.18)" }}>
            <h3 style={{ fontFamily:"Manrope,sans-serif", fontWeight:800, fontSize:18, marginBottom:10 }}>
              {confirm.action==="approve" ? "Approve Transfer?" : "Reject Transfer?"}
            </h3>
            <p style={{ fontSize:14, color:"#6B7280", marginBottom:24 }}>
              {confirm.action==="approve"
                ? "This will execute the ownership transfer on-chain. This action cannot be undone."
                : "This will reject the request. The property stays with the current owner."}
            </p>
            <div style={{ display:"flex", gap:10 }}>
              <button className="btn btn-ghost" style={{ flex:1, justifyContent:"center" }} onClick={() => setConfirm(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex:1, justifyContent:"center", background: confirm.action==="approve" ? "#287A68" : "#DC2626" }} onClick={handleAction}>
                {confirm.action==="approve" ? "Approve" : "Reject"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", bottom:24, right:24, zIndex:9999, padding:"14px 18px", background:"white", borderRadius:10, boxShadow:"0 8px 24px rgba(0,0,0,0.12)", border:"1px solid #EAEDEA", display:"flex", alignItems:"center", gap:10, fontSize:13, minWidth:260, animation:"fadeIn 0.2s ease" }}>
          <div style={{ width:8, height:8, borderRadius:"50%", background: toast.type==="error"?"#DC2626":toast.type==="warning"?"#D97706":"#16A34A", flexShrink:0 }}/>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
