// lib/useTheme.ts
import { useState, useEffect } from "react";

export type Theme = "dark" | "light" | "cyber";
const VALID: Theme[] = ["dark", "light", "cyber"];

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "cyber";
    const fromStorage = localStorage.getItem("app-theme") as Theme | null;
    if (fromStorage && VALID.includes(fromStorage)) return fromStorage;
    const fromDom = document.documentElement.getAttribute("data-theme") as Theme | null;
    if (fromDom && VALID.includes(fromDom)) return fromDom;
    return "cyber";
  });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("app-theme", theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme(t => t === "cyber" ? "dark" : t === "dark" ? "light" : "cyber");

  return { theme, toggleTheme, mounted };
}