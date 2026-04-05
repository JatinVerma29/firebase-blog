// src/components/PostReader.jsx
import { useState, useEffect, useRef } from "react";
import { likePost, incrementViews, toggleBookmark, isBookmarked } from "../firebase/posts";
import Comments from "./Comments";
import AISummary from "./ai/AISummary";
import AIRecommendations from "./ai/AIRecommendations";
import { trackRead } from "./ai/AIRecommendations";
import { toast } from "react-hot-toast";

function formatDate(ts) {
  if (!ts) return "Recently";
  let d;
  if (ts?.toDate)              d = ts.toDate();
  else if (ts?.seconds)        d = new Date(ts.seconds * 1000);
  else if (ts instanceof Date) d = ts;
  else if (typeof ts === "string" || typeof ts === "number") d = new Date(ts);
  else return "Recently";
  if (isNaN(d.getTime())) return "Recently";
  return d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

function formatDateShort(ts) {
  if (!ts) return "";
  let d;
  if (ts?.toDate)              d = ts.toDate();
  else if (ts?.seconds)        d = new Date(ts.seconds * 1000);
  else if (ts instanceof Date) d = ts;
  else if (typeof ts === "string" || typeof ts === "number") d = new Date(ts);
  else return "";
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function readingTime(content = "") {
  return Math.max(1, Math.ceil(content.trim().split(/\s+/).length / 200));
}

const CAT_COLORS = {
  Technology: { bg: "#dbeafe", color: "#1d4ed8" },
  Agile:      { bg: "#d1fae5", color: "#059669" },
  Design:     { bg: "#ede9fe", color: "#7c3aed" },
  Business:   { bg: "#fee2e2", color: "#dc2626" },
  Tutorial:   { bg: "#fef3c7", color: "#d97706" },
  Innovation: { bg: "#e0f2fe", color: "#0284c7" },
  General:    { bg: "#f1f5f9", color: "#64748b" },
};

// ── Download formats ───────────────────────────────────────────────────────

function downloadAsHTML(post) {
  const date = formatDateShort(post.createdAt);
  const paragraphs = (post.content || "").split("\n").filter(Boolean).map((p) => `<p>${p}</p>`).join("\n");
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>${post.title} — AERO BLOG</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Lora:ital,wght@0,400;0,500;1,400&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Lora',Georgia,serif;background:#f8faff;color:#0c0c14;line-height:1.7}
    .page{max-width:720px;margin:0 auto;background:#fff;min-height:100vh;padding:60px 64px 80px;box-shadow:0 0 60px rgba(0,0,0,.06)}
    .brand{font-family:'Syne',sans-serif;font-weight:800;font-size:13px;letter-spacing:.08em;color:#94a3b8;text-transform:uppercase;margin-bottom:40px;padding-bottom:16px;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between}
    .brand span{color:#1d4ed8}
    .category{display:inline-block;font-family:'Syne',sans-serif;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#1d4ed8;background:rgba(29,78,216,.08);padding:3px 12px;border-radius:99px;margin-bottom:16px}
    h1{font-family:'Syne',sans-serif;font-weight:800;font-size:2.4rem;line-height:1.15;letter-spacing:-.03em;color:#0c0c14;margin-bottom:20px}
    .meta{display:flex;align-items:center;gap:16px;font-size:13px;color:#94a3b8;margin-bottom:32px;font-family:'Syne',sans-serif;flex-wrap:wrap}
    .meta strong{color:#0c0c14}
    .cover{width:100%;height:300px;object-fit:cover;border-radius:12px;margin-bottom:40px}
    .body{font-size:1.05rem;line-height:1.82;color:#1e1e2e}
    .body p{margin-bottom:1.4em}
    .stats{display:flex;gap:20px;padding:16px 0;margin-top:40px;border-top:1px solid #e2e8f0;font-family:'Syne',sans-serif;font-size:13px;color:#94a3b8}
    .footer{margin-top:40px;padding-top:20px;border-top:2px solid #1d4ed8;font-family:'Syne',sans-serif;font-size:12px;color:#94a3b8;text-align:center}
    @media print{body{background:#fff}.page{box-shadow:none;padding:40px}}
  </style>
</head>
<body>
  <div class="page">
    <div class="brand">AERO<span>BLOG</span><span>${date}</span></div>
    ${post.category ? `<div class="category">${post.category}</div>` : ""}
    <h1>${post.title}</h1>
    <div class="meta"><span>By <strong>${post.author || "Anonymous"}</strong></span>${date ? `<span>·</span><span>${date}</span>` : ""}<span>· ${readingTime(post.content)} min read</span></div>
    ${post.imageUrl ? `<img class="cover" src="${post.imageUrl}" alt="${post.title}"/>` : ""}
    <div class="body">${paragraphs}</div>
    <div class="stats"><span>❤️ ${post.likes || 0} likes</span><span>👁 ${post.views || 0} views</span><span>💬 ${post.commentsCount || 0} comments</span></div>
    <div class="footer">Published on AERO BLOG · Downloaded ${new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})}<br/><small>To save as PDF: File → Print → Save as PDF</small></div>
  </div>
</body>
</html>`;
  triggerDownload(html, `${slugify(post.title)}.html`, "text/html");
  toast.success("HTML downloaded! Open → File → Print → Save as PDF 📄");
}

function downloadAsPDF(post) {
  const date = formatDateShort(post.createdAt);
  const paragraphs = (post.content || "").split("\n").filter(Boolean).map((p) => `<p>${p}</p>`).join("\n");
  const win = window.open("", "_blank");
  if (!win) { toast.error("Please allow popups to download PDF"); return; }
  win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>${post.title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Lora:ital,wght@0,400;0,500;1,400&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Lora',Georgia,serif;color:#0c0c14;line-height:1.7;padding:40px 60px}
    .brand{font-family:'Syne',sans-serif;font-weight:800;font-size:12px;letter-spacing:.1em;color:#94a3b8;text-transform:uppercase;margin-bottom:32px;padding-bottom:12px;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between}
    .brand span{color:#1d4ed8}
    .cat{font-family:'Syne',sans-serif;font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#1d4ed8;background:rgba(29,78,216,.08);padding:2px 10px;border-radius:99px;margin-bottom:12px;display:inline-block}
    h1{font-family:'Syne',sans-serif;font-weight:800;font-size:2rem;line-height:1.2;letter-spacing:-.03em;margin-bottom:16px}
    .meta{font-family:'Syne',sans-serif;font-size:12px;color:#94a3b8;margin-bottom:28px}
    img{width:100%;max-height:260px;object-fit:cover;border-radius:8px;margin-bottom:32px}
    p{font-size:1rem;line-height:1.8;margin-bottom:1.2em;color:#1e1e2e}
    .footer{margin-top:32px;padding-top:16px;border-top:2px solid #1d4ed8;font-family:'Syne',sans-serif;font-size:11px;color:#94a3b8;text-align:center}
    @page{margin:0.5in}
  </style>
</head>
<body>
  <div class="brand">AERO<span>BLOG</span><span>${date}</span></div>
  ${post.category ? `<div class="cat">${post.category}</div>` : ""}
  <h1>${post.title}</h1>
  <div class="meta">By ${post.author || "Anonymous"} ${date ? `· ${date}` : ""} · ${readingTime(post.content)} min read</div>
  ${post.imageUrl ? `<img src="${post.imageUrl}" alt="${post.title}"/>` : ""}
  ${paragraphs}
  <div class="footer">Published on AERO BLOG · ${new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})}</div>
</body>
</html>`);
  win.document.close();
  win.onload = () => { win.focus(); win.print(); };
  toast.success("Print dialog opened — choose 'Save as PDF' 🖨️");
}

function downloadAsMarkdown(post) {
  const date = formatDateShort(post.createdAt);
  const tags = post.tags?.map((t) => `#${t}`).join(" ") || "";
  const md = `# ${post.title}

**Author:** ${post.author || "Anonymous"}  
**Date:** ${date}  
**Category:** ${post.category || "General"}  
**Reading time:** ${readingTime(post.content)} min  
${tags ? `**Tags:** ${tags}` : ""}

---

${post.content || ""}

---

*Published on AERO BLOG · ❤️ ${post.likes || 0} likes · 👁 ${post.views || 0} views*
`;
  triggerDownload(md, `${slugify(post.title)}.md`, "text/markdown");
  toast.success("Markdown file downloaded! ✍️");
}

function downloadAsText(post) {
  const date = formatDateShort(post.createdAt);
  const txt = `${post.title.toUpperCase()}
${"=".repeat(post.title.length)}

Author: ${post.author || "Anonymous"}
Date: ${date}
Category: ${post.category || "General"}
Reading time: ${readingTime(post.content)} min

${"─".repeat(40)}

${post.content || ""}

${"─".repeat(40)}
Published on AERO BLOG
❤️ ${post.likes || 0} likes  👁 ${post.views || 0} views  💬 ${post.commentsCount || 0} comments
Downloaded: ${new Date().toLocaleDateString()}
`;
  triggerDownload(txt, `${slugify(post.title)}.txt`, "text/plain");
  toast.success("Plain text downloaded! 📝");
}

function triggerDownload(content, filename, type) {
  const blob = new Blob([content], { type });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

function slugify(str) {
  return str.replace(/[^a-z0-9]/gi, "_").toLowerCase();
}

// ── Format picker dropdown ─────────────────────────────────────────────────
const FORMATS = [
  { key: "pdf",      label: "🖨️ PDF",        hint: "Print-quality via browser" },
  { key: "html",     label: "🌐 HTML",       hint: "Styled web page" },
  { key: "markdown", label: "✍️ Markdown",   hint: "For editors & GitHub" },
  { key: "text",     label: "📝 Plain Text", hint: "No formatting" },
];

function DownloadButton({ post }) {
  const [open, setOpen]         = useState(false);
  const [downloading, setDl]    = useState(false);
  const ref                     = useRef();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleFormat = (key) => {
    setOpen(false); setDl(true);
    setTimeout(() => {
      if (key === "pdf")      downloadAsPDF(post);
      if (key === "html")     downloadAsHTML(post);
      if (key === "markdown") downloadAsMarkdown(post);
      if (key === "text")     downloadAsText(post);
      setDl(false);
    }, 100);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        style={{
          ...s.actionBtn,
          background: "var(--blue)", color: "#fff", border: "none",
          display: "flex", alignItems: "center", gap: 6,
        }}
        onClick={() => setOpen((o) => !o)}
        disabled={downloading}
      >
        {downloading ? "⏳" : "⬇️"} Download {open ? "▲" : "▼"}
      </button>

      {open && (
        <div style={s.dropdown}>
          <div style={s.dropdownTitle}>Choose format</div>
          {FORMATS.map(({ key, label, hint }) => (
            <button key={key} style={s.dropdownItem} onClick={() => handleFormat(key)}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-2)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              <span style={{ fontWeight: 700 }}>{label}</span>
              <span style={s.dropdownHint}>{hint}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Share via email ────────────────────────────────────────────────────────
function shareViaEmail(post) {
  const subject = encodeURIComponent(`Check out: ${post.title}`);
  const body = encodeURIComponent(
    `Hey!\n\nI thought you'd enjoy this article:\n\n"${post.title}"\nBy ${post.author || "Anonymous"}\n\n` +
    `${(post.content || "").slice(0, 300).trim()}...\n\n— Shared from AERO BLOG`
  );
  window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function PostReader({ post, onClose, isDemo, currentUser, allPosts }) {
  const [likes, setLikes]               = useState(post.likes || 0);
  const [liked, setLiked]               = useState(false);
  const [bookmarked, setBookmarked]     = useState(isBookmarked(post.id));
  const [imgError, setImgError]         = useState(false);
  const [copied, setCopied]             = useState(false);
  const [readProgress, setReadProgress] = useState(0);

  const cat  = CAT_COLORS[post.category] || CAT_COLORS.General;
  const mins = readingTime(post.content);

  useEffect(() => {
    trackRead(post.id);
    if (!isDemo && !post.id?.startsWith("demo-")) {
      incrementViews(post.id).catch(() => {});
    }
    const modal = document.getElementById("post-reader-scroll");
    if (!modal) return;
    const onScroll = () => {
      const pct = (modal.scrollTop / (modal.scrollHeight - modal.clientHeight)) * 100;
      setReadProgress(Math.min(100, pct || 0));
    };
    modal.addEventListener("scroll", onScroll);
    return () => modal.removeEventListener("scroll", onScroll);
  }, [post.id, isDemo]);

  const handleLike = async () => {
    if (liked) return;
    setLiked(true); setLikes((n) => n + 1);
    if (!isDemo) await likePost(post.id).catch(() => {});
  };

  const handleBookmark = () => setBookmarked(toggleBookmark(post.id));

  const handleShare = async () => {
    const url = `${window.location.origin}#post/${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
      toast.success("Link copied to clipboard!");
    } catch { alert(`Share: ${url}`); }
  };

  const paragraphs = (post.content || "").split("\n").filter(Boolean);

  return (
    <div style={s.backdrop} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={s.progressTrack}>
        <div style={{ ...s.progressFill, width: `${readProgress}%` }} />
      </div>

      <div id="post-reader-scroll" style={s.modal}>
        {/* Sticky action bar */}
        <div style={s.actionsBar}>
          <button style={s.actionBtn} onClick={onClose}>← Back</button>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{
              ...s.actionBtn,
              background: bookmarked ? "#fef3c7" : "var(--bg-2)",
              color: bookmarked ? "#d97706" : "var(--mid)",
            }} onClick={handleBookmark}>
              {bookmarked ? "🔖 Saved" : "🔖 Save"}
            </button>
            <button style={s.actionBtn} onClick={handleShare}>
              {copied ? "✅ Copied!" : "🔗 Share"}
            </button>
            {/* ── Format picker in top bar ── */}
            <DownloadButton post={post} />
          </div>
        </div>

        {/* Hero image */}
        {post.imageUrl && !imgError && (
          <div style={s.heroImg}>
            <img src={post.imageUrl} alt={post.title} style={s.heroImgEl} onError={() => setImgError(true)} />
            <div style={s.heroOverlay} />
          </div>
        )}

        <div style={s.content}>
          <div style={s.topMeta}>
            <span style={{ ...s.cat, background: cat.bg, color: cat.color }}>{post.category || "General"}</span>
            <span style={s.readTime}>⏱️ {mins} min read</span>
            {post.tags?.map((tag) => <span key={tag} style={s.tag}>#{tag}</span>)}
          </div>

          <h1 style={s.title}>{post.title}</h1>

          <div style={s.authorRow}>
            <div style={s.avatar}>{(post.author || "A")[0].toUpperCase()}</div>
            <div>
              <div style={s.authorName}>{post.author || "Anonymous"}</div>
              <div style={s.dateLine}>{formatDate(post.createdAt)}</div>
            </div>
            <div style={s.metaRight}>
              <span style={s.metaItem}>👁️ {post.views || 0}</span>
              <span style={s.metaItem}>💬 {post.commentsCount || 0}</span>
              <span style={s.metaItem}>❤️ {likes}</span>
            </div>
          </div>

          <div style={s.divider} />

          <AISummary title={post.title} content={post.content} />

          <div style={s.body}>
            {paragraphs.map((para, i) => (
              <p key={i} style={{
                ...s.para,
                paddingLeft: (para.startsWith("•") || /^\d+\./.test(para)) ? 20 : 0,
              }}>{para}</p>
            ))}
          </div>

          {/* Reactions */}
          <div style={s.reactions}>
            <button style={{
              ...s.reactionBtn,
              background: liked ? "#fee2e2" : "var(--bg)",
              borderColor: liked ? "#fca5a5" : "var(--border)",
              color: liked ? "#ef4444" : "var(--mid)",
            }} onClick={handleLike}>
              {liked ? "❤️ Liked!" : "🤍 Like"} · {likes}
            </button>

            <button style={{
              ...s.reactionBtn,
              background: bookmarked ? "#fef3c7" : "var(--bg)",
              borderColor: bookmarked ? "#fcd34d" : "var(--border)",
              color: bookmarked ? "#d97706" : "var(--mid)",
            }} onClick={handleBookmark}>
              {bookmarked ? "🔖 Saved" : "🔖 Save"}
            </button>

            <button style={s.reactionBtn} onClick={handleShare}>
              {copied ? "✅ Copied!" : "🔗 Share"}
            </button>

            {/* ── Format picker in reactions row ── */}
            <DownloadButton post={post} />

            <button style={{
              ...s.reactionBtn,
              background: "rgba(16,185,129,0.06)",
              borderColor: "#10b981", color: "#10b981",
            }} onClick={() => shareViaEmail(post)}>
              📧 Email
            </button>
          </div>

          {post.tags && post.tags.length > 0 && (
            <div style={s.tagsRow}>
              {post.tags.map((t) => <span key={t} style={s.tagItem}>#{t}</span>)}
            </div>
          )}

          <Comments postId={post.id} postAuthor={post.author} isDemo={isDemo} currentUser={currentUser} />

          <AIRecommendations
            currentPostId={post.id}
            allPosts={allPosts}
            onOpenPost={(newPost) => { onClose(); setTimeout(() => onClose(newPost), 100); }}
          />
        </div>
      </div>
    </div>
  );
}

const s = {
  backdrop: { position: "fixed", inset: 0, zIndex: 200, background: "rgba(12,12,20,0.65)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 },
  progressTrack: { position: "fixed", top: 0, left: 0, right: 0, height: 3, zIndex: 999, background: "rgba(255,255,255,0.15)" },
  progressFill: { height: "100%", background: "linear-gradient(90deg, #1d4ed8, #f5c518)", transition: "width 0.1s linear" },
  modal: { background: "var(--card)", borderRadius: 20, width: "100%", maxWidth: 800, maxHeight: "92vh", overflowY: "auto", position: "relative", animation: "slideDown 0.3s ease" },
  actionsBar: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 10, background: "var(--card)", backdropFilter: "blur(12px)" },
  actionBtn: { padding: "7px 14px", borderRadius: 8, background: "var(--bg-2)", border: "1px solid var(--border)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.8rem", color: "var(--mid)", cursor: "pointer" },
  heroImg: { height: 300, overflow: "hidden", position: "relative" },
  heroImgEl: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  heroOverlay: { position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(255,255,255,0.5) 0%, transparent 60%)" },
  content: { padding: "28px 44px 44px" },
  topMeta: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 16 },
  cat: { padding: "4px 14px", borderRadius: 100, fontSize: "0.74rem", fontWeight: 700, fontFamily: "var(--font-display)" },
  readTime: { fontSize: "0.76rem", color: "var(--mid)", fontFamily: "var(--font-display)", fontWeight: 600 },
  tag: { fontSize: "0.74rem", color: "var(--blue)", fontFamily: "var(--font-mono)", background: "var(--bg-2)", padding: "2px 8px", borderRadius: 4 },
  title: { fontSize: "clamp(1.6rem, 3vw, 2.3rem)", fontWeight: 800, letterSpacing: "-0.5px", lineHeight: 1.2, color: "var(--ink)", marginBottom: 20 },
  authorRow: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" },
  avatar: { width: 38, height: 38, borderRadius: "50%", background: "var(--blue)", color: "#fff", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  authorName: { fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.88rem", color: "var(--ink)" },
  dateLine: { fontSize: "0.75rem", color: "var(--muted)" },
  metaRight: { display: "flex", gap: 14, marginLeft: "auto" },
  metaItem: { fontSize: "0.82rem", color: "var(--mid)" },
  divider: { height: 1, background: "var(--border)", margin: "20px 0" },
  body: { display: "flex", flexDirection: "column", gap: 14 },
  para: { fontSize: "1.03rem", lineHeight: 1.82, color: "var(--ink-2, #374151)", fontFamily: "var(--font-body)" },
  reactions: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 32, paddingTop: 28, borderTop: "1px solid var(--border)" },
  reactionBtn: { padding: "10px 20px", borderRadius: 100, border: "1.5px solid var(--border)", background: "var(--bg)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", transition: "all 0.2s", color: "var(--mid)" },
  tagsRow: { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 },
  tagItem: { background: "var(--bg-2)", color: "var(--mid)", padding: "3px 12px", borderRadius: 100, fontSize: "0.76rem", fontFamily: "var(--font-display)", fontWeight: 600 },
  // ── Dropdown styles ──
  dropdown: { position: "absolute", top: "calc(100% + 8px)", right: 0, background: "var(--card)", border: "1.5px solid var(--border)", borderRadius: 12, padding: "8px", zIndex: 999, minWidth: 200, boxShadow: "0 8px 32px rgba(0,0,0,0.12)", animation: "slideDown 0.15s ease" },
  dropdownTitle: { fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "4px 8px 8px", borderBottom: "1px solid var(--border)", marginBottom: 4 },
  dropdownItem: { display: "flex", flexDirection: "column", gap: 2, width: "100%", padding: "8px 10px", borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", textAlign: "left", transition: "background 0.15s" },
  dropdownHint: { fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-mono)", fontWeight: 400 },
};