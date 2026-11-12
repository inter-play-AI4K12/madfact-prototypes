import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { movies } from './art';

// A cutaway interior: architecture establishes the room; the open aisle keeps the abacus usable.
export function createRentalRoom(scene:THREE.Scene,renderer:THREE.WebGLRenderer){
 const root=new THREE.Group();scene.add(root);
 const geometries:THREE.BufferGeometry[]=[],materials:THREE.Material[]=[],textures:THREE.Texture[]=[];
 const mat=(color:number,roughness=.8)=>{const m=new THREE.MeshStandardMaterial({color,roughness,metalness:0});materials.push(m);return m;};
 const plaster=mat(0x34494a),green=mat(0x203536),trim=mat(0xc0ae8f),wood=mat(0x987252),dark=mat(0x303f3d),cream=mat(0xb59d79),black=mat(0x202d2d);
 const mesh=(parent:THREE.Object3D,g:THREE.BufferGeometry,m:THREE.Material,x:number,y:number,z:number)=>{geometries.push(g);const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;};
 const box=(p:THREE.Object3D,w:number,h:number,d:number,x:number,y:number,z:number,m:THREE.Material)=>mesh(p,new THREE.BoxGeometry(w,h,d),m,x,y,z);
 const text=(p:THREE.Object3D,title:string,sub:string,w:number,h:number,x:number,y:number,z:number,bg='#304d4b',fg='#eee4cd')=>{
  const c=document.createElement('canvas');c.width=1024;c.height=Math.round(1024*h/w);const ctx=c.getContext('2d')!;
  ctx.fillStyle=bg;ctx.fillRect(0,0,c.width,c.height);ctx.textAlign='center';ctx.fillStyle=fg;
  ctx.font=`600 ${Math.round(c.height*(sub?.30:.38))}px Trebuchet MS`;ctx.fillText(title,512,c.height*(sub?.46:.64),940);
  if(sub){ctx.font=`${Math.round(c.height*.13)}px Arial`;ctx.fillText(sub,512,c.height*.76,930);}
  const tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;tx.anisotropy=renderer.capabilities.getMaxAnisotropy();textures.push(tx);
  const m=new THREE.MeshStandardMaterial({map:tx,roughness:.9});materials.push(m);
  return mesh(p,new THREE.PlaneGeometry(w,h),m,x,y,z);
 };
 // Large, quiet floor tiles anchor the furniture, with a perimeter in a darker tone.
 box(root,36,.25,34,0,-3.82,0,mat(0x918d7d));
 const tileMats=[mat(0xaaa08b),mat(0xa39985),mat(0xb1a591)];
 for(let x=0;x<12;x++)for(let z=0;z<11;z++)box(root,2.97,.035,2.97,-16.5+x*3,-3.675,-15+z*3,tileMats[(x*7+z*3)%3]);
 const back=new THREE.Group(),left=new THREE.Group(),right=new THREE.Group();root.add(back,left,right);
 box(back,36,12,.35,0,2.3,-16.7,plaster);box(back,36,3,.4,0,-2.05,-16.47,green);
 box(back,36,.16,.18,0,-.5,-16.2,trim);box(back,36,.2,.16,0,-3.5,-16.2,dark);
 box(back,36,.3,.6,0,8.05,-16.3,cream);
 for(const [group,x] of [[left,-17.7],[right,17.7]] as const){
  box(group,.35,12,34,x,2.3,0,plaster);box(group,.4,3,34,x,-2.05,0,green);
  box(group,.2,.16,34,x+(x<0?.23:-.23),-.5,0,trim);box(group,.2,.2,34,x+(x<0?.23:-.23),-3.5,0,dark);
  box(group,.6,.3,34,x,8.05,0,cream);
 }
 // Recessed shelving is geometry, not a picture of a DVD aisle.
 const caseColors=[0x9d644c,0x3d6269,0xb39865,0x5b667f,0x798263,0x995e68].map(c=>mat(c));
 function shelf(x:number,width:number,category:string,offset:number){
  const z=-15.7;box(back,width,6.1,.3,x,-.4,z,dark);
  for(const sx of [-1,1])box(back,.16,6.2,1.05,x+sx*width/2,-.4,z+.48,wood);
  for(let level=0;level<4;level++)box(back,width,.12,1.2,x,-3.4+level*1.9,z+.58,wood);
  for(let level=0;level<3;level++)for(let i=0;i<7;i++){
   // Breathing room between small groups of cases; only three short rows per bay.
   const cx=x-width*.38+i*width*.118,cy=-2.68+level*1.9;
   const c=box(back,.43,1.20,.17,cx,cy,z+.88,caseColors[(i+level+offset)%caseColors.length]);c.rotation.z=(i===5?-.09:0);
   box(back,.28,.045,.012,cx,cy+.26,z+.975,cream);
   box(back,.20,.025,.012,cx,cy-.29,z+.975,cream);
  }
  text(back,category,'',width-.2,.52,x,2.98,z+.65);
 }
 shelf(-11.8,5.6,'ADVENTURE',0);shelf(-5,5.6,'COMEDY',2);shelf(1.8,5.6,'STAFF PICKS',4);
 box(back,19.9,2.2,.18,-5.0,5.35,-16.22,wood);
 text(back,'FRIDAY MOVIE CLUB','MOVIE RENTALS  /  GOOD STORIES, TAKEN HOME',19.3,1.9,-5,5.35,-16.10);
 // A compact checkout nook in the back corner, away from the play area.
 box(back,6.3,2.75,2.7,11,-2.25,-12.9,green);box(back,6.65,.23,3.05,11,-.75,-12.9,wood);
 box(back,5.8,.08,.05,11,-2.45,-11.52,trim);
 box(back,1.15,.12,.85,11.4,-.56,-13,black);box(back,.16,.65,.16,11.4,-.24,-13.1,black);
 const monitor=box(back,1.45,.95,.16,11.4,.30,-13.15,black);monitor.rotation.x=-.12;
 const screen=box(back,1.27,.75,.03,11.4,.31,-13.04,mat(0x7b9b94));screen.rotation.x=-.12;
 text(back,'RETURNS','',2.1,.5,8.95,-1.8,-11.51);
 // Neon is drawn as glowing tubing on transparent glass, with a light washing the wall.
 box(back,6.4,2.6,.12,11,3.7,-16.17,black);
 const neonCanvas=document.createElement('canvas');neonCanvas.width=1024;neonCanvas.height=416;
 const nc=neonCanvas.getContext('2d')!;nc.textAlign='center';nc.textBaseline='middle';
 nc.font='600 112px Trebuchet MS';nc.lineJoin='round';
 nc.shadowColor='#ff704e';nc.shadowBlur=42;nc.strokeStyle='#ff704e';nc.lineWidth=8;
 nc.strokeText('ONE MORE',512,145);nc.strokeText('MOVIE',512,280);
 nc.shadowBlur=18;nc.strokeStyle='#ffb899';nc.lineWidth=3;
 nc.strokeText('ONE MORE',512,145);nc.strokeText('MOVIE',512,280);
 nc.shadowBlur=0;nc.strokeStyle='#fff0d7';nc.lineWidth=1.2;
 nc.strokeText('ONE MORE',512,145);nc.strokeText('MOVIE',512,280);
 const neonTexture=new THREE.CanvasTexture(neonCanvas);neonTexture.colorSpace=THREE.SRGBColorSpace;textures.push(neonTexture);
 const neonMaterial=new THREE.MeshBasicMaterial({map:neonTexture,transparent:true,depthWrite:false,toneMapped:false});materials.push(neonMaterial);
 mesh(back,new THREE.PlaneGeometry(6.3,2.56),neonMaterial,11,3.7,-16.08);
 const neonWash=new THREE.PointLight(0xff7548,85,10,2);neonWash.position.set(11,3.7,-14.8);root.add(neonWash);
 const amber=new THREE.MeshBasicMaterial({color:0xffce83,toneMapped:false});materials.push(amber);
 for(const x of [-8.4,5.3]){
  box(back,.30,1.20,.20,x,4.2,-16.0,dark);box(back,.14,.92,.12,x,4.2,-15.83,amber);
  const sconce=new THREE.PointLight(0xffb45f,70,10,2);sconce.position.set(x,4.1,-15.2);root.add(sconce);
 }

 // Front glazing and a real framed entrance; hidden on the camera side like an architectural cutaway.
 const front=new THREE.Group();root.add(front);
 const glass=new THREE.MeshPhysicalMaterial({color:0xb4d1d2,transparent:true,opacity:.24,roughness:.18,metalness:.05,depthWrite:false});materials.push(glass);
 for(const x of [-12,-4,4]){
  box(front,7.8,8.9,.10,x,.85,16.7,glass);
  for(const edge of [-1,1])box(front,.12,9.8,.18,x+edge*3.92,1.25,16.7,dark);
  box(front,7.9,.14,.18,x,-1.6,16.7,dark);
 }
 box(front,7.9,.3,.35,12,6.2,16.7,dark);box(front,7.9,.3,.35,12,-3.5,16.7,dark);
 for(const x of [8.05,15.95])box(front,.2,9.8,.25,x,1.25,16.7,dark);
 box(front,7.65,9.4,.12,12,1.25,16.7,glass);box(front,.1,1.1,.12,9,.3,16.4,trim);
 const welcome=text(front,'OPEN','Find your Friday film.',2.7,1.7,12,2.5,16.5,'#efe3cd','#365b56');welcome.rotation.y=Math.PI;
 // One reading bench and two framed film posters, leaving the central aisle empty.
 const furnishings=new THREE.Group();root.add(furnishings);
 box(furnishings,1.7,.45,5.4,15.4,-2.45,4.8,wood);box(furnishings,.2,2.0,5.4,16.08,-1.8,4.8,green);
 for(const z of [2.7,6.9])for(const x of [14.8,16])box(furnishings,.15,.95,.15,x,-3.15,z,dark);
 for(let i=0;i<2;i++){
  const frame=box(right,.16,3.7,2.75,17.43,2.7,-7+i*5.3,dark);
  const tx=new THREE.TextureLoader().load(movies[i].image);tx.colorSpace=THREE.SRGBColorSpace;textures.push(tx);
  const pm=new THREE.MeshStandardMaterial({map:tx,roughness:1});materials.push(pm);
  const poster=mesh(right,new THREE.PlaneGeometry(2.5,3.45),pm,frame.position.x-.1,2.7,frame.position.z);poster.rotation.y=-Math.PI/2;
 }
 // Window bounce and broad ceiling fixtures, rather than small, harsh point lights.
 RectAreaLightUniformsLib.init();
 const windowLight=new THREE.RectAreaLight(0xffe6bf,1.1,16,9);windowLight.position.set(-5,3,16);windowLight.lookAt(-1,0,0);root.add(windowLight);
 const overhead=new THREE.RectAreaLight(0xffcf91,4.8,12,8);overhead.position.set(0,8.7,-4);overhead.lookAt(0,-1,0);root.add(overhead);
 const luminous=new THREE.MeshBasicMaterial({color:0xfff3dc});materials.push(luminous);
 const ceiling=new THREE.Group();root.add(ceiling);
 for(const x of [-11,11]){
  box(ceiling,.07,1.3,.07,x,7.6,-5,dark);box(ceiling,1.3,.14,6,x,6.9,-5,cream);box(ceiling,1.15,.03,5.8,x,6.81,-5,luminous);
 }
 const pmrem=new THREE.PMREMGenerator(renderer),envScene=new RoomEnvironment();
 const environment=pmrem.fromScene(envScene,.05);scene.environment=environment.texture;scene.environmentIntensity=.16;envScene.dispose();pmrem.dispose();
 return {
  update(camera:THREE.Camera){
   // Remove only the wall between the camera and the room; all other surfaces remain.
   back.visible=camera.position.z>-15;front.visible=camera.position.z<13;
   left.visible=camera.position.x>-14;right.visible=camera.position.x<14;
   ceiling.visible=camera.position.y<10;
  },
  dispose(){scene.remove(root);scene.environment=null;environment.dispose();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}
 };
}
