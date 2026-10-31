const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const data=JSON.parse(fs.readFileSync(path.join(__dirname,'dist/data/course.json'),'utf8'));
const base=process.env.DMV_QA_URL||'http://127.0.0.1:4173',key='virginia-driving-v1';
(async()=>{const browser=await chromium.launch({headless:true,channel:'chrome'});try{
 const ctx=await browser.newContext({viewport:{width:1440,height:1000}}),page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const saved=()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
 async function answer(slot,ids,oneWrong=false){const root=page.locator(`[data-quiz-slot="${slot}"]`);for(const [i,id]of ids.entries()){const q=data.questions.find(q=>q.id===id),choice=oneWrong&&i===0?q.answers.find(a=>a.value!==q.correct).value:q.correct;await root.locator(`input[data-answer="${id}"][value="${choice}"]`).check();}}
 await page.goto(base+'/lessons/L01/');await page.locator('#lesson-practice .question').first().waitFor();
 assert.equal(await page.locator('#lesson-review .question').count(),0);
 let s=await saved(),ids=s.lessonSessions['L01:practice'].active.ids;assert.equal(ids.length,5);
 assert.ok(await page.locator('#lesson-practice').evaluate(el=>el.compareDocumentPosition(document.querySelector('#section-0'))&Node.DOCUMENT_POSITION_PRECEDING));
 await answer('L01:practice',ids.slice(0,2));await page.reload();await page.locator('#lesson-practice').getByText('Answered 2/5 questions').waitFor();
 const token=(await saved()).lessonSessions['L01:practice'].active.token;
 await page.goto(base+'/lessons/L03/');await page.locator('#lesson-practice .question').first().waitFor();
 await page.goto(base+'/lessons/L01/');await page.locator('#lesson-practice').getByText('Answered 2/5 questions').waitFor();assert.equal((await saved()).lessonSessions['L01:practice'].active.token,token);
 await answer('L01:practice',ids,true);await page.locator('#lesson-practice [data-grade]').click();await page.locator('#lesson-practice summary').filter({hasText:'Results saved · 4/5'}).waitFor();
 assert.equal(new URL(page.url()).pathname,'/lessons/L01/');assert.equal((await saved()).history.length,5);
 await page.locator('#lesson-practice .lesson-results>summary').click();for(const el of await page.locator('#lesson-practice .quiz-shell').all())assert.ok(!/[\u00c0-\u1ef9]/u.test(await el.textContent()));
 await page.locator('[data-lesson-size]').selectOption('10');await page.getByRole('button',{name:'Start next practice set'}).click();s=await saved();assert.equal(s.lessonSessions['L01:practice'].active.ids.length,10);
 ids=s.lessonSessions['L01:practice'].active.ids;await answer('L01:practice',ids.slice(0,1));
 // A standalone batch can coexist with both inline lesson batches.
 await page.goto(base+'/practice/');await page.getByRole('button',{name:'Bắt đầu gói câu hỏi'}).click();s=await saved();const globalToken=s.active.token,globalId=s.active.ids[0],q=data.questions.find(q=>q.id===globalId);await page.locator(`input[data-answer="${globalId}"][value="${q.correct}"]`).check();
 await page.goto(base+'/lessons/L02/');await page.locator('#lesson-review .question').first().waitFor();s=await saved();const review=s.lessonSessions['L02:review'].active;
 assert.equal(review.ids.length,5);assert.ok(review.ids.every(id=>data.questions.find(q=>q.id===id).lesson<'L02'));
 assert.ok(await page.locator('#lesson-review').evaluate(el=>el.compareDocumentPosition(document.querySelector('#section-0'))&Node.DOCUMENT_POSITION_FOLLOWING));
 await page.locator('#section-0 .full-vietnamese').waitFor();assert.ok(await page.locator('#lesson-practice .question').count()>0);
 await answer('L02:review',review.ids.slice(0,2));await page.reload();await page.locator('#lesson-review').getByText('Answered 2/5 questions').waitFor();
 await answer('L02:review',review.ids);await page.locator('#lesson-review [data-grade]').click();await page.locator('#lesson-review summary').filter({hasText:'Results saved · 5/5'}).waitFor();
 assert.equal(new URL(page.url()).pathname,'/lessons/L02/');s=await saved();assert.ok(s.reviewed.L02);assert.equal(s.active.token,globalToken);assert.equal(Object.keys(s.active.choices).length,1);assert.equal(Object.keys(s.lessonSessions['L01:practice'].active.choices).length,1);
 await page.getByRole('link',{name:'Continue to the lesson ↓',exact:true}).click();assert.equal(new URL(page.url()).pathname,'/lessons/L02/');
 const practice=s.lessonSessions['L02:practice'].active;await answer('L02:practice',practice.ids);await page.locator('#lesson-practice [data-grade]').click();await page.locator('#lesson-practice summary').filter({hasText:'Results saved'}).waitFor();
 await page.reload();await page.locator('#lesson-practice summary').filter({hasText:'Results saved'}).waitFor();assert.equal((await saved()).history.length,10+practice.ids.length);
 await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:path.join(__dirname,'../../work/dmv-inline-lesson-mobile.png'),fullPage:true});
 assert.deepEqual(errors,[]);console.log('PASS inline lesson quizzes:5/10 sets;old review above theory;practice below;English-only feedback;partial reload/navigation;independent standalone and lesson sessions;single scoring;mobile. Fake profile only.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
