import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import App from "./App.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { NewsProvider } from "./context/NewsContext.jsx";
import { BookmarkProvider } from "./context/BookmarkContext.jsx";

import "./styles/index.css";

/**
 * Application entry point.
 *
 * Provider order matters:
 * 1. BrowserRouter      -> enables client-side routing
 * 2. ThemeProvider       -> must wrap everything so dark/light class is available app-wide
 * 3. NewsProvider        -> shared news/search/country/language state
 * 4. BookmarkProvider    -> shared bookmarks + recently viewed state
 */
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <NewsProvider>
          <BookmarkProvider>
            <App />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  borderRadius: "12px",
                  background: "var(--toast-bg, #1a1d24)",
                  color: "#fff",
                  fontSize: "14px",
                },
              }}
            />
          </BookmarkProvider>
        </NewsProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);

/**
 * Register the service worker for offline support / installability.
 * Skipped in dev: a cached service worker fighting Vite's HMR is a classic
 * source of "why isn't my change showing up" confusion.
 */
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch((err) => {
      console.warn("Service worker registration failed:", err);
    });
  });
}
