# Movie Recommendation Abacus — Get in the Game
A standalone version of the [GITG exhibit](https://embodied-matrix-factorization.farhadierf.chatgpt.site/GITG), based on Balance New. Run with Node 22.13 or newer and npm.

    npm ci
    npm run dev

Run `npm test`, `npm run typecheck`, and `npm run build` for verification. The build outputs a static site in dist/.

Each reload starts a participant run and shuffles the display order. Adjusting a participant ID relabels the entire run in CSV exports while preserving the original ID on each event. Session log → Export all runs downloads records from this browser and origin. Export before clearing site data. Spreadsheet columns include run UUID, sequence, timestamps, event name, and JSON details. Camera poses include orbit angles in radians and distance in scene units. Manual and automated factor changes include predictions and error over the 23 observed cells.

The two held-out ratings are fixed before play and excluded from the solver and the live error. Evaluate locks the factors and records the recommendation, predictions, actual ratings, and ranking outcome. A tie is reported explicitly.
