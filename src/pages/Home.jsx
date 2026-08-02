import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

import { NewsContext } from "../context/NewsContext.jsx";
import { getTopNews, getTrendingNews, getNewsByCategory } from "../services/newsApi.js";
import { PAGE_SIZE, CATEGORIES } from "../utils/constants.js";
import { mergeUniqueArticles } from "../utils/helpers.js";
import { useBookmarks } from "../hooks/useBookmarks.js";

import FeaturedNews from "../components/news/FeaturedNews.jsx";
import TrendingNews from "../components/news/TrendingNews.jsx";
import CategoryCard from "../components/news/CategoryCard.jsx";
import NewsCard from "../components/news/NewsCard.jsx";
import NewsGrid from "../components/news/NewsGrid.jsx";
import Skeleton from "../components/common/Skeleton.jsx";
import ErrorState from "../components/common/Error.jsx";
import WeatherWidget from "../components/common/WeatherWidget.jsx";

/**
 * Home
 * Landing page: featured lead story, trending rail, category shortcuts,
 * and an infinite-scrolling grid of the latest headlines.
 *
 * Pagination is owned here (not inside NewsGrid, which is a pure/controlled
 * presentational component) so Category and Search can follow the same
 * pattern independently.
 */
function Home() {
  const { country, language } = useContext(NewsContext);
  const { bookmarks, recentlyViewed } = useBookmarks();

  const [articles, setArticles] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [trendingArticles, setTrendingArticles] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(true);

  const [forYouArticles, setForYouArticles] = useState([]);
  const [forYouLoading, setForYouLoading] = useState(false);

  /**
   * Personalized-feed heuristic: rank categories by how often they show up
   * across bookmarks + recently viewed (tagged with `_category` when
   * fetched from the Category page), and pick the most-visited one.
   * Simple and honest — no ML, just a frequency count — but it's a real
   * signal derived from actual user behavior rather than a static default.
   */
  const preferredCategory = useMemo(() => {
    const counts = {};
    [...bookmarks, ...recentlyViewed].forEach((a) => {
      if (a._category) counts[a._category] = (counts[a._category] || 0) + 1;
    });
    const [topCategory] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] || [];
    return topCategory;
  }, [bookmarks, recentlyViewed]);

  /**
   * Fetch page 1 fresh. Used both on mount/country/language change and as
   * the retry handler when the initial load fails.
   */
  const fetchInitial = useCallback(
    (signal) => {
      setIsInitialLoad(true);
      setLoading(true);
      setError(null);
      setPage(1);

      return getTopNews({ country, lang: language, page: 1, signal })
        .then((res) => {
          const fetched = res.data.articles || [];
          setArticles(fetched);
          setHasMore(fetched.length >= PAGE_SIZE);
        })
        .catch((err) => {
          if (err?.type !== "CANCELLED") setError(err);
        })
        .finally(() => {
          setIsInitialLoad(false);
          setLoading(false);
        });
    },
    [country, language]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchInitial(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, language]);

  // Trending rail loads independently of pagination.
  useEffect(() => {
    const controller = new AbortController();
    setTrendingLoading(true);

    getTrendingNews({ country, lang: language, signal: controller.signal })
      .then((res) => setTrendingArticles(res.data.articles || []))
      .catch(() => {})
      .finally(() => setTrendingLoading(false));

    return () => controller.abort();
  }, [country, language]);

  // Personalized "For You" rail — only fetched once we actually have a
  // preferred category signal (no signal yet = don't show a section that
  // would just duplicate "Latest News").
  useEffect(() => {
    if (!preferredCategory) {
      setForYouArticles([]);
      return undefined;
    }

    const controller = new AbortController();
    setForYouLoading(true);

    getNewsByCategory({ category: preferredCategory, country, lang: language, signal: controller.signal })
      .then((res) => setForYouArticles((res.data.articles || []).slice(0, 6)))
      .catch(() => {})
      .finally(() => setForYouLoading(false));

    return () => controller.abort();
  }, [preferredCategory, country, language]);

  const handleLoadMore = useCallback(async () => {
    const nextPage = page + 1;
    setLoading(true);
    try {
      const res = await getTopNews({ country, lang: language, page: nextPage });
      const fetched = res.data.articles || [];
      setArticles((prev) => mergeUniqueArticles(prev, fetched));
      setHasMore(fetched.length >= PAGE_SIZE);
      setPage(nextPage);
    } catch (err) {
      if (err?.type !== "CANCELLED") setError(err);
    } finally {
      setLoading(false);
    }
  }, [country, language, page]);

  const featured = articles[0];
  const rest = useMemo(() => articles.slice(1), [articles]);

  if (error && articles.length === 0) {
    const isNetworkIssue = error.type === "NETWORK_ERROR" || error.type === "TIMEOUT";
    return (
      <div className="container-app py-16">
        <ErrorState
          type={isNetworkIssue ? "network" : "generic"}
          message={error.message}
          onRetry={() => fetchInitial()}
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="container-app space-y-12 py-8"
    >
      <section aria-label="Browse by category" className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-1 flex-wrap gap-2">
          {CATEGORIES.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
        <WeatherWidget />
      </section>

      <section aria-label="Featured story">
        {isInitialLoad ? <Skeleton variant="featured" /> : <FeaturedNews article={featured} />}
      </section>

      <section aria-label="Trending news">
        <h2 className="mb-4 text-2xl">Trending Now</h2>
        {trendingLoading ? (
          <div className="flex gap-4 overflow-x-hidden" aria-hidden="true">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-64 shrink-0 space-y-2">
                <div className="skeleton h-36 w-full" />
                <div className="skeleton h-3 w-3/4" />
                <div className="skeleton h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <TrendingNews articles={trendingArticles} />
        )}
      </section>

      {(forYouLoading || forYouArticles.length > 0) && (
        <section aria-label="Recommended for you">
          <h2 className="mb-4 text-2xl">For You</h2>
          {forYouLoading ? (
            <Skeleton variant="card" count={3} />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {forYouArticles.map((a) => (
                <NewsCard key={a.url || a.title} article={a} />
              ))}
            </div>
          )}
        </section>
      )}

      <section aria-label="Latest news">
        <h2 className="mb-4 text-2xl">Latest News</h2>
        <NewsGrid
          articles={rest}
          loading={loading}
          isInitialLoad={isInitialLoad}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
        />
      </section>
    </motion.div>
  );
}

export default Home;
