import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { matrixAngle, cellAngle, errorColor } from "./model.mjs";
import { paintRatings } from "./ratings";
import type { Mode } from "./ratings";
import { createRentalRoom } from "./RentalRoom";
import ui from "./game.module.css";
type FactorKind = 'rows' | 'cols';
type Card = {id:string; name:string; image:string};
export type SceneAPI = {view:(name:string)=>void; zoom:(factor:number)=>void; reset:()=>void};
type Props = {
 cells:{truth:number; prediction:number}[]; selected:number; onSelect:(index:number)=>void;
 apiRef:React.RefObject<SceneAPI|null>; mode:Mode; active:{kind:FactorKind;index:number;factor?:number}|null;
 factors:{rows:number[][];cols:number[][]}; onFactor:(kind:FactorKind,index:number,f:number,v:number)=>void;
 onActive:(value:Props['active'])=>void; hidden:number[]; evaluated:boolean;
 people:Card[]; movies:Card[]; onCamera:(details:Record<string,unknown>)=>void;
};
export default function World(props:Props){
 const {apiRef}=props;
 const host=useRef<HTMLDivElement>(null), live=useRef(props);
 const [error,setError]=useState('');
 useEffect(()=>{live.current=props;},[props]);
 useEffect(()=>{
  const el=host.current!;let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true});}catch{queueMicrotask(()=>setError('This device could not start 3D. Enable WebGL or try another browser.'));return;}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));renderer.setClearColor(0x343c3a);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
  renderer.domElement.setAttribute('aria-label','3D balance matrix. Drag to orbit. Right-drag to move around the room. Scroll or pinch to zoom. Tap a tile or its handles to select it.');el.appendChild(renderer.domElement);
  const scene=new THREE.Scene();scene.fog=new THREE.Fog(0x343c3a,48,90);
  const camera=new THREE.PerspectiveCamera(40,1,.1,80);camera.position.set(-9,14,19);
  const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(-.8,2,.8);controls.enableDamping=true;controls.minDistance=9;controls.maxDistance=30;controls.maxPolarAngle=Math.PI/2-.04;controls.enablePan=true;controls.screenSpacePanning=true;controls.saveState();
  scene.add(new THREE.HemisphereLight(0xffebd1,0x50463d,.75));
  const light=new THREE.DirectionalLight(0xffd8a5,2.1);light.position.set(-12,16,8);light.castShadow=true;light.shadow.mapSize.set(2048,2048);Object.assign(light.shadow.camera,{left:-9,right:9,top:10,bottom:-10});light.shadow.bias=-.0002;light.shadow.normalBias=.025;light.shadow.intensity=.6;scene.add(light);
  const materials:THREE.Material[]=[],geometries:THREE.BufferGeometry[]=[],textures:THREE.Texture[]=[];
  function material(color:number,metalness=.05){const m=new THREE.MeshStandardMaterial({color,roughness:.55,metalness});materials.push(m);return m;}
  const navy=material(0x193e60,.5);
  function box(parent:THREE.Object3D,w:number,h:number,d:number,x:number,y:number,z:number,m:THREE.Material){const g=new THREE.BoxGeometry(w,h,d);geometries.push(g);const mesh=new THREE.Mesh(g,m);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
  // The tabletop keeps the original slider plane and board pivot.
  const room=createRentalRoom(scene,renderer);
  const oak=material(0xaa7750), darkWood=material(0x70503c);
  box(scene,13.8,.36,13.1,-1,-.10,1.25,oak);
  box(scene,13.1,.045,12.4,-1,.095,1.25,material(0xf1e8d8));
  for(const x of [-7.26,5.26])for(const z of [-4.67,7.17]){
   box(scene,.38,3.42,.38,x,-1.97,z,darkWood);
  }
  box(scene,.23,3.35,.5,-3.5,1.75,0,navy);box(scene,.23,3.35,.5,3.5,1.75,0,navy);
  // The shared axle is the parent pivot, underneath the complete board.
  const matrix=new THREE.Group();matrix.position.y=3.42;scene.add(matrix);
  box(matrix,7.5,.15,.15,0,0,0,navy);
  const board=new THREE.Group();board.position.y=.28;matrix.add(board);
  box(board,.14,.28,.14,-3.25,-.14,0,navy);box(board,.14,.28,.14,3.25,-.14,0,navy);
  box(board,6.7,.12,.12,0,0,-3.25,navy);box(board,6.7,.12,.12,0,0,3.25,navy);
  box(board,.12,.12,6.5,-3.25,0,0,navy);box(board,.12,.12,6.5,3.25,0,0,navy);
  // Controls belong to the stationary desk, outside the rotating matrix hierarchy.
  const deskControls=new THREE.Group();scene.add(deskControls);
  const sliderPlane=new THREE.Plane(new THREE.Vector3(0,1,0),-.2);
  type DeskSlider={kind:FactorKind;index:number;factor:number;axis:'x'|'z';start:number;end:number;thumb:THREE.Mesh;fill:THREE.Mesh;mat:THREE.MeshStandardMaterial;hit:THREE.Mesh};
  const sliders:DeskSlider[]=[];
  const fColors=[0xed5b9d,0x28343d];
  function cardName(name:string,x:number,z:number,w:number,h:number){
   const canvas=document.createElement('canvas');canvas.width=512;canvas.height=192;
   const ctx=canvas.getContext('2d')!;ctx.fillStyle='#26363d';ctx.fillRect(0,0,512,192);
   const lines:string[]=[];let line='';
   for(const word of name.split(' ')){if(line&&(line+' '+word).length>13){lines.push(line);line=word;}else line+=(line?' ':'')+word;}lines.push(line);
   ctx.fillStyle='#fff4dd';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`bold ${lines.length>1?54:70}px Arial`;
   lines.forEach((text,i)=>ctx.fillText(text,256,96+(i-(lines.length-1)/2)*64,490));
   const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=renderer.capabilities.getMaxAnisotropy();textures.push(texture);
   const m=new THREE.MeshBasicMaterial({map:texture,toneMapped:false});materials.push(m);
   const g=new THREE.PlaneGeometry(w,h);geometries.push(g);const mesh=new THREE.Mesh(g,m);mesh.rotation.x=-Math.PI/2;mesh.position.set(x,.26,z);deskControls.add(mesh);
  }
  // Each card stays with its factor controls when the board tilts.
  let disposed=false;
  function cardImage(card:Card,x:number,z:number,w:number,h:number){
   const tex=new THREE.TextureLoader().load(card.image,()=>{if(disposed)tex.dispose();});
   tex.colorSpace=THREE.SRGBColorSpace;
   tex.anisotropy=renderer.capabilities.getMaxAnisotropy();
   textures.push(tex);
   const m=new THREE.MeshBasicMaterial({map:tex,transparent:true});
   const g=new THREE.PlaneGeometry(w,h);
   materials.push(m);geometries.push(g);
   const mesh=new THREE.Mesh(g,m);
   mesh.rotation.x=-Math.PI/2;mesh.position.set(x,.25,z);deskControls.add(mesh);
  }
  for(const kind of ['rows','cols'] as FactorKind[])for(let index=0;index<5;index++){
   const center=(index-2)*1.25;
   if(kind==='rows'){
    box(deskControls,2.55,.08,1.13,-4.6,.13,center,material(0xe3eaf3));
    const card=live.current.people[index]; cardImage(card,-6.42,center,.95,.95);cardName(card.name,-6.42,center+.63,1.04,.25);
   }else{
    box(deskControls,1.13,.08,2.2,center,.13,4.35,material(0xe3eaf3));
    const card=live.current.movies[index]; cardImage(card,center,6.10,.93,1.28);cardName(card.name,center,7.03,1.15,.48);
   }
   for(let factor=0;factor<2;factor++){
    const axis=kind==='rows'?'x':'z',cx=kind==='rows'?-4.6:center+(factor===0?-.25:.25),cz=kind==='rows'?center+(factor===0?-.09:.29):4.23;
    const length=kind==='rows'?1.7:1.03;
    // South controls grow from the viewer toward the board (negative Z).
    const start=axis==='x'?cx-length/2:cz+length/2,end=axis==='x'?cx+length/2:cz-length/2;
    box(deskControls,axis==='x'?length:.08,.04,axis==='z'?length:.08,cx,.2,cz,material(0xa9b8ca));
    const fill=box(deskControls,axis==='x'?1:.08,.045,axis==='z'?1:.08,cx,.205,cz,material(fColors[factor]));
    const mat=material(fColors[factor],.25),thumb=box(deskControls,.21,.13,.21,cx,.27,cz,mat);
    const hitMat=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false});materials.push(hitMat);
    const hit=box(deskControls,axis==='x'?length+.3:.42,.08,axis==='z'?length+.3:.32,cx,.25,cz,hitMat);
    sliders.push({kind,index,factor,axis,start,end,thumb,fill,mat,hit});
   }
  }
  const handleGeometry=new THREE.SphereGeometry(.085,12,8);geometries.push(handleGeometry);
  type Tile={group:THREE.Group;plate:THREE.Mesh;weights:THREE.Mesh[];decal:THREE.Mesh;handles:THREE.Mesh[];hinge:THREE.Mesh;mat:THREE.MeshBasicMaterial;handleMat:THREE.MeshStandardMaterial;ctx:CanvasRenderingContext2D;texture:THREE.CanvasTexture;signature:string;truth:number;prediction:number};
  const tiles:Tile[]=[];
  function paint(tile:Tile,index:number){
   const state=live.current, held=state.hidden.includes(index);
   const signature=[tile.truth,tile.prediction.toFixed(2),state.mode,held,state.evaluated].join('/');
   if(signature===tile.signature)return;
   tile.signature=signature;
   paintRatings(tile.ctx,state.mode,tile.truth,tile.prediction,held,state.evaluated);
   tile.texture.needsUpdate=true;
  }
  for(let i=0;i<25;i++){
   const group=new THREE.Group();group.position.set((i%5-2)*1.25,-.1,(Math.floor(i/5)-2)*1.25);board.add(group);
   // Tile colors encode error: keep their hues independent of the room lighting.
   const mat=new THREE.MeshBasicMaterial({color:0xb9bec5,toneMapped:false});materials.push(mat);
   const handleMat=material(0x63809b,.35);
   mat.polygonOffset=true;mat.polygonOffsetFactor=1;mat.polygonOffsetUnits=1;
   const plate=box(group,1.05,.095,1.05,0,.1,0,mat);plate.userData.cell=i;
   const weights=[0x1479ed,0xffc52e].map(color=>{const mesh=box(group,1.05,.097,1,0,.1,0,material(color));mesh.userData.cell=i;mesh.visible=false;return mesh;});
   const hinge=box(group,1.22,.055,.055,0,0,0,handleMat);
   const handles=[-.6,.6].map(x=>{const mesh=new THREE.Mesh(handleGeometry,handleMat);mesh.position.set(x,0,0);mesh.userData.cell=i;mesh.castShadow=true;group.add(mesh);return mesh;});
   const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;textures.push(texture);
   const decalMaterial=new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});materials.push(decalMaterial);const geometry=new THREE.PlaneGeometry(1.01,1.01);geometries.push(geometry);const decal=new THREE.Mesh(geometry,decalMaterial);decal.rotation.x=-Math.PI/2;decal.position.y=.15;decal.userData.cell=i;group.add(decal);
   const cell=live.current.cells[i];const tile={group,plate,weights,decal,handles,hinge,mat,handleMat,ctx:canvas.getContext('2d')!,texture,signature:'',truth:cell.truth,prediction:cell.prediction};paint(tile,i);tiles.push(tile);
  }
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let start={x:0,y:0},hovered=-1;
  function hit(e:PointerEvent){const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);return raycaster.intersectObjects(tiles.flatMap(t=>[t.plate,t.decal,...t.weights.filter(w=>w.visible),...t.handles]))[0]?.object.userData.cell??-1;}
  let dragging:DeskSlider|null=null,hoveringControl=false;
  function sliderHit(e:PointerEvent){hit(e);const found=raycaster.intersectObjects(sliders.map(s=>s.hit))[0];return found?sliders.find(s=>s.hit===found.object)??null:null;}
  function adjust(e:PointerEvent,slider:DeskSlider){hit(e);const point=raycaster.ray.intersectPlane(sliderPlane,new THREE.Vector3());if(!point)return;
   const value=Math.round(THREE.MathUtils.clamp((point[slider.axis]-slider.start)/(slider.end-slider.start),0,1)*100)/100;
   live.current.onFactor(slider.kind,slider.index,slider.factor,value);live.current.onActive({kind:slider.kind,index:slider.index,factor:slider.factor});
  }
  const down=(e:PointerEvent)=>{if(e.button!==0)return;const slider=live.current.evaluated?null:sliderHit(e);if(slider){e.preventDefault();e.stopImmediatePropagation();dragging=slider;controls.enabled=false;renderer.domElement.setPointerCapture(e.pointerId);adjust(e,slider);return;}start={x:e.clientX,y:e.clientY};};
  const up=(e:PointerEvent)=>{if(e.button===2)return;if(dragging){e.stopImmediatePropagation();dragging=null;controls.enabled=true;if(renderer.domElement.hasPointerCapture(e.pointerId))renderer.domElement.releasePointerCapture(e.pointerId);live.current.onActive(null);return;}if(Math.hypot(e.clientX-start.x,e.clientY-start.y)>6)return;const index=hit(e);if(index>=0)live.current.onSelect(index);};
  const move=(e:PointerEvent)=>{if(dragging){e.preventDefault();e.stopImmediatePropagation();adjust(e,dragging);return;}const slider=live.current.evaluated?null:sliderHit(e);if(slider){hoveringControl=true;hovered=-1;renderer.domElement.style.cursor='ew-resize';live.current.onActive({kind:slider.kind,index:slider.index,factor:slider.factor});return;}if(hoveringControl){hoveringControl=false;live.current.onActive(null);}hovered=hit(e);renderer.domElement.style.cursor=hovered>=0?'pointer':'grab';};const leave=()=>{hovered=-1;if(!dragging)live.current.onActive(null);};
  const cancel=(e:PointerEvent)=>{if(dragging)up(e);};
  renderer.domElement.addEventListener('pointerdown',down,true);renderer.domElement.addEventListener('pointerup',up,true);renderer.domElement.addEventListener('pointermove',move,true);renderer.domElement.addEventListener('pointerleave',leave);renderer.domElement.addEventListener('pointercancel',cancel,true);
  const resize=()=>{const w=el.clientWidth,h=el.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();};const observer=new ResizeObserver(resize);observer.observe(el);resize();
  apiRef.current={reset(){controls.reset();},zoom(factor){camera.position.sub(controls.target).multiplyScalar(factor).add(controls.target);controls.update();},view(name){controls.target.set(-.8,2,.8);camera.position.set(...(name==='top'?[-.8,21,.81]:name==='front'?[-.8,9,21]:name==='side'?[-21,9,.8]:[-9,14,19]) as [number,number,number]);controls.update();}};
  let lastPose='',lastTime=0;
  function recordCamera(now:number,force=false){
   if(!force&&now-lastTime<300)return;
   const round=(v:number)=>Number(v.toFixed(3));
   const pose={azimuth:round(controls.getAzimuthalAngle()),polar:round(controls.getPolarAngle()),distance:round(controls.getDistance()),position:camera.position.toArray().map(round),target:controls.target.toArray().map(round)};
   const key=JSON.stringify(pose);
   if(key!==lastPose){live.current.onCamera(pose);lastPose=key;lastTime=now;}
  }
  const endOrbit=()=>recordCamera(performance.now(),true);
  controls.addEventListener('end',endOrbit);
  let frame=0,previous=performance.now();const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const draw=(now:number)=>{const dt=Math.min((now-previous)/1000,.1);previous=now;const blend=reduce?1:1-Math.exp(-dt*8),state=live.current;matrix.rotation.x=THREE.MathUtils.lerp(matrix.rotation.x,matrixAngle(state.cells.filter((_,i)=>!state.hidden.includes(i))),blend);
   sliders.forEach(slider=>{
    const value=state.factors[slider.kind][slider.index][slider.factor],delta=slider.end-slider.start;
    slider.thumb.position[slider.axis]=slider.start+value*delta;
    slider.fill.scale[slider.axis]=Math.max(.001,value*Math.abs(delta));slider.fill.position[slider.axis]=slider.start+value*delta/2;
    const highlighted=state.active?.kind===slider.kind&&state.active.index===slider.index&&(state.active.factor===undefined||state.active.factor===slider.factor);
    slider.mat.emissive.setHex(highlighted?0x008bb6:0);slider.mat.emissiveIntensity=.7;slider.thumb.scale.setScalar(highlighted?1.25:1);

   });
   tiles.forEach((t,i)=>{const c=state.cells[i];const held=state.hidden.includes(i), unknown=held&&!state.evaluated, muted=!held&&state.evaluated;
    const angle=unknown?(reduce?0:Math.sin(now*.0016+i)*.12)-matrix.rotation.x:cellAngle(c);
    t.group.rotation.x=THREE.MathUtils.lerp(t.group.rotation.x,angle,blend);
    t.mat.color.set(unknown?'#c3bfcc':muted?'#c3c8cd':errorColor(c.prediction-c.truth));
    const affected=state.active&&(state.active.kind==='rows'?Math.floor(i/5):i%5)===state.active.index;
    const highlighted=i===state.selected||i===hovered||affected;
    t.handleMat.color.setHex(highlighted?0x00b7dc:0x63809b);t.handleMat.emissive.setHex(highlighted?0x008bb6:0);t.handleMat.emissiveIntensity=.55;t.handles.forEach(handle=>handle.scale.setScalar(highlighted?1.35:1));
    t.truth=THREE.MathUtils.lerp(t.truth,c.truth,blend);t.prediction=THREE.MathUtils.lerp(t.prediction,c.prediction,blend);t.weights.forEach((weight,j)=>{weight.visible=state.mode==='edges'&&!(unknown&&j===0);
    (weight.material as THREE.MeshStandardMaterial).color.set(muted?(j?'#969da5':'#b5bbc0'):j?(held?'#7040ad':'#ffc52e'):'#1479ed');const depth=(j===0?t.truth:t.prediction)/4*.525;weight.scale.z=depth;weight.position.z=j===0?-.525+depth/2:.525-depth/2;});
    t.decal.scale.setScalar(state.mode==='edges'?1.05/1.01:1);paint(t,i);
   });controls.update();room.update(camera);recordCamera(now);renderer.render(scene,camera);frame=requestAnimationFrame(draw);
  };frame=requestAnimationFrame(draw);
  return()=>{room.dispose();disposed=true;controls.removeEventListener('end',endOrbit);cancelAnimationFrame(frame);observer.disconnect();controls.dispose();renderer.domElement.removeEventListener('pointerdown',down,true);renderer.domElement.removeEventListener('pointerup',up,true);renderer.domElement.removeEventListener('pointermove',move,true);renderer.domElement.removeEventListener('pointerleave',leave);renderer.domElement.removeEventListener('pointercancel',cancel,true);geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());renderer.dispose();el.removeChild(renderer.domElement);apiRef.current=null;};
 },[apiRef]);
 return error?<FlatBoard {...props}/>:<div ref={host} className={ui.canvas}/>;
}

