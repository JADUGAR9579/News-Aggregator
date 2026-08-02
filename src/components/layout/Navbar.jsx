import { memo, useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiMenu, FiBookmark, FiSearch } from "react-icons/fi";

import Sidebar from "./Sidebar.jsx";
import SearchBar from "../common/SearchBar.jsx";
import ThemeToggle from "../common/ThemeToggle.jsx";
import { useSearch } from "../../hooks/useSearch.js";
import { useBookmarks } from "../../hooks/useBookmarks.js";
import { CATEGORIES } from "../../utils/constants.js";

/**
 * Navbar
 * Persistent top navigation: brand, primary category links (desktop),
 * search bar, theme toggle, bookmarks link with a live count badge,
 * and a hamburger trigger for the mobile Sidebar.
 */
function Navbar() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const { bookmarks } = useBookmarks();
  const {
    query,
    setQuery,
    clearQuery,
    commitSearch,
    searchHistory,
    removeSearchTerm,
  } = useSearch();

  const submitSearch = () => {
    if (!query.trim()) return;
    commitSearch();
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    setMobileSearchOpen(false);
  };

  // Respond to the global "/" shortcut (dispatched from App.jsx). Whichever
  // search input is actually visible depends on viewport width, so this
  // checks the desktop input first and falls back to opening + focusing
  // the mobile one.
  useEffect(() => {
    function focusSearch() {
      const desktopInput = document.getElementById("site-search-desktop");
      if (desktopInput && desktopInput.offsetParent !== null) {
        desktopInput.focus();
        return;
      }
      setMobileSearchOpen(true);
      requestAnimationFrame(() => {
        document.getElementById("site-search-mobile")?.focus();
      });
    }

    window.addEventListener("shortcut:focus-search", focusSearch);
    return () => window.removeEventListener("shortcut:focus-search", focusSearch);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/90 backdrop-blur dark:border-gray-800 dark:bg-surface-dark/90">
        <div className="container-app flex h-16 items-center gap-4">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="btn-focus rounded-full p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10 lg:hidden"
          >
            <FiMenu size={22} />
          </button>

          <NavLink to="/" aria-label="News Aggregator, go to homepage" className="flex shrink-0 items-center gap-2">
            <motion.span
              whileHover={{ rotate: -6 }}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 font-black text-white"
            >
              N
            </motion.span>
            <span className="hidden text-lg font-extrabold tracking-tight text-gray-900 dark:text-gray-100 sm:block">
              News<span className="text-primary-600">Aggr</span>
            </span>
          </NavLink>

          <nav aria-label="Primary categories" className="hidden flex-1 items-center gap-1 lg:flex">
            {CATEGORIES.slice(0, 6).map((category) => (
              <NavLink
                key={category.id}
                to={`/category/${category.id}`}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                    isActive
                      ? "text-primary-600"
                      : "text-gray-600 hover:text-primary-600 dark:text-gray-300"
                  }`
                }
              >
                {category.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden max-w-sm flex-1 md:block">
            <SearchBar
              id="site-search-desktop"
              value={query}
              onChange={setQuery}
              onSubmit={submitSearch}
              onClear={clearQuery}
              history={searchHistory}
              onRemoveHistoryItem={removeSearchTerm}
            />
          </div>

          <button
            type="button"
            onClick={() => setMobileSearchOpen((v) => !v)}
            aria-label="Toggle search"
            className="btn-focus rounded-full p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10 md:hidden"
          >
            <FiSearch size={20} />
          </button>

          <ThemeToggle />

          <NavLink
            to="/bookmarks"
            aria-label="Bookmarks"
            className={({ isActive }) =>
              `btn-focus relative rounded-full p-2 transition-colors ${
                isActive
                  ? "bg-primary-50 text-primary-600 dark:bg-primary-900/30"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
              }`
            }
          >
            <FiBookmark size={20} />
            {bookmarks.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-600 px-1 text-[10px] font-bold text-white">
                {bookmarks.length}
              </span>
            )}
          </NavLink>
        </div>

        {mobileSearchOpen && (
          <div className="container-app pb-3 md:hidden">
            <SearchBar
              id="site-search-mobile"
              value={query}
              onChange={setQuery}
              onSubmit={submitSearch}
              onClear={clearQuery}
              history={searchHistory}
              onRemoveHistoryItem={removeSearchTerm}
              autoFocus
            />
          </div>
        )}
      </header>

      <Sidebar isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}

export default memo(Navbar);
