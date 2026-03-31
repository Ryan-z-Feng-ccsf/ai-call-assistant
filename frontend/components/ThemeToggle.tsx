// components/ThemeToggle.tsx
"use client";

import { useTheme } from "@/lib/useTheme";

export function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme();

  const icon  = !mounted ? "⚡" : theme === "dark" ? "🌙" : theme === "light" ? "☀️" : "⚡";
  const title = `Switch to ${theme === "dark" ? "light" : theme === "light" ? "cyber" : "dark"} mode`;

  return (
    <button
      suppressHydrationWarning
      onClick={toggleTheme}
      title={title}
      style={{
        width: 36, height: 36, borderRadius: 11,
        border: "1px solid var(--border-glass)",
        background: "var(--bg-control)",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", fontSize: 16,
        transition: "all 0.2s", flexShrink: 0,
        color: "var(--text-primary)",
      }}
    >
      {icon}
    </button>
  );
}