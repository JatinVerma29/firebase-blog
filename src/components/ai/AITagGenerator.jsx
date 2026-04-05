// src/components/ai/AITagGenerator.jsx
import { useState } from "react";
import { generateTags } from "../../ai/aiService";

function AITagGenerator({ title, content, onTagsGenerated }) {
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    console.log("TAG BUTTON CLICKED");

    if (!title.trim() || !content.trim()) {
      alert("Please add title and content first");
      return;
    }

    setLoading(true);

    try {
      const tags = await generateTags(title, content);
      console.log("TAGS:", tags);

      if (onTagsGenerated) {
        onTagsGenerated(tags);
      }
    } catch (err) {
      console.error("TAG ERROR:", err);
      alert("Failed to generate tags");
    }

    setLoading(false);
  };

  return (
    <div style={s.container}>
      <div style={s.header}>
        <span>🏷️ AI Tags</span>

        <button style={s.button} onClick={handleGenerate}>
          {loading ? "Generating..." : "✨ Auto-generate"}
        </button>
      </div>
    </div>
  );
}

export default AITagGenerator;

const s = {
  container: {
    background: "var(--bg-2)",
    padding: "14px 16px",
    borderRadius: 12,
    border: "1px solid var(--border)",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "0.95rem",
    fontWeight: 600,
  },

  button: {
    background: "var(--blue)",
    color: "#fff",
    border: "none",
    padding: "8px 14px",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: "0.85rem",
  },
};