import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

vi.mock("../services/newsApi.js", () => ({
  searchNews: vi.fn(),
}));

import { searchNews } from "../services/newsApi.js";
import { NewsProvider } from "../context/NewsContext.jsx";
import { BookmarkProvider } from "../context/BookmarkContext.jsx";
import Search from "./Search.jsx";

function renderSearch() {
  return render(
    <MemoryRouter>
      <NewsProvider>
        <BookmarkProvider>
          <Search />
        </BookmarkProvider>
      </NewsProvider>
    </MemoryRouter>
  );
}

const article = {
  title: "Markets rally on rate news",
  url: "https://example.com/markets",
  description: "A story about markets.",
  publishedAt: "2026-07-01T00:00:00Z",
  source: { name: "Example News" },
};

describe("Search page", () => {
  beforeEach(() => {
    window.localStorage.clear();
    searchNews.mockReset();
  });

  it("does not search on an empty query", () => {
    renderSearch();
    expect(searchNews).not.toHaveBeenCalled();
  });

  it("searches (debounced) once the user types a query", async () => {
    searchNews.mockResolvedValue({ data: { articles: [article] } });
    const user = userEvent.setup();
    renderSearch();

    await user.type(screen.getByLabelText(/search news/i), "markets");

    await waitFor(() => expect(searchNews).toHaveBeenCalledWith(
      expect.objectContaining({ query: "markets", page: 1 })
    ));
    expect(await screen.findByText("Markets rally on rate news")).toBeInTheDocument();
  });

  it("shows the query in the results heading", async () => {
    searchNews.mockResolvedValue({ data: { articles: [] } });
    const user = userEvent.setup();
    renderSearch();

    await user.type(screen.getByLabelText(/search news/i), "elections");
    expect(await screen.findByText(/results for.*elections/i)).toBeInTheDocument();
  });

  it("adds a committed search term to the recent-searches list", async () => {
    searchNews.mockResolvedValue({ data: { articles: [] } });
    const user = userEvent.setup();
    renderSearch();

    await user.type(screen.getByLabelText(/search news/i), "climate");
    await waitFor(() => expect(searchNews).toHaveBeenCalled());
    await user.clear(screen.getByLabelText(/search news/i));

    expect(await screen.findByRole("heading", { name: /recent searches/i })).toBeInTheDocument();
    expect(screen.getByText("climate")).toBeInTheDocument();
  });

  it("shows an error state when the search fails", async () => {
    searchNews.mockRejectedValue({ type: "API_ERROR", message: "Search failed" });
    const user = userEvent.setup();
    renderSearch();

    await user.type(screen.getByLabelText(/search news/i), "oops");
    expect(await screen.findByText("Search failed")).toBeInTheDocument();
  });

  it("clicking a recent search term re-populates the search box", async () => {
    window.localStorage.setItem("na_search_history", JSON.stringify(["ai regulation"]));
    searchNews.mockResolvedValue({ data: { articles: [] } });
    const user = userEvent.setup();
    renderSearch();

    await user.click(screen.getByRole("button", { name: "ai regulation" }));
    expect(screen.getByLabelText(/search news/i)).toHaveValue("ai regulation");
  });

  it("clears search history via the Clear all button", async () => {
    window.localStorage.setItem("na_search_history", JSON.stringify(["old term"]));
    const user = userEvent.setup();
    renderSearch();

    expect(screen.getByText("old term")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /clear all/i }));
    expect(screen.queryByText("old term")).not.toBeInTheDocument();
  });
});
