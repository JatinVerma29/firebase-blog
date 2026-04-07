// src/components/Comments.jsx
import { useState, useEffect, useRef } from "react";
import { subscribeToComments, addComment, deleteComment } from "../firebase/posts";
import { createNotification } from "./NotificationBell";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import AISentimentBadge from "./ai/AISentimentBadge";

function timeAgo(ts) {
  if (!ts) return "just now";
  const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  const diff = (Date.now() - d) / 1000;
  if (diff < 60)    return "just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function RenderText({ text }) {
  const parts = text.split(/(@\w[\w\s]*)/g);
  return (
    <span>
      {parts.map((part, i) =>
        part.startsWith("@")
          ? <span key={i} style={{ color: "var(--blue)", fontWeight: 700, fontFamily: "var(--font-display)" }}>{part}</span>
          : <span key={i}>{part}</span>
      )}
    </span>
  );
}

export default function Comments({ postId, postAuthor, postAuthorUid, postTitle, isDemo, currentUser }) {
  const [comments, setComments]           = useState([]);
  const [localComments, setLocalComments] = useState([]);
  const [text, setText]                   = useState("");
  const [replyTo, setReplyTo]             = useState(null);
  const [submitting, setSubmitting]       = useState(false);
  const [showAll, setShowAll]             = useState(false);
  const inputRef = useRef();

  useEffect(() => {
    if (isDemo) return;
    const unsub = subscribeToComments(postId, setComments);
    return unsub;
  }, [postId, isDemo]);

  const displayed = isDemo ? localComments : comments;
  const visible   = showAll ? displayed : displayed.slice(0, 5);

  const handleMention = (name) => {
    setText(`@${name} `);
    setReplyTo({ name });
    inputRef.current?.focus();
  };

  const handleMentionAuthor = () => handleMention(postAuthor);

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;                    // ✅ guard empty
    if (!currentUser) return;               // ✅ guard not logged in
    setSubmitting(true);

    const displayName = currentUser?.displayName || "Anonymous";
    const comment = {
      name:     displayName,
      uid:      currentUser?.uid || null,
      photoURL: currentUser?.photoURL || null,
      text:     trimmed,
      replyTo:  replyTo?.name || null,
      postId,
    };

    try {
      if (isDemo) {
        setLocalComments((p) => [
          ...p,
          { id: Date.now().toString(), ...comment, createdAt: { seconds: Date.now() / 1000 } },
        ]);
      } else {
        await addComment(postId, comment);

        // ── Send notification if commenter != post author ──
        const isNotSelf = currentUser.uid !== postAuthorUid;

        if (isNotSelf) {
          // 1. Always notify post author about the comment
          if (postAuthorUid) {
            await createNotification(postAuthorUid, {
              type:       "comment",
              fromName:   displayName,
              fromAvatar: currentUser?.photoURL || "",
              postId,
              postTitle:  postTitle || "a post",
            });
          }

          // 2. If @mention detected, also look up mentioned user and notify them
          const mentionMatch = trimmed.match(/@([\w\s]+)/g);
          if (mentionMatch) {
            for (const mention of mentionMatch) {
              const mentionedName = mention.slice(1).trim();
              // Skip if it's the same as post author (already notified above)
              if (mentionedName.toLowerCase() === postAuthor?.toLowerCase()) continue;
              // Try to find user by displayName in Firestore
              try {
                const { collection, query, where, getDocs, orderBy: orderByFs } = await import("firebase/firestore");
                // Use >= and <= trick to do a "startsWith" search (case-sensitive)
                const q = query(
                  collection(db, "users"),
                  where("displayName", ">=", mentionedName),
                  where("displayName", "<=", mentionedName + "\uf8ff")
                );
                const snap = await getDocs(q);
                if (!snap.empty) {
                  const mentionedUser = snap.docs[0];
                  const mentionedUid = mentionedUser.id;
                  const mentionedData = mentionedUser.data();
                  if (mentionedUid !== currentUser.uid) {
                    await createNotification(mentionedUid, {
                      type:       "comment",
                      fromName:   displayName,
                      fromAvatar: currentUser?.photoURL || "",
                      postId,
                      postTitle:  postTitle || "a post",
                    });

                    // Also send a DM so they see the mention in Messages
                    try {
                      const { doc: fsDoc, setDoc: fsSetDoc, addDoc: fsAddDoc, serverTimestamp: fsST, getDoc: fsGetDoc } = await import("firebase/firestore");
                      const chatId = [currentUser.uid, mentionedUid].sort().join("_");
                      const chatRef = fsDoc(db, "chats", chatId);
                      const chatSnap = await fsGetDoc(chatRef);
                      if (!chatSnap.exists()) {
                        await fsSetDoc(chatRef, {
                          participants: [currentUser.uid, mentionedUid],
                          participantNames: { [currentUser.uid]: displayName, [mentionedUid]: mentionedData.displayName || "User" },
                          participantPhotos: { [currentUser.uid]: currentUser.photoURL || "", [mentionedUid]: mentionedData.photoURL || "" },
                          lastMessage: "",
                          lastMessageAt: fsST(),
                          createdAt: fsST(),
                        });
                      }
                      await fsAddDoc(collection(db, "chats", chatId, "messages"), {
                        senderId: currentUser.uid,
                        text: `👋 I mentioned you in a comment on "${postTitle || "a post"}": ${trimmed}`,
                        imageUrl: null,
                        createdAt: fsST(),
                        read: false,
                      });
                      const { updateDoc: fsUpdate } = await import("firebase/firestore");
                      await fsUpdate(chatRef, { lastMessage: `Mentioned you in "${postTitle || "a post"}"`, lastMessageAt: fsST() });
                    } catch (dmErr) { console.warn("Could not send mention DM:", dmErr); }
                  }
                }
              } catch (e) { console.warn("Could not find mentioned user:", e); }
            }
          }
        }
      }

      setText(""); setReplyTo(null);
    } catch (e) {
      console.error("Comment post error:", e);
    }
    setSubmitting(false);
  };

  const handleDelete = async (cid) => {
    if (isDemo) {
      setLocalComments((p) => p.filter((c) => c.id !== cid));
    } else {
      await deleteComment(postId, cid);
    }
  };

  const canDelete = (c) => currentUser && currentUser.uid === c.uid;

  return (
    <div style={s.wrap}>
      {/* Header */}
      <div style={s.header}>
        <h3 style={s.heading}>
          💬 Comments
          <span style={s.badge}>{displayed.length}</span>
        </h3>
        {postAuthor && (
          <button style={s.mentionAuthorBtn} onClick={handleMentionAuthor}>
            📢 Tag @{postAuthor}
          </button>
        )}
      </div>

      {/* Reply indicator */}
      {replyTo && (
        <div style={s.replyBanner}>
          <span>Replying to <strong>@{replyTo.name}</strong></span>
          <button style={s.cancelReply} onClick={() => { setReplyTo(null); setText(""); }}>✕</button>
        </div>
      )}

      {/* Input */}
      <div style={s.inputWrap}>
        <div style={s.userAvatar}>
          {currentUser?.photoURL
            ? <img src={currentUser.photoURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : currentUser ? (currentUser.displayName || "U")[0].toUpperCase() : "👤"}
        </div>
        <div style={s.inputRight}>
          <textarea
            ref={inputRef}
            style={s.textarea}
            rows={3}
            maxLength={500}
            placeholder={
              currentUser
                ? `Write a comment… use @${postAuthor} to tag the author`
                : "Log in to leave a comment"
            }
            value={text}
            disabled={!currentUser || submitting}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) handleSubmit(); }}
          />
          <div style={s.inputFooter}>
            <span style={s.hint}>Ctrl+Enter to submit · @name to mention</span>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={s.charCount}>{text.length}/500</span>
              <button
                style={{
                  ...s.submitBtn,
                  opacity: (!currentUser || submitting || !text.trim()) ? 0.5 : 1,
                  cursor: (!currentUser || submitting || !text.trim()) ? "not-allowed" : "pointer",
                }}
                disabled={!currentUser || submitting || !text.trim()}
                onClick={handleSubmit}>
                {submitting ? "Posting…" : "Post →"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Comment list */}
      {displayed.length === 0 ? (
        <div style={s.empty}>
          <span style={{ fontSize: "2rem" }}>🌱</span>
          <p>No comments yet. Be the first!</p>
        </div>
      ) : (
        <>
          <div style={s.list}>
            {visible.map((c) => (
              <CommentItem
                key={c.id}
                comment={c}
                canDelete={canDelete(c)}
                onDelete={() => handleDelete(c.id)}
                onMention={() => handleMention(c.name)}
              />
            ))}
          </div>
          {displayed.length > 5 && (
            <button style={s.showMoreBtn} onClick={() => setShowAll((v) => !v)}>
              {showAll ? "▲ Show less" : `▼ Show ${displayed.length - 5} more`}
            </button>
          )}
        </>
      )}
    </div>
  );
}

