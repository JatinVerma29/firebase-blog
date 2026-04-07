// src/components/DirectMessages.jsx
import { useState, useEffect, useRef } from "react";
import {
  collection, query, where, orderBy, onSnapshot,
  addDoc, serverTimestamp, doc, setDoc, getDoc,
  getDocs, updateDoc, writeBatch,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase/config";
import { toast } from "react-hot-toast";

// ── Firestore helpers ──────────────────────────────────────────────────────

function getChatId(uid1, uid2) {
  return [uid1, uid2].sort().join("_");
}

async function getOrCreateChat(uid1, uid2, user1, user2) {
  const chatId = getChatId(uid1, uid2);
  const ref = doc(db, "chats", chatId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      participants: [uid1, uid2],
      participantNames: { [uid1]: user1.displayName || "User", [uid2]: user2.displayName || "User" },
      participantPhotos: { [uid1]: user1.photoURL || "", [uid2]: user2.photoURL || "" },
      lastMessage: "",
      lastMessageAt: serverTimestamp(),
      unread: { [uid1]: 0, [uid2]: 0 },
      createdAt: serverTimestamp(),
    });
  }
  return chatId;
}

async function sendMessage(chatId, senderId, text, imageUrl = null) {
  await addDoc(collection(db, "chats", chatId, "messages"), {
    senderId, text, imageUrl,
    createdAt: serverTimestamp(),
    read: false,
  });
  await updateDoc(doc(db, "chats", chatId), {
    lastMessage: imageUrl ? "📷 Image" : text,
    lastMessageAt: serverTimestamp(),
  });
}


async function markMessagesRead(chatId, currentUid) {
  try {
    const q = query(
      collection(db, "chats", chatId, "messages"),
      where("senderId", "!=", currentUid),
      where("read", "==", false)
    );
    const snap = await getDocs(q);
    if (snap.empty) return;
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.update(d.ref, { read: true }));
    await batch.commit();
  } catch(e) { /* ignore */ }
}

function useChats(uid) {
  const [chats, setChats] = useState([]);
  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, "chats"), where("participants", "array-contains", uid), orderBy("lastMessageAt", "desc"));
    return onSnapshot(q, (snap) => setChats(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, [uid]);
  return chats;
}

