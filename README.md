# Exoplanet Explorer

An interactive web app for exploring every confirmed exoplanet, powered by live data from the NASA Exoplanet Archive. Browse 6,000+ worlds, spin 3D procedurally-textured planet globes, view real atmospheric spectra from Hubble and JWST, read linked discovery papers, watch the history of discovery unfold, and navigate a real 3D map of nearby star systems.

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
- **Atmospheric spectrum** — if the NASA Exoplanet Archive `spectra` table has transmission or emission data for this planet (e.g. from JWST NIRSpec, Hubble WFC3, or Spitzer), a wavelength vs. transit depth chart is rendered, color-coded by instrument/facility
- **Research papers** — up to 5 recent papers from NASA ADS (Astrophysics Data System) for this planet, with expandable abstracts and direct links to the ADS record

### 3D Star Map
A navigable WebGL space showing thousands of real star systems as glowing billboard sprites, positioned using actual RA/Dec/distance coordinates from the NASA catalog. Color-coded by stellar type (red dwarf, sun-like, hot star). Habitable-zone systems are highlighted in teal and rendered larger, with permanent 3D labels floating above them. A collapsible side panel lists all habitable systems in range sorted by distance. A **Habitable Only** toggle filters the map to just those systems with all labels shown. Filter by maximum distance (200 ly → 5,000 ly). Click any star system to navigate to one of its planets.

### Discovery Timeline
An animated dot-plot of every exoplanet ever found, organized by discovery year. Each dot is a real planet, colored by type. Use play/pause controls, a scrubber, and speed buttons to watch the history of exoplanet discovery unfold from 1992 to the present. Click any dot to open that planet's detail page.

### Landing Page
Live stats (total confirmed planets, planetary systems, potentially habitable worlds, year of first discovery) computed directly from the NASA dataset. Features a curated selection of notable worlds and a discovery history section.

---

## How it works

### Data pipeline

NASA's [Exoplanet Archive TAP API](https://exoplanetarchive.ipac.caltech.edu/docs/TAP/usingTAP.html) (`pscomppars` table) is queried on first load and cached in `sessionStorage` for 6 hours. A set of 8 hand-curated "featured" planets (TRAPPIST-1e, Kepler-442b, 55 Cancri e, etc.) carry extra metadata — rich descriptions, atmosphere text, hand-tuned visuals — that is merged on top of the live NASA rows by fuzzy name matching.

