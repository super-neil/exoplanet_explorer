export default function PlanetVisual({ planet, size = 200, animate = true }) {
  const h = planet.skyColor[0];
  const s = planet.skyColor[1];
  const l = planet.skyColor[2];
  const isGas = planet.type === "Gas Giant" || planet.type === "Hot Jupiter";
  const isLava = planet.type === "Lava World";
  const isWater = planet.type === "Water World";

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          position: "relative",
          overflow: "hidden",
          boxShadow: `
            inset -${size / 5}px -${size / 8}px ${size / 3}px rgba(0,0,0,0.7),
            inset ${size / 10}px ${size / 10}px ${size / 4}px rgba(255,255,255,0.08),
            0 0 ${size / 2}px ${size / 8}px hsla(${h},${s}%,${l}%,0.15),
            0 0 ${size}px ${size / 4}px hsla(${h},${s}%,${l}%,0.05)
          `,
          background: isGas
            ? `linear-gradient(
                175deg,
                hsl(${h},${s}%,${l - 15}%) 0%,
                hsl(${h + 10},${s - 10}%,${l}%) 20%,
                hsl(${h - 5},${s}%,${l + 10}%) 35%,
                hsl(${h + 15},${s - 5}%,${l - 5}%) 50%,
                hsl(${h},${s + 5}%,${l + 5}%) 65%,
                hsl(${h - 10},${s}%,${l - 10}%) 80%,
                hsl(${h + 5},${s - 10}%,${l - 20}%) 100%
              )`
            : isLava
              ? `radial-gradient(ellipse at 35% 40%,
                  hsl(15,90%,55%) 0%,
                  hsl(5,80%,35%) 30%,
                  hsl(0,60%,20%) 60%,
                  hsl(0,40%,10%) 100%
                )`
              : isWater
                ? `radial-gradient(ellipse at 40% 35%,
                    hsl(${h},${s + 20}%,${l + 15}%) 0%,
                    hsl(${h},${s}%,${l}%) 40%,
                    hsl(${h + 10},${s - 10}%,${l - 15}%) 70%,
                    hsl(${h},${s - 20}%,${l - 25}%) 100%
                  )`
                : `radial-gradient(ellipse at 35% 35%,
                    hsl(${h},${s - 20}%,${l + 15}%) 0%,
                    hsl(${h},${s}%,${l}%) 35%,
                    hsl(${h + 10},${s - 10}%,${l - 10}%) 65%,
                    hsl(${h},${s - 15}%,${l - 25}%) 100%
                  )`,
          animation: animate ? "planetRotate 30s linear infinite" : "none",
        }}
      >
        {isGas && (
          <>
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: `${15 + i * 13}%`,
                  height: `${3 + (i % 3) * 2}%`,
                  background: `hsla(${h + (i % 2 ? 15 : -10)},${s}%,${l + (i % 2 ? 10 : -10)}%,0.3)`,
                  filter: "blur(3px)",
                  borderRadius: "50%",
                }}
              />
            ))}
          </>
        )}
        {isLava &&
          [...Array(8)].map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${10 + (i * 17 % 70)}%`,
                top: `${10 + (i * 13 % 70)}%`,
                width: `${8 + (i * 7 % 20)}%`,
                height: `${5 + (i * 5 % 12)}%`,
                background: `hsla(${20 + (i * 7 % 20)},100%,${55 + (i * 9 % 20)}%,${0.4 + (i % 3) * 0.2})`,
                filter: `blur(${3 + (i % 3) * 2}px)`,
                borderRadius: "50%",
                animation: animate ? `pulse ${2 + (i % 3)}s ease-in-out infinite alternate` : "none",
              }}
            />
          ))}
        {!isGas && !isLava && (
          <>
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: `${15 + (i * 19 % 60)}%`,
                  top: `${15 + (i * 23 % 60)}%`,
                  width: `${10 + (i * 11 % 25)}%`,
                  height: `${10 + (i * 13 % 25)}%`,
                  background: `hsla(${h},${s - 20}%,${l - 15}%,0.3)`,
                  borderRadius: "50%",
                  filter: "blur(4px)",
                }}
              />
            ))}
          </>
        )}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: `linear-gradient(135deg, transparent 30%, rgba(0,0,0,0.6) 100%)`,
          }}
        />
      </div>

      {/* Atmospheric glow */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: size * 1.3,
          height: size * 1.3,
          borderRadius: "50%",
          background: `radial-gradient(circle, hsla(${h},${s}%,${l}%,0.06) 40%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
