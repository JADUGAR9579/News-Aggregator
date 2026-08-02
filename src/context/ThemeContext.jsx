import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { getItem, setItem } from "../utils/storage.js";
import { STORAGE_KEYS } from "../utils/constants.js";

export const ThemeContext = createContext(null);

/**
 * Determine the initial theme:
 * 1. Persisted user choice in localStorage
 * 2. OS-level prefers-color-scheme
 * 3. Fallback to "light"
 */
function getInitialTheme() {
  const stored = getItem(STORAGE_KEYS.THEME);
  if (stored === "light" || stored === "dark") return stored;
  if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) return "dark";
  return "light";
}

/**
 * ThemeProvider
 * Owns dark/light mode state, syncs the `dark` class onto <html>,
 * and persists the user's choice to localStorage.
 */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    setItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme, isDark: theme === "dark" }),
    [theme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
