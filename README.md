# SC4RWT — Real-World Terrain for SimCity 4

Browser app that turns a real-world map selection into a **16-bit grayscale heightmap PNG** for SimCity 4 regions.

![SC4RWT — aim the fixed center scope over a real map, tune water & height, generate a region heightmap](./docs/demo.jpg)

*San Francisco Bay — 4×4 large cities, auto coastal leveling, shareable URL params.*

## Features

- **Fixed real-world scale** — 1 SC4 terrain cell = **16 m**; map zoom only changes how the scope looks, not export size.
- **Center scope** — orange region overlay stays on screen; pan the map to aim what gets exported.
- **Region sizes** — 1×1, 2×2, 4×4, or 8×8 large cities (`N × 256 + 1` pixels per side).
- **Auto water & height** — reads elevation under the scope; coastal areas use 0 m AMSL, inland rivers use a low elevation band + optional vertical scale boost.
- **Manual overrides** — water plane, deepen, and vertical scale sliders; **Calculate from DEM** fills manual values from the current region.
- **Shareable setup** — `lat`, `lon`, `size`, `mode`, `plane`, `deepen`, and `scale` live in the URL query string.
- **Client-only** — terrain fetch, resample, encode, and PNG download run in the browser (Web Worker for generation).

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173/`).

Optional:

```bash
npm test          # unit tests
npm run build     # production bundle → dist/
npm run preview   # serve dist/
```

## Implementation

### Terrain

AWS Mapzen **Terrarium** tiles:

`https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png`

Decode: `height = r * 256 + g + b / 256 - 32768` (meters AMSL)

The export region is resampled to an exact **16 m** grid in a local UTM projection, then encoded to SC4 height values.

### Height encoding

```text
relative = (realElevationMeters - waterPlane) * verticalScale
if relative <= 0: relative -= waterDeepen
sc4HeightMeters = relative + 250
value16 = clamp(round(sc4HeightMeters * 10), 0, 65535)
```

With default water plane, real **0 m → value 2500** (SC4 sea level).

### PNG output

True **16-bit grayscale PNG** (custom encoder + zlib level 0): one sample per SC4 terrain cell, row order north-up in the file.

### URL parameters

| Param | Meaning |
|---|---|
| `lat`, `lon` | Export center |
| `size` | Large cities per side (1, 2, 4, 8) |
| `mode` | `auto` or `manual` |
| `plane`, `deepen`, `scale` | Manual water / height settings |
