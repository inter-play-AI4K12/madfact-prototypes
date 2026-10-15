import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { rmse, cellAngle, matrixAngle, factorPrediction, factorCells, factorPreset, handleStep, OPTIMIZATION_STEPS, OPTIMIZATION_INTERVAL_MS, errorColor } from "./model.mjs";
import s from "./balance.module.css";
type Cell={truth:number;prediction:number};
type SceneAPI={view:(name:string)=>void;zoom:(factor:number)=>void};
const signed=(v:number)=>`${v>0?"+":""}${v.toFixed(2)}`;
const degrees=(v:number)=>v*180/Math.PI;
function World({cells,selected,onSelect,apiRef,colorOn,edgeFill,active,optimizingPhase}:{cells:Cell[];selected:number;onSelect:(i:number)=>void;apiRef:React.RefObject<SceneAPI|null>;colorOn:boolean;edgeFill:boolean;active:{kind:'rows'|'cols';index:number;factor?:number}|null;optimizingPhase:'rows'|'cols'|null}){
 const host=useRef<HTMLDivElement>(null),live=useRef({cells,selected,onSelect,colorOn,edgeFill,active,optimizingPhase});
 const [error,setError]=useState("");
 useEffect(()=>{live.current={cells,selected,onSelect,colorOn,edgeFill,active,optimizingPhase};},[cells,selected,onSelect,colorOn,edgeFill,active,optimizingPhase]);
 useEffect(()=>{
  const el=host.current!;let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true});}catch{queueMicrotask(()=>setError('This device could not start 3D. Enable WebGL or try another browser.'));return;}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));renderer.setClearColor(0xeaf1f8);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.domElement.setAttribute('aria-label','3D balance matrix. Drag to orbit above the desk. Scroll or pinch to zoom. Tap a tile or its handles to select it.');el.appendChild(renderer.domElement);
  const scene=new THREE.Scene();scene.fog=new THREE.Fog(0xeaf1f8,24,45);
  const camera=new THREE.PerspectiveCamera(40,1,.1,80);camera.position.set(9,11,13);
  const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,3.5,0);controls.enableDamping=true;controls.minDistance=7;controls.maxDistance=25;controls.maxPolarAngle=Math.PI/2-.04;controls.enablePan=false;
  scene.add(new THREE.HemisphereLight(0xffffff,0x7391ae,2.6));
  const light=new THREE.DirectionalLight(0xffffff,3.5);light.position.set(-5,13,8);light.castShadow=true;light.shadow.mapSize.set(2048,2048);Object.assign(light.shadow.camera,{left:-9,right:9,top:10,bottom:-10});light.shadow.bias=-.001;scene.add(light);
  const materials:THREE.Material[]=[],geometries:THREE.BufferGeometry[]=[],textures:THREE.Texture[]=[];
  function material(color:number,metalness=.05){const m=new THREE.MeshStandardMaterial({color,roughness:.55,metalness});materials.push(m);return m;}
  const navy=material(0x193e60,.5),floorMat=material(0xdde7f1);
  function box(parent:THREE.Object3D,w:number,h:number,d:number,x:number,y:number,z:number,m:THREE.Material){const g=new THREE.BoxGeometry(w,h,d);geometries.push(g);const mesh=new THREE.Mesh(g,m);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
  function label(text:string,parent:THREE.Object3D,x:number,y:number,z:number,width=1.1){const cv=document.createElement('canvas');cv.width=256;cv.height=64;const ctx=cv.getContext('2d')!;ctx.fillStyle='#193e60';ctx.font='bold 28px Arial';ctx.textAlign='center';ctx.fillText(text,128,42);const tx=new THREE.CanvasTexture(cv);textures.push(tx);const mt=new THREE.SpriteMaterial({map:tx,depthWrite:false});materials.push(mt);const sprite=new THREE.Sprite(mt);sprite.scale.set(width,width/4,1);sprite.position.set(x,y,z);parent.add(sprite);}
  box(scene,200,.15,200,0,-.2,0,floorMat);box(scene,8,.16,6.8,0,0,0,material(0xf5f8fc));
  box(scene,.23,3.35,.5,-3.5,1.75,0,navy);box(scene,.23,3.35,.5,3.5,1.75,0,navy);
  // The shared axle is the parent pivot, underneath the complete board.
  const matrix=new THREE.Group();matrix.position.y=3.42;scene.add(matrix);
  box(matrix,7.5,.15,.15,0,0,0,navy);
  const board=new THREE.Group();board.position.y=.28;matrix.add(board);
  box(board,.14,.28,.14,-3.25,-.14,0,navy);box(board,.14,.28,.14,3.25,-.14,0,navy);
  box(board,6.7,.12,.12,0,0,-3.25,navy);box(board,6.7,.12,.12,0,0,3.25,navy);
  box(board,.12,.12,6.5,-3.25,0,0,navy);box(board,.12,.12,6.5,3.25,0,0,navy);
  label('NORTH',board,0,.15,-3.65,1.2);label('SOUTH',board,0,.15,3.65,1.2);label('WEST',board,-3.85,.15,0,.9);label('EAST',board,3.85,.15,0,.9);
  const handleGeometry=new THREE.SphereGeometry(.085,12,8);geometries.push(handleGeometry);
  type Tile={group:THREE.Group;plate:THREE.Mesh;weights:THREE.Mesh[];decal:THREE.Mesh;handles:THREE.Mesh[];hinge:THREE.Mesh;mat:THREE.MeshStandardMaterial;handleMat:THREE.MeshStandardMaterial;ctx:CanvasRenderingContext2D;texture:THREE.CanvasTexture;signature:string;truth:number;prediction:number};
  const tiles:Tile[]=[];
  function paint(tile:Tile,index:number){const truth=tile.truth,prediction=tile.prediction,signature=`${truth.toFixed(0)}:${prediction.toFixed(2)}:${live.current.edgeFill}`;if(signature===tile.signature)return;tile.signature=signature;const ctx=tile.ctx;ctx.clearRect(0,0,512,512);ctx.textAlign='center';ctx.fillStyle='#193e60';ctx.font='bold 27px Arial';ctx.fillText(`${Math.floor(index/5)+1} · ${index%5+1}`,256,43);
   if(live.current.edgeFill){
    // Equal lever arms: blue north and yellow south spread each value across its edge.
    // The largest fills meet at the centre; area is proportional to the rating.
    [truth,prediction].forEach((value,j)=>{const north=j===0,x=0,width=512,depth=value/5*256,y=north?0:512-depth;
     ctx.fillStyle=north?'#1479ed':'#ffc52e';ctx.fillRect(x,y,width,depth);
     ctx.strokeStyle=north?'#ffffffaa':'#725b2588';ctx.lineWidth=2;ctx.setLineDash([5,7]);
     for(let n=1;n<=5;n++){const yy=north?n*51.2:512-n*51.2;ctx.beginPath();ctx.moveTo(x,yy);ctx.lineTo(x+width,yy);ctx.stroke();}ctx.setLineDash([]);
     ctx.fillStyle=north?'#ffffff':'#193e60';ctx.font='bold 32px Arial';ctx.fillText(`${north?'GT':'P'} ${(north?value.toFixed(0):value.toFixed(2))}`,256,north?55:480);
    });
    ctx.fillStyle='#193e60';ctx.font='bold 25px Arial';ctx.fillText(`${Math.floor(index/5)+1} · ${index%5+1}`,256,265);
   }else{
   [truth,prediction].forEach((value,j)=>{const x=j===0?130:300,baseline=398,unit=59,width=82;ctx.fillStyle='#ffffff66';ctx.fillRect(x,baseline-5*unit,width,5*unit);ctx.fillStyle=j===0?'#1479ed':'#ffc52e';ctx.fillRect(x,baseline-value*unit,width,value*unit);ctx.strokeStyle=j===0?'#ffffffcc':'#725b25bb';ctx.lineWidth=3;ctx.setLineDash([5,6]);for(let n=1;n<=5;n++){const y=baseline-n*unit;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+width,y);ctx.stroke();}ctx.setLineDash([]);ctx.fillStyle='#193e60';ctx.font='bold 42px Arial';ctx.fillText(j===0?value.toFixed(0):value.toFixed(2),x+width/2,449);ctx.font='bold 22px Arial';ctx.fillText(j===0?'GT':'P',x+width/2,477);});
   ctx.textAlign='right';ctx.font='20px Arial';ctx.fillStyle='#193e60';for(let n=1;n<=5;n++)ctx.fillText(String(n),116,405-n*59);   }
   tile.texture.needsUpdate=true;
  }
  for(let i=0;i<25;i++){
   const group=new THREE.Group();group.position.set((i%5-2)*1.25,-.1,(Math.floor(i/5)-2)*1.25);board.add(group);
   const mat=material(0xb9bec5),handleMat=material(0x63809b,.35);
   mat.polygonOffset=true;mat.polygonOffsetFactor=1;mat.polygonOffsetUnits=1;
   const plate=box(group,1.05,.095,1.05,0,.1,0,mat);plate.userData.cell=i;
   const weights=[0x1479ed,0xffc52e].map(color=>{const mesh=box(group,1.05,.097,1,0,.1,0,material(color));mesh.userData.cell=i;mesh.visible=false;return mesh;});
   const hinge=box(group,1.22,.055,.055,0,0,0,handleMat);
   const handles=[-.6,.6].map(x=>{const mesh=new THREE.Mesh(handleGeometry,handleMat);mesh.position.set(x,0,0);mesh.userData.cell=i;mesh.castShadow=true;group.add(mesh);return mesh;});
   const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;textures.push(texture);
   const decalMaterial=new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:THREE.DoubleSide});materials.push(decalMaterial);const geometry=new THREE.PlaneGeometry(1.01,1.01);geometries.push(geometry);const decal=new THREE.Mesh(geometry,decalMaterial);decal.rotation.x=-Math.PI/2;decal.position.y=.15;decal.userData.cell=i;group.add(decal);
   const cell=live.current.cells[i];const tile={group,plate,weights,decal,handles,hinge,mat,handleMat,ctx:canvas.getContext('2d')!,texture,signature:'',truth:cell.truth,prediction:cell.prediction};paint(tile,i);tiles.push(tile);
  }
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let start={x:0,y:0},hovered=-1;
  function hit(e:PointerEvent){const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);return raycaster.intersectObjects(tiles.flatMap(t=>[t.plate,t.decal,...t.weights.filter(w=>w.visible),...t.handles]))[0]?.object.userData.cell??-1;}
  const down=(e:PointerEvent)=>{start={x:e.clientX,y:e.clientY};};
  const up=(e:PointerEvent)=>{if(Math.hypot(e.clientX-start.x,e.clientY-start.y)>6)return;const index=hit(e);if(index>=0)live.current.onSelect(index);};
  const move=(e:PointerEvent)=>{hovered=hit(e);renderer.domElement.style.cursor=hovered>=0?'pointer':'grab';};const leave=()=>{hovered=-1;};
  renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointerup',up);renderer.domElement.addEventListener('pointermove',move);renderer.domElement.addEventListener('pointerleave',leave);
  const resize=()=>{const w=el.clientWidth,h=el.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();};const observer=new ResizeObserver(resize);observer.observe(el);resize();
  apiRef.current={zoom(factor){camera.position.sub(controls.target).multiplyScalar(factor).add(controls.target);controls.update();},view(name){controls.target.set(0,3.5,0);camera.position.set(...(name==='top'?[.01,17,.01]:name==='front'?[0,6.5,17]:name==='side'?[17,6.5,.01]:[9,11,13]) as [number,number,number]);controls.update();}};
  let frame=0,previous=performance.now();const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const draw=(now:number)=>{const dt=Math.min((now-previous)/1000,.1);previous=now;const blend=reduce?1:1-Math.exp(-dt*8),state=live.current;matrix.rotation.x=THREE.MathUtils.lerp(matrix.rotation.x,matrixAngle(state.cells),blend);
   tiles.forEach((t,i)=>{const c=state.cells[i];t.group.rotation.x=THREE.MathUtils.lerp(t.group.rotation.x,cellAngle(c),blend);t.mat.color.set(state.colorOn?errorColor(c.prediction-c.truth):'#b9bec5');
    const affected=state.active&&(state.active.kind==='rows'?Math.floor(i/5):i%5)===state.active.index;
    const highlighted=i===state.selected||i===hovered||affected;
    t.handleMat.color.setHex(highlighted?0x00b7dc:0x63809b);t.handleMat.emissive.setHex(highlighted?0x008bb6:0);t.handleMat.emissiveIntensity=.55;t.handles.forEach(handle=>handle.scale.setScalar(highlighted?1.35:1));
    t.truth=THREE.MathUtils.lerp(t.truth,c.truth,blend);t.prediction=THREE.MathUtils.lerp(t.prediction,c.prediction,blend);t.weights.forEach((weight,j)=>{weight.visible=state.edgeFill;const depth=(j===0?t.truth:t.prediction)/5*.525;weight.scale.z=depth;weight.position.z=j===0?-.525+depth/2:.525-depth/2;});
    t.decal.scale.setScalar(state.edgeFill?1.05/1.01:1);paint(t,i);
   });controls.update();renderer.render(scene,camera);frame=requestAnimationFrame(draw);
  };frame=requestAnimationFrame(draw);
  return()=>{cancelAnimationFrame(frame);observer.disconnect();controls.dispose();renderer.domElement.removeEventListener('pointerdown',down);renderer.domElement.removeEventListener('pointerup',up);renderer.domElement.removeEventListener('pointermove',move);renderer.domElement.removeEventListener('pointerleave',leave);geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());renderer.dispose();el.removeChild(renderer.domElement);apiRef.current=null;};
 },[apiRef]);
 return <div ref={host} className={s.canvas}>{error&&<p role="alert" className={s.failure}>{error}</p>}</div>;
}
export default function Balance(){
 const [lab,setLab]=useState(()=>factorPreset('mixed')), [selected,setSelected]=useState(12),[example,setExample]=useState('mixed'),[optimizing,setOptimizing]=useState(false),[progress,setProgress]=useState(0);
 const apiRef=useRef<SceneAPI|null>(null);
 const cells:Cell[]=factorCells(lab.truths,lab.rows,lab.cols);
 const [edgeFill,setEdgeFill]=useState(false);
 const [colorOn,setColorOn]=useState(true),[active,setActive]=useState<{kind:'rows'|'cols';index:number;factor?:number}|null>(null),[optimizationPhase,setOptimizationPhase]=useState<'rows'|'cols'|null>(null);
 const labRef=useRef(lab);labRef.current=lab;
 const [stepLabel,setStepLabel]=useState('');
 useEffect(()=>{
  if(!optimizing)return;
  let step=0,updateTimer:ReturnType<typeof setTimeout>,nextTimer:ReturnType<typeof setTimeout>;
  function advance(){
   const old=labRef.current;
   if(step>=OPTIMIZATION_STEPS){setOptimizing(false);setOptimizationPhase(null);setActive(null);setProgress(1);setStepLabel('Main adjustments complete');return;}
   const next=handleStep(old.truths,old.rows,old.cols,step);
   setActive(next.handle);setOptimizationPhase(next.handle.kind);
   setStepLabel(`Round ${step<20?1:2} · Step ${step%20+1}: ${next.handle.kind==='rows'?'Person':'Movie'} ${next.handle.index+1} · F${next.handle.factor+1} · ${old[next.handle.kind][next.handle.index][next.handle.factor].toFixed(2)} → ${next[next.handle.kind][next.handle.index][next.handle.factor].toFixed(2)}`);
   // Highlight first, move one handle, then hold the result for inspection.
   updateTimer=setTimeout(()=>{const updated={...old,rows:next.rows,cols:next.cols};labRef.current=updated;setLab(updated);step++;setProgress(step/OPTIMIZATION_STEPS);},step<20?600:350);
   nextTimer=setTimeout(advance,step<20?OPTIMIZATION_INTERVAL_MS:1100);
  }
  advance();
  return()=>{clearTimeout(nextTimer);clearTimeout(updateTimer);};
 },[optimizing]);
 const avg=rmse(cells), cell=cells[selected],gap=cell.prediction-cell.truth,tilt=degrees(matrixAngle(cells));
 function load(name:string){setOptimizing(false);setOptimizationPhase(null);setProgress(0);setStepLabel('');setActive(null);setExample(name);setLab(factorPreset(name));}
 function changeFactor(kind:'rows'|'cols',index:number,f:number,v:number){setOptimizing(false);setOptimizationPhase(null);setProgress(0);setLab(old=>({...old,[kind]:old[kind].map((pair:number[],i:number)=>i===index?pair.map((value:number,j:number)=>j===f?v:value):pair)}));}
 function factorControls(kind:'rows'|'cols',index:number){return <div className={`${s.factorCard} ${(active?.kind===kind&&active.index===index)?s.activeFactor:""}`} onPointerEnter={()=>{if(!optimizing)setActive({kind,index});}} onPointerLeave={()=>{if(!optimizing)setActive(null);}} onFocus={()=>{if(!optimizing)setActive({kind,index});}} onBlur={()=>{if(!optimizing)setActive(null);}}><strong>{kind==='rows'?'Person':'Movie'} {index+1}</strong>{lab[kind][index].map((value:number,f:number)=><label key={f} className={optimizing&&active?.kind===kind&&active.index===index&&active.factor===f?s.movingHandle:undefined}><span>F{f+1}<output>{value.toFixed(2)}</output></span><input aria-label={`${kind==='rows'?'Person':'Movie'} ${index+1} factor ${f+1}`} type="range" min="0" max="1" step="0.01" value={value} onChange={e=>changeFactor(kind,index,f,Number(e.target.value))}/></label>)}</div>;}
 return <div className={s.root}>
  <div className={s.header}><div><p className={s.kicker}>MADFACT / BALANCE LAB</p><h1>Bring predictions into balance.</h1><p>Adjust the factors to match the yellow prediction to the blue ground truth. Watch each tile—and the whole matrix—settle.</p></div></div>
  <div className={s.toolbar}><div className={s.legend}><span><i className={s.blue}/>Ground Truth</span><span><i className={s.yellow}/>Prediction</span></div><button type="button" className={s.viewToggle} aria-pressed={edgeFill} onClick={()=>setEdgeFill(v=>!v)}>{edgeFill?"Show bars":"Show edge weights"}</button><label className={s.colorToggle}><input type="checkbox" checked={colorOn} onChange={e=>setColorOn(e.target.checked)}/>Error colors</label><label>Try an example <select value={example} onChange={e=>load(e.target.value)}><option value="mixed">Mixed errors</option><option value="small">Small errors</option><option value="maximum">Very large error</option><option value="balanced">Perfect balance</option></select></label></div>
  {edgeFill&&<p className={s.note}>Edge weights: blue fills from the north, yellow from the south. More filled area means more weight; matching values balance the tile.</p>}
  {colorOn&&<p className={s.colorKey}><span/>Green · matched <span/>Red · 4 points of error</p>}
  <div className={s.workspace}>
   <section className={s.stage} aria-label="3D balance exhibit"><div className={s.stageTop}><span>25 independent hinges · 1 shared platform</span><strong>{avg<.005?'In balance':'Finding balance'}</strong></div><div className={s.factorBoard}><div className={s.factorCorner}>2 factors<br/><span>25 linked predictions</span></div><div className={s.columnFactors}>{[0,1,2,3,4].map(i=><div key={i}>{factorControls('cols',i)}</div>)}</div><div className={s.rowFactors}>{[0,1,2,3,4].map(i=><div key={i}>{factorControls('rows',i)}</div>)}</div><World cells={cells} selected={selected} onSelect={setSelected} apiRef={apiRef} colorOn={colorOn} edgeFill={edgeFill} active={active} optimizingPhase={optimizationPhase}/></div><div className={s.camera}><span>View</span>{['perspective','top','front','side'].map(v=><button key={v} onClick={()=>apiRef.current?.view(v)}>{v==='perspective'?'3D':v[0].toUpperCase()+v.slice(1)}</button>)}<button aria-label="Zoom in" onClick={()=>apiRef.current?.zoom(.85)}>+</button><button aria-label="Zoom out" onClick={()=>apiRef.current?.zoom(1.15)}>−</button></div><p className={s.hint}>Drag to orbit · Scroll or pinch to zoom · Tap a tile to inspect</p></section>
   <aside className={s.inspector}>
    <div className={s.metric}><p>ROOT MEAN SQUARED ERROR</p><div><strong>{avg.toFixed(2)}</strong><span>/ 4 rating points</span></div><div className={s.track}><i style={{width:`${avg/4*100}%`}}/></div><div className={s.scale}><span>Horizontal · 0</span><span>Nearly vertical · 4</span></div><p className={s.angle}>Whole matrix tilt <b>{tilt.toFixed(1)}°</b></p></div>
    <div className={s.editor}><div className={s.editorTitle}><h2>Cell {Math.floor(selected/5)+1} · {selected%5+1}</h2><span>Person × movie</span></div>
     <div className={s.truthReadout}><span>Ground Truth <small>fixed rating</small></span><output>{cell.truth.toFixed(0)}</output></div>
     <div className={s.predictionReadout}><span>Prediction <small>from factors</small></span><output>{cell.prediction.toFixed(2)}</output></div>
     <p className={s.cellFormula}>1 + 2 × ({lab.rows[Math.floor(selected/5)][0].toFixed(2)} × {lab.cols[selected%5][0].toFixed(2)} + {lab.rows[Math.floor(selected/5)][1].toFixed(2)} × {lab.cols[selected%5][1].toFixed(2)}) = {factorPrediction(lab.rows[Math.floor(selected/5)],lab.cols[selected%5]).toFixed(2)}</p>
     <div className={s.difference}><span>Prediction − Ground Truth</span><b>{signed(gap)}</b></div><p className={s.direction}>{Math.abs(gap)<.005?'Matched. This tile is horizontal relative to its frame.':gap>0?'Overprediction: the north edge rises.':'Underprediction: the south edge rises.'}</p><p className={s.angle}>Local tile tilt <b>{signed(degrees(cellAngle(cell)))}°</b></p>
    </div>
    <p className={s.hint} aria-live="polite">{stepLabel}</p><div className={s.actions}><button className={s.train} onClick={()=>{if(optimizing){setOptimizing(false);setOptimizationPhase(null);}else{setActive(null);setProgress(0);setOptimizing(true);}}}>{optimizing?'Pause Optimize':'Optimize'}</button><button className={s.reset} onClick={()=>{load('mixed');setSelected(12);apiRef.current?.view('perspective');}}>Reset</button></div>
    <div className={s.trainingTrack}><i style={{width:`${progress*100}%`}}/></div><p className={s.note}>{optimizing?'One handle at a time: highlight → adjust → observe the linked tiles.':progress===1?'Main adjustments complete. Further fine-tuning is skipped.':'Optimize fits one handle at a time, alternating person and movie factors. Each adjustment reduces squared error.'}</p>
   </aside>
  </div>
  <div className={s.bottom}><section className={s.errorMap}><h2>Choose a cell · signed error</h2><div className={s.map}>{cells.map((c,i)=><button key={i} aria-label={`Cell ${Math.floor(i/5)+1}, ${i%5+1}. Error ${signed(c.prediction-c.truth)}`} aria-pressed={i===selected} onClick={()=>setSelected(i)} style={{background:colorOn?errorColor(c.prediction-c.truth):'#e1e4e8'}}>{signed(c.prediction-c.truth)}</button>)}</div><p>Rows run north to south. Columns run west to east.</p></section><section className={s.explanation}><h2>One tile. The whole picture.</h2><p><b>Ground Truth</b> is the rating someone actually gave. <b>Prediction</b> is the system’s estimate. Their difference controls each tile’s tilt.</p><div className={s.formula}>RMSE = √(Σ (Prediction − Ground Truth)² ÷ 25)</div><p>Positive and negative errors do not cancel. Larger mismatches count more. The root mean squared error across all 25 cells tilts the shared frame from 0° to 85°. Each tile also rotates up to ±70° (2× tilt response) within that frame.</p><p className={s.note}>Move a person factor to change a row, or a movie factor to change a column. Ground Truth is fixed for each example. Prediction = 1 + 2 × (person F1 × movie F1 + person F2 × movie F2). Two factors cannot always match every rating exactly.</p></section></div>
 </div>;
}
