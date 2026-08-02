import { createContext, useCallback, useEffect, useMemo, useReducer } from "react";
import { getItem, setItem } from "../utils/storage.js";
import { STORAGE_KEYS, MAX_SEARCH_HISTORY } from "../utils/constants.js";

export const NewsContext = createContext(null);

/**
 * Compute the initial country/language/search-history state fresh at
 * Provider mount time -- see the matching comment in BookmarkContext.jsx
 * for why this can't be a plain module-level constant.
 */
function getInitialState() {
  return {
    country: getItem(STORAGE_KEYS.COUNTRY, "us"),
    language: getItem(STORAGE_KEYS.LANGUAGE, "en"),
    searchHistory: getItem(STORAGE_KEYS.SEARCH_HISTORY, []),
  };
}

/**
 * newsReducer
 * Handles global news preferences: selected country, selected language,
 * and the user's recent search history.
 */
function newsReducer(state, action) {
  switch (action.type) {
    case "SET_COUNTRY":
      return { ...state, country: action.payload };

    case "SET_LANGUAGE":
      return { ...state, language: action.payload };

    case "ADD_SEARCH_TERM": {
      const term = action.payload.trim();
      if (!term) return state;
      const withoutDuplicate = state.searchHistory.filter(
        (item) => item.toLowerCase() !== term.toLowerCase()
      );
      const searchHistory = [term, ...withoutDuplicate].slice(0, MAX_SEARCH_HISTORY);
      return { ...state, searchHistory };
    }

    case "REMOVE_SEARCH_TERM":
      return {
        ...state,
        searchHistory: state.searchHistory.filter((item) => item !== action.payload),
      };

    case "CLEAR_SEARCH_HISTORY":
      return { ...state, searchHistory: [] };

    default:
      return state;
  }
}

/**
 * NewsProvider
 * Provides country/language preferences and search history to the whole app,
 * persisting each slice to localStorage as it changes.
 */
export function NewsProvider({ children }) {
  const [state, dispatch] = useReducer(newsReducer, undefined, getInitialState);

  useEffect(() => {
    setItem(STORAGE_KEYS.COUNTRY, state.country);
  }, [state.country]);

  useEffect(() => {
    setItem(STORAGE_KEYS.LANGUAGE, state.language);
  }, [state.language]);

  useEffect(() => {
    setItem(STORAGE_KEYS.SEARCH_HISTORY, state.searchHistory);
  }, [state.searchHistory]);

  const setCountry = useCallback((country) => dispatch({ type: "SET_COUNTRY", payload: country }), []);
  const setLanguage = useCallback((language) => dispatch({ type: "SET_LANGUAGE", payload: language }), []);
  const addSearchTerm = useCallback(
    (term) => dispatch({ type: "ADD_SEARCH_TERM", payload: term }),
    []
  );
  const removeSearchTerm = useCallback(
    (term) => dispatch({ type: "REMOVE_SEARCH_TERM", payload: term }),
    []
  );
  const clearSearchHistory = useCallback(() => dispatch({ type: "CLEAR_SEARCH_HISTORY" }), []);

  const value = useMemo(
    () => ({
      country: state.country,
      language: state.language,
      searchHistory: state.searchHistory,
      setCountry,
      setLanguage,
      addSearchTerm,
      removeSearchTerm,
      clearSearchHistory,
    }),
    [state, setCountry, setLanguage, addSearchTerm, removeSearchTerm, clearSearchHistory]
  );

  return <NewsContext.Provider value={value}>{children}</NewsContext.Provider>;
}
