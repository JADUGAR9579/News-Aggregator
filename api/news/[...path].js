/**
 * /api/news/[...path]
 *
 * Server-side proxy to GNews. Exists because:
 *
 * 1. CORS: GNews does not send Access-Control-Allow-Origin, so direct
 *    browser calls are blocked outright in production (confirmed via a
 *    real deployment -- requests return 200 server-side but the browser
 *    refuses to let JS read the response). A server-to-server call has no
 *    such restriction, and the browser only ever talks to this same-origin
 *    endpoint, so there's nothing for CORS to block.
 *
 * 2. Key exposure: VITE_-prefixed env vars are baked into the public JS
 *    bundle at build time -- anyone can read VITE_NEWS_API_KEY straight out
 *    of devtools or the bundle source. GNEWS_API_KEY (no VITE_ prefix) is
 *    read here, server-side only, and never shipped to the browser at all.
 *
 * Deployed as a Vercel serverless function (Node.js runtime, default).
 * Configure GNEWS_API_KEY in Vercel -> Project -> Settings -> Environment
 * Variables (NOT prefixed with VITE_ -- that distinction matters, see #2).
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  const apiKey = process.env.GNEWS_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      message:
        "GNEWS_API_KEY is not configured on the server. Set it in Vercel -> Settings -> Environment Variables (not VITE_-prefixed), then redeploy.",
    });
    return;
  }

  // req.query.path holds the [...path] segments as an array, e.g.
  // /api/news/top-headlines -> ["top-headlines"]
  const segments = Array.isArray(req.query.path) ? req.query.path : [req.query.path];
  const endpoint = segments.filter(Boolean).join("/");

  const allowedEndpoints = new Set(["top-headlines", "search"]);
  if (!allowedEndpoints.has(endpoint)) {
    res.status(404).json({ message: `Unknown endpoint: ${endpoint}` });
    return;
  }

  const upstream = new URL(`https://gnews.io/api/v4/${endpoint}`);
  for (const [key, value] of Object.entries(req.query)) {
    if (key === "path") continue; // routing artifact, not a real GNews param
    upstream.searchParams.set(key, value);
  }
  upstream.searchParams.set("apikey", apiKey);

  try {
    const upstreamRes = await fetch(upstream.toString());
    const data = await upstreamRes.json();
    res.status(upstreamRes.status).json(data);
  } catch (err) {
    res.status(502).json({ message: "Failed to reach GNews.", detail: String(err) });
  }
}
