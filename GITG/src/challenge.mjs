import { solveBoundedPair } from './model.mjs';

// Canonical indices follow the people and movies in the cast. Maya (row 0)
// has yet to see movies 0 and 1. Row 4 supplies a peer whose three visible
// ratings match hers, while row 1 prefers the opposite candidate.
const ratings = [
  [4, 2, 3, 3, 4],
  [2, 3, 1, 2, 3],
  [5, 3, 3, 4, 5],
  [4, 3, 2, 3, 4],
  [4, 2, 3, 3, 4],
].map(row => row.map(rating => rating - 1)); // Canonical ratings are 0–4.

const startingRows = [
  [0.95, 0.75], [0.20, 0.50], [0.75, 0.95], [0.65, 0.05], [0.95, 0.55],
];
const startingCols = [
  [0.10, 0.60], [1.00, 0.95], [0.80, 0.05], [0.45, 0.10], [0.05, 0.80],
];

function shuffledIndices(random) {
  const order = [0, 1, 2, 3, 4];
  for (let last = order.length - 1; last > 0; last--) {
    const swap = Math.floor(random() * (last + 1));
    [order[last], order[swap]] = [order[swap], order[last]];
  }
  return order;
}

export function makeChallenge(random = Math.random) {
  const rowOrder = shuffledIndices(random);
  const colOrder = shuffledIndices(random);
  const rowOffset = rowOrder.indexOf(0) * colOrder.length;
  return {
    rowOrder,
    colOrder,
    rows: rowOrder.map(i => startingRows[i].slice()),
    cols: colOrder.map(i => startingCols[i].slice()),
    truths: rowOrder.flatMap(r => colOrder.map(c => ratings[r][c])),
    hidden: [0, 1].map(movie => rowOffset + colOrder.indexOf(movie)),
  };
}

// A sweep fits all five people and then all five movies. Each update solves
// two slider values against observed ratings while holding the other axis fixed.
export function fitStep(lab, step) {
  const count = lab.colOrder.length;
  const slot = step % (count * 2);
  const isRow = slot < count;
  const index = slot % count;
  const axis = isRow ? 'rows' : 'cols';
  const opposite = isRow ? lab.cols : lab.rows;
  const design = [];
  const targets = [];
  opposite.forEach((pair, i) => {
    const cell = isRow ? index * count + i : i * count + index;
    if (lab.hidden.includes(cell)) return;
    design.push(pair);
    targets.push(lab.truths[cell] / 2);
  });
  const fitted = solveBoundedPair(design, targets, lab[axis][index]);
  const pairs = lab[axis].slice();
  pairs[index] = fitted;
  return { ...lab, [axis]: pairs };
}
