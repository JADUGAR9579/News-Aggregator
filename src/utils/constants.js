/**
 * Application-wide constants.
 * Centralizing these avoids magic strings scattered across components.
 */

export const CATEGORIES = [
  { id: "general", label: "Top Stories" },
  { id: "world", label: "World" },
  { id: "business", label: "Business" },
  { id: "technology", label: "Technology" },
  { id: "entertainment", label: "Entertainment" },
  { id: "sports", label: "Sports" },
  { id: "science", label: "Science" },
  { id: "health", label: "Health" },
  { id: "nation", label: "Nation" },
];

export const COUNTRIES = [
  { code: "us", label: "United States" },
  { code: "gb", label: "United Kingdom" },
  { code: "in", label: "India" },
  { code: "au", label: "Australia" },
  { code: "ca", label: "Canada" },
  { code: "de", label: "Germany" },
  { code: "fr", label: "France" },
  { code: "jp", label: "Japan" },
];

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "hi", label: "Hindi" },
  { code: "ar", label: "Arabic" },
];

export const STORAGE_KEYS = {
  THEME: "na_theme",
  BOOKMARKS: "na_bookmarks",
  SEARCH_HISTORY: "na_search_history",
  RECENTLY_VIEWED: "na_recently_viewed",
  COUNTRY: "na_country",
  LANGUAGE: "na_language",
};

export const PAGE_SIZE = 12;
export const MAX_SEARCH_HISTORY = 10;
export const MAX_RECENTLY_VIEWED = 20;
export const DEBOUNCE_DELAY_MS = 450;
export const REQUEST_TIMEOUT_MS = 10000;
export const MAX_RETRY_ATTEMPTS = 2;

export const KEYBOARD_SHORTCUTS = {
  FOCUS_SEARCH: "/",
  TOGGLE_THEME: "t",
  GO_HOME: "g h",
  GO_BOOKMARKS: "g b",
};
