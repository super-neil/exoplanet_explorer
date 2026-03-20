import { useState, useEffect } from "react";

const CACHE = new Map();

/**
 * Fetch recent papers from NASA ADS for a given planet name.
 * The /api/papers endpoint proxies through the Cloudflare Worker,
 * which injects the ADS_TOKEN secret server-side.
 *
 * Returns { papers: Paper[], loading, error, unavailable }
 * `unavailable` is true when the Worker has no ADS_TOKEN configured.
 *
 * Paper = { title, authors, year, abstract, bibcode, url }
 */
export function useADSPapers(planetName) {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    if (!planetName) return;

    const key = `ads:${planetName}`;
    if (CACHE.has(key)) {
      const cached = CACHE.get(key);
      if (cached.unavailable) { setUnavailable(true); return; }
      setPapers(cached);
      return;
    }

    setLoading(true);
    setError(null);
    setUnavailable(false);

    // Quote the planet name for ADS full-text search
    const q = `"${planetName}" exoplanet`;
    const url = `/api/papers?${new URLSearchParams({ q, rows: 5 })}`;

    fetch(url)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) {
          // Worker returned 503 = ADS_TOKEN not set
          CACHE.set(key, { unavailable: true });
          setUnavailable(true);
          return;
        }

        const docs = json?.response?.docs ?? [];
        const mapped = docs.map((doc) => ({
          title: Array.isArray(doc.title) ? doc.title[0] : (doc.title ?? ""),
          authors: Array.isArray(doc.author)
            ? (doc.author.length > 3
                ? [...doc.author.slice(0, 3), "et al."]
                : doc.author)
            : [],
          year: doc.year ?? "?",
          abstract: doc.abstract ?? "",
          bibcode: doc.bibcode ?? "",
          url: doc.bibcode
            ? `https://ui.adsabs.harvard.edu/abs/${encodeURIComponent(doc.bibcode)}`
            : null,
        }));

        CACHE.set(key, mapped);
        setPapers(mapped);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [planetName]);

  return { papers, loading, error, unavailable };
}
