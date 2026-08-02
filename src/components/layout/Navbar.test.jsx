import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import { ThemeProvider } from "../../context/ThemeContext.jsx";
import { NewsProvider } from "../../context/NewsContext.jsx";
import { BookmarkProvider } from "../../context/BookmarkContext.jsx";
import Navbar from "./Navbar.jsx";

function renderNavbar() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <ThemeProvider>
        <NewsProvider>
          <BookmarkProvider>
            <Navbar />
          </BookmarkProvider>
        </NewsProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
}

describe("Navbar", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders the brand link and primary navigation", () => {
    renderNavbar();
    expect(screen.getByRole("link", { name: /news aggregator, go to homepage/i })).toHaveAttribute(
      "href",
      "/"
    );
    expect(screen.getByRole("navigation", { name: /primary categories/i })).toBeInTheDocument();
  });

  it("renders a desktop search input", () => {
    renderNavbar();
    expect(screen.getByLabelText(/search news/i)).toBeInTheDocument();
  });

  it("does not show a bookmark count badge when there are no bookmarks", () => {
    renderNavbar();
    const bookmarkLink = screen.getByRole("link", { name: /bookmarks/i });
    expect(bookmarkLink.querySelector("span")).not.toBeInTheDocument();
  });

  it("shows a bookmark count badge once a bookmark exists in localStorage", () => {
    window.localStorage.setItem(
      "na_bookmarks",
      JSON.stringify([{ url: "https://example.com/a", title: "A" }])
    );
    renderNavbar();
    const bookmarkLink = screen.getByRole("link", { name: /bookmarks/i });
    expect(bookmarkLink).toHaveTextContent("1");
  });

  it("opens the mobile search bar when the search toggle button is clicked", async () => {
    const user = userEvent.setup();
    renderNavbar();

    // Only one "Search news" input exists until mobile search opens.
    expect(screen.getAllByLabelText(/search news/i)).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: /toggle search/i }));
    expect(screen.getAllByLabelText(/search news/i)).toHaveLength(2);
  });

  it("opens the sidebar when the menu button is clicked", async () => {
    const user = userEvent.setup();
    renderNavbar();

    await user.click(screen.getByRole("button", { name: /open menu/i }));
    // Sidebar renders a dialog-like panel with a close control once open.
    expect(screen.getByRole("button", { name: /close menu/i })).toBeInTheDocument();
  });

  it("typing in the search input updates its value", async () => {
    const user = userEvent.setup();
    renderNavbar();

    const input = screen.getByLabelText(/search news/i);
    await user.type(input, "climate");
    expect(input).toHaveValue("climate");
  });
});
