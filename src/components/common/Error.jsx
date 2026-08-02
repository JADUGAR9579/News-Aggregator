import { memo } from "react";
import { motion } from "framer-motion";
import { FiWifiOff, FiAlertTriangle, FiSearch, FiRefreshCw } from "react-icons/fi";
import Button from "./Button.jsx";

const ICONS = {
  network: FiWifiOff,
  "no-results": FiSearch,
  generic: FiAlertTriangle,
};

const COPY = {
  network: {
    title: "You're offline",
    description: "Check your internet connection and try again.",
  },
  "no-results": {
    title: "No results found",
    description: "Try a different search term or browse a category instead.",
  },
  generic: {
    title: "Something went wrong",
    description: "We couldn't load the news right now. Please try again.",
  },
};

/**
 * ErrorState
 * Unified empty/error screen used for API failures, offline detection,
 * and "no results" states.
 *
 * @param {object} props
 * @param {"network"|"no-results"|"generic"} [props.type]
 * @param {string} [props.message] - overrides the default description
 * @param {() => void} [props.onRetry] - if provided, shows a retry button
 */
function ErrorState({ type = "generic", message, onRetry }) {
  const Icon = ICONS[type] || ICONS.generic;
  const copy = COPY[type] || COPY.generic;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center gap-4 rounded-2xl px-6 py-16 text-center"
      role="alert"
    >
      <div className="rounded-full bg-red-50 p-4 text-red-500 dark:bg-red-500/10">
        <Icon size={32} aria-hidden="true" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          {copy.title}
        </h3>
        <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
          {message || copy.description}
        </p>
      </div>
      {onRetry && (
        <Button variant="primary" size="md" onClick={onRetry}>
          <FiRefreshCw aria-hidden="true" />
          Try again
        </Button>
      )}
    </motion.div>
  );
}

export default memo(ErrorState);
