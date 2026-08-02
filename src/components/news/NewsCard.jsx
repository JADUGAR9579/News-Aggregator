import { memo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { FiShare2, FiClock } from "react-icons/fi";

import BookmarkButton from "../bookmark/BookmarkButton.jsx";
import { useBookmarks } from "../../hooks/useBookmarks.js";
import { formatRelativeTime } from "../../utils/formatDate.js";
import { getArticleId, getHostname, truncateText, buildShareData } from "../../utils/helpers.js";

/**
 * NewsCard
 * The primary article preview card: image, source, title, description,
 * bookmark + share actions. Clicking navigates to the Article detail page
 * and records the article in "recently viewed".
 *
 * @param {object} props
 * @param {object} props.article
 * @param {"vertical"|"horizontal"} [props.layout]
 */
function NewsCard({ article, layout = "vertical" }) {
  const { addRecentlyViewed } = useBookmarks();
  const id = getArticleId(article);
  const source = article.source?.name || getHostname(article.url) || "Unknown source";

  const handleClick = () => addRecentlyViewed(article);

  const handleShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const shareData = buildShareData(article);
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast.success("Link copied to clipboard");
      }
    } catch {
      // user cancelled share sheet — no-op
    }
  };

  const isHorizontal = layout === "horizontal";

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
      className={`card-surface group overflow-hidden ${isHorizontal ? "flex gap-4" : "flex flex-col"}`}
    >
      <Link
        to={`/article/${encodeURIComponent(id)}`}
        state={{ article }}
        onClick={handleClick}
        className={`relative block shrink-0 overflow-hidden ${isHorizontal ? "h-32 w-32 sm:h-36 sm:w-48" : "h-44 w-full"}`}
      >
        <img
          src={article.image || article.urlToImage || "/placeholder.jpg"}
          alt={article.title || "Article image"}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = "/placeholder.jpg";
          }}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute right-2 top-2 flex gap-1.5">
          <BookmarkButton article={article} size="sm" />
          <button
            type="button"
            onClick={handleShare}
            aria-label="Share article"
            className="btn-focus rounded-full bg-white/90 p-2 text-gray-600 hover:text-primary-600 dark:bg-black/40 dark:text-gray-200"
          >
            <FiShare2 size={16} aria-hidden="true" />
          </button>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-primary-600 dark:text-primary-400">
          <span>{source}</span>
          <span aria-hidden="true">•</span>
          <span className="flex items-center gap-1 text-gray-400 dark:text-gray-500">
            <FiClock size={12} aria-hidden="true" />
            {formatRelativeTime(article.publishedAt)}
          </span>
        </div>

        <Link
          to={`/article/${encodeURIComponent(id)}`}
          state={{ article }}
          onClick={handleClick}
          className="line-clamp-2 text-base font-bold leading-snug text-gray-900 hover:text-primary-600 dark:text-gray-100 dark:hover:text-primary-400"
        >
          {article.title}
        </Link>

        {!isHorizontal && article.description && (
          <p className="line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
            {truncateText(article.description, 130)}
          </p>
        )}
      </div>
    </motion.article>
  );
}

export default memo(NewsCard);
