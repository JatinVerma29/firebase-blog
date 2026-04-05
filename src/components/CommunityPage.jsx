// src/components/CommunityPage.jsx
import { useState, useEffect, useRef } from "react";
import {
  subscribeToCommunity, createCommunityPost,
  addReply, subscribeToReplies, likeCommunityPost,
  deleteCommunityPost,
} from "../firebase/community";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase/config";

function timeAgo(ts) {
  if (!ts) return "just now";
  const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  const diff = (Date.now() - d) / 1000;
  if (diff < 60)    return "just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function RenderText({ text }) {
  const parts = text.split(/(@\w[\w\s]*)/g);
  return (
    <span>
      {parts.map((p, i) =>
        p.startsWith("@")
          ? <span key={i} style={{ color: "var(--blue)", fontWeight: 700, fontFamily: "var(--font-display)" }}>{p}</span>
          : <span key={i}>{p}</span>
      )}
    </span>
  );
}

const TOPICS = ["General", "Questions", "Showcase", "Feedback", "Tech", "Agile", "Design"];
const TABS   = [["feed", "💬 Feed"], ["leaderboard", "🏆 Leaderboard"]];

// ── Leaderboard ────────────────────────────────────────────────────────────
function Leaderboard() {
  const [authors, setAuthors]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [sortBy, setSortBy]     = useState("views"); // views | likes | posts

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(200)));
        const posts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        // Aggregate by author
        const map = {};
        posts.forEach((p) => {
          const key = p.uid || p.author;
          if (!key) return;
          if (!map[key]) {
            map[key] = {
              uid:      p.uid,
              name:     p.author || "Anonymous",
              photoURL: p.photoURL || null,
              views:    0, likes: 0, posts: 0, comments: 0,
            };
          }
          map[key].views    += p.views    || 0;
          map[key].likes    += p.likes    || 0;
          map[key].comments += p.commentsCount || 0;
          map[key].posts    += 1;
        });

        setAuthors(Object.values(map));
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    fetch();
  }, []);

  const sorted = [...authors].sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0)).slice(0, 20);

  const MEDAL = ["🥇", "🥈", "🥉"];
  const SORT_OPTS = [
    { key: "views", label: "👁 Views" },
    { key: "likes", label: "❤️ Likes" },
    { key: "posts", label: "📝 Posts" },
  ];

  const maxVal = sorted[0]?.[sortBy] || 1;

  return (
    <div style={{ padding: "0 24px 40px" }}>

      {/* Sort tabs */}
      <div style={lb.sortRow}>
        {SORT_OPTS.map(({ key, label }) => (
          <button key={key} style={{
            ...lb.sortBtn,
            background: sortBy === key ? "var(--blue)" : "var(--bg-2)",
            color:      sortBy === key ? "#fff" : "var(--mid)",
            borderColor: sortBy === key ? "var(--blue)" : "var(--border)",
          }} onClick={() => setSortBy(key)}>{label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
          Loading leaderboard…
        </div>
      ) : sorted.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏆</div>
          <p>No data yet. Publish posts to appear here!</p>
        </div>
      ) : (
        <>
          {/* Top 3 podium */}
          <div style={lb.podium}>
            {sorted.slice(0, 3).map((a, i) => (
              <div key={a.uid || a.name} style={{
                ...lb.podiumCard,
                order: i === 0 ? 2 : i === 1 ? 1 : 3,
                marginTop: i === 0 ? 0 : i === 1 ? 16 : 24,
                borderColor: i === 0 ? "#f5c518" : i === 1 ? "#94a3b8" : "#b45309",
                boxShadow: i === 0 ? "0 4px 20px rgba(245,197,24,0.2)" : "none",
              }}>
                <div style={{ fontSize: "1.8rem", marginBottom: 6 }}>{MEDAL[i]}</div>
                <div style={lb.podiumAvatar}>
                  {a.photoURL
                    ? <img src={a.photoURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : (a.name || "?")[0].toUpperCase()}
                </div>
                <div style={lb.podiumName}>{a.name}</div>
                <div style={lb.podiumStat}>
                  {sortBy === "views" && `👁 ${a.views.toLocaleString()}`}
                  {sortBy === "likes" && `❤️ ${a.likes.toLocaleString()}`}
                  {sortBy === "posts" && `📝 ${a.posts}`}
                </div>
                <div style={lb.podiumMini}>
                  {a.posts} posts · {a.likes} likes
                </div>
              </div>
            ))}
          </div>

          {/* Rest of leaderboard */}
          {sorted.length > 3 && (
            <div style={lb.list}>
              {sorted.slice(3).map((a, i) => (
                <div key={a.uid || a.name} style={lb.row}>
                  <span style={lb.rowRank}>#{i + 4}</span>
                  <div style={lb.rowAvatar}>
                    {a.photoURL
                      ? <img src={a.photoURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                      : (a.name || "?")[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={lb.rowName}>{a.name}</div>
                    <div style={lb.rowMeta}>{a.posts} posts · ❤️ {a.likes} · 👁 {a.views}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={lb.rowVal}>
                      {(a[sortBy] || 0).toLocaleString()}
                    </div>
                    <div style={lb.rowValLabel}>{sortBy}</div>
                    {/* Mini bar */}
                    <div style={lb.barTrack}>
                      <div style={{ ...lb.barFill, width: `${((a[sortBy] || 0) / maxVal) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer note */}
          <p style={{ fontSize: 11, color: "var(--muted)", textAlign: "center", marginTop: 20, fontFamily: "var(--font-mono)" }}>
            Rankings based on all published posts · Updates on page load
          </p>
        </>
      )}
    </div>
  );
}

// ── Single community thread card ──
function ThreadCard({ post, currentUser, isDemo, onMention }) {
  const [expanded, setExpanded]   = useState(false);
  const [replies, setReplies]     = useState([]);
  const [replyText, setReplyText] = useState("");
  const [liked, setLiked]         = useState(false);
  const [likes, setLikes]         = useState(post.likes || 0);
  const [sending, setSending]     = useState(false);
  const inputRef = useRef();

  useEffect(() => {
    if (!expanded || isDemo) return;
    const unsub = subscribeToReplies(post.id, setReplies);
    return unsub;
  }, [expanded, post.id, isDemo]);

  const handleLike = async () => {
    if (liked) return;
    setLiked(true); setLikes((n) => n + 1);
    if (!isDemo) await likeCommunityPost(post.id).catch(() => {});
  };

  const handleReply = async () => {
    if (!replyText.trim() || !currentUser) return;
    setSending(true);
    const payload = {
      name:     currentUser.displayName || "Anonymous",
      uid:      currentUser.uid,
      photoURL: currentUser.photoURL || null,
      text:     replyText.trim(),
    };
    if (isDemo) {
      setReplies((p) => [...p, { id: Date.now().toString(), ...payload, createdAt: { seconds: Date.now() / 1000 } }]);
    } else {
      await addReply(post.id, payload).catch(() => {});
    }
    setReplyText(""); setSending(false);
  };

  const initials = (post.name || "U")[0].toUpperCase();

  return (
    <div style={tc.card}>
      <div style={tc.header}>
        <div style={tc.avatar}>
          {post.photoURL
            ? <img src={post.photoURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : initials}
        </div>
        <div style={{ flex: 1 }}>
          <div style={tc.meta}>
            <span style={tc.name}>{post.name}</span>
            <span style={tc.topic}>{post.topic || "General"}</span>
            <span style={tc.time}>{timeAgo(post.createdAt)}</span>
          </div>
          {post.title && <div style={tc.title}>{post.title}</div>}
        </div>
        {currentUser?.uid === post.uid && (
          <button style={tc.deleteBtn}
            onClick={() => !isDemo && deleteCommunityPost(post.id).catch(() => {})}>
            🗑️
          </button>
        )}
      </div>
      <div style={tc.body}><RenderText text={post.text} /></div>
      <div style={tc.actions}>
        <button style={{ ...tc.actionBtn, color: liked ? "#ef4444" : "var(--mid)" }} onClick={handleLike}>
          {liked ? "❤️" : "🤍"} {likes}
        </button>
        <button style={tc.actionBtn} onClick={() => setExpanded((e) => !e)}>
          💬 {post.repliesCount || 0} {expanded ? "▲" : "▼"}
        </button>
        <button style={tc.actionBtn} onClick={() => onMention(post.name)}>@ Mention</button>
      </div>
      {expanded && (
        <div style={tc.replies}>
          {replies.map((r) => (
            <div key={r.id} style={tc.reply}>
              <div style={tc.replyAvatar}>
                {r.photoURL
                  ? <img src={r.photoURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : (r.name || "U")[0].toUpperCase()}
              </div>
              <div>
                <span style={tc.replyName}>{r.name}</span>
                <span style={tc.replyTime}>{timeAgo(r.createdAt)}</span>
                <p style={tc.replyText}><RenderText text={r.text} /></p>
              </div>
            </div>
          ))}
          {currentUser ? (
            <div style={tc.replyInput}>
              <div style={tc.replyAvatar}>
                {currentUser.photoURL
                  ? <img src={currentUser.photoURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : (currentUser.displayName || "U")[0].toUpperCase()}
              </div>
              <input ref={inputRef} style={tc.replyField}
                placeholder={`Reply to ${post.name}…`}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleReply()} />
              <button style={tc.replySend} onClick={handleReply} disabled={sending || !replyText.trim()}>
                {sending ? "…" : "↑"}
              </button>
            </div>
          ) : (
            <p style={{ fontSize: "0.83rem", color: "var(--muted)", padding: "8px 0" }}>Log in to reply.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Community Page ──
export default function CommunityPage({ onClose, currentUser, isDemo }) {
  const [posts, setPosts]       = useState([]);
  const [localPosts, setLocalPosts] = useState([]);
  const [text, setText]         = useState("");
  const [title, setTitle]       = useState("");
  const [topic, setTopic]       = useState("General");
  const [posting, setPosting]   = useState(false);
  const [activeTab, setActiveTab] = useState("feed");
  const composerRef = useRef();

  useEffect(() => {
    if (isDemo) return;
    const unsub = subscribeToCommunity(setPosts);
    return unsub;
  }, [isDemo]);

  const displayed = isDemo ? localPosts : posts;

  const handlePost = async () => {
    if (!text.trim() || !currentUser) return;
    setPosting(true);
    const payload = {
      name:     currentUser.displayName || "Anonymous",
      uid:      currentUser.uid,
      photoURL: currentUser.photoURL || null,
      title:    title.trim(),
      text:     text.trim(),
      topic,
    };
    if (isDemo) {
      setLocalPosts((p) => [{ id: Date.now().toString(), ...payload, createdAt: { seconds: Date.now() / 1000 }, likes: 0, repliesCount: 0 }, ...p]);
    } else {
      await createCommunityPost(payload).catch(console.error);
    }
    setText(""); setTitle(""); setPosting(false);
  };

  const handleMentionInComposer = (name) => {
    setText((prev) => `@${name} ${prev}`);
    setActiveTab("feed");
    composerRef.current?.focus();
  };

  return (
    <div style={s.backdrop} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={s.panel}>

        {/* Header */}
        <div style={s.header}>
          <div>
            <h2 style={s.title}>👥 Community</h2>
            <p style={s.sub}>Discuss, share, mention authors — all in real-time</p>
          </div>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Tab bar */}
        <div style={s.tabBar}>
          {TABS.map(([key, label]) => (
            <button key={key} style={{
              ...s.tabBtn,
              borderBottom: activeTab === key ? "2px solid var(--blue)" : "2px solid transparent",
              color: activeTab === key ? "var(--blue)" : "var(--mid)",
            }} onClick={() => setActiveTab(key)}>{label}</button>
          ))}
        </div>

        {/* ── FEED TAB ── */}
        {activeTab === "feed" && (
          <>
            {currentUser ? (
              <div style={s.composer}>
                <div style={s.composerTop}>
                  <div style={s.composerAvatar}>
                    {currentUser.photoURL
                      ? <img src={currentUser.photoURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : (currentUser.displayName || "U")[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <input style={s.titleInput} placeholder="Title (optional)"
                      value={title} onChange={(e) => setTitle(e.target.value)} />
                    <textarea ref={composerRef} style={s.textArea} rows={3}
                      placeholder="Share something with the community… use @name to mention someone"
                      value={text} onChange={(e) => setText(e.target.value)} maxLength={600} />
                  </div>
                </div>
                <div style={s.composerFooter}>
                  <div style={s.topicRow}>
                    {TOPICS.map((t) => (
                      <button key={t} style={{
                        ...s.topicBtn,
                        background:  topic === t ? "var(--blue)" : "var(--bg)",
                        color:       topic === t ? "#fff" : "var(--mid)",
                        borderColor: topic === t ? "var(--blue)" : "var(--border)",
                      }} onClick={() => setTopic(t)}>{t}</button>
                    ))}
                  </div>
                  <button style={{ ...s.postBtn, opacity: (!text.trim() || posting) ? 0.6 : 1 }}
                    onClick={handlePost} disabled={!text.trim() || posting}>
                    {posting ? "Posting…" : "Post →"}
                  </button>
                </div>
              </div>
            ) : (
              <div style={s.loginPrompt}>
                🔐 <strong>Log in</strong> to post in the community and reply to threads.
              </div>
            )}

            <div style={s.feed}>
              {displayed.length === 0 ? (
                <div style={s.empty}>
                  <span style={{ fontSize: "3rem" }}>🌐</span>
                  <h3 style={s.emptyTitle}>No posts yet</h3>
                  <p style={s.emptySub}>Start the conversation!</p>
                </div>
              ) : (
                displayed.map((post) => (
                  <ThreadCard key={post.id} post={post} currentUser={currentUser}
                    isDemo={isDemo} onMention={handleMentionInComposer} />
                ))
              )}
            </div>
          </>
        )}

        {/* ── LEADERBOARD TAB ── */}
        {activeTab === "leaderboard" && <Leaderboard />}

      </div>
    </div>
  );
}

// ── Leaderboard styles ──
const lb = {
  sortRow: { display: "flex", gap: 8, padding: "16px 0 20px", flexWrap: "wrap" },
  sortBtn: { padding: "7px 16px", borderRadius: 100, border: "1px solid var(--border)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer", transition: "all 0.2s" },
  podium: { display: "flex", justifyContent: "center", gap: 12, marginBottom: 28, alignItems: "flex-end" },
  podiumCard: { background: "var(--card)", border: "2px solid var(--border)", borderRadius: 16, padding: "16px 12px", textAlign: "center", flex: 1, maxWidth: 160, transition: "transform 0.2s" },
  podiumAvatar: { width: 52, height: 52, borderRadius: "50%", background: "var(--blue)", color: "#fff", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.2rem", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", overflow: "hidden" },
  podiumName: { fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "0.85rem", color: "var(--ink)", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  podiumStat: { fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1rem", color: "var(--blue)", marginBottom: 4 },
  podiumMini: { fontSize: "0.7rem", color: "var(--muted)", fontFamily: "var(--font-mono)" },
  list: { display: "flex", flexDirection: "column", gap: 2 },
  row: { display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, marginBottom: 6 },
  rowRank: { fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "0.78rem", color: "var(--muted)", width: 28, flexShrink: 0 },
  rowAvatar: { width: 36, height: 36, borderRadius: "50%", background: "var(--blue)", color: "#fff", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" },
  rowName: { fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.88rem", color: "var(--ink)" },
  rowMeta: { fontSize: "0.74rem", color: "var(--muted)", marginTop: 2 },
  rowVal: { fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "0.95rem", color: "var(--blue)" },
  rowValLabel: { fontSize: "0.66rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" },
  barTrack: { height: 3, background: "var(--bg-2)", borderRadius: 99, marginTop: 4, width: 80 },
  barFill: { height: "100%", background: "var(--blue)", borderRadius: 99, transition: "width 0.6s ease" },
};

// ── ThreadCard styles ──
const tc = {
  card: { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 20px", marginBottom: 14, transition: "box-shadow 0.2s" },
  header: { display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 10 },
  avatar: { width: 40, height: 40, borderRadius: "50%", background: "var(--blue)", color: "#fff", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" },
  meta: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 },
  name: { fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "0.88rem", color: "var(--ink)" },
  topic: { fontSize: "0.7rem", fontWeight: 700, fontFamily: "var(--font-display)", background: "var(--bg-2)", color: "var(--blue)", padding: "2px 8px", borderRadius: 100, border: "1px solid rgba(29,78,216,0.2)" },
  time: { fontSize: "0.74rem", color: "var(--muted)" },
  title: { fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "0.95rem", color: "var(--ink)" },
  deleteBtn: { background: "none", border: "none", cursor: "pointer", fontSize: "0.85rem", opacity: 0.5, marginLeft: "auto" },
  body: { fontSize: "0.93rem", lineHeight: 1.68, color: "var(--ink-2, #374151)", fontFamily: "var(--font-body)", marginBottom: 12 },
  actions: { display: "flex", gap: 6 },
  actionBtn: { padding: "5px 12px", borderRadius: 100, background: "var(--bg)", border: "1px solid var(--border)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.76rem", color: "var(--mid)", cursor: "pointer", transition: "all 0.2s" },
  replies: { marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 10 },
  reply: { display: "flex", gap: 10, alignItems: "flex-start" },
  replyAvatar: { width: 30, height: 30, borderRadius: "50%", background: "var(--blue)", color: "#fff", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "0.76rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" },
  replyName: { fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.82rem", color: "var(--ink)", marginRight: 8 },
  replyTime: { fontSize: "0.72rem", color: "var(--muted)" },
  replyText: { fontSize: "0.88rem", lineHeight: 1.6, color: "var(--mid)", marginTop: 2 },
  replyInput: { display: "flex", gap: 8, alignItems: "center", marginTop: 6 },
  replyField: { flex: 1, padding: "8px 12px", border: "1.5px solid var(--border)", borderRadius: 8, fontFamily: "var(--font-body)", fontSize: "0.88rem", color: "var(--ink)", background: "var(--bg)", outline: "none" },
  replySend: { width: 34, height: 34, borderRadius: "50%", background: "var(--blue)", color: "#fff", border: "none", cursor: "pointer", fontWeight: 800, fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center" },
};

// ── Page styles ──
const s = {
  backdrop: { position: "fixed", inset: 0, zIndex: 200, background: "rgba(12,12,20,0.65)", backdropFilter: "blur(12px)", display: "flex", alignItems: "flex-start", justifyContent: "flex-end", animation: "fadeIn 0.2s ease" },
  panel: { background: "var(--bg)", width: "100%", maxWidth: 600, height: "100vh", overflowY: "auto", display: "flex", flexDirection: "column", borderLeft: "1px solid var(--border)", animation: "slideIn 0.3s ease" },
  header: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "28px 24px 16px", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 10, background: "var(--bg)", backdropFilter: "blur(12px)" },
  title: { fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 800, color: "var(--ink)" },
  sub: { fontSize: "0.84rem", color: "var(--mid)", marginTop: 4 },
  closeBtn: { background: "var(--bg-2)", border: "1px solid var(--border)", width: 36, height: 36, borderRadius: "50%", cursor: "pointer", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center" },
  tabBar: { display: "flex", borderBottom: "1px solid var(--border)", padding: "0 24px", position: "sticky", top: 85, zIndex: 9, background: "var(--bg)" },
  tabBtn: { padding: "12px 16px", background: "none", border: "none", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.88rem", cursor: "pointer", transition: "all 0.2s", marginBottom: -1 },
  composer: { margin: "20px 24px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, padding: 16 },
  composerTop: { display: "flex", gap: 12, marginBottom: 12 },
  composerAvatar: { width: 40, height: 40, borderRadius: "50%", background: "var(--blue)", color: "#fff", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" },
  titleInput: { width: "100%", padding: "8px 12px", marginBottom: 8, border: "1.5px solid var(--border)", borderRadius: 8, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9rem", color: "var(--ink)", background: "var(--bg)", outline: "none" },
  textArea: { width: "100%", padding: "8px 12px", border: "1.5px solid var(--border)", borderRadius: 8, fontFamily: "var(--font-body)", fontSize: "0.9rem", color: "var(--ink)", background: "var(--bg)", outline: "none", resize: "vertical", lineHeight: 1.6 },
  composerFooter: { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 },
  topicRow: { display: "flex", gap: 6, flexWrap: "wrap" },
  topicBtn: { padding: "4px 12px", borderRadius: 100, border: "1px solid var(--border)", fontSize: "0.74rem", fontFamily: "var(--font-display)", fontWeight: 700, cursor: "pointer", transition: "all 0.15s" },
  postBtn: { padding: "9px 20px", background: "var(--blue)", color: "#fff", border: "none", borderRadius: 8, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.88rem", cursor: "pointer", transition: "opacity 0.2s" },
  loginPrompt: { margin: "16px 24px", padding: "14px 18px", background: "var(--bg-2)", border: "1px solid rgba(29,78,216,0.2)", borderRadius: 10, fontSize: "0.88rem", color: "var(--mid)", fontFamily: "var(--font-display)" },
  feed: { padding: "0 24px 32px", flex: 1 },
  empty: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", gap: 12, textAlign: "center" },
  emptyTitle: { fontFamily: "var(--font-display)", fontSize: "1.2rem", fontWeight: 800, color: "var(--ink)" },
  emptySub: { fontSize: "0.88rem", color: "var(--mid)" },
};