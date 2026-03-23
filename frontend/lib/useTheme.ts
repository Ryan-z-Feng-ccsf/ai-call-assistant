// lib/useTheme.ts
import { useState, useEffect } from "react";

export type Theme = "dark" | "light" | "cyber";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "dark";
    const fromDom = document.documentElement.getAttribute("data-theme") as Theme | null;
    if (fromDom === "light" || fromDom === "dark" || fromDom === "cyber") return fromDom;
    return "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("app-theme", theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme(t => t === "dark" ? "light" : t === "light" ? "cyber" : "dark");

  return { theme, toggleTheme };
}