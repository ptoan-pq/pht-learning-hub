(()=>{
'use strict';
const bank=JSON.parse(document.getElementById('quiz-data').textContent);
const byId=new Map(bank.questions.map(q=>[q.id,q]));
const quizKey='thien-vocab-application-pilot-v1';
const esc=escapeHtml;
const zone=document.getElementById('quizZone');
const shortcut=document.getElementById('quizShortcut');
if('IntersectionObserver' in window)new IntersectionObserver(items=>{document.body.classList.toggle('quiz-in-view',items[0].isIntersecting);},{rootMargin:'-65px 0px -40% 0px'}).observe(zone);
const kinds={transfer:'Vận dụng tình huống',repair:'Phân tích và sửa sai',inference:'Suy luận và giới hạn'};
let store={version:1,results:{},lessons:{}};
try{
 const saved=JSON.parse(safeGet(quizKey)||'null');
 if(saved&&saved.version===1&&saved.results&&saved.lessons){
  for(const [id,r] of Object.entries(saved.results)){
   if(byId.has(id)&&r&&['a','b','c','d'].includes(r.choice)&&Number.isInteger(r.attempts)&&r.attempts>0&&Number.isInteger(r.correctAttempts)&&r.correctAttempts>=0&&r.correctAttempts<=r.attempts)store.results[id]=r;
  }
  for(const n of bank.scope){
   const l=saved.lessons[n];if(!l||!['normal','review'].includes(l.active))continue;
   const valid={active:l.active};
   for(const mode of ['normal','review']){
    const s=l[mode];
    if(!s||!Array.isArray(s.ids)||!s.ids.length||new Set(s.ids).size!==s.ids.length||!s.ids.every(id=>byId.get(id)?.lesson===n)||!Number.isInteger(s.index)||s.index<0||s.index>=s.ids.length||!['question','summary'].includes(s.stage)||!s.orders||!s.answers)continue;
    if(!s.ids.every(id=>Array.isArray(s.orders[id])&&s.orders[id].length===4&&new Set(s.orders[id]).size===4&&s.orders[id].every(c=>['a','b','c','d'].includes(c))))continue;
    const answers={};
    for(const [id,a]of Object.entries(s.answers))if(s.ids.includes(id)&&a&&['a','b','c','d'].includes(a.choice))answers[id]={choice:a.choice,uncertain:!!a.uncertain};
    // Accept a resumable sequence only when its preceding answers exist.
    if(!s.ids.slice(0,s.index).every(id=>answers[id]))continue;
    if(s.stage==='summary'&&!answers[s.ids[s.index]])continue;
    const drafts={};
    for(const [id,d]of Object.entries(s.drafts||{}))if(s.ids.includes(id)&&d&&(d.choice===null||['a','b','c','d'].includes(d.choice)))drafts[id]={choice:d.choice,uncertain:!!d.uncertain};
    valid[mode]={...s,answers,drafts};
   }
   if(!valid[valid.active])valid.active=valid.normal?'normal':'review';
   if(valid[valid.active])store.lessons[n]=valid;
  }
 }
}catch(e){}
function save(){safeSet(quizKey,JSON.stringify(store));}
function shuffled(xs){const a=[...xs];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function questions(){return bank.questions.filter(q=>q.lesson===current);}
function needsReview(q){const r=store.results[q.id];return r&&(r.choice!==q.correct||r.uncertain);}
function state(){const l=store.lessons[current];return l&&l[l.active];}
function makeSession(mode){
 const qs=mode==='review'?questions().filter(needsReview):questions();if(!qs.length)return;
 const ids=shuffled(qs.map(q=>q.id));const orders=Object.fromEntries(ids.map(id=>[id,shuffled(['a','b','c','d'])]));
 const l=store.lessons[current]||(store.lessons[current]={active:'normal'});
 l[mode]={ids,orders,index:0,answers:{},drafts:{},stage:'question'};l.active=mode;save();draw();focusQuestion();
}
function focusQuestion(){const p=zone.querySelector('.quiz-prompt,.quiz-result h4');if(p){p.focus({preventScroll:true});p.scrollIntoView({behavior:'smooth',block:'start'});}}
function summaryText(){
 const qs=questions();const attempted=qs.filter(q=>store.results[q.id]);const need=qs.filter(needsReview);
 return `Đã làm ${attempted.length}/${qs.length} câu · ${need.length} câu sai hoặc còn phân vân ở lần gần nhất.`;
}
function mount(){
 const available=bank.scope.includes(current);
 shortcut.innerHTML=`<span>Bộ mẫu vận dụng:</span>${bank.scope.map(n=>`<button type="button" data-quiz-lesson="${n}" ${n===current?'aria-current="true"':''}>Bài ${n}</button>`).join('')}${available?'<button type="button" class="quiz-primary" data-quiz-jump>Luyện bài đang đọc ↓</button>':''}`;
 zone.hidden=!available;
 if(!available){zone.innerHTML='';return;}
 zone.innerHTML=`<h3 class="quiz-heading">Luyện vận dụng từ vựng · Bài ${current}</h3><p class="quiz-intro">${questions().length} câu khó và rất khó, chia thành các lượt tối đa 6 câu. Các tình huống được soạn mới từ nội dung bài. Chọn cách dùng từ và lập luận chính xác nhất; lời giải chỉ mở sau khi trả lời.</p><p class="quiz-total-note">Nhận định trong câu hỏi được xét theo lập luận của bài đọc. Kết quả ghi nhận những lần trả lời, chưa phải kết luận đã ghi nhớ lâu dài.</p><div id="quizWork"></div>`;
 draw();
}
function draw(){
 const work=document.getElementById('quizWork');if(!work)return;
 const s=state();
 if(!s){work.innerHTML=`<p class="quiz-progress">${summaryText()}</p><div class="quiz-actions"><button class="quiz-primary" type="button" data-quiz-start="normal">Bắt đầu luyện</button>${questions().some(needsReview)?'<button type="button" data-quiz-start="review">Ôn câu cần luyện</button>':''}</div>`;return;}
 if(s.stage==='summary'){drawSummary(work,s);return;}
 const q=byId.get(s.ids[s.index]);const a=s.answers[q.id];const draft=s.drafts?.[q.id];const order=s.orders[q.id];const local=s.index%6+1;const packStart=Math.floor(s.index/6)*6;const packSize=Math.min(6,s.ids.length-packStart);
 work.innerHTML=`<p class="quiz-progress">${store.lessons[current].active==='review'?'Ôn câu cần luyện':'Lượt '+(Math.floor(s.index/6)+1)} · Câu ${local}/${packSize} · Đã trả lời ${Object.keys(s.answers).length}/${s.ids.length}<progress value="${Object.keys(s.answers).length}" max="${s.ids.length}" aria-label="Tiến độ lượt luyện"></progress></p><div class="quiz-card"><div class="quiz-type">${kinds[q.kind]} · ${q.difficulty==='very-hard'?'Rất khó':'Khó'}</div><p class="quiz-prompt" lang="en" tabindex="-1">${esc(q.prompt)}</p><form id="quizForm"><fieldset class="quiz-options"><legend class="sr-only">Chọn một đáp án</legend>${order.map((id,i)=>{const o=q.options.find(x=>x.id===id);const isCorrect=a&&id===q.correct,isWrong=a&&id===a.choice&&id!==q.correct;return `<label class="quiz-option ${isCorrect?'correct-option':isWrong?'wrong-option':''}"><input type="radio" name="quizChoice" value="${id}" ${(a||draft)?.choice===id?'checked':''} ${a?'disabled':''} required><span class="quiz-letter">${String.fromCharCode(65+i)}.</span><span lang="en">${esc(o.text)}${isCorrect?'<span class="quiz-mark" lang="vi">✓ Đáp án đúng</span>':isWrong?'<span class="quiz-mark" lang="vi">Lựa chọn của bạn</span>':''}</span></label>`;}).join('')}</fieldset>${!a?'<label class="quiz-confidence"><input id="quizUncertain" type="checkbox" '+(draft?.uncertain?'checked':'')+'>Tôi chọn được nhưng vẫn còn phân vân</label><p class="quiz-error" id="quizError" role="status"></p><div class="quiz-actions"><button class="quiz-primary" type="submit">Kiểm tra và xem lời giải</button></div>':''}</form>${a?feedback(q,a,order):''}${store.lessons[current].active==='review'&&store.lessons[current].normal?'<div class="quiz-actions"><button type="button" data-quiz-return>Trở về lượt chính</button></div>':''}<p class="quiz-resume-label">${summaryText()} Tiến độ từng bài được lưu trên trình duyệt khi được hỗ trợ.</p></div>`;
 const form=document.getElementById('quizForm');if(!a){form.addEventListener('submit',grade);form.addEventListener('change',()=>{s.drafts||(s.drafts={});s.drafts[q.id]={choice:new FormData(form).get('quizChoice'),uncertain:document.getElementById('quizUncertain').checked};save();});}
}
function feedback(q,a,order){
 const correct=a.choice===q.correct;const answerLetter=String.fromCharCode(65+order.indexOf(q.correct));const lesson=BOOK.sections[current];const defs=q.terms.map(t=>lesson.vocab.find(e=>e.term===t)).filter(Boolean);
 return `<section class="quiz-feedback" tabindex="-1" aria-label="Lời giải"><h4>${correct?'✓ Chọn đúng':'Cần phân biệt lại'} · Đáp án ${answerLetter}${a.uncertain?' · Đã ghi vào lượt ôn vì còn phân vân':''}</h4><p>${esc(q.options.find(o=>o.id===q.correct).reason)}</p><details><summary>Vì sao các lựa chọn khác chưa đúng?</summary><ol type="A">${order.map(id=>{const o=q.options.find(x=>x.id===id);return `<li><b>${id===q.correct?'Đúng. ':''}</b>${esc(o.reason)}</li>`;}).join('')}</ol></details><div class="quiz-terms"><b>Từ được vận dụng trong câu này</b>${defs.map(e=>`<p><b lang="en">${esc(e.term)}</b> <span class="pos">(${esc(e.pos)})</span> <span class="ipa">/${esc(e.ipa)}/</span> – ${esc(e.meaning)}</p>`).join('')}</div><details><summary>Đối chiếu bài gốc · đoạn ${q.refs.join(', ')}</summary><div class="quiz-evidence">${q.refs.map(n=>{const p=lesson.paragraphs[n-1];return `<p><b>Đoạn ${n} · Trang PDF ${p.source_page}</b><br><span lang="en">${esc(p.text)}</span></p><button type="button" data-quiz-source="${n}">Đến đoạn ${n} trong bài đọc ↑</button>`;}).join('')}</div></details><div class="quiz-actions"><button class="quiz-primary" type="button" data-quiz-next>${(state().index+1)%6===0||state().index===state().ids.length-1?'Xem kết quả lượt này':'Câu tiếp theo →'}</button></div></section>`;
}
function grade(ev){
 ev.preventDefault();const s=state();const id=s.ids[s.index];if(s.answers[id])return;
 const chosen=new FormData(ev.target).get('quizChoice');if(!['a','b','c','d'].includes(chosen)){document.getElementById('quizError').textContent='Hãy chọn một đáp án trước khi kiểm tra.';return;}
 const uncertain=document.getElementById('quizUncertain').checked;const q=byId.get(id);const prev=store.results[id]||{attempts:0,correctAttempts:0};
 s.answers[id]={choice:chosen,uncertain};if(s.drafts)delete s.drafts[id];store.results[id]={choice:chosen,uncertain,attempts:prev.attempts+1,correctAttempts:prev.correctAttempts+(chosen===q.correct?1:0)};
 save();draw();const f=zone.querySelector('.quiz-feedback');f.focus({preventScroll:true});f.scrollIntoView({behavior:'smooth',block:'start'});
}
function next(){const s=state();if(!s?.answers[s.ids[s.index]])return;if((s.index+1)%6===0||s.index===s.ids.length-1)s.stage='summary';else s.index++;save();draw();focusQuestion();}
function drawSummary(work,s){
 const start=Math.floor(s.index/6)*6;const ids=s.ids.slice(start,s.index+1);const correct=ids.filter(id=>s.answers[id]?.choice===byId.get(id).correct).length;
 const need=ids.filter(id=>s.answers[id]&&(s.answers[id].choice!==byId.get(id).correct||s.answers[id].uncertain));const terms=[...new Set(need.flatMap(id=>byId.get(id).terms))];const end=s.index===s.ids.length-1;
 work.innerHTML=`<div class="quiz-card quiz-result"><h4 tabindex="-1">Kết quả lượt ${Math.floor(s.index/6)+1}: ${correct}/${ids.length} câu đúng</h4><p>${need.length?`${need.length} câu sai hoặc còn phân vân. Ôn lại các phân biệt về nghĩa và cách lập luận trước khi luyện tiếp.`:'Bạn đã chọn đúng các câu của lượt này và không đánh dấu phân vân. Có thể thử lại vào lần học sau để kiểm tra khả năng nhớ.'}</p>${terms.length?`<p><b>Các từ liên quan cần xem lại:</b> <span lang="en">${terms.map(esc).join(', ')}.</span></p>`:''}<p class="quiz-progress">${summaryText()}</p><div class="quiz-actions">${!end?'<button type="button" class="quiz-primary" data-quiz-continue>Lượt tiếp theo →</button>':'<button type="button" class="quiz-primary" data-quiz-start="normal">Luyện lại bộ mẫu của bài</button>'}${questions().some(needsReview)?'<button type="button" data-quiz-start="review">Ôn câu sai và còn phân vân</button>':''}${store.lessons[current].active==='review'&&store.lessons[current].normal?'<button type="button" data-quiz-return>Trở về lượt chính</button>':''}</div><details><summary>Xem lại lời giải của lượt vừa làm</summary>${ids.map(id=>{const q=byId.get(id),a=s.answers[id];return `<p lang="en"><b>${esc(q.prompt)}</b><br>${esc(q.options.find(o=>o.id===q.correct).text)}</p><p>${a.choice===q.correct?'✓ Chọn đúng. ':'Cần ôn. '}${esc(q.options.find(o=>o.id===q.correct).reason)}</p>`;}).join('')}</details></div>`;
}
shortcut.addEventListener('click',ev=>{
 const b=ev.target.closest('button');if(!b)return;
 if(b.hasAttribute('data-quiz-lesson')){render(Number(b.dataset.quizLesson));zone.scrollIntoView({behavior:'smooth',block:'start'});}
 else if(b.hasAttribute('data-quiz-jump'))zone.scrollIntoView({behavior:'smooth',block:'start'});
});
zone.addEventListener('keydown',ev=>{if(['ArrowLeft','ArrowRight'].includes(ev.key))ev.stopPropagation();});
zone.addEventListener('click',ev=>{
 const b=ev.target.closest('button');if(!b)return;
 if(b.dataset.quizStart){makeSession(b.dataset.quizStart);return;}
 if(b.hasAttribute('data-quiz-next')){next();return;}
 if(b.hasAttribute('data-quiz-continue')){const s=state();s.index++;s.stage='question';save();draw();focusQuestion();return;}
 if(b.hasAttribute('data-quiz-return')){store.lessons[current].active='normal';save();draw();focusQuestion();return;}
 if(b.dataset.quizSource){const p=document.querySelectorAll('#reading > p')[Number(b.dataset.quizSource)-1];if(p){document.querySelectorAll('.quiz-source-focus').forEach(x=>x.classList.remove('quiz-source-focus'));p.classList.add('quiz-source-focus');p.scrollIntoView({behavior:'smooth',block:'center'});}}
});
// Reader navigation and quiz state use the same current lesson.
const renderReading=render;
render=function(i,scroll=true){renderReading(i,scroll);mount();};
mount();
})();
