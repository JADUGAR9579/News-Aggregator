import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { BookmarkProvider } from "../context/BookmarkContext.jsx";
import { useBookmarks } from "./useBookmarks.js";
import { MAX_RECENTLY_VIEWED } from "../utils/constants.js";

// Toast calls work headless in react-hot-toast (no <Toaster/> needed), but
// mocking keeps these tests focused on the reducer/hook behavior only.
vi.mock("react-hot-toast", () => ({
  default: Object.assign(vi.fn(), { success: vi.fn() }),
}));

function wrapper({ children }) {
  return <BookmarkProvider>{children}</BookmarkProvider>;
}

const articleA = { url: "https://example.com/a", title: "Article A" };
const articleB = { url: "https://example.com/b", title: "Article B" };

describe("useBookmarks", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("throws when used outside a BookmarkProvider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useBookmarks())).toThrow(
      "useBookmarks must be used within a BookmarkProvider"
    );
    spy.mockRestore();
  });

  it("starts with no bookmarks and no recently viewed", () => {
    const { result } = renderHook(() => useBookmarks(), { wrapper });
    expect(result.current.bookmarks).toEqual([]);
    expect(result.current.recentlyViewed).toEqual([]);
  });

  it("addBookmark adds an article, most-recent first", () => {
    const { result } = renderHook(() => useBookmarks(), { wrapper });
    act(() => result.current.addBookmark(articleA));
    act(() => result.current.addBookmark(articleB));
    expect(result.current.bookmarks).toEqual([articleB, articleA]);
  });

  it("addBookmark does not duplicate an already-bookmarked article", () => {
    const { result } = renderHook(() => useBookmarks(), { wrapper });
    act(() => result.current.addBookmark(articleA));
    act(() => result.current.addBookmark(articleA));
    expect(result.current.bookmarks).toHaveLength(1);
  });

  it("isBookmarked reflects current state", () => {
    const { result } = renderHook(() => useBookmarks(), { wrapper });
    expect(result.current.isBookmarked(articleA)).toBe(false);
    act(() => result.current.addBookmark(articleA));
    expect(result.current.isBookmarked(articleA)).toBe(true);
  });

  it("removeBookmark removes by article id (url)", () => {
    const { result } = renderHook(() => useBookmarks(), { wrapper });
    act(() => result.current.addBookmark(articleA));
    act(() => result.current.removeBookmark(articleA.url));
    expect(result.current.bookmarks).toEqual([]);
  });

  it("toggleBookmark adds when absent and removes when present", () => {
    const { result } = renderHook(() => useBookmarks(), { wrapper });
    act(() => result.current.toggleBookmark(articleA));
    expect(result.current.isBookmarked(articleA)).toBe(true);

    act(() => result.current.toggleBookmark(articleA));
    expect(result.current.isBookmarked(articleA)).toBe(false);
  });

  it("clearBookmarks empties the bookmark list", () => {
    const { result } = renderHook(() => useBookmarks(), { wrapper });
    act(() => result.current.addBookmark(articleA));
    act(() => result.current.addBookmark(articleB));
    act(() => result.current.clearBookmarks());
    expect(result.current.bookmarks).toEqual([]);
  });

  it("addRecentlyViewed adds to the front and de-duplicates by id", () => {
    const { result } = renderHook(() => useBookmarks(), { wrapper });
    act(() => result.current.addRecentlyViewed(articleA));
    act(() => result.current.addRecentlyViewed(articleB));
    act(() => result.current.addRecentlyViewed(articleA)); // re-view A

    expect(result.current.recentlyViewed).toEqual([articleA, articleB]);
  });

  it("caps recently viewed at MAX_RECENTLY_VIEWED entries", () => {
    const { result } = renderHook(() => useBookmarks(), { wrapper });
    for (let i = 0; i < MAX_RECENTLY_VIEWED + 5; i += 1) {
      act(() => result.current.addRecentlyViewed({ url: `https://example.com/${i}` }));
    }
    expect(result.current.recentlyViewed).toHaveLength(MAX_RECENTLY_VIEWED);
  });

  it("clearRecentlyViewed empties the recently-viewed list", () => {
    const { result } = renderHook(() => useBookmarks(), { wrapper });
    act(() => result.current.addRecentlyViewed(articleA));
    act(() => result.current.clearRecentlyViewed());
    expect(result.current.recentlyViewed).toEqual([]);
  });

  it("persists bookmarks to localStorage", () => {
    const { result } = renderHook(() => useBookmarks(), { wrapper });
    act(() => result.current.addBookmark(articleA));
    expect(JSON.parse(window.localStorage.getItem("na_bookmarks"))).toEqual([articleA]);
  });
});