function RatingFace({cell,mode,held,evaluated}:{cell:Props['cells'][number];mode:Mode;held:boolean;evaluated:boolean}){
 const ref=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  const ctx=ref.current?.getContext('2d');
  if(ctx)paintRatings(ctx,mode,cell.truth,cell.prediction,held,evaluated);
 },[mode,cell.truth,cell.prediction,held,evaluated]);
 return <canvas ref={ref} width={512} height={512} aria-hidden="true"/>;
}
function FlatBoard(props:Props){
 const {cells,people,movies,hidden,evaluated,factors,mode}=props;
 const card=(kind:FactorKind,index:number)=>{
  const item=(kind==='rows'?people:movies)[index];
  return <div className={ui.flatCard} key={item.id}><img src={item.image} alt=""/><b>{item.name}</b>{factors[kind][index].map((v,f)=><label key={f}>F{f+1}<input aria-label={item.name+' desk factor '+(f+1)} disabled={evaluated} type="range" min="0" max="1" step=".01" value={v} onChange={e=>props.onFactor(kind,index,f,Number(e.target.value))}/></label>)}</div>;
 };
 return <div className={ui.flat}><p>Top-down board · 3D is unavailable on this device.</p>
 <div className={ui.flatGrid}>{people.map((person,r)=><div key={person.id} className={ui.flatRow}>{card('rows',r)}{movies.map((movie,c)=>{
  const i=r*5+c,cell=cells[i],held=hidden.includes(i);
  return <button key={movie.id} aria-label={person.name+' × '+movie.name} aria-pressed={props.selected===i} onClick={()=>props.onSelect(i)} style={{background:held&&!evaluated||!held&&evaluated?'#c6c7cc':errorColor(cell.prediction-cell.truth)}}><RatingFace cell={cell} mode={mode} held={held} evaluated={evaluated}/></button>;
 })}</div>)}<div className={ui.flatRow}><div/>{movies.map((_,c)=>card('cols',c))}</div></div></div>;
}
