// src/components/FirebaseStatus.jsx
// Shows a real-time Firebase connection banner at the top of the app
import { useState, useEffect } from "react";
import { db, isFirebaseConfigured } from "../firebase/config";
import { collection, getDocs, limit, query } from "firebase/firestore";

export default function FirebaseStatus() {
  const [status, setStatus] = useState("checking"); // checking | connected | demo | error
  const [projectId, setProjectId] = useState("");
  const [visible, setVisible] = useState(true);
  const [detail, setDetail] = useState("");

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setStatus("demo");
      setDetail("Paste your Firebase config in src/firebase/config.js to enable real-time features.");
      return;
    }

    // Try a real Firestore ping
    const check = async () => {
      try {
        const q = query(collection(db, "posts"), limit(1));
        await getDocs(q);
        // extract project from auth domain
        const pid = db.app.options.projectId || "your-project";
        setProjectId(pid);
        setStatus("connected");
        setDetail(`Connected to project: ${pid}`);
        // auto-hide after 6s
        setTimeout(() => setVisible(false), 6000);
      } catch (err) {
        setStatus("error");
        setDetail(err.message || "Could not reach Firestore.");
      }
    };
    check();
  }, []);

  if (!visible) return null;

  const configs = {
    checking: { bg: "#1e293b", color: "#94a3b8", icon: "⏳", label: "Checking Firebase connection…" },
    connected: { bg: "#064e3b", color: "#6ee7b7", icon: "✅", label: "Firebase Connected" },
    demo:      { bg: "#1c1917", color: "#fbbf24", icon: "⚡", label: "Demo Mode — Firebase not configured" },
    error:     { bg: "#450a0a", color: "#fca5a5", icon: "❌", label: "Firebase Error" },
  };

  const c = configs[status];

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999,
      background: c.bg, color: c.color,
      padding: "10px 20px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      fontSize: "0.82rem", fontFamily: "var(--font-display)",
      fontWeight: 600, letterSpacing: "0.01em",
      borderBottom: `1px solid ${c.color}22`,
      animation: "slideDown 0.4s ease",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: "1rem" }}>{c.icon}</span>
        <span>{c.label}</span>
        {detail && (
          <span style={{ opacity: 0.65, fontWeight: 400, fontFamily: "var(--font-mono)", fontSize: "0.76rem" }}>
            — {detail}
          </span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {status === "demo" && (
          <a
            href="https://console.firebase.google.com"
            target="_blank"
            rel="noreferrer"
            style={{
              background: "#f5c518", color: "#000",
              padding: "4px 12px", borderRadius: 6,
              fontSize: "0.76rem", fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Setup Firebase →
          </a>
        )}
        {status === "error" && (
          <a
            href="https://console.firebase.google.com"
            target="_blank"
            rel="noreferrer"
            style={{
              background: "#ef4444", color: "#fff",
              padding: "4px 12px", borderRadius: 6,
              fontSize: "0.76rem", fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Fix in Console →
          </a>
        )}
        <button
          onClick={() => setVisible(false)}
          style={{
            background: "transparent", border: "none",
            color: c.color, cursor: "pointer", fontSize: "1rem",
            opacity: 0.6, padding: "2px 6px",
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}