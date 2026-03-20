/**
 * Cloudflare Worker entry point.
 *
 * - Proxies /nasa-tap/* → https://exoplanetarchive.ipac.caltech.edu/TAP/*
 *   (browser can't call the NASA TAP API directly due to CORS)
 * - Everything else is served from the static Vite build via the ASSETS binding
 *   (SPA fallback to index.html is handled by `not_found_handling` in wrangler.jsonc)
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/nasa-tap/")) {
      const nasaPath = url.pathname.replace("/nasa-tap", "/TAP");
      const nasaUrl = new URL(
        `https://exoplanetarchive.ipac.caltech.edu${nasaPath}${url.search}`
      );

      const upstream = await fetch(nasaUrl.toString(), {
        headers: { "User-Agent": "ExoplanetExplorer/1.0" },
      });

      return new Response(upstream.body, {
        status: upstream.status,
        headers: {
          "Content-Type":
            upstream.headers.get("Content-Type") || "text/plain",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // Fall through to static assets (Vite build output)
    return env.ASSETS.fetch(request);
  },
};
