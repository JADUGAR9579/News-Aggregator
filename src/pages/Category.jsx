import { useCallback, useContext, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";

import { NewsContext } from "../context/NewsContext.jsx";
import { getNewsByCategory } from "../services/newsApi.js";
import { PAGE_SIZE, CATEGORIES } from "../utils/constants.js";
import { mergeUniqueArticles } from "../utils/helpers.js";

import NewsGrid from "../components/news/NewsGrid.jsx";
import CategoryCard from "../components/news/CategoryCard.jsx";
import ErrorState from "../components/common/Error.jsx";

/**
 * Category
 * Shows headlines filtered by the :category route param, with the same
 * infinite-scroll pagination pattern as Home.
 */
function Category() {
  const { category } = useParams();
  const { country, language } = useContext(NewsContext);

  const [articles, setArticles] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInitial = useCallback(
    (signal) => {
      setIsInitialLoad(true);
      setLoading(true);
      setError(null);
      setPage(1);

      return getNewsByCategory({ category, country, lang: language, page: 1, signal })
        .then((res) => {
          const fetched = (res.data.articles || []).map((a) => ({ ...a, _category: category }));
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
    [category, country, language]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchInitial(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, country, language]);

  const handleLoadMore = useCallback(async () => {
    const nextPage = page + 1;
    setLoading(true);
    try {
      const res = await getNewsByCategory({ category, country, lang: language, page: nextPage });
      const fetched = (res.data.articles || []).map((a) => ({ ...a, _category: category }));
      setArticles((prev) => mergeUniqueArticles(prev, fetched));
      setHasMore(fetched.length >= PAGE_SIZE);
      setPage(nextPage);
    } catch (err) {
      if (err?.type !== "CANCELLED") setError(err);
    } finally {
      setLoading(false);
    }
  }, [category, country, language, page]);

  const categoryMeta = CATEGORIES.find((c) => c.id === category);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="container-app space-y-8 py-8"
    >
      <div>
        <nav aria-label="Breadcrumb" className="mb-2 text-sm text-gray-500 dark:text-gray-400">
          <Link to="/" className="hover:text-primary-600">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 dark:text-gray-100">
            {categoryMeta?.label || category}
          </span>
        </nav>
        <h1 className="text-3xl">{categoryMeta?.label || category}</h1>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <CategoryCard key={c.id} category={c} />
        ))}
      </div>

      {error && articles.length === 0 ? (
        <ErrorState
          type={error.type === "NETWORK_ERROR" || error.type === "TIMEOUT" ? "network" : "generic"}
          message={error.message}
          onRetry={() => fetchInitial()}
        />
      ) : (
        <NewsGrid
          articles={articles}
          loading={loading}
          isInitialLoad={isInitialLoad}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
        />
      )}
    </motion.div>
  );
}

export default Category;
