/**
 * Date/time formatting helpers for article timestamps.
 */

const RTF = typeof Intl !== "undefined"
  ? new Intl.RelativeTimeFormat("en", { numeric: "auto" })
  : null;

const DIVISIONS = [
  { amount: 60, unit: "seconds" },
  { amount: 60, unit: "minutes" },
  { amount: 24, unit: "hours" },
  { amount: 7, unit: "days" },
  { amount: 4.34524, unit: "weeks" },
  { amount: 12, unit: "months" },
  { amount: Number.POSITIVE_INFINITY, unit: "years" },
];

/**
 * Convert an ISO date string into a relative time string, e.g. "3 hours ago".
 * @param {string} isoDate
 */
export function formatRelativeTime(isoDate) {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";

  let duration = (date.getTime() - Date.now()) / 1000;

  for (const division of DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return RTF
        ? RTF.format(Math.round(duration), division.unit)
        : `${Math.round(Math.abs(duration))} ${division.unit} ago`;
    }
    duration /= division.amount;
  }
  return "";
}

/**
 * Format an ISO date string into a readable absolute date, e.g. "Jul 24, 2026".
 * @param {string} isoDate
 */
export function formatAbsoluteDate(isoDate) {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format an ISO date string with both date and time.
 * @param {string} isoDate
 */
export function formatDateTime(isoDate) {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
