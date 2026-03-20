import { useMemo } from "react";

// Color by facility/instrument
function instrumentColor(facility, instrument) {
  const f = (facility || "").toUpperCase();
  const i = (instrument || "").toUpperCase();
  if (f.includes("JWST")) {
    if (i.includes("MIRI")) return "#f97316";   // orange
    if (i.includes("NIRCAM")) return "#a78bfa"; // purple
    return "#2dd4bf"; // teal — NIRSpec / default JWST
  }
  if (f.includes("HST") || f.includes("HUBBLE")) return "#60a5fa"; // blue
  if (f.includes("SPITZER")) return "#f59e0b"; // amber
  return "rgba(255,255,255,0.5)"; // fallback
}

function facilityLabel(facility, instrument) {
  const f = (facility || "").toUpperCase();
  const i = (instrument || "").toUpperCase();
  if (f.includes("JWST")) return `JWST/${instrument || "?"}`;
  if (f.includes("HST") || f.includes("HUBBLE")) return `HST/${instrument || "?"}`;
  if (f.includes("SPITZER")) return "Spitzer";
  return instrument || facility || "Unknown";
}

const CHART_PAD = { top: 20, right: 24, bottom: 44, left: 58 };

export default function SpectraChart({ data, accentColor, planetName }) {
  // Separate transmission vs emission
  const transmission = useMemo(() => data.filter((d) => d.type !== "emission"), [data]);
  const emission = useMemo(() => data.filter((d) => d.type === "emission"), [data]);
  const activeSet = transmission.length > 0 ? transmission : emission;
  const chartTitle = transmission.length > 0 ? "Transmission Spectrum" : "Emission Spectrum";

  const { minWl, maxWl, minDepth, maxDepth } = useMemo(() => {
    if (activeSet.length === 0) return { minWl: 0, maxWl: 1, minDepth: 0, maxDepth: 1 };
    const wls = activeSet.map((d) => d.wl);
    const depths = activeSet.map((d) => d.depth);
    const errHi = activeSet.map((d) => d.depth + (d.err1 ?? 0));
    const errLo = activeSet.map((d) => d.depth - (d.err2 ?? 0));
    return {
      minWl: Math.min(...wls) * 0.97,
      maxWl: Math.max(...wls) * 1.03,
      minDepth: Math.min(...errLo) * 0.95,
      maxDepth: Math.max(...errHi) * 1.05,
    };
  }, [activeSet]);

  // Unique instruments for the legend
  const instruments = useMemo(() => {
    const seen = new Map();
    activeSet.forEach((d) => {
      const key = `${d.facility}:${d.instrument}`;
      if (!seen.has(key)) seen.set(key, { facility: d.facility, instrument: d.instrument, color: instrumentColor(d.facility, d.instrument) });
    });
    return Array.from(seen.values());
  }, [activeSet]);

  const W = 560;
  const H = 220;
  const innerW = W - CHART_PAD.left - CHART_PAD.right;
  const innerH = H - CHART_PAD.top - CHART_PAD.bottom;

  const toX = (wl) => CHART_PAD.left + ((wl - minWl) / (maxWl - minWl)) * innerW;
  const toY = (depth) => CHART_PAD.top + innerH - ((depth - minDepth) / (maxDepth - minDepth)) * innerH;

  // X-axis ticks (wavelength in µm)
  const xTicks = useMemo(() => {
    const span = maxWl - minWl;
    const step = span < 1 ? 0.1 : span < 5 ? 0.5 : span < 15 ? 2 : 5;
    const ticks = [];
    const start = Math.ceil(minWl / step) * step;
    for (let v = start; v <= maxWl + 1e-9; v += step) {
      ticks.push(Math.round(v * 100) / 100);
    }
    return ticks;
  }, [minWl, maxWl]);

  // Y-axis ticks (depth in ppm)
  const yTicks = useMemo(() => {
    const span = maxDepth - minDepth;
    const mag = Math.pow(10, Math.floor(Math.log10(span / 4)));
    const steps = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000];
    const step = steps.find((s) => s * mag * 4 >= span * 0.6) * mag || mag;
    const ticks = [];
    const start = Math.ceil(minDepth / step) * step;
    for (let v = start; v <= maxDepth + 1e-9; v += step) {
      ticks.push(Math.round(v));
    }
    return ticks;
  }, [minDepth, maxDepth]);

  if (activeSet.length === 0) return null;

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      {/* Chart header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.28)" }}>
          {chartTitle}
          <span style={{ marginLeft: 8, color: "rgba(255,255,255,0.15)" }}>({activeSet.length} data points)</span>
        </div>
        {/* Legend */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {instruments.map(({ facility, instrument, color }) => (
            <div key={`${facility}:${instrument}`} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: "rgba(255,255,255,0.4)", letterSpacing: "0.05em" }}>
                {facilityLabel(facility, instrument)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block", maxWidth: W }}>
        {/* Background */}
        <rect x={0} y={0} width={W} height={H} fill="rgba(0,0,0,0)" />

        {/* Grid lines */}
        {yTicks.map((v) => (
          <line key={v} x1={CHART_PAD.left} y1={toY(v)} x2={CHART_PAD.left + innerW} y2={toY(v)}
            stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
        ))}
        {xTicks.map((v) => (
          <line key={v} x1={toX(v)} y1={CHART_PAD.top} x2={toX(v)} y2={CHART_PAD.top + innerH}
            stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
        ))}

        {/* Axes */}
        <line x1={CHART_PAD.left} y1={CHART_PAD.top} x2={CHART_PAD.left} y2={CHART_PAD.top + innerH}
          stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
        <line x1={CHART_PAD.left} y1={CHART_PAD.top + innerH} x2={CHART_PAD.left + innerW} y2={CHART_PAD.top + innerH}
          stroke="rgba(255,255,255,0.12)" strokeWidth={1} />

        {/* X-axis labels */}
        {xTicks.map((v) => (
          <text key={v} x={toX(v)} y={H - 6} textAnchor="middle"
            fontFamily="Space Mono, monospace" fontSize={8} fill="rgba(255,255,255,0.3)">
            {v}
          </text>
        ))}
        <text x={CHART_PAD.left + innerW / 2} y={H - 0} textAnchor="middle"
          fontFamily="Space Mono, monospace" fontSize={8} fill="rgba(255,255,255,0.2)">
          WAVELENGTH (μm)
        </text>

        {/* Y-axis labels */}
        {yTicks.map((v) => (
          <text key={v} x={CHART_PAD.left - 5} y={toY(v) + 3} textAnchor="end"
            fontFamily="Space Mono, monospace" fontSize={8} fill="rgba(255,255,255,0.3)">
            {v >= 1000 ? `${v / 1000}k` : v}
          </text>
        ))}
        <text x={12} y={CHART_PAD.top + innerH / 2} textAnchor="middle"
          fontFamily="Space Mono, monospace" fontSize={8} fill="rgba(255,255,255,0.2)"
          transform={`rotate(-90, 12, ${CHART_PAD.top + innerH / 2})`}>
          DEPTH (PPM)
        </text>

        {/* Data: error bars + points */}
        {activeSet.map((d, i) => {
          const x = toX(d.wl);
          const y = toY(d.depth);
          const color = instrumentColor(d.facility, d.instrument);
          return (
            <g key={i}>
              {/* Wavelength range bar (horizontal) */}
              {d.wlBeg != null && d.wlEnd != null && (
                <line x1={toX(d.wlBeg)} y1={y} x2={toX(d.wlEnd)} y2={y}
                  stroke={color} strokeWidth={1.5} opacity={0.35} />
              )}
              {/* Vertical error bar */}
              {(d.err1 != null || d.err2 != null) && (
                <line
                  x1={x} y1={toY(d.depth + (d.err1 ?? 0))}
                  x2={x} y2={toY(d.depth - (d.err2 ?? 0))}
                  stroke={color} strokeWidth={1} opacity={0.6}
                />
              )}
              {/* Point */}
              <circle cx={x} cy={y} r={2.5} fill={color} opacity={0.9} />
            </g>
          );
        })}
      </svg>

      {/* Source note */}
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "rgba(255,255,255,0.2)", marginTop: 6 }}>
        Source: NASA Exoplanet Archive · spectra table
      </div>
    </div>
  );
}
