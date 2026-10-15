import assert from 'node:assert/strict';
import {BalanceModel, predict} from '../Assets/BalanceModel.ts';
assert.ok(Math.abs(predict([.04,.08],[1,.98])-1.2368)<1e-12);
const mixed=new BalanceModel();
assert.ok(Math.abs(mixed.rmse()-2.4251525)<.001);
for(const example of ['mixed','small','maximum','balanced']) {
 const m=new BalanceModel(example), truths=[...m.truths];
 let previous=m.rmse();
 for(let i=0;i<100;i++) {
  m.optimizeStep();
  assert.ok(m.rmse()<=previous+1e-10,`${example}: optimizer increased error`);
  previous=m.rmse();
 }
 assert.deepEqual(m.truths,truths);
 if(example==='balanced')assert.ok(m.rmse()<1e-12);
 m.setFactor('rows',0,0,-1);assert.equal(m.rows[0][0],0);
 m.setFactor('cols',0,0,2);assert.equal(m.cols[0][0],1);
 m.reset(example);assert.equal(m.stepIndex,0);
}
const balanced=new BalanceModel('balanced');assert.equal(balanced.frameDegrees(),0);
const maximum=new BalanceModel('maximum');assert.ok(Math.abs(maximum.rmse()-3.99)<1e-10);
console.log('PASS: website formula, initial RMSE, all four examples, 400 monotonic optimization steps, fixed truths, bounded factors, reset, and tilt limits.');
