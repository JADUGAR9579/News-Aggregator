import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { NewsProvider } from "../context/NewsContext.jsx";
import { useSearch } from "./useSearch.js";
import { MAX_SEARCH_HISTORY, DEBOUNCE_DELAY_MS } from "../utils/constants.js";

function wrapper({ children }) {
  return <NewsProvider>{children}</NewsProvider>;
}

describe("useSearch", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("throws when used outside a NewsProvider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useSearch())).toThrow(
      "useSearch must be used within a NewsProvider"
    );
    spy.mockRestore();
  });

  it("starts with an empty query by default, or the given initial value", () => {
    const { result: empty } = renderHook(() => useSearch(), { wrapper });
    expect(empty.current.query).toBe("");

    const { result: seeded } = renderHook(() => useSearch("elections"), { wrapper });
    expect(seeded.current.query).toBe("elections");
  });

  it("debounces query changes into debouncedQuery", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useSearch(""), { wrapper });

    act(() => result.current.setQuery("climate"));
    // Not yet debounced.
    expect(result.current.debouncedQuery).toBe("");

    act(() => vi.advanceTimersByTime(DEBOUNCE_DELAY_MS));
    expect(result.current.debouncedQuery).toBe("climate");

    vi.useRealTimers();
  });

  it("clearQuery resets both query and debouncedQuery immediately", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useSearch("space"), { wrapper });
    act(() => vi.advanceTimersByTime(DEBOUNCE_DELAY_MS));
    expect(result.current.debouncedQuery).toBe("space");

    act(() => result.current.clearQuery());
    expect(result.current.query).toBe("");
    expect(result.current.debouncedQuery).toBe("");
    vi.useRealTimers();
  });

  it("commitSearch adds a trimmed term to search history, most-recent first", () => {
    const { result } = renderHook(() => useSearch(), { wrapper });

    act(() => result.current.commitSearch("  ai regulation  "));
    expect(result.current.searchHistory).toEqual(["ai regulation"]);

    act(() => result.current.commitSearch("markets"));
    expect(result.current.searchHistory).toEqual(["markets", "ai regulation"]);
  });

  it("commitSearch ignores blank/whitespace-only terms", () => {
    const { result } = renderHook(() => useSearch(), { wrapper });
    act(() => result.current.commitSearch("   "));
    expect(result.current.searchHistory).toEqual([]);
  });

  it("commitSearch de-duplicates case-insensitively, moving the term to the front", () => {
    const { result } = renderHook(() => useSearch(), { wrapper });
    act(() => result.current.commitSearch("Formula 1"));
    act(() => result.current.commitSearch("cricket"));
    act(() => result.current.commitSearch("formula 1"));

    expect(result.current.searchHistory).toEqual(["formula 1", "cricket"]);
  });

  it("caps search history at MAX_SEARCH_HISTORY entries", () => {
    const { result } = renderHook(() => useSearch(), { wrapper });
    for (let i = 0; i < MAX_SEARCH_HISTORY + 5; i += 1) {
      act(() => result.current.commitSearch(`term-${i}`));
    }
    expect(result.current.searchHistory).toHaveLength(MAX_SEARCH_HISTORY);
    // Most recent term should be first.
    expect(result.current.searchHistory[0]).toBe(`term-${MAX_SEARCH_HISTORY + 4}`);
  });

  it("removeSearchTerm removes a single entry", () => {
    const { result } = renderHook(() => useSearch(), { wrapper });
    act(() => result.current.commitSearch("alpha"));
    act(() => result.current.commitSearch("beta"));
    act(() => result.current.removeSearchTerm("alpha"));
    expect(result.current.searchHistory).toEqual(["beta"]);
  });

  it("clearSearchHistory empties the list", () => {
    const { result } = renderHook(() => useSearch(), { wrapper });
    act(() => result.current.commitSearch("alpha"));
    act(() => result.current.clearSearchHistory());
    expect(result.current.searchHistory).toEqual([]);
  });

  it("persists search history to localStorage", () => {
    const { result } = renderHook(() => useSearch(), { wrapper });
    act(() => result.current.commitSearch("persisted term"));
    expect(JSON.parse(window.localStorage.getItem("na_search_history"))).toEqual([
      "persisted term",
    ]);
  });
});
