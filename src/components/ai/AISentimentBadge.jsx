// src/components/ai/AISentimentBadge.jsx
// Feature 4: Analyses each comment for sentiment + toxicity
import { useState, useEffect } from "react";
import { analyzeCommentSentiment } from "../../ai/aiService";

const SENTIMENT_STYLES = {
  Positive: { bg: "#d1fae5", color: "#059669", icon: "😊" },
  Neutral:  { bg: "#f1f5f9", color: "#64748b", icon: "😐" },
  Negative: { bg: "#fee2e2", color: "#dc2626", icon: "😟" },
};

const FLAG_STYLES = {
  none:   null,
  review: { bg: "#fef3c7", color: "#d97706", label: "⚠️ Review" },
  remove: { bg: "#fee2e2", color: "#dc2626", label: "🚫 Flagged" },
};

export default function AISentimentBadge({ text, autoAnalyze = false }) {
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);

  // Auto-analyze on mount if prop is set
  useEffect(() => {
    if (autoAnalyze && text && !analyzed) {
      handleAnalyze();
    }
  }, [text, autoAnalyze]);

  const handleAnalyze = async () => {
    if (!text?.trim() || loading) return;
    setLoading(true);
    try {
      const data = await analyzeCommentSentiment(text);
      setResult(data);
      setAnalyzed(true);
    } catch { /* silent fail */ }
    setLoading(false);
  };

  if (loading) {
    return (
      <span style={s.loadingBadge}>
        <span style={s.spinner} /> Analysing…
      </span>
    );
  }

  if (!result) {
    return (
      <button style={s.analyseBtn} onClick={handleAnalyze} title="Analyse sentiment">
        🤖 Analyse
      </button>
    );
  }

  const sentStyle = SENTIMENT_STYLES[result.sentiment] || SENTIMENT_STYLES.Neutral;
  const flagStyle = FLAG_STYLES[result.flag];

  return (
    <div style={s.wrap}>
      {/* Sentiment badge */}
      <span style={{ ...s.badge, background: sentStyle.bg, color: sentStyle.color }}>
        {sentStyle.icon} {result.sentiment}
      </span>

      {/* Emotion */}
      <span style={s.emotion}>{result.emotion}</span>

      {/* Score bar */}
      <div style={s.barWrap} title={`Score: ${result.score}`}>
        <div style={{
          ...s.barFill,
          width: `${((result.score + 1) / 2) * 100}%`,
          background: result.score > 0 ? "#059669" : result.score < 0 ? "#dc2626" : "#94a3b8",
        }} />
      </div>

      {/* Flag */}
      {flagStyle && (
        <span style={{ ...s.flagBadge, background: flagStyle.bg, color: flagStyle.color }}>
          {flagStyle.label}
        </span>
      )}
    </div>
  );
}

const s = {
  wrap: {
    display: "flex", alignItems: "center", gap: 6,
    flexWrap: "wrap", marginTop: 4,
  },
  badge: {
    padding: "2px 8px", borderRadius: 100,
    fontSize: "0.68rem", fontWeight: 700,
    fontFamily: "var(--font-display)",
  },
  emotion: {
    fontSize: "0.68rem", color: "var(--muted)",
    fontFamily: "var(--font-display)", fontWeight: 600,
  },
  barWrap: {
    width: 48, height: 4,
    background: "var(--border)", borderRadius: 2, overflow: "hidden",
  },
  barFill: {
    height: "100%", borderRadius: 2,
    transition: "width 0.4s ease",
  },
  flagBadge: {
    padding: "2px 8px", borderRadius: 100,
    fontSize: "0.68rem", fontWeight: 700,
    fontFamily: "var(--font-display)",
  },
  analyseBtn: {
    padding: "2px 8px", background: "var(--bg-2)",
    border: "1px solid var(--border)", borderRadius: 100,
    fontSize: "0.68rem", fontFamily: "var(--font-display)",
    fontWeight: 700, color: "var(--mid)", cursor: "pointer",
    marginTop: 4,
  },
  loadingBadge: {
    display: "inline-flex", alignItems: "center", gap: 4,
    fontSize: "0.68rem", color: "var(--muted)",
    fontFamily: "var(--font-display)",
  },
  spinner: {
    width: 10, height: 10,
    border: "1.5px solid var(--border)",
    borderTopColor: "var(--blue)", borderRadius: "50%",
    animation: "spin 0.7s linear infinite", display: "inline-block",
  },
};