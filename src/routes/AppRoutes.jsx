import { lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

// Route-level code splitting: each page is its own chunk, loaded on demand.
const Home = lazy(() => import("../pages/Home.jsx"));
const Category = lazy(() => import("../pages/Category.jsx"));
const Search = lazy(() => import("../pages/Search.jsx"));
const Bookmarks = lazy(() => import("../pages/Bookmarks.jsx"));
const Article = lazy(() => import("../pages/Article.jsx"));
const NotFound = lazy(() => import("../pages/NotFound.jsx"));

/**
 * AppRoutes
 * Central route table for the application. Wrapped by the caller in <Suspense>.
 * AnimatePresence enables page-transition animations on route change.
 */
function AppRoutes() {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/category/:category" element={<Category />} />
        <Route path="/search" element={<Search />} />
        <Route path="/bookmarks" element={<Bookmarks />} />
        <Route path="/article/:id" element={<Article />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

export default AppRoutes;
