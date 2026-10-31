import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import deep from './content/deep.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
const read=p=>JSON.parse(readFileSync(p,'utf8')),content=name=>read(path.join(root,'content',name));
const norm=s=>s.replace(/\s+/g,' ').toLowerCase();
const snapshotPath=path.join(root,'content/source.json');
const snapshot=read(snapshotPath);
const curriculum=snapshot.curriculum,raw=snapshot.questions;
const reviews=[...content('questions-a.json'),...content('questions-b.json')],lessonsVi=content('lessons-vi.json');
const english=[...content('english-a.json'),...content('english-b.json'),...content('english-c.json')];
const fullVietnamese=[...content('vietnamese-full-a.json'),...content('vietnamese-full-b.json'),...content('vietnamese-full-c.json')];
const translationLock=content('translation-source-lock.json');
const deepEnglish=[...content('deep-english-a.json'),...content('deep-english-b.json')];
assert.equal(reviews.length,266);assert.equal(new Set(reviews.map(q=>q.id)).size,266);
const pages=snapshot.pages;
const questions=raw.map(q=>{const t=reviews.find(t=>t.id===q.id);assert.ok(t,`Missing translation ${q.id}`);assert.equal(t.optionsVi.length,q.answers.length,q.id);assert.ok(t.vi&&t.explanationVi&&t.reason,q.id);assert.ok(['verified','hold'].includes(t.status));assert.ok(t.evidence.length>=20&&norm(pages[String(t.pdfPage)]||'').includes(norm(t.evidence)),`Evidence ${q.id}`);if(q.review==='hold')assert.equal(t.status,'hold',`Original hold ${q.id}`);return {...q,images:q.images.map(p=>p.replace('sources/images/','assets/images/')),translation:{vi:t.vi,optionsVi:t.optionsVi,explanationVi:t.explanationVi},audit:{status:t.status,pdfPage:t.pdfPage,evidence:t.evidence,reason:t.reason}};});
assert.equal(english.length,16);assert.equal(new Set(english.map(l=>l.id)).size,16);
assert.equal(fullVietnamese.length,16);assert.equal(new Set(fullVietnamese.map(l=>l.id)).size,16);
const clean=s=>s.replace(/\s+/g,' ').trim();
const numericTokens=text=>[...text.replace(/(?:\d+\s*\|\s*VIRGINIA DRIVER[’']S MANUAL|VIRGINIA DRIVER[’']S MANUAL\s*\|\s*\d+)/g,' ').replace(/Section\s+\d+:\s*(?:Safe Driving|Signals, Signs and Pavement Markings|Seat Belts, Air Bags and Child Safety Seats)/g,' ').matchAll(/\d{1,3}(?:[,.]\d{3})+(?!\d)|(?:\d*\.)?\d+/g)].map(m=>Number(m[0].replace(/(?<=\d)[,.](?=\d{3}(?:\D|$))/g,'')));
let translatedBlocks=0;
const lessons=curriculum.map(l=>{
  const t=lessonsVi.find(t=>t.id===l.id),en=english.find(x=>x.id===l.id),full=fullVietnamese.find(x=>x.id===l.id);
  assert.ok(t&&en&&full);assert.ok(t.sections.length>=3&&t.terms.length>=3&&t.pitfalls.length>=2);
  assert.equal(full.sections.length,t.sections.length,`${l.id} full Vietnamese coverage`);
  for(const kind of ['sections','terms','pitfalls'])assert.equal(en[kind].length,t[kind].length,`${l.id} ${kind} English coverage`);
  for(const [i,s] of t.sections.entries()){
    const source=en.sections[i];assert.equal(source.title,s.title,`${l.id} section ${i} source alignment`);
    assert.ok(source.blocks.length>0,`${l.id} section ${i} English missing`);
    for(const block of source.blocks){assert.ok(block.heading&&block.text.length>=20);assert.ok(pages[String(block.pdfPage)]&&clean(pages[String(block.pdfPage)]).includes(clean(block.text)),`${l.id} section ${i}: English must be verbatim DMV text, page ${block.pdfPage}`);}
    s.english=source;
    const translation=full.sections[i];assert.equal(translation.title,s.title);assert.equal(translation.blocks.length,source.blocks.length,`${l.id} section ${i} missing Vietnamese blocks`);
    if(source.noteEn)assert.ok(translation.noteVi,`${l.id} section ${i} source warning must also appear in Vietnamese`);
    for(const [j,b]of translation.blocks.entries()){
      const block=source.blocks[j],key=`${l.id}:${i}:${j}`;
      assert.equal(b.headingEn,block.heading,`${key} source alignment`);assert.ok(b.headingVi&&Array.isArray(b.paragraphs)&&b.paragraphs.length&&b.paragraphs.every(p=>typeof p==='string'&&p.trim()),`${key} full translation missing`);
      assert.equal(translationLock[key],createHash('sha256').update(clean(block.text)).digest('hex'),`${key}: English source changed; review and update its Vietnamese translation before rebuilding`);
      const translatedNumbers=new Set(numericTokens(b.paragraphs.join(' ')));
      for(const number of numericTokens(block.text))assert.ok(translatedNumbers.has(number),`${key} Vietnamese translation missing numeric detail ${number}`);
      translatedBlocks++;
    }
    s.fullVi=translation;
  }
  for(const [i,term] of t.terms.entries()){assert.equal(en.terms[i].en,term.en);assert.ok(en.terms[i].exampleEn);term.exampleEn=en.terms[i].exampleEn;}
  for(const [i,pitfall] of t.pitfalls.entries()){const translation=en.pitfalls[i];assert.ok(translation.wrongEn&&translation.rightEn);Object.assign(pitfall,translation);}
  for(const s of [...t.sections,...t.terms,...t.pitfalls]){assert.ok(pages[String(s.pdfPage)],`Page ${l.id}`);if(s.image){const asset=s.image.replace('sources/images/','assets/images/');assert.ok(existsSync(path.join(root,'dist',asset)));s.image=asset;}}
  return {...l,...t};
});
assert.equal(translatedBlocks,180);assert.equal(Object.keys(translationLock).length,180);
assert.equal(deep.length,64);assert.equal(new Set(deep.map(q=>q.id)).size,64);
assert.equal(deepEnglish.length,64);assert.equal(new Set(deepEnglish.map(q=>q.id)).size,64);
for(const q of deep){assert.ok(lessons.some(l=>l.id===q.lesson));assert.ok(pages[String(q.pdfPage)]);assert.ok(q.prompt&&q.explanation);if(q.type==='short')assert.ok(q.rubric.length>=3);else if(q.type==='multi')assert.ok(q.correct.length>0&&q.correct.every(i=>i>=0&&i<q.options.length));else assert.ok(q.correct>=0&&q.correct<q.options.length);}
const englishDeep=deep.map(q=>{const en=deepEnglish.find(t=>t.id===q.id);assert.ok(en&&en.prompt&&en.explanation);assert.equal(en.options.length,q.options.length,`${q.id} preserve answer order/count`);if(q.rubric)assert.equal(en.rubric.length,q.rubric.length,`${q.id} self-assessment coverage`);const text=[en.prompt,...en.options,en.explanation,...(en.rubric||[])].join(' ');assert.ok(!/[\u00c0-\u1ef9]/u.test(text),`${q.id} English-only exercise text`);return {...q,prompt:en.prompt,options:en.options,explanation:en.explanation,...(q.rubric?{rubric:en.rubric}:{})};});
const dist=path.join(root,'dist');mkdirSync(path.join(dist,'data'),{recursive:true});mkdirSync(path.join(dist,'assets'),{recursive:true});
const course={edition:'April 2026',retrieved:'2026-09-15',checked:'2026-10-27',lessons,questions,deep:englishDeep,pages};
writeFileSync(path.join(dist,'data/course.json'),JSON.stringify(course));
for(const route of ['driving','english','cinema','lessons','practice','deep','progress','sources',...lessons.map(l=>'lessons/'+l.id)]){mkdirSync(path.join(dist,route),{recursive:true});writeFileSync(path.join(dist,route,'index.html'),readFileSync(path.join(dist,'index.html')));}
console.log(`Built ${lessons.length} lessons, ${lessons.reduce((n,l)=>n+l.sections.length,0)} sections, ${questions.filter(q=>q.audit.status==='verified').length} eligible / ${questions.length} original questions, ${deep.length} tutor exercises. Personal progress is never included.`);
