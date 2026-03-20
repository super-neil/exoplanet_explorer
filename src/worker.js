/**
 * Cloudflare Worker entry point.
 *
 * Routes:
 *  GET /api/exoplanets   — Main planet catalog. Fetches NASA TAP once, caches in
 *                          KV for 6 hours so every visitor hits edge storage, not
 *                          NASA's API. Requires NASA_CACHE KV binding (see README).
 *                          Falls back to a direct NASA fetch if KV is not configured.
 *  GET /api/papers       — Proxies NASA ADS with server-side ADS_TOKEN secret.
 *  GET /nasa-tap/*       — Generic NASA TAP proxy for on-demand queries (spectra etc.)
 *  *                     — Static Vite build assets + SPA fallback via ASSETS binding.
 */

const CORS = { "Access-Control-Allow-Origin": "*" };
const CACHE_TTL_SECONDS = 6 * 60 * 60; // 6 hours
const KV_KEY = "nasa_exoplanets_v5";

const NASA_COLUMNS = [
  "pl_name", "hostname", "pl_rade", "pl_bmasse", "pl_orbper", "pl_eqt",
  "st_teff", "sy_dist", "ra", "dec", "disc_year", "discoverymethod",
  "st_spectype", "pl_controv_flag",
].join(",");

const NASA_URL =
  "https://exoplanetarchive.ipac.caltech.edu/TAP/sync?" +
  new URLSearchParams({
    query: `SELECT ${NASA_COLUMNS} FROM pscomppars WHERE pl_controv_flag=0`,
    format: "json",
  });

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS pre-flight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          ...CORS,
          "Access-Control-Allow-Methods": "GET",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // ── /api/exoplanets — KV-cached planet catalog ─────────────────────────────
    if (url.pathname === "/api/exoplanets") {
      // 1. Try KV cache
      if (env.NASA_CACHE) {
        const cached = await env.NASA_CACHE.get(KV_KEY, { type: "text" });
        if (cached) {
          return new Response(cached, {
            headers: { "Content-Type": "application/json", ...CORS, "X-Cache": "HIT" },
          });
        }
      }

      // 2. Cache miss — fetch from NASA
      const upstream = await fetch(NASA_URL, {
        headers: { "User-Agent": "ExoplanetExplorer/1.0" },
      });
      if (!upstream.ok) {
        return new Response(JSON.stringify({ error: `NASA API ${upstream.status}` }), {
          status: 502, headers: { "Content-Type": "application/json", ...CORS },
        });
      }
      const body = await upstream.text();

      // 3. Write to KV in the background so we don't delay the response
      if (env.NASA_CACHE) {
        ctx.waitUntil(
          env.NASA_CACHE.put(KV_KEY, body, { expirationTtl: CACHE_TTL_SECONDS })
        );
      }

      return new Response(body, {
        headers: { "Content-Type": "application/json", ...CORS, "X-Cache": "MISS" },
      });
    }

    // ── /api/papers — NASA ADS proxy (token kept server-side) ─────────────────
    if (url.pathname === "/api/papers") {
      if (!env.ADS_TOKEN) {
        return new Response(JSON.stringify({ error: "ADS_TOKEN not configured" }), {
          status: 503, headers: { "Content-Type": "application/json", ...CORS },
        });
      }

      const q = url.searchParams.get("q") || "";
      const rows = Math.min(parseInt(url.searchParams.get("rows") || "5", 10), 10);
      const adsUrl =
        "https://api.adsabs.harvard.edu/v1/search/query?" +
        new URLSearchParams({ q, fl: "title,bibcode,year,author,abstract,identifier", rows, sort: "date desc" });

      const upstream = await fetch(adsUrl, {
        headers: { Authorization: `Bearer ${env.ADS_TOKEN}`, "Content-Type": "application/json" },
      });

      return new Response(upstream.body, {
        status: upstream.status,
        headers: { "Content-Type": "application/json", ...CORS },
      });
    }

    // ── /nasa-tap/* — Generic NASA TAP proxy (spectra, ad-hoc queries) ─────────
    if (url.pathname.startsWith("/nasa-tap/")) {
      const nasaPath = url.pathname.replace("/nasa-tap", "/TAP");
      const nasaUrl = `https://exoplanetarchive.ipac.caltech.edu${nasaPath}${url.search}`;

      const upstream = await fetch(nasaUrl, {
        headers: { "User-Agent": "ExoplanetExplorer/1.0" },
      });

      return new Response(upstream.body, {
        status: upstream.status,
        headers: {
          "Content-Type": upstream.headers.get("Content-Type") || "text/plain",
          ...CORS,
        },
      });
    }

    // ── Static assets + SPA fallback ──────────────────────────────────────────
    return env.ASSETS.fetch(request);
  },
};
