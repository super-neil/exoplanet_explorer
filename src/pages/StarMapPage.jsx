import { useMemo, useRef, useState, useEffect, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { useNavigate } from "react-router-dom";
import { useNASAExoplanets } from "../hooks/useNASAExoplanets";
import StarField from "../components/StarField";

// ─── Convert RA/Dec/dist to 3D Cartesian (scale: 1 unit = 100 ly) ──────────────
function toXYZ(ra, dec, distLY) {
  const raR = (ra * Math.PI) / 180;
  const decR = (dec * Math.PI) / 180;
  const d = distLY / 100;
  return [
    d * Math.cos(decR) * Math.cos(raR),
    d * Math.sin(decR),
    d * Math.cos(decR) * Math.sin(raR),
  ];
}

function starColorHex(teff) {
  if (!teff) return "#fff4d0";
  if (teff > 7500) return "#c8d8ff";
  if (teff > 6000) return "#fff4d0";
  if (teff > 5200) return "#ffd080";
  if (teff > 3700) return "#ffb060";
  return "#ff7040";
}

// ─── Instanced star systems ────────────────────────────────────────────────────
function StarInstances({ systems, onHover, onSelect }) {
  const ref = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    if (!ref.current || systems.length === 0) return;
    systems.forEach((s, i) => {
      dummy.position.set(...s.pos);
      dummy.scale.setScalar(s.hasHabitable ? 0.16 : s.planetCount > 3 ? 0.12 : 0.08);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
      ref.current.setColorAt(i, new THREE.Color(s.color));
    });
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
  }, [systems, dummy]);

  return (
    <instancedMesh
      ref={ref}
      args={[null, null, systems.length]}
      onPointerMove={(e) => { e.stopPropagation(); onHover(systems[e.instanceId] ?? null); }}
      onPointerOut={() => onHover(null)}
      onClick={(e) => { e.stopPropagation(); onSelect(systems[e.instanceId]); }}
    >
      <sphereGeometry args={[1, 5, 5]} />
      <meshBasicMaterial vertexColors />
    </instancedMesh>
  );
}

// ─── Sun marker ───────────────────────────────────────────────────────────────
function SunMarker() {
  const meshRef = useRef();
  useFrame((_, dt) => { if (meshRef.current) meshRef.current.rotation.y += dt * 0.4; });
  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.25, 12, 12]} />
        <meshBasicMaterial color="#ffe080" />
      </mesh>
      <pointLight position={[0, 0, 0]} intensity={2} color="#fff4d0" decay={0} />
    </group>
  );
}

// ─── Scene camera setup ───────────────────────────────────────────────────────
function CamSetup() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 8, 28);
    camera.far = 10000;
    camera.updateProjectionMatrix();
  }, [camera]);
  return null;
}

