import { memo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiTrendingUp } from "react-icons/fi";

import { useBookmarks } from "../../hooks/useBookmarks.js";
import { getArticleId, getHostname } from "../../utils/helpers.js";

/**
 * TrendingNews
 * Horizontally scrollable, numbered list of trending articles.
 *
 * @param {object} props
 * @param {object[]} props.articles
 */
function TrendingNews({ articles = [] }) {
  const { addRecentlyViewed } = useBookmarks();

  if (!articles.length) return null;

  return (
    <section aria-labelledby="trending-heading">
      <div className="mb-4 flex items-center gap-2">
        <FiTrendingUp className="text-primary-600" aria-hidden="true" />
        <h2 id="trending-heading" className="text-lg font-bold text-gray-900 dark:text-gray-100">
          Trending Now
        </h2>
      </div>

      <div className="flex snap-x gap-4 overflow-x-auto pb-3">
        {articles.slice(0, 10).map((article, index) => {
          const id = getArticleId(article);
          const source = article.source?.name || getHostname(article.url) || "News";
          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              className="card-surface w-64 shrink-0 snap-start"
            >
              <Link
                to={`/article/${encodeURIComponent(id)}`}
                state={{ article }}
                onClick={() => addRecentlyViewed(article)}
                className="flex h-full flex-col gap-2 p-4"
              >
                <span className="text-3xl font-extrabold text-primary-100 dark:text-primary-900">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="line-clamp-3 text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {article.title}
                </p>
                <span className="mt-auto text-xs font-medium text-gray-400">{source}</span>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

export default memo(TrendingNews);
