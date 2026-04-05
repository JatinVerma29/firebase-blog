// src/components/PostsSection.jsx
import { useState, useMemo } from "react";
import PostCard from "./PostCard";
import { deletePost } from "../firebase/posts";

const CATEGORIES = ["All", "Technology", "Agile", "Design", "Business", "Innovation", "Tutorial"];

export default function PostsSection({ posts, loading, isDemo, onOpenPost }) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        (p.title || "").toLowerCase().includes(q) ||
        (p.content || "").toLowerCase().includes(q) ||
        (p.author || "").toLowerCase().includes(q);
      const matchesCat =
        activeCategory === "All" || p.category === activeCategory;
      return matchesSearch && matchesCat;
    });
  }, [posts, search, activeCategory]);

  const handleDelete = async (id, imagePath) => {
    if (!window.confirm("Delete this post?")) return;
    try {
      if (!isDemo) await deletePost(id, imagePath);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <section id="posts" style={s.section}>
      <div style={s.inner}>
        {/* Header */}
        <div style={s.head}>
          <div style={s.label}>📝 Latest Posts</div>
          <h2 style={s.title}>Fresh from the Engine</h2>
          <p style={s.sub}>
            {isDemo
              ? "Demo posts — configure Firebase to enable real-time publishing"
              : "Real-time posts powered by Firebase Firestore"}
          </p>
        </div>

        {/* Toolbar */}
        <div style={s.toolbar}>
          {/* Search */}
          <div style={s.searchWrap}>
            <span style={s.searchIcon}>🔍</span>
            <input
              style={s.searchInput}
              placeholder="Search posts, authors, topics…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button style={s.clearBtn} onClick={() => setSearch("")}>✕</button>
            )}
          </div>

          {/* Category pills */}
          <div style={s.cats}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                style={{
                  ...s.catBtn,
                  background: activeCategory === cat ? "var(--blue)" : "#fff",
                  color: activeCategory === cat ? "#fff" : "var(--mid)",
                  borderColor: activeCategory === cat ? "var(--blue)" : "var(--border)",
                }}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        {!loading && (
          <div style={s.countRow}>
            <span style={s.count}>
              {filtered.length} post{filtered.length !== 1 ? "s" : ""}
              {search && ` for "${search}"`}
              {activeCategory !== "All" && ` in ${activeCategory}`}
            </span>
            {isDemo && (
              <span style={s.demoBadge}>
                ⚡ Demo Mode — Real-time disabled
              </span>
            )}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <SkeletonGrid />
        ) : filtered.length === 0 ? (
          <EmptyState search={search} />
        ) : (
          <div style={s.grid}>
            {filtered.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onClick={onOpenPost}
                onDelete={handleDelete}
                showDelete={!isDemo}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function SkeletonGrid() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 28 }}>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{
          background: "#fff", borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border)", overflow: "hidden",
        }}>
          <div style={{ height: 210, background: "var(--bg-2)", animation: "shimmer 1.5s infinite" }} />
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
            {[80, 100, 60].map((w) => (
              <div key={w} style={{
                height: 14, width: `${w}%`,
                background: "var(--bg-2)", borderRadius: 6,
                animation: "shimmer 1.5s infinite",
                backgroundImage: "linear-gradient(90deg, var(--bg-2) 25%, var(--bg) 50%, var(--bg-2) 75%)",
                backgroundSize: "400px 100%",
              }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ search }) {
  return (
    <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--mid)" }}>
      <div style={{ fontSize: "3rem", marginBottom: 16 }}>
        {search ? "🔍" : "📭"}
      </div>
      <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", fontWeight: 800, color: "var(--ink)", marginBottom: 8 }}>
        {search ? "No results found" : "No posts yet"}
      </h3>
      <p style={{ fontSize: "0.9rem" }}>
        {search ? `Try a different search term` : "Be the first to write something amazing!"}
      </p>
    </div>
  );
}

const s = {
  section: { background: "var(--bg)", padding: "100px 48px" },
  inner: { maxWidth: 1200, margin: "0 auto" },
  head: { textAlign: "center", marginBottom: 52 },
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
    letterSpacing: "-1.5px", lineHeight: 1.1, marginBottom: 12,
  },
  sub: { fontSize: "1.02rem", color: "var(--mid)", lineHeight: 1.7 },
  toolbar: { display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 },
  searchWrap: {
    display: "flex", alignItems: "center", gap: 10,
    background: "#fff", border: "1.5px solid var(--border)",
    borderRadius: "var(--radius)", padding: "10px 16px",
    maxWidth: 480,
  },
  searchIcon: { fontSize: "1rem", color: "var(--muted)" },
  searchInput: {
    border: "none", outline: "none",
    fontFamily: "var(--font-body)", fontSize: "0.95rem",
    color: "var(--ink)", width: "100%",
    background: "transparent",
  },
  clearBtn: {
    border: "none", background: "var(--bg)", color: "var(--mid)",
    width: 22, height: 22, borderRadius: "50%", fontSize: "0.75rem",
    cursor: "pointer", flexShrink: 0,
  },
  cats: { display: "flex", gap: 8, flexWrap: "wrap" },
  catBtn: {
    padding: "7px 16px", borderRadius: 100,
    border: "1.5px solid var(--border)", fontSize: "0.82rem",
    fontFamily: "var(--font-display)", fontWeight: 700,
    cursor: "pointer", transition: "all 0.18s",
  },
  countRow: {
    display: "flex", alignItems: "center", gap: 12,
    marginBottom: 28,
  },
  count: { fontSize: "0.85rem", color: "var(--mid)", fontFamily: "var(--font-display)" },
  demoBadge: {
    fontSize: "0.75rem", background: "#fef3c7", color: "#d97706",
    padding: "3px 12px", borderRadius: 100,
    fontFamily: "var(--font-display)", fontWeight: 700,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: 28,
  },
};
