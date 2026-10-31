export const KEY = 'virginia-driving-v1';
export function fresh() { return {format:'virginia-web',version:1,answers:{},history:[],read:{},reviewed:{},completed:[],notes:{},deep:{},lessonSessions:{},active:null,last:null,current:'L01',checkpoint:''}; }
export function today(now=new Date()) { return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`; }
export function dueDate(streak,correct,now=new Date()) { const d=new Date(now);d.setDate(d.getDate()+(correct?[1,3,7,14][Math.min(streak-1,3)]:0));return today(d); }
export function validate(input,questions,deepItems=[]) {
  if(!input||typeof input!=='object'||Array.isArray(input)) throw Error('Tệp tiến độ không hợp lệ.');
  const legacy=input.version===2&&!input.format;
  if(!legacy&&!(input.format==='virginia-web'&&input.version===1)) throw Error('Phiên bản tiến độ chưa được hỗ trợ. Tệp gốc vẫn được giữ.');
  const out={...fresh(),...(legacy?{answers:input.answers,history:input.history,completed:input.completed,current:input.current,checkpoint:input.checkpoint}:input)};
  const ids=new Set(questions.map(q=>q.id));const lesson=/^L(0[1-9]|1[0-6])$/;
  if(!out.answers||typeof out.answers!=='object'||Array.isArray(out.answers)||!Array.isArray(out.history)||!Array.isArray(out.completed)) throw Error('Thiếu dữ liệu kết quả học.');
  for(const [id,a] of Object.entries(out.answers)) {
    if(!ids.has(id)||!Number.isInteger(a.attempts)||a.attempts<1||!Number.isInteger(a.correct)||a.correct<0||a.correct>a.attempts||typeof a.last_correct!=='boolean'||!Number.isInteger(a.streak)||a.streak<0||!/^\d{4}-\d{2}-\d{2}$/.test(a.due)||!questions.find(q=>q.id===id).answers.some(x=>String(x.value)===String(a.last_choice))) throw Error('Có kết quả câu hỏi không hợp lệ.');
  }
  if(out.completed.some(id=>!lesson.test(id))||out.current&&!lesson.test(out.current)) throw Error('Bài học không hợp lệ.');
  for(const field of ['read','notes','deep','reviewed']) if(!out[field]||typeof out[field]!=='object'||Array.isArray(out[field])) throw Error('Tiến độ bài học không hợp lệ.');
  if(Object.values(out.read).some(a=>!Array.isArray(a)||a.some(n=>!Number.isInteger(n)||n<0||n>100))) throw Error('Mục đã đọc không hợp lệ.');
  if(Object.values(out.notes).some(s=>typeof s!=='string'||s.length>20000)||typeof out.checkpoint!=='string') throw Error('Ghi chú không hợp lệ.');
  if(legacy&&input.pending){ const p=input.pending;out.active={token:p.token,mode:'official',lesson:input.current,ids:p.qids,choices:p.choices||{},created:p.at}; }
  if(!out.lessonSessions||typeof out.lessonSessions!=='object'||Array.isArray(out.lessonSessions))throw Error('Gói trong bài học không hợp lệ.');
  for(const [key,session] of Object.entries(out.lessonSessions)){
    const match=/^(L(?:0[1-9]|1[0-6])):(review|practice)$/.exec(key);
    if(!match||!session||typeof session!=='object'||![5,10].includes(session.size))throw Error('Gói trong bài học không hợp lệ.');
    for(const a of [session.active,session.last].filter(Boolean)){
      if(a.mode!=='official'||!Array.isArray(a.ids)||a.ids.length>10||a.ids.some(id=>{const q=questions.find(q=>q.id===id);return !q||q.audit.status!=='verified'||(match[2]==='practice'?q.lesson!==match[1]:q.lesson>=match[1]);})||(match[2]==='review'&&a.reviewFor!==match[1]))throw Error('Câu hỏi không thuộc phần ôn của bài.');
    }
  }
  const sessions=[out,...Object.values(out.lessonSessions)];
  for(const a of sessions.flatMap(s=>[s.active,s.last]).filter(Boolean)) {
    const pool=a.mode==='deep'?deepItems:questions;
    if(!['official','deep','exam'].includes(a.mode)||typeof a.token!=='string'||!Array.isArray(a.ids)||a.ids.length<1||a.ids.length>40||new Set(a.ids).size!==a.ids.length||a.ids.some(id=>!pool.some(q=>q.id===id))||!a.choices||typeof a.choices!=='object') throw Error('Gói đang làm không hợp lệ.');
    if(a.mode==='exam'&&(!['signs','general'].includes(a.stage)||!Array.isArray(a.general)||a.general.length!==30||a.general.some(id=>!questions.some(q=>q.id===id)))) throw Error('Đề mô phỏng không hợp lệ.');
    for(const [id,value] of Object.entries(a.choices)) {
      const q=pool.find(q=>q.id===id);
      if(!a.ids.includes(id)||!q)throw Error('Lựa chọn không thuộc gói.');
      if(a.mode!=='deep'&&!q.answers.some(x=>String(x.value)===String(value)))throw Error('Lựa chọn không hợp lệ.');
      if(a.mode==='deep'&&(q.type==='short'?typeof value!=='string'||value.length>20000:q.type==='multi'?!Array.isArray(value)||value.some(n=>!Number.isInteger(n)||n<0||n>=q.options.length):!Number.isInteger(value)||value<0||value>=q.options.length))throw Error('Bài tập chưa đúng định dạng.');
    }
  }
  for(const session of sessions)if(session.last){const a=session.last,pool=a.mode==='deep'?deepItems:questions;if(a.ids.some(id=>!answered(pool.find(q=>q.id===id),a.choices[id],a.mode)))throw Error('Kết quả gói chưa đủ lựa chọn.');a.results=a.ids.map(id=>({id,choice:a.choices[id],correct:mark(pool.find(q=>q.id===id),a.choices[id],a.mode)}));a.score=a.results.filter(r=>r.correct===true).length;a.total=a.results.filter(r=>r.correct!==null).length;}
  return structuredClone(out);
}
export function answered(q,value,mode) { return mode==='deep'?(q.type==='short'?typeof value==='string'&&value.trim().length>0:q.type==='multi'?Array.isArray(value)&&value.length>0:Number.isInteger(value)):typeof value==='string'; }
export function mark(q,value,mode) { if(mode!=='deep')return value===q.correct; if(q.type==='short')return null; return q.type==='multi'?JSON.stringify([...value].sort())===JSON.stringify([...q.correct].sort()):value===q.correct; }
export function finish(state,questions,deepItems,now=new Date(),slot=null) {
  const s=structuredClone(state),session=slot?s.lessonSessions?.[slot]:s,a=session?.active;
  if(!a)throw Error('Gói này đã được lưu.');
  const pool=a.mode==='deep'?deepItems:questions;
  if(a.ids.some(id=>!pool.find(q=>q.id===id)||!answered(pool.find(q=>q.id===id),a.choices[id],a.mode)))throw Error('Hãy trả lời đủ các câu trước khi chấm.');
  if(a.mode!=='deep'&&a.ids.some(id=>pool.find(q=>q.id===id).audit.status!=='verified'))throw Error('Gói có câu cần đối chiếu lại. Hãy xuất tiến độ trước khi đổi gói.');
  const results=a.ids.map(id=>({id,choice:a.choices[id],correct:mark(pool.find(q=>q.id===id),a.choices[id],a.mode)}));
  const result={...a,results,score:results.filter(r=>r.correct===true).length,total:results.filter(r=>r.correct!==null).length,at:now.toISOString()};
  if(a.mode==='deep')for(const r of results)s.deep[r.id]={...r,at:result.at};
  else for(const r of results) {
    const old=s.answers[r.id]||{attempts:0,correct:0,streak:0};const streak=r.correct?old.streak+1:0;
    s.answers[r.id]={attempts:old.attempts+1,correct:old.correct+Number(r.correct),last_correct:r.correct,last_choice:r.choice,streak,last_at:result.at,due:dueDate(streak,r.correct,now)};
    s.history.push({qid:r.id,choice:r.choice,correct:r.correct,at:result.at,mode:a.mode,token:a.token});
  }
  if(a.reviewFor&&/^L(0[1-9]|1[0-6])$/.test(a.reviewFor))s.reviewed[a.reviewFor]=today(now);
  session.active=null;session.last=result;return s;
}
export function sample(pool,n,random=Math.random) { const a=[...pool];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a.slice(0,n); }
export function examPool(questions) {
 return {signs:questions.filter(q=>q.audit.status==='verified'&&q.category.code==='SN'),general:questions.filter(q=>q.audit.status==='verified'&&q.category.code!=='SN')};
}