function useMessages(chatId) {
  const [messages, setMessages] = useState([]);
  useEffect(() => {
    if (!chatId) return;
    const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"));
    return onSnapshot(q, (snap) => setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, [chatId]);
  return messages;
}

function timeAgo(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts.seconds * 1000);
  const diff = (Date.now() - d) / 1000;
  if (diff < 60)    return "just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTime(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts.seconds * 1000);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

// ── New Conversation Modal ─────────────────────────────────────────────────
function NewChatModal({ currentUser, onStart, onClose }) {
  const [search, setSearch]   = useState("");
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (val) => {
    const q = (val !== undefined ? val : search).trim();
    if (!q) { setUsers([]); return; }
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "users"));
      const results = snap.docs
        .map((d) => ({ uid: d.id, ...d.data() }))
        .filter((u) =>
          u.uid !== currentUser.uid &&
          (u.displayName?.toLowerCase().includes(q.toLowerCase()) ||
           u.email?.toLowerCase().includes(q.toLowerCase()))
        );
      setUsers(results);
    } catch (e) { toast.error("Search failed"); }
    setLoading(false);
  };

  return (
    <div style={nc.backdrop} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={nc.modal}>
        <div style={nc.header}>
          <h3 style={nc.title}>💌 New Message</h3>
          <button style={nc.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={nc.searchRow}>
          <input style={nc.input} placeholder="Search by name or email…"
            value={search} onChange={(e) => { setSearch(e.target.value); handleSearch(e.target.value); }}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
          <button style={nc.searchBtn} onClick={handleSearch} disabled={loading}>
            {loading ? "…" : "Search"}
          </button>
        </div>
        <div style={nc.results}>
          {users.length === 0 && search && !loading && (
            <p style={{ color: "var(--muted)", fontSize: "0.85rem", padding: "12px 0" }}>No users found.</p>
          )}
          {users.map((u) => (
            <div key={u.uid} style={nc.userRow} onClick={() => onStart(u)}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-2)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              <div style={nc.avatar}>
                {u.photoURL
                  ? <img src={u.photoURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : (u.displayName || "U")[0].toUpperCase()}
              </div>
              <div>
                <div style={nc.userName}>{u.displayName || "Anonymous"}</div>
                <div style={nc.userEmail}>{u.email}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Chat Window ────────────────────────────────────────────────────────────
function ChatWindow({ chatId, currentUser, otherUser, onBack }) {
  const messages    = useMessages(chatId);
  const [text, setText]       = useState("");
  const [sending, setSending] = useState(false);
  const [imgFile, setImgFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef();
  const fileRef   = useRef();

  // Mark messages as read when chat opens or new messages arrive
  useEffect(() => {
    if (chatId && currentUser?.uid) markMessagesRead(chatId, currentUser.uid);
  }, [chatId, messages.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() && !imgFile) return;
    setSending(true);
    try {
      let imageUrl = null;
      if (imgFile) {
        setUploading(true);
        const storageRef = ref(storage, `dm-images/${chatId}/${Date.now()}_${imgFile.name}`);
        const task = uploadBytesResumable(storageRef, imgFile);
        await new Promise((res, rej) => task.on("state_changed", null, rej, res));
        imageUrl = await getDownloadURL(task.snapshot.ref);
        setUploading(false);
        setImgFile(null);
      }
      await sendMessage(chatId, currentUser.uid, text.trim(), imageUrl);
      setText("");
    } catch (e) { toast.error("Failed to send"); }
    setSending(false);
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Images only"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return; }
    setImgFile(file);
  };

  return (
    <div style={cw.wrap}>
      {/* Header */}
      <div style={cw.header}>
        <button style={cw.backBtn} onClick={onBack}>←</button>
        <div style={cw.avatar}>
          {otherUser?.photoURL
            ? <img src={otherUser.photoURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : (otherUser?.name || "U")[0].toUpperCase()}
        </div>
        <div>
          <div style={cw.name}>{otherUser?.name || "User"}</div>
          <div style={cw.status}>💬 Direct Message</div>
        </div>
      </div>

      {/* Messages */}
      <div style={cw.messages}>
        {messages.length === 0 && (
          <div style={cw.empty}>
            <span style={{ fontSize: 40 }}>💌</span>
            <p>Start the conversation!</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMine = msg.senderId === currentUser.uid;
          return (
            <div key={msg.id} style={{ ...cw.msgRow, justifyContent: isMine ? "flex-end" : "flex-start" }}>
              {!isMine && (
                <div style={cw.msgAvatar}>
                  {otherUser?.photoURL
                    ? <img src={otherUser.photoURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : (otherUser?.name || "U")[0].toUpperCase()}
                </div>
              )}
              <div style={{ maxWidth: "70%" }}>
                {msg.imageUrl && (
                  <img src={msg.imageUrl} alt="attachment"
                    style={{ maxWidth: "100%", borderRadius: 12, marginBottom: msg.text ? 6 : 0, display: "block" }} />
                )}
                {msg.text && (
                  <div style={{
                    ...cw.bubble,
                    background: isMine ? "var(--blue)" : "var(--bg-2)",
                    color: isMine ? "#fff" : "var(--ink)",
                    borderRadius: isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  }}>
                    {msg.text}
                  </div>
                )}
                <div style={{ ...cw.time, textAlign: isMine ? "right" : "left" }}>
                  {formatTime(msg.createdAt)}
                  {isMine && (
                    <span style={{ marginLeft: 4, fontSize: "0.7rem", color: msg.read ? "#3b82f6" : "var(--muted)" }}>
                      {msg.read ? "✓✓" : "✓"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Image preview */}
      {imgFile && (
        <div style={cw.imgPreview}>
          <img src={URL.createObjectURL(imgFile)} alt="" style={{ height: 60, borderRadius: 8, objectFit: "cover" }} />
          <span style={{ fontSize: "0.8rem", color: "var(--mid)" }}>{imgFile.name}</span>
          <button style={cw.removeImg} onClick={() => setImgFile(null)}>✕</button>
        </div>
      )}

      {/* Input */}
      <div style={cw.inputRow}>
        <button style={cw.attachBtn} onClick={() => fileRef.current?.click()} title="Attach image">
          📎
        </button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
        <input style={cw.input} placeholder="Type a message…"
          value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()} />
        <button style={{ ...cw.sendBtn, opacity: (!text.trim() && !imgFile) || sending ? 0.5 : 1 }}
          onClick={handleSend} disabled={(!text.trim() && !imgFile) || sending}>
          {uploading ? "⏳" : sending ? "…" : "➤"}
        </button>
      </div>
    </div>
  );
}

// ── Main DM Page ───────────────────────────────────────────────────────────
export default function DirectMessages({ currentUser, onClose }) {
  const chats = useChats(currentUser?.uid);
  const [activeChatId, setActiveChatId]     = useState(null);
  const [activeOtherUser, setActiveOtherUser] = useState(null);
  const [showNewChat, setShowNewChat]       = useState(false);

  const handleStartChat = async (otherUser) => {
    setShowNewChat(false);
    try {
      const chatId = await getOrCreateChat(
        currentUser.uid, otherUser.uid,
        currentUser, otherUser
      );
      setActiveChatId(chatId);
      setActiveOtherUser({ name: otherUser.displayName, photoURL: otherUser.photoURL, uid: otherUser.uid });
    } catch (e) { toast.error("Could not start chat"); }
  };

  const handleOpenChat = (chat) => {
    const otherId = chat.participants.find((p) => p !== currentUser.uid);
    setActiveChatId(chat.id);
    setActiveOtherUser({
      uid:      otherId,
      name:     chat.participantNames?.[otherId] || "User",
      photoURL: chat.participantPhotos?.[otherId] || "",
    });
  };

  if (!currentUser) return null;

  return (
    <div style={dm.page}>
      {/* ── Sidebar ── */}
      <div style={dm.sidebar}>
        <div style={dm.sideHeader}>
          <div>
            <h2 style={dm.sideTitle}>💌 Messages</h2>
            <p style={dm.sideSub}>{chats.length} conversation{chats.length !== 1 ? "s" : ""}</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={dm.newBtn} onClick={() => setShowNewChat(true)}>✏️ New</button>
            <button style={dm.closeBtn} onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Chat list */}
        <div style={dm.chatList}>
          {chats.length === 0 ? (
            <div style={dm.empty}>
              <span style={{ fontSize: 40 }}>💌</span>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginTop: 12 }}>No messages yet</p>
              <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginTop: 4 }}>Start a conversation!</p>
              <button style={dm.emptyNewBtn} onClick={() => setShowNewChat(true)}>✏️ New Message</button>
            </div>
          ) : (
            chats.map((chat) => {
              const otherId   = chat.participants.find((p) => p !== currentUser.uid);
              const otherName = chat.participantNames?.[otherId] || "User";
              const otherPhoto = chat.participantPhotos?.[otherId] || "";
              const isActive  = chat.id === activeChatId;
              return (
                <div key={chat.id} style={{
                  ...dm.chatRow,
                  background: isActive ? "var(--blue-glow, rgba(29,78,216,0.08))" : "transparent",
                  borderLeft: isActive ? "3px solid var(--blue)" : "3px solid transparent",
                }}
                  onClick={() => handleOpenChat(chat)}
                  onMouseEnter={(e) => !isActive && (e.currentTarget.style.background = "var(--bg-2)")}
                  onMouseLeave={(e) => !isActive && (e.currentTarget.style.background = "transparent")}>
                  <div style={dm.chatAvatar}>
                    {otherPhoto
                      ? <img src={otherPhoto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : (otherName || "U")[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={dm.chatName}>{otherName}</div>
                    <div style={dm.chatLast}>{chat.lastMessage || "No messages yet"}</div>
                  </div>
                  <div style={dm.chatTime}>{timeAgo(chat.lastMessageAt)}</div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Chat area ── */}
      <div style={dm.main}>
        {activeChatId ? (
          <ChatWindow
            chatId={activeChatId}
            currentUser={currentUser}
            otherUser={activeOtherUser}
            onBack={() => { setActiveChatId(null); setActiveOtherUser(null); }}
          />
        ) : (
          <div style={dm.placeholder}>
            <span style={{ fontSize: 64 }}>💌</span>
            <h2 style={dm.placeholderTitle}>Your Messages</h2>
            <p style={dm.placeholderSub}>Select a conversation or start a new one</p>
            <button style={dm.placeholderBtn} onClick={() => setShowNewChat(true)}>
              ✏️ New Message
            </button>
          </div>
        )}
      </div>

      {showNewChat && (
        <NewChatModal
          currentUser={currentUser}
          onStart={handleStartChat}
          onClose={() => setShowNewChat(false)}
        />
      )}
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
const dm = {
  page: { position: "fixed", inset: 0, zIndex: 300, background: "var(--bg)", display: "flex", animation: "fadeIn 0.2s ease" },
  sidebar: { width: 320, borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", flexShrink: 0 },
  sideHeader: { padding: "24px 20px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  sideTitle: { fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.3rem", color: "var(--ink)" },
  sideSub: { fontSize: "0.78rem", color: "var(--muted)", marginTop: 2 },
  newBtn: { padding: "7px 14px", background: "var(--blue)", color: "#fff", border: "none", borderRadius: 8, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer" },
  closeBtn: { width: 34, height: 34, borderRadius: "50%", background: "var(--bg-2)", border: "1px solid var(--border)", cursor: "pointer", fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center" },
  chatList: { flex: 1, overflowY: "auto" },
  chatRow: { display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", cursor: "pointer", transition: "all 0.15s" },
  chatAvatar: { width: 44, height: 44, borderRadius: "50%", background: "var(--blue)", color: "#fff", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" },
  chatName: { fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9rem", color: "var(--ink)" },
  chatLast: { fontSize: "0.78rem", color: "var(--muted)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  chatTime: { fontSize: "0.7rem", color: "var(--muted)", flexShrink: 0 },
  empty: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", textAlign: "center", color: "var(--muted)" },
  emptyNewBtn: { marginTop: 16, padding: "10px 20px", background: "var(--blue)", color: "#fff", border: "none", borderRadius: 8, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.88rem", cursor: "pointer" },
  main: { flex: 1, display: "flex", flexDirection: "column" },
  placeholder: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: "var(--muted)" },
  placeholderTitle: { fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.5rem", color: "var(--ink)" },
  placeholderSub: { fontSize: "0.9rem" },
  placeholderBtn: { marginTop: 8, padding: "12px 28px", background: "var(--blue)", color: "#fff", border: "none", borderRadius: 10, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer" },
};

const cw = {
  wrap: { display: "flex", flexDirection: "column", height: "100%" },
  header: { padding: "16px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12, background: "var(--card)" },
  backBtn: { background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "var(--blue)", fontWeight: 700, padding: "4px 8px" },
  avatar: { width: 40, height: 40, borderRadius: "50%", background: "var(--blue)", color: "#fff", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 },
  name: { fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "0.95rem", color: "var(--ink)" },
  status: { fontSize: "0.74rem", color: "var(--muted)" },
  messages: { flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 },
  empty: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: "var(--muted)", fontSize: "0.9rem" },
  msgRow: { display: "flex", alignItems: "flex-end", gap: 8 },
  msgAvatar: { width: 28, height: 28, borderRadius: "50%", background: "var(--blue)", color: "#fff", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "0.72rem", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 },
  bubble: { padding: "10px 14px", borderRadius: 18, fontSize: "0.92rem", lineHeight: 1.5, fontFamily: "var(--font-body)", wordBreak: "break-word" },
  time: { fontSize: "0.68rem", color: "var(--muted)", marginTop: 3, padding: "0 4px" },
  imgPreview: { display: "flex", alignItems: "center", gap: 10, padding: "8px 24px", background: "var(--bg-2)", borderTop: "1px solid var(--border)" },
  removeImg: { background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: "0.9rem" },
  inputRow: { padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, alignItems: "center", background: "var(--card)" },
  attachBtn: { width: 36, height: 36, borderRadius: "50%", background: "var(--bg-2)", border: "1px solid var(--border)", cursor: "pointer", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center" },
  input: { flex: 1, padding: "10px 16px", border: "1.5px solid var(--border)", borderRadius: 24, fontFamily: "var(--font-body)", fontSize: "0.92rem", color: "var(--ink)", background: "var(--bg)", outline: "none" },
  sendBtn: { width: 40, height: 40, borderRadius: "50%", background: "var(--blue)", color: "#fff", border: "none", cursor: "pointer", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center", transition: "opacity 0.2s" },
};

const nc = {
  backdrop: { position: "fixed", inset: 0, zIndex: 400, background: "rgba(12,12,20,0.6)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 },
  modal: { background: "var(--card)", borderRadius: 16, width: "100%", maxWidth: 440, padding: "24px", boxShadow: "0 24px 64px rgba(0,0,0,0.2)", animation: "slideDown 0.2s ease" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  title: { fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.1rem", color: "var(--ink)" },
  closeBtn: { background: "var(--bg-2)", border: "1px solid var(--border)", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  searchRow: { display: "flex", gap: 8, marginBottom: 16 },
  input: { flex: 1, padding: "10px 14px", border: "1.5px solid var(--border)", borderRadius: 8, fontFamily: "var(--font-body)", fontSize: "0.9rem", color: "var(--ink)", background: "var(--bg)", outline: "none" },
  searchBtn: { padding: "10px 18px", background: "var(--blue)", color: "#fff", border: "none", borderRadius: 8, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.86rem", cursor: "pointer" },
  results: { maxHeight: 300, overflowY: "auto" },
  userRow: { display: "flex", alignItems: "center", gap: 12, padding: "10px 8px", borderRadius: 10, cursor: "pointer", transition: "background 0.15s" },
  avatar: { width: 40, height: 40, borderRadius: "50%", background: "var(--blue)", color: "#fff", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 },
  userName: { fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9rem", color: "var(--ink)" },
  userEmail: { fontSize: "0.75rem", color: "var(--muted)" },
};