// src/components/ArticleActions.jsx
// Download article as styled HTML file (printable / saveable as PDF via browser)
// + Share via email (mailto link)
// Usage: <ArticleActions post={post} />

import { useState } from "react";
import { toast } from "react-hot-toast";

// ── Generate a styled HTML document from a post ───────────────────────────
function generateArticleHTML(post) {
  const date = post.createdAt?.toDate
    ? post.createdAt.toDate().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${post.title} — AERO BLOG</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Lora:ital,wght@0,400;0,500;1,400&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Lora', Georgia, serif;
      background: #f8faff;
      color: #0c0c14;
      line-height: 1.7;
      padding: 0;
    }

    .page {
      max-width: 720px;
      margin: 0 auto;
      background: #ffffff;
      min-height: 100vh;
      padding: 60px 64px 80px;
      box-shadow: 0 0 60px rgba(0,0,0,0.06);
    }

    .brand {
      font-family: 'Syne', sans-serif;
      font-weight: 800;
      font-size: 14px;
      letter-spacing: 0.06em;
      color: #94a3b8;
      text-transform: uppercase;
      margin-bottom: 40px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .brand span { color: #1d4ed8; }

    .category {
      display: inline-block;
      font-family: 'Syne', sans-serif;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #1d4ed8;
      background: rgba(29,78,216,0.08);
      padding: 3px 12px;
      border-radius: 99px;
      margin-bottom: 16px;
    }

    h1 {
      font-family: 'Syne', sans-serif;
      font-weight: 800;
      font-size: 2.6rem;
      line-height: 1.1;
      letter-spacing: -0.03em;
      color: #0c0c14;
      margin-bottom: 20px;
    }

    .meta {
      display: flex;
      align-items: center;
      gap: 16px;
      font-size: 13px;
      color: #94a3b8;
      margin-bottom: 32px;
      font-family: 'Syne', sans-serif;
    }

    .meta strong { color: #0c0c14; }

    .cover {
      width: 100%;
      height: 320px;
      object-fit: cover;
      border-radius: 12px;
      margin-bottom: 40px;
    }

    .content {
      font-size: 1.05rem;
      line-height: 1.8;
      color: #1e1e2e;
    }

    .content p { margin-bottom: 1.4em; }

    .stats {
      display: flex;
      gap: 20px;
      padding: 16px 0;
      margin-top: 48px;
      border-top: 1px solid #e2e8f0;
      font-family: 'Syne', sans-serif;
      font-size: 13px;
      color: #94a3b8;
    }

    .footer {
      margin-top: 48px;
      padding-top: 24px;
      border-top: 2px solid #1d4ed8;
      font-family: 'Syne', sans-serif;
      font-size: 12px;
      color: #94a3b8;
      text-align: center;
    }

    @media print {
      body { background: white; }
      .page { box-shadow: none; padding: 40px; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="brand">
      AERO<span>BLOG</span>
      <span>${date}</span>
    </div>

    ${post.category ? `<div class="category">${post.category}</div>` : ""}

    <h1>${post.title}</h1>

    <div class="meta">
      <span>By <strong>${post.author || post.authorName || "Anonymous"}</strong></span>
      <span>·</span>
      <span>${date}</span>
      ${post.readTime ? `<span>· ${post.readTime} min read</span>` : ""}
    </div>

    ${post.imageUrl ? `<img class="cover" src="${post.imageUrl}" alt="${post.title}" />` : ""}

    <div class="content">
      ${(post.content || post.body || "No content available.")
        .split("\n")
        .filter(Boolean)
        .map((p) => `<p>${p}</p>`)
        .join("\n")}
    </div>

    <div class="stats">
      <span>❤️ ${post.likes || 0} likes</span>
      <span>👁 ${post.views || 0} views</span>
      <span>💬 ${post.commentsCount || 0} comments</span>
    </div>

    <div class="footer">
      Originally published on AERO BLOG · aeroblog.com<br/>
      Downloaded on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
    </div>
  </div>
</body>
</html>`;
}

// ── Download helper ────────────────────────────────────────────────────────
function downloadHTML(post) {
  const html = generateArticleHTML(post);
  const blob = new Blob([html], { type: "text/html" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${post.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Email share helper ─────────────────────────────────────────────────────
function shareViaEmail(post, recipientEmail) {
  const subject = encodeURIComponent(`Check out: ${post.title}`);
  const date    = post.createdAt?.toDate
    ? post.createdAt.toDate().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "";
  const body    = encodeURIComponent(
    `Hey!\n\nI thought you'd enjoy this article from AERO BLOG:\n\n` +
    `"${post.title}"\n` +
    `By ${post.author || "Anonymous"}${date ? ` · ${date}` : ""}\n\n` +
    `${post.excerpt || (post.content || "").slice(0, 200).trim()}...\n\n` +
    `Read it on AERO BLOG.\n\n— Sent via AERO BLOG`
  );

  const mailto = recipientEmail
    ? `mailto:${recipientEmail}?subject=${subject}&body=${body}`
    : `mailto:?subject=${subject}&body=${body}`;

  window.open(mailto, "_blank");
}

// ── Copy link ──────────────────────────────────────────────────────────────
function copyLink(post) {
  const url = `${window.location.origin}#post-${post.id}`;
  navigator.clipboard.writeText(url).then(() => toast.success("Link copied!"));
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function ArticleActions({ post, compact = false }) {
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [emailVal, setEmailVal] = useState("");
  const [downloading, setDownloading] = useState(false);

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      downloadHTML(post);
      toast.success("Article downloaded! Open in browser → File → Print → Save as PDF");
      setDownloading(false);
    }, 200);
  };

  const handleEmailShare = () => {
    if (showEmailInput && emailVal.trim()) {
      // Basic email validation
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal.trim())) {
        toast.error("Please enter a valid email address.");
        return;
      }
      shareViaEmail(post, emailVal.trim());
      setShowEmailInput(false);
      setEmailVal("");
    } else if (showEmailInput) {
      // No email entered — open default mail client
      shareViaEmail(post, "");
      setShowEmailInput(false);
    } else {
      setShowEmailInput(true);
    }
  };

  if (compact) {
    // Compact inline version for inside PostReader
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {/* Download */}
          <button onClick={handleDownload} disabled={downloading} style={btnStyle("#1d4ed8")}>
            {downloading ? "⏳ Preparing…" : "⬇️ Download Article"}
          </button>

          {/* Email share */}
          <button onClick={handleEmailShare} style={btnStyle("#10b981")}>
            {showEmailInput ? "📨 Send" : "📧 Share via Email"}
          </button>

          {/* Copy link */}
          <button onClick={() => copyLink(post)} style={btnStyle("#f5c518", "#000")}>
            🔗 Copy Link
          </button>
        </div>

        {/* Email input */}
        {showEmailInput && (
          <div style={{
            display: "flex", gap: 8, animation: "fadeUp 0.2s ease",
            alignItems: "center",
          }}>
            <input
              type="email"
              value={emailVal}
              onChange={(e) => setEmailVal(e.target.value)}
              placeholder="Enter recipient's email (optional)"
              onKeyDown={(e) => e.key === "Enter" && handleEmailShare()}
              autoFocus
              style={{
                flex: 1, padding: "9px 14px",
                border: "1.5px solid var(--border)", borderRadius: 8,
                fontFamily: "var(--font-body)", fontSize: 14,
                color: "var(--ink)", background: "var(--bg)", outline: "none",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--blue)")}
              onBlur={(e)  => (e.target.style.borderColor = "var(--border)")}
            />
            <button onClick={() => setShowEmailInput(false)} style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--muted)", fontSize: 16, padding: "4px 8px",
            }}>✕</button>
          </div>
        )}

        <p style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-mono)" }}>
          💡 To save as PDF: Download → open in browser → File → Print → Save as PDF
        </p>
      </div>
    );
  }

  // Full standalone card version
  return (
    <div style={{
      background: "var(--card)", border: "1px solid var(--border)",
      borderRadius: "var(--radius)", padding: "20px 24px",
    }}>
      <h3 style={{
        fontFamily: "var(--font-display)", fontWeight: 800,
        fontSize: 15, color: "var(--ink)", marginBottom: 16,
      }}>
        Share & Save
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

        {/* Download */}
        <button onClick={handleDownload} disabled={downloading}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "12px 16px", borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border)", background: "var(--bg-2)",
            cursor: downloading ? "wait" : "pointer",
            transition: "all 0.18s", textAlign: "left",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--blue)"; e.currentTarget.style.background = "var(--blue-glow)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--bg-2)"; }}
        >
          <span style={{ fontSize: 20 }}>{downloading ? "⏳" : "⬇️"}</span>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, color: "var(--ink)" }}>
              {downloading ? "Preparing download…" : "Download as File"}
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>Save & print as PDF from your browser</div>
          </div>
        </button>

        {/* Email share */}
        <button onClick={handleEmailShare}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "12px 16px", borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border)", background: "var(--bg-2)",
            cursor: "pointer", transition: "all 0.18s", textAlign: "left",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#10b981"; e.currentTarget.style.background = "rgba(16,185,129,0.08)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--bg-2)"; }}
        >
          <span style={{ fontSize: 20 }}>📧</span>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, color: "var(--ink)" }}>
              {showEmailInput ? "Enter email below & click Send" : "Share via Email"}
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>Opens your mail app with article summary</div>
          </div>
        </button>

        {showEmailInput && (
          <div style={{ display: "flex", gap: 8, animation: "fadeUp 0.2s ease" }}>
            <input
              type="email" value={emailVal}
              onChange={(e) => setEmailVal(e.target.value)}
              placeholder="Recipient email (optional — leave blank for your own)"
              onKeyDown={(e) => e.key === "Enter" && handleEmailShare()}
              autoFocus
              style={{
                flex: 1, padding: "10px 14px",
                border: "1.5px solid var(--blue)", borderRadius: 8,
                fontFamily: "var(--font-body)", fontSize: 14,
                color: "var(--ink)", background: "var(--bg)", outline: "none",
              }}
            />
            <button onClick={handleEmailShare} style={{
              padding: "10px 16px", background: "#10b981", color: "#fff",
              border: "none", borderRadius: 8, cursor: "pointer",
              fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13,
            }}>
              Send
            </button>
          </div>
        )}

        {/* Copy link */}
        <button onClick={() => copyLink(post)}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "12px 16px", borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border)", background: "var(--bg-2)",
            cursor: "pointer", transition: "all 0.18s", textAlign: "left",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#f5c518"; e.currentTarget.style.background = "rgba(245,197,24,0.08)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--bg-2)"; }}
        >
          <span style={{ fontSize: 20 }}>🔗</span>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, color: "var(--ink)" }}>Copy Link</div>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>Copy a shareable link to this article</div>
          </div>
        </button>
      </div>
    </div>
  );
}

function btnStyle(bg, color = "#fff") {
  return {
    padding: "9px 16px", background: bg, color,
    border: "none", borderRadius: 8,
    fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13,
    cursor: "pointer", transition: "opacity 0.2s",
    display: "flex", alignItems: "center", gap: 6,
  };
}