import { useState } from "react";
import s from "./tangible.module.css";

const people=["Wendell","Priya","Hank"];
const movies=["Star Drifter","Astro Blasters","Boom Town"];
const targets=[[5,4,2],[5,4,2],[4,5,3]];
const initialRows=[[.5,.5],[.5,.5],[.5,.5]];
const initialCols=[[1,.02],[.02,1],[.7,.7]];
type Mode="all"|"rows"|"cols";
export default function Tangible(){
 const [rows,setRows]=useState(initialRows),[cols,setCols]=useState(initialCols);
 const [mode,setMode]=useState<Mode>("all"),[selected,setSelected]=useState([0,0]);
 const [showParts,setShowParts]=useState(false);
 const predictions=rows.map(row=>cols.map(col=>1+4*(row[0]*col[0]+row[1]*col[1])));
 const error=targets.flat().reduce((sum,t,i)=>sum+Math.abs(t-predictions[Math.floor(i/3)][i%3]),0)/9;
 const [ri,ci]=selected; const parts=[4*rows[ri][0]*cols[ci][0],4*rows[ri][1]*cols[ci][1]];
 function change(kind:"rows"|"cols",index:number,f:number,v:number){const setter=kind==="rows"?setRows:setCols;setter(current=>current.map((pair,i)=>i===index?pair.map((old,j)=>j===f?v:old):pair));}
 function controls(kind:"rows"|"cols",index:number,label:string){const values=kind==="rows"?rows:cols;return <div className={s.controls}><strong>{label}</strong><div className={s.pair}>{values[index].map((value,f)=><label key={f}><span>F{f+1} <output>{value.toFixed(2)}</output></span><input type="range" min="0" max="1" step="0.01" value={value} disabled={mode!=="all"&&mode!==kind} aria-label={`${label}, factor ${f+1}`} onChange={e=>change(kind,index,f,Number(e.target.value))}/></label>)}</div></div>;}
 return <div className={s.root}>
 <div className={s.top}><div><p className={s.kicker}>MADFACT / TOWER BARS</p><h1 className={s.title}>Make the heights match.</h1><p className={s.intro}>Move a row or movie slider. Every prediction in that row or column changes together.</p></div><button className={s.reset} onClick={()=>{setRows(initialRows.map(p=>[...p]));setCols(initialCols.map(p=>[...p]));}}>Reset factors</button></div>
 <div className={s.toolbar}><div className={s.legend}><span><i style={{background:"#1479ed"}}/>Target</span><span><i style={{background:"#ffc52e"}}/>Prediction</span></div><div className={s.locks} aria-label="Choose which factors can move">{([["all","Free play"],["rows","Adjust people"],["cols","Adjust movies"]] as [Mode,string][]).map(([key,label])=><button key={key} aria-pressed={mode===key} onClick={()=>setMode(key)}>{label}</button>)}</div></div>
 <div className={s.boardWrap}><div className={s.board}>
 <div className={s.corner}>2 factors<br/><span>9 linked predictions</span></div>
 {movies.map((m,i)=><div key={m}>{controls("cols",i,m)}</div>)}
 {people.map((p,r)=><div key={p} className={s.boardRow}>{controls("rows",r,p)}{movies.map((m,c)=>{const prediction=predictions[r][c],target=targets[r][c];return <button key={m} className={`${s.cell} ${ri===r&&ci===c?s.selected:""}`} aria-pressed={ri===r&&ci===c} aria-label={`${p}, ${m}: target ${target}, prediction ${prediction.toFixed(2)}. Show calculation.`} onClick={()=>setSelected([r,c])}>
 <svg viewBox="0 0 180 150" aria-hidden="true"><path d="M26 125H155 M26 25V125" fill="none" stroke="#c7d3df"/>{[1,3,5,7,9].map(n=><g key={n}><path d={`M26 ${125-n*11}H155`} stroke="#e3eaf1"/><text x="16" y={129-n*11} fontSize="11" fill="#74869b">{n}</text></g>)}<rect x="47" y={125-target*11} width="35" height={target*11} rx="3" fill="#1479ed"/>{showParts?<><rect x="98" y={114} width="35" height="11" fill="#ffe395"/><rect x="98" y={114-4*rows[r][0]*cols[c][0]*11} width="35" height={4*rows[r][0]*cols[c][0]*11} fill="#ffc52e"/><rect x="98" y={125-prediction*11} width="35" height={4*rows[r][1]*cols[c][1]*11} fill="#d79b00"/></>:<rect x="98" y={125-prediction*11} width="35" height={prediction*11} rx="3" fill="#ffc52e"/>}<text x="64" y="144" textAnchor="middle" fontSize="13" fill="#1261bb">{target}</text><text x="116" y="144" textAnchor="middle" fontSize="13" fill="#896200">{prediction.toFixed(2)}</text></svg><span className={s.gap}>Gap {Math.abs(prediction-target).toFixed(2)}</span></button>;})}</div>)}
 </div></div>
 <div className={s.bottom}><div className={s.meter}><div><span>Average gap</span><strong aria-live="polite">{error.toFixed(2)} <small>rating points</small></strong></div><div className={s.track}><span style={{left:`${Math.min(100,error/4*100)}%`}}/></div><div className={s.scale}><span>Matched · 0</span><span>Far apart · 4+</span></div></div><div className={s.detail}><div className={s.detailTop}><strong>{people[ri]} × {movies[ci]}</strong><label><input type="checkbox" checked={showParts} onChange={e=>setShowParts(e.target.checked)}/> Show factor parts</label></div><p className={s.equation}>1 + <span>4 × {rows[ri][0].toFixed(2)} × {cols[ci][0].toFixed(2)}</span> + <span>4 × {rows[ri][1].toFixed(2)} × {cols[ci][1].toFixed(2)}</span> = <b>{predictions[ri][ci].toFixed(2)}</b></p><p className={s.note}>Baseline 1 + factor 1 ({parts[0].toFixed(2)}) + factor 2 ({parts[1].toFixed(2)}). Select any cell to inspect it.</p></div></div>
 <p className={s.footnote}>{mode==="rows"?"Movie factors are locked. Tune the people, then switch to movies.":mode==="cols"?"People factors are locked. Tune the movies, then switch to people.":"Try alternating: hold movie factors still while adjusting people, then swap."} Predictions use the same two-factor rule as the original activity, without clipping values.</p>
 </div>;
}
