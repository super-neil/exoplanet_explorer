import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

// Kepler's 3rd law: semi-major axis (AU) from orbital period (days)
function periodToAU(days) {
  return Math.pow(days / 365.25, 2 / 3);
}

function starColorFromTemp(teff) {
  if (!teff) return "#fff4d0";
  if (teff > 10000) return "#b0c8ff";
  if (teff > 7500) return "#d4e4ff";
  if (teff > 6000) return "#fff4d0";
  if (teff > 5200) return "#ffe0a0";
  if (teff > 3700) return "#ffb060";
  return "#ff6633";
}

export default function StarSystemDiagram({ planet, allPlanets }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(null);

  const systemPlanets = useMemo(() => {
    if (!planet.hostname) return [];
    return allPlanets
      .filter((p) => p.hostname === planet.hostname && p.orbitalPeriod != null)
      .sort((a, b) => a.orbitalPeriod - b.orbitalPeriod);
  }, [planet.hostname, allPlanets]);

  if (systemPlanets.length < 2) return null;

  const W = 560, H = 220;
  const cx = W / 2, cy = H / 2;
  const maxAU = Math.max(...systemPlanets.map((p) => periodToAU(p.orbitalPeriod)));
  const maxR = Math.min(cx, cy) * 0.88;
  const starColor = starColorFromTemp(planet.starTemp);

  // Spread planets evenly around their orbits so they don't overlap
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 580,
        padding: "20px 24px",
        background: "rgba(255,255,255,0.02)",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          color: "rgba(255,255,255,0.28)",
          marginBottom: 14,
        }}
      >
        Star System · {planet.hostname}
      </div>

      <svg
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        style={{ overflow: "visible" }}
        onMouseLeave={() => setHovered(null)}
      >
        {/* Star glow */}
        <circle cx={cx} cy={cy} r={18} fill={starColor} opacity={0.12} />
        <circle cx={cx} cy={cy} r={10} fill={starColor} opacity={0.3} />
        <circle cx={cx} cy={cy} r={6} fill={starColor} />

        {systemPlanets.map((p, idx) => {
          const au = periodToAU(p.orbitalPeriod);
          const orbitR = (au / maxAU) * maxR;
          const angle = (idx / systemPlanets.length) * 2 * Math.PI - Math.PI / 2;
          const px = cx + orbitR * Math.cos(angle);
          const py = cy + orbitR * Math.sin(angle);
          const dotR = Math.max(3, Math.min(7, (p.radius ?? 1) * 1.8));
          const isCurrent = p.slug === planet.slug;
          const isHov = hovered === p.slug;
          const color = p.accentColor ?? "#aaa";

          return (
            <g
              key={p.slug}
              style={{ cursor: "pointer" }}
              onClick={() => navigate(`/planet/${p.slug}`)}
              onMouseEnter={() => setHovered(p.slug)}
            >
              {/* Orbit ring */}
              <circle
                cx={cx}
                cy={cy}
                r={orbitR}
                fill="none"
                stroke="rgba(255,255,255,0.07)"
                strokeWidth={1}
              />
              {/* Planet dot */}
              {(isCurrent || isHov) && (
                <circle cx={px} cy={py} r={dotR + 4} fill="none" stroke={color} strokeWidth={1} opacity={0.5} />
              )}
              <circle
                cx={px}
                cy={py}
                r={dotR}
                fill={color}
                opacity={isCurrent ? 1 : 0.65}
              />
            </g>
          );
        })}

        {/* Tooltip */}
        {hovered && (() => {
          const p = systemPlanets.find((x) => x.slug === hovered);
          if (!p) return null;
          const au = periodToAU(p.orbitalPeriod);
          const orbitR = (au / maxAU) * maxR;
          const idx = systemPlanets.indexOf(p);
          const angle = (idx / systemPlanets.length) * 2 * Math.PI - Math.PI / 2;
          const px = cx + orbitR * Math.cos(angle);
          const py = cy + orbitR * Math.sin(angle);
          const tx = px + (px < cx ? -8 : 8);
          const anchor = px < cx ? "end" : "start";
          return (
            <text
              x={tx}
              y={py + 4}
              textAnchor={anchor}
              fill="rgba(255,255,255,0.7)"
              fontSize={9}
              fontFamily="'Space Mono', monospace"
            >
              {p.name}
            </text>
          );
        })()}
      </svg>

      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          marginTop: 10,
        }}
      >
        {systemPlanets.map((p) => (
          <button
            key={p.slug}
            onClick={() => navigate(`/planet/${p.slug}`)}
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 9,
              letterSpacing: "0.06em",
              padding: "3px 8px",
              borderRadius: 4,
              border: `1px solid ${p.slug === planet.slug ? (p.accentColor ?? "#fff") + "60" : "rgba(255,255,255,0.08)"}`,
              background: p.slug === planet.slug ? "rgba(255,255,255,0.07)" : "transparent",
              color: p.slug === planet.slug ? "#fff" : "rgba(255,255,255,0.4)",
              cursor: "pointer",
            }}
          >
            {p.name}
          </button>
        ))}
      </div>
    </div>
  );
}
