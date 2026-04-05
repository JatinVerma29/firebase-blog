// src/components/BookmarksPanel.jsx
import { useState } from "react";
import { getBookmarks, toggleBookmark } from "../firebase/posts";
import PostCard from "./PostCard";

export default function BookmarksPanel({ allPosts, onOpenPost, onClose }) {
  const [bookmarkIds, setBookmarkIds] = useState(getBookmarks());

  const bookmarked = allPosts.filter((p) => bookmarkIds.includes(p.id));

  const handleRemove = (postId) => {
    toggleBookmark(postId);
    setBookmarkIds(getBookmarks());
  };

  return (
    <div style={s.backdrop} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={s.panel}>
        <div style={s.header}>
          <div>
            <h2 style={s.title}>🔖 Bookmarks</h2>
            <p style={s.sub}>{bookmarked.length} saved post{bookmarked.length !== 1 ? "s" : ""}</p>
          </div>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        {bookmarked.length === 0 ? (
          <div style={s.empty}>
            <div style={{ fontSize: "3rem" }}>🔖</div>
            <h3 style={s.emptyTitle}>No bookmarks yet</h3>
            <p style={s.emptySub}>Click the 🔖 icon on any post to save it here.</p>
          </div>
        ) : (
          <div style={s.grid}>
            {bookmarked.map((post) => (
              <div key={post.id} style={s.cardWrap}>
                <PostCard post={post} onClick={onOpenPost} />
                <button
                  style={s.removeBtn}
                  onClick={() => handleRemove(post.id)}
                >
                  Remove bookmark
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  backdrop: {
    position: "fixed", inset: 0, zIndex: 200,
    background: "rgba(12,12,20,0.6)",
    backdropFilter: "blur(10px)",
    display: "flex", alignItems: "flex-start",
    justifyContent: "flex-end",
    animation: "fadeIn 0.2s ease",
  },
  panel: {
    background: "var(--bg)", width: "100%", maxWidth: 520,
    height: "100vh", overflowY: "auto",
    padding: "32px 28px",
    animation: "slideIn 0.3s ease",
    borderLeft: "1px solid var(--border)",
  },
  header: {
    display: "flex", alignItems: "flex-start",
    justifyContent: "space-between", marginBottom: 28,
  },
  title: {
    fontFamily: "var(--font-display)", fontSize: "1.4rem",
    fontWeight: 800, color: "var(--ink)",
  },
  sub: { fontSize: "0.85rem", color: "var(--mid)", marginTop: 4 },
  closeBtn: {
    background: "var(--bg-2)", border: "1px solid var(--border)",
    width: 36, height: 36, borderRadius: "50%",
    cursor: "pointer", fontSize: "1rem",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  empty: {
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    padding: "60px 20px", gap: 12, textAlign: "center",
  },
  emptyTitle: {
    fontFamily: "var(--font-display)", fontSize: "1.2rem",
    fontWeight: 800, color: "var(--ink)",
  },
  emptySub: { fontSize: "0.9rem", color: "var(--mid)" },
  grid: { display: "flex", flexDirection: "column", gap: 16 },
  cardWrap: { position: "relative" },
  removeBtn: {
    marginTop: 6, width: "100%",
    padding: "7px", background: "transparent",
    border: "1px solid var(--border)", borderRadius: 8,
    fontFamily: "var(--font-display)", fontWeight: 600,
    fontSize: "0.8rem", color: "var(--mid)", cursor: "pointer",
  },
};