// src/components/ai/AIRecommendations.jsx
// Feature 5: Suggests posts based on reading history
import { useState, useEffect } from "react";
import { getRecommendations } from "../../ai/aiService";

const CATEGORY_COLORS = {
  Technology: { bg: "#dbeafe", color: "#1d4ed8" },
  Agile:      { bg: "#d1fae5", color: "#059669" },
  Design:     { bg: "#ede9fe", color: "#7c3aed" },
  Business:   { bg: "#fee2e2", color: "#dc2626" },
  Tutorial:   { bg: "#fef3c7", color: "#d97706" },
  Innovation: { bg: "#e0f2fe", color: "#0284c7" },
  General:    { bg: "#f1f5f9", color: "#64748b" },
};

// Reading history stored in localStorage
export const trackRead = (postId) => {
  try {
    const hist = JSON.parse(localStorage.getItem("aero_read_history") || "[]");
    if (!hist.includes(postId)) {
      hist.unshift(postId);
      localStorage.setItem("aero_read_history", JSON.stringify(hist.slice(0, 20)));
    }
  } catch {}
};

export const getReadHistory = () => {
  try {
    return JSON.parse(localStorage.getItem("aero_read_history") || "[]");
  } catch { return []; }
};

export default function AIRecommendations({ currentPostId, allPosts, onOpenPost }) {
  const [recs, setRecs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  useEffect(() => {
    if (!allPosts || allPosts.length < 2) { setLoading(false); return; }

    const history = getReadHistory();
    // Always include current post in history for better recs
    const fullHistory = [currentPostId, ...history.filter((id) => id !== currentPostId)];

    getRecommendations(fullHistory, allPosts)
      .then((res) => { setRecs(res); setLoading(false); })
      .catch(() => {
        // Fallback: just show 3 random posts
        const fallback = allPosts
          .filter((p) => p.id !== currentPostId)
          .slice(0, 3);
        setRecs(fallback);
        setLoading(false);
        setError(true);
      });
  }, [currentPostId, allPosts]);

  if (loading) {
    return (
      <div style={s.wrap}>
        <div style={s.header}>
          <span style={s.title}>🤖 AI Recommendations</span>
          <span style={s.badge}>Personalised</span>
        </div>
        <div style={s.skeletonRow}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={s.skeletonCard}>
              <div style={{ ...s.skeletonLine, width: "80%" }} />
              <div style={{ ...s.skeletonLine, width: "60%" }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (recs.length === 0) return null;

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <div style={s.titleRow}>
          <span style={s.title}>🤖 You Might Also Like</span>
          <span style={s.badge}>{error ? "Suggested" : "AI Personalised"}</span>
        </div>
        <span style={s.sub}>Based on your reading history</span>
      </div>

      <div style={s.cards}>
        {recs.map((post) => {
          const cat = CATEGORY_COLORS[post.category] || CATEGORY_COLORS.General;
          const excerpt = (post.excerpt || post.content || "").substring(0, 80) + "…";

          return (
            <div
              key={post.id}
              style={s.card}
              onClick={() => onOpenPost(post)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(29,78,216,0.12)";
                e.currentTarget.style.borderColor = "rgba(29,78,216,0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.borderColor = "var(--border)";
              }}
            >
              {/* Image or emoji */}
              <div style={s.cardImg}>
                {post.imageUrl ? (
                  <img
                    src={post.imageUrl} alt={post.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                ) : (
                  <span style={{ fontSize: "1.8rem" }}>{post.emoji || "📝"}</span>
                )}
              </div>

              <div style={s.cardBody}>
                <span style={{ ...s.catBadge, background: cat.bg, color: cat.color }}>
                  {post.category || "General"}
                </span>
                <h4 style={s.cardTitle}>{post.title}</h4>
                <p style={s.cardExcerpt}>{excerpt}</p>
                <div style={s.cardMeta}>
                  <span style={s.cardAuthor}>By {post.author || "Anonymous"}</span>
                  <span style={s.cardRead}>Read →</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={s.poweredBy}>✨ Recommendations powered by Claude AI</div>
    </div>
  );
}

const s = {
  wrap: {
    marginTop: 40, paddingTop: 32,
    borderTop: "1px solid var(--border)",
  },
  header: { marginBottom: 20 },
  titleRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 4 },
  title: {
    fontFamily: "var(--font-display)", fontWeight: 800,
    fontSize: "1.1rem", color: "var(--ink)",
  },
  badge: {
    fontSize: "0.68rem", fontWeight: 700,
    fontFamily: "var(--font-display)",
    background: "#1d4ed8", color: "#fff",
    padding: "2px 8px", borderRadius: 100,
  },
  sub: { fontSize: "0.82rem", color: "var(--muted)", fontFamily: "var(--font-display)" },
  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: 14,
  },
  card: {
    background: "var(--card)", border: "1px solid var(--border)",
    borderRadius: 12, overflow: "hidden", cursor: "pointer",
    transition: "all 0.25s ease",
  },
  cardImg: {
    height: 100, background: "linear-gradient(135deg, #1d4ed8, #1e40af)",
    display: "flex", alignItems: "center", justifyContent: "center",
    overflow: "hidden",
  },
  cardBody: { padding: "12px 14px" },
  catBadge: {
    fontSize: "0.64rem", fontWeight: 700,
    fontFamily: "var(--font-display)",
    padding: "2px 8px", borderRadius: 100,
    display: "inline-block", marginBottom: 6,
  },
  cardTitle: {
    fontFamily: "var(--font-display)", fontWeight: 800,
    fontSize: "0.85rem", color: "var(--ink)",
    lineHeight: 1.3, marginBottom: 6,
  },
  cardExcerpt: {
    fontSize: "0.76rem", color: "var(--mid)",
    lineHeight: 1.5, marginBottom: 8,
  },
  cardMeta: {
    display: "flex", alignItems: "center",
    justifyContent: "space-between",
  },
  cardAuthor: { fontSize: "0.7rem", color: "var(--muted)", fontFamily: "var(--font-display)" },
  cardRead: {
    fontSize: "0.72rem", fontWeight: 700,
    color: "var(--blue)", fontFamily: "var(--font-display)",
  },
  skeletonRow: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 },
  skeletonCard: {
    background: "var(--card)", border: "1px solid var(--border)",
    borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 8,
  },
  skeletonLine: {
    height: 12, borderRadius: 6,
    background: "linear-gradient(90deg, var(--bg-2) 25%, var(--border) 50%, var(--bg-2) 75%)",
    backgroundSize: "400px 100%",
    animation: "shimmer 1.4s ease infinite",
  },
  poweredBy: {
    textAlign: "center", fontSize: "0.7rem",
    color: "var(--muted)", fontFamily: "var(--font-display)",
    marginTop: 16,
  },
};