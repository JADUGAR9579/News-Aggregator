import api from "./axios.js";
import { PAGE_SIZE } from "../utils/constants.js";

/**
 * News API service layer.
 * Every function accepts an optional `{ signal }` for AbortController-based
 * request cancellation (used by useFetch to cancel stale requests).
 *
 * NOTE: Field names (q, lang, country, category, page) follow the GNews-style
 * REST contract configured via VITE_NEWS_API_BASE_URL. Swap the query params
 * here if you plug in a different provider (e.g. NewsAPI.org).
 */

/**
 * Get top/general headlines.
 * @param {{ country?: string, lang?: string, page?: number, signal?: AbortSignal }} params
 */
export function getTopNews({ country = "us", lang = "en", page = 1, signal } = {}) {
  return api.get("/top-headlines", {
    params: { country, lang, page, max: PAGE_SIZE },
    signal,
  });
}

/**
 * Get trending news. GNews's top-headlines endpoint is already ordered by
 * Google News ranking (there's no `sortby` param on this endpoint — that
 * only exists on /search), so "trending" here is simply a compact snapshot
 * of the current top headlines, sized for a rail rather than a full grid.
 * @param {{ country?: string, lang?: string, signal?: AbortSignal }} params
 */
export function getTrendingNews({ country = "us", lang = "en", signal } = {}) {
  return api.get("/top-headlines", {
    params: { country, lang, max: 8 },
    signal,
  });
}

/**
 * Get news filtered by category.
 * @param {{ category: string, country?: string, lang?: string, page?: number, signal?: AbortSignal }} params
 */
export function getNewsByCategory({
  category,
  country = "us",
  lang = "en",
  page = 1,
  signal,
} = {}) {
  return api.get("/top-headlines", {
    params: { category, country, lang, page, max: PAGE_SIZE },
    signal,
  });
}

/**
 * Search news articles by query string.
 * @param {{ query: string, lang?: string, page?: number, signal?: AbortSignal }} params
 */
export function searchNews({ query, lang = "en", page = 1, signal } = {}) {
  return api.get("/search", {
    params: { q: query, lang, page, max: PAGE_SIZE },
    signal,
  });
}

/**
 * Get a single article by id.
 * NOTE: most free news APIs don't support fetching a single article by id;
 * in practice the Article page receives the full article object via router
 * state and falls back to this call only as a cache-miss recovery path.
 * @param {{ id: string, signal?: AbortSignal }} params
 */
export function getArticleById({ id, signal } = {}) {
  return api.get(`/article/${encodeURIComponent(id)}`, { signal });
}

/**
 * Summarize an article's text using a free/OpenAI-compatible LLM chat
 * completions endpoint (Groq, OpenRouter, etc — configured via
 * VITE_SUMMARY_API_URL / VITE_SUMMARY_API_KEY).
 *
 * Uses `fetch` directly rather than the `api` axios instance: this hits a
 * completely different host with a different auth scheme (bearer token,
 * not a query-string API key), so reusing the news-API interceptors
 * (which inject `apikey` as a query param) would be actively wrong here.
 *
 * @param {{ title: string, text: string, signal?: AbortSignal }} params
 * @returns {Promise<string>} the summary text
 */
export async function summarizeArticle({ title = "", text = "", signal } = {}) {
  const apiUrl = import.meta.env.VITE_SUMMARY_API_URL;
  const apiKey = import.meta.env.VITE_SUMMARY_API_KEY;

  if (!apiUrl || !apiKey || apiKey === "your_llm_api_key_here") {
    throw { type: "NOT_CONFIGURED", message: "AI summarization isn't configured yet." };
  }

  const content = `${title}\n\n${text}`.trim().slice(0, 6000);

  let response;
  try {
    response = await fetch(apiUrl, {
      method: "POST",
      signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        temperature: 0.3,
        max_tokens: 220,
        messages: [
          {
            role: "system",
            content:
              "You summarize news articles in 3 concise, neutral sentences. No preamble, no bullet points, just the summary.",
          },
          { role: "user", content },
        ],
      }),
    });
  } catch (err) {
    if (err?.name === "AbortError") throw { type: "CANCELLED", message: "Cancelled." };
    throw { type: "NETWORK_ERROR", message: "Couldn't reach the summarization service." };
  }

  if (!response.ok) {
    throw {
      type: "API_ERROR",
      message: `Summarization failed (${response.status}). Check your VITE_SUMMARY_API_KEY / VITE_SUMMARY_API_URL.`,
      status: response.status,
    };
  }

  const data = await response.json();
  const summary = data?.choices?.[0]?.message?.content?.trim();
  if (!summary) {
    throw { type: "API_ERROR", message: "The summarization service returned an empty result." };
  }
  return summary;
}
