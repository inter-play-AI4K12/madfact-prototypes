import test from 'node:test';
import assert from 'node:assert/strict';
import { makeChallenge, fitStep } from '../src/challenge.mjs';
import { factorCells, rmse } from '../src/model.mjs';

function seeded(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
}

function score(lab) {
  const cells = factorCells(lab.truths, lab.rows, lab.cols);
  return {
    seen: rmse(cells.filter((_, i) => !lab.hidden.includes(i))),
    candidates: lab.hidden.map(i => cells[i].prediction),
  };
}

test('the wrong initial recommendation reverses after fitting seen ratings across shuffled layouts', () => {
  const layouts = new Set();
  for (let seed = 1; seed <= 60; seed++) {
    let lab = makeChallenge(seeded(seed * 5737));
    layouts.add(JSON.stringify([lab.rowOrder, lab.colOrder]));
    assert.deepEqual(lab.hidden.map(i => lab.rowOrder[Math.floor(i / 5)]), [0, 0]);
    assert.deepEqual(lab.hidden.map(i => lab.colOrder[i % 5]), [0, 1]);
    assert.deepEqual(lab.hidden.map(i => lab.truths[i]), [3, 1]);
    assert.ok(lab.truths.every(t => Number.isInteger(t) && t >= 0 && t <= 4));
    const initial = score(lab);
    assert.ok(initial.candidates[1] - initial.candidates[0] > 2);
    let previous = initial.seen;
    for (let step = 0; step < 40; step++) {
      lab = fitStep(lab, step);
      const next = score(lab).seen;
      assert.ok(next <= previous + 1e-9);
      previous = next;
    }
    const final = score(lab);
    assert.ok(initial.seen > 1.5 && final.seen < 0.18);
    assert.ok(Math.abs(final.candidates[0] - 3) < 0.15);
    assert.ok(Math.abs(final.candidates[1] - 1) < 0.02);
  }
  assert.ok(layouts.size > 50);
});

test('changing held-out ratings has no effect on any optimization step', () => {
  let original = makeChallenge(seeded(38));
  let counterfactual = {
    ...original,
    truths: original.truths.map((truth, i) => original.hidden.includes(i) ? NaN : truth),
  };
  for (let step = 0; step < 40; step++) {
    original = fitStep(original, step);
    counterfactual = fitStep(counterfactual, step);
    assert.deepEqual(original.rows, counterfactual.rows);
    assert.deepEqual(original.cols, counterfactual.cols);
  }
});
