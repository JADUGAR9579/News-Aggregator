import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext.jsx";

/**
 * useTheme
 * Access the current theme, setter, and toggle helper.
 * Must be used within a <ThemeProvider>.
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
