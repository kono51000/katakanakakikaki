'use strict';
const HIRA='あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん';
const ROWS=[
 {id:'a',kana:'ア',en:'A',letters:'あいうえお'},
 {id:'ka',kana:'カ',en:'KA',letters:'かきくけこ'},
 {id:'sa',kana:'サ',en:'SA',letters:'さしすせそ'},
 {id:'ta',kana:'タ',en:'TA',letters:'たちつてと'},
 {id:'na',kana:'ナ',en:'NA',letters:'なにぬねの'},
 {id:'ha',kana:'ハ',en:'HA',letters:'はひふへほ'},
 {id:'ma',kana:'マ',en:'MA',letters:'まみむめも'},
 {id:'ya',kana:'ヤ',en:'YA',letters:'やゆよ'},
 {id:'ra',kana:'ラ',en:'RA',letters:'らりるれろ'},
 {id:'wa',kana:'ワ・ヲ・ン',en:'WA / WO / N',letters:'わをん'}
];
const TRACE_REPETITIONS = 4;
const TRACE_GROUPS = [
 { id: 'a-ka', from: 0, to: 10 },
 { id: 'sa-ta', from: 10, to: 20, rows: true },
 { id: 'na-ha', from: 20, to: 30, rows: true },
 { id: 'ma-ya', from: 30, to: 38 },
 { id: 'ra-n', from: 38, to: 46 }
].map(group => ({ ...group, letters: HIRA.slice(group.from, group.to) }));

function traceFor(modeId) {
 return TRACE_GROUPS.find(group => modeId === 'trace-' + group.id);
}

function traceGroupName(group) {
 if (group.rows) {
  return t('traceRowPair', { first: kata(group.letters[0]), second: kata(group.letters[5]) });
 }
 return kata(group.letters[0]) + '〜' + kata(group.letters.at(-1));
}

function traceQueue(group) {
 const questions = [];
 for (let repeat = 0; repeat < TRACE_REPETITIONS; repeat++) {
  const batch = shuffle([...group.letters]);
  if (batch[0] === questions.at(-1)) {
   const swap = 1 + Math.floor(Math.random() * (batch.length - 1));
   [batch[0], batch[swap]] = [batch[swap], batch[0]];
  }
  questions.push(...batch);
 }
 return questions;
}

function renderTraceGroups() {
 const buttons = TRACE_GROUPS.map(group => {
  const modeId = 'trace-' + group.id;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'row-mode';
  const label = document.createElement('strong');
  label.textContent = traceGroupName(group);
  const count = document.createElement('small');
  count.textContent = t('traceCount', { count: questionCount(modeId) });
  button.append(label, count);
  button.onclick = () => start(modeId);
  return button;
 });
 $('trace-modes').replaceChildren(...buttons);
}

function rowFor(m){return ROWS.find(r=>'row-'+r.id===m)}
function rowName(r){if(r.id==='wa')return lang==='ja'?'ワ・ヲ・ン':lang==='th'?'กลุ่ม ワ・ヲ・ン':'WA / WO / N';return lang==='ja'?r.kana+'行':lang==='th'?'แถว '+r.kana:r.en+' row'}
function modeTitle(m){
 const group = traceFor(m);
 if (group) return t('traceTitle', { group: traceGroupName(group) });
 const r=rowFor(m);return r?t('rowTitle',{row:rowName(r)}):t(m==='random'?'randomTitle':'orderedTitle')}
function divisionTitle(m){
 if (traceFor(m)) return modeTitle(m);
 const r=rowFor(m);return r?t('rowDivision',{row:rowName(r)}):t(m==='random'?'randomDivision':'orderedDivision')}
function questionCount(m){
 const group = traceFor(m);
 if (group) return group.letters.length * TRACE_REPETITIONS;
 return rowFor(m)?20:m==='random'?10:46}
function modeCode(m){
 const group = traceFor(m);
 if (group) {
  const count = questionCount(m);
  return `TRACE · ${count} / ${count}`;
 }
 const r=rowFor(m);return r?'ROW '+r.en+' · 20 / 20':m==='random'?'RANDOM · 10 / 10':'A → N · 46 / 46'}
