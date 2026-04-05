// src/components/About.jsx
export function About() {
  return (
    <section id="about" style={s.section}>
      <div style={s.inner}>
        <div style={s.grid}>
          {/* Visual */}
          <div style={s.visual}>
            <div style={s.visualBg} />
            <div style={s.visualContent}>
              <span style={s.plane}>✈️</span>
              <div style={s.visualCards}>
                <div style={s.vCard}>
                  <span style={s.vCardIcon}>🔥</span>
                  <span style={s.vCardLabel}>Firebase</span>
                </div>
                <div style={s.vCard}>
                  <span style={s.vCardIcon}>⚛️</span>
                  <span style={s.vCardLabel}>React</span>
                </div>
                <div style={s.vCard}>
                  <span style={s.vCardIcon}>⚡</span>
                  <span style={s.vCardLabel}>Real-time</span>
                </div>
              </div>
            </div>
          </div>

          {/* Text */}
          <div style={s.text}>
            <div style={s.label}>👥 About the Project</div>
            <h2 style={s.title}>Built by Innovators,<br />For Innovators.</h2>
            <p style={s.para}>
              AERO BLOG was conceptualized as an <strong>Agile Engine for Reactive Output</strong> —
              a platform that adapts in real-time to changing inputs, enabling rapid content generation
              and seamless digital communication across dynamic environments.
            </p>
            <p style={s.para}>
              Developed with agile principles at its core, AERO BLOG supports iterative development,
              continuous feedback loops, and user-centric design that evolves responsively with market demands.
              Firebase powers the real-time backbone; React delivers the reactive UI.
            </p>

            <div style={s.teamSection}>
              <div style={s.teamLabel}>The Team</div>
              <div style={s.team}>
                {[
                  { name: "Jatin Verma", id: "11232673", role: "Lead Developer" },
                  { name: "Jatin", id: "11232671", role: "Co-Developer" },
                ].map((m) => (
                  <div key={m.id} style={s.member}>
                    <div style={s.memberAvatar}>{m.name[0]}</div>
                    <div>
                      <div style={s.memberName}>{m.name}</div>
                      <div style={s.memberId}>{m.id} · {m.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={s.chips}>
              {["⚡ Firebase Firestore", "🗄️ Firebase Storage", "🔐 Firebase Auth", "⚛️ React 18", "🌐 Hosting"].map((c) => (
                <span key={c} style={s.chip}>{c}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Footer({ onWriteClick }) {
  return (
    <footer style={f.footer}>
      <div style={f.inner}>
        <div style={f.top}>
          <div style={f.brand}>
            <div style={f.logo}>
              AERO<span style={{ color: "#3b82f6" }}>BLOG</span>
              <span style={{ width: 8, height: 8, background: "#f5c518", borderRadius: "50%", display: "inline-block", marginLeft: 4 }} />
            </div>
            <p style={f.brandDesc}>
              An agile engine for reactive output. Real-time blogging powered by Firebase and React.
            </p>
          </div>

          <div style={f.links}>
            <div style={f.linkGroup}>
              <h4 style={f.linkHead}>Navigate</h4>
              {[
                ["Features", "features"],
                ["Posts", "posts"],
                ["About", "about"],
              ].map(([label, id]) => (
                <button key={id} style={f.link}
                  onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })}>
                  {label}
                </button>
              ))}
            </div>
            <div style={f.linkGroup}>
              <h4 style={f.linkHead}>Tech Stack</h4>
              {["Firebase Firestore", "Firebase Storage", "Firebase Auth", "React JS", "React Router"].map((t) => (
                <span key={t} style={{ ...f.link, cursor: "default" }}>{t}</span>
              ))}
            </div>
          </div>

          <div style={f.cta}>
            <h4 style={f.ctaTitle}>Ready to write?</h4>
            <p style={f.ctaSub}>Share your ideas with the world in real-time.</p>
            <button style={f.ctaBtn} onClick={onWriteClick}>✏️ Start Writing</button>
          </div>
        </div>

        <div style={f.bottom}>
          <span>© 2024 AERO BLOG — Jatin Verma & Jatin. All rights reserved.</span>
          <div style={f.bottomRight}>
            <span style={f.tech}>⚛️ React</span>
            <span style={f.tech}>🔥 Firebase</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

const s = {
  section: { padding: "100px 48px", background: "#fff" },
  inner: { maxWidth: 1200, margin: "0 auto" },
  grid: {
    display: "grid", gridTemplateColumns: "1fr 1fr",
    gap: 72, alignItems: "center",
  },
  visual: {
    borderRadius: "var(--radius-lg)", height: 420,
    position: "relative", overflow: "hidden",
  },
  visualBg: {
    position: "absolute", inset: 0,
    background: "linear-gradient(135deg, #1d4ed8 0%, #1e40af 60%, #1e3a8a 100%)",
  },
  visualContent: {
    position: "relative", height: "100%",
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", gap: 28,
  },
  plane: { fontSize: "5rem", filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.2))" },
  visualCards: { display: "flex", gap: 12 },
  vCard: {
    background: "rgba(255,255,255,0.15)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.2)",
    padding: "10px 16px", borderRadius: 12,
    display: "flex", flexDirection: "column",
    alignItems: "center", gap: 4,
  },
  vCardIcon: { fontSize: "1.5rem" },
  vCardLabel: {
    fontSize: "0.75rem", fontWeight: 700,
    fontFamily: "var(--font-display)", color: "#fff",
  },
  text: {},
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
    fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", fontWeight: 800,
    letterSpacing: "-1px", lineHeight: 1.15, marginBottom: 20,
  },
  para: {
    fontSize: "0.97rem", color: "var(--mid)",
    lineHeight: 1.8, marginBottom: 14,
  },
  teamSection: { marginTop: 28, marginBottom: 24 },
  teamLabel: {
    fontSize: "0.78rem", fontWeight: 700,
    fontFamily: "var(--font-display)", color: "var(--muted)",
    textTransform: "uppercase", letterSpacing: "0.06em",
    marginBottom: 14,
  },
  team: { display: "flex", flexDirection: "column", gap: 12 },
  member: { display: "flex", alignItems: "center", gap: 12 },
  memberAvatar: {
    width: 40, height: 40, borderRadius: "50%",
    background: "var(--blue)", color: "#fff",
    fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1rem",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  memberName: {
    fontSize: "0.9rem", fontWeight: 700,
    fontFamily: "var(--font-display)", color: "var(--ink)",
  },
  memberId: { fontSize: "0.78rem", color: "var(--muted)" },
  chips: { display: "flex", gap: 8, flexWrap: "wrap" },
  chip: {
    background: "var(--bg-2)", color: "var(--blue)",
    padding: "5px 14px", borderRadius: 100,
    fontSize: "0.8rem", fontWeight: 600,
    fontFamily: "var(--font-display)",
    border: "1px solid rgba(29,78,216,0.15)",
  },
};

const f = {
  footer: { background: "#0c0c14", color: "#fff", padding: "60px 48px 28px" },
  inner: { maxWidth: 1200, margin: "0 auto" },
  top: {
    display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr",
    gap: 48, paddingBottom: 40,
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    marginBottom: 28,
  },
  brand: {},
  logo: {
    fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.4rem",
    letterSpacing: "-0.5px", marginBottom: 12, display: "flex", alignItems: "center", gap: 2,
  },
  brandDesc: { fontSize: "0.88rem", color: "rgba(255,255,255,0.4)", lineHeight: 1.7 },
  links: { display: "flex", gap: 40 },
  linkGroup: { display: "flex", flexDirection: "column", gap: 10 },
  linkHead: {
    fontFamily: "var(--font-display)", fontSize: "0.85rem",
    fontWeight: 700, marginBottom: 4,
  },
  link: {
    fontSize: "0.85rem", color: "rgba(255,255,255,0.4)",
    background: "none", border: "none", textAlign: "left",
    cursor: "pointer", padding: 0, fontFamily: "var(--font-body)",
    transition: "color 0.2s",
  },
  cta: {},
  ctaTitle: {
    fontFamily: "var(--font-display)", fontSize: "1rem",
    fontWeight: 800, marginBottom: 8,
  },
  ctaSub: { fontSize: "0.85rem", color: "rgba(255,255,255,0.4)", marginBottom: 16, lineHeight: 1.6 },
  ctaBtn: {
    padding: "10px 22px", background: "var(--blue)",
    color: "#fff", border: "none", borderRadius: 8,
    fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.88rem",
    cursor: "pointer",
  },
  bottom: {
    display: "flex", alignItems: "center",
    justifyContent: "space-between", flexWrap: "wrap", gap: 12,
    fontSize: "0.78rem", color: "rgba(255,255,255,0.25)",
  },
  bottomRight: { display: "flex", gap: 12 },
  tech: {
    background: "rgba(255,255,255,0.06)", padding: "3px 10px",
    borderRadius: 6, fontSize: "0.76rem",
  },
};
