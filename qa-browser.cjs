const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const course=JSON.parse(fs.readFileSync(path.join(__dirname,'dist/data/course.json'),'utf8'));
const base='http://127.0.0.1:4173',key='virginia-driving-v1';
(async()=>{const browser=await chromium.launch({headless:true,channel:'chrome'});try{
 const ctx=await browser.newContext({viewport:{width:1440,height:1050}}),page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);await page.getByRole('heading',{name:/Con đường đến/}).waitFor();
 await page.screenshot({path:path.join(__dirname,'../../work/dmv-web-desktop.png'),fullPage:true});
 await page.getByRole('link',{name:'Bắt đầu bài đầu tiên'}).click();await page.getByRole('heading',{name:'Kỳ thi và đèn tín hiệu',exact:true}).waitFor();
 assert.ok(await page.locator('.theory-section img').count()>=6);
 await page.locator('[data-action=read]').first().click();await page.reload();await page.locator('[data-action=read][aria-pressed=true]').waitFor();
 await page.getByRole('link',{name:'Ôn thi DMV',exact:true}).click();await page.getByRole('button',{name:'Bắt đầu gói câu hỏi'}).click();
 let saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);assert.equal(saved.active.ids.length,5);
 assert.equal(await page.locator('.feedback').count(),0);assert.ok(await page.locator('#grade').isDisabled());
 for(const id of saved.active.ids.slice(0,2)){const q=course.questions.find(q=>q.id===id);await page.locator(`input[data-answer="${id}"][value="${q.correct}"]`).check();}
 await page.reload();await page.getByText('Answered 2/5 questions').waitFor();assert.equal(await page.locator('.feedback').count(),0);
 for(const [i,id]of saved.active.ids.entries()){const q=course.questions.find(q=>q.id===id),val=i===4?q.answers.find(x=>x.value!==q.correct).value:q.correct;await page.locator(`input[data-answer="${id}"][value="${val}"]`).check();}
 await page.getByRole('button',{name:'Grade 5 questions'}).click();await page.getByText('4/5',{exact:true}).waitFor();await page.reload();await page.getByText('4/5',{exact:true}).waitFor();
 saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);assert.equal(saved.history.length,5);
 await page.goto(base+'/lessons/L02/');await page.locator('#lesson-review .question').first().waitFor();
 saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);const inlineReview=saved.lessonSessions['L02:review'].active;assert.equal(inlineReview.reviewFor,'L02');
 for(const id of inlineReview.ids){const q=course.questions.find(q=>q.id===id);await page.locator(`#lesson-review input[data-answer="${id}"][value="${q.correct}"]`).check();}await page.locator('#lesson-review [data-grade]').click();await page.locator('#lesson-review summary').filter({hasText:'Results saved'}).waitFor();await page.getByRole('heading',{name:'Màu sắc và hình dạng biển báo',exact:true}).waitFor();
 await page.goto(base+'/deep/?lesson=L01');await page.getByRole('button',{name:'Bắt đầu bài tập'}).click();saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);assert.equal(saved.active.ids.length,4);const oldHistory=saved.history.length;
 for(const id of saved.active.ids){const q=course.deep.find(q=>q.id===id);if(q.type==='short')await page.locator(`textarea[data-answer="${id}"]`).fill('Check the signal type and any posted exception, stop completely, look and yield.');else if(q.type==='multi')for(const value of q.correct)await page.locator(`input[data-answer="${id}"][value="${value}"]`).check();else await page.locator(`input[data-answer="${id}"][value="${q.correct}"]`).check();}
 await page.getByRole('button',{name:'View results & self-assessment'}).click();await page.getByText('3/3',{exact:true}).waitFor();saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);assert.equal(saved.history.length,oldHistory);
 await page.goto(base+'/practice/');if(await page.getByRole('button',{name:'Choose another practice set'}).count())await page.getByRole('button',{name:'Choose another practice set'}).click();await page.getByRole('button',{name:'Làm đề mô phỏng'}).click();saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);assert.equal(saved.active.ids.length,10);
 for(const [i,id]of saved.active.ids.entries()){const q=course.questions.find(q=>q.id===id),value=i===0?q.answers.find(x=>x.value!==q.correct).value:q.correct;await page.locator(`input[data-answer="${id}"][value="${value}"]`).check();}
 await page.getByRole('button',{name:'Grade 10 questions'}).click();await page.getByText('9/10',{exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:/Open Part 2/}).count(),0);
 await page.getByRole('button',{name:'Choose another practice set'}).click();await page.getByRole('button',{name:'Làm đề mô phỏng'}).click();saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
 for(const id of saved.active.ids){const q=course.questions.find(q=>q.id===id);await page.locator(`input[data-answer="${id}"][value="${q.correct}"]`).check();}await page.getByRole('button',{name:'Grade 10 questions'}).click();await page.getByRole('button',{name:/Open Part 2/}).click();
 for(let n=0;n<3;n++){saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);assert.equal(saved.active.stage,'general');for(const id of saved.active.ids.slice(n*10,n*10+10)){const q=course.questions.find(q=>q.id===id);await page.locator(`input[data-answer="${id}"][value="${q.correct}"]`).check();}if(n<2)await page.getByRole('button',{name:'Next →',exact:true}).click();}
 await page.getByRole('button',{name:'Grade 30 questions'}).click();await page.getByText('30/30',{exact:true}).waitFor();
 await page.goto(base+'/progress/');await page.getByRole('heading',{name:'Sao lưu & chuyển thiết bị'}).waitFor();
 const legacy={version:2,current:'L01',answers:{'1007':{attempts:1,correct:0,last_correct:false,last_choice:'1',streak:0,due:'2026-09-15'}},history:[{qid:'1007'}],completed:[],checkpoint:'Tiến độ giả cho kiểm thử nhập tệp.',pending:null};
 await page.locator('#import-progress').setInputFiles({name:'progress.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(legacy))});await page.getByRole('button',{name:'Áp dụng bản tiến độ này'}).click();await page.getByText('Tiến độ giả cho kiểm thử nhập tệp.').waitFor();
 for(const l of course.lessons){const r=await ctx.request.get(base+'/lessons/'+l.id+'/');assert.equal(r.status(),200);}
 await page.goto(base+'/');await page.getByRole('heading',{name:/Con đường đến/}).waitFor();
 for(const image of await page.locator('main img[src]').all())assert.ok(await image.evaluate(i=>i.complete&&i.naturalWidth>0));
 const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,deviceScaleFactor:1}),phone=await mobile.newPage();await phone.goto(base);await phone.getByRole('heading',{name:/Con đường đến/}).waitFor();assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await phone.screenshot({path:path.join(__dirname,'../../work/dmv-web-mobile.png'),fullPage:true});
 await phone.goto(base+'/lessons/L01/');await phone.getByRole('heading',{name:'Kỳ thi và đèn tín hiệu',exact:true}).waitFor();assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await phone.locator('[data-action=zoom]').first().click();assert.ok(await phone.locator('dialog').isVisible());await phone.getByRole('button',{name:'Đóng ảnh'}).click();
 assert.deepEqual(errors,[]);console.log('PASS browser: desktop/mobile; theory images/read resume; 5-question partial resume and4/5 grading; old-review gate; separate deep/self-assessment; mock sign9/10 blocked and10/10 opens general30/30; v2 import;16directURLs; no page errors. Fake profiles only.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
