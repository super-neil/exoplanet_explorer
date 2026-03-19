export default function Stat({ label, value, unit, accent }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 22,
          fontWeight: 700,
          color: accent,
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
        }}
      >
        {value}
        {unit && (
          <span style={{ fontSize: 11, opacity: 0.7, marginLeft: 3, fontWeight: 400 }}>
            {unit}
          </span>
        )}
      </div>
      <div
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          color: "rgba(255,255,255,0.35)",
          marginTop: 4,
        }}
      >
        {label}
      </div>
    </div>
  );
}
