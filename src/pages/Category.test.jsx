import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";

vi.mock("../services/newsApi.js", () => ({
  getNewsByCategory: vi.fn(),
}));

import { getNewsByCategory } from "../services/newsApi.js";
import { NewsProvider } from "../context/NewsContext.jsx";
import { BookmarkProvider } from "../context/BookmarkContext.jsx";
import Category from "./Category.jsx";

function renderCategory(initialPath = "/category/technology") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <NewsProvider>
        <BookmarkProvider>
          <Routes>
            <Route path="/category/:category" element={<Category />} />
          </Routes>
        </BookmarkProvider>
      </NewsProvider>
    </MemoryRouter>
  );
}

const article = {
  title: "Chips get faster",
  url: "https://example.com/chips",
  description: "A story about chips.",
  publishedAt: "2026-07-01T00:00:00Z",
  source: { name: "Example News" },
};

describe("Category page", () => {
  beforeEach(() => {
    window.localStorage.clear();
    getNewsByCategory.mockReset();
  });

  it("shows the category label as the heading, derived from the route param", async () => {
    getNewsByCategory.mockResolvedValue({ data: { articles: [] } });
    renderCategory("/category/technology");
    expect(await screen.findByRole("heading", { name: "Technology" })).toBeInTheDocument();
  });

  it("falls back to the raw slug as the heading for an unknown category", async () => {
    getNewsByCategory.mockResolvedValue({ data: { articles: [] } });
    renderCategory("/category/made-up-slug");
    expect(await screen.findByRole("heading", { name: "made-up-slug" })).toBeInTheDocument();
  });

  it("calls getNewsByCategory with the category from the route param", async () => {
    getNewsByCategory.mockResolvedValue({ data: { articles: [] } });
    renderCategory("/category/sports");
    await waitFor(() =>
      expect(getNewsByCategory).toHaveBeenCalledWith(
        expect.objectContaining({ category: "sports", page: 1 })
      )
    );
  });

  it("renders fetched articles", async () => {
    getNewsByCategory.mockResolvedValue({ data: { articles: [article] } });
    renderCategory();
    expect(await screen.findByText("Chips get faster")).toBeInTheDocument();
  });

  it("shows a no-results state when the category has no articles", async () => {
    getNewsByCategory.mockResolvedValue({ data: { articles: [] } });
    renderCategory();
    expect(await screen.findByText(/no results found/i)).toBeInTheDocument();
  });

  it("shows an error state with retry when the fetch fails", async () => {
    getNewsByCategory.mockRejectedValue({ type: "SERVER_ERROR", message: "Server is down" });
    renderCategory();
    expect(await screen.findByText("Server is down")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("re-fetches when navigating to a different category via the category links", async () => {
    getNewsByCategory.mockResolvedValue({ data: { articles: [] } });
    const user = userEvent.setup();
    renderCategory("/category/technology");

    await waitFor(() => expect(getNewsByCategory).toHaveBeenCalledTimes(1));
    expect(getNewsByCategory.mock.calls[0][0]).toMatchObject({ category: "technology" });

    await user.click(screen.getByRole("link", { name: /business/i }));

    await waitFor(() => expect(getNewsByCategory).toHaveBeenCalledTimes(2));
    expect(getNewsByCategory.mock.calls[1][0]).toMatchObject({ category: "business" });
  });
});
