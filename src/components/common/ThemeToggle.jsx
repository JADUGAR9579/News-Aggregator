import { memo } from "react";
import { motion } from "framer-motion";
import { FiSun, FiMoon } from "react-icons/fi";
import { useTheme } from "../../hooks/useTheme.js";

/**
 * ThemeToggle
 * Animated switch between light and dark mode, backed by ThemeContext.
 */
function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      className="btn-focus relative flex h-9 w-16 items-center rounded-full bg-gray-200 p-1 transition-colors dark:bg-gray-700"
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-primary-600 shadow"
        style={{ marginLeft: isDark ? "auto" : 0 }}
      >
        {isDark ? <FiMoon size={16} /> : <FiSun size={16} />}
      </motion.span>
    </button>
  );
}

export default memo(ThemeToggle);
