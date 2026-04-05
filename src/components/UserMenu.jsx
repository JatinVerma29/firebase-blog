// src/components/UserMenu.jsx
import { useState, useRef, useEffect } from "react";
import { logOut } from "../firebase/auth";

export default function UserMenu({ user, onAuthClick, onProfileClick, onBookmarksClick, onCommunityClick, onAnalyticsClick, onDMClick }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  if (!user) {
    return (
      <button style={s.loginBtn} onClick={onAuthClick}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#1e40af")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "var(--blue)")}>
        Log In
      </button>
    );
  }

  const initials = (user.displayName || user.email || "U")
    .split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  const menuItems = [
    { icon: "👤", label: "My Profile",  action: () => { setOpen(false); onProfileClick?.();   } },
    { icon: "📊", label: "Analytics",   action: () => { setOpen(false); onAnalyticsClick?.(); } },
    { icon: "💌", label: "Messages",    action: () => { setOpen(false); onDMClick?.();         } }, // ✅
    { icon: "🔖", label: "Bookmarks",   action: () => { setOpen(false); onBookmarksClick?.(); } },
    { icon: "👥", label: "Community",   action: () => { setOpen(false); onCommunityClick?.(); } },
  ];

  return (
    <div style={s.wrap} ref={ref}>
      <button style={s.avatar} onClick={() => setOpen((o) => !o)} title="Account menu"
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--blue)")}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}>
        {user.photoURL ? <img src={user.photoURL} alt="" style={s.avatarImg} /> : <span style={s.initials}>{initials}</span>}
      </button>

      {open && (
        <div style={s.dropdown}>
          <div style={s.ddHeader}>
            <div style={{ ...s.avatar, width: 40, height: 40, cursor: "default" }}>
              {user.photoURL ? <img src={user.photoURL} alt="" style={s.avatarImg} /> : <span style={s.initials}>{initials}</span>}
            </div>
            <div>
              <div style={s.ddName}>{user.displayName || "User"}</div>
              <div style={s.ddEmail}>{user.email}</div>
            </div>
          </div>
          <div style={s.ddDivider} />
          {menuItems.map(({ icon, label, action }) => (
            <button key={label} style={s.ddItem}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-2)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              onClick={action}>
              <span>{icon}</span> {label}
            </button>
          ))}
          <div style={s.ddDivider} />
          <button style={{ ...s.ddItem, color: "#ef4444" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#fee2e2")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            onClick={async () => { await logOut(); setOpen(false); }}>
            <span>🚪</span> Log Out
          </button>
        </div>
      )}
    </div>
  );
}

const s = {
  wrap: { position: "relative" },
  loginBtn: { padding: "8px 18px", background: "var(--blue)", color: "#fff", border: "none", borderRadius: 8, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.88rem", cursor: "pointer", transition: "background 0.2s" },
  avatar: { width: 36, height: 36, borderRadius: "50%", background: "var(--blue)", border: "2px solid var(--border)", cursor: "pointer", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, transition: "border-color 0.2s" },
  avatarImg: { width: "100%", height: "100%", objectFit: "cover" },
  initials: { color: "#fff", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "0.8rem" },
  dropdown: { position: "absolute", top: "calc(100% + 10px)", right: 0, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, padding: "8px", boxShadow: "0 12px 40px rgba(0,0,0,0.15)", minWidth: 220, zIndex: 200, animation: "slideDown 0.2s ease" },
  ddHeader: { display: "flex", alignItems: "center", gap: 10, padding: "8px 10px 12px" },
  ddName: { fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "0.9rem", color: "var(--ink)" },
  ddEmail: { fontSize: "0.74rem", color: "var(--muted)" },
  ddDivider: { height: 1, background: "var(--border)", margin: "4px 0" },
  ddItem: { width: "100%", padding: "9px 12px", border: "none", background: "transparent", borderRadius: 8, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.86rem", color: "var(--ink)", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 10, transition: "background 0.15s" },
};