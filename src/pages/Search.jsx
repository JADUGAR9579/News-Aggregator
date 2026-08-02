import { useCallback, useContext, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiClock, FiX, FiTrash2 } from "react-icons/fi";

import { NewsContext } from "../context/NewsContext.jsx";
import { useSearch } from "../hooks/useSearch.js";
import { searchNews } from "../services/newsApi.js";
import { PAGE_SIZE } from "../utils/constants.js";
import { mergeUniqueArticles } from "../utils/helpers.js";

import SearchBar from "../components/common/SearchBar.jsx";
import NewsGrid from "../components/news/NewsGrid.jsx";
import ErrorState from "../components/common/Error.jsx";
import Button from "../components/common/Button.jsx";

/**
 * Search
 * Debounced article search with a visible search-history panel (recent
 * terms, tap to re-run, remove individually or clear all) and an
 * infinite-scrolling results grid.
 */
function Search() {
  const { language } = useContext(NewsContext);
  const {
    query,
    setQuery,
    debouncedQuery,
    clearQuery,
    commitSearch,
    searchHistory,
    removeSearchTerm,
    clearSearchHistory,
  } = useSearch("");

  const [articles, setArticles] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (!trimmed) {
      setArticles([]);
      setHasMore(false);
      setError(null);
      return undefined;
    }

    const controller = new AbortController();
    setIsInitialLoad(true);
    setLoading(true);
    setError(null);
    setPage(1);

    searchNews({ query: trimmed, lang: language, page: 1, signal: controller.signal })
      .then((res) => {
        const fetched = res.data.articles || [];
        setArticles(fetched);
        setHasMore(fetched.length >= PAGE_SIZE);
        commitSearch(trimmed);
      })
      .catch((err) => {
        if (err?.type !== "CANCELLED") setError(err);
      })
      .finally(() => {
        setIsInitialLoad(false);
        setLoading(false);
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, language]);

  const handleLoadMore = useCallback(async () => {
    const trimmed = debouncedQuery.trim();
    if (!trimmed) return;
    const nextPage = page + 1;
    setLoading(true);
    try {
      const res = await searchNews({ query: trimmed, lang: language, page: nextPage });
      const fetched = res.data.articles || [];
      setArticles((prev) => mergeUniqueArticles(prev, fetched));
      setHasMore(fetched.length >= PAGE_SIZE);
      setPage(nextPage);
    } catch (err) {
      if (err?.type !== "CANCELLED") setError(err);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, language, page]);

  const hasQuery = debouncedQuery.trim().length > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="container-app space-y-8 py-8"
    >
      <div>
        <h1 className="mb-4 text-3xl">Search</h1>
        <SearchBar
          value={query}
          onChange={setQuery}
          onSubmit={commitSearch}
          onClear={clearQuery}
          autoFocus
        />
      </div>

      {!hasQuery && searchHistory.length > 0 && (
        <section aria-label="Recent searches">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Searches</h2>
            <Button variant="ghost" size="sm" onClick={clearSearchHistory}>
              <FiTrash2 aria-hidden="true" />
              Clear all
            </Button>
          </div>
          <ul className="flex flex-wrap gap-2">
            <AnimatePresence>
              {searchHistory.map((term) => (
                <motion.li
                  key={term}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm shadow-card dark:bg-muted-dark"
                >
                  <button
                    type="button"
                    onClick={() => setQuery(term)}
                    className="flex items-center gap-2 btn-focus"
                  >
                    <FiClock aria-hidden="true" className="text-gray-400" />
                    {term}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSearchTerm(term)}
                    aria-label={`Remove "${term}" from search history`}
                    className="text-gray-400 hover:text-red-500 btn-focus"
                  >
                    <FiX aria-hidden="true" />
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </section>
      )}

      {hasQuery &&
        (error && articles.length === 0 ? (
          <ErrorState
            type={error.type === "NETWORK_ERROR" || error.type === "TIMEOUT" ? "network" : "generic"}
            message={error.message}
          />
        ) : (
          <section aria-label="Search results">
            <h2 className="mb-4 text-lg font-semibold text-gray-600 dark:text-gray-300">
              Results for &ldquo;{debouncedQuery}&rdquo;
            </h2>
            <NewsGrid
              articles={articles}
              loading={loading}
              isInitialLoad={isInitialLoad}
              hasMore={hasMore}
              onLoadMore={handleLoadMore}
            />
          </section>
        ))}
    </motion.div>
  );
}

export default Search;
