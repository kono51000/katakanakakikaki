'use strict';
const ROMAJI='a i u e o ka ki ku ke ko sa shi su se so ta chi tsu te to na ni nu ne no ha hi fu he ho ma mi mu me mo ya yu yo ra ri ru re ro wa wo n'.split(' ');
// Thai strings are approximate pronunciation aids, not phonetic transcriptions.
const THAI_READINGS='อะ อิ อุ เอะ โอะ คะ คิ คุ เคะ โคะ สะ ชิ สึ เสะ โสะ ทะ ชิ สึ เทะ โทะ นะ นิ นุ เนะ โนะ ฮะ ฮิ ฟุ เฮะ โฮะ มะ มิ มุ เมะ โมะ ยะ ยุ โยะ ระ ริ รุ เระ โระ วะ โอะ อึน'.split(' ');
const READING_KANA='あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん';
function reading(c){const i=READING_KANA.indexOf(c);return {romaji:ROMAJI[i]||'',thai:THAI_READINGS[i]||''}}
let utterance=null,speechTimer=null,speechToken=0;
function stopSpeech(){speechToken++;clearTimeout(speechTimer);if('speechSynthesis'in window)window.speechSynthesis.cancel();utterance=null;const s=document.getElementById('speech-status');if(s)s.textContent=''}
function updatePronunciation(){const c=typeof queue!=='undefined'?queue[index]:null;document.getElementById('thai-reading').textContent=c?t('thaiApprox',{thai:reading(c).thai}):''}
document.getElementById('speak').onclick=()=>{
 const c=queue[index];if(!c)return;stopSpeech();const status=document.getElementById('speech-status');
 if(!('speechSynthesis'in window)||!('SpeechSynthesisUtterance'in window)){status.textContent=t('noVoice');return}
 const voices=window.speechSynthesis.getVoices(),voice=voices.find(v=>/^ja(?:-|$)/i.test(v.lang));
 if(!voice){status.textContent=t('noVoice');return}
 const token=speechToken;utterance=new SpeechSynthesisUtterance(c==='を'?'お':c);utterance.lang='ja-JP';utterance.voice=voice;utterance.rate=.8;
 utterance.onstart=()=>{if(token===speechToken)status.textContent=t('speaking')};
 utterance.onend=()=>{if(token===speechToken){clearTimeout(speechTimer);status.textContent='';utterance=null}};
 utterance.onerror=e=>{if(token===speechToken){clearTimeout(speechTimer);if(!['canceled','interrupted'].includes(e.error))status.textContent=t('speechError');utterance=null}};
 speechTimer=setTimeout(()=>{if(token===speechToken){stopSpeech();status.textContent=t('speechError')}},15000);
 try{window.speechSynthesis.speak(utterance)}catch{stopSpeech();status.textContent=t('speechError')}
};
// Prime the installed voice list; browsers may populate it asynchronously.
if('speechSynthesis'in window)window.speechSynthesis.getVoices();
window.addEventListener('pagehide',stopSpeech);
