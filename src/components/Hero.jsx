// src/components/Hero.jsx
import { useEffect, useRef, useState } from "react";

const CATEGORY_TAGS = ["Technology", "Agile", "Design", "Business", "Innovation", "Tutorial"];

export default function Hero({ postCount, onWriteClick, onExplore }) {
  const [count, setCount] = useState(0);
  const [tagIndex, setTagIndex] = useState(0);
  const countRef = useRef(postCount);

  useEffect(() => {
    countRef.current = postCount;
    let current = 0;
    const target = postCount;
    const step = Math.max(1, Math.ceil(target / 40));
    const iv = setInterval(() => {
      current = Math.min(current + step, target);
      setCount(current);
      if (current >= target) clearInterval(iv);
    }, 40);
    return () => clearInterval(iv);
  }, [postCount]);

  useEffect(() => {
    const iv = setInterval(() => {
      setTagIndex((i) => (i + 1) % CATEGORY_TAGS.length);
    }, 1800);
    return () => clearInterval(iv);
  }, []);

  return (
    <section id="home" style={s.section}>
      {/* BG Effects */}
      <div style={s.bgGlow1} />
      <div style={s.bgGlow2} />
      <div style={s.grid} />

      <div style={s.inner}>
        {/* Eyebrow */}
        <div style={s.eyebrow}>
          <span style={s.eyebrowDot} />
          Agile Engine for Reactive Output
        </div>

        {/* Headline */}
        <h1 style={s.h1}>
          Ideas That<br />
          <span style={s.h1Blue}>Take Flight.</span>
        </h1>

        {/* Category pill */}
        <div style={s.tagRow}>
          <span style={s.tagLabel}>Writing about</span>
          <span style={s.tagPill} key={tagIndex}>
            {CATEGORY_TAGS[tagIndex]}
          </span>
          <span style={s.tagLabel}>and more →</span>
        </div>

        {/* Sub */}
        <p style={s.sub}>
          AERO BLOG is a cutting-edge agile engine designed to deliver reactive output efficiently.
          Real-time publishing powered by <strong>Firebase</strong> + <strong>React</strong> — built
          for thinkers, writers, and innovators.
        </p>

        {/* CTA */}
        <div style={s.cta}>
          <button style={s.btnPrimary} onClick={onExplore}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#1e40af";
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 10px 28px rgba(29,78,216,0.38)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--blue)";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            🚀 Explore Posts
          </button>
          <button style={s.btnOutline} onClick={onWriteClick}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--blue)";
              e.currentTarget.style.color = "var(--blue)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.color = "var(--ink)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            ✏️ Start Writing
          </button>
        </div>

        {/* Stats */}
        <div style={s.stats}>
          <Stat num={count} label="Articles" />
          <div style={s.statDivider} />
          <Stat num="⚡" label="Real-time" />
          <div style={s.statDivider} />
          <Stat num="∞" label="Possibilities" />
          <div style={s.statDivider} />
          <Stat num="🔥" label="Firebase" />
        </div>

        {/* Scroll hint */}
        <div style={s.scrollHint}>
          <div style={s.scrollDot} />
          <span>Scroll to explore</span>
        </div>
      </div>
    </section>
  );
}

function Stat({ num, label }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={s.statNum}>{num}</div>
      <div style={s.statLabel}>{label}</div>
    </div>
  );
}

const s = {
  section: {
    minHeight: "100vh",
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    textAlign: "center",
    padding: "120px 32px 80px",
    position: "relative", overflow: "hidden",
  },
  bgGlow1: {
    position: "absolute", top: "-15%", left: "50%",
    transform: "translateX(-50%)",
    width: 900, height: 600,
    background: "radial-gradient(ellipse, rgba(29,78,216,0.12) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  bgGlow2: {
    position: "absolute", bottom: "5%", right: "5%",
    width: 400, height: 400,
    background: "radial-gradient(ellipse, rgba(245,197,24,0.08) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  grid: {
    position: "absolute", inset: 0,
    backgroundImage: "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
    backgroundSize: "48px 48px",
    maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)",
    opacity: 0.45,
    pointerEvents: "none",
  },
  inner: { position: "relative", zIndex: 1, maxWidth: 720, width: "100%" },
  eyebrow: {
    display: "inline-flex", alignItems: "center", gap: 8,
    background: "var(--bg-2)", border: "1px solid rgba(29,78,216,0.2)",
    color: "var(--blue)", fontSize: "0.78rem", fontWeight: 700,
    fontFamily: "var(--font-display)",
    padding: "6px 16px", borderRadius: 100,
    letterSpacing: "0.06em", textTransform: "uppercase",
    marginBottom: 28,
    animation: "fadeUp 0.6s ease both",
  },
  eyebrowDot: {
    width: 6, height: 6, background: "var(--blue)",
    borderRadius: "50%", animation: "pulse 2s ease-in-out infinite",
  },
  h1: {
    fontSize: "clamp(3rem, 8vw, 5.8rem)",
    fontWeight: 800, letterSpacing: "-2.5px",
    lineHeight: 1.05, color: "var(--ink)",
    animation: "fadeUp 0.7s 0.1s ease both",
  },
  h1Blue: { color: "var(--blue)" },
  tagRow: {
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: 10, marginTop: 20,
    animation: "fadeUp 0.7s 0.15s ease both",
  },
  tagLabel: { fontSize: "0.9rem", color: "var(--mid)", fontFamily: "var(--font-display)" },
  tagPill: {
    background: "var(--blue)", color: "#fff",
    padding: "4px 14px", borderRadius: 100,
    fontSize: "0.85rem", fontWeight: 700, fontFamily: "var(--font-display)",
    animation: "fadeIn 0.3s ease",
  },
  sub: {
    fontSize: "1.1rem", color: "var(--mid)",
    maxWidth: 560, lineHeight: 1.75,
    margin: "24px auto 0",
    animation: "fadeUp 0.7s 0.2s ease both",
  },
  cta: {
    display: "flex", gap: 12, justifyContent: "center",
    flexWrap: "wrap", marginTop: 36,
    animation: "fadeUp 0.7s 0.3s ease both",
  },
  btnPrimary: {
    padding: "14px 30px", borderRadius: 10,
    fontSize: "1rem", fontFamily: "var(--font-display)", fontWeight: 700,
    border: "none", background: "var(--blue)", color: "#fff",
    cursor: "pointer", transition: "all 0.2s",
  },
  btnOutline: {
    padding: "13px 30px", borderRadius: 10,
    fontSize: "1rem", fontFamily: "var(--font-display)", fontWeight: 700,
    border: "1.5px solid var(--border)", background: "transparent",
    color: "var(--ink)", cursor: "pointer", transition: "all 0.2s",
  },
  stats: {
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: 32, marginTop: 60,
    animation: "fadeUp 0.7s 0.4s ease both",
  },
  statDivider: { width: 1, height: 36, background: "var(--border)" },
  statNum: {
    fontFamily: "var(--font-display)", fontSize: "1.8rem",
    fontWeight: 800, color: "var(--blue)",
  },
  statLabel: { fontSize: "0.78rem", color: "var(--muted)", marginTop: 4, fontFamily: "var(--font-display)", fontWeight: 600 },
  scrollHint: {
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: 8, marginTop: 48,
    fontSize: "0.78rem", color: "var(--muted)", fontFamily: "var(--font-display)",
    animation: "fadeUp 0.7s 0.5s ease both",
  },
  scrollDot: {
    width: 6, height: 10, border: "1.5px solid var(--muted)",
    borderRadius: 3, position: "relative", overflow: "hidden",
  },
};
