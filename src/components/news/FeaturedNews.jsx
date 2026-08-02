import { memo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiClock } from "react-icons/fi";

import BookmarkButton from "../bookmark/BookmarkButton.jsx";
import { useBookmarks } from "../../hooks/useBookmarks.js";
import { formatRelativeTime } from "../../utils/formatDate.js";
import { getArticleId, getHostname } from "../../utils/helpers.js";

/**
 * FeaturedNews
 * Large hero card for the single most important story, typically the
 * first item returned by the top-headlines endpoint.
 *
 * @param {object} props
 * @param {object} props.article
 */
function FeaturedNews({ article }) {
  const { addRecentlyViewed } = useBookmarks();

  if (!article) return null;

  const id = getArticleId(article);
  const source = article.source?.name || getHostname(article.url) || "Unknown source";

  return (
    <motion.article
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl shadow-card-hover"
    >
      <Link
        to={`/article/${encodeURIComponent(id)}`}
        state={{ article }}
        onClick={() => addRecentlyViewed(article)}
        className="group block"
      >
        <div className="relative h-72 w-full overflow-hidden sm:h-96">
          <img
            src={article.image || article.urlToImage || "/placeholder.jpg"}
            alt={article.title || "Featured article"}
            loading="eager"
            onError={(e) => {
              e.currentTarget.src = "/placeholder.jpg";
            }}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

          <div className="absolute right-3 top-3">
            <BookmarkButton article={article} />
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
            <span className="mb-3 inline-block rounded-full bg-primary-600 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
              Featured
            </span>
            <h2 className="max-w-3xl text-xl font-extrabold leading-tight text-white sm:text-3xl">
              {article.title}
            </h2>
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-200">
              <span className="font-semibold">{source}</span>
              <span aria-hidden="true">•</span>
              <span className="flex items-center gap-1">
                <FiClock size={14} aria-hidden="true" />
                {formatRelativeTime(article.publishedAt)}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

export default memo(FeaturedNews);
