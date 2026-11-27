import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
const target=new URL('./dist/books/thien-hoc-van-dap/index.html',import.meta.url);
const asset=name=>readFileSync(new URL('./content/thien-quiz-pilot/'+name,import.meta.url),'utf8');
let html=readFileSync(target,'utf8');
const originalBook=html.match(/<script id="bookdata" type="application\/json">([\s\S]*?)<\/script>/)[1];
const book=JSON.parse(originalBook),bank=JSON.parse(asset('questions.json'));
assert.deepEqual(bank.scope,[1,8,25]);assert.equal(bank.questions.length,48);
assert.equal(new Set(bank.questions.map(q=>q.id)).size,48);
for(const q of bank.questions){
 assert.ok(bank.scope.includes(q.lesson));assert.equal(q.options.length,4);
 assert.deepEqual(q.options.map(o=>o.id),['a','b','c','d']);assert.ok(q.options.some(o=>o.id===q.correct));
 assert.equal(new Set(q.options.map(o=>o.text)).size,4);
 assert.ok(q.options.every(o=>o.text.trim()&&o.reason.trim()));
 assert.ok(q.refs.length&&q.refs.every(n=>Number.isInteger(n)&&book.sections[q.lesson].paragraphs[n-1]));
 assert.ok(q.terms.every(t=>book.sections[q.lesson].vocab.some(e=>e.term===t)));
 assert.ok(['transfer','repair','inference'].includes(q.kind));
 assert.ok(['hard','very-hard'].includes(q.difficulty));
}
for(const n of bank.scope){
 const used=new Set(bank.questions.filter(q=>q.lesson===n).flatMap(q=>q.terms));
 assert.ok(book.sections[n].vocab.every(e=>used.has(e.term)),`Missing vocabulary in lesson ${n}`);
}
// Replace only this pilot's generated blocks, keeping the book and reader intact.
html=html.replace(/\/\* THIEN_QUIZ_PILOT_BEGIN \*\/[\s\S]*?\/\* THIEN_QUIZ_PILOT_END \*\/\n?/,'')
 .replace(/<div id="quizShortcut" class="quiz-shortcut"><\/div>\n?/,'')
 .replace(/<section id="quizZone" class="quiz-zone" hidden><\/section>\n?/,'')
 .replace(/<script id="quiz-data" type="application\/json">[\s\S]*?<\/script>\n?/,'')
 .replace(/<script id="quiz-app">[\s\S]*?<\/script>\n?/,'');
assert.ok(html.includes('</header>\n<div class="study">'));
html=html.replace('</style>',`/* THIEN_QUIZ_PILOT_BEGIN */\n${asset('quiz.css')}\n/* THIEN_QUIZ_PILOT_END */\n</style>`)
 .replace('</header>\n<div class="study">','<div id="quizShortcut" class="quiz-shortcut"></div>\n</header>\n<div class="study">')
 .replace('<nav class="nav endnav"','<section id="quizZone" class="quiz-zone" hidden></section>\n<nav class="nav endnav"');
const json=JSON.stringify(bank).replaceAll('</','<\\/');
html=html.replace('</body>',`<script id="quiz-data" type="application/json">${json}</script>\n<script id="quiz-app">\n${asset('quiz.js')}\n</script>\n</body>`);
assert.equal(html.match(/<script id="bookdata" type="application\/json">([\s\S]*?)<\/script>/)[1],originalBook);
assert.equal((html.match(/id="quizZone"/g)||[]).length,1);
writeFileSync(target,html);
console.log('Built 48 application questions; source references and full vocabulary coverage verified for lessons 1, 8, 25.');
