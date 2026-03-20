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

// ─── Glow sprite texture ──────────────────────────────────────────────────────
function makeGlowTexture() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext("2d");
  const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  g.addColorStop(0,    "rgba(255,255,255,1)");
  g.addColorStop(0.12, "rgba(255,255,255,0.95)");
  g.addColorStop(0.35, "rgba(255,255,255,0.4)");
  g.addColorStop(0.7,  "rgba(255,255,255,0.08)");
  g.addColorStop(1,    "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

// ─── Instanced star systems ────────────────────────────────────────────────────
function StarInstances({ systems, onHover, onSelect }) {
  const meshRef = useRef();
  const hitRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const glowTex = useMemo(() => makeGlowTexture(), []);

  const getScale = (s) => s.hasHabitable ? 0.9 : s.planetCount > 3 ? 0.38 : 0.24;

  useEffect(() => {
    if (systems.length === 0) return;
    systems.forEach((s, i) => {
      dummy.position.set(...s.pos);
      const scale = getScale(s);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      if (meshRef.current) {
        meshRef.current.setMatrixAt(i, dummy.matrix);
        // Habitable systems get teal regardless of star type
        meshRef.current.setColorAt(i, new THREE.Color(s.hasHabitable ? "#40e0c0" : s.color));
      }
      dummy.scale.setScalar(scale * 2.5);
      dummy.updateMatrix();
      if (hitRef.current) hitRef.current.setMatrixAt(i, dummy.matrix);
    });
    if (meshRef.current) {
      meshRef.current.instanceMatrix.needsUpdate = true;
      if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    }
    if (hitRef.current) hitRef.current.instanceMatrix.needsUpdate = true;
  }, [systems, dummy]);

  // Billboard: rotate planes to always face camera
  useFrame(({ camera }) => {
    if (!meshRef.current || systems.length === 0) return;
    systems.forEach((s, i) => {
      dummy.position.set(...s.pos);
      dummy.quaternion.copy(camera.quaternion);
      dummy.scale.setScalar(getScale(s));
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      <instancedMesh ref={meshRef} args={[null, null, systems.length]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={glowTex}
          vertexColors
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </instancedMesh>
      <instancedMesh
        ref={hitRef}
        args={[null, null, systems.length]}
        visible={false}
        onPointerMove={(e) => { e.stopPropagation(); onHover(systems[e.instanceId] ?? null); }}
        onPointerOut={() => onHover(null)}
        onClick={(e) => { e.stopPropagation(); onSelect(systems[e.instanceId]); }}
      >
        <sphereGeometry args={[1, 4, 4]} />
        <meshBasicMaterial />
      </instancedMesh>
    </>
  );
}

// ─── 3D labels for a subset of systems ────────────────────────────────────────
function SystemLabels({ systems, onSelect }) {
  return systems.map((s) => (
    <Html key={s.hostname} position={[s.pos[0], s.pos[1] + (s.hasHabitable ? 0.14 : 0.08), s.pos[2]]}
      center distanceFactor={12} zIndexRange={[50, 0]}
    >
      <div
        onClick={() => onSelect(s)}
        style={{
          cursor: "pointer",
          pointerEvents: "all",
          userSelect: "none",
          whiteSpace: "nowrap",
          fontFamily: "'Space Mono', monospace",
          fontSize: s.hasHabitable ? 10 : 8,
          fontWeight: s.hasHabitable ? 700 : 400,
          color: s.hasHabitable ? "#40e0c0" : "rgba(255,255,255,0.55)",
          textShadow: s.hasHabitable
            ? "0 0 10px rgba(64,224,192,0.9), 0 0 20px rgba(64,224,192,0.4)"
            : "0 1px 4px rgba(0,0,0,0.9)",
          letterSpacing: "0.06em",
          marginTop: 4,
          padding: "2px 4px",
          background: s.hasHabitable ? "rgba(0,0,0,0.5)" : "transparent",
          borderRadius: 3,
        }}
      >
        {s.hasHabitable ? `✦ ${s.hostname}` : s.hostname}
      </div>
    </Html>
  ));
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
      <Html position={[0, 0.4, 0]} center distanceFactor={12} zIndexRange={[50, 0]}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#ffe080", textShadow: "0 0 8px rgba(255,224,128,0.8)", whiteSpace: "nowrap", letterSpacing: "0.08em", pointerEvents: "none", userSelect: "none" }}>
          ☀ SOL
        </div>
      </Html>
      <pointLight position={[0, 0, 0]} intensity={2} color="#fff4d0" decay={0} />
    </group>
  );
}

// ─── Scene camera setup ───────────────────────────────────────────────────────
function CamSetup() {
  const { camera, scene } = useThree();
  useEffect(() => {
    camera.position.set(0, 5, 18);
    camera.far = 10000;
    camera.updateProjectionMatrix();
    scene.fog = new THREE.FogExp2(0x020108, 0.0018);
  }, [camera, scene]);
  return null;
}

// ─── Main scene ───────────────────────────────────────────────────────────────
function StarMapScene({ systems, labelSystems, onHover, onSelect }) {
  return (
    <>
      <CamSetup />
      <ambientLight intensity={0.15} />
      <SunMarker />
      {systems.length > 0 && (
        <StarInstances systems={systems} onHover={onHover} onSelect={onSelect} />
      )}
      <SystemLabels systems={labelSystems} onSelect={onSelect} />
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
  const [maxDist, setMaxDist] = useState(500);
  const [habitableOnly, setHabitableOnly] = useState(false);
  const [hovered, setHovered] = useState(null);
  const [panelOpen, setPanelOpen] = useState(true);

  // Group planets into star systems
  const allSystems = useMemo(() => {
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

  const systems = useMemo(
    () => habitableOnly ? allSystems.filter((s) => s.hasHabitable) : allSystems,
    [allSystems, habitableOnly]
  );

  const habitableSystems = useMemo(
    () => allSystems.filter((s) => s.hasHabitable).sort((a, b) => a.distLY - b.distLY),
    [allSystems]
  );

  // Show labels: habitable always + all systems when habitableOnly or small count
  const labelSystems = useMemo(() => {
    if (habitableOnly) return systems;
    if (systems.length <= 80) return systems;
    return systems.filter((s) => s.hasHabitable);
  }, [systems, habitableOnly]);

  const handleSelect = (s) => {
    if (s?.representativePlanet?.slug) navigate(`/planet/${s.representativePlanet.slug}`);
  };

  const DIST_OPTIONS = [200, 500, 1000, 2000, 5000];

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 50% 0%, #050210 0%, #020108 60%, #010105 100%)",
      position: "relative",
      overflow: "hidden",
    }}>
      <StarField count={300} />

      {/* Header */}
      <div style={{
        position: "absolute", top: 80, left: 0, right: 0, zIndex: 10,
        padding: "0 28px", display: "flex", alignItems: "flex-start",
        justifyContent: "space-between", pointerEvents: "none",
      }}>
        <div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.25em", color: "rgba(255,255,255,0.22)", marginBottom: 8 }}>
            3D Star Map
          </div>
          <h1 style={{ fontFamily: "'Audiowide', cursive", fontSize: "clamp(20px,3vw,36px)", color: "#fff", fontWeight: 400, lineHeight: 1.2 }}>
            Nearby Exoplanet Systems
          </h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 6 }}>
            {loading ? "Loading…" : `${systems.length.toLocaleString()} systems · ${habitableSystems.length} habitable`}
          </p>
        </div>

        {/* Controls */}
        <div style={{ pointerEvents: "all", display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)" }}>
            Max distance
          </div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {DIST_OPTIONS.map((d) => (
              <button key={d} onClick={() => setMaxDist(d)} style={{
                fontFamily: "'Space Mono', monospace", fontSize: 9, padding: "5px 10px",
                borderRadius: 5,
                border: maxDist === d ? "1px solid rgba(255,255,255,0.3)" : "1px solid rgba(255,255,255,0.08)",
                background: maxDist === d ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.02)",
                color: maxDist === d ? "#fff" : "rgba(255,255,255,0.35)",
                cursor: "pointer", letterSpacing: "0.04em",
              }}>
                {d >= 1000 ? `${d / 1000}k` : d} ly
              </button>
            ))}
          </div>
          <button onClick={() => setHabitableOnly((v) => !v)} style={{
            fontFamily: "'Space Mono', monospace", fontSize: 9, padding: "5px 12px",
            borderRadius: 5,
            border: habitableOnly ? "1px solid #40e0c0" : "1px solid rgba(255,255,255,0.08)",
            background: habitableOnly ? "rgba(64,224,192,0.12)" : "rgba(255,255,255,0.02)",
            color: habitableOnly ? "#40e0c0" : "rgba(255,255,255,0.35)",
            cursor: "pointer", letterSpacing: "0.06em",
          }}>
            ✦ HABITABLE ONLY
          </button>
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
                labelSystems={labelSystems}
                onHover={setHovered}
                onSelect={handleSelect}
              />
            </Suspense>
          </Canvas>
        )}
      </div>

      {/* Hover tooltip */}
      {hovered && (
        <div style={{
          position: "fixed", bottom: 100, left: "50%", transform: "translateX(-50%)",
          zIndex: 20, padding: "10px 18px",
          background: "rgba(5,2,12,0.88)", border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 10, backdropFilter: "blur(12px)", pointerEvents: "none", textAlign: "center",
        }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: hovered.hasHabitable ? "#40e0c0" : "#fff", fontWeight: 500 }}>
            {hovered.hasHabitable ? "✦ " : ""}{hovered.hostname}
          </div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.4)", marginTop: 4, letterSpacing: "0.08em" }}>
            {hovered.distLY.toFixed(0)} LY · {hovered.planetCount} PLANET{hovered.planetCount !== 1 ? "S" : ""}
            {hovered.hasHabitable ? " · ✦ HABITABLE" : ""}
          </div>
        </div>
      )}

      {/* Habitable systems panel */}
      <div style={{
        position: "absolute", top: 0, right: 0, bottom: 0, zIndex: 10,
        width: panelOpen ? 220 : 42,
        background: "rgba(2,1,8,0.82)", borderLeft: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(16px)",
        transition: "width 0.25s ease",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
      }}>
        {/* Panel toggle */}
        <button
          onClick={() => setPanelOpen((v) => !v)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            padding: "16px 12px", color: "rgba(255,255,255,0.4)",
            fontFamily: "'Space Mono', monospace", fontSize: 9,
            letterSpacing: "0.08em", textAlign: "left",
            display: "flex", alignItems: "center", gap: 8,
            flexShrink: 0, marginTop: 64,
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ fontSize: 12 }}>{panelOpen ? "▶" : "◀"}</span>
          {panelOpen && <span style={{ color: "#40e0c0" }}>✦ HABITABLE ZONES</span>}
        </button>

        {panelOpen && (
          <div style={{ flex: 1, overflowY: "auto", padding: "0 0 20px" }}>
            {habitableSystems.length === 0 ? (
              <div style={{ padding: "12px 16px", fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.25)" }}>
                No habitable systems in range
              </div>
            ) : (
              habitableSystems.map((s) => (
                <button
                  key={s.hostname}
                  onClick={() => handleSelect(s)}
                  style={{
                    display: "block", width: "100%", textAlign: "left",
                    background: "none", border: "none", cursor: "pointer",
                    padding: "10px 16px",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(64,224,192,0.07)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                >
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#fff", fontWeight: 500, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {s.hostname}
                  </div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: "rgba(255,255,255,0.3)", letterSpacing: "0.06em" }}>
                    {s.distLY.toFixed(0)} LY · {s.planetCount} planets
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ position: "absolute", bottom: 32, left: 28, zIndex: 10, display: "flex", flexDirection: "column", gap: 6 }}>
        {[
          { color: "#40e0c0", label: "Habitable zone ✦" },
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
      </div>

      {/* Controls hint */}
      <div style={{
        position: "absolute", bottom: 32, right: 248, zIndex: 10,
        fontFamily: "'Space Mono', monospace", fontSize: 9,
        color: "rgba(255,255,255,0.2)", textAlign: "right", lineHeight: 1.8, letterSpacing: "0.06em",
      }}>
        DRAG TO ROTATE · SCROLL TO ZOOM<br />
        CLICK A STAR TO EXPLORE
      </div>
    </div>
  );
}
