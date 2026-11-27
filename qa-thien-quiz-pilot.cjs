const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const output=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'thien-quiz-qa-'));
const {chromium}=require('playwright');
const BANK=JSON.parse(fs.readFileSync(path.join(__dirname,'content/thien-quiz-pilot/questions.json')));
const KEY='thien-vocab-application-pilot-v1';
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});const page=await browser.newPage({viewport:{width:1440,height:1080}});const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 const base=process.argv[2]||process.env.THIEN_QUIZ_URL||'http://127.0.0.1:4188/pht-learning-hub/books/thien-hoc-van-dap/';
 await page.goto(base+'#q001');await page.locator('[data-quiz-start="normal"]').waitFor();assert.equal(await page.locator('#quiz-data').count(),1);
 await page.locator('[data-quiz-start="normal"]').click();await page.locator('.quiz-prompt').waitFor();assert.equal(await page.locator('.quiz-terms').count(),0);
 const currentQ=async()=>{const prompt=await page.locator('.quiz-prompt').textContent();return BANK.questions.find(q=>q.prompt===prompt);};
 let q=await currentQ();const firstId=q.id;const wrong=q.options.find(o=>o.id!==q.correct).id;
 await page.locator(`[name="quizChoice"][value="${wrong}"]`).check();await page.locator('#quizUncertain').check();const firstText=await page.locator('.quiz-options').innerText();await page.reload();
 assert.equal(await page.locator(`[name="quizChoice"][value="${wrong}"]`).isChecked(),true);assert.equal(await page.locator('#quizUncertain').isChecked(),true);assert.equal(await page.locator('.quiz-options').innerText(),firstText);assert.equal(await page.locator('.quiz-feedback').count(),0);
 await page.getByRole('button',{name:'Kiểm tra và xem lời giải'}).click();assert.equal(await page.locator('.wrong-option').count(),1);assert.equal(await page.locator('.correct-option').count(),1);
 let saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);assert.equal(saved.results[firstId].attempts,1);assert.equal(saved.results[firstId].correctAttempts,0);assert.equal(saved.results[firstId].uncertain,true);
 await page.reload();saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);assert.equal(saved.results[firstId].attempts,1);assert.equal(await page.locator('.quiz-feedback').count(),1);
 // Evidence and source jump use the current lesson's actual paragraph.
 const evidence=page.locator('.quiz-feedback details').last();await evidence.locator('summary').click();assert.ok((await evidence.textContent()).includes('Trang PDF'));await evidence.locator('[data-quiz-source]').first().click();assert.equal(await page.locator('#reading > p.quiz-source-focus').count(),1);
 await page.screenshot({path:path.join(output,'desktop-feedback.png'),fullPage:false});
 await page.locator('[data-quiz-next]').click();
 for(let i=1;i<6;i++){
  q=await currentQ();await page.locator(`[name="quizChoice"][value="${q.correct}"]`).check();await page.getByRole('button',{name:'Kiểm tra và xem lời giải'}).click();await page.locator('[data-quiz-next]').click();
 }
 assert.match(await page.locator('.quiz-result h4').textContent(),/5\/6/);
 const normalBefore=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).lessons[1].normal,KEY);
 await page.locator('[data-quiz-start="review"]').click();q=await currentQ();assert.equal(q.id,firstId);await page.locator(`[name="quizChoice"][value="${q.correct}"]`).check();await page.getByRole('button',{name:'Kiểm tra và xem lời giải'}).click();await page.locator('[data-quiz-next]').click();assert.match(await page.locator('.quiz-result h4').textContent(),/1\/1/);
 await page.locator('[data-quiz-return]').click();const normalAfter=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).lessons[1].normal,KEY);assert.deepEqual(normalBefore,normalAfter);
 await page.locator('[data-quiz-continue]').click();const lesson1Prompt=await page.locator('.quiz-prompt').textContent();
 await page.locator('[data-quiz-lesson="8"]').click();await page.locator('[data-quiz-start="normal"]').click();const lesson8Prompt=await page.locator('.quiz-prompt').textContent();await page.locator('[data-quiz-lesson="1"]').click();assert.equal(await page.locator('.quiz-prompt').textContent(),lesson1Prompt);await page.locator('[data-quiz-lesson="8"]').click();assert.equal(await page.locator('.quiz-prompt').textContent(),lesson8Prompt);
 // Finish every question and each final partial batch, using only public quiz controls.
 for(const n of [1,8,25]){
  await page.locator(`[data-quiz-lesson="${n}"]`).click();
  if(await page.locator('[data-quiz-start="normal"]').count())await page.locator('[data-quiz-start="normal"]').first().click();
  let guard=0;
  while(guard++<45){
   if(await page.locator('.quiz-result').count()){
    if(await page.locator('[data-quiz-continue]').count()){await page.locator('[data-quiz-continue]').click();continue;}
    break;
   }
   q=await currentQ();assert.ok(q&&q.lesson===n);
   if(!await page.locator('.quiz-feedback').count()){
    await page.locator(`[name="quizChoice"][value="${q.correct}"]`).check();await page.getByRole('button',{name:'Kiểm tra và xem lời giải'}).click();
   }
   const defs=await page.locator('.quiz-terms').innerText();for(const t of q.terms)assert.ok(defs.includes(t));
   await page.locator('[data-quiz-next]').click();
  }
  assert.ok(guard<45);saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);const s=saved.lessons[n].normal;assert.equal(s.stage,'summary');assert.equal(Object.keys(s.answers).length,BANK.questions.filter(q=>q.lesson===n).length);
 }
 saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);assert.equal(Object.keys(saved.results).length,48);assert.equal(saved.results[firstId].attempts,2);assert.equal(saved.results[firstId].correctAttempts,1);
 // Phone: long answer options, explanations and controls must fit; drafts remain ungraded.
 await page.setViewportSize({width:390,height:844});await page.locator('[data-quiz-lesson="25"]').click();await page.locator('[data-quiz-start="normal"]').click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.locator('.quiz-prompt').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(output,'mobile-question.png')});q=await currentQ();await page.locator(`[name="quizChoice"][value="${q.correct}"]`).check();await page.getByRole('button',{name:'Kiểm tra và xem lời giải'}).click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:path.join(output,'mobile-feedback.png')});
 // Non-pilot lessons retain their reader and offer links to the three pilot lessons.
 await page.evaluate(()=>render(2,false));assert.equal(await page.locator('#quizZone').isVisible(),false);assert.equal(await page.locator('[data-quiz-lesson]').count(),3);await page.locator('#reading strong').first().click();assert.equal(await page.locator('.vocab-item.active').count(),1);
 assert.deepEqual(errors,[]);console.log('QA images:',output);console.log('PASS: all 48 questions graded; wrong/uncertain review; 6-question batches and partial endings; answer-order and draft persistence; no duplicate scoring on reload; independent lesson/review sessions; source references; mobile layout; original reader.');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
