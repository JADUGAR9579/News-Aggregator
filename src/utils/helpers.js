/**
 * General-purpose helper functions shared across the app.
 */

/**
 * Debounce a function call by `delay` milliseconds.
 * @param {Function} fn - function to debounce
 * @param {number} delay - delay in ms
 * @returns {Function} debounced function
 */
export function debounce(fn, delay = 400) {
  let timer;
  return function debounced(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Estimate reading time for a block of text.
 * @param {string} text
 * @param {number} wordsPerMinute
 * @returns {number} estimated minutes (minimum 1)
 */
export function estimateReadingTime(text = "", wordsPerMinute = 200) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

/**
 * Truncate text to a maximum length, breaking on a word boundary.
 * @param {string} text
 * @param {number} maxLength
 */
export function truncateText(text = "", maxLength = 140) {
  if (text.length <= maxLength) return text;
  const truncated = text.slice(0, maxLength);
  return `${truncated.slice(0, truncated.lastIndexOf(" "))}…`;
}

/**
 * Generate a stable-ish id for an article lacking one (fallback key).
 * @param {object} article
 */
export function getArticleId(article) {
  if (!article) return "";
  return (
    article.id ||
    article.url ||
    `${article.title || "article"}-${article.publishedAt || ""}`
  );
}

/**
 * Safely get a hostname from a URL for source display.
 * @param {string} url
 */
export function getHostname(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/**
 * Check if the browser currently reports being online.
 */
export function isOnline() {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

/**
 * Merge/dedupe an array of articles by their id, keeping first occurrence.
 * Useful when appending infinite-scroll pages.
 * @param {Array} existing
 * @param {Array} incoming
 */
export function mergeUniqueArticles(existing = [], incoming = []) {
  const seen = new Set(existing.map(getArticleId));
  const merged = [...existing];
  for (const article of incoming) {
    const id = getArticleId(article);
    if (!seen.has(id)) {
      seen.add(id);
      merged.push(article);
    }
  }
  return merged;
}

/**
 * Build a shareable Web Share API payload, with clipboard fallback handled by caller.
 * @param {object} article
 */
export function buildShareData(article) {
  return {
    title: article?.title || "News Aggregator",
    text: article?.description || "Check out this article",
    url: article?.url || window.location.href,
  };
}
