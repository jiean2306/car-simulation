# Zootopia Velocity — 3D Showroom & Driving Simulator

A Three.js 3D driving simulator featuring a virtualized spinning-platform car showroom, 16 real-world automotive brands (44 dedicated 1-to-1 `.glb` models with zero rebadging), searchable car picker, live visual customization, AT/MT sequential transmission, NA/Turbo/Supercharged/EV powertrain physics, Web Audio engine synthesis, and highway overtake gameplay.

- **Live Demo (GitHub Pages):** https://jiean2306.github.io/car-simulation/

## Features

- **3D Spinning-Platform Showroom**: Browse 44 dedicated real 3D `.glb` cars across 16 brands (`Ferrari`, `Porsche`, `BMW`, `Mercedes-Benz`, `Audi`, `Toyota`, `Nissan`, `Lamborghini`, `McLaren`, `Chevrolet`, `Ford`, `Dodge`, `Hyundai`, `Tesla`, `Jeep`, `Xiaomi`) via a virtualized 3-platform turntable pool, brand filters, or a searchable model dropdown with chassis icons, backed by Draco + Meshopt lazy-streaming.
- **Live Customization & Dyno**: Customize paint, finish, rims, brake calipers, rear wings, roof accessories, underglow, glass tint, camber, ride height, stage tune, turbo/supercharger, tires, brakes, and AT/MT transmission with a real-time torque/power dyno curve.
- **Physics, Cameras & Audio**: Throttle-driven engine RPM (braking slows the car without artificially clamping RPM), induction-specific torque curves and turbo spool lag, lower-gear redline speed locks in Manual mode, Chase/Hood/Cockpit/Orbit cameras, live Rear/Left/Right mirrors, GPS traffic radar, and engine sound-wave oscilloscope.

## Controls

| Key / Input | Action |
|---|---|
| `←` / `→` (Showroom) | Previous / Next car platform |
| `Drag` (Showroom) | Spin car on turntable |
| `W` / `↑` | Throttle |
| `S` / `↓` | Brake / Reverse |
| `A` / `D` or `←` / `→` | Steer |
| `Space` | Handbrake |
| `Shift` | Nitrous Boost |
| `T` | Toggle `AT` (Auto) / `MT` (Manual Sequential) |
| `E` / `Q` (or `+` / `-`) | Upshift / Downshift |
| `C` | Cycle camera (`Chase`, `Hood`, `Cockpit`, `Orbit`) |
| `M` | Toggle live mirrors |
| `G` / `P` | Showroom / Pause |

## Run Locally

```powershell
node server.js
```

Then open http://localhost:8480/ in your browser.

## Project Structure

- `index.html` — Showroom UI, customization drawer, and driving HUD
- `css/style.css` — Glassmorphism showroom & telemetry styling
- `js/main.js` — Main simulation loop, physics, HUD, and showroom controller
- `js/showroom.js` — 3D spinning-platform showroom scene and camera controller
- `js/carCatalog.js` — 16-brand / 44-car 1-to-1 `.glb` catalog and engine specs
- `js/vehicles.js` — `.glb` normalization, material customization, and traffic fleet
- `js/assets.js` — Three.js GLTF/HDR/texture loader and lazy asset cache
- `js/world.js` — Streaming highway environment
- `js/audio.js` — Web Audio API engine & turbo synth + waveform renderer
- `assets/models/` — Real 3D `.glb` vehicle models
- `vendor/` — Local Three.js & GLTFLoader modules
- `server.js` — Lightweight static HTTP server for local development

## Publish to GitHub Pages

1. Push `main` to GitHub (`https://github.com/jiean2306/car-simulation.git`).
2. Open **Settings → Pages** (`https://github.com/jiean2306/car-simulation/settings/pages`).
3. Set **Source** to **Deploy from a branch**, select **`main`** and **`/ (root)`**, and click **Save**.
