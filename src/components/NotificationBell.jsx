// src/components/NotificationBell.jsx
// Real-time notifications via Firestore — drop into Navbar next to the bell icon
// Usage: <NotificationBell user={user} onOpenPost={fn} />

import { useState, useEffect, useRef } from "react";
import {
  collection, query, where, orderBy, onSnapshot,
  updateDoc, doc, writeBatch, getDocs, addDoc, serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";

// ── Firestore helpers ──────────────────────────────────────────────────────

export async function createNotification(toUid, { type, fromName, fromAvatar, postId, postTitle }) {
  if (!toUid) return;
  await addDoc(collection(db, "notifications"), {
    toUid,
    type,        // "like" | "comment" | "follow"
    fromName:    fromName    || "Someone",
    fromAvatar:  fromAvatar  || "",
    postId:      postId      || null,
    postTitle:   postTitle   || null,
    read:        false,
    createdAt:   serverTimestamp(),
  });
}

function useNotifications(uid) {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, "notifications"),
      where("toUid", "==", uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() })).slice(0, 30);
      setNotifications(items);
      setUnread(items.filter((n) => !n.read).length);
    });
    return unsub;
  }, [uid]);

  const markAllRead = async () => {
    if (!uid) return;
    const unreadItems = notifications.filter((n) => !n.read);
    if (!unreadItems.length) return;
    const batch = writeBatch(db);
    unreadItems.forEach((n) => batch.update(doc(db, "notifications", n.id), { read: true }));
    await batch.commit();
  };

  const markOneRead = async (id) => {
    await updateDoc(doc(db, "notifications", id), { read: true });
  };

  return { notifications, unread, markAllRead, markOneRead };
}

// ── Icon map ───────────────────────────────────────────────────────────────
const TYPE_META = {
  like:    { icon: "❤️", color: "#ef4444", label: "liked your post" },
  comment: { icon: "💬", color: "#3b82f6", label: "commented on your post" },
  follow:  { icon: "👤", color: "#10b981", label: "started following you" },
};

function timeAgo(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Math.floor((Date.now() - d) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function NotificationBell({ user, onOpenPost }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  const { notifications, unread, markAllRead, markOneRead } = useNotifications(user?.uid);

  // Close on outside click
  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const handleOpen = () => {
    setOpen((o) => !o);
    if (!open && unread > 0) markAllRead();
  };

  if (!user) return null;

  return (
    <div style={{ position: "relative" }} ref={ref}>
      {/* ── Bell button ── */}
      <button
        onClick={handleOpen}
        title="Notifications"
        style={{
          width: 36, height: 36, borderRadius: "50%",
          border: "1px solid var(--border)",
          background: open ? "var(--blue-glow)" : "var(--bg-2)",
          cursor: "pointer", fontSize: "1rem", position: "relative",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "background 0.2s",
        }}
      >
        🔔
        {unread > 0 && (
          <span style={{
            position: "absolute", top: -4, right: -4,
            background: "#ef4444", color: "#fff",
            minWidth: 16, height: 16, borderRadius: 99,
            fontSize: "0.6rem", fontWeight: 800,
            fontFamily: "var(--font-display)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 3px",
            animation: "pulse 1.5s ease-in-out infinite",
          }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 10px)", right: 0,
          width: 340, maxHeight: 480,
          background: "var(--card)", border: "1px solid var(--border)",
          borderRadius: 16, boxShadow: "0 16px 48px rgba(0,0,0,0.18)",
          zIndex: 300, animation: "slideDown 0.2s ease",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{
            padding: "14px 16px 10px",
            borderBottom: "1px solid var(--border)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexShrink: 0,
          }}>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15, color: "var(--ink)" }}>
              Notifications
              {unread > 0 && (
                <span style={{
                  marginLeft: 8, background: "#ef4444", color: "#fff",
                  borderRadius: 99, padding: "1px 7px", fontSize: 11,
                }}>
                  {unread} new
                </span>
              )}
            </span>
            {notifications.length > 0 && (
              <button onClick={markAllRead} style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 11, color: "var(--blue)",
                fontFamily: "var(--font-display)", fontWeight: 600,
              }}>
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--muted)" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🔕</div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14 }}>All caught up!</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>No notifications yet</div>
              </div>
            ) : (
              notifications.map((n) => {
                const meta = TYPE_META[n.type] || TYPE_META.like;
                return (
                  <div
                    key={n.id}
                    onClick={() => {
                      markOneRead(n.id);
                      if (n.postId && onOpenPost) onOpenPost(n.postId);
                      setOpen(false);
                    }}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: 12,
                      padding: "12px 16px",
                      background: n.read ? "transparent" : "var(--blue-glow)",
                      borderBottom: "1px solid var(--border)",
                      cursor: n.postId ? "pointer" : "default",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-2)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = n.read ? "transparent" : "var(--blue-glow)")}
                  >
                    {/* Avatar / icon */}
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                      background: n.fromAvatar ? "none" : `${meta.color}22`,
                      overflow: "hidden",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 18, border: `2px solid ${meta.color}44`,
                    }}>
                      {n.fromAvatar
                        ? <img src={n.fromAvatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : meta.icon}
                    </div>

                    {/* Text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.4 }}>
                        <strong style={{ fontFamily: "var(--font-display)" }}>{n.fromName}</strong>
                        {" "}{meta.label}
                        {n.postTitle && (
                          <span style={{ color: "var(--blue)" }}> "{n.postTitle}"</span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>
                        {timeAgo(n.createdAt)}
                      </div>
                    </div>

                    {/* Unread dot */}
                    {!n.read && (
                      <div style={{
                        width: 8, height: 8, borderRadius: "50%",
                        background: "var(--blue)", flexShrink: 0, marginTop: 4,
                      }} />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}