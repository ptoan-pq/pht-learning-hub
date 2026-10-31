import assert from 'node:assert/strict';
import {readFileSync,readdirSync,statSync} from 'node:fs';
import {fresh,validate,answered,finish,dueDate,sample,examPool} from './dist/core.mjs';
import originalDeep from './content/deep.mjs';
const data=JSON.parse(readFileSync(new URL('./dist/data/course.json',import.meta.url))),qs=data.questions.filter(q=>q.audit.status==='verified');
const start=(mode,ids)=>({...fresh(),active:{token:'unit-batch',mode,ids,choices:{},created:'2026-10-27T12:00:00Z'}});
const fixed=new Date(2026,9,27,12);
let s=start('official',qs.slice(0,5).map(q=>q.id));
s.active.choices[s.active.ids[0]]=qs[0].correct;
assert.throws(()=>finish(s,data.questions,data.deep,fixed),/đủ/);assert.equal(s.history.length,0);
const restored=validate(JSON.parse(JSON.stringify(s)),data.questions,data.deep);assert.deepEqual(restored.active.choices,s.active.choices);
for(const id of s.active.ids)s.active.choices[id]=data.questions.find(q=>q.id===id).correct;
s=finish(s,data.questions,data.deep,fixed);assert.equal(s.last.score,5);assert.equal(s.history.length,5);assert.equal(s.answers[qs[0].id].due,'2026-10-28');
assert.throws(()=>finish(s,data.questions,data.deep,fixed),/đã được lưu/);assert.deepEqual(validate(s,data.questions,data.deep).last,s.last);
const tampered=structuredClone(s);tampered.last.score='<img onerror=alert(1)>';assert.equal(validate(tampered,data.questions,data.deep).last.score,5);
const hold=data.questions.find(q=>q.audit.status==='hold');let h=start('official',[hold.id]);h.active.choices[hold.id]=hold.correct;assert.throws(()=>finish(h,data.questions,data.deep,fixed),/đối chiếu/);
const old={version:2,current:'L01',answers:s.answers,history:s.history,completed:[],checkpoint:'Đã học PHB',pending:null};let imported=validate(old,data.questions,data.deep);assert.equal(imported.history.length,5);assert.equal(imported.checkpoint,old.checkpoint);assert.equal(imported.format,'virginia-web');
assert.throws(()=>validate({...old,version:77},data.questions,data.deep));assert.throws(()=>validate({...old,answers:{bad:{}}},data.questions,data.deep));
const pending=structuredClone(old);pending.pending={token:'legacy',qids:[qs[0].id],choices:{},at:'2026-09-15T12:00:00Z'};assert.equal(validate(pending,data.questions,data.deep).active.token,'legacy');
let d=start('deep',data.deep.filter(q=>q.lesson==='L01').map(q=>q.id));for(const id of d.active.ids){const q=data.deep.find(q=>q.id===id);d.active.choices[id]=q.type==='short'?'Giải thích do học viên tự viết.':q.correct;}
d=finish(d,data.questions,data.deep,fixed);assert.equal(d.last.total,3);assert.equal(d.last.score,3);assert.equal(d.history.length,0);assert.equal(Object.keys(d.answers).length,0);assert.equal(Object.keys(d.deep).length,4);assert.equal(d.last.results.filter(r=>r.correct===null).length,1);
assert.equal(answered(data.deep.find(q=>q.type==='short'),'  ','deep'),false);
assert.equal(dueDate(2,true,fixed),'2026-10-30');assert.equal(dueDate(4,true,fixed),'2026-11-10');assert.equal(dueDate(0,false,fixed),'2026-10-27');
const exam=examPool(data.questions);assert.ok(exam.signs.length>=10&&exam.general.length>=30);assert.ok(exam.signs.every(q=>q.audit.status==='verified'&&q.category.code==='SN'));assert.equal(new Set(sample(qs,40).map(q=>q.id)).size,40);
let review=start('official',[qs[0].id]);review.active.reviewFor='L02';review.active.choices[qs[0].id]=qs[0].correct;review=finish(review,data.questions,data.deep,fixed);assert.equal(review.reviewed.L02,'2026-10-27');
assert.equal(data.lessons.length,16);assert.equal(data.questions.length,266);assert.equal(data.deep.length,64);
// Inline batches share scoring, while retaining independent partial answers.
const q1=qs.find(q=>q.lesson==='L01'),q2=qs.find(q=>q.lesson==='L02');
let inline=start('official',[q1.id]);inline.active.choices[q1.id]=q1.correct;
const batch=(q,token,reviewFor)=>({token,mode:'official',lesson:q.lesson,ids:[q.id],choices:{[q.id]:q.correct},...(reviewFor?{reviewFor}:{}),created:fixed.toISOString()});
inline.lessonSessions={'L01:practice':{active:batch(q1,'lesson'),last:null,size:5},'L02:review':{active:batch(q1,'review','L02'),last:null,size:5},'L02:practice':{active:batch(q2,'next'),last:null,size:5}};
inline=finish(inline,data.questions,data.deep,fixed,'L02:review');
assert.equal(inline.reviewed.L02,'2026-10-27');assert.equal(inline.history.length,1);assert.equal(inline.lessonSessions['L02:review'].last.score,1);
assert.equal(inline.active.token,'unit-batch');assert.equal(inline.lessonSessions['L01:practice'].active.token,'lesson');
assert.deepEqual(validate(inline,data.questions,data.deep).lessonSessions,inline.lessonSessions);
assert.throws(()=>finish(inline,data.questions,data.deep,fixed,'L02:review'),/đã được lưu/);
inline=finish(inline,data.questions,data.deep,fixed,'L02:practice');assert.equal(inline.history.length,2);
const invalidInline=structuredClone(inline);invalidInline.lessonSessions['L01:practice'].active.ids=[q2.id];assert.throws(()=>validate(invalidInline,data.questions,data.deep),/không thuộc/);
const previousWeb=fresh();delete previousWeb.lessonSessions;assert.deepEqual(validate(previousWeb,data.questions,data.deep).lessonSessions,{});
for(const q of data.deep){const original=originalDeep.find(x=>x.id===q.id);assert.equal(q.type,original.type);assert.equal(q.lesson,original.lesson);assert.equal(q.pdfPage,original.pdfPage);assert.deepEqual(q.correct,original.correct,'Language changes must not alter grading');assert.equal(q.options.length,original.options.length);assert.ok(!/[\u00c0-\u1ef9]/u.test([q.prompt,...q.options,q.explanation,...(q.rubric||[])].join(' ')),'All generated Q&A must be English-only');}
const original=JSON.parse(readFileSync(new URL('./content/source.json',import.meta.url)));
for(const q of data.questions){const raw=original.questions.find(x=>x.id===q.id);for(const field of ['question','answers','feedback','correct'])assert.deepEqual(q[field],raw[field],`${q.id} ${field}`);}
const allFiles=new Set();
function listFiles(dir,prefix=''){for(const entry of readdirSync(dir,{withFileTypes:true})){const rel=prefix+entry.name;if(entry.isDirectory())listFiles(new URL(entry.name+'/',dir),rel+'/');else allFiles.add(rel);}}
listFiles(new URL('./dist/',import.meta.url));
for(const q of data.questions)for(const image of q.images)assert.ok(allFiles.has(image),image);
for(const l of data.lessons){assert.ok(l.sections.every(s=>s.pdfPage<38));assert.ok(data.deep.filter(q=>q.lesson===l.id).length>=4);}
const clean=s=>s.replace(/\s+/g,' ').trim(),vi=JSON.parse(readFileSync(new URL('./content/lessons-vi.json',import.meta.url)));
let englishSections=0,fullTranslationBlocks=0;
for(const lesson of data.lessons){
  const unchanged=vi.find(l=>l.id===lesson.id);
  assert.equal(lesson.sections.length,unchanged.sections.length);
  for(const [i,section]of lesson.sections.entries()){
    assert.deepEqual(section.body,unchanged.sections[i].body,'Vietnamese teaching text must remain unchanged');
    assert.equal(section.english.title,section.title);assert.ok(section.english.blocks.length);
    assert.equal(section.fullVi.title,section.title);assert.equal(section.fullVi.blocks.length,section.english.blocks.length);
    for(const [j,block]of section.fullVi.blocks.entries()){
      assert.equal(block.headingEn,section.english.blocks[j].heading);assert.ok(block.headingVi&&block.paragraphs.length&&block.paragraphs.every(p=>typeof p==='string'&&p.trim()));
      fullTranslationBlocks++;
    }
    if(section.english.noteEn)assert.ok(section.fullVi.noteVi,'Vietnamese reader must see the same source warning');
    for(const block of section.english.blocks)assert.ok(clean(original.pages[String(block.pdfPage)]).includes(clean(block.text)),`${lesson.id} ${section.title} exact English provenance`);
    englishSections++;
  }
  assert.ok(lesson.terms.every(t=>t.en&&t.exampleEn));assert.ok(lesson.pitfalls.every(p=>p.wrongEn&&p.rightEn));
}
assert.equal(englishSections,78);
assert.equal(fullTranslationBlocks,180);
const vision=data.lessons.find(l=>l.id==='L01').sections[1].fullVi.blocks.map(b=>b.paragraphs.join(' ')).join(' ');
assert.ok(vision.includes('20/70')&&vision.includes('110')&&vision.includes('70')&&vision.includes('30')&&vision.includes('40')&&vision.includes('MED 4'),'Full vision requirements are no longer replaced by a generic source reference');
const speed=data.lessons.find(l=>l.id==='L07').sections[1].fullVi.blocks.map(b=>b.paragraphs.join(' ')).join(' ');
assert.ok(['100','81','85','65'].every(n=>speed.includes(n)),'Additional speeding fine and its exact limits must remain in Vietnamese');
const parking=data.lessons.find(l=>l.id==='L13').sections[2].fullVi.blocks.map(b=>b.paragraphs.join(' ')).join(' ');
assert.ok(parking.includes('bó vỉa')&&parking.includes('mặt đường'),'Hard-surface/no-curb parking restriction must be translated');
assert.ok(data.lessons.find(l=>l.id==='L16').sections.filter(s=>s.english.noteEn).length>=2,'Source conflicts keep visible English warnings');
for(const l of data.lessons)for(const section of l.sections)assert.ok(allFiles.has(section.image||`assets/visuals/page-${String(section.pdfPage).padStart(2,'0')}.png`));
function checkFiles(dir){for(const name of readdirSync(dir)){assert.ok(!/^progress.*\.json$/.test(name),'Personal progress must not ship');const p=new URL(name+(statSync(new URL(name,dir)).isDirectory()?'/':''),dir);if(statSync(p).isDirectory())checkFiles(p);}}
checkFiles(new URL('./dist/',import.meta.url));
console.log('PASS: 16 routes; source evidence checked during build; 266 unchanged originals; verified-only pools; partial resume; immutable failed grading; single scoring; v2 import; untrusted result validation; separate deep/self-assessment; review gates; individual due dates; no personal progress shipped.');
