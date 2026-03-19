import { useState, useMemo } from "react";
import StarField from "../components/StarField";
import PlanetCard from "../components/PlanetCard";
import { useNASAExoplanets } from "../hooks/useNASAExoplanets";

const PAGE_SIZE = 24;

const TYPE_FILTERS = [
  "all", "habitable", "Rocky", "Super-Earth", "Gas Giant",
  "Hot Jupiter", "Lava World", "Water World", "Neptune-like",
];

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.04)",
        borderRadius: 16,
        padding: 24,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 100,
          height: 100,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.05)",
          animation: "pulse 1.6s ease-in-out infinite alternate",
        }}
      />
      <div style={{ width: "70%", height: 14, borderRadius: 4, background: "rgba(255,255,255,0.05)", animation: "pulse 1.6s ease-in-out infinite alternate" }} />
      <div style={{ width: "40%", height: 10, borderRadius: 4, background: "rgba(255,255,255,0.04)", animation: "pulse 1.6s ease-in-out infinite alternate 0.2s" }} />
    </div>
  );
}

export default function CatalogPage() {
  const { planets, loading, error, totalCount } = useNASAExoplanets();

  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("default");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const setFilterAndReset = (val) => { setFilter(val); setPage(1); };
  const setSortAndReset = (val) => { setSort(val); setPage(1); };

  const filtered = useMemo(() => {
    let list = planets;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.type?.toLowerCase().includes(q) ||
          p.starType?.toLowerCase().includes(q) ||
          p.discovery?.toLowerCase().includes(q)
      );
    }
    if (filter === "habitable") list = list.filter((p) => p.habitableZone);
    else if (filter !== "all") list = list.filter((p) => p.type === filter);

    if (sort === "distance-asc") list = [...list].sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    else if (sort === "distance-desc") list = [...list].sort((a, b) => (b.distance ?? 0) - (a.distance ?? 0));
    else if (sort === "mass-asc") list = [...list].sort((a, b) => (a.mass ?? Infinity) - (b.mass ?? Infinity));
    else if (sort === "year-asc") list = [...list].sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999));
    else if (sort === "year-desc") list = [...list].sort((a, b) => (b.year ?? 0) - (a.year ?? 0));

    return list;
  }, [planets, filter, sort, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pagePlanets = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const safePageCount = Math.min(totalPages, 5);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(ellipse at 50% 0%, #0d0a15 0%, #06050a 50%, #020204 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes twinkle { 0% { opacity: 0.2; } 100% { opacity: 1; } }
        @keyframes planetRotate { 0% { filter: hue-rotate(0deg); } 100% { filter: hue-rotate(3deg); } }
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0% { opacity: 0.4; } 100% { opacity: 0.7; } }
      `}</style>

      <StarField count={250} />

      <div style={{ position: "relative", zIndex: 1, padding: "100px 28px 60px", maxWidth: 1060, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(255,255,255,0.22)", marginBottom: 12 }}>
            Kepler · TESS · Radial Velocity · Transit
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(36px, 6vw, 56px)", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: 10 }}>
            Exoplanet Catalog
          </h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "rgba(255,255,255,0.3)", fontWeight: 300 }}>
            {loading
              ? "Loading confirmed exoplanets from NASA…"
              : error
                ? `Showing cached data · ${filtered.length.toLocaleString()} worlds`
                : `${filtered.length.toLocaleString()} of ${totalCount.toLocaleString()} confirmed worlds`}
          </p>
          {error && (
            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#ff9044", marginTop: 6, letterSpacing: "0.08em" }}>
              ⚠ NASA API unavailable — showing featured data
            </p>
          )}
        </div>

        {/* Search */}
        <div style={{ maxWidth: 420, margin: "0 auto 24px" }}>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search name, type, star, method…"
            style={{
              width: "100%",
              padding: "10px 16px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              color: "#fff",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              outline: "none",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.26)")}
            onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
          />
        </div>

        {/* Type filters */}
        <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap", marginBottom: 12 }}>
          {TYPE_FILTERS.map((t) => (
            <button
              key={t}
              onClick={() => setFilterAndReset(t)}
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 10,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                padding: "6px 13px",
                borderRadius: 6,
                border: filter === t ? "1px solid rgba(255,255,255,0.3)" : "1px solid rgba(255,255,255,0.07)",
                background: filter === t ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.02)",
                color: filter === t ? "#fff" : "rgba(255,255,255,0.32)",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {t === "all" ? "All Worlds" : t === "habitable" ? "✦ Habitable" : t}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 38 }}>
          <select
            value={sort}
            onChange={(e) => setSortAndReset(e.target.value)}
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 10,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              padding: "7px 14px",
              borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.03)",
              color: "rgba(255,255,255,0.38)",
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="default">Default Order</option>
            <option value="year-desc">Newest Discovery</option>
            <option value="year-asc">Oldest Discovery</option>
            <option value="distance-asc">Nearest First</option>
            <option value="distance-desc">Farthest First</option>
            <option value="mass-asc">Lightest First</option>
          </select>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
            {Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : pagePlanets.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14 }}>
            {pagePlanets.map((planet, i) => (
              <PlanetCard key={planet.slug + planet.name} planet={planet} index={i} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: 48, opacity: 0.15, color: "#fff" }}>◎</div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "rgba(255,255,255,0.3)", marginTop: 12 }}>
              No worlds match your search.
            </p>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 44, flexWrap: "wrap" }}>
            <PagBtn label="←" disabled={page === 1} onClick={() => setPage(page - 1)} />

            {/* First page */}
            {page > 3 && (
              <>
                <PagBtn label="1" active={page === 1} onClick={() => setPage(1)} />
                {page > 4 && <span style={{ color: "rgba(255,255,255,0.2)", fontFamily: "'Space Mono', monospace", fontSize: 12 }}>…</span>}
              </>
            )}

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p;
              if (totalPages <= 5) p = i + 1;
              else if (page <= 3) p = i + 1;
              else if (page >= totalPages - 2) p = totalPages - 4 + i;
              else p = page - 2 + i;
              return (
                <PagBtn key={p} label={String(p)} active={p === page} onClick={() => setPage(p)} />
              );
            })}

            {/* Last page */}
            {page < totalPages - 2 && (
              <>
                {page < totalPages - 3 && <span style={{ color: "rgba(255,255,255,0.2)", fontFamily: "'Space Mono', monospace", fontSize: 12 }}>…</span>}
                <PagBtn label={String(totalPages)} active={page === totalPages} onClick={() => setPage(totalPages)} />
              </>
            )}

            <PagBtn label="→" disabled={page === totalPages} onClick={() => setPage(page + 1)} />
          </div>
        )}

        {!loading && totalPages > 1 && (
          <p style={{ textAlign: "center", fontFamily: "'Space Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.18)", marginTop: 14, letterSpacing: "0.08em" }}>
            PAGE {page} / {totalPages.toLocaleString()} · {filtered.length.toLocaleString()} WORLDS
          </p>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 56, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.14)" }}>
            Live data from NASA Exoplanet Archive · pscomppars table · Updated every 6 hours
          </p>
        </div>
      </div>
    </div>
  );
}

function PagBtn({ label, onClick, active, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: 12,
        padding: "7px 13px",
        borderRadius: 6,
        border: active ? "1px solid rgba(255,255,255,0.3)" : "1px solid rgba(255,255,255,0.07)",
        background: active ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.02)",
        color: disabled ? "rgba(255,255,255,0.18)" : active ? "#fff" : "rgba(255,255,255,0.45)",
        cursor: disabled ? "default" : "pointer",
        transition: "all 0.2s",
        minWidth: 36,
      }}
    >
      {label}
    </button>
  );
}
