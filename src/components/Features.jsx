// src/components/Features.jsx
import { useState } from "react";

const features = [
  {
    icon: "⚡",
    title: "Real-time Sync",
    desc: "Firebase Firestore pushes every post to all readers instantly — no refresh, no polling. Pure reactive architecture.",
    color: "#dbeafe",
    accent: "#1d4ed8",
  },
  {
    icon: "🖼️",
    title: "Firebase Storage",
    desc: "Upload cover photos directly to Firebase Storage with drag-and-drop. Progress tracking, 5MB limit, global CDN delivery.",
    color: "#d1fae5",
    accent: "#059669",
  },
  {
    icon: "🔒",
    title: "Secure by Default",
    desc: "Firestore Security Rules, Firebase Auth, and App Check protect every operation. Enterprise-grade without the complexity.",
    color: "#ede9fe",
    accent: "#7c3aed",
  },
  {
    icon: "📈",
    title: "Scalable Architecture",
    desc: "Cloud-native, serverless. AERO BLOG scales from 10 to 10 million readers with zero infrastructure changes.",
    color: "#fee2e2",
    accent: "#dc2626",
  },
  {
    icon: "🔍",
    title: "Live Search",
    desc: "Instant client-side search across all posts — titles, content, authors, and categories with zero latency.",
    color: "#fef3c7",
    accent: "#d97706",
  },
  {
    icon: "🎯",
    title: "Agile-First Design",
    desc: "Built on agile methodologies — iterative publishing, continuous feedback loops, and rapid content adaptation.",
    color: "#e0f2fe",
    accent: "#0284c7",
  },
];

export default function Features() {
  const [hovered, setHovered] = useState(null);

  return (
    <section id="features" style={s.section}>
      <div style={s.inner}>
        {/* Head */}
        <div style={s.head}>
          <div style={s.label}>🔥 What We Offer</div>
          <h2 style={s.title}>Built for Speed.<br />Designed for Scale.</h2>
          <p style={s.sub}>
            AERO BLOG combines agile methodologies with Firebase's reactive architecture
            to deliver a world-class blogging experience.
          </p>
        </div>

        {/* Grid */}
        <div style={s.grid}>
          {features.map((f, i) => (
            <div
              key={i}
              style={{
                ...s.card,
                transform: hovered === i ? "translateY(-6px)" : "translateY(0)",
                boxShadow: hovered === i
                  ? `0 16px 40px ${f.accent}22`
                  : "var(--shadow)",
                borderColor: hovered === i ? f.accent + "40" : "var(--border)",
              }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <div style={{ ...s.icon, background: f.color }}>
                {f.icon}
              </div>
              <h3 style={{ ...s.cardTitle, color: hovered === i ? f.accent : "var(--ink)" }}>
                {f.title}
              </h3>
              <p style={s.cardDesc}>{f.desc}</p>

              {/* Accent bar */}
              <div style={{
                ...s.bar,
                background: f.accent,
                transform: hovered === i ? "scaleX(1)" : "scaleX(0)",
              }} />
            </div>
          ))}
        </div>

        {/* Tech badges */}
        <div style={s.techRow}>
          {["⚛️ React 18", "🔥 Firebase 10", "📦 Firestore", "🗄️ Storage", "🔐 Auth", "☁️ Hosting"].map((t) => (
            <span key={t} style={s.badge}>{t}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

const s = {
  section: {
    background: "linear-gradient(180deg, var(--bg) 0%, var(--bg-2) 100%)",
    padding: "100px 48px",
  },
  inner: { maxWidth: 1200, margin: "0 auto" },
  head: { textAlign: "center", marginBottom: 64 },
  label: {
    display: "inline-block",
    background: "var(--bg-2)", color: "var(--blue)",
    padding: "5px 16px", borderRadius: 100,
    fontSize: "0.78rem", fontWeight: 700,
    fontFamily: "var(--font-display)", letterSpacing: "0.06em",
    textTransform: "uppercase", marginBottom: 16,
    border: "1px solid rgba(29,78,216,0.2)",
  },
  title: {
    fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800,
    letterSpacing: "-1.5px", lineHeight: 1.1, marginBottom: 16,
  },
  sub: {
    fontSize: "1.05rem", color: "var(--mid)",
    maxWidth: 520, margin: "0 auto", lineHeight: 1.7,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
    gap: 24,
  },
  card: {
    background: "#fff", borderRadius: "var(--radius-lg)",
    border: "1px solid var(--border)",
    padding: "32px 28px",
    transition: "all 0.3s ease",
    position: "relative", overflow: "hidden",
  },
  icon: {
    width: 56, height: 56, borderRadius: 14,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "1.7rem", marginBottom: 20,
  },
  cardTitle: {
    fontSize: "1.08rem", fontWeight: 800,
    fontFamily: "var(--font-display)", marginBottom: 10,
    transition: "color 0.2s",
  },
  cardDesc: {
    fontSize: "0.9rem", color: "var(--mid)", lineHeight: 1.65,
  },
  bar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    height: 3, transformOrigin: "left",
    transition: "transform 0.3s ease",
  },
  techRow: {
    display: "flex", gap: 10, flexWrap: "wrap",
    justifyContent: "center", marginTop: 56,
  },
  badge: {
    background: "#fff", border: "1px solid var(--border)",
    padding: "7px 18px", borderRadius: 100,
    fontSize: "0.84rem", fontWeight: 600,
    fontFamily: "var(--font-display)", color: "var(--ink)",
  },
};
