// lib/useTheme.ts
import { useState, useEffect } from "react";

export type Theme = "dark" | "light";

export function useTheme() {
  // Read directly from the DOM attribute that the inline script already set.
  // Since layout.tsx injects a sync script before any paint, data-theme is
  // always correct by the time this runs — no useEffect delay, no flash.
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "dark"; // SSR fallback
    const fromDom = document.documentElement.getAttribute("data-theme") as Theme | null;
    if (fromDom === "light" || fromDom === "dark") return fromDom;
    return "dark";
  });

  // Sync back to <html> and localStorage whenever theme changes
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("app-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => (t === "dark" ? "light" : "dark"));

  return { theme, toggleTheme };
}