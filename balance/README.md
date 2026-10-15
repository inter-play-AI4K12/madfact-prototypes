# MadFact — Balance

A 5×5 Three.js matrix of hinged cells and a shared platform. Includes integer ground truth (1–5), decimal predictions, bar/solid-edge views, error colors, camera controls, 2× cell tilt (±70°), and 40 one-handle optimization steps: a slow first round and a faster second round.

Extracted from https://embodied-matrix-factorization.farhadierf.chatgpt.site/balance on 2026-10-15. Runs independently of the other prototypes; no sign-in, server, database, or Sites account is required.

## Run

Requires Node.js 22.13+ and npm.

```sh
npm ci
npm run dev
```

## Check and build

```sh
npm run typecheck
npm test
npm run build
npm run preview
```

Deploy the generated `dist/` directory to any static host. Relative asset paths support hosting in a subdirectory. `src/App.tsx` contains the interface; `src/model.mjs` contains prediction, error, and optimization calculations; styles are under `src/`.
