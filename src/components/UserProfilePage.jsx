// src/components/UserProfilePage.jsx
import { useState, useEffect } from "react";
import { updateProfile } from "firebase/auth";
import { doc, setDoc, getDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../firebase/config";
import { toast } from "react-hot-toast";
import AvatarPicker from "./AvatarPicker";

// ── Helpers ────────────────────────────────────────────────────────────────
const getUserDoc = (uid) => doc(db, "users", uid);

async function fetchUserProfile(uid) {
  const snap = await getDoc(getUserDoc(uid));
  return snap.exists() ? snap.data() : {};
}

async function saveUserProfile(uid, data) {
  await setDoc(getUserDoc(uid), data, { merge: true });
}

async function fetchUserPosts(uid) {
  try {
    const q = query(collection(db, "posts"), where("authorId", "==", uid), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch { return []; }
}

function formatDate(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function formatDateShort(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Sub-components ─────────────────────────────────────────────────────────
function StatPill({ label, value }) {
  return (
    <div style={{ background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 99, padding: "6px 18px", textAlign: "center" }}>
      <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, color: "var(--ink)" }}>{value ?? 0}</div>
      <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}

function PostMiniCard({ post, onOpen }) {
  return (
    <article onClick={() => onOpen(post)} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden", cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s", animation: "fadeUp 0.4s ease both" }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "var(--shadow-lg)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
      {post.imageUrl && (
        <div style={{ height: 140, overflow: "hidden" }}>
          <img src={post.imageUrl} alt={post.title} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s" }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")} />
        </div>
      )}
      <div style={{ padding: "14px 16px 16px" }}>
        {post.category && (
          <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--blue)", textTransform: "uppercase", letterSpacing: "0.1em", background: "var(--blue-glow)", padding: "2px 8px", borderRadius: 99 }}>{post.category}</span>
        )}
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 700, color: "var(--ink)", margin: "8px 0 4px", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{post.title}</h3>
        <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--muted)", alignItems: "center" }}>
          <span>❤ {post.likes || 0}</span>
          <span>👁 {post.views || 0}</span>
          <span style={{ marginLeft: "auto" }}>{formatDate(post.createdAt)}</span>
        </div>
      </div>
    </article>
  );
}

function EditField({ label, value, onChange, multiline, placeholder }) {
  const shared = { width: "100%", padding: "10px 14px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", fontFamily: "var(--font-body)", fontSize: 15, color: "var(--ink)", background: "var(--bg)", outline: "none", transition: "border-color 0.2s" };
  return (
    <label style={{ display: "block" }}>
      <div style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--muted)", marginBottom: 6, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</div>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3} style={{ ...shared, resize: "vertical" }}
          onFocus={(e) => (e.target.style.borderColor = "var(--blue)")} onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={shared}
          onFocus={(e) => (e.target.style.borderColor = "var(--blue)")} onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
      )}
    </label>
  );
}

