// src/ai/aiService.js

// ⚠️ Replace with your actual key
const OPENAI_API_KEY = "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";

// Small delay helper
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ──────────────────────────────────────────────
// 1. SUMMARY (mock)
// ──────────────────────────────────────────────
export async function generateSummary(title, content) {
  await delay(500);

  return `This article explains ${title.toLowerCase()} in a simple and clear way. 
It highlights important ideas and provides useful insights.`;
}

// ──────────────────────────────────────────────
// 2. WRITING ANALYSIS (mock)
// ──────────────────────────────────────────────
export async function analyzeWriting(title, content) {
  await delay(800);

  return {
    score: 8,
    tone: "Professional",
    readability: "Medium",
    strengths: [
      "Clear structure",
      "Engaging content",
      "Good topic selection",
    ],
    improvements: [
      "Add examples",
      "Improve intro",
      "Shorten paragraphs",
    ],
    rewrittenIntro: `In today's world, ${title.toLowerCase()} is becoming increasingly important.`,
  };
}

// ──────────────────────────────────────────────
// 3. AI TAG GENERATOR (🔥 REAL AI + FALLBACK)
// ──────────────────────────────────────────────
export async function generateTags(title, content) {
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Generate 5 relevant tags for this article. Return ONLY JSON array like [\"tag1\",\"tag2\"]",
          },
          {
            role: "user",
            content: `Title: ${title}\nContent: ${content}`,
          },
        ],
        max_tokens: 100,
      }),
    });

    const data = await res.json();
    console.log("OPENAI RESPONSE:", data);

    const text = data?.choices?.[0]?.message?.content;

    if (text) {
      return JSON.parse(text);
    }

    throw new Error("Invalid AI response");
  } catch (err) {
    console.error("AI FAILED → using fallback:", err);

    // 🔁 FALLBACK (SMART LOCAL TAGS)
    await delay(300);

    const text = (title + " " + content).toLowerCase();
    const words = text.split(/\W+/);

    const freq = {};

    words.forEach((w) => {
      if (w.length > 4) {
        freq[w] = (freq[w] || 0) + 1;
      }
    });

    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .map(([word]) => word)
      .slice(0, 5);
  }
}

// ──────────────────────────────────────────────
// 4. COMMENT SENTIMENT (mock)
// ──────────────────────────────────────────────
export async function analyzeCommentSentiment(commentText) {
  await delay(400);

  return {
    sentiment: "Positive",
    emotion: "Happy",
    toxic: false,
    score: 0.8,
    flag: "none",
  };
}

// ──────────────────────────────────────────────
// 5. RECOMMENDATIONS (mock)
// ──────────────────────────────────────────────
export async function getRecommendations(readHistory, allPosts) {
  await delay(400);

  return allPosts.slice(0, 3);
}