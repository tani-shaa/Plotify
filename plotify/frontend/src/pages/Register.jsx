import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Icon = ({ d, size = 18, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d={d} />
  </svg>
);
const icons = {
  location: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z",
  user:     "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
  mail:     "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6",
  phone:    "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.85 3.35A2 2 0 0 1 3.84 1.15h3a2 2 0 0 1 2 1.72c.127.96.36 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z",
  wallet:   "M21 12a2.98 2.98 0 0 0-.818-2H21 M21 14v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4",
  check:    "M20 6 9 17l-5-5",
  chevron:  "m6 9 6 6 6-6",
  info:     "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 16v-4 M12 8h.01",
};

// Cadastral map SVG (same as landing, lighter)
function CadastralMap() {
  return (
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.12 }} viewBox="0 0 1400 800" preserveAspectRatio="xMidYMid slice">
      <path d="M 0 220 L 1400 200" stroke="white" strokeWidth="8" opacity="0.6"/>
      <path d="M 0 480 L 1400 500" stroke="white" strokeWidth="8" opacity="0.6"/>
      <path d="M 320 0 L 280 800" stroke="white" strokeWidth="5" opacity="0.5"/>
      <path d="M 700 0 L 740 800" stroke="white" strokeWidth="5" opacity="0.5"/>
      <path d="M 1050 0 L 1020 800" stroke="white" strokeWidth="4" opacity="0.5"/>
      <rect x="40" y="30" width="220" height="160" rx="2" fill="none" stroke="white" strokeWidth="1.5"/>
      <rect x="40" y="230" width="220" height="210" rx="2" fill="none" stroke="white" strokeWidth="1.5"/>
      <rect x="300" y="35" width="160" height="150" rx="2" fill="white" fillOpacity="0.05" stroke="white" strokeWidth="1.5"/>
      <rect x="300" y="230" width="160" height="220" rx="2" fill="none" stroke="white" strokeWidth="1.5"/>
      <rect x="490" y="40" width="180" height="140" rx="2" fill="none" stroke="white" strokeWidth="1.5"/>
      <rect x="490" y="230" width="180" height="210" rx="2" fill="none" stroke="white" strokeWidth="1.5"/>
      <rect x="760" y="25" width="240" height="170" rx="2" fill="none" stroke="white" strokeWidth="1.5"/>
      <rect x="760" y="240" width="120" height="200" rx="2" fill="white" fillOpacity="0.04" stroke="white" strokeWidth="1.5"/>
      <rect x="900" y="240" width="120" height="200" rx="2" fill="none" stroke="white" strokeWidth="1.5"/>
      <rect x="1060" y="30" width="300" height="160" rx="2" fill="none" stroke="white" strokeWidth="1.5"/>
      <rect x="1060" y="240" width="140" height="200" rx="2" fill="none" stroke="white" strokeWidth="1.5"/>
      <rect x="1220" y="240" width="140" height="200" rx="2" fill="none" stroke="white" strokeWidth="1.5"/>
      <rect x="40" y="520" width="220" height="220" rx="2" fill="none" stroke="white" strokeWidth="1.5"/>
      <rect x="300" y="520" width="160" height="220" rx="2" fill="none" stroke="white" strokeWidth="1.5"/>
      <rect x="490" y="520" width="180" height="220" rx="2" fill="white" fillOpacity="0.04" stroke="white" strokeWidth="1.5"/>
      <rect x="760" y="520" width="240" height="220" rx="2" fill="none" stroke="white" strokeWidth="1.5"/>
      <rect x="1060" y="520" width="300" height="220" rx="2" fill="none" stroke="white" strokeWidth="1.5"/>
    </svg>
  );
}

