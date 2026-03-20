import { useState, useEffect } from "react";

const CACHE = new Map();

/**
 * Fetches spectroscopic observation metadata from the NASA Exoplanet Archive
 * `spectra` table. Each row describes one published observation (instrument,
 * wavelength range, spec type, ADS bibcode) — not individual data points.
 *
 * Returns { data: Observation[], loading, error }
 * where Observation = { specType, instrument, facility, minWl, maxWl, numPoints, bibcode }
 */
export function useExoplanetSpectra(planetName) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!planetName) return;

    const key = `spectra:${planetName}`;
    if (CACHE.has(key)) {
      setData(CACHE.get(key));
      return;
    }

    setLoading(true);
    setError(null);

    const query = [
      "SELECT pl_name,spec_type,instrument,facility,minwavelng,maxwavelng,num_datapoints,bibcode",
      "FROM spectra",
      `WHERE pl_name='${planetName.replace(/'/g, "''")}'`,
      "ORDER BY minwavelng ASC",
    ].join(" ");

    const url = `/nasa-tap/sync?${new URLSearchParams({ query, format: "json" })}`;

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        const rows = Array.isArray(json) ? json : json.data ?? [];
        const observations = rows.map((r) => ({
          specType: r.spec_type || "Unknown",
          instrument: r.instrument || null,
          facility: r.facility || null,
          minWl: r.minwavelng != null ? parseFloat(r.minwavelng) : null,
          maxWl: r.maxwavelng != null ? parseFloat(r.maxwavelng) : null,
          numPoints: r.num_datapoints != null ? parseInt(r.num_datapoints) : null,
          bibcode: r.bibcode || null,
        }));
        CACHE.set(key, observations);
        setData(observations);
      })
      .catch((err) => {
        setError(err.message);
        setData([]);
      })
      .finally(() => setLoading(false));
  }, [planetName]);

  return { data, loading, error };
}
