// src/hooks/useDarkMode.js
import { useState, useEffect } from "react";

export function useDarkMode() {
  // Default to LIGHT mode regardless of OS setting
  // This prevents the dark-on-dark modal bug
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem("aero_dark");
      if (saved !== null) return saved === "true";
    } catch {}
    return false; // always start light
  });

  useEffect(() => {
    try { localStorage.setItem("aero_dark", dark); } catch {}
    const root = document.documentElement;
    // Set a data attribute so CSS can target it
    root.setAttribute("data-theme", dark ? "dark" : "light");

    if (dark) {
      root.style.setProperty("--ink",         "#f1f5f9");
      root.style.setProperty("--ink-2",       "#e2e8f0");
      root.style.setProperty("--bg",          "#0f172a");
      root.style.setProperty("--bg-2",        "#1e293b");
      root.style.setProperty("--card",        "#1e293b");
      root.style.setProperty("--border",      "#334155");
      root.style.setProperty("--border-dark", "#475569");
      root.style.setProperty("--mid",         "#94a3b8");
      root.style.setProperty("--muted",       "#64748b");
      // Modal-specific overrides for dark mode
      root.style.setProperty("--modal-bg",    "#1e293b");
      root.style.setProperty("--modal-ink",   "#f1f5f9");
      root.style.setProperty("--input-bg",    "#0f172a");
      root.style.setProperty("--input-ink",   "#f1f5f9");
      root.style.setProperty("--input-border","#334155");
    } else {
      root.style.setProperty("--ink",         "#0c0c14");
      root.style.setProperty("--ink-2",       "#1e1e2e");
      root.style.setProperty("--bg",          "#f8faff");
      root.style.setProperty("--bg-2",        "#f1f5fe");
      root.style.setProperty("--card",        "#ffffff");
      root.style.setProperty("--border",      "#e2e8f0");
      root.style.setProperty("--border-dark", "#cbd5e1");
      root.style.setProperty("--mid",         "#64748b");
      root.style.setProperty("--muted",       "#94a3b8");
      // Modal-specific overrides for light mode
      root.style.setProperty("--modal-bg",    "#ffffff");
      root.style.setProperty("--modal-ink",   "#0c0c14");
      root.style.setProperty("--input-bg",    "#f8faff");
      root.style.setProperty("--input-ink",   "#0c0c14");
      root.style.setProperty("--input-border","#e2e8f0");
    }
  }, [dark]);

  return [dark, setDark];
}