export default function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ username:"", password:"", confirmPassword:"", email:"", phone:"", walletAddress:"" });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [busy, setBusy]   = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.username.trim() || form.username.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    if (!form.password || form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    const result = await signUp(form.username.trim(), form.password, form.walletAddress.trim() || undefined);
    setBusy(false);

    if (result.ok) navigate("/dashboard");
    else setError(result.error);
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--ivory)" }}>
      {/* ── LEFT PANEL (dark forest with map) ──────────────────────────────── */}
      <div style={{ flex: 1, background: "linear-gradient(135deg, #0F2B23 0%, #173F35 60%, #1E5445 100%)", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: 48 }}>
        <CadastralMap />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 30% 40%, rgba(111,213,191,0.08) 0%, transparent 60%)" }} />
        
        <div style={{ position: "relative", zIndex: 2, maxWidth: 480, color: "white" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40 }}>
            <div style={{ width: 48, height: 48, background: "rgba(40,122,104,0.3)", border: "1.5px solid rgba(40,122,104,0.6)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon d={icons.location} size={22} color="#6FD5BF" />
            </div>
            <div style={{ fontFamily: "Manrope", fontSize: 24, fontWeight: 800, color: "white" }}>Plotify</div>
          </div>

          <h1 style={{ fontFamily: "Manrope", fontSize: 32, fontWeight: 800, lineHeight: 1.2, marginBottom: 16 }}>
            Register your land.<br />
            Own it <em style={{ color: "#6FD5BF", fontStyle: "italic" }}>forever</em>.
          </h1>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, marginBottom: 40 }}>
            Create your citizen account and submit your first property. A land officer will review it within 48 hours.
          </p>

          {/* Features */}
          {[
            ["Permanent Records", "Once registered, ownership is written to the blockchain — immutable and public."],
            ["Instant Verification", "Anyone can verify your property's status and history, from anywhere."],
            ["Document Integrity", "SHA-256 hashes prove your uploaded documents haven't been altered."],
          ].map(([t, d]) => (
            <div key={t} style={{ display: "flex", gap: 14, marginBottom: 24 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(40,122,104,0.25)", border: "1px solid rgba(40,122,104,0.5)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon d={icons.check} size={14} color="#6FD5BF" />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{t}</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>{d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL (form) ─────────────────────────────────────────────── */}
      <div style={{ width: 560, display: "flex", flexDirection: "column", justifyContent: "center", padding: "48px 64px", background: "var(--white)" }}>
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontFamily: "Manrope", fontSize: 26, fontWeight: 800, marginBottom: 8 }}>Create Account</h2>
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
            Already have an account? <Link to="/login" style={{ color: "var(--forest)", fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
          </p>
        </div>

        {error && (
          <div style={{ padding: "12px 16px", borderRadius: 8, background: "#FEF2F2", border: "1px solid #FCA5A5", color: "#B91C1C", fontSize: 13, marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
            <Icon d={icons.info} size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Required fields */}
          <div className="form-group">
            <label className="form-label">
              Username <span style={{ color: "#DC2626" }}>*</span>
            </label>
            <div style={{ position: "relative" }}>
              <Icon d={icons.user} size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input className="form-input" style={{ paddingLeft: 44 }} placeholder="Choose a username" value={form.username} onChange={set("username")} autoFocus />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label">
                Password <span style={{ color: "#DC2626" }}>*</span>
              </label>
              <input className="form-input" type="password" placeholder="Min 6 characters" value={form.password} onChange={set("password")} />
            </div>
            <div className="form-group">
              <label className="form-label">
                Confirm Password <span style={{ color: "#DC2626" }}>*</span>
              </label>
              <input className="form-input" type="password" placeholder="Re-enter password" value={form.confirmPassword} onChange={set("confirmPassword")} />
            </div>
          </div>

          {/* Optional fields */}
          <div style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid var(--border-light)" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
              Optional Information
            </div>

            <div className="form-group">
              <label className="form-label">Email (optional)</label>
              <div style={{ position: "relative" }}>
                <Icon d={icons.mail} size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input className="form-input" style={{ paddingLeft: 44 }} type="email" placeholder="your@email.com" value={form.email} onChange={set("email")} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Phone (optional)</label>
              <div style={{ position: "relative" }}>
                <Icon d={icons.phone} size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input className="form-input" style={{ paddingLeft: 44 }} type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={set("phone")} />
              </div>
            </div>
          </div>

          {/* Advanced (wallet address) */}
          <button type="button" onClick={() => setShowAdvanced(!showAdvanced)}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 0", marginTop: 16, background: "none", border: "none", color: "var(--forest)", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "color 0.12s" }}>
            <Icon d={icons.chevron} size={14} style={{ transform: showAdvanced ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }} />
            Advanced Options
          </button>

          {showAdvanced && (
            <div style={{ marginTop: 16, padding: 16, background: "var(--soft-sage)", border: "1px solid var(--border)", borderRadius: 8 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Ethereum Wallet Address</label>
                <div style={{ position: "relative" }}>
                  <Icon d={icons.wallet} size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                  <input className="form-input" style={{ paddingLeft: 44, fontFamily: "monospace", fontSize: 13 }} placeholder="0x..." value={form.walletAddress} onChange={set("walletAddress")} />
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
                  Used for on-chain registration. Leave blank if you don't have one.
                </div>
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-xl" style={{ width: "100%", justifyContent: "center", marginTop: 28 }} disabled={busy}>
            {busy ? (
              <>
                <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                Creating account…
              </>
            ) : (
              <>
                Create Account
                <Icon d={icons.check} size={16} />
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: 24, fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
          By creating an account, you agree to Plotify's Terms of Use and Privacy Policy.
        </div>
      </div>
    </div>
  );
}
