// src/components/Navbar.jsx
import { useState, useEffect } from "react";
import UserMenu from "./UserMenu";
import NotificationBell from "./NotificationBell";

export default function Navbar({
  onWriteClick, isDemo, dark, onToggleDark,
  bookmarkCount, onBookmarksClick,
  onCommunityClick, onAuthClick,
  onProfileClick, onAnalyticsClick,
  onDMClick, // ✅ added
  onOpenPost, // ✅ for notification redirect
  user,
}) {
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const [isMobile, setIsMobile]   = useState(window.innerWidth < 768);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    const onResize = () => { setIsMobile(window.innerWidth < 768); setMenuOpen(false); };
    window.addEventListener("scroll", onScroll);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  const navBg = scrolled
    ? dark ? "rgba(15,23,42,0.95)" : "rgba(248,250,255,0.95)"
    : dark ? "rgba(15,23,42,0.7)" : "transparent";

  return (
    <>
      <nav style={{
        ...s.nav,
        background: navBg,
        borderBottom: scrolled ? "1px solid var(--border)" : "none",
        boxShadow: scrolled ? "0 2px 20px rgba(29,78,216,0.06)" : "none",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        padding: isMobile ? "0 20px" : "0 48px",
      }}>
        {/* Logo */}
        <div style={s.logo} onClick={() => scrollTo("home")}>
          AERO<span style={{ color: "var(--blue)" }}>BLOG</span>
          <span style={s.dot} />
          {isDemo && <span style={s.demoBadge}>DEMO</span>}
        </div>

        {/* Desktop links */}
        {!isMobile && (
          <div style={s.links}>
            {[["features","Features"],["posts","Posts"],["about","About"]].map(([id, label]) => (
              <button key={id} style={s.link} onClick={() => scrollTo(id)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--blue)";
                  e.currentTarget.style.background = "var(--bg-2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--mid)";
                  e.currentTarget.style.background = "transparent";
                }}>
                {label}
              </button>
            ))}

            <button style={s.link} onClick={onCommunityClick}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--blue)";
                e.currentTarget.style.background = "var(--bg-2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--mid)";
                e.currentTarget.style.background = "transparent";
              }}>
              👥 Community
            </button>

            <button style={s.iconBtn} onClick={onBookmarksClick} title="Bookmarks">
              🔖
              {bookmarkCount > 0 && <span style={s.badge}>{bookmarkCount}</span>}
            </button>

            <button style={s.iconBtn} onClick={onToggleDark} title={dark ? "Light mode" : "Dark mode"}>
              {dark ? "☀️" : "🌙"}
            </button>

            <NotificationBell user={user} onOpenPost={onOpenPost} />

            {user && (
              <button style={s.writeBtn} onClick={onWriteClick}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#1e40af")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--blue)")}>
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
              onDMClick={onDMClick} // ✅ added
            />
          </div>
        )}

        {/* Mobile right side */}
        {isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button style={s.iconBtn} onClick={onToggleDark}>
              {dark ? "☀️" : "🌙"}
            </button>

            <NotificationBell user={user} onOpenPost={onOpenPost} />

            <UserMenu
              user={user}
              onAuthClick={onAuthClick}
              onProfileClick={onProfileClick}
              onBookmarksClick={onBookmarksClick}
              onCommunityClick={onCommunityClick}
              onAnalyticsClick={onAnalyticsClick}
              onDMClick={onDMClick} // ✅ added
            />

            {/* Hamburger */}
            <button style={s.hamburger} onClick={() => setMenuOpen((o) => !o)}>
              <span style={{ ...s.bar, transform: menuOpen ? "rotate(45deg) translate(5px,5px)" : "none" }} />
              <span style={{ ...s.bar, opacity: menuOpen ? 0 : 1 }} />
              <span style={{ ...s.bar, transform: menuOpen ? "rotate(-45deg) translate(5px,-5px)" : "none" }} />
            </button>
          </div>
        )}
      </nav>

      {/* Mobile Drawer */}
      {isMobile && menuOpen && (
        <div style={s.drawer}>
          <div style={s.drawerInner}>
            {[["features","🚀 Features"],["posts","📝 Posts"],["about","ℹ️ About"]].map(([id, label]) => (
              <button key={id} style={s.drawerLink} onClick={() => scrollTo(id)}>
                {label}
              </button>
            ))}

            <button style={s.drawerLink} onClick={() => { onCommunityClick(); setMenuOpen(false); }}>
              👥 Community
            </button>

            <button style={s.drawerLink} onClick={() => { onBookmarksClick(); setMenuOpen(false); }}>
              🔖 Bookmarks {bookmarkCount > 0 && <span style={s.drawerBadge}>{bookmarkCount}</span>}
            </button>

            {/* ✅ Messages button added */}
            <button
              style={s.drawerLink}
              onClick={() => { onDMClick?.(); setMenuOpen(false); }}
            >
              💌 Messages
            </button>

            <div style={s.drawerDivider} />

            {user ? (
              <>
                <button style={s.drawerLink} onClick={() => { onWriteClick(); setMenuOpen(false); }}>
                  ✏️ Write a Post
                </button>
                <button style={s.drawerLink} onClick={() => { onProfileClick(); setMenuOpen(false); }}>
                  👤 My Profile
                </button>
                <button style={s.drawerLink} onClick={() => { onAnalyticsClick(); setMenuOpen(false); }}>
                  📊 Analytics
                </button>
              </>
            ) : (
              <button style={s.drawerSignIn} onClick={() => { onAuthClick(); setMenuOpen(false); }}>
                Sign In / Sign Up
              </button>
            )}
          </div>
        </div>
      )}

      {/* Overlay */}
      {isMobile && menuOpen && (
        <div style={s.overlay} onClick={() => setMenuOpen(false)} />
      )}
    </>
  );
}

const s = {
  nav: {
    position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    height: 64, transition: "all 0.3s",
  },
  logo: {
    fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.3rem",
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
  hamburger: {
    width: 40, height: 40, background: "var(--bg-2)", border: "1px solid var(--border)",
    borderRadius: 10, cursor: "pointer", display: "flex",
    flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, padding: 8,
  },
  bar: {
    width: 20, height: 2, background: "var(--ink)", borderRadius: 2,
    transition: "all 0.3s", display: "block",
  },
  overlay: {
    position: "fixed", inset: 0, zIndex: 98,
    background: "rgba(12,12,20,0.5)", backdropFilter: "blur(4px)",
  },
  drawer: {
    position: "fixed", top: 64, left: 0, right: 0, zIndex: 99,
    background: "var(--card)", borderBottom: "1px solid var(--border)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.12)", animation: "slideDown 0.2s ease",
  },
  drawerInner: {
    display: "flex", flexDirection: "column", padding: "12px 16px 20px",
  },
  drawerLink: {
    padding: "13px 16px", background: "none", border: "none",
    borderRadius: 10, textAlign: "left", cursor: "pointer",
    fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.95rem",
    color: "var(--ink)", display: "flex", alignItems: "center", gap: 8,
    transition: "background 0.15s",
  },
  drawerBadge: {
    background: "var(--blue)", color: "#fff",
    padding: "1px 7px", borderRadius: 99,
    fontSize: "0.7rem", fontWeight: 700,
  },
  drawerDivider: {
    height: 1, background: "var(--border)", margin: "8px 0",
  },
  drawerSignIn: {
    margin: "8px 0 0", padding: "13px", background: "var(--blue)", color: "#fff",
    border: "none", borderRadius: 10, cursor: "pointer",
    fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.95rem",
    textAlign: "center",
  },
};