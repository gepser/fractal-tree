# Fractal Tree Remastered 🌳

[![Made with p5.js](https://img.shields.io/badge/Made%20with-p5.js-ed225d?logo=p5.js&logoColor=white)](https://p5js.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-2ea44f.svg)](./LICENSE)
[![Live Demo](https://img.shields.io/badge/Live-Demo-0ea5e9)](https://fractal.gepser.dev/)

A retro coding project rebuilt as a clean, interactive generative-art playground.

## Highlights ✨

- Live controls for angle, branch reduction, minimum branch length, and base thickness.
- Palette switcher with four styles: `Rainbow`, `Forest`, `Sunset`, and `Mono Ink`.
- One-click preset buttons: `Classic`, `Dense canopy`, `Minimal winter`.
- Seed tools to apply an exact seed and copy it for sharing.
- Export any render as PNG.
- Keyboard shortcuts for fast iteration:
  - `R` new random tree
  - `M` mutate current tree
  - `S` save PNG

## Quick Start 🚀

```bash
python3 -m http.server 4173
```

Then open [http://localhost:4173](http://localhost:4173).

## Test Locally Before Deploy 🧪

1. Start the local server.
2. Open [http://localhost:4173](http://localhost:4173).
3. Verify these actions:
   - sliders update the tree in real time
   - presets change style instantly
   - `Apply` uses your manual seed value
   - `Copy seed` copies the current seed
   - `Save PNG` downloads an image
4. Force refresh if you see old assets:
   - macOS: `Cmd + Shift + R`
   - Windows/Linux: `Ctrl + F5`

## Stack 📦

- HTML
- CSS
- JavaScript
- [p5.js](https://p5js.org/)

## License 📄

MIT. See [`LICENSE`](./LICENSE).
