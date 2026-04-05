// src/components/WriteModal.jsx
import { useState, useRef } from "react";
import { createPost, uploadImage } from "../firebase/posts";
import AIWritingAssistant from "./ai/AIWritingAssistant";
import AITagGenerator from "./ai/AITagGenerator";

const CATEGORIES = ["Technology", "Agile", "Design", "Business", "Innovation", "Tutorial"];

// ── Live Preview Component ──
function LivePreview({ form, imagePreview, aiTags }) {
  const wordCount = form.content.trim().split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  const renderContent = (text) =>
    text.split("\n").filter(Boolean).map((para, i) => (
      <p key={i} style={p.para}>{para}</p>
    ));

  return (
    <div style={p.wrap}>
      {/* Cover Image */}
      {imagePreview ? (
        <img src={imagePreview} alt="cover" style={p.cover} />
      ) : (
        <div style={p.coverPlaceholder}>🖼️ No cover image yet</div>
      )}

      <div style={p.body}>
        {/* Meta */}
        <div style={p.meta}>
          <span style={p.category}>{form.category}</span>
          <span style={p.dot}>·</span>
          <span style={p.readTime}>{readTime} min read</span>
          <span style={p.dot}>·</span>
          <span style={p.readTime}>{wordCount} words</span>
        </div>

        {/* Title */}
        <h1 style={p.title}>
          {form.title || <span style={p.placeholder}>Your title will appear here…</span>}
        </h1>

        {/* Author */}
        <div style={p.authorRow}>
          <div style={p.avatar}>
            {(form.author?.[0] || "?").toUpperCase()}
          </div>
          <div>
            <div style={p.authorName}>{form.author || "Author name"}</div>
            <div style={p.date}>{new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div>
          </div>
        </div>

        {/* Divider */}
        <hr style={p.divider} />

        {/* Content */}
        <div style={p.content}>
          {form.content.trim()
            ? renderContent(form.content)
            : <p style={p.placeholder}>Your content will appear here as you type…</p>}
        </div>

        {/* Tags */}
        {aiTags.length > 0 && (
          <div style={p.tags}>
            {aiTags.map((t) => (
              <span key={t} style={p.tag}>#{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function WriteModal({ onClose, onPublished, isDemo, onDemoPublish, currentUser }) {
  const [form, setForm] = useState({
    title: "", author: currentUser?.displayName || "", category: "Technology", content: "",
  });
  const [aiTags, setAiTags]             = useState([]);
  const [imageFile, setImageFile]       = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading]       = useState(false);
  const [publishing, setPublishing]     = useState(false);
  const [errors, setErrors]             = useState({});
  const [step, setStep]                 = useState(1);
  const [activeTab, setActiveTab]       = useState("write"); // write | preview | ai
  const fileRef = useRef();

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = "Title is required";
    if (!form.author.trim()) errs.author = "Author name is required";
    if (!form.content.trim() || form.content.trim().length < 20)
      errs.content = "Content must be at least 20 characters";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("Please select an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { alert("Image must be under 5MB."); return; }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handlePublish = async () => {
    if (!validate()) return;
    setPublishing(true);
    try {
      let imageUrl = null, imagePath = null;
      if (imageFile && !isDemo) {
        setUploading(true);
        const result = await uploadImage(imageFile, setUploadProgress);
        imageUrl = result.url; imagePath = result.path;
        setUploading(false);
      } else if (imagePreview && isDemo) {
        imageUrl = imagePreview;
      }
      const postData = {
        title: form.title.trim(), author: form.author.trim(),
        category: form.category, content: form.content.trim(),
        excerpt: form.content.trim().substring(0, 140) + "…",
        tags: aiTags, imageUrl, imagePath, uid: currentUser?.uid || null,
      };
      if (isDemo) {
        await new Promise((r) => setTimeout(r, 700));
        onDemoPublish?.(postData);
      } else {
        await createPost(postData);
      }
      setStep(2);
      setTimeout(() => { onClose(); onPublished?.(); }, 1800);
    } catch (err) {
      alert("Failed to publish. Please try again.");
      setPublishing(false);
    }
  };

  const inputStyle = (key) => ({
    ...s.input, borderColor: errors[key] ? "var(--red)" : "var(--border)",
  });

  const TABS = [["write", "✏️ Write"], ["preview", "👁️ Preview"], ["ai", "🤖 AI Tools"]];

  return (
    <div style={s.backdrop} onClick={(e) => e.target === e.currentTarget && onClose()}>
      {/* Wider modal for preview */}
      <div style={{ ...s.modal, maxWidth: activeTab === "preview" ? 780 : 680 }}>
        <button style={s.closeBtn} onClick={onClose}>✕</button>

        {step === 1 ? (
          <>
            {/* Header */}
            <div style={s.header}>
              <div style={s.headerIcon}>✏️</div>
              <div>
                <h2 style={s.title}>Write a New Post</h2>
                <p style={s.subtitle}>
                  {isDemo
                    ? "Demo mode — configure Firebase to persist posts"
                    : "Publish to Firebase · AI-assisted writing"}
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div style={s.tabs}>
              {TABS.map(([key, label]) => (
                <button key={key} style={{
                  ...s.tab,
                  background: activeTab === key ? "var(--blue)" : "var(--bg)",
                  color: activeTab === key ? "#fff" : "var(--mid)",
                }} onClick={() => setActiveTab(key)}>
                  {label}
                </button>
              ))}
            </div>

            {/* ── Write Tab ── */}
            {activeTab === "write" && (
              <div style={s.form}>
                <div style={s.field}>
                  <label style={s.label}>Post Title <span style={s.req}>*</span></label>
                  <input style={inputStyle("title")} placeholder="An engaging, descriptive title…"
                    value={form.title} onChange={(e) => set("title", e.target.value)} />
                  {errors.title && <span style={s.error}>{errors.title}</span>}
                </div>

                <div style={s.row}>
                  <div style={s.field}>
                    <label style={s.label}>Author <span style={s.req}>*</span></label>
                    <input style={inputStyle("author")} placeholder="Your name"
                      value={form.author} onChange={(e) => set("author", e.target.value)} />
                    {errors.author && <span style={s.error}>{errors.author}</span>}
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>Category</label>
                    <select style={s.select} value={form.category}
                      onChange={(e) => set("category", e.target.value)}>
                      {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {/* Image upload */}
                <div style={s.field}>
                  <label style={s.label}>
                    Cover Image <span style={s.labelSub}> — stored in Firebase Storage</span>
                  </label>
                  <div style={{ ...s.uploadZone, borderColor: imagePreview ? "var(--blue)" : "var(--border)" }}
                    onClick={() => fileRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const f = e.dataTransfer.files?.[0];
                      if (f) handleImage({ target: { files: [f] } });
                    }}>
                    {imagePreview ? (
                      <div style={s.previewWrap}>
                        <img src={imagePreview} alt="preview" style={s.preview} />
                        <button style={s.removeImg} onClick={(e) => {
                          e.stopPropagation();
                          setImageFile(null); setImagePreview(null);
                        }}>✕ Remove</button>
                      </div>
                    ) : (
                      <div style={s.uploadPlaceholder}>
                        <span style={{ fontSize: "2rem" }}>🖼️</span>
                        <span style={s.uploadText}>Click or drag to upload</span>
                        <span style={s.uploadSub}>PNG, JPG, WebP — max 5MB</span>
                      </div>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*"
                    style={{ display: "none" }} onChange={handleImage} />
                  {uploading && (
                    <div style={s.progressWrap}>
                      <div style={{ ...s.progressBar, width: `${uploadProgress}%` }} />
                      <span style={s.progressLabel}>Uploading {uploadProgress}%</span>
                    </div>
                  )}
                </div>

                <div style={s.field}>
                  <label style={s.label}>
                    Content <span style={s.req}>*</span>
                    <span style={s.charCount}>{form.content.length} chars</span>
                  </label>
                  <textarea style={{ ...inputStyle("content"), ...s.textarea }}
                    placeholder="Share your ideas, insights, and stories…"
                    value={form.content} onChange={(e) => set("content", e.target.value)} rows={8} />
                  {errors.content && <span style={s.error}>{errors.content}</span>}
                </div>

                <AITagGenerator title={form.title} content={form.content} onTagsGenerated={setAiTags} />

                {aiTags.length > 0 && (
                  <div style={s.selectedTags}>
                    <span style={s.tagsLabel}>Selected tags:</span>
                    {aiTags.map((t) => <span key={t} style={s.tagPill}>#{t}</span>)}
                  </div>
                )}

                <div style={s.actions}>
                  {/* Preview shortcut button */}
                  <button style={s.previewShortcut} onClick={() => setActiveTab("preview")}>
                    👁️ Preview
                  </button>
                  <button style={{ ...s.publishBtn, opacity: publishing ? 0.7 : 1 }}
                    onClick={handlePublish} disabled={publishing}
                    onMouseEnter={(e) => !publishing && (e.currentTarget.style.background = "#1e40af")}
                    onMouseLeave={(e) => !publishing && (e.currentTarget.style.background = "var(--blue)")}>
                    {publishing ? (
                      <><span style={s.spinner} />
                        {uploading ? `Uploading ${uploadProgress}%…` : "Publishing…"}</>
                    ) : "🚀 Publish Post"}
                  </button>
                  <button style={s.cancelBtn} onClick={onClose}>Cancel</button>
                </div>
              </div>
            )}

            {/* ── Preview Tab ── */}
            {activeTab === "preview" && (
              <div>
                <div style={s.previewBanner}>
                  <span>👁️ This is how your post will look to readers</span>
                  <button style={s.backToWrite} onClick={() => setActiveTab("write")}>
                    ← Back to editing
                  </button>
                </div>
                <LivePreview form={form} imagePreview={imagePreview} aiTags={aiTags} />
                <div style={{ ...s.actions, marginTop: 20 }}>
                  <button style={{ ...s.publishBtn, opacity: publishing ? 0.7 : 1 }}
                    onClick={handlePublish} disabled={publishing}>
                    {publishing ? "Publishing…" : "🚀 Publish Post"}
                  </button>
                  <button style={s.cancelBtn} onClick={() => setActiveTab("write")}>← Edit</button>
                </div>
              </div>
            )}

            {/* ── AI Tools Tab ── */}
            {activeTab === "ai" && (
              <div style={{ padding: "16px 0" }}>
                <p style={s.aiTabHint}>
                  ✍️ Switch to the <strong>Write</strong> tab, add your title and content,
                  then come back here for AI analysis.
                </p>
                <AIWritingAssistant title={form.title} content={form.content} />
              </div>
            )}
          </>
        ) : (
          <div style={s.success}>
            <div style={{ fontSize: "3.5rem" }}>🎉</div>
            <h2 style={s.successTitle}>Published!</h2>
            <p style={{ color: "var(--mid)" }}>Your post is live and visible to all readers in real-time.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Preview styles ──
const p = {
  wrap: { borderRadius: 12, overflow: "hidden", border: "1.5px solid var(--border)", background: "#fff" },
  cover: { width: "100%", height: 220, objectFit: "cover", display: "block" },
  coverPlaceholder: {
    height: 120, background: "var(--bg-2)", display: "flex",
    alignItems: "center", justifyContent: "center",
    color: "var(--muted)", fontSize: "0.88rem", gap: 8,
  },
  body: { padding: "24px 28px" },
  meta: { display: "flex", alignItems: "center", gap: 8, marginBottom: 12 },
  category: {
    background: "var(--blue)", color: "#fff", padding: "3px 10px",
    borderRadius: 100, fontSize: "0.72rem", fontWeight: 700,
    fontFamily: "var(--font-display)", textTransform: "uppercase",
  },
  dot: { color: "var(--muted)" },
  readTime: { fontSize: "0.78rem", color: "var(--mid)", fontFamily: "var(--font-display)" },
  title: {
    fontSize: "1.6rem", fontWeight: 800, fontFamily: "var(--font-display)",
    color: "var(--ink)", lineHeight: 1.25, marginBottom: 16, letterSpacing: "-0.5px",
  },
  authorRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 16 },
  avatar: {
    width: 36, height: 36, borderRadius: "50%", background: "var(--blue)",
    color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 800, fontSize: "0.9rem", fontFamily: "var(--font-display)", flexShrink: 0,
  },
  authorName: { fontWeight: 700, fontSize: "0.88rem", fontFamily: "var(--font-display)", color: "var(--ink)" },
  date: { fontSize: "0.76rem", color: "var(--muted)" },
  divider: { border: "none", borderTop: "1px solid var(--border)", margin: "0 0 20px" },
  content: { lineHeight: 1.8, color: "var(--ink)", fontSize: "0.95rem" },
  para: { marginBottom: 14 },
  placeholder: { color: "var(--muted)", fontStyle: "italic" },
  tags: { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 20 },
  tag: {
    background: "var(--bg-2)", color: "var(--blue)", padding: "4px 12px",
    borderRadius: 100, fontSize: "0.76rem", fontWeight: 700, fontFamily: "var(--font-display)",
  },
};

// ── Modal styles (same as before + new additions) ──
const s = {
  backdrop: {
    position: "fixed", inset: 0, zIndex: 200,
    background: "rgba(12,12,20,0.55)", backdropFilter: "blur(10px)",
    display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
  },
  modal: {
    background: "#fff", borderRadius: 20, width: "100%", maxWidth: 680,
    padding: "40px 44px", maxHeight: "92vh", overflowY: "auto",
    position: "relative", animation: "slideDown 0.3s ease", transition: "max-width 0.3s ease",
  },
  closeBtn: {
    position: "absolute", top: 18, right: 18, width: 36, height: 36,
    borderRadius: "50%", background: "var(--bg)", border: "1px solid var(--border)",
    fontSize: "0.95rem", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  header: { display: "flex", alignItems: "center", gap: 16, marginBottom: 20 },
  headerIcon: {
    width: 52, height: 52, borderRadius: 14, background: "var(--bg-2)",
    fontSize: "1.6rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  title: {
    fontSize: "1.5rem", fontWeight: 800, fontFamily: "var(--font-display)",
    color: "var(--ink)", letterSpacing: "-0.5px",
  },
  subtitle: { fontSize: "0.85rem", color: "var(--mid)", marginTop: 4 },
  tabs: { display: "flex", gap: 8, marginBottom: 20 },
  tab: {
    padding: "8px 18px", borderRadius: 8, border: "none",
    fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.86rem",
    cursor: "pointer", transition: "all 0.2s",
  },
  previewBanner: {
    background: "var(--bg-2)", border: "1px solid var(--border)",
    borderRadius: 10, padding: "10px 16px", marginBottom: 16,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    fontSize: "0.84rem", color: "var(--mid)", fontFamily: "var(--font-display)",
  },
  backToWrite: {
    background: "none", border: "none", color: "var(--blue)",
    fontFamily: "var(--font-display)", fontWeight: 700,
    fontSize: "0.82rem", cursor: "pointer",
  },
  previewShortcut: {
    padding: "13px 18px", background: "var(--bg-2)", color: "var(--mid)",
    border: "1.5px solid var(--border)", borderRadius: 8,
    fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.88rem",
    cursor: "pointer",
  },
  aiTabHint: {
    background: "var(--bg-2)", border: "1px solid var(--border)",
    borderRadius: 10, padding: "12px 16px",
    fontSize: "0.88rem", color: "var(--mid)", marginBottom: 16,
    lineHeight: 1.6, fontFamily: "var(--font-display)",
  },
  form: { display: "flex", flexDirection: "column", gap: 20 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: {
    fontSize: "0.82rem", fontWeight: 700, fontFamily: "var(--font-display)",
    color: "var(--ink)", display: "flex", alignItems: "center", gap: 4,
  },
  labelSub: { fontWeight: 400, color: "var(--muted)", fontSize: "0.78rem" },
  req: { color: "#ef4444" },
  charCount: { marginLeft: "auto", color: "var(--muted)", fontWeight: 400, fontSize: "0.75rem" },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  input: {
    padding: "11px 14px", border: "1.5px solid var(--border)", borderRadius: 8,
    fontFamily: "var(--font-body)", fontSize: "0.92rem", color: "var(--ink)",
    background: "var(--bg)", outline: "none", transition: "border 0.2s", width: "100%",
  },
  select: {
    padding: "11px 14px", border: "1.5px solid var(--border)", borderRadius: 8,
    fontFamily: "var(--font-body)", fontSize: "0.92rem", color: "var(--ink)",
    background: "var(--bg)", outline: "none", width: "100%", cursor: "pointer",
  },
  textarea: { resize: "vertical", minHeight: 160, lineHeight: 1.7 },
  uploadZone: {
    border: "2px dashed var(--border)", borderRadius: 12,
    cursor: "pointer", transition: "all 0.2s", overflow: "hidden", minHeight: 120,
  },
  uploadPlaceholder: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", gap: 8, padding: "28px 20px",
  },
  uploadText: { fontSize: "0.88rem", fontWeight: 600, color: "var(--mid)", fontFamily: "var(--font-display)" },
  uploadSub: { fontSize: "0.76rem", color: "var(--muted)" },
  previewWrap: { position: "relative" },
  preview: { width: "100%", height: 180, objectFit: "cover", display: "block" },
  removeImg: {
    position: "absolute", top: 8, right: 8,
    background: "rgba(12,12,20,0.7)", color: "#fff",
    border: "none", borderRadius: 6, padding: "4px 10px",
    fontSize: "0.8rem", cursor: "pointer", fontFamily: "var(--font-display)",
  },
  progressWrap: { marginTop: 8 },
  progressBar: { height: 4, background: "var(--blue)", borderRadius: 2, transition: "width 0.2s" },
  progressLabel: { fontSize: "0.75rem", color: "var(--blue)", marginTop: 4, display: "block" },
  error: { fontSize: "0.78rem", color: "#ef4444", fontFamily: "var(--font-display)" },
  selectedTags: { display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" },
  tagsLabel: { fontSize: "0.78rem", color: "var(--muted)", fontFamily: "var(--font-display)", fontWeight: 600 },
  tagPill: {
    background: "var(--bg-2)", color: "var(--blue)", padding: "3px 10px",
    borderRadius: 100, fontSize: "0.74rem", fontFamily: "var(--font-display)", fontWeight: 700,
  },
  actions: { display: "flex", gap: 12, marginTop: 4 },
  publishBtn: {
    flex: 1, padding: "13px 24px", background: "var(--blue)", color: "#fff",
    border: "none", borderRadius: 8,
    fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.95rem",
    cursor: "pointer", transition: "background 0.2s",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  },
  cancelBtn: {
    padding: "13px 24px", background: "transparent", color: "var(--mid)",
    border: "1.5px solid var(--border)", borderRadius: 8,
    fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.92rem", cursor: "pointer",
  },
  spinner: {
    width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "#fff", borderRadius: "50%",
    animation: "spin 0.7s linear infinite", display: "inline-block",
  },
  success: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", padding: "40px 20px", gap: 16, textAlign: "center",
  },
  successTitle: {
    fontSize: "1.8rem", fontWeight: 800, fontFamily: "var(--font-display)",
    animation: "fadeUp 0.4s 0.1s ease both",
  },
};