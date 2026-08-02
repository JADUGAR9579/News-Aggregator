import { useEffect, useMemo, useState } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiArrowLeft, FiExternalLink, FiShare2, FiClock, FiZap } from "react-icons/fi";
import toast from "react-hot-toast";

import { getArticleById, summarizeArticle } from "../services/newsApi.js";
import { useBookmarks } from "../hooks/useBookmarks.js";
import {
  getArticleId,
  getHostname,
  estimateReadingTime,
  buildShareData,
} from "../utils/helpers.js";
import { formatAbsoluteDate, formatRelativeTime } from "../utils/formatDate.js";

import BookmarkButton from "../components/bookmark/BookmarkButton.jsx";
import Button from "../components/common/Button.jsx";
import Skeleton from "../components/common/Skeleton.jsx";
import ErrorState from "../components/common/Error.jsx";
import NewsCard from "../components/news/NewsCard.jsx";

/**
 * Article
 * Full article reading view.
 *
 * Most free news APIs don't expose a "get by id" endpoint, so the primary
 * data source is the article object passed via router `state` (set by
 * every card's Link). If the page is opened directly (refresh, shared URL,
 * no state available) it falls back to `getArticleById`, and shows a
 * friendly error if that isn't supported either.
 */
function Article() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { addRecentlyViewed, recentlyViewed } = useBookmarks();

  const stateArticle = location.state?.article;
  const [article, setArticle] = useState(stateArticle || null);
  const [loading, setLoading] = useState(!stateArticle);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (stateArticle) {
      setArticle(stateArticle);
      setLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    getArticleById({ id, signal: controller.signal })
      .then((res) => setArticle(res.data.article || res.data))
      .catch((err) => {
        if (err?.type !== "CANCELLED") setError(err);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [id, stateArticle]);

  useEffect(() => {
    if (article) addRecentlyViewed(article);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [article]);

  const readingTime = useMemo(
    () => (article ? estimateReadingTime(article.content || article.description || "") : 0),
    [article]
  );

  const handleShare = async () => {
    const shareData = buildShareData(article);
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast.success("Link copied to clipboard");
      }
    } catch {
      // user cancelled the native share sheet — no-op
    }
  };

  const morePicks = useMemo(
    () => recentlyViewed.filter((a) => getArticleId(a) !== getArticleId(article)).slice(0, 3),
    [recentlyViewed, article]
  );

  const [summary, setSummary] = useState(null);
  const [summarizing, setSummarizing] = useState(false);

  const handleSummarize = async () => {
    if (!article || summarizing) return;
    setSummarizing(true);
    try {
      const result = await summarizeArticle({
        title: article.title,
        text: article.content || article.description || "",
      });
      setSummary(result);
    } catch (err) {
      toast.error(err?.message || "Couldn't summarize this article.");
    } finally {
      setSummarizing(false);
    }
  };

  if (loading) {
    return (
      <div className="container-app space-y-6 py-8">
        <Skeleton variant="featured" />
        <Skeleton variant="text" count={6} />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="container-app py-16">
        <ErrorState
          type="generic"
          message={error?.message || "This article couldn't be loaded. It may have moved or is no longer available."}
          onRetry={() => navigate(-1)}
        />
      </div>
    );
  }

  const source = article.source?.name || getHostname(article.url) || "Unknown source";

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="container-app max-w-3xl space-y-6 py-8"
    >
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-primary-600 btn-focus dark:text-gray-400"
      >
        <FiArrowLeft aria-hidden="true" />
        Back
      </button>

      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
          <span className="font-semibold text-primary-600">{source}</span>
          <span aria-hidden="true">&middot;</span>
          <span title={formatAbsoluteDate(article.publishedAt)}>
            {formatRelativeTime(article.publishedAt)}
          </span>
          <span aria-hidden="true">&middot;</span>
          <span className="flex items-center gap-1">
            <FiClock aria-hidden="true" />
            {readingTime} min read
          </span>
        </div>

        <h1 className="font-serif text-3xl leading-tight sm:text-4xl">{article.title}</h1>

        {article.description && (
          <p className="text-lg text-gray-600 dark:text-gray-300">{article.description}</p>
        )}

        <div className="flex items-center gap-2">
          <BookmarkButton article={article} />
          <Button variant="outline" size="sm" onClick={handleShare}>
            <FiShare2 aria-hidden="true" />
            Share
          </Button>
          {article.url && (
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 btn-focus dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <FiExternalLink aria-hidden="true" />
              Original source
            </a>
          )}
        </div>
      </header>

      {(article.image || article.urlToImage) && (
        <img
          src={article.image || article.urlToImage}
          alt={article.title || "Article image"}
          className="w-full rounded-2xl object-cover"
          loading="lazy"
        />
      )}

      <section aria-label="AI summary">
        {!summary ? (
          <Button variant="secondary" size="sm" onClick={handleSummarize} loading={summarizing}>
            <FiZap aria-hidden="true" />
            {summarizing ? "Summarizing…" : "Summarize with AI"}
          </Button>
        ) : (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-primary-100 bg-primary-50 p-5 dark:border-primary-500/20 dark:bg-primary-500/10"
            >
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary-700 dark:text-primary-300">
                <FiZap aria-hidden="true" />
                AI Summary
              </div>
              <p className="text-gray-800 dark:text-gray-200">{summary}</p>
            </motion.div>
          </AnimatePresence>
        )}
      </section>

      <div className="prose prose-lg max-w-none whitespace-pre-line font-serif text-gray-800 dark:prose-invert dark:text-gray-200">
        {article.content || article.description || "Full article content is not available from this source."}
      </div>

      {article.url && (
        <p className="rounded-xl bg-primary-50 p-4 text-sm text-primary-800 dark:bg-primary-500/10 dark:text-primary-300">
          This is a preview.{" "}
          <a href={article.url} target="_blank" rel="noopener noreferrer" className="font-semibold underline">
            Read the full story at {source}
          </a>
          .
        </p>
      )}

      {morePicks.length > 0 && (
        <section aria-label="More from your recently viewed" className="pt-8">
          <h2 className="mb-4 text-xl">You Recently Viewed</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {morePicks.map((a) => (
              <NewsCard key={getArticleId(a)} article={a} />
            ))}
          </div>
        </section>
      )}

      <Link to="/" className="inline-block text-sm font-medium text-primary-600 hover:underline">
        &larr; Back to all news
      </Link>
    </motion.article>
  );
}

export default Article;
