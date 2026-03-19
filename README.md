# Exoplanet Explorer

An interactive web app for exploring the known exoplanets of our galaxy, powered by live data from the NASA Exoplanet Archive.

## What it does

- **Catalog** — browse all 6,000+ confirmed exoplanets pulled live from NASA's `pscomppars` table, with filtering by planet type (Rocky, Gas Giant, Lava World, Water World, etc.), search by name/type/star/discovery method, and sorting by discovery year, distance, or mass
- **3D planet viewer** — each planet detail page renders a procedurally textured, rotatable 3D globe using Three.js; texture style varies by planet type (lava crack networks, gas band turbulence, ocean swirls, rocky craters)
- **Planet details** — orbital period, equilibrium temperature, radius, mass, host star info, discovery method, Earth comparison bars, and curated descriptions for featured worlds
- **Live stats** — the landing page shows real-time counts of confirmed exoplanets, planetary systems, potentially habitable worlds, and the year of first discovery

## How it works

### Data pipeline

NASA's [Exoplanet Archive TAP API](https://exoplanetarchive.ipac.caltech.edu/docs/TAP/usingTAP.html) is queried on first load and cached in `sessionStorage` for 6 hours. A small set of 8 hand-curated "featured" planets (TRAPPIST-1e, Kepler-442b, etc.) carry extra metadata — descriptions, atmosphere text, hand-tuned visuals — that is merged on top of the live NASA rows by fuzzy name matching.

In development, requests are proxied through Vite (`/nasa-tap → exoplanetarchive.ipac.caltech.edu`) to avoid CORS issues. In production the API is called directly.

### 3D rendering

Planet textures are generated procedurally on a `<canvas>` using a seeded Xorshift32 RNG, so the same planet always looks identical across navigations. Textures are passed to Three.js as `CanvasTexture` with a bump map for surface relief. The scene uses `meshStandardMaterial` with PBR lighting: a broad ambient fill, a star-colored primary point light, and a hemisphere fill light. Gas giants get a `RingGeometry` ring system; lava worlds get an emissive glow halo.

### Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + Vite |
| Routing | React Router v6 |
| Styling | Tailwind CSS v4 (Vite plugin) + inline styles |
| 3D | Three.js · @react-three/fiber · @react-three/drei |
| Data | NASA Exoplanet Archive TAP API |
| Fonts | Audiowide · Playfair Display · Space Mono · DM Sans |

## Project structure

```
src/
  components/
    Navbar.jsx        # Fixed top nav with active-route highlighting
    Planet3D.jsx      # Three.js Canvas component with OrbitControls
    PlanetCard.jsx    # Catalog grid card with CSS planet visual
    StarField.jsx     # Animated background star field
  data/
    exoplanets.js     # 8 hand-curated featured planets with rich metadata
  hooks/
    useNASAExoplanets.js  # Fetches, caches, and merges NASA + featured data
  lib/
    planetUtils.js    # Planet classification, slug generation, visual params
    textureGen.js     # Procedural canvas texture generator for Three.js
  pages/
    LandingPage.jsx   # Hero, live stats, featured worlds, discovery timeline
    CatalogPage.jsx   # Filterable, searchable, paginated planet catalog
    PlanetPage.jsx    # Individual planet detail with 3D globe
```

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).
