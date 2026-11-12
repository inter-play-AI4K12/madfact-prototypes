import {build} from 'esbuild';
import {readFileSync,readdirSync,statSync,mkdirSync,writeFileSync} from 'node:fs';
import {join,relative} from 'node:path';
const files={};
function visit(dir){for(const name of readdirSync(dir)){const path=join(dir,name);if(statSync(path).isDirectory())visit(path);else files['/'+relative('dist/client',path).replaceAll('\\','/')]=readFileSync(path).toString('base64');}}
visit('dist/client');mkdirSync('dist/server',{recursive:true});
const result=await build({entryPoints:['worker/index.mjs'],bundle:true,format:'esm',platform:'browser',target:'es2022',write:false});
writeFileSync('dist/server/index.js','const STATIC_FILES='+JSON.stringify(files)+';\n'+result.outputFiles[0].text);
mkdirSync('dist/.openai',{recursive:true});writeFileSync('dist/.openai/hosting.json',readFileSync('.openai/hosting.json'));
