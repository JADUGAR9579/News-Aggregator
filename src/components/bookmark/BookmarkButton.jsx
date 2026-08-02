import { memo } from "react";
import { motion } from "framer-motion";
import { FiBookmark } from "react-icons/fi";
import { useBookmarks } from "../../hooks/useBookmarks.js";

/**
 * BookmarkButton
 * Toggles bookmark state for a given article. Stops event propagation so it
 * can be safely nested inside a clickable NewsCard without triggering navigation.
 *
 * @param {object} props
 * @param {object} props.article
 * @param {"sm"|"md"} [props.size]
 */
function BookmarkButton({ article, size = "md" }) {
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const bookmarked = isBookmarked(article);
  const dimension = size === "sm" ? 16 : 20;

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleBookmark(article);
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      whileTap={{ scale: 0.85 }}
      aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
      aria-pressed={bookmarked}
      className={`btn-focus flex items-center justify-center rounded-full p-2 transition-colors ${
        bookmarked
          ? "bg-primary-600 text-white"
          : "bg-white/90 text-gray-600 hover:text-primary-600 dark:bg-black/40 dark:text-gray-200"
      }`}
    >
      <FiBookmark
        size={dimension}
        aria-hidden="true"
        fill={bookmarked ? "currentColor" : "none"}
      />
    </motion.button>
  );
}

export default memo(BookmarkButton);
