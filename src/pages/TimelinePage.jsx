import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useNASAExoplanets } from "../hooks/useNASAExoplanets";
import StarField from "../components/StarField";

const TYPE_COLORS = {
  "Rocky": "#a0c4a0",
  "Super-Earth": "#6ab0d8",
  "Gas Giant": "#d8a060",
  "Hot Jupiter": "#e06040",
  "Neptune-like": "#6080d8",
  "Lava World": "#e04020",
  "Water World": "#40a8d8",
};
function typeColor(type) {
  return TYPE_COLORS[type] ?? "#888";
}

const DOT = 4;    // dot diameter px (canvas coords)
const GAP = 1;    // gap between stacked dots
const STEP = DOT + GAP;
const MAX_DOTS = 72; // max dots rendered per year column

export default function TimelinePage() {
  const navigate = useNavigate();
  const { planets, loading } = useNASAExoplanets();
  const canvasRef = useRef();
  const hitMapRef = useRef([]); // [{x,y,r,planet}]

  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(2); // years/sec
  const [visibleUpTo, setVisibleUpTo] = useState(null); // max year shown
  const [tooltip, setTooltip] = useState(null); // {x,y,planet}

  // ── Group & sort by year ────────────────────────────────────────────────────
  const { byYear, years, totalByYear } = useMemo(() => {
    const map = {};
    for (const p of planets) {
      if (!p.year) continue;
      (map[p.year] ??= []).push(p);
    }
    const yrs = Object.keys(map).map(Number).sort((a, b) => a - b);
    return { byYear: map, years: yrs, totalByYear: map };
  }, [planets]);

  const minYear = years[0] ?? 1992;
  const maxYear = years[years.length - 1] ?? new Date().getFullYear();

  // Start at first year
  useEffect(() => {
    if (years.length && visibleUpTo === null) setVisibleUpTo(minYear);
  }, [years, minYear, visibleUpTo]);

  // ── Animate ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!playing || visibleUpTo === null) return;
    if (visibleUpTo >= maxYear) { setPlaying(false); return; }
    const ms = Math.max(80, 1000 / speed);
    const id = setTimeout(() => setVisibleUpTo((y) => y + 1), ms);
    return () => clearTimeout(id);
  }, [playing, visibleUpTo, maxYear, speed]);

  // ── Canvas draw ──────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || years.length === 0 || visibleUpTo === null) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    const MARGIN_L = 14;
    const MARGIN_R = 14;
    const MARGIN_B = 36;
    const MARGIN_T = 14;
    const chartW = W - MARGIN_L - MARGIN_R;
    const chartH = H - MARGIN_T - MARGIN_B;

    const nYears = maxYear - minYear + 1;
    const colW = chartW / nYears;

    hitMapRef.current = [];

    const visibleYears = years.filter((y) => y <= visibleUpTo);

    visibleYears.forEach((year) => {
      const pts = byYear[year] ?? [];
      const xBase = MARGIN_L + (year - minYear) * colW + colW / 2;
      const shown = Math.min(pts.length, MAX_DOTS);

      for (let i = 0; i < shown; i++) {
        const p = pts[i];
        const x = xBase;
        const y = MARGIN_T + chartH - i * STEP - DOT / 2;
        ctx.beginPath();
        ctx.arc(x, y, DOT / 2, 0, Math.PI * 2);
        ctx.fillStyle = typeColor(p.type);
        ctx.globalAlpha = 0.85;
        ctx.fill();
        ctx.globalAlpha = 1;
        hitMapRef.current.push({ x, y, r: DOT / 2 + 3, planet: p });
      }

      // Overflow indicator
      if (pts.length > MAX_DOTS) {
        const remaining = pts.length - MAX_DOTS;
        const ty = MARGIN_T + chartH - shown * STEP - 10;
        ctx.font = `7px 'Space Mono', monospace`;
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.textAlign = "center";
        ctx.fillText(`+${remaining}`, xBase, ty);
      }
    });

    // Year axis
    ctx.globalAlpha = 1;
    const labelEvery = nYears > 20 ? 4 : 2;
    years.forEach((year) => {
      if ((year - minYear) % labelEvery !== 0) return;
      const x = MARGIN_L + (year - minYear) * colW + colW / 2;
      ctx.font = `8px 'Space Mono', monospace`;
      ctx.fillStyle = year <= visibleUpTo ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.1)";
      ctx.textAlign = "center";
      ctx.fillText(String(year), x, H - 10);
      // tick
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, MARGIN_T);
      ctx.lineTo(x, MARGIN_T + chartH);
      ctx.stroke();
    });
  }, [byYear, years, minYear, maxYear, visibleUpTo]);

  useEffect(() => { draw(); }, [draw]);

  // Resize observer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      const ctx = canvas.getContext("2d");
      ctx.scale(dpr, dpr);
      draw();
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [draw]);

  // ── Mouse move → tooltip ─────────────────────────────────────────────────────
  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const hit = hitMapRef.current.find(
      ({ x, y, r }) => Math.hypot(mx - x, my - y) <= r
    );
    if (hit) {
      setTooltip({ x: e.clientX, y: e.clientY, planet: hit.planet });
      canvas.style.cursor = "pointer";
    } else {
      setTooltip(null);
      canvas.style.cursor = "default";
    }
  }, []);

  const handleClick = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const hit = hitMapRef.current.find(
      ({ x, y, r }) => Math.hypot(mx - x, my - y) <= r
    );
    if (hit) navigate(`/planet/${hit.planet.slug}`);
  }, [navigate]);

  // Running totals
  const totalVisible = useMemo(() => {
    if (visibleUpTo === null) return 0;
    return years
      .filter((y) => y <= visibleUpTo)
      .reduce((sum, y) => sum + (byYear[y]?.length ?? 0), 0);
  }, [years, byYear, visibleUpTo]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(ellipse at 50% 0%, #0a0810 0%, #060408 50%, #020204 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`@keyframes pulse { 0% { opacity: 0.4; } 100% { opacity: 0.8; } }`}</style>
      <StarField count={200} />

      <div style={{ position: "relative", zIndex: 1, padding: "100px 28px 60px", maxWidth: 1060, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(255,255,255,0.22)", marginBottom: 12 }}>
            Discovery Timeline
          </div>
          <h1 style={{ fontFamily: "'Audiowide', cursive", fontSize: "clamp(28px,5vw,48px)", fontWeight: 400, color: "#fff", lineHeight: 1.15, marginBottom: 10 }}>
            Every Exoplanet Ever Found
          </h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "rgba(255,255,255,0.3)", fontWeight: 300 }}>
            Each dot is a world. Click any dot to explore it.
          </p>
        </div>

        {/* Counter */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <span style={{ fontFamily: "'Audiowide', cursive", fontSize: "clamp(32px,5vw,52px)", color: "#fff", letterSpacing: "-0.02em" }}>
            {totalVisible.toLocaleString()}
          </span>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.3)", marginLeft: 10, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            planets · {visibleUpTo ?? minYear}
          </span>
        </div>

        {/* Canvas */}
        {loading ? (
          <div style={{ height: 360, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.25)", letterSpacing: "0.12em", animation: "pulse 1.5s ease-in-out infinite alternate" }}>
              LOADING…
            </div>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setTooltip(null)}
            onClick={handleClick}
            style={{
              width: "100%",
              height: 360,
              display: "block",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.04)",
            }}
          />
        )}

        {/* Controls */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 20, flexWrap: "wrap" }}>
          <button
            onClick={() => { setVisibleUpTo(minYear); setPlaying(false); }}
            style={ctrlBtn}
          >
            ⟨⟨
          </button>
          <button
            onClick={() => {
              if (visibleUpTo >= maxYear) { setVisibleUpTo(minYear); }
              setPlaying((p) => !p);
            }}
            style={{ ...ctrlBtn, minWidth: 72, background: playing ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)" }}
          >
            {playing ? "⏸ Pause" : "▶ Play"}
          </button>
          <button
            onClick={() => { setVisibleUpTo(maxYear); setPlaying(false); }}
            style={ctrlBtn}
          >
            ⟩⟩
          </button>

          {/* Year scrubber */}
          <input
            type="range"
            min={minYear}
            max={maxYear}
            value={visibleUpTo ?? minYear}
            onChange={(e) => { setPlaying(false); setVisibleUpTo(Number(e.target.value)); }}
            style={{ width: 200, accentColor: "rgba(255,255,255,0.5)", cursor: "pointer" }}
          />

          {/* Speed */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em" }}>SPEED</span>
            {[1, 2, 4, 8].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                style={{ ...ctrlBtn, padding: "4px 9px", background: speed === s ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.02)" }}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginTop: 24 }}>
          {Object.entries(TYPE_COLORS).map(([type, color]) => (
            <div key={type} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: "0.04em" }}>{type}</span>
            </div>
          ))}
        </div>

      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: "fixed",
            left: tooltip.x + 12,
            top: tooltip.y - 40,
            zIndex: 100,
            padding: "7px 12px",
            background: "rgba(5,2,12,0.92)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 8,
            backdropFilter: "blur(10px)",
            pointerEvents: "none",
            maxWidth: 200,
          }}
        >
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#fff", fontWeight: 500 }}>
            {tooltip.planet.name}
          </div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.4)", marginTop: 3, letterSpacing: "0.06em" }}>
            {tooltip.planet.type} · {tooltip.planet.year}
          </div>
        </div>
      )}
    </div>
  );
}

const ctrlBtn = {
  fontFamily: "'Space Mono', monospace",
  fontSize: 10,
  padding: "6px 14px",
  borderRadius: 6,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.04)",
  color: "rgba(255,255,255,0.55)",
  cursor: "pointer",
  letterSpacing: "0.04em",
  transition: "all 0.15s",
};