On first load, the client hits `/api/exoplanets` — a dedicated Worker endpoint. In production the Worker checks Cloudflare KV first; on a hit it returns the cached JSON instantly from edge storage. On a miss it fetches from NASA, writes to KV with a 6-hour TTL (via `ctx.waitUntil` so it doesn't delay the response), and returns the data. All subsequent visitors share the same cached copy until it expires. The client also caches the processed planet array in `sessionStorage` for the browser tab lifetime so navigating between pages is instant.

On-demand queries (spectra, etc.) still go through the `/nasa-tap/*` generic proxy. SPA routing is handled by `not_found_handling: single-page-application` in `wrangler.jsonc`.

### Atmospheric spectra

Spectral data is fetched on demand (per planet detail page visit) from the NASA Exoplanet Archive `spectra` table via the same `/nasa-tap` proxy. The query selects wavelength, transit depth (`dp` in (Rp/Rs)² fraction → converted to ppm), error bars, and facility/instrument. The chart color-codes points by observatory: JWST = teal (NIRSpec) / orange (MIRI), Hubble = blue, Spitzer = amber. Data is cached in memory for the session.

### Research papers (NASA ADS)

Papers are fetched via a `/api/papers` endpoint added to the Cloudflare Worker, which injects the `ADS_TOKEN` secret server-side and proxies to `api.adsabs.harvard.edu`. The client never sees the token. Results are cached in memory per planet name. If `ADS_TOKEN` is not configured, the papers section is silently hidden.

To enable: set the secret in Cloudflare:
```bash
wrangler secret put ADS_TOKEN
# paste your token from https://ui.adsabs.harvard.edu/user/settings/token
```

### 3D planet rendering

Planet textures are generated procedurally on a `<canvas>` using a seeded Xorshift32 RNG keyed on the planet's name, so the same planet always looks identical across navigations. Textures are uploaded to Three.js as `CanvasTexture` with a matching bump map for surface relief.

### Earth Similarity Index

ESI is computed per planet using the Planetary Habitability Laboratory formula, incorporating up to four parameters depending on available data: radius (weight 0.57), bulk density (1.07), escape velocity (0.70), and surface temperature (5.58). A planet with ESI ≥ 0.8 is considered highly Earth-like; ≥ 0.6 is the "Earth-like" filter threshold.

### Star system diagram

Orbital radii are derived from Kepler's third law: `a (AU) = (P / 365.25)^(2/3)` where `P` is the orbital period in days. The diagram shows all planets in the NASA catalog that share the same `hostname`.

### 3D star map

RA/Dec/distance from the NASA catalog are converted to Cartesian coordinates:
```
x = dist × cos(dec) × cos(ra)
y = dist × sin(dec)
z = dist × cos(dec) × sin(ra)
```
Rendered as an `InstancedMesh` of billboard-oriented quad sprites with additive blending, sized by planet count and habitable-zone status, colored by stellar temperature. Habitable systems override the star color to teal (`#40e0c0`) and render at 2× size with `Html` labels.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + Vite 8 |
| Routing | React Router v7 |
| Styling | Tailwind CSS v4 (Vite plugin) + inline styles |
| 3D | Three.js · @react-three/fiber · @react-three/drei |
| Data | NASA Exoplanet Archive TAP API (pscomppars + spectra tables) |
| Papers | NASA Astrophysics Data System (ADS) API |
| Fonts | Audiowide · Space Mono · DM Sans (Google Fonts) |
| Deployment | Cloudflare Pages + Workers via Wrangler v4 |

---

## Project structure

```
src/
  components/
    ADSPapers.jsx           # Expandable list of NASA ADS research papers
    Navbar.jsx              # Fixed top nav with active-route highlighting
    Planet3D.jsx            # Three.js Canvas with procedural textures + OrbitControls
    PlanetCard.jsx          # Catalog grid card (CSS planet visual, no WebGL)
    SpectraChart.jsx        # SVG atmospheric transmission/emission spectrum chart
    StarField.jsx           # Animated CSS star field background
    StarSystemDiagram.jsx   # SVG orbital map for all planets in a system
    TypeBadge.jsx           # Planet type + habitable zone badge
  data/
    exoplanets.js           # 8 hand-curated featured planets with rich metadata
  hooks/
    useADSPapers.js         # Fetches recent papers from NASA ADS via /api/papers
    useExoplanetSpectra.js  # Fetches spectra from NASA TAP `spectra` table
    useNASAExoplanets.js    # Fetches, caches (6h), and merges NASA + featured data
  lib/
    planetUtils.js          # Classification, ESI, slug, visuals, nasaRowToPlanet
    textureGen.js           # Procedural canvas texture generator for Three.js
  pages/
    LandingPage.jsx         # Hero, live stats, featured worlds, discovery timeline
    CatalogPage.jsx         # Filterable, searchable, sortable, paginated catalog
    PlanetPage.jsx          # Planet detail: 3D globe, ESI, spectrum, papers, system diagram
    StarMapPage.jsx         # 3D navigable map of nearby star systems
    TimelinePage.jsx        # Animated discovery timeline dot-plot
  worker.js                 # Cloudflare Worker: NASA TAP proxy + ADS proxy
```

---

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). NASA data loads on first visit and is cached for 6 hours. The spectra and ADS paper sections are fetched per planet on demand.

## Deployment

Hosted on Cloudflare Pages via Wrangler. The `wrangler.jsonc` config sets SPA routing (`not_found_handling: single-page-application`) so all paths serve `index.html`.

```bash
npm run deploy        # builds with Vite then publishes via wrangler
```

To run a local preview of the production build:

```bash
npm run preview       # vite build + wrangler dev
```

### KV cache (shared planet catalog — strongly recommended)

Without KV every visitor triggers a fresh NASA API call (~1–3 s). With KV the Worker fetches once every 6 hours and all visitors hit edge storage instead.

```bash
# 1. Create the namespace (run once)
wrangler kv namespace create NASA_CACHE
# → prints: { binding: "NASA_CACHE", id: "abc123..." }

wrangler kv namespace create NASA_CACHE --preview
# → prints: { binding: "NASA_CACHE", preview_id: "def456..." }

# 2. Paste both IDs into wrangler.jsonc (the commented-out kv_namespaces block)
# 3. Deploy
npm run deploy
```

The Worker code gracefully falls back to a direct NASA fetch if the binding is absent, so the site works before KV is configured.

### Secrets

| Secret | Required | How to set |
|---|---|---|
| `ADS_TOKEN` | Optional — enables the Research Papers section | `wrangler secret put ADS_TOKEN` |

Get an ADS token for free at [ui.adsabs.harvard.edu/user/settings/token](https://ui.adsabs.harvard.edu/user/settings/token).

Secrets and KV preview IDs for local Wrangler dev go in `.dev.vars` — gitignored, never committed:
```
ADS_TOKEN=your_token_here
```
