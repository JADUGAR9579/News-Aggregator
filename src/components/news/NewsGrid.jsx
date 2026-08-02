import { memo, useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";

import NewsCard from "./NewsCard.jsx";
import Skeleton from "../common/Skeleton.jsx";
import ErrorState from "../common/Error.jsx";
import { getArticleId } from "../../utils/helpers.js";

/**
 * NewsGrid
 * Responsive article grid with infinite scroll: a sentinel div at the bottom
 * is observed via IntersectionObserver, calling `onLoadMore` when it enters
 * the viewport (only while `hasMore` is true and not already loading).
 *
 * @param {object} props
 * @param {object[]} props.articles
 * @param {boolean} [props.loading] - true while fetching (initial or next page)
 * @param {boolean} [props.isInitialLoad] - true only for the very first fetch
 * @param {boolean} [props.hasMore]
 * @param {() => void} [props.onLoadMore]
 */
function NewsGrid({ articles = [], loading = false, isInitialLoad = false, hasMore = false, onLoadMore }) {
  const sentinelRef = useRef(null);
  const loadingRef = useRef(loading);
  const onLoadMoreRef = useRef(onLoadMore);

  // Keep refs current without making the observer effect depend on values
  // that change every load cycle (loading flips true/false on every page
  // fetch) — recreating an IntersectionObserver that often is wasted work
  // and briefly risks missing an intersection during the teardown/rebuild.
  useEffect(() => {
    loadingRef.current = loading;
    onLoadMoreRef.current = onLoadMore;
  }, [loading, onLoadMore]);

  useEffect(() => {
    if (!hasMore) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingRef.current) {
          onLoadMoreRef.current?.();
        }
      },
      { rootMargin: "300px" }
    );

    const node = sentinelRef.current;
    if (node) observer.observe(node);
    return () => {
      if (node) observer.unobserve(node);
    };
  }, [hasMore]);

  if (isInitialLoad) {
    return <Skeleton variant="card" count={6} />;
  }

  if (!loading && articles.length === 0) {
    return <ErrorState type="no-results" />;
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence initial={false}>
          {articles.map((article) => (
            <NewsCard key={getArticleId(article)} article={article} />
          ))}
        </AnimatePresence>
      </div>

      {loading && !isInitialLoad && (
        <div className="mt-6">
          <Skeleton variant="card" count={3} />
        </div>
      )}

      {hasMore && <div ref={sentinelRef} aria-hidden="true" className="h-1 w-full" />}
    </div>
  );
}

export default memo(NewsGrid);