function CommentItem({ comment: c, canDelete, onDelete, onMention }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div style={s.comment}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>
      <div style={s.commentAvatar}>
        {c.photoURL
          ? <img src={c.photoURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
          : (c.name || "?")[0].toUpperCase()}
      </div>
      <div style={s.commentBody}>
        <div style={s.commentHeader}>
          <span style={s.commentName}>{c.name}</span>
          {c.replyTo && <span style={s.replyingTo}>↩ @{c.replyTo}</span>}
          <span style={s.commentTime}>{timeAgo(c.createdAt)}</span>
          <div style={{ ...s.commentActions, opacity: hovered ? 1 : 0 }}>
            <button style={s.actionPill} onClick={onMention}>@ Reply</button>
            {canDelete && (
              <button style={{ ...s.actionPill, color: "#ef4444" }} onClick={onDelete}>🗑️</button>
            )}
          </div>
        </div>
        <p style={s.commentText}><RenderText text={c.text} /></p>
        <AISentimentBadge text={c.text} autoAnalyze={false} />
      </div>
    </div>
  );
}

const s = {
  wrap: { marginTop: 40, paddingTop: 32, borderTop: "1px solid var(--border)" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 },
  heading: { fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 800, color: "var(--ink)", display: "flex", alignItems: "center", gap: 10 },
  badge: { background: "var(--blue)", color: "#fff", fontSize: "0.72rem", padding: "2px 9px", borderRadius: 100, fontWeight: 700 },
  mentionAuthorBtn: { padding: "7px 14px", borderRadius: 100, background: "var(--bg-2)", border: "1px solid rgba(29,78,216,0.2)", color: "var(--blue)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer" },
  replyBanner: { display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-2)", border: "1px solid rgba(29,78,216,0.2)", borderRadius: 8, padding: "8px 14px", marginBottom: 12, fontSize: "0.84rem", color: "var(--blue)", fontFamily: "var(--font-display)", fontWeight: 600 },
  cancelReply: { background: "none", border: "none", cursor: "pointer", color: "var(--mid)", fontSize: "0.9rem" },
  inputWrap: { display: "flex", gap: 12, marginBottom: 24, alignItems: "flex-start" },
  userAvatar: { width: 38, height: 38, borderRadius: "50%", background: "var(--blue)", color: "#fff", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" },
  inputRight: { flex: 1, display: "flex", flexDirection: "column", gap: 6 },
  textarea: { width: "100%", padding: "10px 14px", border: "1.5px solid var(--border)", borderRadius: 10, fontFamily: "var(--font-body)", fontSize: "0.92rem", color: "var(--ink)", background: "var(--bg)", outline: "none", resize: "vertical", lineHeight: 1.6 },
  inputFooter: { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 },
  hint: { fontSize: "0.72rem", color: "var(--muted)", fontFamily: "var(--font-display)" },
  charCount: { fontSize: "0.74rem", color: "var(--muted)" },
  submitBtn: { padding: "8px 18px", background: "var(--blue)", color: "#fff", border: "none", borderRadius: 8, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.84rem", transition: "opacity 0.2s" },
  empty: { display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "32px 0", color: "var(--mid)", fontSize: "0.9rem", fontFamily: "var(--font-display)" },
  list: { display: "flex", flexDirection: "column", gap: 0 },
  comment: { display: "flex", gap: 12, padding: "14px 0", borderBottom: "1px solid var(--border)", position: "relative" },
  commentAvatar: { width: 36, height: 36, borderRadius: "50%", background: "var(--blue)", color: "#fff", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" },
  commentBody: { flex: 1, minWidth: 0 },
  commentHeader: { display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" },
  commentName: { fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.86rem", color: "var(--ink)" },
  replyingTo: { fontSize: "0.76rem", color: "var(--blue)", fontFamily: "var(--font-display)", fontWeight: 600, background: "var(--bg-2)", padding: "1px 8px", borderRadius: 100 },
  commentTime: { fontSize: "0.74rem", color: "var(--muted)" },
  commentActions: { display: "flex", gap: 6, marginLeft: "auto", transition: "opacity 0.2s" },
  actionPill: { padding: "3px 10px", borderRadius: 100, background: "var(--bg)", border: "1px solid var(--border)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.74rem", color: "var(--blue)", cursor: "pointer" },
  commentText: { fontSize: "0.93rem", lineHeight: 1.68, color: "var(--ink-2, #374151)", fontFamily: "var(--font-body)" },
  showMoreBtn: { width: "100%", padding: "10px", marginTop: 8, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.82rem", color: "var(--mid)", cursor: "pointer" },
};