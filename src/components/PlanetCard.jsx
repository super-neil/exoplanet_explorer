import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PlanetVisual from "./PlanetVisual";

export default function PlanetCard({ planet, index }) {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/planet/${planet.slug}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)",
        border: `1px solid ${hovered ? planet.accentColor + "40" : "rgba(255,255,255,0.06)"}`,
        borderRadius: 16,
        padding: 24,
        cursor: "pointer",
        transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
        animation: `fadeSlideUp 0.5s ease both`,
        animationDelay: `${index * 0.07}s`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {hovered && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(circle at 50% 100%, ${planet.accentColor}08 0%, transparent 60%)`,
            pointerEvents: "none",
          }}
        />
      )}
      <div style={{ transform: hovered ? "scale(1.05)" : "scale(1)", transition: "transform 0.35s ease" }}>
        <PlanetVisual planet={planet} size={100} animate={hovered} />
      </div>
      <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
        <h3
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 18,
            fontWeight: 700,
            color: "#fff",
            margin: "0 0 4px",
          }}
        >
          {planet.name}
        </h3>
        <div
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: planet.accentColor,
            opacity: 0.8,
          }}
        >
          {planet.type}
        </div>
        <div
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            color: "rgba(255,255,255,0.35)",
            marginTop: 8,
          }}
        >
          {planet.distance} light-years
        </div>
      </div>
      {planet.habitableZone && (
        <div
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 9,
            color: "#4aff8b",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            opacity: 0.7,
          }}
        >
          ✦ Habitable
        </div>
      )}
    </div>
  );
}
