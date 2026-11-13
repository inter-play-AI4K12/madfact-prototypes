import {makeChallenge,fitStep} from '../src/challenge.mjs';
import {factorCells,rmse} from '../src/model.mjs';
export function initialState(){return {ratingScale:'0-4',lab:makeChallenge(),mode:'stars',selected:0,evaluated:false,running:false,step:0,attempt:1,participant:'1',active:null};}
export function normalizeState(state){return state.ratingScale==='0-4'?state:{...state,ratingScale:'0-4',lab:{...state.lab,truths:state.lab.truths.map(v=>v-1)}};}
export function metrics(state){state=normalizeState(state);const cells=factorCells(state.lab.truths,state.lab.rows,state.lab.cols),[a,b]=state.lab.hidden.map(i=>({...cells[i],index:i}));return {rating_scale:'0-4',known_rmse:rmse(cells.filter((_,i)=>!state.lab.hidden.includes(i))),predictions:cells.map(c=>c.prediction),recommended:Math.abs(a.prediction-b.prediction)<1e-8?null:a.prediction>b.prediction?a.index:b.index};}
export function publicState(state){state=normalizeState(state);return {...state,lab:{...state.lab,truths:state.lab.truths.map((v,i)=>!state.evaluated&&state.lab.hidden.includes(i)?0:v)},metrics:metrics(state)};}
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
export function applyCommand(state,command){
 const s=structuredClone(normalizeState(state)),c=command;
 if(!c||typeof c.type!=='string')fail('Choose an action.');
 switch(c.type){
  case 'slider':{
   if(s.evaluated)fail('This attempt is locked. Restart to adjust the sliders.',409);
   if(!['rows','cols'].includes(c.kind)||!Number.isInteger(c.index)||c.index<0||c.index>4||![0,1].includes(c.factor)||!Number.isFinite(c.value)||c.value<0||c.value>1)fail('Invalid slider value.');
   s.lab[c.kind][c.index][c.factor]=Math.round(c.value*100)/100;s.running=false;s.step=0;s.active={kind:c.kind,index:c.index,factor:c.factor};break;
  }
  case 'release':s.active=null;break;
  case 'select':if(!Number.isInteger(c.index)||c.index<0||c.index>24)fail('Invalid tile.');s.selected=c.index;break;
  case 'mode':if(!['stars','bars','edges'].includes(c.mode))fail('Invalid tile style.');s.mode=c.mode;break;
  case 'participant':if(typeof c.value!=='string'||c.value.length>48)fail('Use a participant ID of up to 48 characters.');s.participant=c.value.trim()||'1';break;
  case 'optimize':if(s.evaluated)fail('Restart before optimizing.',409);s.running=!s.running;if(s.step>=60)s.step=0;break;
  case 'tick':if(s.running&&!s.evaluated){const n=s.step;s.lab=fitStep(s.lab,n);s.active={kind:n%10<5?'rows':'cols',index:n%5};s.step++;if(s.step>=60){s.running=false;s.active=null;}}break;
  case 'reset':if(s.evaluated)fail('Restart before resetting.',409);s.lab={...s.lab,...{rows:s.lab.rowOrder.map(i=>makeCanonical().rows[i].slice()),cols:s.lab.colOrder.map(i=>makeCanonical().cols[i].slice())}};s.running=false;s.step=0;s.active=null;break;
  case 'evaluate':s.evaluated=true;s.running=false;s.active=null;break;
  case 'restart':{const next=initialState();next.participant=s.participant;next.attempt=s.attempt+1;next.selected=next.lab.hidden[0];return next;}
  default:fail('Unknown action.');
 }
 return s;
}
function makeCanonical(){return makeChallenge(()=>.999999);}

export function normalizeLogDetails(details){
 if(details.rating_scale==='0-4')return details;
 return {...details,rating_scale:'0-4',...(details.predictions?{predictions:details.predictions.map(v=>v-1)}:{}),...(details.revealed?{revealed:details.revealed.map(v=>({...v,rating:v.rating-1}))}:{})};
}
