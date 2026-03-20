import { useState, useEffect } from "react";

// In-memory cache — persists while the tab is open
const CACHE = new Map();

/**
 * Fetch transmission/emission spectra for a planet from the NASA Exoplanet
 * Archive `spectra` table via the /nasa-tap proxy.
 *
 * Returns { data: Point[], loading, error }
 * where Point = { wl, wlBeg, wlEnd, depth, err1, err2, type, instrument, facility, ref }
 * depth is in ppm (parts per million of transit depth = (Rp/Rs)² × 1e6).
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
      "SELECT pl_name,wl,wlbeg,wlend,dp,dpe1,dpe2,trtype,instrument,facility,reference",
      "FROM spectra",
      `WHERE pl_name='${planetName.replace(/'/g, "''")}'`,
      "ORDER BY trtype ASC, wl ASC",
    ].join(" ");

    const url = `/nasa-tap/sync?${new URLSearchParams({ query, format: "json" })}`;

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        // NASA TAP returns { data: [...row-objects] } with format=json
        const rows = Array.isArray(json) ? json : json.data ?? [];
        const points = rows
          .filter((r) => r.wl != null && r.dp != null)
          .map((r) => ({
            wl: parseFloat(r.wl),
            wlBeg: r.wlbeg != null ? parseFloat(r.wlbeg) : null,
            wlEnd: r.wlend != null ? parseFloat(r.wlend) : null,
            // dp is (Rp/Rs)^2 as a fraction; multiply by 1e6 for ppm
            depth: parseFloat(r.dp) * 1e6,
            err1: r.dpe1 != null ? Math.abs(parseFloat(r.dpe1)) * 1e6 : null,
            err2: r.dpe2 != null ? Math.abs(parseFloat(r.dpe2)) * 1e6 : null,
            type: (r.trtype || "transmission").toLowerCase(),
            instrument: r.instrument || null,
            facility: r.facility || null,
            ref: r.reference || null,
          }));

        CACHE.set(key, points);
        setData(points);
      })
      .catch((err) => {
        setError(err.message);
        setData([]);
      })
      .finally(() => setLoading(false));
  }, [planetName]);

  return { data, loading, error };
}
