# Exoplanet Explorer

An interactive web app for exploring every confirmed exoplanet, powered by live data from the NASA Exoplanet Archive. Browse 6,000+ worlds, spin 3D procedurally-textured planet globes, watch the history of discovery unfold, and navigate a real 3D map of nearby star systems.

---

## Features

### Catalog
Browse all 6,000+ confirmed exoplanets pulled live from NASA's `pscomppars` table. Filter by planet type (Rocky, Super-Earth, Gas Giant, Hot Jupiter, Lava World, Water World, Neptune-like), by habitability, or by Earth Similarity Index. Search by name, star, discovery method, or type. Sort by discovery year, distance, mass, or ESI. The **Surprise Me** button jumps to a random planet from the full catalog.

### Planet Detail Pages
Each planet gets a detail page with:
- A rotatable **3D globe** rendered in WebGL with a procedurally generated texture unique to that planet
- Orbital stats, temperature, radius, mass, host star info, and discovery details
- **Earth Similarity Index (ESI)** — a 0–1 score measuring how Earth-like the planet is based on radius, density, escape velocity, and surface temperature
- **Bidirectional Earth comparison bars** — values smaller than Earth extend left, larger extend right
- **Star system diagram** — an SVG orbital map showing all known planets in the same star system, with relative orbital radii from Kepler's third law; click any planet to navigate to it
- Narrative "What You'd Experience" text tailored to the planet's conditions

### 3D Star Map
A navigable WebGL space showing thousands of real star systems as glowing points, positioned using actual RA/Dec/distance coordinates from the NASA catalog. Color-coded by stellar type (red dwarf, sun-like, hot star). Filter by maximum distance. Click any star system to navigate to one of its planets.

### Discovery Timeline
An animated dot-plot of every exoplanet ever found, organized by discovery year. Each dot is a real planet, colored by type. Use play/pause controls, a scrubber, and speed buttons to watch the history of exoplanet discovery unfold from 1992 to the present. Click any dot to open that planet's detail page.

### Landing Page
Live stats (total confirmed planets, planetary systems, potentially habitable worlds, year of first discovery) computed directly from the NASA dataset. Features a curated selection of notable worlds and a discovery history section.

---

## How it works

### Data pipeline

NASA's [Exoplanet Archive TAP API](https://exoplanetarchive.ipac.caltech.edu/docs/TAP/usingTAP.html) (`pscomppars` table) is queried on first load and cached in `sessionStorage` for 6 hours. A set of 8 hand-curated "featured" planets (TRAPPIST-1e, Kepler-442b, 55 Cancri e, etc.) carry extra metadata — rich descriptions, atmosphere text, hand-tuned visuals — that is merged on top of the live NASA rows by fuzzy name matching (e.g. `"TRAPPIST-1 e"` → `"trappist-1e"`).

In development, requests are proxied through Vite (`/nasa-tap → exoplanetarchive.ipac.caltech.edu`) to avoid CORS. In production the API is called directly.

### 3D planet rendering

Planet textures are generated procedurally on a `<canvas>` using a seeded Xorshift32 RNG keyed on the planet's name, so the same planet always looks identical across navigations. Textures are uploaded to Three.js as `CanvasTexture` with a matching bump map for surface relief. Dispatch by planet type: rocky worlds get continents, craters, and polar caps; gas giants get horizontal bands and storm ovals; lava worlds get crack networks with magma glow; ocean worlds get depth-varied water with cloud swirls.

The scene uses `meshStandardMaterial` (PBR) with a broad ambient fill, a star-color-matched primary point light (decay=0), and a hemisphere fill. Gas giants get a `RingGeometry` ring system; lava worlds get an emissive glow halo; all planets get an atmosphere sphere rendered with `THREE.BackSide`.

### Earth Similarity Index

ESI is computed per planet using the Planetary Habitability Laboratory formula, incorporating up to four parameters depending on available data: radius (weight 0.57), bulk density (1.07), escape velocity (0.70), and surface temperature (5.58). A planet with ESI ≥ 0.8 is considered highly Earth-like; ≥ 0.6 is the "Earth-like" filter threshold.

### Star system diagram

Orbital radii are derived from Kepler's third law: `a (AU) = (P / 365.25)^(2/3)` where `P` is the orbital period in days. Planets are spread evenly around their orbits so they don't stack on top of each other. The diagram shows all planets in the NASA catalog that share the same `hostname`.

### 3D star map

RA/Dec/distance from the NASA catalog are converted to Cartesian coordinates:
```
x = dist × cos(dec) × cos(ra)
y = dist × sin(dec)
z = dist × cos(dec) × sin(ra)
```
Rendered as an `InstancedMesh` of low-poly spheres, sized by planet count and habitable-zone status, colored by stellar temperature.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + Vite |
| Routing | React Router v6 |
| Styling | Tailwind CSS v4 (Vite plugin) + inline styles |
| 3D | Three.js · @react-three/fiber · @react-three/drei |
| Data | NASA Exoplanet Archive TAP API |
| Fonts | Audiowide · Space Mono · DM Sans (Google Fonts) |

---

## Project structure

```
src/
  components/
    Navbar.jsx              # Fixed top nav with active-route highlighting
    Planet3D.jsx            # Three.js Canvas with procedural textures + OrbitControls
    PlanetCard.jsx          # Catalog grid card (CSS planet visual, no WebGL)
    StarField.jsx           # Animated CSS star field background
    StarSystemDiagram.jsx   # SVG orbital map for all planets in a system
    TypeBadge.jsx           # Planet type + habitable zone badge
  data/
    exoplanets.js           # 8 hand-curated featured planets with rich metadata
  hooks/
    useNASAExoplanets.js    # Fetches, caches (6h), and merges NASA + featured data
  lib/
    planetUtils.js          # Classification, ESI, slug, visuals, nasaRowToPlanet
    textureGen.js           # Procedural canvas texture generator for Three.js
  pages/
    LandingPage.jsx         # Hero, live stats, featured worlds, discovery timeline
    CatalogPage.jsx         # Filterable, searchable, sortable, paginated catalog
    PlanetPage.jsx          # Planet detail: 3D globe, ESI, system diagram, comparison bars
    StarMapPage.jsx         # 3D navigable map of nearby star systems
    TimelinePage.jsx        # Animated discovery timeline dot-plot
```

---

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). NASA data loads on first visit and is cached for 6 hours; subsequent navigations are instant.
