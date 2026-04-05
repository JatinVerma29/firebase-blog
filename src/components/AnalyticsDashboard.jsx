// src/components/AnalyticsDashboard.jsx
// Full-page analytics dashboard for the current user's posts
// Uses pure CSS bar charts (no chart library needed)
// Usage: <AnalyticsDashboard currentUser={user} allPosts={posts} onClose={fn} />

import { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../firebase/config";

// ── Helpers ────────────────────────────────────────────────────────────────
async function fetchUserPosts(uid) {
  try {
    const q = query(
      collection(db, "posts"),
      where("authorId", "==", uid),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch { return []; }
}

function fmt(n) { return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n || 0); }

function formatDate(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color = "var(--blue)", delay = 0 }) {
  return (
    <div style={{
      background: "var(--card)", border: "1px solid var(--border)",
      borderRadius: "var(--radius)", padding: "20px 24px",
      animation: `fadeUp 0.5s ease ${delay}s both`,
      position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: -16, right: -16,
        width: 80, height: 80, borderRadius: "50%",
        background: `${color}18`,
      }} />
      <div style={{ fontSize: 28, marginBottom: 10 }}>{icon}</div>
      <div style={{
        fontFamily: "var(--font-display)", fontWeight: 800,
        fontSize: 32, color: "var(--ink)", lineHeight: 1,
      }}>{fmt(value)}</div>
      <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color, marginTop: 4, fontFamily: "var(--font-mono)" }}>{sub}</div>}
    </div>
  );
}

