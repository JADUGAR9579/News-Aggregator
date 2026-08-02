import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const getMock = vi.fn();
vi.mock("./axios.js", () => ({ default: { get: (...args) => getMock(...args) } }));

import {
  getTopNews,
  getTrendingNews,
  getNewsByCategory,
  searchNews,
  getArticleById,
  summarizeArticle,
} from "./newsApi.js";
import { PAGE_SIZE } from "../utils/constants.js";

describe("newsApi", () => {
  beforeEach(() => {
    getMock.mockReset();
    getMock.mockResolvedValue({ data: { articles: [] } });
  });

  describe("getTopNews", () => {
    it("requests /top-headlines with default country/lang/page and PAGE_SIZE", async () => {
      await getTopNews();
      expect(getMock).toHaveBeenCalledWith("/top-headlines", {
        params: { country: "us", lang: "en", page: 1, max: PAGE_SIZE },
        signal: undefined,
      });
    });

    it("forwards custom country/lang/page and the abort signal", async () => {
      const signal = new AbortController().signal;
      await getTopNews({ country: "gb", lang: "fr", page: 3, signal });
      expect(getMock).toHaveBeenCalledWith("/top-headlines", {
        params: { country: "gb", lang: "fr", page: 3, max: PAGE_SIZE },
        signal,
      });
    });
  });

  describe("getTrendingNews", () => {
    it("requests /top-headlines with max=8 and no sortby/page params", async () => {
      await getTrendingNews({ country: "in", lang: "hi" });
      const [path, config] = getMock.mock.calls[0];
      expect(path).toBe("/top-headlines");
      expect(config.params).toEqual({ country: "in", lang: "hi", max: 8 });
      expect(config.params).not.toHaveProperty("sortby");
      expect(config.params).not.toHaveProperty("page");
    });
  });

  describe("getNewsByCategory", () => {
    it("includes the category param alongside country/lang/page", async () => {
      await getNewsByCategory({ category: "technology", country: "us", lang: "en", page: 2 });
      expect(getMock).toHaveBeenCalledWith("/top-headlines", {
        params: { category: "technology", country: "us", lang: "en", page: 2, max: PAGE_SIZE },
        signal: undefined,
      });
    });
  });

  describe("searchNews", () => {
    it("requests /search with the query mapped to `q`", async () => {
      await searchNews({ query: "climate change", lang: "en", page: 1 });
      expect(getMock).toHaveBeenCalledWith("/search", {
        params: { q: "climate change", lang: "en", page: 1, max: PAGE_SIZE },
        signal: undefined,
      });
    });
  });

  describe("getArticleById", () => {
    it("URL-encodes the id into the path", async () => {
      await getArticleById({ id: "some id/with slash" });
      expect(getMock).toHaveBeenCalledWith(
        "/article/some%20id%2Fwith%20slash",
        expect.objectContaining({ signal: undefined })
      );
    });
  });

  describe("summarizeArticle", () => {
    afterEach(() => {
      vi.unstubAllEnvs();
      vi.unstubAllGlobals();
    });

    it("throws NOT_CONFIGURED when the summary API key is missing or still the placeholder", async () => {
      vi.stubEnv("VITE_SUMMARY_API_URL", "https://api.groq.com/openai/v1/chat/completions");
      vi.stubEnv("VITE_SUMMARY_API_KEY", "your_llm_api_key_here");

      await expect(summarizeArticle({ title: "T", text: "Body" })).rejects.toMatchObject({
        type: "NOT_CONFIGURED",
      });
    });

    it("posts to the summary endpoint with a bearer token and returns the summary text", async () => {
      vi.stubEnv("VITE_SUMMARY_API_URL", "https://api.groq.com/openai/v1/chat/completions");
      vi.stubEnv("VITE_SUMMARY_API_KEY", "real-key-123");

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ choices: [{ message: { content: "  A concise summary.  " } }] }),
      });
      vi.stubGlobal("fetch", fetchMock);

      const result = await summarizeArticle({ title: "Headline", text: "Body text" });

      expect(result).toBe("A concise summary.");
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe("https://api.groq.com/openai/v1/chat/completions");
      expect(options.method).toBe("POST");
      expect(options.headers.Authorization).toBe("Bearer real-key-123");
      const body = JSON.parse(options.body);
      expect(body.messages[1].content).toContain("Headline");
      expect(body.messages[1].content).toContain("Body text");
    });

    it("throws API_ERROR when the summary endpoint responds with a non-ok status", async () => {
      vi.stubEnv("VITE_SUMMARY_API_URL", "https://api.groq.com/openai/v1/chat/completions");
      vi.stubEnv("VITE_SUMMARY_API_KEY", "real-key-123");
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));

      await expect(summarizeArticle({ title: "T", text: "B" })).rejects.toMatchObject({
        type: "API_ERROR",
        status: 500,
      });
    });

    it("throws NETWORK_ERROR when fetch itself rejects", async () => {
      vi.stubEnv("VITE_SUMMARY_API_URL", "https://api.groq.com/openai/v1/chat/completions");
      vi.stubEnv("VITE_SUMMARY_API_KEY", "real-key-123");
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

      await expect(summarizeArticle({ title: "T", text: "B" })).rejects.toMatchObject({
        type: "NETWORK_ERROR",
      });
    });

    it("throws API_ERROR when the response has no usable summary content", async () => {
      vi.stubEnv("VITE_SUMMARY_API_URL", "https://api.groq.com/openai/v1/chat/completions");
      vi.stubEnv("VITE_SUMMARY_API_KEY", "real-key-123");
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));

      await expect(summarizeArticle({ title: "T", text: "B" })).rejects.toMatchObject({
        type: "API_ERROR",
      });
    });
  });
});
