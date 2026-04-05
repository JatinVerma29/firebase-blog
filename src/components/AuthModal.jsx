// src/components/AuthModal.jsx
import { useState } from "react";
import {
  signInWithEmail, signUpWithEmail,
  signInWithGoogle, resetPassword,
} from "../firebase/auth";
import AvatarPicker from "./AvatarPicker";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase/config";

export default function AuthModal({ onClose, onSuccess, fullPage = false }) {
  const [tab, setTab]             = useState("login");
  const [step, setStep]           = useState(1);
  const [name, setName]           = useState("");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [resetSent, setResetSent] = useState(false);

  const clear = () => setError("");
  const switchTab = (t) => { setTab(t); setStep(1); clear(); setResetSent(false); };

  const handleNextStep = () => {
    clear();
    if (!name.trim())        { setError("Name is required.");               return; }
    if (!email)              { setError("Email is required.");               return; }
    if (password.length < 6) { setError("Password must be 6+ characters."); return; }
    setStep(2);
  };

  const handleSignUp = async () => {
    clear(); setLoading(true);
    try {
      const userCred = await signUpWithEmail(email, password, name.trim(), avatarUrl);
      if (userCred?.user) {
        await setDoc(doc(db, "users", userCred.user.uid), {
          displayName: name.trim(), photoURL: avatarUrl || "",
          email, followers: [], following: [], createdAt: new Date().toISOString(),
        }, { merge: true });
      }
      onSuccess?.(); onClose();
    } catch (e) {
      const msgs = {
        "auth/email-already-in-use": "Email already registered. Try logging in.",
        "auth/invalid-email":        "Invalid email address.",
        "auth/weak-password":        "Password must be at least 6 characters.",
      };
      setError(msgs[e.code] || e.message); setStep(1);
    }
    setLoading(false);
  };

  const handleLogin = async () => {
    clear();
    if (!email) { setError("Email is required."); return; }
    setLoading(true);
    try {
      await signInWithEmail(email, password);
      onSuccess?.(); onClose();
    } catch (e) {
      const msgs = {
        "auth/user-not-found":    "No account found with this email.",
        "auth/wrong-password":    "Incorrect password.",
        "auth/invalid-email":     "Invalid email address.",
        "auth/too-many-requests": "Too many attempts. Please try again later.",
      };
      setError(msgs[e.code] || e.message);
    }
    setLoading(false);
  };

  const handleReset = async () => {
    clear();
    if (!email) { setError("Email is required."); return; }
    setLoading(true);
    try { await resetPassword(email); setResetSent(true); }
    catch (e) { setError(e.message); }
    setLoading(false);
  };

  const handleGoogle = async () => {
    clear(); setLoading(true);
    try { await signInWithGoogle(); onSuccess?.(); onClose(); }
    catch (e) { setError(e.message); }
    setLoading(false);
  };

  const handleSubmit = () => {
    if (tab === "login")       handleLogin();
    else if (tab === "signup") step === 1 ? handleNextStep() : handleSignUp();
    else                       handleReset();
  };

  // Shared form content
  const formContent = (
    <div style={{ width: "100%", maxWidth: 420 }}>
      {/* Brand */}
      <div style={s.brand}>
        <span style={s.brandName}>AERO<span style={{ color: "var(--blue)" }}>BLOG</span></span>
        <span style={s.brandDot} />
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        {["login", "signup"].map((t) => (
          <button key={t} style={{ ...s.tab, ...(tab === t ? s.tabActive : {}) }} onClick={() => switchTab(t)}>
            {t === "login" ? "Log In" : "Sign Up"}
          </button>
        ))}
      </div>

      {/* LOGIN */}
      {tab === "login" && (
        <>
          <h2 style={s.heading}>Welcome back</h2>
          <p style={s.sub}>Sign in to publish, comment & join the community.</p>
          <button style={s.googleBtn} onClick={handleGoogle} disabled={loading}>
            <GoogleIcon /> Continue with Google
          </button>
          <div style={s.divider}><span>or</span></div>
          <div style={s.fields}>
            <Field label="Email" type="email" placeholder="you@example.com" value={email} onChange={setEmail} onEnter={handleSubmit} />
            <Field label={<>Password <button style={s.forgotBtn} onClick={() => switchTab("reset")}>Forgot?</button></>}
              type="password" placeholder="••••••••" value={password} onChange={setPassword} onEnter={handleSubmit} />
          </div>
          {error && <div style={s.error}>⚠️ {error}</div>}
          <button style={{ ...s.submitBtn, opacity: loading ? 0.7 : 1 }} onClick={handleSubmit} disabled={loading}>
            {loading ? <><Spinner /> Working…</> : "Log In →"}
          </button>
          <p style={s.switchText}>No account? <button style={s.switchBtn} onClick={() => switchTab("signup")}>Sign up free</button></p>
        </>
      )}

      {/* RESET */}
      {tab === "reset" && (
        <>
          <h2 style={s.heading}>Reset password</h2>
          <p style={s.sub}>We'll email you a password reset link.</p>
          <div style={s.fields}>
            <Field label="Email" type="email" placeholder="you@example.com" value={email} onChange={setEmail} onEnter={handleSubmit} />
          </div>
          {error && <div style={s.error}>⚠️ {error}</div>}
          {resetSent && <div style={s.success}>✅ Reset link sent! Check your inbox.</div>}
          {!resetSent && (
            <button style={{ ...s.submitBtn, opacity: loading ? 0.7 : 1 }} onClick={handleReset} disabled={loading}>
              {loading ? <><Spinner /> Sending…</> : "Send Reset Link →"}
            </button>
          )}
          <p style={s.switchText}><button style={s.switchBtn} onClick={() => switchTab("login")}>← Back to login</button></p>
        </>
      )}

      {/* SIGNUP STEP 1 */}
      {tab === "signup" && step === 1 && (
        <>
          <h2 style={s.heading}>Create account</h2>
          <p style={s.sub}>Join AERO BLOG — it's free forever.</p>
          <button style={s.googleBtn} onClick={handleGoogle} disabled={loading}>
            <GoogleIcon /> Continue with Google
          </button>
          <div style={s.divider}><span>or</span></div>
          <div style={s.fields}>
            <Field label="Display Name" placeholder="Your name" value={name} onChange={setName} onEnter={handleSubmit} />
            <Field label="Email" type="email" placeholder="you@example.com" value={email} onChange={setEmail} onEnter={handleSubmit} />
            <Field label="Password" type="password" placeholder="••••••••" value={password} onChange={setPassword} onEnter={handleSubmit} />
          </div>
          {error && <div style={s.error}>⚠️ {error}</div>}
          <button style={{ ...s.submitBtn, opacity: loading ? 0.7 : 1 }} onClick={handleSubmit} disabled={loading}>
            Next: Pick Avatar →
          </button>
          <p style={s.switchText}>Already a member? <button style={s.switchBtn} onClick={() => switchTab("login")}>Log in</button></p>
        </>
      )}

      {/* SIGNUP STEP 2 */}
      {tab === "signup" && step === 2 && (
        <>
          <div style={s.stepRow}>
            <div style={{ ...s.stepDot, background: "#e2e8f0" }} />
            <div style={{ ...s.stepDot, background: "var(--blue)" }} />
          </div>
          <h2 style={s.heading}>Pick your avatar</h2>
          <p style={s.sub}>Choose a preset or upload your own photo. You can always change it later.</p>
          <AvatarPicker selected={avatarUrl} onSelect={setAvatarUrl} uid={null} />
          {error && <div style={{ ...s.error, marginTop: 12 }}>⚠️ {error}</div>}
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button style={s.backBtn} onClick={() => { setStep(1); clear(); }}>← Back</button>
            <button style={{ ...s.submitBtn, flex: 1, marginTop: 0, opacity: loading ? 0.7 : 1 }} onClick={handleSignUp} disabled={loading}>
              {loading ? <><Spinner /> Creating account…</> : "Create Account →"}
            </button>
          </div>
          <p style={{ ...s.switchText, marginTop: 12 }}>
            <button style={s.switchBtn} onClick={() => handleSignUp()}>Skip — use default avatar</button>
          </p>
        </>
      )}
    </div>
  );

  // ── Full page mode (for /login route or mobile) ──
  if (fullPage) {
    return (
      <div style={fp.page}>
        {/* Left panel — branding */}
        <div style={fp.left}>
          <div style={fp.leftInner}>
            <div style={fp.bigLogo}>AERO<span style={{ color: "#60a5fa" }}>BLOG</span><span style={fp.bigDot} /></div>
            <p style={fp.tagline}>Ideas That Take Flight.</p>
            <p style={fp.desc}>Real-time publishing powered by Firebase + React — built for thinkers, writers, and innovators.</p>
            <div style={fp.pills}>
              {["✍️ Write", "💬 Comment", "📊 Analytics", "🤖 AI Tools"].map((f) => (
                <span key={f} style={fp.pill}>{f}</span>
              ))}
            </div>
          </div>
        </div>
        {/* Right panel — form */}
        <div style={fp.right}>
          <button style={fp.backBtn} onClick={onClose}>← Back to site</button>
          <div style={fp.formWrap}>{formContent}</div>
        </div>
      </div>
    );
  }

  // ── Modal mode (default) ──
  return (
    <div style={s.backdrop} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>
        <button style={s.closeBtn} onClick={onClose}>✕</button>
        {formContent}
      </div>
    </div>
  );
}

