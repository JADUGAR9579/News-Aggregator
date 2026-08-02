import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiBookmark, FiTrash2, FiEye } from "react-icons/fi";

import { useBookmarks } from "../hooks/useBookmarks.js";
import { getArticleId } from "../utils/helpers.js";

import NewsCard from "../components/news/NewsCard.jsx";
import Button from "../components/common/Button.jsx";
import ErrorState from "../components/common/Error.jsx";

const TABS = [
  { id: "bookmarks", label: "Bookmarks", icon: FiBookmark },
  { id: "recent", label: "Recently Viewed", icon: FiEye },
];

/**
 * Bookmarks
 * Tabbed view of the user's saved articles and their recently-viewed
 * history, both persisted in localStorage via BookmarkContext.
 */
function Bookmarks() {
  const { bookmarks, recentlyViewed, clearBookmarks, clearRecentlyViewed } = useBookmarks();
  const [activeTab, setActiveTab] = useState("bookmarks");

  const isBookmarksTab = activeTab === "bookmarks";
  const activeList = isBookmarksTab ? bookmarks : recentlyViewed;
  const clearActive = isBookmarksTab ? clearBookmarks : clearRecentlyViewed;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="container-app space-y-6 py-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl">My Library</h1>
        {activeList.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearActive}>
            <FiTrash2 aria-hidden="true" />
            Clear {isBookmarksTab ? "bookmarks" : "history"}
          </Button>
        )}
      </div>

      <div
        role="tablist"
        aria-label="Library sections"
        className="flex w-fit gap-1 rounded-xl bg-white p-1 shadow-card dark:bg-muted-dark"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors btn-focus ${
                active
                  ? "bg-primary-600 text-white"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
              }`}
            >
              <Icon aria-hidden="true" />
              {tab.label}
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  active ? "bg-white/20" : "bg-gray-100 dark:bg-white/10"
                }`}
              >
                {tab.id === "bookmarks" ? bookmarks.length : recentlyViewed.length}
              </span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeList.length === 0 ? (
            <ErrorState
              type="no-results"
              message={
                isBookmarksTab
                  ? "Articles you bookmark will show up here."
                  : "Articles you open will show up here."
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {activeList.map((article) => (
                <NewsCard key={getArticleId(article)} article={article} />
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

export default Bookmarks;
