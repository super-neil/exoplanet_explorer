import { useRef, useMemo, useEffect, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { generatePlanetTexture, generateBumpTexture } from "../lib/textureGen";

// ─── Inner mesh ───────────────────────────────────────────────────────────────
function PlanetMesh({ planet, interactive }) {
  const meshRef = useRef();

  const colorTexture = useMemo(() => generatePlanetTexture(planet), [planet.slug, planet.type]);
  const bumpTexture = useMemo(() => generateBumpTexture(planet), [planet.slug, planet.type]);

  const accentColor = planet.accentColor ?? "#ffffff";
  const [h, s, l] = planet.skyColor ?? [210, 40, 40];
  const isGas = planet.type === "Gas Giant" || planet.type === "Hot Jupiter";
  const isLava = planet.type === "Lava World";
  const isWater = planet.type === "Water World";

  // Cleanup textures on unmount
  useEffect(() => {
    return () => {
      colorTexture?.dispose();
      bumpTexture?.dispose();
    };
  }, [colorTexture, bumpTexture]);

  useFrame((_, delta) => {
    if (meshRef.current && !interactive) {
      meshRef.current.rotation.y += delta * 0.18;
    }
  });

  const bumpScale = isGas ? 0.02 : isLava ? 0.04 : 0.05;

  return (
    <group>
      {/* Planet sphere */}
      <mesh ref={meshRef} castShadow>
        <sphereGeometry args={[1, 96, 96]} />
        <meshStandardMaterial
          map={colorTexture}
          bumpMap={bumpTexture}
          bumpScale={bumpScale}
          roughness={isGas ? 0.85 : isLava ? 0.6 : isWater ? 0.4 : 0.88}
          metalness={isLava ? 0.18 : 0.04}
        />
      </mesh>

      {/* Atmosphere rim */}
      <mesh>
        <sphereGeometry args={[1.055, 48, 48]} />
        <meshStandardMaterial
          color={accentColor}
          transparent
          opacity={isLava ? 0.18 : isGas ? 0.1 : 0.08}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Gas giant ring system */}
      {isGas && (
        <mesh rotation={[Math.PI / 6, 0, Math.PI / 8]}>
          <ringGeometry args={[1.5, 2.4, 128]} />
          <meshStandardMaterial
            color={accentColor}
            transparent
            opacity={0.18}
            side={THREE.DoubleSide}
            roughness={0.9}
          />
        </mesh>
      )}

      {/* Lava glow halo */}
      {isLava && (
        <mesh>
          <sphereGeometry args={[1.1, 32, 32]} />
          <meshStandardMaterial
            color="#ff5500"
            transparent
            opacity={0.06}
            side={THREE.BackSide}
            emissive="#ff3300"
            emissiveIntensity={0.3}
          />
        </mesh>
      )}
    </group>
  );
}

// ─── Scene lights ─────────────────────────────────────────────────────────────
function Lights({ planet }) {
  const isLava = planet.type === "Lava World";
  const isHot = planet.type === "Hot Jupiter";
  const [h, s, l] = planet.skyColor ?? [210, 40, 40];
  const starColor = planet.starTemp
    ? planet.starTemp < 3800
      ? "#ffaa66"
      : planet.starTemp < 5200
        ? "#ffc97a"
        : planet.starTemp < 6200
          ? "#fff4e0"
          : "#c8d8ff"
    : "#fff4e0";

  return (
    <>
      {/* Broad ambient fill so textures are always visible */}
      <ambientLight intensity={1.2} color="#d8dff0" />
      {/* Primary star light from upper-left-front */}
      <pointLight
        position={[-3.5, 2.5, 3.5]}
        intensity={isHot ? 6 : 4.5}
        color={starColor}
        castShadow={false}
        decay={0}
      />
      {/* Soft fill from the opposite hemisphere */}
      <pointLight
        position={[2.5, -1.5, -2]}
        intensity={0.6}
        color={`hsl(${h},${Math.max(s - 10, 0)}%,${Math.min(l + 20, 90)}%)`}
        decay={0}
      />
      {/* Lava self-illumination */}
      {isLava && (
        <pointLight position={[0, 0, 1.5]} intensity={2.5} color="#ff5500" decay={0} />
      )}
    </>
  );
}

// ─── Camera framing helper ─────────────────────────────────────────────────────
function CameraSetup() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 0, 2.8);
    camera.updateProjectionMatrix();
  }, [camera]);
  return null;
}

// ─── Public component ─────────────────────────────────────────────────────────
/**
 * @param {object}  planet      - Planet data object
 * @param {number}  [size=340]  - Pixel size of the canvas (square)
 * @param {boolean} [interactive=true] - Enable OrbitControls
 */
export default function Planet3D({ planet, size = 340, interactive = true }) {
  const isGas = planet.type === "Gas Giant" || planet.type === "Hot Jupiter";

  return (
    <div
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        // Outer glow matching accent color
        filter: `drop-shadow(0 0 ${size / 7}px ${planet.accentColor ?? "#888"}40)`,
      }}
    >
      <Canvas
        gl={{ alpha: true, antialias: true, toneMapping: THREE.LinearToneMapping, toneMappingExposure: 1.0 }}
        shadows={false}
        dpr={[1, 2]}
        style={{ background: "transparent", borderRadius: "50%" }}
        camera={{ fov: 38, near: 0.1, far: 100, position: [0, 0, 2.8] }}
      >
        <CameraSetup />
        <Suspense fallback={null}>
          <Lights planet={planet} />
          <PlanetMesh planet={planet} interactive={interactive} />
          {interactive && (
            <OrbitControls
              enablePan={false}
              enableZoom={false}
              rotateSpeed={0.55}
              minPolarAngle={Math.PI * 0.1}
              maxPolarAngle={Math.PI * 0.9}
              // Allow orbit on the canvas without hijacking page scroll
              domElement={undefined}
            />
          )}
        </Suspense>
      </Canvas>
    </div>
  );
}
