/**
 * Thin, safe wrapper around window.localStorage.
 * Centralizing storage access means:
 *  - JSON parsing/stringifying happens in one place
 *  - We fail gracefully in private-browsing / storage-disabled environments
 *  - Every context can persist state the same way
 */

/**
 * Read and JSON-parse a value from localStorage.
 * @param {string} key
 * @param {*} fallback - value to return if key is missing or parsing fails
 */
export function getItem(key, fallback = null) {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch (error) {
    console.warn(`[storage] Failed to read "${key}":`, error);
    return fallback;
  }
}

/**
 * JSON-stringify and write a value to localStorage.
 * @param {string} key
 * @param {*} value
 */
export function setItem(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`[storage] Failed to write "${key}":`, error);
    return false;
  }
}

/**
 * Remove a key from localStorage.
 * @param {string} key
 */
export function removeItem(key) {
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`[storage] Failed to remove "${key}":`, error);
    return false;
  }
}

/**
 * Clear every key belonging to this app (prefix-matched) without wiping
 * unrelated localStorage data from other apps on the same origin.
 * @param {string[]} keys
 */
export function clearKeys(keys = []) {
  keys.forEach(removeItem);
}