function rowQueue(r){const result=[];while(result.length<20){const batch=shuffle([...r.letters]);if(batch[0]===result.at(-1)){[batch[0],batch[1]]=[batch[1],batch[0]]}result.push(...batch.slice(0,20-result.length))}return result}
function renderRows(){const host=$('row-modes');host.replaceChildren(...ROWS.map(r=>{const b=document.createElement('button');b.type='button';b.className='row-mode';b.dataset.row=r.id;const title=document.createElement('strong');title.textContent=rowName(r);const small=document.createElement('small');small.textContent=[...r.letters].map(kata).join('・');b.append(title,small);b.onclick=()=>start('row-'+r.id);return b}))}
const $=id=>document.getElementById(id),canvas=$('drawing'),ctx=canvas.getContext('2d');
let completion=null,playerName='',feedbackState='initial';
let queue=[],index=0,mode='random',strokes=[],active=null,locked=false,hints=0,usedHint=false,cleared=new Set();
try{const saved=JSON.parse(localStorage.getItem('katakana-pocket-cleared')||'[]');if(Array.isArray(saved))cleared=new Set(saved.filter(c=>HIRA.includes(c)))}catch{}
const kata=c=>String.fromCharCode(c.charCodeAt(0)+0x60);
function show(id){if(id!=='game')setHintVisible(false);['menu','game','result','certificate-view'].forEach(s=>$(s).hidden=s!==id);$('total').innerHTML=cleared.size+' <small>/ 46</small>'}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function start(m){const name=$('student-name').value.trim();if(!name){$('student-name').setCustomValidity(t('nameRequired'));$('student-name').reportValidity();$('student-name').focus();return;}$('student-name').setCustomValidity('');if(typeof resetSavedImage==='function')resetSavedImage();playerName=name;$('student-name').readOnly=true;$('player-name').textContent=playerName;completion=null;mode=m;
 const traceGroup = traceFor(m);
 queue=traceGroup ? traceQueue(traceGroup) : rowFor(m)?rowQueue(rowFor(m)):m==='random'?shuffle([...HIRA]).slice(0,10):[...HIRA];index=0;hints=0;totalAcceptedMatch=0;show('game');load();window.scrollTo({top:0,behavior:'instant'})}
function load(){
 const tracing = Boolean(traceFor(mode));
 strokes=[];active=null;locked=false;usedHint=false;ctx.clearRect(0,0,600,600);$('question').textContent=queue[index];$('hint-letter').textContent=kata(queue[index]);setHintVisible(false);$('hint').disabled=false;$('clear').disabled=false;$('check').hidden=false;$('check').disabled=true;$('next').hidden=true;$('counter').textContent=`${index+1} / ${queue.length}`;$('mode-name').textContent=modeTitle(mode);$('progress-fill').style.width=(index/queue.length*100)+'%';setFeedback(tracing ? 'traceInitial' : 'initial')}
