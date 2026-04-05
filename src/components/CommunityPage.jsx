// src/components/CommunityPage.jsx
import { useState, useEffect, useRef } from "react";
import {
  subscribeToCommunity, createCommunityPost,
  addReply, subscribeToReplies, likeCommunityPost,
  deleteCommunityPost,
} from "../firebase/community";

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
      {/* Header */}
      <div style={tc.header}>
        <div style={tc.avatar}>
          {post.photoURL
            ? <img src={post.photoURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : initials}
        </div>
        <div style={{ flex: 1 }}>
          <div style={tc.meta}>
            <span style={tc.name}>{post.name}</span>
            <span style={{ ...tc.topic }}>{post.topic || "General"}</span>
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

      {/* Body */}
      <div style={tc.body}>
        <RenderText text={post.text} />
      </div>

      {/* Actions */}
      <div style={tc.actions}>
        <button style={{ ...tc.actionBtn, color: liked ? "#ef4444" : "var(--mid)" }} onClick={handleLike}>
          {liked ? "❤️" : "🤍"} {likes}
        </button>
        <button style={tc.actionBtn} onClick={() => setExpanded((e) => !e)}>
          💬 {post.repliesCount || 0} {expanded ? "▲" : "▼"}
        </button>
        <button style={tc.actionBtn} onClick={() => { onMention(post.name); }}>
          @ Mention
        </button>
      </div>

      {/* Replies */}
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

          {/* Reply input */}
          {currentUser ? (
            <div style={tc.replyInput}>
              <div style={tc.replyAvatar}>
                {currentUser.photoURL
                  ? <img src={currentUser.photoURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : (currentUser.displayName || "U")[0].toUpperCase()}
              </div>
              <input
                ref={inputRef}
                style={tc.replyField}
                placeholder={`Reply to ${post.name}… use @name to mention`}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleReply()}
              />
              <button style={tc.replySend} onClick={handleReply} disabled={sending || !replyText.trim()}>
                {sending ? "…" : "↑"}
              </button>
            </div>
          ) : (
            <p style={{ fontSize: "0.83rem", color: "var(--muted)", padding: "8px 0" }}>
              Log in to reply.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Community Page ──
export default function CommunityPage({ onClose, currentUser, isDemo }) {
  const [posts, setPosts]         = useState([]);
  const [localPosts, setLocalPosts] = useState([]);
  const [text, setText]           = useState("");
  const [title, setTitle]         = useState("");
  const [topic, setTopic]         = useState("General");
  const [posting, setPosting]     = useState(false);
  const [mentionText, setMentionText] = useState("");
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

        {/* Composer */}
        {currentUser ? (
          <div style={s.composer}>
            <div style={s.composerTop}>
              <div style={s.composerAvatar}>
                {currentUser.photoURL
                  ? <img src={currentUser.photoURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : (currentUser.displayName || "U")[0].toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <input
                  style={s.titleInput}
                  placeholder="Title (optional)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <textarea
                  ref={composerRef}
                  style={s.textArea}
                  rows={3}
                  placeholder="Share something with the community… use @name to mention someone"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={600}
                />
              </div>
            </div>
            <div style={s.composerFooter}>
              <div style={s.topicRow}>
                {TOPICS.map((t) => (
                  <button key={t} style={{
                    ...s.topicBtn,
                    background: topic === t ? "var(--blue)" : "var(--bg)",
                    color: topic === t ? "#fff" : "var(--mid)",
                    borderColor: topic === t ? "var(--blue)" : "var(--border)",
                  }} onClick={() => setTopic(t)}>{t}</button>
                ))}
              </div>
              <button
                style={{ ...s.postBtn, opacity: (!text.trim() || posting) ? 0.6 : 1 }}
                onClick={handlePost}
                disabled={!text.trim() || posting}>
                {posting ? "Posting…" : "Post →"}
              </button>
            </div>
          </div>
        ) : (
          <div style={s.loginPrompt}>
            🔐 <strong>Log in</strong> to post in the community and reply to threads.
          </div>
        )}

        {/* Feed */}
        <div style={s.feed}>
          {displayed.length === 0 ? (
            <div style={s.empty}>
              <span style={{ fontSize: "3rem" }}>🌐</span>
              <h3 style={s.emptyTitle}>No posts yet</h3>
              <p style={s.emptySub}>Start the conversation!</p>
            </div>
          ) : (
            displayed.map((post) => (
              <ThreadCard
                key={post.id}
                post={post}
                currentUser={currentUser}
                isDemo={isDemo}
                onMention={handleMentionInComposer}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── ThreadCard styles ──
const tc = {
  card: {
    background: "var(--card)", border: "1px solid var(--border)",
    borderRadius: 14, padding: "18px 20px", marginBottom: 14,
    transition: "box-shadow 0.2s",
  },
  header: { display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 10 },
  avatar: {
    width: 40, height: 40, borderRadius: "50%",
    background: "var(--blue)", color: "#fff",
    fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1rem",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, overflow: "hidden",
  },
  meta: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 },
  name: { fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "0.88rem", color: "var(--ink)" },
  topic: {
    fontSize: "0.7rem", fontWeight: 700, fontFamily: "var(--font-display)",
    background: "var(--bg-2)", color: "var(--blue)",
    padding: "2px 8px", borderRadius: 100,
    border: "1px solid rgba(29,78,216,0.2)",
  },
  time: { fontSize: "0.74rem", color: "var(--muted)" },
  title: { fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "0.95rem", color: "var(--ink)" },
  deleteBtn: {
    background: "none", border: "none", cursor: "pointer",
    fontSize: "0.85rem", opacity: 0.5, marginLeft: "auto",
  },
  body: {
    fontSize: "0.93rem", lineHeight: 1.68,
    color: "var(--ink-2, #374151)", fontFamily: "var(--font-body)",
    marginBottom: 12,
  },
  actions: { display: "flex", gap: 6 },
  actionBtn: {
    padding: "5px 12px", borderRadius: 100,
    background: "var(--bg)", border: "1px solid var(--border)",
    fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.76rem",
    color: "var(--mid)", cursor: "pointer", transition: "all 0.2s",
  },
  replies: {
    marginTop: 14, paddingTop: 14,
    borderTop: "1px solid var(--border)",
    display: "flex", flexDirection: "column", gap: 10,
  },
  reply: { display: "flex", gap: 10, alignItems: "flex-start" },
  replyAvatar: {
    width: 30, height: 30, borderRadius: "50%",
    background: "var(--blue)", color: "#fff",
    fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "0.76rem",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, overflow: "hidden",
  },
  replyName: {
    fontFamily: "var(--font-display)", fontWeight: 700,
    fontSize: "0.82rem", color: "var(--ink)", marginRight: 8,
  },
  replyTime: { fontSize: "0.72rem", color: "var(--muted)" },
  replyText: {
    fontSize: "0.88rem", lineHeight: 1.6,
    color: "var(--mid)", marginTop: 2,
  },
  replyInput: { display: "flex", gap: 8, alignItems: "center", marginTop: 6 },
  replyField: {
    flex: 1, padding: "8px 12px", border: "1.5px solid var(--border)",
    borderRadius: 8, fontFamily: "var(--font-body)", fontSize: "0.88rem",
    color: "var(--ink)", background: "var(--bg)", outline: "none",
  },
  replySend: {
    width: 34, height: 34, borderRadius: "50%",
    background: "var(--blue)", color: "#fff", border: "none",
    cursor: "pointer", fontWeight: 800, fontSize: "1rem",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
};

// ── Page styles ──
const s = {
  backdrop: {
    position: "fixed", inset: 0, zIndex: 200,
    background: "rgba(12,12,20,0.65)",
    backdropFilter: "blur(12px)",
    display: "flex", alignItems: "flex-start",
    justifyContent: "flex-end",
    animation: "fadeIn 0.2s ease",
  },
  panel: {
    background: "var(--bg)", width: "100%", maxWidth: 600,
    height: "100vh", overflowY: "auto",
    display: "flex", flexDirection: "column",
    borderLeft: "1px solid var(--border)",
    animation: "slideIn 0.3s ease",
  },
  header: {
    display: "flex", alignItems: "flex-start",
    justifyContent: "space-between",
    padding: "28px 24px 20px",
    borderBottom: "1px solid var(--border)",
    position: "sticky", top: 0, zIndex: 10,
    background: "var(--bg)", backdropFilter: "blur(12px)",
  },
  title: { fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 800, color: "var(--ink)" },
  sub: { fontSize: "0.84rem", color: "var(--mid)", marginTop: 4 },
  closeBtn: {
    background: "var(--bg-2)", border: "1px solid var(--border)",
    width: 36, height: 36, borderRadius: "50%", cursor: "pointer",
    fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center",
  },
  composer: {
    margin: "20px 24px",
    background: "var(--card)", border: "1px solid var(--border)",
    borderRadius: 14, padding: 16,
  },
  composerTop: { display: "flex", gap: 12, marginBottom: 12 },
  composerAvatar: {
    width: 40, height: 40, borderRadius: "50%",
    background: "var(--blue)", color: "#fff",
    fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1rem",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, overflow: "hidden",
  },
  titleInput: {
    width: "100%", padding: "8px 12px", marginBottom: 8,
    border: "1.5px solid var(--border)", borderRadius: 8,
    fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9rem",
    color: "var(--ink)", background: "var(--bg)", outline: "none",
  },
  textArea: {
    width: "100%", padding: "8px 12px",
    border: "1.5px solid var(--border)", borderRadius: 8,
    fontFamily: "var(--font-body)", fontSize: "0.9rem",
    color: "var(--ink)", background: "var(--bg)",
    outline: "none", resize: "vertical", lineHeight: 1.6,
  },
  composerFooter: {
    display: "flex", alignItems: "center",
    justifyContent: "space-between", flexWrap: "wrap", gap: 8,
  },
  topicRow: { display: "flex", gap: 6, flexWrap: "wrap" },
  topicBtn: {
    padding: "4px 12px", borderRadius: 100,
    border: "1px solid var(--border)", fontSize: "0.74rem",
    fontFamily: "var(--font-display)", fontWeight: 700,
    cursor: "pointer", transition: "all 0.15s",
  },
  postBtn: {
    padding: "9px 20px", background: "var(--blue)", color: "#fff",
    border: "none", borderRadius: 8,
    fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.88rem",
    cursor: "pointer", transition: "opacity 0.2s",
  },
  loginPrompt: {
    margin: "16px 24px", padding: "14px 18px",
    background: "var(--bg-2)", border: "1px solid rgba(29,78,216,0.2)",
    borderRadius: 10, fontSize: "0.88rem", color: "var(--mid)",
    fontFamily: "var(--font-display)",
  },
  feed: { padding: "0 24px 32px", flex: 1 },
  empty: {
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    padding: "60px 20px", gap: 12, textAlign: "center",
  },
  emptyTitle: { fontFamily: "var(--font-display)", fontSize: "1.2rem", fontWeight: 800, color: "var(--ink)" },
  emptySub: { fontSize: "0.88rem", color: "var(--mid)" },
};