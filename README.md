# News Aggregator

A production-grade news aggregator built with React 19, Vite, and Tailwind CSS — breaking news, trending stories, category browsing, search, bookmarks, and a personalized feed, all in one place.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-61dafb.svg)
![Vite](https://img.shields.io/badge/Vite-6-646cff.svg)

---

## Overview

News Aggregator pulls headlines from a free news API (configured for [GNews](https://gnews.io) by default) and wraps them in a fast, accessible, installable web app. It's built as a real, deployable application — not a demo — with a proper API layer (retries, cancellation, error normalization), reducer-based state management, route-level code splitting, a hand-written service worker for offline reading, and a full Vitest + React Testing Library test suite.

## Features

**Core**
- Home feed: featured story, trending rail, category shortcuts, infinite-scrolling latest news
- Category browsing with its own infinite scroll and breadcrumb
- Debounced search with a visible, editable search-history panel
- Bookmarks + Recently Viewed library (tabbed, persisted to `localStorage`)
- Full article view with share (Web Share API + clipboard fallback), reading-time estimate, and a "recently viewed" rail
- Dark / light mode (persisted, respects OS preference on first load)
- Country and language selection
- Loading skeletons, error states (network / no-results / generic), and a 404 page

**Bonus**
- **AI summarization** — one-click article summary via an OpenAI-compatible chat completions endpoint (Groq, OpenRouter, etc.)
- **Voice search** — Web Speech API, with graceful fallback in unsupported browsers
- **Keyboard shortcuts** — `/` focus search, `t` toggle theme, `g h` go home, `g b` go to bookmarks
- **PWA** — installable, offline reading for previously visited pages (hand-written service worker, no Workbox dependency)
- **Weather widget** — geolocation + OpenWeatherMap current conditions
- **Personalized feed** — a "For You" rail derived from a real frequency count of your bookmarked/viewed categories
- **Accessibility** — skip-to-content link, ARIA labels throughout, visible focus states, keyboard-navigable

## Screenshots

_Not included in this repo — add your own once you have a live deployment._ A quick way to generate them:

```bash
npm run dev
# then screenshot: Home (light + dark), Article page, Search with results,
# Bookmarks, and the mobile Sidebar drawer
```

Drop them in `public/screenshots/` and reference them here, e.g.:
```md
![Home page](./public/screenshots/home.png)
```

## Architecture

- **State**: three Context + `useReducer` pairs (`ThemeContext`, `NewsContext`, `BookmarkContext`), each with a memoized value object so consumers don't re-render on unrelated state changes. All three persist to `localStorage`.
- **Data fetching**: a shared Axios instance (`services/axios.js`) handles the API key, request timeout, retry-with-backoff on network/5xx errors, and normalizes every error into a consistent `{ type, message }` shape the UI can branch on. `services/newsApi.js` wraps each endpoint. Pages that need pagination (Home, Category, Search) manage their own fetch/accumulate/`hasMore` state rather than a single generic hook, because `NewsGrid` needs accumulated pages, not a one-shot fetch.
- **Routing**: React Router with every page behind `React.lazy` for route-level code splitting.
- **Article detail**: most free news APIs don't expose a "get article by id" endpoint, so `Article.jsx` reads the full article object from router `state` (set by every card's `<Link>`) and only falls back to an API call on a direct/refreshed URL.
- **Styling**: Tailwind CSS with a small custom design-token layer (primary color, radii, shadows) in `tailwind.config.js`; dark mode via the `class` strategy.

## Folder Structure

```
news-aggregator/
├── public/                  favicon, logo, placeholder image, manifest, service worker, 404.html
├── src/
│   ├── assets/               images / icons / animations (empty — bring your own)
│   ├── components/
│   │   ├── common/            Button, Loader, Skeleton, Error, SearchBar, ThemeToggle, WeatherWidget
│   │   ├── layout/             Navbar, Footer, Sidebar
│   │   ├── news/                NewsCard, FeaturedNews, CategoryCard, TrendingNews, NewsGrid
│   │   └── bookmark/             BookmarkButton
│   ├── pages/                 Home, Category, Search, Bookmarks, Article, NotFound
│   ├── hooks/                 useTheme, useFetch, useBookmarks, useSearch
│   ├── services/               axios.js, newsApi.js
│   ├── context/                 ThemeContext, NewsContext, BookmarkContext
│   ├── utils/                   constants, helpers, storage, formatDate
│   ├── routes/                  AppRoutes.jsx
│   ├── styles/                   index.css
│   ├── App.jsx / main.jsx
│   └── setupTests.js
├── .github/workflows/         deploy-gh-pages.yml
├── vercel.json / netlify.toml
└── vite.config.js / tailwind.config.js / eslint.config.js
```

## Installation

Requires Node.js 20+.

```bash
git clone <your-fork-url>
cd news-aggregator
npm install
cp .env.example .env   # then fill in your API keys, see below
npm run dev
```

Other scripts:

```bash
npm run build           # production build to dist/
npm run preview         # preview the production build locally
npm run lint            # ESLint, zero warnings allowed
npm run test            # run the test suite once
npm run test:watch      # watch mode
```

## Environment Variables

Copy `.env.example` to `.env` and fill in whichever you need — every bonus feature that depends on one degrades gracefully (hides itself or shows a quiet placeholder) when its key is missing.

| Variable | Required for | Where to get a key |
|---|---|---|
| `VITE_NEWS_API_KEY` | Local dev only (`npm run dev`) | [gnews.io](https://gnews.io) (free tier) |
| `VITE_NEWS_API_BASE_URL` | Local dev only | Defaults to `https://gnews.io/api/v4` |
| `GNEWS_API_KEY` | **Production on Vercel** — read server-side by `api/news/[...path].js`, never shipped to the browser. Set this in Vercel's dashboard, not in `.env`. | Same key as above |
| `VITE_SUMMARY_API_KEY` | AI summarization | [Groq](https://console.groq.com) (free tier) or any OpenAI-compatible provider |
| `VITE_SUMMARY_API_URL` | AI summarization | Defaults to Groq's chat completions endpoint |
| `VITE_WEATHER_API_KEY` | Weather widget | [OpenWeatherMap](https://openweathermap.org/api) (free tier) |
| `VITE_WEATHER_API_URL` | Weather widget | Defaults to `https://api.openweathermap.org/data/2.5` |

Note the split for the news API specifically: `VITE_NEWS_API_KEY` only matters locally, where it's injected client-side for simplicity since the Vite dev-server proxy makes CORS a non-issue anyway. In production, `GNEWS_API_KEY` (no `VITE_` prefix) is what actually gets used — see below for why.

## API Configuration

The app is wired to [GNews](https://docs.gnews.io)'s contract by default (`apikey`/`category`/`lang`/`country`/`max`/`page` on `/top-headlines`, `q`/`lang`/`country`/`max`/`sortby`/`page` on `/search`). To use a different provider (e.g. NewsAPI.org), adjust the query param names in `src/services/newsApi.js` and, if you're on Vercel, in `api/news/[...path].js` too.

**CORS is confirmed to block direct browser calls to GNews in production** — verified against a real deployment: GNews returns `200` server-side, but the browser refuses to expose the response because there's no `Access-Control-Allow-Origin` header. This isn't a maybe.

- **In development**, requests go through the Vite dev-server proxy (`vite.config.js` → `server.proxy["/news-api"]`), so this never matters locally.
- **In production on Vercel**, requests go through `api/news/[...path].js`, a serverless function that calls GNews server-side (same-origin from the browser's perspective, so CORS doesn't apply) and injects `GNEWS_API_KEY` there instead of shipping it in the client bundle.
- **On Netlify or GitHub Pages**, you'll need an equivalent same-origin proxy — a Netlify Function for the former; GitHub Pages has no server-side capability at all, so this genuinely can't be solved there without pointing at an external proxy you host elsewhere.

**Security note:** `VITE_`-prefixed environment variables are baked into the public JS bundle at build time — anyone can read them straight out of devtools or the bundle source. If you've already deployed with only `VITE_NEWS_API_KEY` set (no server-side proxy in front of it), treat that key as burned and generate a new one at gnews.io before switching to the `GNEWS_API_KEY` server-side setup described here.

## Deployment

The app is a static SPA (`vite build` → `dist/`) and deploys to any static host. Configs are included for three:

### Vercel
`vercel.json` is already set up (build command, output dir, SPA rewrite), and `api/news/[...path].js` is a serverless function that proxies GNews requests server-side — required, not optional, since GNews blocks direct browser calls (see API Configuration above). Import the repo in the Vercel dashboard, or:
```bash
npx vercel
```
Under Project Settings → Environment Variables, add:
- `GNEWS_API_KEY` — **not** `VITE_`-prefixed; this is what the serverless function actually uses in production
- `VITE_SUMMARY_API_KEY` / `VITE_SUMMARY_API_URL` / `VITE_WEATHER_API_KEY` / `VITE_WEATHER_API_URL` if you want those bonus features working

After adding/changing environment variables, trigger a fresh deployment — Vite bakes `VITE_*` vars into the bundle at build time, so an existing deployment won't pick up a variable added after the fact.

### Netlify
`netlify.toml` is already set up. **Not yet fixed for the CORS issue** — this repo only includes the Vercel serverless proxy; add an equivalent Netlify Function under `netlify/functions/` that mirrors `api/news/[...path].js` before relying on a Netlify deployment for real news data. Import the repo in the Netlify dashboard, or:
```bash
npx netlify deploy --prod
```
Add your `VITE_*` variables under Site Settings → Environment Variables.

### GitHub Pages
GitHub Pages has no server, so client-side routing needs a small workaround (`public/404.html` + a decoder script in `index.html`, the well-known [`spa-github-pages`](https://github.com/rafgraph/spa-github-pages) pattern) — already included. **It also has no way to solve the CORS issue** (see API Configuration above) — a GitHub Pages deployment of this app will not be able to fetch news at all unless you point it at an external proxy you host somewhere else.

1. In the repo, go to **Settings → Pages → Source** and select **GitHub Actions**.
2. Add your API keys as **repository secrets** (`VITE_NEWS_API_KEY`, etc.) — the workflow reads them from there.
3. Push to `main`. `.github/workflows/deploy-gh-pages.yml` builds and deploys automatically.

By default the workflow sets `VITE_BASE_PATH=/<repo-name>/`, correct for a project site (`https://<user>.github.io/<repo-name>/`). If you're deploying to a user/org site or a custom domain instead, change that to `/` in the workflow file — and if your repo name has more than one path segment worth of depth, adjust `segmentCount` in `public/404.html` to match.

**Known limitation:** the service worker (`public/sw.js`) is a static, hand-written file — it can't template its own cached-shell paths per deployment target the way `index.html` can. It works correctly at the root (Vercel/Netlify) and its asset-matching/registration path were fixed to work under a GitHub Pages subpath too, but full offline-shell caching under a subpath is best-effort rather than fully verified. If that matters for your deployment, consider `vite-plugin-pwa`/Workbox instead — deliberately not used here to stay within the project's locked tech stack.

## Performance

- Route-level code splitting via `React.lazy` for every page
- Manual vendor chunk splitting (`vite.config.js` → `build.rollupOptions.output.manualChunks`) so React/router, Framer Motion, and utility libraries cache independently from app code
- Every component wrapped in `React.memo`; `useCallback`/`useMemo` throughout the pages for fetchers and derived values
- Image lazy loading (`loading="lazy"`) everywhere except the above-the-fold featured hero image, which loads eagerly since delaying it would hurt LCP, not help
- `IntersectionObserver`-based infinite scroll, with load state tracked in refs so the observer isn't torn down and recreated on every page fetch
- No virtual/windowed rendering: lists are paginated at 12 items/page rather than rendering thousands of nodes, so it wasn't a measured problem worth the added dependency

## Accessibility

- Skip-to-main-content link and a focusable `#main-content` landmark
- ARIA labels on icon-only buttons, `aria-selected`/`aria-pressed` on tabs and toggles, `aria-live`/`role="alert"` on error states
- Full keyboard navigation, including the global shortcuts above
- Visible focus rings (`:focus-visible`) throughout, never suppressed
- Respects `prefers-color-scheme` on first load

## Future Improvements

- Server-side proxy for the news API to remove the CORS caveat entirely in production
- Build-time service worker generation (Workbox) for fully correct offline caching under any deployment subpath
- Paginated/virtualized rendering if the feed size ever grows well beyond what infinite scroll comfortably handles
- User accounts + synced bookmarks across devices (currently `localStorage`-only, per-browser)
- E2E tests (Playwright/Cypress) layered on top of the current unit/integration suite

## Author

Built by **Shivnath**.

## License

MIT — see [LICENSE](./LICENSE).
