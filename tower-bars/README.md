# MadFact — Tower Bars

A 3×3 matrix with fixed blue target towers and yellow prediction towers. Two person and movie factors change linked ratings; free-play and row/column modes preserve the original activity.

Extracted from https://embodied-matrix-factorization.farhadierf.chatgpt.site/tangible on 2026-10-15. Runs independently of the other prototypes; no sign-in, server, database, or Sites account is required.

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
