// src/components/PostCard.jsx
import { useState } from "react";

const CATEGORY_COLORS = {
  Technology: { bg: "#dbeafe", color: "#1d4ed8" },
  Agile:      { bg: "#d1fae5", color: "#059669" },
  Design:     { bg: "#ede9fe", color: "#7c3aed" },
  Business:   { bg: "#fee2e2", color: "#dc2626" },
  Tutorial:   { bg: "#fef3c7", color: "#d97706" },
  Innovation: { bg: "#e0f2fe", color: "#0284c7" },
  General:    { bg: "#f1f5f9", color: "#64748b" },
};

function formatDate(ts) {
  if (!ts) return "Recently";
  const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function initials(name = "") {
  return name.split(" ").map((w) => w[0] || "").join("").toUpperCase().slice(0, 2) || "A";
}

export default function PostCard({ post, onClick, onDelete, showDelete }) {
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);

  const catStyle = CATEGORY_COLORS[post.category] || CATEGORY_COLORS.General;
  const excerpt =
    post.excerpt || (post.content || "").substring(0, 130).replace(/\n/g, " ") + "…";
  const ini = initials(post.author);

  return (
    <article
      style={{
        ...s.card,
        transform: hovered ? "translateY(-6px)" : "translateY(0)",
        boxShadow: hovered ? "var(--shadow-lg)" : "var(--shadow)",
        borderColor: hovered ? "rgba(29,78,216,0.2)" : "var(--border)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onClick(post)}
    >
      {/* Image */}
      <div style={s.imgWrap}>
        {post.imageUrl && !imgError ? (
          <img
            src={post.imageUrl}
            alt={post.title}
            style={{ ...s.img, transform: hovered ? "scale(1.04)" : "scale(1)" }}
            onError={() => setImgError(true)}
          />
        ) : (
          <div style={s.imgFallback}>
            {post.emoji || "✍️"}
          </div>
        )}
        <div style={{ ...s.imgOverlay, opacity: hovered ? 1 : 0 }} />
        <span style={{ ...s.catBadge, background: catStyle.bg, color: catStyle.color }}>
          {post.category || "General"}
        </span>
      </div>

      {/* Body */}
      <div style={s.body}>
        <h3 style={s.title}>{post.title}</h3>
        <p style={s.excerpt}>{excerpt}</p>

        <div style={s.footer}>
          <div style={s.author}>
            <div style={{ ...s.avatar, background: hashed(post.author) }}>
              {ini}
            </div>
            <div>
              <div style={s.authorName}>{post.author || "Anonymous"}</div>
              <div style={s.date}>{formatDate(post.createdAt)}</div>
            </div>
          </div>

          <div style={s.meta}>
            <span style={s.metaItem}>❤️ {post.likes || 0}</span>
            <span style={s.readMore}>Read →</span>
          </div>
        </div>
      </div>

      {showDelete && (
        <button
          style={s.deleteBtn}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(post.id, post.imagePath);
          }}
          title="Delete post"
        >
          🗑️
        </button>
      )}
    </article>
  );
}

function hashed(str = "") {
  const colors = ["#1d4ed8", "#059669", "#7c3aed", "#dc2626", "#d97706", "#0284c7"];
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}

const s = {
  card: {
    background: "var(--card)", borderRadius: "var(--radius-lg)",
    border: "1px solid var(--border)",
    overflow: "hidden", cursor: "pointer",
    transition: "all 0.3s ease", position: "relative",
  },
  imgWrap: {
    height: 210, overflow: "hidden",
    position: "relative",
  },
  img: {
    width: "100%", height: "100%",
    objectFit: "cover", transition: "transform 0.4s ease",
  },
  imgFallback: {
    width: "100%", height: "100%",
    background: "linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "3.5rem",
  },
  imgOverlay: {
    position: "absolute", inset: 0,
    background: "linear-gradient(to top, rgba(12,12,20,0.3) 0%, transparent 60%)",
    transition: "opacity 0.3s",
  },
  catBadge: {
    position: "absolute", top: 12, left: 12,
    padding: "3px 12px", borderRadius: 100,
    fontSize: "0.72rem", fontWeight: 700,
    fontFamily: "var(--font-display)",
  },
  body: { padding: "22px 24px 20px" },
  title: {
    fontSize: "1.1rem", fontWeight: 800,
    color: "var(--ink)", lineHeight: 1.3,
    marginBottom: 10,
  },
  excerpt: {
    fontSize: "0.88rem", color: "var(--mid)",
    lineHeight: 1.65, marginBottom: 20,
  },
  footer: {
    display: "flex", alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 16, borderTop: "1px solid var(--border)",
  },
  author: { display: "flex", alignItems: "center", gap: 10 },
  avatar: {
    width: 32, height: 32, borderRadius: "50%",
    color: "#fff", fontSize: "0.75rem", fontWeight: 700,
    fontFamily: "var(--font-display)",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  authorName: {
    fontSize: "0.82rem", fontWeight: 600,
    fontFamily: "var(--font-display)", color: "var(--ink)",
  },
  date: { fontSize: "0.72rem", color: "var(--muted)" },
  meta: { display: "flex", alignItems: "center", gap: 12 },
  metaItem: { fontSize: "0.78rem", color: "var(--mid)" },
  readMore: {
    fontSize: "0.82rem", fontWeight: 700,
    color: "var(--blue)", fontFamily: "var(--font-display)",
  },
  deleteBtn: {
    position: "absolute", top: 12, right: 12,
    background: "rgba(255,255,255,0.9)",
    border: "none", borderRadius: 8,
    width: 32, height: 32, fontSize: "0.9rem",
    cursor: "pointer", display: "flex",
    alignItems: "center", justifyContent: "center",
  },
};
