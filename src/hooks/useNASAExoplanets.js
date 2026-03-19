import { useState, useEffect } from "react";
import { nasaRowToPlanet, slugify } from "../lib/planetUtils";
import { EXOPLANETS as FEATURED } from "../data/exoplanets";

const CACHE_KEY = "nasa_exoplanets_v3";
const CACHE_TTL = 3600 * 6 * 1000; // 6 hours

// Normalize a name to bare alphanumeric for fuzzy matching.
// "TRAPPIST-1 e" and "TRAPPIST-1e" both become "trappist1e".
function norm(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Build lookup maps for featured planets:
//   normKey  → featured planet  (for fuzzy match on NASA names)
//   slug     → featured planet  (for exact slug lookups from <Link>s)
const FEATURED_BY_NORM = new Map();
for (const p of FEATURED) {
  FEATURED_BY_NORM.set(norm(p.name), p);
  for (const alias of p.aliases ?? []) FEATURED_BY_NORM.set(norm(alias), p);
}
const FEATURED_BY_SLUG = new Map(FEATURED.map((p) => [p.slug, p]));

function findFeatured(nasaName) {
  return FEATURED_BY_NORM.get(norm(nasaName)) ?? null;
}

const NASA_COLUMNS = [
  "pl_name",
  "hostname",
  "pl_rade",
  "pl_bmasse",
  "pl_orbper",
  "pl_eqt",
  "st_teff",
  "sy_dist",
  "disc_year",
  "discoverymethod",
  "st_spectype",
  "pl_controv_flag",
].join(",");

// Use Vite dev proxy in development; direct URL in production
const TAP_BASE = import.meta.env.DEV
  ? "/nasa-tap/sync"
  : "https://exoplanetarchive.ipac.caltech.edu/TAP/sync";

const TAP_URL =
  TAP_BASE +
  "?" +
  new URLSearchParams({
    query: `SELECT ${NASA_COLUMNS} FROM pscomppars WHERE pl_controv_flag=0`,
    format: "json",
  });

function readCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    return data;
  } catch {
    return null;
  }
}

function writeCache(data) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // quota exceeded — ignore
  }
}

export function useNASAExoplanets() {
  const [planets, setPlanets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const cached = readCache();
      if (cached) {
        if (!cancelled) {
          setPlanets(cached);
          setTotalCount(cached.length);
          setLoading(false);
        }
        return;
      }

      try {
        const res = await fetch(TAP_URL);
        if (!res.ok) throw new Error(`NASA API ${res.status}`);
        const raw = await res.json();
        const rows = Array.isArray(raw) ? raw : raw.data ?? [];

        const mapped = rows
          .filter((r) => r.pl_name)
          .map((r) => {
            const enhanced = findFeatured(r.pl_name);
            const planet = nasaRowToPlanet(r, enhanced);
            // If this NASA planet matches a featured one, use the featured slug
            // so that existing links (/planet/trappist-1e) keep working.
            if (enhanced) planet.slug = enhanced.slug;
            return planet;
          })
          .sort((a, b) => {
            const aFeat = FEATURED_BY_SLUG.has(a.slug) ? 1 : 0;
            const bFeat = FEATURED_BY_SLUG.has(b.slug) ? 1 : 0;
            if (aFeat !== bFeat) return bFeat - aFeat;
            return (b.year ?? 0) - (a.year ?? 0);
          });

        writeCache(mapped);
        if (!cancelled) {
          setPlanets(mapped);
          setTotalCount(mapped.length);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          const fallback = FEATURED.map((p) => ({ ...p, isNASA: false }));
          setPlanets(fallback);
          setTotalCount(fallback.length);
          setError(err.message);
          setLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { planets, loading, error, totalCount };
}
