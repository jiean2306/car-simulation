# Zootopia Velocity — 3D Showroom & Driving Simulator

A Three.js 3D driving simulator featuring a spinning-platform car showroom, 12 real-world automotive brands (19 unique `.glb` models), live visual customization, AT/MT sequential transmission, NA/Turbo/Supercharged induction physics, Web Audio engine synthesis, and highway overtake gameplay.

- **Live Demo (GitHub Pages):** https://jiean2306.github.io/car-simulation/

## Features

- **3D Spinning-Platform Showroom**: Browse 19 real 3D `.glb` cars across 12 brands (`Ferrari`, `Porsche`, `Lamborghini`, `McLaren`, `Nissan`, `BMW`, `Mercedes-Benz`, `Audi`, `Chevrolet`, `Volkswagen`, `Jeep`, `Xiaomi`) with smooth camera transitions, drag-to-spin, and lazy-loading for large models.
- **Live Customization & Dyno**: Customize paint, finish, rims, brake calipers, rear wings, roof accessories, underglow, glass tint, camber, ride height, stage tune, turbo/supercharger, tires, brakes, and AT/MT transmission with a real-time torque/power dyno curve.
- **Physics & Audio**: Gear-ratio coupling, boost spooling, blow-off valve audio, tire grip/slip modeling, live Rear/Left/Right mirrors, GPS traffic radar, and engine sound-wave oscilloscope.

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
- `js/carCatalog.js` — 12-brand / 19-car `.glb` catalog and engine specs
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
