import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3, Group } from 'three';
import { rmse, cellAngle, matrixAngle, preset, factorPreset, factorCells, alsStep, handleStep, OPTIMIZATION_STEPS, squaredError, solveBoundedPair, errorColor } from '../src/model.mjs';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
test('RMSE bounds, squared errors, and exact horizontal / vertical endpoints',()=>{
 const balanced=preset('balanced'),maximum=preset('maximum');
 assert.equal(balanced.length,25);close(rmse(balanced),0);close(matrixAngle(balanced),0);
 close(rmse(maximum),4);close(matrixAngle(maximum),85*Math.PI/180);
 close(rmse([...Array(24)].map(()=>({truth:3,prediction:3})).concat({truth:1,prediction:5})),4/5);
 close(rmse([{truth:2,prediction:4},{truth:4,prediction:2}]),2);
 close(rmse([{truth:1,prediction:1},{truth:1,prediction:5}]),Math.sqrt(8));
});
test('east–west hinges lift the specified edge; parent transforms compose',()=>{
 for(const prediction of [1,3,5]){
  const parent=new Group(),tile=new Group();parent.add(tile);tile.rotation.x=cellAngle({truth:3,prediction});
  parent.updateMatrixWorld(true);
  const north=tile.localToWorld(new Vector3(0,0,-.5)),south=tile.localToWorld(new Vector3(0,0,.5));
  assert.equal(Math.sign(north.y-south.y),Math.sign(prediction-3));
  parent.rotation.x=matrixAngle(preset('maximum'));parent.updateMatrixWorld(true);
  const p=tile.localToWorld(new Vector3(0,0,-.5));close(p.y,.5*Math.sin(parent.rotation.x+tile.rotation.x));
 }
});
test('factor sliders change only the linked row or column and keep ratings bounded',()=>{
 const lab=factorPreset('mixed'),before=factorCells(lab.truths,lab.rows,lab.cols);
 const rows=lab.rows.map((p,i)=>i===2?[.99,p[1]]:p);
 const after=factorCells(lab.truths,rows,lab.cols);
 after.forEach((c,i)=>{assert.equal(c.truth,before[i].truth);if(Math.floor(i/5)!==2)close(c.prediction,before[i].prediction);else assert.notEqual(c.prediction,before[i].prediction);assert.ok(c.prediction>=1&&c.prediction<=5);});
 const cols=lab.cols.map((p,i)=>i===1?[p[0],.99]:p);
 factorCells(lab.truths,lab.rows,cols).forEach((c,i)=>{if(i%5!==1)close(c.prediction,before[i].prediction);else assert.notEqual(c.prediction,before[i].prediction);});
});
test('ALS alternates exact bounded least-squares fits and never increases squared error',()=>{
 for(const name of ['mixed','small','maximum','balanced']){
  let lab=factorPreset(name);assert.ok(lab.truths.every(t=>Number.isInteger(t)&&t>=1&&t<=5));const truths=lab.truths.slice();const start=squaredError(factorCells(lab.truths,lab.rows,lab.cols));let previous=start, previousTilt=matrixAngle(factorCells(lab.truths,lab.rows,lab.cols));
  for(let i=0;i<16;i++){
   const phase=i%2===0?'rows':'cols',fixed=phase==='rows'?'cols':'rows',before=lab[fixed].map(p=>p.slice());
   lab={...lab,...alsStep(lab.truths,lab.rows,lab.cols,phase)};
   assert.deepEqual(lab[fixed],before);assert.deepEqual(lab.truths,truths);
   const cells=factorCells(lab.truths,lab.rows,lab.cols),next=squaredError(cells);assert.ok(next<=previous+1e-8);previous=next;
   const tilt=matrixAngle(cells);assert.ok(tilt<=previousTilt+1e-8);previousTilt=tilt;
   cells.forEach(c=>assert.ok(c.prediction>=1&&c.prediction<=5));
  }
  if(name==='balanced')close(previous,0);else assert.ok(previous<start);
 }
});
test('least-squares solver handles interior, boundary and singular solutions',()=>{
 const interior=solveBoundedPair([[1,0],[0,1],[1,1]],[.3,.7,1],[.8,.2]);close(interior[0],.3);close(interior[1],.7);
 const boundary=solveBoundedPair([[1,0],[0,1]],[2,-1],[.5,.5]);assert.deepEqual(boundary,[1,0]);
 const singular=solveBoundedPair([[1,1],[2,2]],[1,2],[.1,.1]);close(singular[0]+singular[1],1);
 for(const design of [[[.2,.8],[.7,.1],[.8,.4]],[[0,0],[0,0]]]){
  const target=[1.1,.2,.9].slice(0,design.length),solution=solveBoundedPair(design,target,[.5,.5]);
  const loss=p=>design.reduce((sum,row,i)=>sum+(row[0]*p[0]+row[1]*p[1]-target[i])**2,0);
  for(let x=0;x<=20;x++)for(let y=0;y<=20;y++)assert.ok(loss(solution)<=loss([x/20,y/20])+1e-9);
 }
});
test('error colors use magnitude, from green at zero to red at the maximum',()=>{
 assert.equal(errorColor(0),'hsl(120, 65%, 65%)');assert.equal(errorColor(4),'hsl(0, 65%, 65%)');assert.equal(errorColor(-2),errorColor(2));assert.equal(errorColor(9),errorColor(4));
});

test('poor initial predictions include both directions; optimization changes one handle at a time',()=>{
 let lab=factorPreset('mixed');const truths=lab.truths.slice(),initial=factorCells(truths,lab.rows,lab.cols);
 assert.ok(rmse(initial)>2.3);assert.equal(initial.filter(c=>c.prediction>c.truth).length,12);assert.equal(initial.filter(c=>c.prediction<c.truth).length,13);
 let previous=rmse(initial);
 for(let i=0;i<OPTIMIZATION_STEPS;i++){
  const next=handleStep(truths,lab.rows,lab.cols,i);let changed=0;
  for(const kind of ['rows','cols'])for(let j=0;j<5;j++)for(let f=0;f<2;f++)if(next[kind][j][f]!==lab[kind][j][f]){changed++;assert.equal(kind,next.handle.kind);assert.equal(j,next.handle.index);assert.equal(f,next.handle.factor);}
  assert.ok(changed<=1);lab={...lab,rows:next.rows,cols:next.cols};
  const error=rmse(factorCells(truths,lab.rows,lab.cols));assert.ok(error<=previous+1e-9);previous=error;
 }
 assert.deepEqual(lab.truths,truths);assert.ok(previous<.5);
});

