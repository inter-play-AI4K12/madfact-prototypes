import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {factorCells,rmse} from './model.mjs';
export type Lab={rows:number[][];cols:number[][];truths:number[];hidden:number[];rowOrder:number[];colOrder:number[]};
export type SharedState={lab:Lab;mode:'stars'|'bars'|'edges';selected:number;evaluated:boolean;running:boolean;step:number;attempt:number;participant:string;active:{kind:'rows'|'cols';index:number;factor?:number}|null;metrics:{known_rmse:number;predictions:number[];recommended:number|null}};
export type Snapshot={code:string;revision:number;updatedAt:string;state:SharedState};
export type Command={type:string;[key:string]:unknown};
type Queued={id:string;command:Command};
export async function requestJSON(path:string,options:RequestInit={}){
 const response=await fetch(path,{...options,headers:{'content-type':'application/json',...options.headers},signal:AbortSignal.timeout(6000)}),data=await response.json();
 if(!response.ok)throw Object.assign(new Error(data.error||'Connection failed.'),{status:response.status,data});return data;
}
export function useRoom(code:string,role:'display'|'controller'){
 const [snapshot,setSnapshot]=useState<Snapshot|null>(null),[status,setStatus]=useState('Connecting'),[error,setError]=useState(''),[queueTick,setQueueTick]=useState(0);
 const current=useRef<Snapshot|null>(null),flushing=useRef(false),mounted=useRef(true),lastSuccess=useRef(0);
 const storage='gitg2-pending:'+code+':'+role;
 const queue=useRef<Queued[]>([]),loaded=useRef(false);
 if(!loaded.current){loaded.current=true;try{queue.current=JSON.parse(localStorage.getItem(storage)||'[]');}catch{queue.current=[];}}
 const persist=()=>{try{localStorage.setItem(storage,JSON.stringify(queue.current));}catch{setError('The browser could not save the offline action queue. Keep this page open until synced.');}setQueueTick(t=>t+1);};
 const accept=useCallback((next:Snapshot)=>{if(!mounted.current)return;if(!current.current||next.revision>=current.current.revision){current.current=next;setSnapshot(next);}lastSuccess.current=Date.now();setStatus('Live');},[]);
 const flush=useCallback(async()=>{
  if(flushing.current||!queue.current.length||!mounted.current)return;
  flushing.current=true;
  try{while(queue.current.length&&mounted.current){
   const item=queue.current[0];
   try{
    if(!current.current)accept(await requestJSON('/api/rooms/'+code));
    const data=await requestJSON('/api/rooms/'+code+'/commands',{method:'POST',body:JSON.stringify({...item,revision:current.current!.revision})});
    accept(data);queue.current.shift();persist();setError('');
   }catch(e){const err=e as Error&{status?:number;data?:Snapshot};if(err.status===409&&err.data?.state){accept(err.data);continue;}
    if(err.status&&err.status<500){queue.current.shift();persist();setError(err.message);if(err.status===401){setStatus('Pair again');break;}continue;}
    setStatus('Reconnecting');setError('Connection lost. Slider changes are queued and will sync when the connection returns.');break;
   }
  }}finally{flushing.current=false;}
 },[code,role,accept]);
 const syncNow=useCallback(async()=>{
  try{const next=await requestJSON('/api/rooms/'+code);accept(next);if(!queue.current.length)setError('');void flush();return next as Snapshot;}catch(e){setStatus('Reconnecting');setError((e as Error).message);return null;}
 },[code,accept,flush]);
 useEffect(()=>{mounted.current=true;let stopped=false,timer:ReturnType<typeof setTimeout>;
  const loop=async()=>{if(stopped)return;await syncNow();if(!stopped)timer=setTimeout(loop,role==='display'?250:600);};
  void loop();
  const online=()=>{void syncNow();};window.addEventListener('online',online);
  return()=>{stopped=true;mounted.current=false;clearTimeout(timer);window.removeEventListener('online',online);};
 },[code,role,syncNow,accept,flush]);
 const send=useCallback((command:Command)=>{

  const next={id:crypto.randomUUID(),command};
  // A held slider may generate many inputs: keep its latest unsent value, preserving action order.
  const last=queue.current.length-1,previous=queue.current[last];
  if(command.type==='slider'&&last>=(flushing.current?1:0)&&previous?.command.type==='slider'&&['kind','index','factor'].every(k=>previous.command[k]===command[k]))queue.current[last]=next;else queue.current.push(next);
  persist();void flush();
 },[role,flush]);
 useEffect(()=>{if(role!=='display')return;const timer=setInterval(()=>{if(current.current?.state.running&&!queue.current.length&&status==='Live')send({type:'tick'});},300);return()=>clearInterval(timer);},[role,status,send]);
 const state=useMemo(()=>{
  if(!snapshot)return null;const next=structuredClone(snapshot.state);
  for(const {command:c}of queue.current){if(c.type==='slider'&&!next.evaluated){next.lab[c.kind as 'rows'|'cols'][c.index as number][c.factor as number]=c.value as number;next.active={kind:c.kind as 'rows'|'cols',index:c.index as number,factor:c.factor as number};}if(c.type==='release')next.active=null;}
  const cells=factorCells(next.lab.truths,next.lab.rows,next.lab.cols);next.metrics={...next.metrics,known_rmse:rmse(cells.filter((_:unknown,i:number)=>!next.lab.hidden.includes(i))),predictions:cells.map((c:{prediction:number})=>c.prediction)};
  return next;
 },[snapshot,queueTick]);
 return {snapshot,state,status,error,pending:queue.current.length,send,syncNow,lastSuccess:lastSuccess.current};
}
