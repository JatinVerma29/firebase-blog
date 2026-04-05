// src/components/ai/AIWritingAssistant.jsx
import { useState } from "react";
import { analyzeWriting } from "../../ai/aiService";

const toneIcons = {
  Professional: "👔",
  Casual: "😊",
  Technical: "⚙️",
  Inspirational: "🌟",
  Conversational: "💬",
};

function AIWritingAssistant({ title, content }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    if (!title.trim() || !content.trim()) {
      setError("Add title and content first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await analyzeWriting(title, content);
      setResult(data);
    } catch (e) {
      console.error(e);
      setError("AI analysis failed.");
    }

    setLoading(false);
  };

  return (
    <div style={s.wrapper}>
      <button style={s.button} onClick={handleAnalyze}>
        {loading ? "Analyzing..." : "🤖 Run AI Analysis"}
      </button>

      {error && <div style={s.error}>{error}</div>}

      {result && (
        <div style={s.container}>
          <div style={s.top}>
            <div style={s.scoreBox}>
              <span style={s.score}>{result.score}</span>
              <span style={s.scoreLabel}>Score</span>
            </div>

            <div style={s.meta}>
              <div style={s.metaItem}>
                <span>Tone</span>
                <strong>
                  {toneIcons[result.tone] || "📝"} {result.tone}
                </strong>
              </div>

              <div style={s.metaItem}>
                <span>Readability</span>
                <strong>{result.readability}</strong>
              </div>
            </div>
          </div>

          {result.rewrittenIntro && (
            <div style={s.block}>
              <div style={s.blockTitle}>Improved Opening</div>
              <p style={s.blockText}>{result.rewrittenIntro}</p>
            </div>
          )}

          <div style={s.grid}>
            <div>
              <div style={s.blockTitle}>Strengths</div>
              {result.strengths.map((item, i) => (
                <div key={i} style={s.listItem}>• {item}</div>
              ))}
            </div>

            <div>
              <div style={s.blockTitle}>Improvements</div>
              {result.improvements.map((item, i) => (
                <div key={i} style={s.listItem}>• {item}</div>
              ))}
            </div>
          </div>

          <div style={s.footer}>AI Writing Assistant</div>
        </div>
      )}
    </div>
  );
}

export default AIWritingAssistant;

const s = {
  wrapper: {
    marginTop: 12,
    fontFamily: "system-ui, -apple-system, sans-serif",
  },

  button: {
    width: "100%",
    padding: "12px",
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "var(--bg-2)",
    fontWeight: 600,
    fontSize: "0.95rem",
    cursor: "pointer",
  },

  error: {
    marginTop: 10,
    padding: 10,
    background: "#fee2e2",
    borderRadius: 6,
    fontSize: "0.9rem",
    color: "#dc2626",
  },

  container: {
    marginTop: 16,
    border: "1px solid var(--border)",
    borderRadius: 12,
    padding: 18,
    background: "#fff",
    fontSize: "0.95rem",
    lineHeight: 1.6,
  },

  top: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  scoreBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    background: "var(--bg-2)",
    padding: "10px 14px",
    borderRadius: 8,
  },

  score: {
    fontSize: "1.5rem",
    fontWeight: 800,
  },

  scoreLabel: {
    fontSize: "0.8rem",
    color: "var(--muted)",
  },

  meta: {
    display: "flex",
    gap: 24,
  },

  metaItem: {
    display: "flex",
    flexDirection: "column",
    fontSize: "0.95rem",
  },

  block: {
    background: "var(--bg-2)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 14,
  },

  blockTitle: {
    fontSize: "0.95rem",
    fontWeight: 700,
    marginBottom: 6,
  },

  blockText: {
    fontSize: "1rem",
    lineHeight: 1.7,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 18,
  },

  listItem: {
    fontSize: "0.95rem",
    marginBottom: 8,
    color: "var(--mid)",
  },

  footer: {
    marginTop: 12,
    fontSize: "0.85rem",
    textAlign: "center",
    color: "var(--muted)",
  },
};