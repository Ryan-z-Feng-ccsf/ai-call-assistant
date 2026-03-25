import { useState, useEffect } from "react";

export type Theme = "dark" | "light" | "cyber";
const VALID: Theme[] = ["dark", "light", "cyber"];

export function useTheme() {
  // 统一设定为 cyber，防止 SSR 和客户端初次渲染不匹配
  const [theme, setTheme] = useState<Theme>("cyber");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // 组件挂载到客户端后，读取真实的主题状态
    const fromStorage = localStorage.getItem("app-theme") as Theme | null;
    const fromDom = document.documentElement.getAttribute("data-theme") as Theme | null;
    
    if (fromStorage && VALID.includes(fromStorage)) {
      setTheme(fromStorage);
    } else if (fromDom && VALID.includes(fromDom)) {
      setTheme(fromDom);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return; // 挂载前不要去覆盖现有的 DOM 和 Storage
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("app-theme", theme);
  }, [theme, mounted]);

  const toggleTheme = () =>
    setTheme(t => t === "cyber" ? "dark" : t === "dark" ? "light" : "cyber");

  // 导出 mounted 状态供 UI 判断
  return { theme, toggleTheme, mounted }; 
}