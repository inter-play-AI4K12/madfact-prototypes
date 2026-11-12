type Entry = {run:string; participant_id:string; time:string; elapsed_ms:number; seq:number; event:string; details:Record<string,unknown>};
type Run = {id:string; participant_id:string; started:string};
const dbName='madfact-gitg-v1';
let database:Promise<IDBDatabase>|undefined;
function open(){
 if(!database)database=new Promise((resolve,reject)=>{
  const request=indexedDB.open(dbName,1);
  request.onupgradeneeded=()=>{
   request.result.createObjectStore('events',{keyPath:['run','seq']});
   request.result.createObjectStore('runs',{keyPath:'id'});
   request.result.createObjectStore('counter');
  };
  request.onsuccess=()=>resolve(request.result); request.onerror=()=>reject(request.error);
 });
 return database;
}
function done(tx:IDBTransaction){return new Promise<void>((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error);tx.onerror=()=>reject(tx.error);});}
function request<T>(r:IDBRequest<T>){return new Promise<T>((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}

class Session {
 events:Entry[]=[];
 persistent=true;
 constructor(public run:Run,private db?:IDBDatabase){this.persistent=Boolean(db);}
 log(event:string,details:Record<string,unknown>={}){
  const entry:Entry={run:this.run.id,participant_id:this.run.participant_id,time:new Date().toISOString(),elapsed_ms:Math.round(performance.now()),seq:this.events.length+1,event,details};
  this.events.push(entry);
  if(this.db){try{const tx=this.db.transaction('events','readwrite');tx.objectStore('events').put(entry);done(tx).catch(()=>{this.persistent=false;});}catch{this.persistent=false;}}
 }
 rename(id:string){
  const previous=this.run.participant_id;
  if(!id||previous===id)return;
  this.run={...this.run,participant_id:id};
  if(this.db){const tx=this.db.transaction('runs','readwrite');tx.objectStore('runs').put(this.run);done(tx).catch(()=>{this.persistent=false;});}
  this.log('participant_id_changed',{previous,current:id});
 }
 async export(all:boolean){
  let entries=this.events, runs=[this.run];
  if(all&&this.db){
   const tx=this.db.transaction(['events','runs'],'readonly');
   const [saved,storedRuns]=await Promise.all([request<Entry[]>(tx.objectStore('events').getAll()),request<Run[]>(tx.objectStore('runs').getAll())]);
   entries=[...saved.filter(e=>e.run!==this.run.id),...this.events];runs=[...storedRuns.filter(r=>r.id!==this.run.id),this.run];
  }
  const ids=new Map(runs.map(r=>[r.id,r.participant_id]));
  const csv=(v:unknown)=>'"'+String(v??'').replace(/"/g,'""')+'"';
  const rows=[['participant_id','id_at_event','run','sequence','timestamp','elapsed_ms','event','details_json'],...entries.sort((a,b)=>a.time.localeCompare(b.time)||a.seq-b.seq).map(e=>[ids.get(e.run),e.participant_id,e.run,e.seq,e.time,e.elapsed_ms,e.event,JSON.stringify(e.details)])];
  const url=URL.createObjectURL(new Blob([rows.map(row=>row.map(csv).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download='GITG-'+(all?'all-runs':this.run.id)+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);
 }
}
async function start(){
 const run={id:crypto.randomUUID(),participant_id:'',started:new Date().toISOString()};
 try{
  const db=await open(),tx=db.transaction(['runs','counter'],'readwrite'), counter=tx.objectStore('counter');
  const completion=done(tx);
  const r=counter.get('participant');r.onsuccess=()=>{const n=(r.result??0)+1;counter.put(n,'participant');run.participant_id=String(n);tx.objectStore('runs').put(run);};await completion;
  return new Session(run,db);
 }catch{run.participant_id='temporary-'+run.id.slice(0,6);return new Session(run);}
}
let session:Promise<Session>|undefined;
export const getSession=()=>session??=(start());
export type {Session};
