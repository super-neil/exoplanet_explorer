// ─── Deterministic seeded RNG (Xorshift32) ────────────────────────────────────
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

// ─── Slug ─────────────────────────────────────────────────────────────────────
export function slugify(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

// ─── Planet type classification ────────────────────────────────────────────────
export function classifyType(radiusEarth, massEarth, tempK) {
  if (tempK != null && tempK > 1500) return "Lava World";
  const r = radiusEarth;
  const m = massEarth;
  if (r != null) {
    if (r >= 10) return "Hot Jupiter";
    if (r >= 5) return "Gas Giant";
    if (r >= 3.5) return "Neptune-like";
    if (r >= 1.75) return "Super-Earth";
    return "Rocky";
  }
  if (m != null) {
    if (m >= 100) return "Gas Giant";
    if (m >= 15) return "Neptune-like";
    if (m >= 2) return "Super-Earth";
  }
  return "Rocky";
}

// ─── Habitable zone check ─────────────────────────────────────────────────────
export function isHabitable(tempK, type) {
  if (type === "Gas Giant" || type === "Hot Jupiter") return false;
  return tempK != null && tempK >= 190 && tempK <= 330;
}

// ─── Visual property generation (deterministic per planet name) ───────────────
export function getPlanetVisuals(type, planetName) {
  const rng = seededRng(hashStr((planetName || "unknown") + type));
  const r = () => rng();

  switch (type) {
    case "Rocky": {
      const palette = [
        [25, 35, 42], [15, 48, 38], [0, 30, 32], [200, 18, 36], [40, 28, 40],
      ];
      const [h, s, l] = palette[Math.floor(r() * palette.length)];
      return {
        skyColor: [h, s, l],
        accentColor: `hsl(${h + 20},${s + 25}%,${l + 28}%)`,
        bgGradient: `radial-gradient(ellipse at ${30 + r() * 40}% ${30 + r() * 40}%, hsl(${h},${s}%,${l - 24}%) 0%, hsl(${h},${s - 8}%,${l - 32}%) 50%, hsl(${h},${s - 14}%,${l - 38}%) 100%)`,
      };
    }
    case "Super-Earth": {
      const h = Math.round(190 + r() * 60);
      const s = Math.round(40 + r() * 30);
      const l = Math.round(35 + r() * 18);
      return {
        skyColor: [h, s, l],
        accentColor: `hsl(${h},${s + 20}%,${l + 26}%)`,
        bgGradient: `radial-gradient(ellipse at ${30 + r() * 40}% ${30 + r() * 40}%, hsl(${h},${s}%,${l - 26}%) 0%, hsl(${h - 20},${s - 8}%,${l - 34}%) 50%, hsl(${h - 30},${s - 18}%,${l - 40}%) 100%)`,
      };
    }
    case "Gas Giant": {
      const h = Math.round(30 + r() * 200);
      const s = Math.round(40 + r() * 35);
      const l = Math.round(44 + r() * 18);
      return {
        skyColor: [h, s, l],
        accentColor: `hsl(${h},${s}%,${l + 22}%)`,
        bgGradient: `radial-gradient(ellipse at ${30 + r() * 40}% ${30 + r() * 40}%, hsl(${h},${s}%,${l - 28}%) 0%, hsl(${h + 12},${s - 8}%,${l - 38}%) 50%, hsl(${h},${s - 14}%,${l - 44}%) 100%)`,
      };
    }
    case "Hot Jupiter": {
      const h = Math.round((260 + r() * 80) % 360);
      const s = Math.round(48 + r() * 30);
      const l = Math.round(38 + r() * 24);
      return {
        skyColor: [h, s, l],
        accentColor: `hsl(${(h + 40) % 360},${s + 12}%,${l + 22}%)`,
        bgGradient: `radial-gradient(ellipse at ${30 + r() * 40}% ${30 + r() * 40}%, hsl(${h},${s}%,${l - 28}%) 0%, hsl(${h + 20},${s - 8}%,${l - 36}%) 50%, hsl(${h + 10},${s - 14}%,${l - 42}%) 100%)`,
      };
    }
    case "Neptune-like": {
      const h = Math.round(200 + r() * 55);
      const s = Math.round(48 + r() * 28);
      const l = Math.round(34 + r() * 18);
      return {
        skyColor: [h, s, l],
        accentColor: `hsl(${h},${s + 22}%,${l + 26}%)`,
        bgGradient: `radial-gradient(ellipse at ${30 + r() * 40}% ${30 + r() * 40}%, hsl(${h},${s}%,${l - 24}%) 0%, hsl(${h + 14},${s - 6}%,${l - 32}%) 50%, hsl(${h},${s - 18}%,${l - 40}%) 100%)`,
      };
    }
    case "Lava World":
      return {
        skyColor: [15, 85, 60],
        accentColor: `hsl(${20 + r() * 20},100%,${55 + r() * 10}%)`,
        bgGradient: `radial-gradient(ellipse at ${40 + r() * 20}% ${50 + r() * 20}%, #1a0d05 0%, #100805 40%, #080402 100%)`,
      };
    case "Water World": {
      const h = Math.round(185 + r() * 30);
      const s = Math.round(58 + r() * 20);
      const l = Math.round(38 + r() * 14);
      return {
        skyColor: [h, s, l],
        accentColor: `hsl(${h},${s + 20}%,${l + 22}%)`,
        bgGradient: `radial-gradient(ellipse at ${30 + r() * 40}% ${30 + r() * 40}%, hsl(${h},${s}%,${l - 28}%) 0%, hsl(${h + 10},${s - 4}%,${l - 36}%) 50%, hsl(${h},${s - 20}%,${l - 44}%) 100%)`,
      };
    }
    default:
      return getPlanetVisuals("Rocky", planetName);
  }
}

// ─── Star type label from Teff ─────────────────────────────────────────────────
export function starTypeLabel(teff) {
  if (teff == null) return "Unknown Star";
  if (teff > 10000) return "O/B-type Giant";
  if (teff > 7500) return "A-type Star";
  if (teff > 6000) return "F-type Star";
  if (teff > 5200) return "G-type (Sun-like)";
  if (teff > 3700) return "K-type Orange Dwarf";
  return "M-type Red Dwarf";
}

// ─── Surface gravity estimate ─────────────────────────────────────────────────
export function estimateGravity(radius, mass) {
  if (!radius || !mass) return null;
  return Math.round((mass / (radius * radius)) * 100) / 100;
}

// ─── Auto-generated description ───────────────────────────────────────────────
export function autoDescription(name, type, tempK, distLY, starTeff) {
  const typeDesc = {
    Rocky: "a rocky terrestrial world",
    "Super-Earth": "a super-Earth larger than our own planet",
    "Gas Giant": "a gas giant",
    "Hot Jupiter": "a bloated hot Jupiter",
    "Neptune-like": "a Neptune-sized ice giant",
    "Lava World": "a volcanic lava world",
    "Water World": "a water-rich ocean world",
  }[type] || "an exoplanet";

  const distStr = distLY != null ? ` ${distLY.toLocaleString()} light-years away` : "";
  const starStr =
    starTeff != null
      ? `, orbiting ${
          starTeff < 3800
            ? "a cool red dwarf"
            : starTeff < 5200
              ? "an orange dwarf"
              : starTeff < 6000
                ? "a Sun-like star"
                : "a hot stellar companion"
        }`
      : "";
  const tempStr =
    tempK != null
      ? `. At ${tempK - 273}°C, ${
          tempK > 1500
            ? "the surface glows with molten rock"
            : tempK > 700
              ? "conditions are brutally hostile"
              : tempK > 330
                ? "it is too hot for liquid water"
                : tempK > 190
                  ? "liquid water could potentially exist on its surface"
                  : "it is locked in a deep freeze"
        }`
      : "";

  return `${name} is ${typeDesc}${distStr}${starStr}${tempStr}.`;
}

// ─── Earth Similarity Index ───────────────────────────────────────────────────
// Partial ESI using available data. Full formula needs radius, density, escape
// velocity, and surface temperature. We compute with what we have.
export function computeESI(radiusEarth, massEarth, tempK) {
  const term = (val, ref, w) => Math.pow(1 - Math.abs(val - ref) / (val + ref), w);
  const terms = [];
  const weights = [];

  if (radiusEarth != null && radiusEarth > 0) {
    terms.push(term(radiusEarth, 1.0, 0.57));
    weights.push(0.57);
    if (massEarth != null && massEarth > 0) {
      terms.push(term(massEarth / radiusEarth ** 3, 1.0, 1.07)); // density ratio
      terms.push(term(Math.sqrt(massEarth / radiusEarth), 1.0, 0.70)); // escape vel ratio
      weights.push(1.07, 0.70);
    }
  }
  if (tempK != null && tempK > 0) {
    terms.push(term(tempK, 288, 5.58));
    weights.push(5.58);
  }
  if (terms.length < 2) return null;
  const totalW = weights.reduce((a, b) => a + b, 0);
  const product = terms.reduce((a, b) => a * b, 1);
  return Math.round(Math.pow(product, 1 / totalW) * 100) / 100;
}

// ─── Convert NASA API row → our planet format ─────────────────────────────────
export function nasaRowToPlanet(row, enhancedData = null) {
  const distLY =
    row.sy_dist != null ? Math.round(row.sy_dist * 3.26156 * 10) / 10 : null;
  const tempK = row.pl_eqt != null ? Math.round(row.pl_eqt) : null;
  const radius = row.pl_rade != null ? Math.round(row.pl_rade * 100) / 100 : null;
  const mass = row.pl_bmasse != null ? Math.round(row.pl_bmasse * 100) / 100 : null;
  const type = classifyType(radius, mass, tempK);
  const habitable = isHabitable(tempK, type);
  const visuals = getPlanetVisuals(type, row.pl_name);

  const esi = computeESI(radius, mass, tempK);

  return {
    // Enhanced data takes precedence where available
    ...(enhancedData || {}),
    // NASA data fields
    name: row.pl_name,
    hostname: row.hostname || null,
    slug: slugify(row.pl_name),
    discovery: row.discoverymethod || "Unknown",
    year: row.disc_year,
    distance: distLY,
    distParsec: row.sy_dist ?? null,
    ra: row.ra ?? null,
    dec: row.dec ?? null,
    mass,
    radius,
    orbitalPeriod: row.pl_orbper != null ? Math.round(row.pl_orbper * 10) / 10 : null,
    tempK,
    esi,
    starType: enhancedData?.starType || starTypeLabel(row.st_teff),
    starTemp: row.st_teff != null ? Math.round(row.st_teff) : null,
    type: enhancedData?.type || type,
    habitableZone: enhancedData?.habitableZone ?? habitable,
    description:
      enhancedData?.description ||
      autoDescription(row.pl_name, type, tempK, distLY, row.st_teff),
    atmosphere: enhancedData?.atmosphere || "Awaiting spectroscopic analysis",
    surfaceGravity: enhancedData?.surfaceGravity || estimateGravity(radius, mass),
    // Visual properties — enhanced data's overrides used when available
    ...(enhancedData
      ? {
          skyColor: enhancedData.skyColor,
          accentColor: enhancedData.accentColor,
          bgGradient: enhancedData.bgGradient,
        }
      : visuals),
    isNASA: true,
  };
}
