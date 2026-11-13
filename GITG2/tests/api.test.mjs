import test from 'node:test';import assert from 'node:assert/strict';
import {api} from '../worker/api.mjs';import {localDB} from '../scripts/local-db.mjs';
function setup(){const DB=localDB(':memory:');return {DB,async call(path,method='GET',body){const req=new Request('https://gitg2.test/api'+path,{method,headers:{'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const response=await api(req,{DB});return {status:response.status,data:response.headers.get('content-type')?.includes('text/csv')?await response.text():await response.json()};}};}
const action=(revision,command,id=crypto.randomUUID())=>({revision,command,id});
test('two clients share slider state; retries are idempotent and stale writes are rejected',async()=>{
 const {call,DB}=setup();const {data:room}=await call('/rooms','POST',{});const path='/rooms/'+room.code;
 const command=action(0,{type:'slider',kind:'rows',index:0,factor:0,value:.42});
 const first=await call(path+'/commands','POST',command);assert.equal(first.status,200);assert.equal(first.data.revision,1);
 const monitor=await call(path);assert.equal(monitor.data.state.lab.rows[0][0],.42);assert.equal(monitor.data.key,undefined);
 const duplicate=await call(path+'/commands','POST',command);assert.equal(duplicate.data.revision,1);
 const stale=await call(path+'/commands','POST',action(0,{type:'mode',mode:'bars'}));assert.equal(stale.status,409);assert.equal(stale.data.revision,1);
 assert.equal(DB.sqlite.prepare('SELECT count(*) AS n FROM events WHERE room=?').get(room.code).n,2);
 DB.sqlite.close();
});
test('evaluation reveals the fixed ratings and locks controls; restart re-hides them and preserves log history',async()=>{
 const {call,DB}=setup();const {data:room}=await call('/rooms','POST',{});const p='/rooms/'+room.code;
 assert.deepEqual(room.state.lab.hidden.map(i=>room.state.lab.truths[i]),[0,0]);
 const ev=await call(p+'/commands','POST',action(0,{type:'evaluate'}));assert.deepEqual(ev.data.state.lab.hidden.map(i=>ev.data.state.lab.truths[i]),[3,1]);
 const locked=await call(p+'/commands','POST',action(1,{type:'slider',kind:'cols',index:0,factor:1,value:.8}));assert.equal(locked.status,409);
 const restart=await call(p+'/commands','POST',action(1,{type:'restart'}));assert.equal(restart.data.state.attempt,2);assert.equal(restart.data.state.evaluated,false);assert.deepEqual(restart.data.state.lab.hidden.map(i=>restart.data.state.lab.truths[i]),[0,0]);
 const log=await call(p+'/logs','GET',undefined);assert.match(log.data,/evaluate/);assert.match(log.data,/restart/);assert.match(log.data,/details_json/);
 DB.sqlite.close();
});
test('the same session name reconnects without login; invalid commands do not change it',async()=>{
 const {call,DB}=setup();const {data:room}=await call('/rooms','POST',{name:'FRIDAY-DEMO'});const p='/rooms/'+room.code;
 assert.equal(room.code,'FRIDAY-DEMO');assert.equal((await call(p+'/logs')).status,200);
 const paired=await call(p+'/pair','POST',{});assert.equal(paired.data.code,room.code);
 const same=await call('/rooms','POST',{name:'friday-demo'});assert.equal(same.data.code,room.code);assert.equal(same.data.revision,0);
 const invalid=await call(p+'/commands','POST',action(0,{type:'slider',kind:'rows',index:0,factor:0,value:2}));assert.equal(invalid.status,400);
 assert.equal((await call(p)).data.revision,0);DB.sqlite.close();
});
test('server optimization excludes hidden ratings and improves the shared known-rating error',async()=>{
 const {call,DB}=setup();const {data:room}=await call('/rooms','POST',{});const p='/rooms/'+room.code;let snap=(await call(p+'/commands','POST',action(0,{type:'optimize'}))).data;
 for(let i=0;i<60;i++)snap=(await call(p+'/commands','POST',action(snap.revision,{type:'tick'}))).data;
 assert.equal(snap.state.running,false);assert.equal(snap.state.step,60);assert.ok(snap.state.metrics.known_rmse<.3);const [a,b]=snap.state.lab.hidden.map(i=>snap.state.metrics.predictions[i]);assert.ok(a>b);DB.sqlite.close();
});
test('existing 1–5 sessions and historical exports normalize once to 0–4',async()=>{
 const {call,DB}=setup();const {data:room}=await call('/rooms','POST',{});const p='/rooms/'+room.code;
 const stored=JSON.parse(DB.sqlite.prepare('SELECT state FROM rooms WHERE code=?').get(room.code).state);
 delete stored.ratingScale;stored.lab.truths=stored.lab.truths.map(v=>v+1);
 DB.sqlite.prepare('UPDATE rooms SET state=? WHERE code=?').run(JSON.stringify(stored),room.code);
 const migrated=await call(p);assert.equal(migrated.data.state.ratingScale,'0-4');
 assert.ok(Math.abs(migrated.data.state.metrics.known_rmse-room.state.metrics.known_rmse)<1e-12);
 assert.deepEqual(migrated.data.state.metrics.predictions,room.state.metrics.predictions);
 const evaluated=await call(p+'/commands','POST',action(0,{type:'evaluate'}));
 assert.deepEqual(evaluated.data.state.lab.hidden.map(i=>evaluated.data.state.lab.truths[i]),[3,1]);
 assert.equal(JSON.parse(DB.sqlite.prepare('SELECT state FROM rooms WHERE code=?').get(room.code).state).ratingScale,'0-4');
 const {normalizeLogDetails}=await import('../worker/state.mjs');
 const old={predictions:[1,5,2.09],revealed:[{cell:0,rating:4},{cell:1,rating:2}],known_rmse:1.6};
 const normalized=normalizeLogDetails(old);assert.deepEqual(normalized.predictions,[0,4,1.0899999999999999]);assert.deepEqual(normalized.revealed.map(c=>c.rating),[3,1]);assert.deepEqual(normalizeLogDetails(normalized),normalized);DB.sqlite.close();
});
