export const MIN = 1, MAX = 5, MAX_ERROR = MAX - MIN;
export function rmse(cells) { return Math.sqrt(squaredError(cells) / cells.length); }
export function cellAngle(c) { return (c.prediction-c.truth)/MAX_ERROR * 70 * Math.PI/180; }
export function matrixAngle(cells) { return rmse(cells)/MAX_ERROR * 85 * Math.PI/180; }
export function preset(name) {
 return Array.from({length:25}, (_,i) => {
  const truth = name === 'maximum' ? (i%2 ? 5:1) : 1+(i*7+Math.floor(i/5))%5;
  const gap = name === 'balanced' ? 0 : name === 'small' ? (i%3-1)*.5 : (i%5-2)*1.3;
  return {truth, prediction: name === 'maximum' ? 6-truth : Math.max(1, Math.min(5,truth+gap))};
 });
}
// Poor starting handles produce both large over- and underpredictions.
export const OPTIMIZATION_STEPS = 40;
export const OPTIMIZATION_INTERVAL_MS = 1800;
export function initialFactors(){return {rows:[[1,.95],[.96,1],[.04,.08],[1,1],[.08,.04]],cols:[[1,.96],[.95,1],[1,.98],[.03,.06],[1,1]]};}
export function factorPrediction(row,col){return 1+2*(row[0]*col[0]+row[1]*col[1]);}
export function factorCells(truths,rows,cols){return truths.map((truth,i)=>({truth,prediction:factorPrediction(rows[Math.floor(i/5)],cols[i%5])}));}
export function factorPreset(name){
 let {rows,cols}=initialFactors();
 if(name==='balanced'){rows=rows.map(()=>[1,1]);cols=[[0,0],[.5,0],[1,0],[1,.5],[1,1]];}
 if(name==='maximum'){rows=rows.map(()=>[.05,.05]);cols=cols.map(()=>[.05,.05]);}
 const predictions=factorCells(Array(25).fill(0),rows,cols);
 // Fixed whole-number ratings rounded from a different two-factor model.
 const targetRows=[[.85,.15],[.15,.85],[.75,.65],[.35,.25],[.9,.8]];
 const targetCols=[[.2,.9],[.85,.15],[.6,.7],[.9,.8],[.25,.3]];
 const demoTruths=factorCells(Array(25).fill(0),targetRows,targetCols).map(c=>c.prediction);
 const truths=predictions.map((c,i)=>name==='balanced'?c.prediction:name==='small'?Math.max(1,Math.min(5,c.prediction+(i%3-1)*.3)):name==='maximum'?5:demoTruths[i]);
 return {rows,cols,truths:truths.map(Math.round)};
}
// Exact two-variable least-squares minimizer within the same [0,1] slider bounds.
export function solveBoundedPair(design, targets, current) {
 let a=0,b=0,d=0,e=0,f=0;
 design.forEach((v,i)=>{a+=v[0]*v[0];b+=v[0]*v[1];d+=v[1]*v[1];e+=v[0]*targets[i];f+=v[1]*targets[i];});
 const clamp=v=>Math.max(0,Math.min(1,v));
 const candidates=[current.slice()];
 const det=a*d-b*b;
 if(det>1e-12){const x=(e*d-b*f)/det,y=(a*f-b*e)/det;if(x>=0&&x<=1&&y>=0&&y<=1)candidates.push([x,y]);}
 for(const x of [0,1])candidates.push([x,d>1e-12?clamp((f-b*x)/d):current[1]]);
 for(const y of [0,1])candidates.push([a>1e-12?clamp((e-b*y)/a):current[0],y]);
 const loss=v=>design.reduce((sum,row,i)=>sum+(row[0]*v[0]+row[1]*v[1]-targets[i])**2,0);
 return candidates.reduce((best,v)=>loss(v)<loss(best)-1e-14?v:best,candidates[0]);
}
export function alsStep(truths,rows,cols,phase='rows') {
 if(phase==='rows')return {rows:rows.map((pair,r)=>solveBoundedPair(cols,truths.slice(r*5,r*5+5).map(t=>(t-1)/2),pair)),cols:cols.map(p=>p.slice())};
 return {rows:rows.map(p=>p.slice()),cols:cols.map((pair,c)=>solveBoundedPair(rows,rows.map((_,r)=>(truths[r*5+c]-1)/2),pair))};
}
export function squaredError(cells){return cells.reduce((sum,c)=>sum+(c.prediction-c.truth)**2,0);}
export function errorColor(error){return `hsl(${120*(1-Math.min(1,Math.abs(error)/MAX_ERROR))}, 65%, 65%)`;}

// Bounded coordinate least squares: change exactly one handle per visible step.
/** @returns {{rows:number[][],cols:number[][],handle:{kind:'rows'|'cols',index:number,factor:number}}} */
export function handleStep(truths,rows,cols,step) {
 const slot=step%20,kind=slot<10?'rows':'cols',index=Math.floor((slot%10)/2),factor=slot%2;
 const nextRows=rows.map(p=>p.slice()),nextCols=cols.map(p=>p.slice());
 const pairs=kind==='rows'?nextRows:nextCols,design=kind==='rows'?cols:rows;
 let numerator=0,denominator=0;
 design.forEach((pair,i)=>{
  const truth=truths[kind==='rows'?index*5+i:i*5+index];
  numerator+=pair[factor]*((truth-1)/2-pairs[index][1-factor]*pair[1-factor]);
  denominator+=pair[factor]**2;
 });
 if(denominator>1e-12)pairs[index][factor]=Math.max(0,Math.min(1,numerator/denominator));
 return {rows:nextRows,cols:nextCols,handle:{kind,index,factor}};
}
