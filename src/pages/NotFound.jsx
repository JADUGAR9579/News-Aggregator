import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiHome, FiSearch } from "react-icons/fi";

import Button from "../components/common/Button.jsx";

/**
 * NotFound
 * Catch-all 404 page for unmatched routes.
 */
function NotFound() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="container-app flex min-h-[60vh] flex-col items-center justify-center gap-4 py-16 text-center"
    >
      <p className="text-8xl font-extrabold text-primary-600">404</p>
      <h1 className="text-2xl">This page took a wrong turn</h1>
      <p className="max-w-sm text-gray-500 dark:text-gray-400">
        The page you&rsquo;re looking for doesn&rsquo;t exist or may have been moved.
      </p>
      <div className="mt-4 flex gap-3">
        <Link to="/">
          <Button variant="primary">
            <FiHome aria-hidden="true" />
            Back home
          </Button>
        </Link>
        <Link to="/search">
          <Button variant="outline">
            <FiSearch aria-hidden="true" />
            Search news
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}

export default NotFound;
