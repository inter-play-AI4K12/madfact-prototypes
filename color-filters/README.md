# MadFact — Color Filters

A tablet-oriented 3×3 matrix activity using blue ground truth and yellow prediction color filters. Includes adjustable color spectra, factor controls, and comparison overlays.

Extracted from https://embodied-matrix-factorization.farhadierf.chatgpt.site/ on 2026-10-15. Runs independently of the other prototypes; no sign-in, server, database, or Sites account is required.

## Run

Requires Node.js 22.13+ and npm.

```sh
npm ci
npm run dev
```

## Check and build

```sh
npm run typecheck
npm run build
npm run preview
```

Deploy the generated `dist/` directory to any static host. Relative asset paths support hosting in a subdirectory. `src/App.tsx` contains the interface; styles are under `src/`.
