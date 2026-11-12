"use client";
import {useEffect,useRef,useState} from 'react';
import World from './World';
import type {SceneAPI} from './World';
import {people,movies} from './art';
import {makeChallenge,fitStep} from './challenge.mjs';
import {factorCells,rmse} from './model.mjs';
import type {Mode} from './ratings';
import {getSession,type Session} from './log';
import css from './game.module.css';

type Kind='rows'|'cols';
type Active={kind:Kind;index:number;factor?:number}|null;
type Lab={rows:number[][];cols:number[][];truths:number[];hidden:number[];rowOrder:number[];colOrder:number[]};
type Cell={truth:number;prediction:number};
type Dialog='intro'|'result'|'log'|null;
const steps=60;
let boot:Promise<{lab:Lab;session:Session}>|undefined;
function begin(){
 return boot??=(async()=>{
  const session=await getSession(),lab:Lab=makeChallenge();
  session.log('run_started',{version:'GITG-1',row_order:lab.rowOrder.map(i=>people[i].id),column_order:lab.colOrder.map(i=>movies[i].id),hidden_cells:lab.hidden,visible_ratings:lab.truths.map((v,i)=>lab.hidden.includes(i)?null:v),starting_factors:{rows:lab.rows,cols:lab.cols},starting_predictions:factorCells(lab.truths,lab.rows,lab.cols).map((c:Cell)=>c.prediction),mode:'stars'});
  return {lab,session};
 })();
}
export default function App(){
 const [ready,setReady]=useState<Awaited<ReturnType<typeof begin>>|null>(null);
 useEffect(()=>{let mounted=true;begin().then(r=>{if(mounted)setReady(r);});return()=>{mounted=false;};},[]);
 return ready?<Game initial={ready.lab} session={ready.session}/>:<div className={css.shell}>Opening the movie abacus…</div>;
}
function Game({initial,session}:{initial:Lab;session:Session}){
 const [lab,setLab]=useState(initial), live=useRef(initial);
 const [mode,setMode]=useState<Mode>('stars'),[selected,select]=useState(initial.hidden[0]);
 const [evaluated,setEvaluated]=useState(false),locked=useRef(false);
 const [modal,setModal]=useState<Dialog>('intro'),dialog=useRef<HTMLDialogElement>(null);
 const [participant,setParticipant]=useState(session.run.participant_id),[active,setActive]=useState<Active>(null);
 const [running,setRunning]=useState(false),[progress,setProgress]=useState(0),step=useRef(0);
 const [logTick,refresh]=useState(0),[exportError,setExportError]=useState('');
 const camera=useRef<SceneAPI|null>(null), pose=useRef<{distance:number;azimuth:number;polar:number}|null>(null);
 const cast=lab.rowOrder.map(i=>people[i]),films=lab.colOrder.map(i=>movies[i]);
 const cells:Cell[]=factorCells(lab.truths,lab.rows,lab.cols);
 const known=cells.filter((_,i)=>!lab.hidden.includes(i)),error=rmse(known);
 const target=cast[Math.floor(lab.hidden[0]/5)], candidates=lab.hidden.map(i=>({movie:films[i%5],...cells[i],i}));
 const [a,b]=candidates, tied=Math.abs(a.prediction-b.prediction)<1e-8;
 const best=a.prediction>=b.prediction?a:b,other=best===a?b:a;
 const correct=a.truth>b.truth?a:b;
 const selectedHidden=lab.hidden.includes(selected)&&!evaluated;
 function trace(event:string,details:Record<string,unknown>={}){session.log(event,details);}
 function dismiss(){trace('dialog_closed',{dialog:modal});setModal(null);}
 useEffect(()=>{if(modal&&!dialog.current?.open)dialog.current?.showModal();if(!modal&&dialog.current?.open)dialog.current.close();},[modal]);
 useEffect(()=>{if(modal!=='log')return;const i=setInterval(()=>refresh(x=>x+1),700);return()=>clearInterval(i);},[modal]);
 useEffect(()=>{const page=()=>session.log('page_hidden',{visibility:document.visibilityState});document.addEventListener('visibilitychange',page);return()=>document.removeEventListener('visibilitychange',page);},[session]);
 function update(next:Lab){live.current=next;setLab(next);}
 function snapshot(l:Lab){const c:Cell[]=factorCells(l.truths,l.rows,l.cols);return {rows:l.rows,cols:l.cols,known_rmse:rmse(c.filter((_,i)=>!l.hidden.includes(i))),predictions:c.map(v=>v.prediction)};}
 function pick(i:number){select(i);trace('tile_selected',{cell:i,person:cast[Math.floor(i/5)].id,movie:films[i%5].id});}
 function stop(reason:string){if(running)trace('optimize_paused',{reason,step:step.current});setRunning(false);setActive(null);}
 function change(kind:Kind,index:number,factor:number,value:number,source:string){
  if(locked.current)return;
  const old=live.current,previous=old[kind][index][factor];if(previous===value)return;
  stop('manual_edit');step.current=0;setProgress(0);
  const next={...old,[kind]:old[kind].map((pair,i)=>i===index?pair.map((v,j)=>j===factor?value:v):pair)};
  update(next);trace('slider_changed',{source,kind,index,id:(kind==='rows'?cast:films)[index].id,factor:factor+1,previous,value,...snapshot(next)});
 }
 useEffect(()=>{
  if(!running)return;
  const timer=setInterval(()=>{
   if(locked.current)return;
   const n=step.current,old=live.current,next=fitStep(old,n) as Lab,kind:Kind=n%10<5?'rows':'cols',index=n%5;
   update(next);setActive({kind,index});step.current++;setProgress(step.current);
   session.log('optimize_step',{step:step.current,kind,index,entity:(kind==='rows'?people[old.rowOrder[index]]:movies[old.colOrder[index]]).id,before:old[kind][index],after:next[kind][index],...snapshot(next)});
   if(step.current>=steps){setRunning(false);setActive(null);session.log('optimize_completed',{steps,...snapshot(next)});}
  },220);return()=>clearInterval(timer);
 },[running,session]);
 function optimize(){if(running){stop('button');return;}if(locked.current)return;if(step.current>=steps)step.current=0;trace('optimize_started',{from_step:step.current});setRunning(true);}
 function evaluate(){
  if(locked.current){setModal('result');return;}
  locked.current=true;stop('evaluation');setEvaluated(true);select(best.i);
  trace('evaluated',{...snapshot(live.current),truths:lab.truths,person:target.id,results:candidates.map(c=>({movie:c.movie.id,predicted:c.prediction,actual:c.truth,error:c.prediction-c.truth})),recommended:tied?null:best.movie.id,tie:tied,actual_preference:correct.movie.id,ranking_correct:!tied&&best.i===correct.i});
  setTimeout(()=>setModal('result'),550);
 }
 function recordPose(p:Record<string,unknown>){
  const prev=pose.current,next=p as {distance:number;azimuth:number;polar:number};
  const zoom=prev?Math.sign(next.distance-prev.distance):0;
  trace('camera_pose',{...p,rotation_changed:!!prev&&(next.azimuth!==prev.azimuth||next.polar!==prev.polar),zoom:zoom<0?'in':zoom>0?'out':null});
  pose.current=next;
 }
 function saveID(){const id=participant.trim();if(id)session.rename(id);setParticipant(session.run.participant_id);}
 async function download(all:boolean){try{setExportError('');trace('log_exported',{all_runs:all});await session.export(all);}catch{setExportError('Export failed. Try exporting just this run.');}}
 return <div className={css.shell}>
  <div className={css.top}><div className={css.brand}><span aria-hidden="true">✦</span> inter.play <b>/</b> Get in the Game</div><div className={css.tools}><label>Participant <input aria-label="Participant ID" maxLength={48} value={participant} onChange={e=>setParticipant(e.target.value)} onBlur={saveID} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur();}}/></label><button onClick={()=>{trace('log_opened');setModal('log');}}>Session log</button></div></div>
  <div className={css.heading}><div><h1>Movie recommendation abacus</h1><p>Balance the known ratings. Which movie should {target.name} watch?</p></div><button onClick={()=>{trace('instructions_opened');setModal('intro');}}>How to play</button></div>
  <div className={css.layout}><section className={css.stage}><div className={css.stagebar}><div className={css.legend}><i/> Rated <i/> Guess <i/> Hidden movie guess</div><label>Tiles <select value={mode} onChange={e=>{const v=e.target.value as Mode;setMode(v);trace('visualization_changed',{mode:v});}}><option value="stars">Stars</option><option value="bars">Bars</option><option value="edges">Edge weights</option></select></label></div>
  <World cells={cells} selected={selected} onSelect={pick} apiRef={camera} mode={mode} active={active} factors={lab} onFactor={(k,i,f,v)=>change(k,i,f,v,'desk')} onActive={v=>{if(!locked.current&&!running)setActive(v);}} hidden={lab.hidden} evaluated={evaluated} people={cast} movies={films} onCamera={recordPose}/>
  <div className={css.camera}>{['perspective','top','front','side'].map(v=><button key={v} onClick={()=>{trace('camera_preset',{view:v});camera.current?.view(v);}}>{v==='perspective'?'3D':v[0].toUpperCase()+v.slice(1)}</button>)}{[.85,1.15].map((f,i)=><button key={f} aria-label={i?'Zoom out':'Zoom in'} onClick={()=>{trace('zoom_button',{direction:i?'out':'in'});camera.current?.zoom(f);}}>{i?'−':'+'}</button>)}</div><p className={css.tip}>Drag a slider to change a guess. Drag the background to rotate. Scroll or pinch to zoom.</p></section>
  <aside className={css.panel}><div className={css.person}><img src={target.image} alt=""/><div><small>Movie night for</small><h2>{target.name}</h2></div></div>
  <div className={css.choices}>{candidates.map(c=><button key={c.i} onClick={()=>pick(c.i)} aria-pressed={selected===c.i}><img src={c.movie.image} alt=""/><strong>{c.movie.name}</strong><span>Guess {c.prediction.toFixed(2)} ★</span>{evaluated&&<b>Rated {c.truth} ★</b>}</button>)}</div>
  <div className={css.score}><small>Error on 23 known ratings</small><strong>{error.toFixed(2)} <em>/ 4</em></strong><progress value={error} max={4}/></div>
  <button className={css.primary} onClick={evaluate}>{evaluated?'See recommendation':'Evaluate my recommendation'}</button>
  <div className={css.actions}><button onClick={optimize} disabled={evaluated}>{running?'Pause Optimize':'Optimize'}</button><button disabled={evaluated} onClick={()=>{stop('reset');step.current=0;setProgress(0);update(initial);trace('reset',snapshot(initial));}}>Reset sliders</button></div>
  {progress>0&&<small>Optimize · {progress} of {steps} adjustments</small>}
  {evaluated&&<p>The sliders are locked. Reload for the next participant.</p>}</aside></div>
  <details className={css.detail} onToggle={e=>trace('factor_controls_toggled',{open:e.currentTarget.open})}><summary>Adjust factors with keyboard or touch</summary>{(['rows','cols'] as Kind[]).map(kind=><div className={css.handles} key={kind}>{(kind==='rows'?cast:films).map((entity,i)=><div key={entity.id}><strong>{entity.name}</strong>{lab[kind][i].map((v,f)=><label key={f}>F{f+1} <input aria-label={entity.name+' factor '+(f+1)} disabled={evaluated} type="range" min="0" max="1" step=".01" value={v} onChange={e=>change(kind,i,f,Number(e.target.value),'accessible')}/><output>{v.toFixed(2)}</output></label>)}</div>)}</div>)}</details>
  <div className={css.inspect}><h2>Inspect a tile</h2><p><strong>{cast[Math.floor(selected/5)].name} × {films[selected%5].name}</strong> · Guess {cells[selected].prediction.toFixed(2)} ★ · {selectedHidden?'Rating hidden':('Rated '+cells[selected].truth+' ★')}</p><div className={css.grid}>{cells.map((c,i)=><button key={i} aria-pressed={i===selected} aria-label={cast[Math.floor(i/5)].name+', '+films[i%5].name} onClick={()=>pick(i)}>{lab.hidden.includes(i)&&!evaluated?'?':(c.prediction-c.truth).toFixed(1)}</button>)}</div></div>
  <dialog ref={dialog} className={css.dialog} onCancel={e=>{e.preventDefault();dismiss();}}>
   {modal==='intro'&&<><div className={css.person}><img src={target.image} alt=""/><small>Movie night for {target.name}</small></div><h2>Pick a movie for {target.name}.</h2><p>{target.name} has two movies left to see. Can your movie recommendation abacus guess which one they’ll like more?</p><div className={css.choices}>{candidates.map(c=><div key={c.i}><img src={c.movie.image} alt=""/><strong>{c.movie.name}</strong></div>)}</div><p>Move the sliders beside people and movies. Try to match the gold guesses to the blue ratings so the tiles balance. The two purple guesses are yours to test.</p><p>When you’re ready, choose <b>Evaluate</b> to see how {target.name} rated both movies.</p><button className={css.primary} onClick={dismiss}>Start balancing</button></>}
   {modal==='result'&&<><small>Recommendation results</small><h2>{tied?'Your guesses were tied.':('You recommended '+best.movie.name+'.')}</h2><p>{tied?('You gave both movies the same predicted rating for '+target.name+'.'):(`You picked ${best.movie.name} over ${other.movie.name} for ${target.name}.`)} After watching both, {target.name} preferred <strong>{correct.movie.name}</strong>.</p><div className={css.choices}>{candidates.map(c=><div key={c.i}><img src={c.movie.image} alt=""/><strong>{c.movie.name}</strong><span>Your guess {c.prediction.toFixed(2)} ★</span><b>Actual rating {c.truth} ★</b></div>)}</div><button className={css.primary} onClick={dismiss}>See the revealed tiles</button></>}
   {modal==='log'&&<><small>Participant {session.run.participant_id}</small><h2>Session log</h2><p>{session.persistent?'Saved in this browser on this device.':'Browser storage unavailable. Export this run before reloading.'} CSV files open in Google Sheets or Excel.</p><p>{session.events.length} events · latest first</p><div className={css.events} data-tick={logTick}>{session.events.slice(-80).reverse().map(e=><details key={e.seq}><summary>{e.seq} · {e.event.replaceAll('_',' ')} · {(e.elapsed_ms/1000).toFixed(1)} s</summary><pre>{JSON.stringify(e.details,null,2)}</pre></details>)}</div><div className={css.actions}><button onClick={()=>download(false)}>Export this run</button><button onClick={()=>download(true)}>Export all runs</button><button onClick={dismiss}>Close</button></div>{exportError&&<p role="alert">{exportError}</p>}</>}
  </dialog>
 </div>;
}
