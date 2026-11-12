export type Mode = 'stars' | 'bars' | 'edges';

function star(ctx:CanvasRenderingContext2D, x:number, y:number, fraction:number, color:string) {
 const path = new Path2D();
 for (let i=0;i<10;i++) {
  const angle=i*Math.PI/5-Math.PI/2, radius=i%2?18:41;
  const px=x+radius*Math.cos(angle), py=y+radius*Math.sin(angle);
  if(i===0) path.moveTo(px,py); else path.lineTo(px,py);
 }
 path.closePath();
 ctx.save(); ctx.fillStyle='#e7eaf0'; ctx.fill(path);
 ctx.clip(path); ctx.fillStyle=color;
 ctx.fillRect(x-40,y-43,80*fraction,86); ctx.restore();
 ctx.strokeStyle='#536376';ctx.lineWidth=3;ctx.stroke(path);
}

export function paintRatings(ctx:CanvasRenderingContext2D,mode:Mode,truth:number,pred:number,held:boolean,evaluated:boolean){
 const muted=evaluated&&!held, hidden=held&&!evaluated;
 ctx.clearRect(0,0,512,512);ctx.textAlign='center';
 [truth,pred].forEach((v,j)=>{
  if(j===0&&hidden)return;
  const color=muted?(j?'#8d969e':'#afb6be'):j?(held?'#8241bf':'#eeab17'):'#1874ca';
  const label=j?'Guess':'Rated', value=j?v.toFixed(2):String(Math.round(v));
  ctx.fillStyle=color;
  if(mode==='stars'){
   for(let i=0;i<5;i++)star(ctx,64+i*96,j?412:82,Math.max(0,Math.min(1,v-i)),color);
  }else if(mode==='bars'){
   const left=j?285:115;
   ctx.fillStyle='#edf0f2';ctx.fillRect(left,65,94,330);
   ctx.fillStyle=color;ctx.fillRect(left,395-v*66,94,v*66);
   ctx.strokeStyle='#6a7481';ctx.lineWidth=2;for(let n=0;n<=5;n++){ctx.beginPath();ctx.moveTo(left,395-n*66);ctx.lineTo(left+94,395-n*66);ctx.stroke();}
  }else{
   const depth=v/5*252;ctx.fillRect(0,j?512-depth:0,512,depth);
  }
  const x=mode==='bars'?(j?332:162):256;
  const y=mode==='bars'?446:mode==='stars'?(j?355:198):(j?473:60);
  ctx.font='bold 39px Arial';ctx.lineWidth=6;ctx.strokeStyle='#ffffffd9';ctx.strokeText(label+' '+value,x,y);ctx.fillStyle='#243144';ctx.fillText(label+' '+value,x,y);
 });
}
