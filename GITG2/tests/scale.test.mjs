import test from 'node:test';import assert from 'node:assert/strict';
import {MIN,MAX,factorPrediction,factorCells} from '../src/model.mjs';import {makeChallenge} from '../src/challenge.mjs';
test('all ratings and predictions use a true zero-to-four scale',()=>{
 assert.equal(MIN,0);assert.equal(MAX,4);assert.equal(factorPrediction([0,0],[1,1]),0);assert.equal(factorPrediction([1,1],[1,1]),4);
 const l=makeChallenge(()=>.999999);const c=factorCells(l.truths,l.rows,l.cols);
 assert.deepEqual(l.hidden.map(i=>c[i].truth),[3,1]);assert.ok(Math.abs(c[l.hidden[0]].prediction-1.09)<1e-12);assert.ok(Math.abs(c[l.hidden[1]].prediction-3.325)<1e-12);
 assert.ok(c.every(v=>v.truth>=0&&v.truth<=4&&v.prediction>=0&&v.prediction<=4));
});
