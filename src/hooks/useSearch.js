import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { NewsContext } from "../context/NewsContext.jsx";
import { debounce } from "../utils/helpers.js";
import { DEBOUNCE_DELAY_MS } from "../utils/constants.js";

/**
 * useSearch
 * Owns the search input's local state, debounces it into a `debouncedQuery`
 * suitable for firing API calls, and exposes the shared search-history
 * actions from NewsContext.
 */
export function useSearch(initialQuery = "") {
  const context = useContext(NewsContext);
  if (!context) {
    throw new Error("useSearch must be used within a NewsProvider");
  }
  const { searchHistory, addSearchTerm, removeSearchTerm, clearSearchHistory } = context;

  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  const debouncedSetter = useRef(debounce((value) => setDebouncedQuery(value), DEBOUNCE_DELAY_MS));

  useEffect(() => {
    debouncedSetter.current(query);
  }, [query]);

  const clearQuery = () => {
    setQuery("");
    setDebouncedQuery("");
  };

  const commitSearch = (term = query) => {
    if (term.trim()) addSearchTerm(term.trim());
  };

  return useMemo(
    () => ({
      query,
      setQuery,
      debouncedQuery,
      clearQuery,
      commitSearch,
      searchHistory,
      removeSearchTerm,
      clearSearchHistory,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query, debouncedQuery, searchHistory]
  );
}
