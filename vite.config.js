import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

/**
 * Configuration for the News Aggregator application.
 * - Enables React fast refresh via @vitejs/plugin-react
 * - Configures the "@" alias to point to the src directory
 * - Proxies /news-api/* to the real News API during local dev, so local
 *   development never depends on the provider supporting CORS
 * - `base` defaults to "/" (correct for Vercel/Netlify, which serve from
 *   the domain root). GitHub Pages project sites are served from a
 *   /<repo-name>/ subpath instead, so the deploy workflow sets
 *   VITE_BASE_PATH=/<repo-name>/ for that build only -- see
 *   .github/workflows/deploy-gh-pages.yml and README > Deployment.
 * - Configures Vitest (jsdom environment) for unit/integration tests
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    base: env.VITE_BASE_PATH || "/",
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5173,
      open: true,
      proxy: {
        // See src/services/axios.js for how baseURL switches between this
        // proxy path (dev) and the real base URL (prod, where you need a
        // server-side proxy or serverless function if the provider blocks
        // direct browser calls -- see README > Deployment).
        "/news-api": {
          target: env.VITE_NEWS_API_BASE_URL || "https://gnews.io/api/v4",
          changeOrigin: true,
          rewrite: (proxyPath) => proxyPath.replace(/^\/news-api/, ""),
        },
      },
    },
    build: {
      outDir: "dist",
      sourcemap: false,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          // Split rarely-changing vendor code into its own chunk(s) so a
          // browser that's already cached React/router/etc doesn't have to
          // re-download them just because app code changed. Grouped by how
          // often each library actually changes across releases, not just
          // "vendor vs app" as one blob.
          manualChunks: {
            "vendor-react": ["react", "react-dom", "react-router-dom"],
            "vendor-motion": ["framer-motion"],
            "vendor-utils": ["axios", "react-hot-toast", "react-icons"],
          },
        },
      },
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/setupTests.js",
      css: true,
    },
  };
});
