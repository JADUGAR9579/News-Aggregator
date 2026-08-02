import { memo, useContext } from "react";
import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiBookmark, FiGlobe, FiMessageSquare } from "react-icons/fi";

import { NewsContext } from "../../context/NewsContext.jsx";
import { CATEGORIES, COUNTRIES, LANGUAGES } from "../../utils/constants.js";

/**
 * Sidebar
 * Off-canvas navigation drawer for mobile/tablet. Lists categories,
 * bookmarks link, and country/language selectors (which drive NewsContext,
 * persisted to localStorage).
 *
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 */
function Sidebar({ isOpen, onClose }) {
  const { country, language, setCountry, setLanguage } = useContext(NewsContext);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            aria-hidden="true"
          />
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.25 }}
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
            className="fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto bg-white p-5 shadow-2xl dark:bg-muted-dark lg:hidden"
          >
            <div className="mb-6 flex items-center justify-between">
              <span className="text-lg font-extrabold text-primary-600">Menu</span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className="btn-focus rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10"
              >
                <FiX size={20} />
              </button>
            </div>

            <NavLink
              to="/bookmarks"
              onClick={onClose}
              className="mb-6 flex items-center gap-2 rounded-xl bg-primary-50 px-3 py-2.5 font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
            >
              <FiBookmark aria-hidden="true" />
              Bookmarks
            </NavLink>

            <div className="mb-6">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">
                Categories
              </h3>
              <ul className="space-y-1">
                {CATEGORIES.map((category) => (
                  <li key={category.id}>
                    <NavLink
                      to={`/category/${category.id}`}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-primary-600 text-white"
                            : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10"
                        }`
                      }
                    >
                      {category.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gray-400">
                <FiGlobe size={14} /> Country
              </h3>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-surface-dark dark:text-gray-100"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gray-400">
                <FiMessageSquare size={14} /> Language
              </h3>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-surface-dark dark:text-gray-100"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export default memo(Sidebar);
