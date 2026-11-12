# MadFact Prototypes

Experimental representations and interactions for MadFact.

## Web prototypes

Four standalone React + TypeScript + Vite applications extracted from the embodied matrix factorization site:

| Project | Original route | Representation |
| --- | --- | --- |
| [tower-bars](tower-bars/) | `/tangible` | Target and prediction towers |
| [balance](balance/) | `/balance` | Hinged cells with bars or solid edge weights |
| [balance-new](balance-new/) | `/balance-new` | Balance with stationary 3D sliders on the left and bottom of the desk |
| [color-filters](color-filters/) | `/` | Blue/yellow color filters |

Each project has its own dependencies, lockfile, and README. Requires Node.js 22.13+.
From a project directory, run `npm ci`, then `npm run dev`. Use `npm run typecheck`
and `npm run build` to verify it; Balance also includes `npm test`.
Deploy a generated `dist/` directory to a static host. No shared backend or Sites account is required.

The web Balance prototype includes whole-number ground truth and doubled cell tilt.
The Spectacles implementation below is a separate prototype with its own representation controls.

## Spectacles: Balance and Tangible

Open `spectacles/BalanceXR/BalanceXR.esproj` in **Lens Studio 5.15.4**.
The prototype targets **Spectacles 2024** and includes Spectacles Interaction Kit 0.16.4.
Connect the glasses in Lens Studio and preview the Lens.

Look toward clear floor space, choose the preview location, and pinch to pin the exhibit.
It stays suspended above that point so you can walk around it. Reposition restarts placement.
Surface detection checks horizontal geometry; it does not semantically classify floors.
Placement is local to the running session.

- **Balance:** overall platform tilt shows RMSE; individual tiles tilt with signed error.
- **Tangible:** the matrix stays flat and truth/prediction bars become vertical towers.
- **Show Tangible / Show Balance:** switches representation while preserving the same values.
- All 20 factors are directly adjustable alongside rows and below columns. Pinch and drag a gray handle; it turns orange while held.
- The green-to-red indicator below the table shows total absolute error across 25 cells, from 0 to 100.
- Optimize updates factors; Reset and example controls restore or change the example.
- Blue bars show fixed truth; yellow bars show prediction.

Prediction is `1 + 2 * (rowF1 * colF1 + rowF2 * colF2)`, with factors bounded to `[0, 1]`.
Optimization uses coordinate least squares. The cumulative error indicator is read-only.

## Checks

Using Node.js 22 or newer:

```sh
node --experimental-strip-types spectacles/BalanceXR/tests/model.test.mjs
node --experimental-strip-types spectacles/BalanceXR/tests/placement.test.mjs
```

Lens Studio imports assets, compiles TypeScript, and regenerates the excluded cache on opening.
The current source has compiled in Lens Studio. Visual behavior still needs validation on the glasses.

## Dependencies

The project includes Snap's Spectacles Interaction Kit package and a font asset bundled with Lens Studio.
Third-party assets remain subject to their respective terms. This repository does not grant additional rights to those assets.

