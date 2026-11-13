import {initialState,applyCommand,publicState,metrics,normalizeLogDetails} from './state.mjs';
const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
const random=(n)=>Array.from(crypto.getRandomValues(new Uint8Array(n)),v=>v.toString(16).padStart(2,'0')).join('');
const snapshot=row=>({code:row.code,revision:row.revision,updatedAt:row.updated_at,state:publicState(JSON.parse(row.state))});
async function body(req){if(Number(req.headers.get('content-length'))>16000)throw Object.assign(new Error('Request too large.'),{status:413});const text=await req.text();if(text.length>16000)throw Object.assign(new Error('Request too large.'),{status:413});return JSON.parse(text);}
export async function api(request,env){
 try{
  const url=new URL(request.url),parts=url.pathname.split('/').filter(Boolean),db=env.DB;
  if(!db)return json({error:'Shared storage is not connected.'},503);
  if(url.pathname==='/api/health')return json({ok:true});
  if(url.pathname==='/api/rooms'&&request.method==='POST'){
   const input=await body(request);const code=typeof input.name==='string'&&input.name.trim()?input.name.trim().toUpperCase():random(3).toUpperCase();
   if(!/^[A-Z0-9_-]{3,32}$/.test(code))return json({error:'Use a session name with 3–32 letters, numbers, hyphens, or underscores.'},400);
   const existing=await db.prepare('SELECT * FROM rooms WHERE code=?').bind(code).first();if(existing)return json(snapshot(existing));
   const state=initialState();state.selected=state.lab.hidden[0];const now=new Date().toISOString();
   await db.batch([
    db.prepare('INSERT INTO rooms (code,key_hash,controller_key,state,revision,created_at,updated_at,last_command) VALUES (?,?,?,?,0,?,?,?)').bind(code,'','',JSON.stringify(state),now,now,'created'),
    db.prepare('INSERT INTO events (room,command_id,revision,time,event,details) VALUES (?,?,0,?,?,?)').bind(code,'created',now,'room_created',JSON.stringify({attempt:1,participant:state.participant,row_order:state.lab.rowOrder,column_order:state.lab.colOrder,rows:state.lab.rows,cols:state.lab.cols,...metrics(state)})),
   ]);
   return json(snapshot({code,revision:0,updated_at:now,state:JSON.stringify(state)}),201);
  }
  const code=(parts[2]||'').toUpperCase();if(parts[0]!=='api'||parts[1]!=='rooms'||!/^[A-Z0-9_-]{3,32}$/.test(code))return json({error:'Room not found.'},404);
  const row=await db.prepare('SELECT * FROM rooms WHERE code=?').bind(code).first();if(!row)return json({error:'Session not found. Check the name shown on the monitor.'},404);
  if(parts[3]==='pair'&&request.method==='POST')return json(snapshot(row));
  if(parts.length===3&&request.method==='GET')return json(snapshot(row));
  if(parts[3]==='logs'&&request.method==='GET'){
   const {results}=await db.prepare('SELECT id,command_id,revision,time,event,details FROM events WHERE room=? ORDER BY id').bind(code).all();
   const quote=v=>'"'+String(v??'').replaceAll('"','""')+'"';
   const csv=[['room','sequence','command_id','revision','timestamp','event','details_json'],...results.map(e=>[code,e.id,e.command_id,e.revision,e.time,e.event,JSON.stringify(normalizeLogDetails(JSON.parse(e.details)))])].map(a=>a.map(quote).join(',')).join('\r\n');
   return new Response(csv,{headers:{'content-type':'text/csv;charset=utf-8','content-disposition':`attachment; filename="GITG2-${code}.csv"`,'cache-control':'no-store'}});
  }
  if(parts[3]==='commands'&&request.method==='POST'){
   const input=await body(request);if(typeof input.id!=='string'||!/^[-a-zA-Z0-9]{8,80}$/.test(input.id))return json({error:'Invalid command ID.'},400);
   const duplicate=await db.prepare('SELECT id FROM events WHERE room=? AND command_id=?').bind(code,input.id).first();if(duplicate)return json(snapshot(row));
   if(input.revision!==row.revision)return json({...snapshot(row),error:'State changed. Retrying your action.'},409);
   const current=JSON.parse(row.state),next=applyCommand(current,input.command),revision=row.revision+1,now=new Date().toISOString(),serialized=JSON.stringify(next);
   const details=JSON.stringify({attempt:next.attempt,participant:next.participant,command:input.command,rows:next.lab.rows,cols:next.lab.cols,row_order:next.lab.rowOrder,column_order:next.lab.colOrder,...metrics(next),...(next.evaluated?{revealed:next.lab.hidden.map(i=>({cell:i,rating:next.lab.truths[i]}))}:{})});
   const results=await db.batch([
    db.prepare('UPDATE rooms SET state=?,revision=?,updated_at=?,last_command=? WHERE code=? AND revision=?').bind(serialized,revision,now,input.id,code,row.revision),
    db.prepare('INSERT INTO events (room,command_id,revision,time,event,details) SELECT code,?,?,?, ?,? FROM rooms WHERE code=? AND last_command=?').bind(input.id,revision,now,input.command.type,details,code,input.id),
   ]);
   if(!results[0].meta.changes){const fresh=await db.prepare('SELECT * FROM rooms WHERE code=?').bind(code).first();return json({...snapshot(fresh),error:'State changed. Retrying your action.'},409);}
   return json(snapshot({code,revision,updated_at:now,state:serialized}));
  }
  return json({error:'Not found.'},404);
 }catch(error){if(error instanceof SyntaxError)return json({error:'Invalid request.'},400);if(error.status)return json({error:error.message},error.status);console.error('GITG2 API failure',error);return json({error:'Sync is temporarily unavailable. Your controller will reconnect.'},500);}
}
