export default function TypeBadge({ type, habitableZone, accent }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
      <span
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 10,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          padding: "4px 10px",
          borderRadius: 4,
          background: `${accent}18`,
          color: accent,
          border: `1px solid ${accent}30`,
        }}
      >
        {type}
      </span>
      {habitableZone && (
        <span
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 10,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            padding: "4px 10px",
            borderRadius: 4,
            background: "rgba(74,255,139,0.08)",
            color: "#4aff8b",
            border: "1px solid rgba(74,255,139,0.2)",
          }}
        >
          ✦ Habitable Zone
        </span>
      )}
    </div>
  );
}
