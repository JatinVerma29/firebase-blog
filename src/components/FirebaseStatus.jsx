// src/components/FirebaseStatus.jsx
import { useState, useEffect } from "react";
import { db, isFirebaseConfigured } from "../firebase/config";
import { collection, getDocs, limit, query } from "firebase/firestore";

export default function FirebaseStatus() {
  const [status, setStatus] = useState("checking");
  const [visible, setVisible] = useState(false); // ✅ hidden by default

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setStatus("demo");
      setVisible(true); // only show if not configured
      return;
    }

    const check = async () => {
      try {
        const q = query(collection(db, "posts"), limit(1));
        await getDocs(q);
        setStatus("connected");
        setVisible(false); // ✅ connected = silent, no banner
      } catch (err) {
        setStatus("error");
        setVisible(true); // ✅ only show on actual error
      }
    };
    check();
  }, []);

  if (!visible) return null;

  const configs = {
    demo: {
      bg: "#1c1917", color: "#fbbf24", icon: "⚡",
      label: "Demo Mode — Firebase not configured",
      detail: "Paste your Firebase config in src/firebase/config.js to enable real-time features.",
    },
    error: {
      bg: "#450a0a", color: "#fca5a5", icon: "❌",
      label: "Could not connect to database",
      detail: "Check your Firebase config or internet connection.",
    },
  };

  const c = configs[status] || configs.error;

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
        {c.detail && (
          <span style={{ opacity: 0.65, fontWeight: 400, fontFamily: "var(--font-mono)", fontSize: "0.76rem" }}>
            — {c.detail}
          </span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {status === "demo" && (
          <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer"
            style={{ background: "#f5c518", color: "#000", padding: "4px 12px", borderRadius: 6, fontSize: "0.76rem", fontWeight: 700, textDecoration: "none" }}>
            Setup Firebase →
          </a>
        )}
        {status === "error" && (
          <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer"
            style={{ background: "#ef4444", color: "#fff", padding: "4px 12px", borderRadius: 6, fontSize: "0.76rem", fontWeight: 700, textDecoration: "none" }}>
            Fix in Console →
          </a>
        )}
        <button onClick={() => setVisible(false)}
          style={{ background: "transparent", border: "none", color: c.color, cursor: "pointer", fontSize: "1rem", opacity: 0.6, padding: "2px 6px" }}>
          ✕
        </button>
      </div>
    </div>
  );
}