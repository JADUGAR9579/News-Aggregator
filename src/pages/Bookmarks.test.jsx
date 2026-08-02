import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import { BookmarkProvider } from "../context/BookmarkContext.jsx";
import Bookmarks from "./Bookmarks.jsx";

function renderBookmarks() {
  return render(
    <MemoryRouter>
      <BookmarkProvider>
        <Bookmarks />
      </BookmarkProvider>
    </MemoryRouter>
  );
}

const bookmarkedArticle = {
  title: "A bookmarked story",
  url: "https://example.com/bookmarked",
  publishedAt: "2026-07-01T00:00:00Z",
  source: { name: "Example News" },
};

const viewedArticle = {
  title: "A recently viewed story",
  url: "https://example.com/viewed",
  publishedAt: "2026-07-02T00:00:00Z",
  source: { name: "Example News" },
};

describe("Bookmarks page", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows an empty state on the Bookmarks tab when there are no bookmarks", () => {
    renderBookmarks();
    expect(screen.getByText(/articles you bookmark will show up here/i)).toBeInTheDocument();
  });

  it("renders bookmarked articles on the default tab", () => {
    window.localStorage.setItem("na_bookmarks", JSON.stringify([bookmarkedArticle]));
    renderBookmarks();
    expect(screen.getByText("A bookmarked story")).toBeInTheDocument();
  });

  it("shows tab counts matching the number of bookmarks / recently viewed", () => {
    window.localStorage.setItem("na_bookmarks", JSON.stringify([bookmarkedArticle]));
    window.localStorage.setItem(
      "na_recently_viewed",
      JSON.stringify([viewedArticle, bookmarkedArticle])
    );
    renderBookmarks();
    expect(screen.getByRole("tab", { name: /bookmarks 1/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /recently viewed 2/i })).toBeInTheDocument();
  });

  it("switches to the Recently Viewed tab and shows its articles", async () => {
    window.localStorage.setItem("na_recently_viewed", JSON.stringify([viewedArticle]));
    const user = userEvent.setup();
    renderBookmarks();

    expect(screen.queryByText("A recently viewed story")).not.toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: /recently viewed/i }));
    expect(await screen.findByText("A recently viewed story")).toBeInTheDocument();
  });

  it("marks the active tab with aria-selected", async () => {
    const user = userEvent.setup();
    renderBookmarks();

    expect(screen.getByRole("tab", { name: /bookmarks/i })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    await user.click(screen.getByRole("tab", { name: /recently viewed/i }));
    expect(screen.getByRole("tab", { name: /recently viewed/i })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(screen.getByRole("tab", { name: /bookmarks/i })).toHaveAttribute(
      "aria-selected",
      "false"
    );
  });

  it("does not show a clear button when the active tab's list is empty", () => {
    renderBookmarks();
    expect(screen.queryByRole("button", { name: /clear/i })).not.toBeInTheDocument();
  });

  it("clears bookmarks via the Clear button, leaving an empty state", async () => {
    window.localStorage.setItem("na_bookmarks", JSON.stringify([bookmarkedArticle]));
    const user = userEvent.setup();
    renderBookmarks();

    expect(screen.getByText("A bookmarked story")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /clear bookmarks/i }));

    expect(screen.queryByText("A bookmarked story")).not.toBeInTheDocument();
    expect(screen.getByText(/articles you bookmark will show up here/i)).toBeInTheDocument();
  });

  it("clearing bookmarks does not remove recently-viewed data from storage", async () => {
    window.localStorage.setItem("na_bookmarks", JSON.stringify([bookmarkedArticle]));
    window.localStorage.setItem("na_recently_viewed", JSON.stringify([viewedArticle]));
    const user = userEvent.setup();
    renderBookmarks();

    await user.click(screen.getByRole("button", { name: /clear bookmarks/i }));

    expect(JSON.parse(window.localStorage.getItem("na_recently_viewed"))).toEqual([
      viewedArticle,
    ]);
  });
});
