import { useState, useEffect, useMemo, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import StarField from "../components/StarField";
import Planet3D from "../components/Planet3D";
import TypeBadge from "../components/TypeBadge";
import Stat from "../components/Stat";
import StarSystemDiagram from "../components/StarSystemDiagram";
import { useNASAExoplanets } from "../hooks/useNASAExoplanets";

// ─── Loading pulse ring while Three.js initializes ────────────────────────────
function PlanetLoadingRing({ size, planet }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: `2px solid ${planet.accentColor ?? "#888"}30`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: size * 0.55,
          height: size * 0.55,
          borderRadius: "50%",
          background: `radial-gradient(circle at 38% 36%, ${planet.accentColor ?? "#888"}40, transparent 70%)`,
          animation: "pulse 1.8s ease-in-out infinite alternate",
        }}
      />
    </div>
  );
}

export default function PlanetPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [entered, setEntered] = useState(false);
  const { planets, loading } = useNASAExoplanets();

  const planet = useMemo(
    () => planets.find((p) => p.slug === slug),
    [planets, slug]
  );

  const currentIndex = useMemo(
    () => planets.findIndex((p) => p.slug === slug),
    [planets, slug]
  );

  const prevPlanet = planets[currentIndex - 1] ?? null;
  const nextPlanet = planets[currentIndex + 1] ?? null;

  useEffect(() => {
    window.scrollTo(0, 0);
    setEntered(false);
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, [slug]);

  // ─── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#020204",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <style>{`@keyframes pulse { 0% { opacity: 0.4; } 100% { opacity: 0.8; } }`}</style>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.06)",
              margin: "0 auto 16px",
              animation: "pulse 1.5s ease-in-out infinite alternate",
            }}
          />
          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.25)", letterSpacing: "0.12em" }}>
            LOADING
          </p>
        </div>
      </div>
    );
  }

  // ─── Not found ──────────────────────────────────────────────────────────────
  if (!planet) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#020204",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
        }}
      >
        <div style={{ fontSize: 64, opacity: 0.12, color: "#fff" }}>◎</div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: "#fff", fontWeight: 700 }}>
          Planet not found
        </h1>
        <button
          onClick={() => navigate("/catalog")}
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            color: "rgba(255,255,255,0.4)",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          ← Back to catalog
        </button>
      </div>
    );
  }

  const tempC = planet.tempK != null ? planet.tempK - 273 : null;
  const tempF = tempC != null ? Math.round(tempC * 1.8 + 32) : null;
  const GLOBE_SIZE = 300;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: planet.bgGradient,
        position: "relative",
        overflow: "hidden",
        transition: "opacity 0.5s ease",
        opacity: entered ? 1 : 0,
      }}
    >
      <style>{`
        @keyframes twinkle { 0% { opacity: 0.2; } 100% { opacity: 1; } }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes pulse { 0% { opacity: 0.4; } 100% { opacity: 0.8; } }
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes planetRotate { 0% { filter: hue-rotate(0deg); } 100% { filter: hue-rotate(3deg); } }
      `}</style>

      <StarField count={150} />

      <div style={{ position: "relative", zIndex: 1, padding: "88px 28px 40px", maxWidth: 920, margin: "0 auto" }}>

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.55)",
            padding: "8px 16px",
            borderRadius: 8,
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            transition: "all 0.2s",
            backdropFilter: "blur(10px)",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.55)"; }}
        >
          ← Back
        </button>

        {/* Main content */}
        <div style={{ marginTop: 32, display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}>

          {/* ── 3D Globe ─── */}
          <div style={{ animation: "float 9s ease-in-out infinite" }}>
            <Suspense fallback={<PlanetLoadingRing size={GLOBE_SIZE} planet={planet} />}>
              <Planet3D planet={planet} size={GLOBE_SIZE} interactive={true} />
            </Suspense>
          </div>

          {/* Drag hint */}
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.2)", marginTop: -8 }}>
            drag to rotate
          </div>

          {/* Title */}
          <div style={{ textAlign: "center" }}>
            <TypeBadge type={planet.type} habitableZone={planet.habitableZone} accent={planet.accentColor} />
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(32px, 6vw, 52px)", fontWeight: 700, color: "#fff", margin: "14px 0 6px", letterSpacing: "-0.02em" }}>
              {planet.name}
            </h1>
            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: "0.15em" }}>
              {planet.year ? `Discovered ${planet.year}` : "Year unknown"}{planet.discovery ? ` · ${planet.discovery}` : ""}
            </p>
          </div>

          {/* Description */}
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, lineHeight: 1.75, color: "rgba(255,255,255,0.58)", maxWidth: 580, textAlign: "center" }}>
            {planet.description}
          </p>

          {/* Stats row */}
          <div style={{
            display: "grid",
            gridTemplateColumns: planet.esi != null ? "repeat(5, 1fr)" : "repeat(4, 1fr)",
            gap: 18,
            width: "100%",
            maxWidth: 540,
            padding: "22px",
            background: "rgba(255,255,255,0.03)",
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.06)",
            backdropFilter: "blur(20px)",
          }}>
            <Stat label="Distance" value={planet.distance ?? "—"} unit={planet.distance ? "ly" : ""} accent={planet.accentColor} />
            <Stat label="Radius" value={planet.radius ?? "—"} unit={planet.radius ? "R⊕" : ""} accent={planet.accentColor} />
            <Stat label="Mass" value={planet.mass ?? "—"} unit={planet.mass ? "M⊕" : ""} accent={planet.accentColor} />
            <Stat label="Gravity" value={planet.surfaceGravity ?? "—"} unit={planet.surfaceGravity ? "g" : ""} accent={planet.accentColor} />
            {planet.esi != null && (
              <Stat label="ESI" value={planet.esi} unit="" accent={planet.esi >= 0.8 ? "#60e060" : planet.esi >= 0.6 ? "#c0e060" : planet.accentColor} />
            )}
          </div>

          {/* Detail cards */}
          <div style={{ width: "100%", maxWidth: 580, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

            {/* Surface Conditions */}
            <DetailCard>
              <CardLabel>Surface Conditions</CardLabel>
              {tempC != null ? (
                <>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, color: planet.tempK > 500 ? "#ff6b4a" : planet.tempK > 260 ? "#ffc44a" : "#4ac8ff", fontWeight: 700, lineHeight: 1 }}>
                    {tempC > 0 ? "+" : ""}{tempC}°C
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.32)", marginTop: 3 }}>
                    ({tempF}°F / {planet.tempK}K)
                  </div>
                </>
              ) : (
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>Temperature unknown</div>
              )}
              {planet.orbitalPeriod != null && (
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 10, lineHeight: 1.5 }}>
                  Orbital period: <strong style={{ color: "rgba(255,255,255,0.8)" }}>{planet.orbitalPeriod} days</strong>
                </div>
              )}
            </DetailCard>

            {/* Host Star */}
            <DetailCard>
              <CardLabel>Host Star</CardLabel>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>
                <strong style={{ color: "#fff" }}>{planet.starType ?? "Unknown"}</strong>
                {planet.starTemp && <><br />Temperature: {planet.starTemp.toLocaleString()}K</>}
              </div>
              <CardLabel style={{ marginTop: 14 }}>Atmosphere</CardLabel>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.48)", lineHeight: 1.5, marginTop: 4 }}>
                {planet.atmosphere}
              </div>
            </DetailCard>
          </div>

          {/* Experience card */}
          <div style={{ width: "100%", maxWidth: 580, padding: "20px 24px", background: `${planet.accentColor}08`, borderRadius: 14, border: `1px solid ${planet.accentColor}18` }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: planet.accentColor, marginBottom: 10, opacity: 0.72 }}>
              ✦ What you'd experience
            </div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "rgba(255,255,255,0.58)", lineHeight: 1.75 }}>
              {planet.habitableZone ? (
                <>
                  Standing on {planet.name}, you'd weigh{" "}
                  <strong style={{ color: "rgba(255,255,255,0.85)" }}>
                    {planet.surfaceGravity ? `${Math.round(planet.surfaceGravity * 100)}%` : "an unknown amount"}
                  </strong>{" "}
                  of your Earth weight. The sky would glow in shades of{" "}
                  <strong style={{ color: planet.accentColor }}>
                    {(planet.starTemp ?? 5000) < 3500 ? "deep crimson" : (planet.starTemp ?? 5000) < 5000 ? "amber orange" : "warm gold"}
                  </strong>{" "}
                  beneath a {(planet.starType ?? "").toLowerCase() || "distant"} star.
                  {planet.orbitalPeriod && <> A year here lasts just <strong style={{ color: "rgba(255,255,255,0.85)" }}>{planet.orbitalPeriod} Earth days</strong>.</>}
                </>
              ) : (
                <>
                  This is no place for humans.{" "}
                  {tempC != null && planet.tempK > 1000 ? `At ${tempC}°C, the surface is hot enough to melt rock. ` : ""}
                  {tempC != null && planet.tempK < 200 ? `At ${tempC}°C, the cold would be lethal instantly. ` : ""}
                  {(planet.type === "Gas Giant" || planet.type === "Hot Jupiter") ? "With no solid surface, you'd sink endlessly into crushing gas layers. " : ""}
                  {planet.surfaceGravity != null && <>Gravity pulls at <strong style={{ color: "rgba(255,255,255,0.85)" }}>{planet.surfaceGravity}g</strong> — </>}
                  {planet.orbitalPeriod != null && <>a year passes in just <strong style={{ color: "rgba(255,255,255,0.85)" }}>{planet.orbitalPeriod} Earth days</strong>.</>}
                </>
              )}
            </div>
          </div>

          {/* Comparison bars */}
          <div style={{ width: "100%", maxWidth: 580, padding: "20px 24px", background: "rgba(255,255,255,0.02)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.05)" }}>
            <CardLabel>Compared to Earth</CardLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 16 }}>
              {[
                { label: "Radius", value: planet.radius, unit: "× Earth", max: 22 },
                { label: "Mass", value: planet.mass != null ? Math.min(planet.mass, 400) : null, unit: "× Earth", max: 400, rawValue: planet.mass },
                { label: "Surface Gravity", value: planet.surfaceGravity, unit: "g", max: 3 },
              ].map(({ label, value, unit, max, rawValue }) => (
                <div key={label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.38)" }}>{label}</span>
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: planet.accentColor }}>
                      {rawValue ?? value != null ? `${rawValue ?? value} ${unit}` : "unknown"}
                    </span>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                    {value != null && (
                      <div style={{ height: "100%", width: `${Math.min((value / max) * 100, 100)}%`, background: `linear-gradient(90deg, ${planet.accentColor}70, ${planet.accentColor})`, borderRadius: 2, transition: "width 1s ease" }} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Star System Diagram */}
          <StarSystemDiagram planet={planet} allPlanets={planets} />

          {/* Prev / Next */}
          {(prevPlanet || nextPlanet) && (
            <div style={{ width: "100%", maxWidth: 580, display: "flex", gap: 10, marginBottom: 40 }}>
              {prevPlanet && <NavLink planet={prevPlanet} direction="prev" navigate={navigate} />}
              {nextPlanet && <NavLink planet={nextPlanet} direction="next" navigate={navigate} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Small helpers ─────────────────────────────────────────────────────────────
function DetailCard({ children }) {
  return (
    <div style={{ padding: "18px 20px", background: "rgba(255,255,255,0.03)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)" }}>
      {children}
    </div>
  );
}
function CardLabel({ children, style }) {
  return (
    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.28)", marginBottom: 8, ...style }}>
      {children}
    </div>
  );
}

function NavLink({ planet, direction, navigate }) {
  const [hovered, setHovered] = useState(false);
  const isPrev = direction === "prev";
  return (
    <button
      onClick={() => navigate(`/planet/${planet.slug}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: 1,
        padding: "12px 16px",
        background: hovered ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)",
        border: `1px solid ${hovered ? (planet.accentColor ?? "#fff") + "40" : "rgba(255,255,255,0.06)"}`,
        borderRadius: 12,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexDirection: isPrev ? "row" : "row-reverse",
        transition: "all 0.2s",
      }}
    >
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, color: hovered ? (planet.accentColor ?? "#fff") : "rgba(255,255,255,0.2)", transition: "color 0.2s", flexShrink: 0 }}>
        {isPrev ? "←" : "→"}
      </span>
      <div style={{ textAlign: isPrev ? "left" : "right", overflow: "hidden" }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.22)", marginBottom: 2 }}>
          {isPrev ? "Previous" : "Next"}
        </div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 13, color: "#fff", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {planet.name}
        </div>
      </div>
    </button>
  );
}