// ── Bar Chart ──────────────────────────────────────────────────────────────
function BarChart({ data, label, color = "var(--blue)", maxVal }) {
  const max = maxVal || Math.max(...data.map((d) => d.value), 1);
  return (
    <div>
      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, color: "var(--muted)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 100 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--font-mono)" }}>
              {d.value > 0 ? fmt(d.value) : ""}
            </div>
            <div style={{
              width: "100%", borderRadius: "4px 4px 0 0",
              background: color,
              height: `${Math.max((d.value / max) * 80, d.value > 0 ? 4 : 0)}px`,
              transition: `height 0.6s ease ${i * 0.05}s`,
              opacity: 0.85,
            }} />
            <div style={{ fontSize: 9, color: "var(--muted)", textAlign: "center", fontFamily: "var(--font-mono)", lineHeight: 1.2 }}>
              {d.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Post Row ───────────────────────────────────────────────────────────────
function PostRow({ post, rank, maxViews }) {
  const pct = Math.round(((post.views || 0) / Math.max(maxViews, 1)) * 100);
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "12px 0", borderBottom: "1px solid var(--border)",
      animation: `fadeUp 0.4s ease ${rank * 0.07}s both`,
    }}>
      {/* Rank */}
      <div style={{
        width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
        background: rank <= 2 ? "var(--blue)" : "var(--bg-2)",
        color: rank <= 2 ? "#fff" : "var(--muted)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 12,
      }}>
        {rank + 1}
      </div>

      {/* Thumbnail */}
      {post.imageUrl && (
        <img src={post.imageUrl} alt="" style={{
          width: 44, height: 44, borderRadius: 8, objectFit: "cover", flexShrink: 0,
        }} />
      )}

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: "var(--font-display)", fontWeight: 700,
          fontSize: 13, color: "var(--ink)",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {post.title}
        </div>
        {/* Progress bar */}
        <div style={{
          height: 4, background: "var(--bg-2)", borderRadius: 99,
          marginTop: 6, overflow: "hidden",
        }}>
          <div style={{
            height: "100%", width: `${pct}%`,
            background: "linear-gradient(90deg, var(--blue), var(--blue-light))",
            borderRadius: 99, transition: `width 0.8s ease ${rank * 0.07}s`,
          }} />
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 12, flexShrink: 0, fontSize: 12, color: "var(--muted)" }}>
        <span title="Views">👁 {fmt(post.views)}</span>
        <span title="Likes">❤️ {fmt(post.likes)}</span>
        <span title="Comments">💬 {fmt(post.commentsCount)}</span>
      </div>

      <div style={{ fontSize: 11, color: "var(--muted)", flexShrink: 0, fontFamily: "var(--font-mono)" }}>
        {formatDate(post.createdAt)}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function AnalyticsDashboard({ currentUser, allPosts = [], onClose }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("views");

  useEffect(() => {
    if (!currentUser) return;
    fetchUserPosts(currentUser.uid).then((fetched) => {
      if (fetched.length > 0) {
        setPosts(fetched);
      } else {
        // Demo fallback
        setPosts(allPosts.filter(
          (p) => p.authorId === currentUser.uid || p.author === currentUser.displayName
        ));
      }
      setLoading(false);
    });
  }, [currentUser]);

  // ── Aggregate stats ──
  const totalViews    = posts.reduce((s, p) => s + (p.views || 0), 0);
  const totalLikes    = posts.reduce((s, p) => s + (p.likes || 0), 0);
  const totalComments = posts.reduce((s, p) => s + (p.commentsCount || 0), 0);
  const avgEngagement = posts.length
    ? Math.round(((totalLikes + totalComments) / Math.max(totalViews, 1)) * 100)
    : 0;

  // ── Sorted posts ──
  const sorted = [...posts].sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0));
  const maxViews = Math.max(...posts.map((p) => p.views || 0), 1);

  // ── Fake weekly bar chart (based on post data spread across days) ──
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weekViews = days.map((label, i) => ({
    label,
    value: posts.reduce((s, p) => {
      const d = p.createdAt?.toDate ? p.createdAt.toDate() : new Date();
      return d.getDay() === (i + 1) % 7 ? s + (p.views || 0) : s;
    }, 0),
  }));

  const weekLikes = days.map((label, i) => ({
    label,
    value: posts.reduce((s, p) => {
      const d = p.createdAt?.toDate ? p.createdAt.toDate() : new Date();
      return d.getDay() === (i + 1) % 7 ? s + (p.likes || 0) : s;
    }, 0),
  }));

  // Category breakdown
  const catMap = {};
  posts.forEach((p) => { if (p.category) catMap[p.category] = (catMap[p.category] || 0) + 1; });
  const categories = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, value]) => ({ label: label.slice(0, 5), value }));

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "var(--bg)", overflowY: "auto",
      animation: "fadeIn 0.3s ease",
    }}>
      {/* ── Top bar ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        background: "rgba(248,250,255,0.92)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", padding: "0 32px", height: 56,
      }}>
        <button onClick={onClose} style={{ background: "none", border: "none", fontFamily: "var(--font-display)", fontSize: 14, color: "var(--blue)", cursor: "pointer" }}>
          ← Back
        </button>
        <span style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16, color: "var(--ink)" }}>
          📊 Analytics
        </span>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px 80px" }}>

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
            {[1,2,3,4].map((i) => (
              <div key={i} style={{ height: 110, borderRadius: "var(--radius)", background: "linear-gradient(90deg,var(--bg-2) 25%,var(--border) 50%,var(--bg-2) 75%)", backgroundSize: "400px 100%", animation: "shimmer 1.4s infinite" }} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--muted)" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--ink)" }}>No posts yet</h2>
            <p style={{ marginTop: 8 }}>Publish your first post to see analytics here.</p>
          </div>
        ) : (
          <>
            {/* ── Stat cards ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16, marginBottom: 32 }}>
              <StatCard icon="👁" label="Total Views"    value={totalViews}    color="var(--blue)"  delay={0}    sub={`across ${posts.length} posts`} />
              <StatCard icon="❤️" label="Total Likes"    value={totalLikes}    color="#ef4444"      delay={0.05} />
              <StatCard icon="💬" label="Comments"       value={totalComments} color="#10b981"      delay={0.1}  />
              <StatCard icon="⚡" label="Engagement Rate" value={`${avgEngagement}%`} color="#f5c518" delay={0.15} sub="(likes+comments)/views" />
            </div>

            {/* ── Charts row ── */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
              gap: 16, marginBottom: 32,
            }}>
              <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 20, animation: "fadeUp 0.5s ease 0.2s both" }}>
                <BarChart data={weekViews} label="Views by Day" color="var(--blue)" />
              </div>
              <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 20, animation: "fadeUp 0.5s ease 0.25s both" }}>
                <BarChart data={weekLikes} label="Likes by Day" color="#ef4444" />
              </div>
              <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 20, animation: "fadeUp 0.5s ease 0.3s both" }}>
                {categories.length > 0
                  ? <BarChart data={categories} label="Posts by Category" color="#10b981" />
                  : <div style={{ color: "var(--muted)", fontSize: 13, textAlign: "center", paddingTop: 30 }}>No categories yet</div>
                }
              </div>
            </div>

            {/* ── Top posts table ── */}
            <div style={{
              background: "var(--card)", border: "1px solid var(--border)",
              borderRadius: "var(--radius)", padding: "20px 24px",
              animation: "fadeUp 0.5s ease 0.35s both",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16, color: "var(--ink)" }}>
                  Post Performance
                </h2>
                {/* Sort control */}
                <div style={{ display: "flex", gap: 6 }}>
                  {["views", "likes", "commentsCount"].map((k) => (
                    <button key={k} onClick={() => setSortBy(k)} style={{
                      padding: "4px 12px", borderRadius: 99, border: "1px solid",
                      borderColor: sortBy === k ? "var(--blue)" : "var(--border)",
                      background: sortBy === k ? "var(--blue-glow)" : "transparent",
                      color: sortBy === k ? "var(--blue)" : "var(--muted)",
                      fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 11,
                      cursor: "pointer", textTransform: "capitalize",
                    }}>
                      {k === "commentsCount" ? "Comments" : k}
                    </button>
                  ))}
                </div>
              </div>

              {sorted.map((post, i) => (
                <PostRow key={post.id} post={post} rank={i} maxViews={maxViews} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}