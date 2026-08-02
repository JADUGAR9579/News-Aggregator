import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { ThemeProvider } from "../context/ThemeContext.jsx";
import { useTheme } from "./useTheme.js";

function wrapper({ children }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

describe("useTheme", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("throws when used outside a ThemeProvider", () => {
    // Suppress the expected React error log for this test only.
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useTheme())).toThrow(
      "useTheme must be used within a ThemeProvider"
    );
    spy.mockRestore();
  });

  it("defaults to light theme when nothing is stored", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.theme).toBe("light");
    expect(result.current.isDark).toBe(false);
  });

  it("reads a previously persisted theme from localStorage", () => {
    window.localStorage.setItem("na_theme", JSON.stringify("dark"));
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.theme).toBe("dark");
  });

  it("toggleTheme flips between light and dark", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe("dark");
    expect(result.current.isDark).toBe(true);

    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe("light");
  });

  it("syncs the `dark` class on <html> and persists to localStorage", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => result.current.toggleTheme());

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(JSON.parse(window.localStorage.getItem("na_theme"))).toBe("dark");
  });
});
