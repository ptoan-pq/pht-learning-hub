import {cpSync,mkdirSync,readFileSync,readdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const output=process.argv[2];
if(!output||!path.isAbsolute(output))throw Error('Pass a new absolute output directory.');
const base=process.argv[3]||'/pht-learning-hub';
assert.match(base,/^\/[a-z0-9-]+$/,'Use a single repository path prefix.');
mkdirSync(output,{recursive:false});
cpSync('dist',output,{recursive:true});
function visit(dir){for(const entry of readdirSync(dir,{withFileTypes:true})){
 const file=path.join(dir,entry.name);
 if(entry.isDirectory()){visit(file);continue;}
 if(!/\.(html|mjs|css)$/.test(file))continue;
 let text=readFileSync(file,'utf8');
 text=text.replace(/(href|src)="\/(?!\/)/g,`$1="${base}/`);
 if(entry.name==='app.mjs'){
  text=text.replace("from '/core.mjs'",`from '${base}/core.mjs'`);
  text=text.replace("fetch('/data/course.json')",`fetch('${base}/data/course.json')`);
  text=text.replace('location.pathname.replace',`location.pathname.slice('${base}'.length).replace`);
  text=text.replace("history.pushState({},'',path)",`history.pushState({},'',path.startsWith('${base}/')?path:'${base}'+path)`);
  text=text.replace("path.startsWith(new URL(a.href).pathname.replace",`path.startsWith(new URL(a.href).pathname.slice('${base}'.length).replace`);
  text=text.replace(".src=`/assets/",`.src=\`${base}/assets/`);
  text=text.replace('href="${state.active?',`href="${base}\${state.active?`);
  text=text.replace('href="${a.mode===',`href="${base}\${a.mode===`);
  assert.ok(text.includes(`fetch('${base}/data/course.json')`));
 }
 writeFileSync(file,text);
}}
visit(output);
writeFileSync(path.join(output,'.nojekyll'),'');
console.log('Prepared static-only GitHub Pages export:',output);