function point(e){const r=canvas.getBoundingClientRect();return[(e.clientX-r.left)*600/r.width,(e.clientY-r.top)*600/r.height]}
function redraw(){ctx.clearRect(0,0,600,600);ctx.strokeStyle='#276552';ctx.lineWidth=13;ctx.lineCap='round';ctx.lineJoin='round';for(const s of strokes){ctx.beginPath();s.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));if(s.length===1){ctx.lineTo(s[0][0]+.1,s[0][1]+.1)}ctx.stroke()}}
canvas.addEventListener('pointerdown',e=>{if(locked||active)return;e.preventDefault();canvas.setPointerCapture(e.pointerId);active={id:e.pointerId,points:[point(e)]};strokes.push(active.points);redraw()});
canvas.addEventListener('pointermove',e=>{if(active?.id!==e.pointerId)return;e.preventDefault();active.points.push(point(e));redraw()});
function finish(e){if(active?.id!==e.pointerId)return;active=null;$('check').disabled=strokes.flat().length<3}
canvas.addEventListener('pointerup',finish);canvas.addEventListener('pointercancel',finish);
$('clear').onclick=()=>{if(locked)return;strokes=[];active=null;redraw();$('check').disabled=true;setFeedback('retry')};
let hintTimer;
function setHintVisible(visible) {
 if (!visible) {
  clearTimeout(hintTimer);
  hintTimer = undefined;
 }
 $('hint-letter').hidden = !visible;
 const button = $('hint');
 button.setAttribute('aria-pressed', String(visible));
 button.textContent = t(traceFor(mode) ? (visible ? 'hideTraceGuide' : 'showTraceGuide') : 'hint');
}
$('hint').onclick = () => {
 const visible = $('hint-letter').hidden;
 setHintVisible(visible);
 if (visible) hintTimer = setTimeout(() => setHintVisible(false), 5000);
 if (visible && !usedHint) {
  hints++;
  usedHint = true;
 }
};
// Compare normalized ink with the glyph, allowing for handwriting variations.
function raster(source){const n=64,c=document.createElement('canvas');c.width=c.height=n;const x=c.getContext('2d');x.drawImage(source,0,0,n,n);const d=x.getImageData(0,0,n,n).data;let minX=n,minY=n,maxX=0,maxY=0;for(let y=0;y<n;y++)for(let xx=0;xx<n;xx++)if(d[(y*n+xx)*4+3]>40){minX=Math.min(minX,xx);maxX=Math.max(maxX,xx);minY=Math.min(minY,y);maxY=Math.max(maxY,y)}const out=document.createElement('canvas');out.width=out.height=n;const ox=out.getContext('2d');const w=maxX-minX+1,h=maxY-minY+1;const scale=48/Math.max(w,h);ox.drawImage(c,minX,minY,w,h,(n-w*scale)/2,(n-h*scale)/2,w*scale,h*scale);const a=ox.getImageData(0,0,n,n).data;return Array.from({length:n*n},(_,i)=>a[i*4+3]>40)}
function overlap(a,b){let hit=0,total=0;for(let i=0;i<a.length;i++){if(!a[i])continue;total++;const x=i%64,y=Math.floor(i/64);let found=false;for(let dy=-4;dy<=4&&!found;dy++)for(let dx=-4;dx<=4;dx++){const xx=x+dx,yy=y+dy;if(xx>=0&&xx<64&&yy>=0&&yy<64&&b[yy*64+xx]){found=true;break}}if(found)hit++}return total?hit/total:0}
// Check each disconnected piece of the model independently.
function hasSeparateParts(sample, reference) {
 const size = 64;
 const remaining = reference.slice();
 for (let start = 0; start < remaining.length; start++) {
  if (!remaining[start]) continue;
  const pixels = [start];
  remaining[start] = false;
  for (let i = 0; i < pixels.length; i++) {
   const x = pixels[i] % size;
   const y = Math.floor(pixels[i] / size);
   for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
     if (x + dx < 0 || x + dx >= size || y + dy < 0 || y + dy >= size) continue;
     const neighbor = (y + dy) * size + x + dx;
     if (!remaining[neighbor]) continue;
     remaining[neighbor] = false;
     pixels.push(neighbor);
    }
   }
  }
  if (pixels.length < 6) continue;
  const part = Array(reference.length).fill(false);
  for (const pixel of pixels) part[pixel] = true;
  if (overlap(part, sample) < 0.5) return false;
 }
 return true;
}
function score(){const glyph=document.createElement('canvas');glyph.width=glyph.height=600;const g=glyph.getContext('2d');g.font='440px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(kata(queue[index]),300,320);const a=raster(canvas),b=raster(glyph);return {match: Math.min(overlap(a,b),overlap(b,a)), hasSeparateParts: hasSeparateParts(a,b)}}
const PASS_SCORE = 0.65;
const SCORE_TEXT = {
 ja: { average: '平均一致度', missingPart: '離れた短い線や点も確認してね', match: '一致度', pass: '合格ライン', size: 'マスにもう少し大きく書いてね' },
 th: { average: 'ความใกล้เคียงเฉลี่ย', missingPart: 'ลองตรวจดูว่าขีดสั้นหรือจุดที่แยกกันเขียนครบไหม', match: 'ความใกล้เคียง', pass: 'เกณฑ์ผ่าน', size: 'ลองเขียนให้ใหญ่ขึ้นอีกนิด' },
 en: { average: 'Average shape match', missingPart: 'Check the separate strokes and dots', match: 'Shape match', pass: 'Passing score', size: 'Try writing a little larger' }
};
let totalAcceptedMatch = 0;
let feedbackScore = null;
let feedbackTooSmall = false;
let feedbackMissingPart = false;
$('check').onclick=()=>{if(locked||active||strokes.flat().length<3)return;const points=strokes.flat();const spanX=Math.max(...points.map(p=>p[0]))-Math.min(...points.map(p=>p[0]));const spanY=Math.max(...points.map(p=>p[1]))-Math.min(...points.map(p=>p[1]));const tooSmall = Math.max(spanX,spanY) < 90;
 const result = tooSmall ? null : score();
 const match = result?.match ?? null;
 const missingPart = result?.hasSeparateParts === false;
 if (tooSmall || missingPart || match < PASS_SCORE) {
  setFeedback(traceFor(mode) ? 'traceRetry' : 'close', match, tooSmall, missingPart);
  return;
 }
 totalAcceptedMatch += match;
 locked=true;cleared.add(queue[index]);try{localStorage.setItem('katakana-pocket-cleared',JSON.stringify([...cleared]))}catch{}setHintVisible(false);$('hint').disabled=true;$('clear').disabled=true;$('check').hidden=true;$('next').hidden=false;$('next').textContent=t(index===queue.length-1?'results':'next');setFeedback('success', match);$('progress-fill').style.width=((index+1)/queue.length*100)+'%'};
$('next').onclick=()=>{if(!locked||active||index>=queue.length)return;index++;if(index<queue.length)load();else{completion=Object.freeze({name:playerName,mode,letters:[...queue],hints,averageMatch:totalAcceptedMatch/queue.length,date:new Date()});show('result');renderResult()}};
function setFeedback(key, match = null, tooSmall = false, missingPart = false) {
 feedbackState = key;
 feedbackScore = match;
 feedbackTooSmall = tooSmall;
 feedbackMissingPart = missingPart;
 const feedback = $('feedback');
 feedback.dataset.state = key;
 const c = queue[Math.min(index, queue.length - 1)];
 const labels = SCORE_TEXT[lang];
 let message = t(key)+(key==='success'&&c?` ${c} → ${kata(c)}`:'');
 if (tooSmall) {
  message += ` · ${labels.size}`;
 } else if (match !== null) {
  message += ` · ${labels.match} ${Math.floor(match * 100)}%`;
  if (key !== 'success') message += ` (${labels.pass} ${PASS_SCORE * 100}%)`;
 }
 if (missingPart) message += ` · ${labels.missingPart}`;
 feedback.textContent = message;
}
function renderResult(){if(!completion)return;$('result-text').textContent=t('resultSummary',{count:completion.letters.length,hints:completion.hints});$('result-letters').replaceChildren(...completion.letters.map(c=>{const s=document.createElement('span');s.textContent=c+' → '+kata(c);return s}));}
function renderCertificate(){if(!completion)return;const random=completion.mode==='random';$('certificate').dataset.division=completion.mode;$('cert-division').textContent=divisionTitle(completion.mode);$('cert-name').textContent=completion.name;$('cert-count').textContent=`${completion.letters.length} / ${questionCount(completion.mode)}`;$('cert-hints').textContent=completion.hints;
 $('cert-average').textContent = new Intl.NumberFormat(lang, { style: 'percent', maximumFractionDigits: 1 }).format(completion.averageMatch);
 $('cert-average-label').textContent = SCORE_TEXT[lang].average;
 $('cert-date').textContent=new Intl.DateTimeFormat(({ja:'ja-JP',en:'en-GB',th:'th-TH'})[lang],{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Bangkok'}).format(completion.date);$('cert-code').textContent=modeCode(completion.mode);}
$('name-form').onsubmit=e=>{e.preventDefault();start('random')};
$('issue-certificate').onclick=()=>{if(!completion?.name)return;renderCertificate();show('certificate-view');window.scrollTo({top:0,behavior:'instant'})};
$('student-name').oninput=()=>$('student-name').setCustomValidity('');
$('cert-home').onclick=()=>home();
$('language').onchange=()=>{lang=$('language').value;try{localStorage.setItem('katakana-pocket-language',lang)}catch{}applyLanguage();};
function applyLanguage(){document.documentElement.lang=lang;renderRows();renderTraceGroups();$('language').value=lang;document.title=t('appName');for(const [selector,key] of Object.entries(TEXT_TARGETS)){const el=document.querySelector(selector);if(el)el.textContent=t(key)}document.querySelectorAll('[data-t]').forEach(el=>el.textContent=t(el.dataset.t));setHintVisible(!$('hint-letter').hidden);$('drawing').setAttribute('aria-label',t('drawingLabel'));$('home').setAttribute('aria-label',t('home'));$('certificate').setAttribute('aria-label',t('certTitle'));$('student-name').placeholder=t('namePlaceholder');$('student-name').setCustomValidity('');$('mode-name').textContent=modeTitle(mode);$('next').textContent=t(index===queue.length-1?'results':'next');setFeedback(feedbackState, feedbackScore, feedbackTooSmall, feedbackMissingPart);renderResult();renderCertificate();}
$('random').onclick=()=>start('random');$('ordered').onclick=()=>start('ordered');$('again').onclick=()=>home();function home(e){e?.preventDefault();active=null;completion=null;playerName='';queue=[];index=0;locked=false;$('student-name').readOnly=false;if(typeof resetSavedImage==='function')resetSavedImage();show('menu')}$('back').onclick=home;$('to-menu').onclick=home;$('home').onclick=home;show('menu');applyLanguage();

