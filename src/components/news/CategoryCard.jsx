import { memo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiGlobe,
  FiBriefcase,
  FiCpu,
  FiFilm,
  FiActivity,
  FiHeart,
  FiFlag,
  FiTrendingUp,
} from "react-icons/fi";

const ICONS = {
  general: FiTrendingUp,
  world: FiGlobe,
  business: FiBriefcase,
  technology: FiCpu,
  entertainment: FiFilm,
  sports: FiActivity,
  science: FiCpu,
  health: FiHeart,
  nation: FiFlag,
};

/**
 * CategoryCard
 * Compact, clickable category chip/card. Highlights when active.
 *
 * @param {object} props
 * @param {{ id: string, label: string }} props.category
 * @param {boolean} [props.active]
 */
function CategoryCard({ category, active = false }) {
  const Icon = ICONS[category.id] || FiTrendingUp;

  return (
    <motion.div whileTap={{ scale: 0.95 }} whileHover={{ y: -2 }}>
      <Link
        to={`/category/${category.id}`}
        aria-current={active ? "page" : undefined}
        className={`btn-focus flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
          active
            ? "border-primary-600 bg-primary-600 text-white"
            : "border-gray-200 bg-white text-gray-600 hover:border-primary-400 hover:text-primary-600 dark:border-gray-700 dark:bg-muted-dark dark:text-gray-300"
        }`}
      >
        <Icon size={16} aria-hidden="true" />
        {category.label}
      </Link>
    </motion.div>
  );
}

export default memo(CategoryCard);