function Field({ label, type = "text", placeholder, value, onChange, onEnter }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.8rem", color: "#0c0c14", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {label}
      </label>
      <input type={type} placeholder={placeholder} value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
        style={{ padding: "11px 14px", border: "1.5px solid #e2e8f0", borderRadius: 9, fontFamily: "var(--font-body)", fontSize: "0.92rem", color: "#0c0c14", background: "#f8faff", outline: "none", transition: "border 0.2s", width: "100%" }}
        onFocus={(e) => (e.target.style.borderColor = "var(--blue)")}
        onBlur={(e)  => (e.target.style.borderColor = "#e2e8f0")} />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

function Spinner() {
  return <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />;
}

// ── Full page styles ───────────────────────────────────────────────────────
const fp = {
  page: {
    position: "fixed", inset: 0, zIndex: 300,
    display: "flex", background: "#fff",
  },
  left: {
    flex: 1, background: "linear-gradient(135deg,#0f172a 0%,#1d4ed8 60%,#3b82f6 100%)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 48,
    "@media(maxWidth:768px)": { display: "none" },
  },
  leftInner: { maxWidth: 400, color: "#fff" },
  bigLogo: { fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "2.5rem", letterSpacing: "-1px", display: "flex", alignItems: "center", gap: 4, marginBottom: 24 },
  bigDot: { width: 10, height: 10, background: "#f5c518", borderRadius: "50%", display: "inline-block", marginLeft: 4 },
  tagline: { fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "2rem", letterSpacing: "-0.5px", lineHeight: 1.2, marginBottom: 16, opacity: 0.95 },
  desc: { fontSize: "1rem", lineHeight: 1.7, opacity: 0.75, marginBottom: 28 },
  pills: { display: "flex", flexWrap: "wrap", gap: 8 },
  pill: { background: "rgba(255,255,255,0.15)", padding: "6px 14px", borderRadius: 99, fontSize: "0.82rem", fontFamily: "var(--font-display)", fontWeight: 600 },
  right: {
    width: "100%", maxWidth: 520, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", padding: "40px 32px",
    overflowY: "auto", position: "relative",
  },
  backBtn: {
    position: "absolute", top: 20, left: 20,
    background: "none", border: "none", color: "var(--blue)",
    fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.88rem",
    cursor: "pointer",
  },
  formWrap: { width: "100%", maxWidth: 420, paddingTop: 20 },
};

// ── Modal styles ───────────────────────────────────────────────────────────
const s = {
  backdrop: { position: "fixed", inset: 0, zIndex: 300, background: "rgba(12,12,20,0.7)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 },
  modal: { background: "#ffffff", borderRadius: 20, width: "100%", maxWidth: 480, padding: "40px 44px", position: "relative", animation: "slideDown 0.3s ease", maxHeight: "92vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.25)" },
  closeBtn: { position: "absolute", top: 16, right: 16, width: 34, height: 34, borderRadius: "50%", background: "#f1f5f9", border: "1px solid #e2e8f0", cursor: "pointer", fontSize: "0.9rem", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center" },
  brand: { display: "flex", alignItems: "center", gap: 4, marginBottom: 24 },
  brandName: { fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.3rem", color: "#0c0c14" },
  brandDot: { width: 8, height: 8, background: "#f5c518", borderRadius: "50%", animation: "pulse 2s ease-in-out infinite" },
  tabs: { display: "flex", background: "#f1f5f9", borderRadius: 10, padding: 4, gap: 4, marginBottom: 24 },
  tab: { flex: 1, padding: "8px 0", borderRadius: 8, border: "none", background: "transparent", color: "#64748b", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.88rem", cursor: "pointer", transition: "all 0.2s" },
  tabActive: { background: "#ffffff", color: "#0c0c14", boxShadow: "0 1px 6px rgba(0,0,0,0.08)" },
  stepRow: { display: "flex", gap: 6, marginBottom: 20 },
  stepDot: { height: 4, flex: 1, borderRadius: 99, transition: "background 0.3s" },
  heading: { fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 800, color: "#0c0c14", marginBottom: 6 },
  sub: { fontSize: "0.88rem", color: "#64748b", marginBottom: 24, lineHeight: 1.5 },
  googleBtn: { width: "100%", padding: "11px 0", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#f8faff", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9rem", color: "#0c0c14", cursor: "pointer", transition: "all 0.2s", marginBottom: 4 },
  divider: { display: "flex", alignItems: "center", gap: 12, margin: "16px 0", color: "#94a3b8", fontSize: "0.78rem" },
  fields: { display: "flex", flexDirection: "column", gap: 14, marginBottom: 8 },
  forgotBtn: { background: "none", border: "none", color: "var(--blue)", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-display)" },
  error: { background: "#fee2e2", color: "#dc2626", borderRadius: 8, padding: "10px 14px", fontSize: "0.83rem", fontFamily: "var(--font-display)", fontWeight: 600, marginBottom: 12 },
  success: { background: "#d1fae5", color: "#059669", borderRadius: 8, padding: "10px 14px", fontSize: "0.83rem", fontFamily: "var(--font-display)", fontWeight: 600, marginBottom: 12 },
  submitBtn: { width: "100%", padding: "13px 0", background: "var(--blue)", color: "#fff", border: "none", borderRadius: 10, marginTop: 8, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "opacity 0.2s" },
  backBtn: { padding: "13px 20px", background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: 10, marginTop: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", transition: "background 0.2s", flexShrink: 0 },
  switchText: { textAlign: "center", fontSize: "0.83rem", color: "#64748b", marginTop: 16, fontFamily: "var(--font-display)" },
  switchBtn: { background: "none", border: "none", color: "var(--blue)", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-display)", fontSize: "0.83rem" },
};