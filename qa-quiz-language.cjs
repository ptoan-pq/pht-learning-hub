const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const data=JSON.parse(fs.readFileSync(path.join(__dirname,'dist/data/course.json'),'utf8'));
const base=process.env.DMV_QA_URL||'http://127.0.0.1:4173',key='virginia-driving-v1';
(async()=>{const browser=await chromium.launch({headless:true,channel:'chrome'});try{
 const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/practice/');await page.locator('#topic').waitFor();
 async function fixture(mode,ids){await page.evaluate(async({key,mode,ids})=>{const {fresh}=await import('/core.mjs');const s=fresh();s.active={token:'language-qa',mode,ids,choices:{},created:new Date().toISOString()};localStorage.setItem(key,JSON.stringify(s));},{key,mode,ids});await page.goto(base+(mode==='deep'?'/deep/':'/practice/'));await page.locator('.question').first().waitFor();}
 async function englishOnly(){assert.equal(await page.locator('.question .vi,.question .translation').count(),0);assert.equal(await page.locator('.quiz-shell').getAttribute('lang'),'en');const text=await page.locator('.quiz-shell').textContent();assert.ok(!/[\u00c0-\u1ef9]/u.test(text),'Unexpected Vietnamese Q&A text: '+text.slice(0,350));}
 const ids=['1001','1002','1006','1008','1007'];await fixture('official',ids);await englishOnly();
 for(const id of ids.slice(0,2)){const q=data.questions.find(x=>x.id===id);await page.locator(`input[data-answer="${id}"][value="${q.correct}"]`).check();}
 await page.reload();await page.getByText('Answered 2/5 questions').waitFor();await englishOnly();assert.equal(await page.locator('.feedback').count(),0);
 for(const [i,id]of ids.entries()){const q=data.questions.find(x=>x.id===id),choice=i===4?q.answers.find(x=>x.value!==q.correct).value:q.correct;await page.locator(`input[data-answer="${id}"][value="${choice}"]`).check();}
 await page.locator('#grade').click();await page.getByText('4/5',{exact:true}).waitFor();await englishOnly();await page.getByRole('heading',{name:'Mistakes to review'}).waitFor();
 for(const [i,id]of ids.entries()){const card=page.locator('.question').nth(i),q=data.questions.find(x=>x.id===id);assert.equal(await card.getAttribute('lang'),'en');assert.ok((await card.textContent()).includes(q.question));assert.ok((await card.locator('.feedback').textContent()).includes(q.feedback));}
 const source=page.locator('.question').nth(2).getByText('Read the supporting DMV source',{exact:true});await source.click();assert.ok((await page.locator('.question').nth(2).textContent()).includes('Right on Red Arrow After Stop'));
 await page.screenshot({path:path.join(__dirname,'../../work/dmv-english-only-results.png'),fullPage:true});
 const deep=data.deep.filter(q=>q.lesson==='L01');await fixture('deep',deep.map(q=>q.id));await englishOnly();
 for(const q of deep){if(q.type==='short')await page.locator(`textarea[data-answer="${q.id}"]`).fill('A circular red signal and a red arrow have different rules. Check posted exceptions, stop, look and yield.');else if(q.type==='multi')for(const n of q.correct)await page.locator(`input[data-answer="${q.id}"][value="${n}"]`).check();else await page.locator(`input[data-answer="${q.id}"][value="${q.correct}"]`).check();}
 await page.locator('#grade').click();await page.getByText('3/3',{exact:true}).waitFor();await englishOnly();await page.getByText('Self-assessment checklist:',{exact:true}).waitFor();assert.equal(await page.locator('.rubric li').count(),3);
 await page.goto(base+'/lessons/L01/');await page.locator('#section-2 .full-vietnamese').waitFor();assert.ok(/[\u00c0-\u1ef9]/u.test(await page.locator('#section-2 .full-vietnamese').textContent()));
 await page.setViewportSize({width:390,height:844});await fixture('official',ids);await englishOnly();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.locator('.question').first().screenshot({path:path.join(__dirname,'../../work/dmv-english-only-mobile.png')});
 assert.deepEqual(errors,[]);console.log('PASS Q&A English-only:official questions/options/feedback/source context;wrong-answer review;deep prompts/options/model answers/rubrics;partial resume and grading preserved;Vietnamese theory intact;390px layout;no page errors. Fake profile only.');
}finally{await browser.close();}})().catch(error=>{console.error(error);process.exit(1);});
