import * as THREE from "three";

// ─── Seeded RNG ───────────────────────────────────────────────────────────────
function seededRng(seed) {
  let s = (Math.abs(seed) | 1) >>> 0;
  return () => {
    s ^= s << 13;
    s ^= s >> 17;
    s ^= s << 5;
    s = s >>> 0;
    return s / 0x100000000;
  };
}
function hashStr(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// ─── HSL helper ───────────────────────────────────────────────────────────────
function hsl(h, s, l, a = 1) {
  return a < 1 ? `hsla(${h},${s}%,${l}%,${a})` : `hsl(${h},${s}%,${l}%)`;
}

// ─── Rocky / Terrestrial ──────────────────────────────────────────────────────
function drawRocky(ctx, W, H, h, s, l, rng, isSuper) {
  // Base fill
  const base = ctx.createLinearGradient(0, 0, 0, H);
  base.addColorStop(0, hsl(h, s - 10, l - 8));
  base.addColorStop(0.5, hsl(h, s, l));
  base.addColorStop(1, hsl(h, s + 5, l - 14));
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);

  // Continental blobs
  const continentColor = isSuper
    ? hsl(h - 100, s + 20, l + 8) // green-tinted for super-earths
    : hsl(h + 15, s + 18, l + 12);
  const numContinents = 4 + Math.floor(rng() * 5);
  for (let i = 0; i < numContinents; i++) {
    const cx = rng() * W;
    const cy = rng() * H;
    const rx = W * (0.06 + rng() * 0.14);
    const ry = H * (0.08 + rng() * 0.18);
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
    grad.addColorStop(0, continentColor.replace(")", `,${0.55 + rng() * 0.3})`).replace("hsl", "hsla"));
    grad.addColorStop(1, "transparent");
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, rng() * Math.PI, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Wrap around edges
    if (cx < rx) {
      ctx.beginPath();
      ctx.ellipse(cx + W, cy, rx, ry, rng() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Craters
  const numCraters = 12 + Math.floor(rng() * 20);
  for (let i = 0; i < numCraters; i++) {
    const cx = rng() * W;
    const cy = (rng() * 0.7 + 0.15) * H; // avoid poles
    const r = 4 + rng() * 18;
    // Dark interior
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = hsl(h, s - 10, l - 20, 0.35);
    ctx.fill();
    // Bright rim highlight
    ctx.beginPath();
    ctx.arc(cx - r * 0.2, cy - r * 0.2, r * 0.6, 0, Math.PI * 2);
    ctx.strokeStyle = hsl(h, s - 5, l + 14, 0.18);
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Ocean for super-earths
  if (isSuper) {
    // Add blue regions
    for (let i = 0; i < 3; i++) {
      const cx = rng() * W;
      const cy = rng() * H;
      const rx = W * (0.1 + rng() * 0.18);
      const ry = H * (0.12 + rng() * 0.2);
      const og = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
      og.addColorStop(0, `hsla(210,65%,38%,0.5)`);
      og.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, rng() * Math.PI, 0, Math.PI * 2);
      ctx.fillStyle = og;
      ctx.fill();
    }
    // White clouds
    for (let i = 0; i < 8; i++) {
      const cx = rng() * W;
      const cy = rng() * H;
      const rx = W * (0.04 + rng() * 0.09);
      const ry = H * (0.02 + rng() * 0.04);
      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
      cg.addColorStop(0, `rgba(255,255,255,0.45)`);
      cg.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, rng() * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = cg;
      ctx.fill();
    }
  }
}

// ─── Polar ice caps ───────────────────────────────────────────────────────────
function drawPolarCaps(ctx, W, H, rng) {
  const capH = H * (0.1 + rng() * 0.06);
  // North
  const ng = ctx.createLinearGradient(0, 0, 0, capH * 1.5);
  ng.addColorStop(0, "rgba(220,240,255,0.75)");
  ng.addColorStop(1, "transparent");
  ctx.fillStyle = ng;
  ctx.fillRect(0, 0, W, capH * 1.5);
  // South
  const sg = ctx.createLinearGradient(0, H, 0, H - capH * 1.5);
  sg.addColorStop(0, "rgba(220,240,255,0.65)");
  sg.addColorStop(1, "transparent");
  ctx.fillStyle = sg;
  ctx.fillRect(0, H - capH * 1.5, W, capH * 1.5);
}

// ─── Gas Giant / Hot Jupiter ──────────────────────────────────────────────────
function drawGasGiant(ctx, W, H, h, s, l, rng, isHot) {
  // Base gradient
  const base = ctx.createLinearGradient(0, 0, 0, H);
  base.addColorStop(0, hsl(h, s - 5, l - 18));
  base.addColorStop(0.5, hsl(h + 8, s, l));
  base.addColorStop(1, hsl(h, s + 5, l - 14));
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);

  // Horizontal atmosphere bands
  const numBands = 14 + Math.floor(rng() * 10);
  for (let i = 0; i < numBands; i++) {
    const y = (i / numBands) * H;
    const bh = H / numBands;
    const dh = (rng() - 0.5) * 30;
    const dl = (rng() - 0.5) * 22;
    const alpha = 0.25 + rng() * 0.35;
    const bg = ctx.createLinearGradient(0, y, 0, y + bh);
    bg.addColorStop(0, hsl(h + dh, s, l + dl, 0));
    bg.addColorStop(0.4, hsl(h + dh, s + 8, l + dl + 4, alpha));
    bg.addColorStop(0.6, hsl(h + dh, s + 8, l + dl + 4, alpha));
    bg.addColorStop(1, hsl(h + dh, s, l + dl, 0));
    ctx.fillStyle = bg;
    ctx.fillRect(0, y, W, bh);
  }

  // Wavy turbulence lines
  for (let i = 0; i < 24; i++) {
    const y0 = rng() * H;
    const amp = 8 + rng() * 20;
    const freq = 0.005 + rng() * 0.012;
    const dh = (rng() - 0.5) * 40;
    const dl = (rng() - 0.5) * 28;
    ctx.beginPath();
    ctx.moveTo(0, y0);
    for (let x = 0; x <= W; x += 4) {
      ctx.lineTo(x, y0 + Math.sin(x * freq + rng() * 6.28) * amp);
    }
    ctx.strokeStyle = hsl(h + dh, s + 10, l + dl, 0.1 + rng() * 0.12);
    ctx.lineWidth = 1 + rng() * 3;
    ctx.stroke();
  }

  // Great storm oval
  const sx = W * (0.2 + rng() * 0.6);
  const sy = H * (0.3 + rng() * 0.4);
  const srx = W * (0.04 + rng() * 0.06);
  const sry = srx * (0.4 + rng() * 0.3);
  const stormH = isHot ? (h + 180) % 360 : h - 20;
  const sg2 = ctx.createRadialGradient(sx, sy, 0, sx, sy, srx);
  sg2.addColorStop(0, hsl(stormH, s + 30, l + 20, 0.85));
  sg2.addColorStop(0.5, hsl(stormH, s + 15, l + 10, 0.5));
  sg2.addColorStop(1, "transparent");
  ctx.beginPath();
  ctx.ellipse(sx, sy, srx, sry, 0, 0, Math.PI * 2);
  ctx.fillStyle = sg2;
  ctx.fill();
  // Storm swirl rings
  for (let r = srx * 0.3; r < srx; r += srx * 0.15) {
    ctx.beginPath();
    ctx.ellipse(sx, sy, r, r * (sry / srx), 0, 0, Math.PI * 2);
    ctx.strokeStyle = hsl(stormH, s, l + 8, 0.12);
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Hot Jupiter: add thermal glow shimmer
  if (isHot) {
    const hg = ctx.createRadialGradient(W * 0.5, H * 0.4, 0, W * 0.5, H * 0.4, W * 0.6);
    hg.addColorStop(0, hsl(h + 40, s + 20, l + 30, 0.08));
    hg.addColorStop(1, "transparent");
    ctx.fillStyle = hg;
    ctx.fillRect(0, 0, W, H);
  }
}

// ─── Lava World ───────────────────────────────────────────────────────────────
function drawLava(ctx, W, H, rng) {
  // Dark basalt base
  ctx.fillStyle = hsl(10, 15, 8);
  ctx.fillRect(0, 0, W, H);

  // Dark terrain variation
  for (let i = 0; i < 30; i++) {
    const x = rng() * W;
    const y = rng() * H;
    const r = 20 + rng() * 60;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, hsl(10, 20, 14, 0.4));
    g.addColorStop(1, "transparent");
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
  }

  // Lava crack network (horizontal + vertical + diagonal)
  const numCracks = 18 + Math.floor(rng() * 14);
  for (let i = 0; i < numCracks; i++) {
    const x0 = rng() * W;
    const y0 = rng() * H;
    const len = 60 + rng() * 200;
    const angle = rng() * Math.PI * 2;
    const width = 1 + rng() * 5;
    const lavaH = 10 + rng() * 30;
    const lavaL = 45 + rng() * 25;

    ctx.beginPath();
    ctx.moveTo(x0, y0);
    let x = x0, y = y0;
    const segments = 8 + Math.floor(rng() * 8);
    for (let j = 0; j < segments; j++) {
      const drift = (rng() - 0.5) * 30;
      x += Math.cos(angle + drift * 0.05) * (len / segments);
      y += Math.sin(angle + drift * 0.05) * (len / segments);
      ctx.lineTo(x % W, y);
    }
    ctx.strokeStyle = hsl(lavaH, 100, lavaL, 0.7 + rng() * 0.3);
    ctx.lineWidth = width;
    ctx.shadowColor = hsl(lavaH, 100, 60);
    ctx.shadowBlur = 8 + rng() * 12;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Glowing hotspots / magma pools
  const numPools = 8 + Math.floor(rng() * 10);
  for (let i = 0; i < numPools; i++) {
    const x = rng() * W;
    const y = rng() * H;
    const r = 8 + rng() * 30;
    const poolH = 15 + rng() * 25;
    const pg = ctx.createRadialGradient(x, y, 0, x, y, r);
    pg.addColorStop(0, hsl(poolH, 100, 70, 0.85));
    pg.addColorStop(0.4, hsl(poolH + 10, 100, 55, 0.55));
    pg.addColorStop(0.8, hsl(poolH + 20, 90, 35, 0.25));
    pg.addColorStop(1, "transparent");
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = pg;
    ctx.fill();
  }
}

// ─── Water World ─────────────────────────────────────────────────────────────
function drawWater(ctx, W, H, h, s, l, rng) {
  // Deep ocean base
  const base = ctx.createLinearGradient(0, 0, 0, H);
  base.addColorStop(0, hsl(h - 5, s + 10, l - 10));
  base.addColorStop(0.5, hsl(h, s, l));
  base.addColorStop(1, hsl(h + 8, s - 5, l - 18));
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);

  // Ocean depth variation
  for (let i = 0; i < 20; i++) {
    const x = rng() * W;
    const y = rng() * H;
    const rx = W * (0.05 + rng() * 0.15);
    const ry = H * (0.06 + rng() * 0.18);
    const dg = ctx.createRadialGradient(x, y, 0, x, y, Math.max(rx, ry));
    dg.addColorStop(0, hsl(h + 10, s + 15, l - 12, 0.4));
    dg.addColorStop(1, "transparent");
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rng() * Math.PI, 0, Math.PI * 2);
    ctx.fillStyle = dg;
    ctx.fill();
  }

  // Cloud bands / swirls
  const numSwirls = 10 + Math.floor(rng() * 8);
  for (let i = 0; i < numSwirls; i++) {
    const cx = rng() * W;
    const cy = rng() * H;
    const rx = W * (0.06 + rng() * 0.16);
    const ry = H * (0.025 + rng() * 0.05);
    const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
    cg.addColorStop(0, `rgba(240,248,255,${0.4 + rng() * 0.35})`);
    cg.addColorStop(0.5, `rgba(220,235,255,${0.15 + rng() * 0.2})`);
    cg.addColorStop(1, "transparent");
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, (rng() - 0.5) * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = cg;
    ctx.fill();
    // Wrap
    if (cx < rx) {
      ctx.beginPath();
      ctx.ellipse(cx + W, cy, rx, ry, (rng() - 0.5) * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ─── Neptune-like ─────────────────────────────────────────────────────────────
function drawNeptune(ctx, W, H, h, s, l, rng) {
  const base = ctx.createLinearGradient(0, 0, 0, H);
  base.addColorStop(0, hsl(h - 10, s + 8, l - 12));
  base.addColorStop(0.5, hsl(h, s, l));
  base.addColorStop(1, hsl(h + 12, s - 5, l - 16));
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);

  // Bands
  for (let i = 0; i < 10; i++) {
    const y = (i / 10) * H;
    const bh = H / 10;
    const bg = ctx.createLinearGradient(0, y, 0, y + bh);
    const dh = (rng() - 0.5) * 20;
    const dl = (rng() - 0.5) * 18;
    bg.addColorStop(0, hsl(h + dh, s, l + dl, 0));
    bg.addColorStop(0.5, hsl(h + dh, s + 12, l + dl + 5, 0.3));
    bg.addColorStop(1, hsl(h + dh, s, l + dl, 0));
    ctx.fillStyle = bg;
    ctx.fillRect(0, y, W, bh);
  }

  // Swirling storms
  for (let i = 0; i < 4; i++) {
    const sx = rng() * W;
    const sy = H * (0.25 + rng() * 0.5);
    const sr = 20 + rng() * 40;
    const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
    sg.addColorStop(0, hsl(h - 15, s + 30, l + 22, 0.6));
    sg.addColorStop(0.5, hsl(h - 10, s + 15, l + 12, 0.3));
    sg.addColorStop(1, "transparent");
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fillStyle = sg;
    ctx.fill();
  }

  // High clouds streaks
  for (let i = 0; i < 12; i++) {
    const cy = rng() * H;
    const len = W * (0.1 + rng() * 0.3);
    const sx = rng() * W;
    ctx.beginPath();
    ctx.moveTo(sx, cy);
    ctx.bezierCurveTo(
      sx + len * 0.33, cy + (rng() - 0.5) * 8,
      sx + len * 0.66, cy + (rng() - 0.5) * 8,
      sx + len, cy + (rng() - 0.5) * 10
    );
    ctx.strokeStyle = `rgba(255,255,255,${0.08 + rng() * 0.14})`;
    ctx.lineWidth = 1 + rng() * 2;
    ctx.stroke();
  }
}

// ─── Subtle noise overlay ─────────────────────────────────────────────────────
function addNoiseOverlay(ctx, W, H, rng) {
  for (let i = 0; i < 300; i++) {
    const x = rng() * W;
    const y = rng() * H;
    const r = 1 + rng() * 4;
    const a = 0.015 + rng() * 0.03;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = rng() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a * 1.5})`;
    ctx.fill();
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function generatePlanetTexture(planet) {
  const W = 1024,
    H = 512;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  const rng = seededRng(hashStr((planet.name || planet.slug || "?") + planet.type));
  const [hv, sv, lv] = planet.skyColor ?? [210, 40, 40];
  const type = planet.type ?? "Rocky";

  ctx.imageSmoothingEnabled = true;

  if (type === "Gas Giant") {
    drawGasGiant(ctx, W, H, hv, sv, lv, rng, false);
  } else if (type === "Hot Jupiter") {
    drawGasGiant(ctx, W, H, hv, sv, lv, rng, true);
  } else if (type === "Lava World") {
    drawLava(ctx, W, H, rng);
  } else if (type === "Water World") {
    drawWater(ctx, W, H, hv, sv, lv, rng);
  } else if (type === "Neptune-like") {
    drawNeptune(ctx, W, H, hv, sv, lv, rng);
  } else {
    drawRocky(ctx, W, H, hv, sv, lv, rng, type === "Super-Earth");
    if (planet.habitableZone) drawPolarCaps(ctx, W, H, rng);
  }

  addNoiseOverlay(ctx, W, H, rng);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

// ─── Bump/roughness map ───────────────────────────────────────────────────────
export function generateBumpTexture(planet) {
  const W = 512,
    H = 256;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  const rng = seededRng(hashStr((planet.name || "?") + "bump" + planet.type));
  const type = planet.type ?? "Rocky";

  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, W, H);

  if (type === "Gas Giant" || type === "Hot Jupiter") {
    // Horizontal banding
    for (let i = 0; i < 16; i++) {
      const y = (i / 16) * H;
      const bh = H / 16;
      const v = 100 + Math.floor(rng() * 60);
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(0, y, W, bh * 0.7);
    }
  } else if (type === "Lava World") {
    // Crack heightmap
    for (let i = 0; i < 30; i++) {
      const x = rng() * W;
      const y = rng() * H;
      const r = 3 + rng() * 12;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,0.4)`;
      ctx.fill();
    }
  } else {
    // Rocky bumps
    for (let i = 0; i < 120; i++) {
      const x = rng() * W;
      const y = rng() * H;
      const r = 2 + rng() * 14;
      const v = 80 + Math.floor(rng() * 100);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgb(${v},${v},${v})`);
      g.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}
