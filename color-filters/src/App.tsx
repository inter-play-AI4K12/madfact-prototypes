import { useMemo, useState } from "react";

const people = ["Wendell", "Priya", "Hank"];
const movies = ["Star Drifter", "Astro Blasters", "Boom Town"];
const truth = [[5,4,2],[5,4,2],[4,5,3]];
const seedRows = people.map(() => [0.5, 0.5]);
const seedCols = [[1,0.02],[0.02,1],[0.7,0.7]];

function mixColors(start:string,end:string,amount:number) {
  const channel=(hex:string,offset:number)=>parseInt(hex.slice(offset,offset+2),16);
  const mixed=[1,3,5].map(offset=>Math.round(channel(start,offset)+(channel(end,offset)-channel(start,offset))*amount));
  return `rgb(${mixed.join(",")})`;
}

function withAlpha(rgb:string,alpha:number) {
  return rgb.replace("rgb(","rgba(").replace(")",`,${alpha})`);
}

type SpectrumProps={name:string;start:string;end:string;onStart:(value:string)=>void;onEnd:(value:string)=>void};
function SpectrumPicker({name,start,end,onStart,onEnd}:SpectrumProps) {
  return <div className="spectrum-picker"><strong>{name}</strong>
    <label><span>0</span><input type="color" value={start} aria-label={`${name} low color`} onChange={e=>onStart(e.target.value)}/></label>
    <div className="spectrum" style={{background:`linear-gradient(90deg, ${start}, ${end})`}} />
    <label><span>5</span><input type="color" value={end} aria-label={`${name} high color`} onChange={e=>onEnd(e.target.value)}/></label>
  </div>;
}

type PairProps = { label:string; values:number[]; vertical?:boolean; disabled:boolean; onChange:(factor:number,value:number)=>void };
function SliderPair({label,values,vertical=false,disabled,onChange}:PairProps) {
  return <div className={`factor-control ${vertical ? "vertical" : "horizontal"}`}>
    <span className="factor-label">{label}</span><div className="sliders">
      {values.map((value,factor)=><label key={factor} className={`slider factor-${factor+1}`}>
        <span className="sr-only">{label}, factor {factor+1}</span>
        <input type="range" min="0" max="1.3" step="0.05" value={value} disabled={disabled}
          aria-label={`${label}, factor ${factor+1}, ${value.toFixed(2)}`}
          onChange={e=>onChange(factor,Number(e.target.value))}/><output>{value.toFixed(2)}</output>
      </label>)}
    </div>
  </div>;
}

export default function Home() {
  const [started,setStarted]=useState(false);
  const [rows,setRows]=useState(seedRows);
  const [cols,setCols]=useState(seedCols);
  const [spectrumStart,setSpectrumStart]=useState("#000000");
  const [spectrumEnd,setSpectrumEnd]=useState("#ffd323");
  const [truthStart,setTruthStart]=useState("#000000");
  const [truthEnd,setTruthEnd]=useState("#087af1");
  const [overlayTruth,setOverlayTruth]=useState(false);
  const predictions=useMemo(()=>rows.map(row=>cols.map(col=>Math.min(5,Math.max(1,1+4*(row[0]*col[0]+row[1]*col[1]))))),[rows,cols]);
  const meanError=useMemo(()=>truth.flat().reduce((sum,target,index)=>sum+Math.abs(target-predictions[Math.floor(index/3)][index%3]),0)/9,[predictions]);
  function change(kind:"row"|"col",index:number,factor:number,value:number) {
    const setter=kind==="row"?setRows:setCols;
    setter(current=>current.map((pair,i)=>i===index?pair.map((v,f)=>f===factor?value:v):pair));
  }
  function reset(){setRows(seedRows.map(v=>[...v]));setCols(seedCols.map(v=>[...v]));setOverlayTruth(false);}
  function startOver(){reset();setStarted(false);}
  return <main>
    <header><div><p className="eyebrow">Easy activity · 3 × 3 · 2 factors</p>
      <h1>{overlayTruth?"Compare the overlap":started?"Tune the prediction":"Place the blue covers"}</h1>
      <p className="instruction">{started
        ?overlayTruth
          ?"Ground truth is now layered over the live prediction. Similar intensities blend toward the overlap color."
          :"Move the two sliders beside any row or column. Prediction intensity updates live; press Overlay ground truth when you are ready to compare."
        :"Match each transparent blue cover to the blue value shown below. When every cover is in place, press Next."}</p></div>
      <div className="color-tools" aria-label="Prediction color spectrum">
        <SpectrumPicker name="Ground truth" start={truthStart} end={truthEnd} onStart={setTruthStart} onEnd={setTruthEnd}/>
        <SpectrumPicker name="Prediction" start={spectrumStart} end={spectrumEnd} onStart={setSpectrumStart} onEnd={setSpectrumEnd}/>
      </div>
    </header>
    <section className={`board ${started?"prediction-mode":"truth-mode"}`} aria-label="Matrix factorization board">
      <div className="corner"><span>Factor 1</span><span>Factor 2</span></div>
      <div className="column-controls">{movies.map((movie,col)=><SliderPair key={movie} label={movie} values={cols[col]} vertical disabled={!started} onChange={(f,v)=>change("col",col,f,v)}/>)}</div>
      <div className="row-controls">{people.map((person,row)=><SliderPair key={person} label={person} values={rows[row]} disabled={!started} onChange={(f,v)=>change("row",row,f,v)}/>)}</div>
      <div className="matrix" role="grid" aria-label={started?"Current predictions":"Ground truth ratings"}>
        {truth.flatMap((line,row)=>line.map((target,col)=>{const value=started?predictions[row][col]:target;const intensity=started?(value-1)/4:target/5;const predictionColor=mixColors(spectrumStart,spectrumEnd,intensity);const groundColor=mixColors(truthStart,truthEnd,target/5);return <div
          className={`cell ${started?"prediction":"ground-truth"}`} role="gridcell" key={`${row}-${col}`}
          style={{backgroundColor:started?predictionColor:groundColor,backgroundImage:started&&overlayTruth?`linear-gradient(${withAlpha(groundColor,.58)},${withAlpha(groundColor,.58)})`:"none"}}
          aria-label={`${people[row]}, ${movies[col]}: prediction ${value.toFixed(started?1:0)}${overlayTruth?`, ground truth ${target}`:""}`}>
          <span className="cell-value">{value.toFixed(started?1:0)}</span>
          {started&&overlayTruth&&<span className="gt-value"><small>GT</small>{target}</span>}
        </div>}))}
      </div>
    </section>
    <footer><div className="status" aria-live="polite"><span>{started?"Mean error":"Cover setup"}</span><strong>{started?meanError.toFixed(2):"9 cells"}</strong></div>
      <div className="actions">{started&&<button className="secondary" onClick={reset}>Reset factors</button>}
        {started&&<button className="compare" aria-pressed={overlayTruth} onClick={()=>setOverlayTruth(value=>!value)}>{overlayTruth?"Hide overlay":"Overlay ground truth"}</button>}
        <button className="primary" onClick={started?startOver:()=>setStarted(true)}>{started?"Start over":"Next →"}</button></div>
    </footer>
  </main>;
}
