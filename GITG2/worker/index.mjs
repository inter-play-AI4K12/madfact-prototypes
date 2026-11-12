import {api} from './api.mjs';
const contentTypes={html:'text/html;charset=utf-8',js:'text/javascript;charset=utf-8',css:'text/css;charset=utf-8',svg:'image/svg+xml',png:'image/png',ico:'image/x-icon'};
export default {async fetch(request,env){
 const url=new URL(request.url);if(url.pathname.startsWith('/api/'))return api(request,env);
 const key=url.pathname==='/'?'/index.html':url.pathname;
 const content=STATIC_FILES[key]||(key.startsWith('/assets/')?null:STATIC_FILES['/index.html']);
 if(!content)return new Response('Not found',{status:404});
 const type=contentTypes[(key in STATIC_FILES?key:'index.html').split('.').pop()]||'application/octet-stream';
 const headers={'content-type':type,'x-content-type-options':'nosniff','referrer-policy':'same-origin','cache-control':key.startsWith('/assets/')?'public,max-age=31536000,immutable':'no-cache'};
 return new Response(request.method==='HEAD'?null:Uint8Array.from(atob(content),c=>c.charCodeAt(0)),{headers});
}};
