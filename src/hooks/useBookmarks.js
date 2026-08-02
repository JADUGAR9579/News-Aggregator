import { useContext } from "react";
import { BookmarkContext } from "../context/BookmarkContext.jsx";

/**
 * useBookmarks
 * Access bookmarks, recently-viewed articles, and their mutator functions.
 * Must be used within a <BookmarkProvider>.
 */
export function useBookmarks() {
  const context = useContext(BookmarkContext);
  if (!context) {
    throw new Error("useBookmarks must be used within a BookmarkProvider");
  }
  return context;
}
