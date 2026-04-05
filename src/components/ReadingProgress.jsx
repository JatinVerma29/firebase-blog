// src/components/ReadingProgress.jsx
import { useState, useEffect } from "react";

export default function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const scrolled = el.scrollTop;
      const total = el.scrollHeight - el.clientHeight;
      setProgress(total > 0 ? Math.min(100, (scrolled / total) * 100) : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0,
      height: 3, zIndex: 9998,
      background: "transparent",
    }}>
      <div style={{
        height: "100%",
        width: `${progress}%`,
        background: "linear-gradient(90deg, #1d4ed8, #3b82f6, #f5c518)",
        transition: "width 0.1s linear",
        borderRadius: "0 2px 2px 0",
      }} />
    </div>
  );
}