import axios from "axios";
import { REQUEST_TIMEOUT_MS, MAX_RETRY_ATTEMPTS } from "../utils/constants.js";

/**
 * Shared Axios instance for the News API.
 * - In dev, requests go through the Vite dev-server proxy (/news-api ->
 *   the real API) so local development never depends on the provider
 *   supporting CORS. See vite.config.js server.proxy.
 * - In production, requests go through /api/news/* -- a same-origin
 *   Vercel serverless function (api/news/[...path].js) that forwards to
 *   GNews server-side. This isn't optional: a real deployment confirmed
 *   GNews blocks direct browser calls outright (no
 *   Access-Control-Allow-Origin header), and going through this proxy
 *   also keeps the API key off the client entirely -- VITE_-prefixed env
 *   vars ship in the public JS bundle, but the proxy reads a
 *   non-VITE_-prefixed GNEWS_API_KEY that's server-side only. If you
 *   deploy somewhere other than Vercel, you'll need an equivalent
 *   same-origin proxy there -- see README > Deployment.
 * - Applies a global request timeout
 * - In dev only, injects the API key as a query param (the Vite proxy
 *   forwards straight to GNews, so something has to supply the key; in
 *   production the serverless function supplies it instead)
 * - Retries transient network/5xx failures with exponential backoff
 * - Normalizes errors into a consistent shape consumed by the UI
 */
const api = axios.create({
  baseURL: import.meta.env.DEV ? "/news-api" : "/api/news",
  timeout: REQUEST_TIMEOUT_MS,
});

api.interceptors.request.use((config) => {
  if (import.meta.env.DEV) {
    config.params = {
      ...config.params,
      apikey: import.meta.env.VITE_NEWS_API_KEY,
    };
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config || {};
    config.__retryCount = config.__retryCount || 0;

    const isRetriable =
      !error.response || (error.response.status >= 500 && error.response.status < 600);

    if (isRetriable && config.__retryCount < MAX_RETRY_ATTEMPTS && !axios.isCancel(error)) {
      config.__retryCount += 1;
      const backoffMs = 400 * config.__retryCount;
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
      return api(config);
    }

    return Promise.reject(normalizeError(error));
  }
);

/**
 * Normalize an Axios error into a consistent, UI-friendly shape.
 * @param {import('axios').AxiosError} error
 */
function normalizeError(error) {
  if (axios.isCancel(error)) {
    return { type: "CANCELLED", message: "Request was cancelled." };
  }
  if (!error.response) {
    return {
      type: "NETWORK_ERROR",
      message: "Unable to reach the server. Check your internet connection.",
    };
  }
  if (error.code === "ECONNABORTED") {
    return { type: "TIMEOUT", message: "The request timed out. Please try again." };
  }
  const status = error.response.status;
  if (status === 429) {
    return { type: "RATE_LIMITED", message: "Too many requests. Please slow down." };
  }
  if (status >= 500) {
    return { type: "SERVER_ERROR", message: "The news service is temporarily unavailable." };
  }
  return {
    type: "API_ERROR",
    message: error.response.data?.message || "Something went wrong fetching the news.",
    status,
  };
}

export default api;
