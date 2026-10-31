const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const course=JSON.parse(fs.readFileSync(path.join(__dirname,'dist/data/course.json'),'utf8'));
const base=process.env.DMV_QA_URL||'http://127.0.0.1:4173',key='virginia-driving-v1';
(async()=>{const browser=await chromium.launch({headless:true,channel:'chrome'});try{
 const context=await browser.newContext({viewport:{width:1440,height:1050}}),page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 let sectionCount=0,toggleCount=0;
 for(const lesson of course.lessons){
  await page.goto(base+'/lessons/'+lesson.id+'/');await page.getByRole('heading',{name:lesson.title,exact:true,level:1}).waitFor();
  const all=page.locator('.english-toggle'),expected=lesson.sections.length+lesson.terms.length+lesson.pitfalls.length;
  assert.equal(await all.count(),expected);assert.equal(await page.locator('.english-toggle[open]').count(),0);
  assert.equal(await page.locator('iframe,embed,object,.source-text').count(),0);
  for(let i=0;i<lesson.sections.length;i++){
   const section=page.locator('#section-'+i),toggle=section.locator('.english-toggle'),summary=toggle.locator('summary');
   const before=await page.evaluate(k=>localStorage.getItem(k),key),url=page.url();
   assert.ok(await section.getByText(lesson.sections[i].fullVi.blocks[0].paragraphs[0],{exact:true}).isVisible());
   assert.equal(await section.locator('.vietnamese-block').count(),lesson.sections[i].english.blocks.length);
   const renderedVi=await section.locator('.vietnamese-block').evaluateAll(nodes=>nodes.map(n=>Array.from(n.querySelectorAll('p')).map(p=>p.textContent)));
   assert.deepEqual(renderedVi,lesson.sections[i].fullVi.blocks.map(b=>b.paragraphs));
   assert.equal(await section.locator('.quick-summary').getAttribute('open'),null);
   if(lesson.sections[i].fullVi.noteVi)assert.ok(await section.locator('.source-warning').isVisible());
   await summary.click();assert.ok(await toggle.getAttribute('open')!==null);assert.ok(await toggle.locator('.english-content').isVisible());
   assert.equal(await toggle.locator('.english-content').getAttribute('lang'),'en');assert.equal(await toggle.locator('.english-block').count(),lesson.sections[i].english.blocks.length);
   assert.equal(await toggle.locator('.english-content img, .english-content iframe, .english-content pre').count(),0);
   if(lesson.sections[i].english.noteEn)assert.ok(await toggle.locator('.english-warning').isVisible());
   assert.equal(page.url(),url);assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),before);
   await summary.click();assert.equal(await toggle.getAttribute('open'),null);sectionCount++;
  }
  const term=page.locator('.term .english-toggle').first();await term.locator('summary').click();assert.ok(await term.getByText(lesson.terms[0].exampleEn,{exact:true}).isVisible());
  const pitfall=page.locator('.pitfall .english-toggle').first();await pitfall.locator('summary').click();assert.ok((await pitfall.textContent()).includes(lesson.pitfalls[0].rightEn));
  toggleCount+=expected;
 }
 assert.equal(sectionCount,78);assert.equal(toggleCount,169);
 await page.goto(base+'/lessons/L01/');const red=page.locator('#section-2 .english-toggle');await red.locator('summary').focus();await page.keyboard.press('Space');assert.ok(await red.getAttribute('open')!==null);assert.ok((await red.textContent()).includes('Red arrow'));
 await page.locator('#section-2').screenshot({path:path.join(__dirname,'../../work/dmv-english-desktop.png')});
 await page.locator('[data-action=read]').first().click();await page.locator('#lesson-note').fill('Ghi chú giả để kiểm tra bảo toàn tiến độ.');
 const saved=await page.evaluate(k=>localStorage.getItem(k),key);await red.locator('summary').click();await red.locator('summary').click();assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),saved);await page.reload();await page.locator('[data-action=read][aria-pressed=true]').waitFor();assert.equal(await page.locator('#lesson-note').inputValue(),'Ghi chú giả để kiểm tra bảo toàn tiến độ.');
 const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true}),phone=await mobile.newPage();await phone.goto(base+'/lessons/L01/');await phone.getByRole('heading',{name:course.lessons[0].title,exact:true,level:1}).waitFor();await phone.locator('#section-2 .english-toggle summary').click();assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await phone.locator('#section-2').screenshot({path:path.join(__dirname,'../../work/dmv-english-mobile.png')});
 assert.deepEqual(errors,[]);console.log('PASS bilingual UI:180 full Vietnamese blocks rendered across78 sections/16lessons; summaries separate and collapsed;169English disclosures; exact source text/noPDF; warnings in both languages; keyboard;390px mobile; reading/notes preserved; no page errors.');
}finally{await browser.close();}})().catch(error=>{console.error(error);process.exit(1);});
