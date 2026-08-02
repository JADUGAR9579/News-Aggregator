import { memo } from "react";
import { motion } from "framer-motion";
import { FiLoader } from "react-icons/fi";

const VARIANT_CLASSES = {
  primary:
    "bg-primary-600 text-white hover:bg-primary-700 disabled:bg-primary-300",
  secondary:
    "bg-muted-light text-gray-900 hover:bg-gray-200 dark:bg-muted-dark dark:text-gray-100 dark:hover:bg-gray-700",
  ghost:
    "bg-transparent text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10",
  outline:
    "border border-gray-300 text-gray-800 hover:border-primary-500 hover:text-primary-600 dark:border-gray-600 dark:text-gray-200",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

const SIZE_CLASSES = {
  sm: "px-3 py-1.5 text-sm gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-6 py-3 text-base gap-2",
  icon: "p-2",
};

/**
 * Button
 * Shared, accessible button used across the whole app.
 *
 * @param {object} props
 * @param {"primary"|"secondary"|"ghost"|"outline"|"danger"} [props.variant]
 * @param {"sm"|"md"|"lg"|"icon"} [props.size]
 * @param {boolean} [props.loading] - shows a spinner and disables the button
 * @param {boolean} [props.fullWidth]
 * @param {React.ReactNode} props.children
 */
function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  disabled = false,
  className = "",
  children,
  ...rest
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      disabled={disabled || loading}
      aria-busy={loading}
      className={`btn-focus inline-flex items-center justify-center rounded-xl font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-70 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...rest}
    >
      {loading && <FiLoader className="animate-spin" aria-hidden="true" />}
      {children}
    </motion.button>
  );
}

export default memo(Button);
