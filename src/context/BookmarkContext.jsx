import { createContext, useCallback, useEffect, useMemo, useReducer } from "react";
import toast from "react-hot-toast";
import { getItem, setItem } from "../utils/storage.js";
import { STORAGE_KEYS, MAX_RECENTLY_VIEWED } from "../utils/constants.js";
import { getArticleId } from "../utils/helpers.js";

export const BookmarkContext = createContext(null);

/**
 * Compute the initial bookmarks/recently-viewed state fresh at Provider
 * mount time (via useReducer's lazy-init third argument), rather than once
 * at module import time. A plain module-level constant would freeze
 * whatever localStorage held at the moment this file was first imported —
 * fine for the app's real single-mount lifecycle, but wrong for multiple
 * Provider instances (tests, hot reload) and it's what made this state
 * effectively untestable without this fix.
 */
function getInitialState() {
  return {
    bookmarks: getItem(STORAGE_KEYS.BOOKMARKS, []),
    recentlyViewed: getItem(STORAGE_KEYS.RECENTLY_VIEWED, []),
  };
}

/**
 * bookmarkReducer
 * Handles bookmarked articles and the recently-viewed article trail.
 */
function bookmarkReducer(state, action) {
  switch (action.type) {
    case "ADD_BOOKMARK": {
      const id = getArticleId(action.payload);
      const exists = state.bookmarks.some((item) => getArticleId(item) === id);
      if (exists) return state;
      return { ...state, bookmarks: [action.payload, ...state.bookmarks] };
    }

    case "REMOVE_BOOKMARK":
      return {
        ...state,
        bookmarks: state.bookmarks.filter((item) => getArticleId(item) !== action.payload),
      };

    case "CLEAR_BOOKMARKS":
      return { ...state, bookmarks: [] };

    case "ADD_RECENTLY_VIEWED": {
      const id = getArticleId(action.payload);
      const withoutDuplicate = state.recentlyViewed.filter(
        (item) => getArticleId(item) !== id
      );
      const recentlyViewed = [action.payload, ...withoutDuplicate].slice(
        0,
        MAX_RECENTLY_VIEWED
      );
      return { ...state, recentlyViewed };
    }

    case "CLEAR_RECENTLY_VIEWED":
      return { ...state, recentlyViewed: [] };

    default:
      return state;
  }
}

/**
 * BookmarkProvider
 * Provides bookmark and recently-viewed state/actions app-wide, persisting
 * both slices to localStorage. Bookmark mutations surface toast feedback.
 */
export function BookmarkProvider({ children }) {
  const [state, dispatch] = useReducer(bookmarkReducer, undefined, getInitialState);

  useEffect(() => {
    setItem(STORAGE_KEYS.BOOKMARKS, state.bookmarks);
  }, [state.bookmarks]);

  useEffect(() => {
    setItem(STORAGE_KEYS.RECENTLY_VIEWED, state.recentlyViewed);
  }, [state.recentlyViewed]);

  const isBookmarked = useCallback(
    (article) => state.bookmarks.some((item) => getArticleId(item) === getArticleId(article)),
    [state.bookmarks]
  );

  const addBookmark = useCallback((article) => {
    dispatch({ type: "ADD_BOOKMARK", payload: article });
    toast.success("Saved to bookmarks");
  }, []);

  const removeBookmark = useCallback((articleId) => {
    dispatch({ type: "REMOVE_BOOKMARK", payload: articleId });
    toast("Removed from bookmarks", { icon: "🗑️" });
  }, []);

  const toggleBookmark = useCallback(
    (article) => {
      const id = getArticleId(article);
      if (isBookmarked(article)) {
        removeBookmark(id);
      } else {
        addBookmark(article);
      }
    },
    [isBookmarked, addBookmark, removeBookmark]
  );

  const clearBookmarks = useCallback(() => {
    dispatch({ type: "CLEAR_BOOKMARKS" });
    toast("All bookmarks cleared", { icon: "🧹" });
  }, []);

  const addRecentlyViewed = useCallback((article) => {
    dispatch({ type: "ADD_RECENTLY_VIEWED", payload: article });
  }, []);

  const clearRecentlyViewed = useCallback(() => {
    dispatch({ type: "CLEAR_RECENTLY_VIEWED" });
  }, []);

  const value = useMemo(
    () => ({
      bookmarks: state.bookmarks,
      recentlyViewed: state.recentlyViewed,
      isBookmarked,
      addBookmark,
      removeBookmark,
      toggleBookmark,
      clearBookmarks,
      addRecentlyViewed,
      clearRecentlyViewed,
    }),
    [
      state,
      isBookmarked,
      addBookmark,
      removeBookmark,
      toggleBookmark,
      clearBookmarks,
      addRecentlyViewed,
      clearRecentlyViewed,
    ]
  );

  return <BookmarkContext.Provider value={value}>{children}</BookmarkContext.Provider>;
}
