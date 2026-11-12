import {createServer} from 'node:http';import {createServer as createViteServer} from 'vite';
import {api} from '../worker/api.mjs';import {localDB} from './local-db.mjs';
const DB=localDB(),vite=await createViteServer({server:{middlewareMode:true},appType:'spa'});
createServer(async(req,res)=>{
 if(!req.url.startsWith('/api/'))return vite.middlewares(req,res);
 try{const chunks=[];for await(const c of req)chunks.push(c);const data=Buffer.concat(chunks);const request=new Request('http://127.0.0.1:5174'+req.url,{method:req.method,headers:req.headers,...(data.length?{body:data}:{}),duplex:'half'});
 const response=await api(request,{DB});res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));}catch(e){console.error(e);res.writeHead(500);res.end('Local server error');}
}).listen(5174,'0.0.0.0',()=>console.log('GITG2 local preview: http://127.0.0.1:5174/'));