// ─── Main scene ───────────────────────────────────────────────────────────────
function StarMapScene({ systems, onHover, onSelect }) {
  return (
    <>
      <CamSetup />
      <ambientLight intensity={0.15} />
      <SunMarker />
      {systems.length > 0 && (
        <StarInstances systems={systems} onHover={onHover} onSelect={onSelect} />
      )}
      <OrbitControls
        enablePan
        enableZoom
        zoomSpeed={1.2}
        panSpeed={0.8}
        rotateSpeed={0.5}
        minDistance={2}
        maxDistance={800}
      />
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function StarMapPage() {
  const navigate = useNavigate();
  const { planets, loading } = useNASAExoplanets();
  const [maxDist, setMaxDist] = useState(2000); // ly
  const [hovered, setHovered] = useState(null);

  // Group planets into star systems
  const systems = useMemo(() => {
    const map = new Map();
    for (const p of planets) {
      if (p.ra == null || p.dec == null || p.distParsec == null) continue;
      const distLY = p.distParsec * 3.26156;
      if (distLY > maxDist) continue;
      const key = p.hostname ?? p.name;
      if (!map.has(key)) {
        map.set(key, {
          hostname: key,
          ra: p.ra,
          dec: p.dec,
          distLY,
          starTemp: p.starTemp,
          planets: [],
          hasHabitable: false,
          representativePlanet: p,
        });
      }
      const sys = map.get(key);
      sys.planets.push(p);
      if (p.habitableZone) sys.hasHabitable = true;
    }

    return Array.from(map.values()).map((s) => ({
      ...s,
      pos: toXYZ(s.ra, s.dec, s.distLY),
      color: starColorHex(s.starTemp),
      planetCount: s.planets.length,
    }));
  }, [planets, maxDist]);

  const DIST_OPTIONS = [200, 500, 1000, 2000, 5000];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(ellipse at 50% 0%, #050210 0%, #020108 60%, #010105 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <StarField count={300} />

      {/* Header */}
      <div
        style={{
          position: "absolute",
          top: 80,
          left: 0,
          right: 0,
          zIndex: 10,
          padding: "0 28px",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          pointerEvents: "none",
        }}
      >
        <div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.25em", color: "rgba(255,255,255,0.22)", marginBottom: 8 }}>
            3D Star Map
          </div>
          <h1 style={{ fontFamily: "'Audiowide', cursive", fontSize: "clamp(24px,4vw,40px)", color: "#fff", fontWeight: 400, lineHeight: 1.2 }}>
            Nearby Exoplanet Systems
          </h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 6 }}>
            {loading ? "Loading…" : `${systems.length.toLocaleString()} systems within ${maxDist.toLocaleString()} ly`}
          </p>
        </div>

        {/* Controls */}
        <div style={{ pointerEvents: "all", display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)" }}>
            Max distance
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {DIST_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setMaxDist(d)}
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 9,
                  padding: "5px 10px",
                  borderRadius: 5,
                  border: maxDist === d ? "1px solid rgba(255,255,255,0.3)" : "1px solid rgba(255,255,255,0.08)",
                  background: maxDist === d ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.02)",
                  color: maxDist === d ? "#fff" : "rgba(255,255,255,0.35)",
                  cursor: "pointer",
                  letterSpacing: "0.04em",
                }}
              >
                {d >= 1000 ? `${d / 1000}k` : d} ly
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3D Canvas */}
      <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
        {!loading && (
          <Canvas
            gl={{ alpha: true, antialias: true, toneMapping: THREE.LinearToneMapping }}
            dpr={[1, 2]}
            style={{ background: "transparent" }}
          >
            <Suspense fallback={null}>
              <StarMapScene
                systems={systems}
                onHover={setHovered}
                onSelect={(s) => {
                  if (s?.representativePlanet?.slug) {
                    navigate(`/planet/${s.representativePlanet.slug}`);
                  }
                }}
              />
            </Suspense>
          </Canvas>
        )}
      </div>

      {/* Hover tooltip */}
      {hovered && (
        <div
          style={{
            position: "fixed",
            bottom: 100,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 20,
            padding: "10px 18px",
            background: "rgba(5,2,12,0.88)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 10,
            backdropFilter: "blur(12px)",
            pointerEvents: "none",
            textAlign: "center",
          }}
        >
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#fff", fontWeight: 500 }}>
            {hovered.hostname}
          </div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.4)", marginTop: 4, letterSpacing: "0.08em" }}>
            {hovered.distLY.toFixed(0)} LY · {hovered.planetCount} PLANET{hovered.planetCount !== 1 ? "S" : ""}
            {hovered.hasHabitable ? " · ✦ HABITABLE" : ""}
          </div>
        </div>
      )}

      {/* Legend */}
      <div
        style={{
          position: "absolute",
          bottom: 32,
          left: 28,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {[
          { color: "#fff4d0", label: "Sun-like (G)" },
          { color: "#ffb060", label: "Orange dwarf (K)" },
          { color: "#ff7040", label: "Red dwarf (M)" },
          { color: "#c8d8ff", label: "Hot star (A/F)" },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: "0.06em" }}>{label}</span>
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.3)", flexShrink: 0 }} />
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: "0.06em" }}>Larger = more planets or habitable</span>
        </div>
      </div>

      {/* Controls hint */}
      <div
        style={{
          position: "absolute",
          bottom: 32,
          right: 28,
          zIndex: 10,
          fontFamily: "'Space Mono', monospace",
          fontSize: 9,
          color: "rgba(255,255,255,0.2)",
          textAlign: "right",
          lineHeight: 1.8,
          letterSpacing: "0.06em",
        }}
      >
        DRAG TO ROTATE · SCROLL TO ZOOM<br />
        CLICK A STAR TO EXPLORE
      </div>
    </div>
  );
}
