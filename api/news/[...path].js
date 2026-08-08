/**
 * /api/news/[...path]
 *
 * Server-side proxy to GNews. See git history for the full rationale
 * (CORS + API key exposure). This version parses the endpoint directly
 * from req.url instead of relying on Vercel's req.query.path population
 * for the catch-all route, which was returning empty/unreliable in
 * practice -- parsing the URL ourselves is deterministic regardless of
 * how the platform handles dynamic route query params.
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

  const requestUrl = new URL(req.url, "http://localhost");
  // requestUrl.pathname looks like /api/news/top-headlines -- drop the
  // leading "api/news" segments to get just the GNews endpoint name.
  const segments = requestUrl.pathname.split("/").filter(Boolean);
  const endpoint = segments.slice(2).join("/");

  const allowedEndpoints = new Set(["top-headlines", "search"]);
  if (!allowedEndpoints.has(endpoint)) {
    res.status(404).json({ message: `Unknown endpoint: ${endpoint || "(empty)"}` });
    return;
  }

  const upstream = new URL(`https://gnews.io/api/v4/${endpoint}`);
  for (const [key, value] of requestUrl.searchParams.entries()) {
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
