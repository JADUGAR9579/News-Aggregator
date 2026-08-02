import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ThemeProvider } from "../../context/ThemeContext.jsx";
import ThemeToggle from "./ThemeToggle.jsx";

function renderToggle() {
  return render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>
  );
}

describe("ThemeToggle", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("renders in light mode by default with the correct accessible label", () => {
    renderToggle();
    const button = screen.getByRole("button", { name: /switch to dark mode/i });
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it("toggles to dark mode on click, updating label and pressed state", async () => {
    const user = userEvent.setup();
    renderToggle();

    const button = screen.getByRole("button", { name: /switch to dark mode/i });
    await user.click(button);

    expect(screen.getByRole("button", { name: /switch to light mode/i })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("toggles back to light mode on a second click", async () => {
    const user = userEvent.setup();
    renderToggle();

    const button = screen.getByRole("button", { name: /switch to dark mode/i });
    await user.click(button);
    await user.click(screen.getByRole("button", { name: /switch to light mode/i }));

    expect(screen.getByRole("button", { name: /switch to dark mode/i })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });

  it("applies the dark class to the document root when toggled", async () => {
    const user = userEvent.setup();
    renderToggle();
    await user.click(screen.getByRole("button"));
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
