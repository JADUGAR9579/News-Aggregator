import { memo } from "react";
import { motion } from "framer-motion";

/**
 * Loader
 * Accessible loading spinner. Renders inline by default, or as a
 * full-screen overlay when `fullScreen` is set (used for route transitions).
 *
 * @param {object} props
 * @param {boolean} [props.fullScreen]
 * @param {string} [props.label]
 * @param {"sm"|"md"|"lg"} [props.size]
 */
function Loader({ fullScreen = false, label = "Loading…", size = "md" }) {
  const sizeMap = { sm: 20, md: 32, lg: 48 };
  const dimension = sizeMap[size];

  const spinner = (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-3"
    >
      <motion.span
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
        style={{ width: dimension, height: dimension }}
        className="block rounded-full border-4 border-primary-200 border-t-primary-600 dark:border-gray-700 dark:border-t-primary-500"
      />
      {label && (
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {label}
        </span>
      )}
    </div>
  );

  if (!fullScreen) return spinner;

  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center">
      {spinner}
    </div>
  );
}

export default memo(Loader);
