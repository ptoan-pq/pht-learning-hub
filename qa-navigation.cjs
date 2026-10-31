// Exercise the real delegated click handler at its published GitHub Pages path.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const {pathToFileURL}=require('node:url');

(async()=>{
  const directory=path.resolve(process.argv[2]||'dist');
  const appUrl=new URL(process.argv[3]||'https://ptoan-pq.github.io/pht-learning-hub/app.mjs');
  const root=new URL('./',appUrl);
  const location=new URL(root);
  const events={},pushed=[],nodes=new Map();
  function node(){return {innerHTML:'',attributes:{},classList:{toggle(){}},
    focus(){},addEventListener(){},setAttribute(k,v){this.attributes[k]=v;},removeAttribute(k){delete this.attributes[k];}};}
  function link(url,attributes={}){return Object.assign(new URL(url,root),node(),{
    target:attributes.target||'',hasAttribute:k=>Object.hasOwn(attributes,k)});}
  const nikaya=link('https://ptoan-pq.github.io/thu-vien-nikaya/');
  const navLinks=[link(root),nikaya];
  const document={
    querySelector(selector){if(!nodes.has(selector))nodes.set(selector,node());return nodes.get(selector);},
    querySelectorAll(){return navLinks;},
    addEventListener(type,fn){events[type]=fn;}
  };
  const core=await import(pathToFileURL(path.join(directory,'core.mjs')));
  const data=JSON.parse(fs.readFileSync(path.join(directory,'data/course.json')));
  const source=fs.readFileSync(path.join(directory,'app.mjs'),'utf8')
    .replace(/^import .*;\n/,'').replaceAll('import.meta.url',JSON.stringify(appUrl.href));
  await vm.runInNewContext('(async()=>{'+source+'\n})()',{
    ...core,URL,console,setTimeout,clearTimeout,structuredClone,location,document,
    history:{pushState(_state,_title,url){pushed.push(url);location.href=new URL(url,location).href;}},
    localStorage:{getItem(){return null;}},
    window:{addEventListener(){},scrollTo(){}},
    fetch:async()=>({ok:true,json:async()=>data})
  });
  function click(a,extra={}){
    let prevented=false;
    events.click({button:0,target:{closest:s=>s==='a'?a:null},
      preventDefault(){prevented=true;},...extra});
    return prevented;
  }
  const main=nodes.get('#main');
  assert.ok(main.innerHTML.includes('CHỌN PHÒNG HỌC'),'Hub must boot before reproducing the click');
  assert.equal(click(nikaya),false,'Nikāya click must leave Hub routing; current result: '+(main.innerHTML.includes('Trang này chưa có.')?'Trang này chưa có.':'intercepted'));
  assert.equal(pushed.length,0,'Do not rewrite the destination under the Hub path');
  assert.ok(!main.innerHTML.includes('Trang này chưa có.'));
  assert.notEqual(nikaya.attributes['aria-current'],'page','Other repositories are not active Hub sections');
  assert.equal(click(link('https://ptoan-pq.github.io/song-my-english-campus/')),false);
  assert.equal(click(link('https://ptoan-pq.github.io/pht-learning-hub-other/')),false);
  assert.equal(click(link('lessons/'),{ctrlKey:true}),false);
  assert.equal(click(link('music/',{'data-document':''})),false);
  assert.equal(click(link('lessons/')),true,'Keep in-app navigation for Hub lessons');
  assert.ok(main.innerHTML.includes('LỘ TRÌNH 16 BÀI'));
  assert.notEqual(navLinks[0].attributes['aria-current'],'page');
  assert.equal(location.pathname,root.pathname+'lessons/');
  assert.equal(click(link(root)),true);
  assert.ok(main.innerHTML.includes('CHỌN PHÒNG HỌC'));
  assert.equal(navLinks[0].attributes['aria-current'],'page');
  console.log('PASS: Nikāya and other sites use native navigation; Hub lessons/home still work.');
})().catch(error=>{console.error(error);process.exitCode=1;});