// ── Analytics Dashboard ────────────────────────────────────────────────────
function AnalyticsDashboard({ posts }) {
  const totalViews    = posts.reduce((s, p) => s + (p.views || 0), 0);
  const totalLikes    = posts.reduce((s, p) => s + (p.likes || 0), 0);
  const totalComments = posts.reduce((s, p) => s + (p.commentsCount || 0), 0);
  const avgViews      = posts.length ? Math.round(totalViews / posts.length) : 0;
  const engagementRate = totalViews ? ((totalLikes + totalComments) / totalViews * 100).toFixed(1) : "0.0";

  const topByViews = [...posts].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);
  const topByLikes = [...posts].sort((a, b) => (b.likes || 0) - (a.likes || 0)).slice(0, 3);

  const catMap = {};
  posts.forEach((p) => { catMap[p.category || "Other"] = (catMap[p.category || "Other"] || 0) + 1; });
  const categories = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
  const maxCat = categories[0]?.[1] || 1;
  const maxViews = topByViews[0]?.views || 1;

  return (
    <div style={{ paddingBottom: 60, animation: "fadeUp 0.3s ease" }}>

      {/* Overview Cards */}
      <h2 style={d.sectionTitle}>📊 Overview</h2>
      <div style={d.statsGrid}>
        {[
          { icon: "👁",  label: "Total Views",     value: totalViews.toLocaleString(),    color: "#3b82f6" },
          { icon: "❤️", label: "Total Likes",      value: totalLikes.toLocaleString(),    color: "#ef4444" },
          { icon: "💬", label: "Total Comments",   value: totalComments.toLocaleString(), color: "#8b5cf6" },
          { icon: "📝", label: "Posts Published",  value: posts.length,                   color: "#10b981" },
          { icon: "📈", label: "Avg Views/Post",   value: avgViews.toLocaleString(),      color: "#f59e0b" },
          { icon: "🔥", label: "Engagement Rate",  value: `${engagementRate}%`,           color: "#ec4899" },
        ].map(({ icon, label, value, color }) => (
          <div key={label} style={d.statCard}>
            <div style={{ ...d.statIcon, background: color + "18", color }}>{icon}</div>
            <div style={d.statValue}>{value}</div>
            <div style={d.statLabel}>{label}</div>
          </div>
        ))}
      </div>

      {/* Top Posts by Views */}
      {topByViews.length > 0 && (
        <>
          <h2 style={{ ...d.sectionTitle, marginTop: 36 }}>👁 Top Posts by Views</h2>
          <div style={d.card}>
            {topByViews.map((post, i) => (
              <div key={post.id} style={{ marginBottom: i < topByViews.length - 1 ? 16 : 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                    <span style={d.rank}>#{i + 1}</span>
                    <span style={d.barLabel}>{post.title}</span>
                  </div>
                  <span style={d.barValue}>{(post.views || 0).toLocaleString()} views</span>
                </div>
                <div style={d.barTrack}>
                  <div style={{
                    ...d.barFill,
                    width: `${((post.views || 0) / maxViews) * 100}%`,
                    background: i === 0 ? "var(--blue)" : i === 1 ? "#6366f1" : "#8b5cf6",
                    animationDelay: `${i * 0.1}s`,
                  }} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 24 }}>

        {/* Most Liked */}
        {topByLikes.length > 0 && (
          <div>
            <h2 style={d.sectionTitle}>❤️ Most Liked</h2>
            <div style={d.card}>
              {topByLikes.map((post, i) => (
                <div key={post.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: i > 0 ? "12px 0 0" : "0", borderTop: i > 0 ? "1px solid var(--border)" : "none", marginTop: i > 0 ? 12 : 0 }}>
                  <div style={{ ...d.medal, background: ["#f59e0b", "#94a3b8", "#b45309"][i] + "22", color: ["#f59e0b", "#64748b", "#b45309"][i] }}>
                    {["🥇", "🥈", "🥉"][i]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={d.barLabel}>{post.title}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>❤ {post.likes || 0} · 👁 {post.views || 0}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category Breakdown */}
        {categories.length > 0 && (
          <div>
            <h2 style={d.sectionTitle}>🗂 By Category</h2>
            <div style={d.card}>
              {categories.map(([cat, count], i) => (
                <div key={cat} style={{ marginBottom: i < categories.length - 1 ? 12 : 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--ink)" }}>{cat}</span>
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>{count} post{count !== 1 ? "s" : ""}</span>
                  </div>
                  <div style={d.barTrack}>
                    <div style={{ ...d.barFill, width: `${(count / maxCat) * 100}%`, background: `hsl(${i * 47 + 220}, 70%, 55%)` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      {posts.length > 0 && (
        <>
          <h2 style={{ ...d.sectionTitle, marginTop: 24 }}>🕐 Recent Activity</h2>
          <div style={d.card}>
            {[...posts].slice(0, 5).map((post, i) => (
              <div key={post.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: i > 0 ? "12px 0 0" : "0", borderTop: i > 0 ? "1px solid var(--border)" : "none", marginTop: i > 0 ? 12 : 0 }}>
                <div style={d.activityDot} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={d.barLabel}>{post.title}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                    Published {formatDateShort(post.createdAt)} · ❤ {post.likes || 0} · 👁 {post.views || 0} · 💬 {post.commentsCount || 0}
                  </div>
                </div>
                {post.category && (
                  <span style={{ fontSize: 10, color: "var(--blue)", background: "var(--blue-glow)", padding: "2px 8px", borderRadius: 99, fontFamily: "var(--font-mono)", flexShrink: 0 }}>{post.category}</span>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Empty state */}
      {posts.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--muted)" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
          <p style={{ fontSize: 16 }}>No data yet. Publish your first post to see analytics!</p>
        </div>
      )}
    </div>
  );
}

// ── Dashboard styles ───────────────────────────────────────────────────────
const d = {
  sectionTitle:  { fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 800, color: "var(--ink)", marginBottom: 12, letterSpacing: "-0.02em" },
  statsGrid:     { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 },
  statCard:      { background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "16px 14px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, textAlign: "center" },
  statIcon:      { width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 },
  statValue:     { fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "var(--ink)", letterSpacing: "-0.03em" },
  statLabel:     { fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "var(--font-mono)" },
  card:          { background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "16px 18px" },
  barLabel:      { fontSize: 13, fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 200 },
  barValue:      { fontSize: 12, color: "var(--muted)", flexShrink: 0, marginLeft: 8 },
  barTrack:      { height: 6, background: "var(--bg-2)", borderRadius: 99, overflow: "hidden" },
  barFill:       { height: "100%", borderRadius: 99, transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)", animation: "growBar 0.8s ease both" },
  rank:          { fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--muted)", flexShrink: 0 },
  medal:         { width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 },
  activityDot:   { width: 8, height: 8, borderRadius: "50%", background: "var(--blue)", flexShrink: 0 },
};

// ── Main Component ─────────────────────────────────────────────────────────
export default function UserProfilePage({ currentUser, onClose, onOpenPost, allPosts = [], isDemo }) {
  const [tab, setTab]               = useState("posts");
  const [profile, setProfile]       = useState({ displayName: "", bio: "", website: "", photoURL: "" });
  const [userPosts, setUserPosts]   = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [saving, setSaving]         = useState(false);
  const [followers, setFollowers]   = useState([]);
  const [following, setFollowing]   = useState([]);

  useEffect(() => {
    if (!currentUser) return;
    setProfile((p) => ({ ...p, displayName: currentUser.displayName || "", photoURL: currentUser.photoURL || "" }));
    fetchUserProfile(currentUser.uid).then((data) => {
      setProfile((p) => ({ ...p, ...data }));
      setFollowers(data.followers || []);
      setFollowing(data.following || []);
    });
    fetchUserPosts(currentUser.uid).then((posts) => {
      if (posts.length === 0 && allPosts.length > 0) {
        setUserPosts(allPosts.filter((p) => p.authorId === currentUser.uid || p.author === currentUser.displayName));
      } else {
        setUserPosts(posts);
      }
      setLoadingPosts(false);
    });
  }, [currentUser]);

  const handleSave = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      const { displayName, bio, website, photoURL } = profile;
      await updateProfile(currentUser, { displayName, photoURL });
      await saveUserProfile(currentUser.uid, { displayName, bio, website, photoURL });
      toast.success("Profile saved!");
      setTab("posts");
    } catch { toast.error("Save failed."); }
    finally { setSaving(false); }
  };

  if (!currentUser) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
        <p style={{ fontFamily: "var(--font-display)", fontSize: 20 }}>Sign in to view your profile.</p>
        <button onClick={onClose} style={{ background: "var(--blue)", color: "#fff", border: "none", borderRadius: 99, padding: "10px 24px", fontFamily: "var(--font-display)", fontWeight: 700, cursor: "pointer" }}>← Back</button>
      </div>
    );
  }

  const joinedDate = currentUser.metadata?.creationTime
    ? new Date(currentUser.metadata.creationTime).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;

  const TABS = [
    ["posts",     "📝 Posts"],
    ["analytics", "📊 Analytics"],
    ["edit",      "✎ Edit"],
  ];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "var(--bg)", overflowY: "auto", animation: "fadeIn 0.3s ease" }}>

      {/* Top bar */}
      <div style={{ position: "sticky", top: 0, zIndex: 10, background: "rgba(248,250,255,0.9)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", padding: "0 24px", height: 56 }}>
        <button onClick={onClose} style={{ background: "none", border: "none", fontFamily: "var(--font-display)", fontSize: 14, color: "var(--blue)", cursor: "pointer", padding: "6px 0" }}>← Back</button>
        <span style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16, color: "var(--ink)" }}>Profile</span>
      </div>

      {/* Cover */}
      <div style={{ position: "relative" }}>
        <div style={{ height: 180, background: "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 50%, #93c5fd 100%)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
          <div style={{ position: "absolute", bottom: -60, left: 60, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        </div>
        <div style={{ position: "absolute", bottom: -48, left: 32 }}>
          <div style={{ width: 96, height: 96, borderRadius: "50%", border: "3px solid var(--border)", overflow: "hidden", background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(29,78,216,0.18)" }}>
            {profile.photoURL ? (
              <img src={profile.photoURL} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 32, color: "#fff" }}>
                {(profile.displayName || currentUser.email || "?")[0].toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ height: 60 }} />

        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26, color: "var(--ink)", letterSpacing: "-0.03em" }}>
            {profile.displayName || currentUser.email?.split("@")[0] || "Anonymous"}
          </h1>
          {currentUser.email && <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2, fontFamily: "var(--font-mono)" }}>{currentUser.email}</div>}
          {profile.bio && <p style={{ marginTop: 10, fontSize: 15, color: "var(--ink)", lineHeight: 1.6, maxWidth: 520 }}>{profile.bio}</p>}
          <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
            {profile.website && (
              <a href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "var(--blue)", fontFamily: "var(--font-mono)" }}>
                🔗 {profile.website.replace(/^https?:\/\//, "")}
              </a>
            )}
            {joinedDate && <span style={{ fontSize: 12, color: "var(--muted)" }}>📅 Joined {joinedDate}</span>}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
          <StatPill label="Posts"       value={userPosts.length} />
          <StatPill label="Followers"   value={followers.length} />
          <StatPill label="Following"   value={following.length} />
          <StatPill label="Total Views" value={userPosts.reduce((s, p) => s + (p.views || 0), 0)} />
          <StatPill label="Total Likes" value={userPosts.reduce((s, p) => s + (p.likes || 0), 0)} />
        </div>

        <div style={{ height: 1, background: "var(--border)", margin: "28px 0 0" }} />

        {/* Tab Bar */}
        <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--border)", marginBottom: 24 }}>
          {TABS.map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              padding: "12px 20px", background: "none", border: "none",
              borderBottom: tab === key ? "2px solid var(--blue)" : "2px solid transparent",
              color: tab === key ? "var(--blue)" : "var(--muted)",
              fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13,
              cursor: "pointer", transition: "all 0.2s", marginBottom: -1,
            }}>
              {label}
            </button>
          ))}
        </div>

        {/* POSTS TAB */}
        {tab === "posts" && (
          <div style={{ animation: "fadeUp 0.3s ease", paddingBottom: 60 }}>
            {loadingPosts ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 16 }}>
                {[1, 2, 3].map((i) => <div key={i} style={{ height: 220, borderRadius: "var(--radius)", background: "linear-gradient(90deg,var(--bg-2) 25%,var(--border) 50%,var(--bg-2) 75%)", backgroundSize: "400px 100%", animation: "shimmer 1.4s infinite" }} />)}
              </div>
            ) : userPosts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--muted)" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✍️</div>
                <p style={{ fontSize: 16 }}>No posts yet. Start writing!</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
                {userPosts.map((post, i) => (
                  <div key={post.id} style={{ animationDelay: `${i * 0.06}s` }}>
                    <PostMiniCard post={post} onOpen={onOpenPost} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ANALYTICS TAB */}
        {tab === "analytics" && (
          loadingPosts ? (
            <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>Loading analytics…</div>
          ) : (
            <AnalyticsDashboard posts={userPosts} />
          )
        )}

        {/* EDIT TAB */}
        {tab === "edit" && (
          <div style={{ animation: "fadeUp 0.3s ease", maxWidth: 560, paddingBottom: 60 }}>
            <div style={{ background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 20, marginBottom: 24 }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>Choose Avatar</div>
              <AvatarPicker selected={profile.photoURL} onSelect={(url) => setProfile((p) => ({ ...p, photoURL: url }))} uid={currentUser.uid} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <EditField label="Display Name" value={profile.displayName} onChange={(v) => setProfile((p) => ({ ...p, displayName: v }))} placeholder="Your name" />
              <EditField label="Bio" value={profile.bio || ""} onChange={(v) => setProfile((p) => ({ ...p, bio: v }))} placeholder="A short bio about yourself…" multiline />
              <EditField label="Website" value={profile.website || ""} onChange={(v) => setProfile((p) => ({ ...p, website: v }))} placeholder="yoursite.com" />
            </div>
            <button onClick={handleSave} disabled={saving}
              style={{ marginTop: 24, background: "var(--blue)", color: "#fff", border: "none", borderRadius: 99, padding: "12px 32px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, cursor: saving ? "wait" : "pointer", opacity: saving ? 0.7 : 1, transition: "opacity 0.2s, transform 0.2s", boxShadow: "0 4px 16px rgba(29,78,216,0.25)" }}
              onMouseEnter={(e) => !saving && (e.currentTarget.style.transform = "translateY(-2px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}