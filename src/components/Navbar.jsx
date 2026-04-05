// src/components/Navbar.jsx
import { useState, useEffect } from "react";
import UserMenu from "./UserMenu";
import NotificationBell from "./NotificationBell";

export default function Navbar({
  onWriteClick, isDemo, dark, onToggleDark,
  bookmarkCount, onBookmarksClick,
  onCommunityClick, onAuthClick,
  onProfileClick, onAnalyticsClick,
  user,
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <nav style={{
      ...s.nav,
      background: scrolled
        ? dark ? "rgba(15,23,42,0.92)" : "rgba(248,250,255,0.92)"
        : "transparent",
      borderBottom: scrolled ? "1px solid var(--border)" : "none",
      boxShadow: scrolled ? "0 2px 20px rgba(29,78,216,0.06)" : "none",
      backdropFilter: scrolled ? "blur(20px)" : "none",
    }}>
      <div style={s.logo} onClick={() => scrollTo("home")}>
        AERO<span style={{ color: "var(--blue)" }}>BLOG</span>
        <span style={s.dot} />
        {isDemo && <span style={s.demoBadge}>DEMO</span>}
      </div>

      <div style={s.links}>
        {[["features","Features"],["posts","Posts"],["about","About"]].map(([id, label]) => (
          <button key={id} style={s.link} onClick={() => scrollTo(id)}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--blue)"; e.currentTarget.style.background = "var(--bg-2)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--mid)"; e.currentTarget.style.background = "transparent"; }}>
            {label}
          </button>
        ))}

        <button style={s.link} onClick={onCommunityClick}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--blue)"; e.currentTarget.style.background = "var(--bg-2)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--mid)"; e.currentTarget.style.background = "transparent"; }}>
          👥 Community
        </button>

        <button style={s.iconBtn} onClick={onBookmarksClick} title="Bookmarks">
          🔖
          {bookmarkCount > 0 && <span style={s.badge}>{bookmarkCount}</span>}
        </button>

        <button style={s.iconBtn} onClick={onToggleDark} title={dark ? "Light mode" : "Dark mode"}>
          {dark ? "☀️" : "🌙"}
        </button>

        {/* 🔔 Real-time notification bell */}
        <NotificationBell user={user} />

        {user && (
          <button style={s.writeBtn} onClick={onWriteClick}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#1e40af"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--blue)"; }}>
            ✏️ Write
          </button>
        )}

        <UserMenu
          user={user}
          onAuthClick={onAuthClick}
          onProfileClick={onProfileClick}
          onBookmarksClick={onBookmarksClick}
          onCommunityClick={onCommunityClick}
          onAnalyticsClick={onAnalyticsClick}
        />
      </div>
    </nav>
  );
}

const s = {
  nav: {
    position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 48px", height: 68, transition: "all 0.3s",
  },
  logo: {
    fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.4rem",
    letterSpacing: "-0.5px", display: "flex", alignItems: "center", gap: 2,
    color: "var(--ink)", cursor: "pointer",
  },
  dot: {
    width: 8, height: 8, background: "#f5c518", borderRadius: "50%",
    display: "inline-block", marginLeft: 3, animation: "pulse 2s ease-in-out infinite",
  },
  demoBadge: {
    fontSize: "0.7rem", background: "#f5c518", color: "#000",
    padding: "2px 8px", borderRadius: 100,
    fontFamily: "var(--font-display)", fontWeight: 700, marginLeft: 6,
  },
  links: { display: "flex", alignItems: "center", gap: 4 },
  link: {
    padding: "7px 12px", borderRadius: 8, border: "none",
    background: "transparent", color: "var(--mid)",
    fontFamily: "var(--font-display)", fontWeight: 600,
    fontSize: "0.86rem", cursor: "pointer", transition: "all 0.2s",
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: "50%",
    border: "1px solid var(--border)", background: "var(--bg-2)",
    cursor: "pointer", fontSize: "1rem", position: "relative",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  badge: {
    position: "absolute", top: -4, right: -4,
    background: "var(--blue)", color: "#fff",
    width: 16, height: 16, borderRadius: "50%",
    fontSize: "0.6rem", fontWeight: 700, fontFamily: "var(--font-display)",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  writeBtn: {
    padding: "8px 18px", background: "var(--blue)", color: "#fff",
    border: "none", borderRadius: 8, fontFamily: "var(--font-display)",
    fontWeight: 700, fontSize: "0.86rem", cursor: "pointer", transition: "background 0.2s",
  },
};