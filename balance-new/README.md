# MadFact — Balance New

Standalone copy of the Sites `/balance-new` prototype. Row factor sliders sit on the left of the desk; column sliders sit along the bottom. The sliders stay attached to the stationary desk while the matrix tilts.

Includes the original balance model, fixed integer truth values, predictions, optimization, error colors, camera controls, and bar/solid-edge views.

Synced from https://embodied-matrix-factorization.farhadierf.chatgpt.site/balance-new on 2026-11-12, source commit `f286099`.

## Run

Requires Node.js 22.13+ and npm.

```sh
npm ci
npm run dev
```

## Verify and build

```sh
npm run typecheck
npm test
npm run build
npm run preview
```

Deploy `dist/` to a static host. No sign-in, server, database, or Sites account is required. Source adaptations only remove the Next.js client directive and localize imports; the simulation and styles are copied from Sites.
