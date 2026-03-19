import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import StarField from "../components/StarField";
import PlanetVisual from "../components/PlanetVisual";
import { EXOPLANETS } from "../data/exoplanets";
import { useNASAExoplanets } from "../hooks/useNASAExoplanets";

// Pick a few featured planets for the hero orbit display
const FEATURED = [
  EXOPLANETS.find((p) => p.slug === "trappist-1e"),
  EXOPLANETS.find((p) => p.slug === "kepler-16b"),
  EXOPLANETS.find((p) => p.slug === "wasp-121b"),
  EXOPLANETS.find((p) => p.slug === "gj-1214-b"),
  EXOPLANETS.find((p) => p.slug === "55-cancri-e"),
];

function OrbitingPlanet({ planet, orbitRadius, duration, startAngle, size }) {
  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        width: orbitRadius * 2,
        height: orbitRadius * 2,
        marginTop: -orbitRadius,
        marginLeft: -orbitRadius,
        borderRadius: "50%",
        border: "1px solid rgba(255,255,255,0.04)",
        animation: `orbitSpin ${duration}s linear infinite`,
        animationDelay: `-${(startAngle / 360) * duration}s`,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -size / 2,
          left: "50%",
          marginLeft: -size / 2,
        }}
      >
        <PlanetVisual planet={planet} size={size} animate={false} />
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [entered, setEntered] = useState(false);
  const navigate = useNavigate();
  const { planets, loading, totalCount } = useNASAExoplanets();

  const habitableCount = useMemo(
    () => planets.filter((p) => p.habitableZone).length,
    [planets]
  );
  const systemCount = useMemo(() => {
    const hosts = new Set(planets.map((p) => p.name?.split(" ").slice(0, -1).join(" ")).filter(Boolean));
    return hosts.size;
  }, [planets]);
  const oldestYear = useMemo(() => {
    const years = planets.map((p) => p.year).filter(Boolean);
    return years.length ? Math.min(...years) : 1992;
  }, [planets]);

  const STATS = [
    { value: loading ? "…" : `${totalCount.toLocaleString()}`, label: "Confirmed Exoplanets" },
    { value: loading ? "…" : `${systemCount.toLocaleString()}+`, label: "Planetary Systems" },
    { value: loading ? "…" : `${habitableCount}`, label: "Potentially Habitable" },
    { value: String(oldestYear), label: "Year of First Discovery" },
  ];

  useEffect(() => {
    requestAnimationFrame(() => setEntered(true));
  }, []);

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
        @keyframes orbitSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes twinkle { 0% { opacity: 0.2; } 100% { opacity: 1; } }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes planetRotate { 0% { filter: hue-rotate(0deg); } 100% { filter: hue-rotate(3deg); } }
        @keyframes pulse { 0% { opacity: 0.4; } 100% { opacity: 0.8; } }
        @keyframes counterOrbit { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
      `}</style>

      <StarField count={300} />

      {/* ── Hero ── */}
      <section
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "100px 28px 60px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Orbit system — decorative */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 600,
            height: 600,
            pointerEvents: "none",
            opacity: 0.5,
          }}
        >
          {FEATURED.map((planet, i) => (
            <OrbitingPlanet
              key={planet.slug}
              planet={planet}
              orbitRadius={130 + i * 50}
              duration={18 + i * 8}
              startAngle={(i * 72) % 360}
              size={22 + (i % 3) * 8}
            />
          ))}
        </div>

        {/* Hero text */}
        <div
          style={{
            textAlign: "center",
            position: "relative",
            zIndex: 2,
            opacity: entered ? 1 : 0,
            transform: entered ? "translateY(0)" : "translateY(24px)",
            transition: "opacity 0.8s ease, transform 0.8s ease",
          }}
        >
          <div
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.35em",
              color: "rgba(255,255,255,0.25)",
              marginBottom: 20,
            }}
          >
            NASA · ESA · Kepler · TESS
          </div>

          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(44px, 8vw, 84px)",
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              marginBottom: 24,
            }}
          >
            Worlds Beyond
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #a78bfa, #7c3aed, #c084fc)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Our Stars
            </span>
          </h1>

          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "clamp(15px, 2.5vw, 18px)",
              color: "rgba(255,255,255,0.45)",
              maxWidth: 480,
              margin: "0 auto 40px",
              lineHeight: 1.7,
              fontWeight: 300,
            }}
          >
            Journey through the universe and discover exoplanets — alien worlds
            orbiting distant stars, some eerily Earth-like, others beyond imagination.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => navigate("/catalog")}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 15,
                fontWeight: 500,
                padding: "13px 32px",
                borderRadius: 10,
                border: "none",
                background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
                color: "#fff",
                cursor: "pointer",
                boxShadow: "0 0 30px rgba(124,58,237,0.3)",
                transition: "all 0.2s",
                letterSpacing: "0.01em",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 0 40px rgba(124,58,237,0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 0 30px rgba(124,58,237,0.3)";
              }}
            >
              Explore the Catalog
            </button>
            <button
              onClick={() => {
                document.getElementById("featured-section")?.scrollIntoView({ behavior: "smooth" });
              }}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 15,
                fontWeight: 400,
                padding: "13px 32px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.04)",
                color: "rgba(255,255,255,0.65)",
                cursor: "pointer",
                transition: "all 0.2s",
                backdropFilter: "blur(10px)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                e.currentTarget.style.color = "rgba(255,255,255,0.65)";
              }}
            >
              Learn More ↓
            </button>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section
        style={{
          position: "relative",
          zIndex: 1,
          borderTop: "1px solid rgba(255,255,255,0.05)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          background: "rgba(255,255,255,0.02)",
          backdropFilter: "blur(20px)",
          padding: "32px 28px",
        }}
      >
        <div
          style={{
            maxWidth: 900,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 24,
          }}
        >
          {STATS.map((stat) => (
            <div key={stat.label} style={{ textAlign: "center" }}>
              <div
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 36,
                  fontWeight: 700,
                  color: "#fff",
                  letterSpacing: "-0.02em",
                  lineHeight: 1,
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: "rgba(255,255,255,0.3)",
                  marginTop: 8,
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Featured worlds ── */}
      <section id="featured-section" style={{ position: "relative", zIndex: 1, padding: "80px 28px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <div
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: "0.3em",
                color: "rgba(255,255,255,0.2)",
                marginBottom: 12,
              }}
            >
              Featured Worlds
            </div>
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(28px, 5vw, 42px)",
                fontWeight: 700,
                color: "#fff",
                letterSpacing: "-0.02em",
              }}
            >
              Remarkable Discoveries
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 20,
            }}
          >
            {EXOPLANETS.filter((p) => p.habitableZone).map((planet, i) => (
              <FeaturedCard key={planet.slug} planet={planet} index={i} />
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: 48 }}>
            <button
              onClick={() => navigate("/catalog")}
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 11,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "12px 28px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.03)",
                color: "rgba(255,255,255,0.5)",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                e.currentTarget.style.color = "#fff";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                e.currentTarget.style.color = "rgba(255,255,255,0.5)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
              }}
            >
              View All 8 Worlds →
            </button>
          </div>
        </div>
      </section>

      {/* ── Discovery timeline ── */}
      <section
        style={{
          position: "relative",
          zIndex: 1,
          padding: "80px 28px",
          borderTop: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <div
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: "0.3em",
                color: "rgba(255,255,255,0.2)",
                marginBottom: 12,
              }}
            >
              Discovery Timeline
            </div>
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(28px, 5vw, 42px)",
                fontWeight: 700,
                color: "#fff",
                letterSpacing: "-0.02em",
              }}
            >
              A History of Finding Worlds
            </h2>
          </div>

          <div style={{ position: "relative" }}>
            {/* Timeline line */}
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: 0,
                bottom: 0,
                width: 1,
                background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.08) 10%, rgba(255,255,255,0.08) 90%, transparent)",
                transform: "translateX(-50%)",
              }}
            />

            {[...EXOPLANETS]
              .sort((a, b) => a.year - b.year)
              .map((planet, i) => {
                const isLeft = i % 2 === 0;
                return (
                  <div
                    key={planet.slug}
                    onClick={() => navigate(`/planet/${planet.slug}`)}
                    style={{
                      display: "flex",
                      justifyContent: isLeft ? "flex-end" : "flex-start",
                      paddingRight: isLeft ? "calc(50% + 24px)" : 0,
                      paddingLeft: isLeft ? 0 : "calc(50% + 24px)",
                      marginBottom: 32,
                      position: "relative",
                      cursor: "pointer",
                    }}
                  >
                    {/* Dot on line */}
                    <div
                      style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        transform: "translate(-50%, -50%)",
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: planet.accentColor,
                        boxShadow: `0 0 10px ${planet.accentColor}60`,
                        zIndex: 1,
                      }}
                    />

                    <div
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 12,
                        padding: "14px 18px",
                        maxWidth: 260,
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                        e.currentTarget.style.borderColor = `${planet.accentColor}40`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "'Space Mono', monospace",
                          fontSize: 10,
                          color: planet.accentColor,
                          letterSpacing: "0.1em",
                          marginBottom: 4,
                        }}
                      >
                        {planet.year} · {planet.discovery}
                      </div>
                      <div
                        style={{
                          fontFamily: "'Playfair Display', serif",
                          fontSize: 15,
                          fontWeight: 700,
                          color: "#fff",
                        }}
                      >
                        {planet.name}
                      </div>
                      <div
                        style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: 12,
                          color: "rgba(255,255,255,0.4)",
                          marginTop: 4,
                        }}
                      >
                        {planet.type}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section
        style={{
          position: "relative",
          zIndex: 1,
          padding: "80px 28px 100px",
          textAlign: "center",
          borderTop: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(28px, 5vw, 48px)",
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "-0.02em",
              marginBottom: 20,
            }}
          >
            Ready to Explore?
          </h2>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 16,
              color: "rgba(255,255,255,0.4)",
              marginBottom: 36,
              lineHeight: 1.7,
            }}
          >
            Browse all eight featured exoplanets with detailed profiles, interactive
            visuals, and everything we know about these distant worlds.
          </p>
          <button
            onClick={() => navigate("/catalog")}
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 15,
              fontWeight: 500,
              padding: "14px 36px",
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
              color: "#fff",
              cursor: "pointer",
              boxShadow: "0 0 40px rgba(124,58,237,0.3)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 0 50px rgba(124,58,237,0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 0 40px rgba(124,58,237,0.3)";
            }}
          >
            Open the Catalog
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          position: "relative",
          zIndex: 1,
          padding: "24px 28px",
          borderTop: "1px solid rgba(255,255,255,0.04)",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            color: "rgba(255,255,255,0.15)",
          }}
        >
          Data sourced from NASA Exoplanet Archive · Kepler &amp; TESS Missions
        </p>
      </footer>
    </div>
  );
}

function FeaturedCard({ planet, index }) {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/planet/${planet.slug}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)",
        border: `1px solid ${hovered ? planet.accentColor + "40" : "rgba(255,255,255,0.06)"}`,
        borderRadius: 16,
        padding: "24px",
        cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        display: "flex",
        alignItems: "center",
        gap: 20,
        animation: `fadeSlideUp 0.5s ease both`,
        animationDelay: `${index * 0.1}s`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {hovered && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(circle at 20% 50%, ${planet.accentColor}06 0%, transparent 60%)`,
            pointerEvents: "none",
          }}
        />
      )}
      <div style={{ flexShrink: 0 }}>
        <PlanetVisual planet={planet} size={64} animate={hovered} />
      </div>
      <div>
        <div
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 9,
            color: "#4aff8b",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: 4,
          }}
        >
          ✦ Habitable Zone
        </div>
        <div
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 18,
            fontWeight: 700,
            color: "#fff",
            marginBottom: 4,
          }}
        >
          {planet.name}
        </div>
        <div
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            color: "rgba(255,255,255,0.4)",
            lineHeight: 1.5,
          }}
        >
          {planet.distance} ly · {planet.type} · {planet.tempK - 273}°C
        </div>
      </div>
      <div
        style={{
          marginLeft: "auto",
          fontFamily: "'Space Mono', monospace",
          fontSize: 11,
          color: hovered ? planet.accentColor : "rgba(255,255,255,0.2)",
          transition: "color 0.2s",
          flexShrink: 0,
        }}
      >
        →
      </div>
    </div>
  );
}
