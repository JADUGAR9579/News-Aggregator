import { memo } from "react";
import { Link } from "react-router-dom";
import { FiGithub, FiTwitter, FiLinkedin } from "react-icons/fi";
import { CATEGORIES } from "../../utils/constants.js";

/**
 * Footer
 * Static site footer: brand blurb, category quick links, social icons,
 * and copyright line with a dynamic year.
 */
function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 border-t border-gray-100 bg-white dark:border-gray-800 dark:bg-surface-dark">
      <div className="container-app grid grid-cols-1 gap-8 py-10 sm:grid-cols-3">
        <div>
          <span className="text-lg font-extrabold text-gray-900 dark:text-gray-100">
            News<span className="text-primary-600">Aggr</span>
          </span>
          <p className="mt-2 max-w-xs text-sm text-gray-500 dark:text-gray-400">
            Your world, one feed. Breaking news and trending stories from trusted
            sources, all in one place.
          </p>
          <div className="mt-4 flex gap-3">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
              className="btn-focus rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <FiGithub size={18} />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Twitter"
              className="btn-focus rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <FiTwitter size={18} />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
              className="btn-focus rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <FiLinkedin size={18} />
            </a>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-400">
            Categories
          </h3>
          <ul className="space-y-2 text-sm">
            {CATEGORIES.slice(0, 6).map((category) => (
              <li key={category.id}>
                <Link
                  to={`/category/${category.id}`}
                  className="text-gray-600 hover:text-primary-600 dark:text-gray-300"
                >
                  {category.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-400">
            Quick Links
          </h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/bookmarks" className="text-gray-600 hover:text-primary-600 dark:text-gray-300">
                Bookmarks
              </Link>
            </li>
            <li>
              <Link to="/search" className="text-gray-600 hover:text-primary-600 dark:text-gray-300">
                Search
              </Link>
            </li>
            <li>
              <Link to="/" className="text-gray-600 hover:text-primary-600 dark:text-gray-300">
                Home
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-100 py-4 text-center text-xs text-gray-400 dark:border-gray-800">
        © {year} NewsAggr. All rights reserved. News content belongs to its respective publishers.
      </div>
    </footer>
  );
}

export default memo(Footer);
