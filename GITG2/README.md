# GITG2 — monitor abacus + tablet sliders

Public demo: https://gitg2.tender-toad-0281.chatgpt.site

This is an independent copy of GITG. The original GITG directory and its GitHub Pages deployment are unchanged.

## Use

1. Open the demo on the monitor. Enter a session name, for example **FRIDAY-DEMO**, and choose **Set up a monitor**. Leaving the name blank generates a short random one.
2. On the tablet, open the same demo, enter the same session name, and choose **Connect**. Alternatively scan the monitor's QR code.
3. Close the pairing card on the monitor and choose Fullscreen if desired.

The tablet is a fixed top-down desk surface: only 20 pink/charcoal sliders, customer names/portraits, and movie names/posters. There is no movable camera, abacus, task panel, or other control UI on the tablet. Movie sliders increase upward. Its layout adapts to landscape and portrait screens.

The monitor shows the abacus with no sliders. Its **Session** menu contains evaluation, restart, optimization, reset sliders, participant ID, tile style, immediate sync, and CSV export. Camera controls remain local to the monitor.

No accounts, passwords, pairing tokens, or Google Drive connection are needed. Anyone using a session name can view, control, and export that demo session. Use different names for independent monitor/tablet pairs. Both devices need internet; they do not need to share a browser or local network.

Direct links for an existing named session:

- Monitor: `/?screen=display&room=FRIDAY-DEMO`
- Tablet: `/?screen=controller&room=FRIDAY-DEMO`

## Sync and logs

The Sites Worker is authoritative. D1 stores room state, revision, and the action history across restarts and reloads. The monitor polls every 250 ms and the tablet every 600 ms, plus network/server latency. Actions are serialized, deduplicated, and checked against the current revision. Pending actions are retained in each screen's browser and replayed after reconnection. Clearing browser data before those changes sync discards the unsent queue; server records remain.

CSV exports include server timestamp, command ID, revision, participant ID, attempt, input command, row/column order, all factor values, predictions, and known-rating RMSE. Hidden ratings are revealed only after evaluation. Camera navigation is not in this edition's shared log.

Restart begins a new attempt with fresh row/column ordering while preserving participant ID and log history. Maya's two hidden ratings remain After Hours = 3 and Peach Season = 1; both are excluded from the solver and known-rating error. All ratings, predictions, stars, bars, edge weights, results, and exported numbers use the same 0–4 scale. Existing saved sessions and historical log exports are normalized from the older 1–5 scale.

## Development

Use Node 23+ (or a Node version providing `node:sqlite`) and npm:

```
npm ci
npm run dev
```

Preview: `http://127.0.0.1:5174/`. Local SQLite storage is under `.data/`, separate from production.

```
npm test
npm run typecheck
npm run build
```

The frontend is bundled into a Worker ES module at `dist/server/index.js`. `.openai/hosting.json` binds hosted D1 as `DB`. Generated migrations are in `drizzle/`; use `npm run db:generate` after schema changes. Sites applies hosted migrations at deployment; the local server applies pending migrations on startup. Legacy key columns in the first deployed database schema remain unused; there is no token authentication in this demo.

## Publishing

GITG2 has its own Sites source repository and deployment. This folder contains all application and backend source. Publish with the Sites source workflow using this folder's manifest/project ID. A GitHub push alone does not deploy GITG2 or change GITG.
