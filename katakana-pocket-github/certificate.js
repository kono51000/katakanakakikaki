'use strict';
// Draw a standalone PNG with local system fonts; no external image service.
function certificateImage(){
 const c=document.createElement('canvas');c.width=1000;c.height=1600;let g=c.getContext('2d');
 const font='-apple-system, BlinkMacSystemFont, "Noto Sans Thai", "Hiragino Kaku Gothic ProN", sans-serif';
 const lines=(text,size,width)=>{g.font=`${size}px ${font}`;const chars=typeof Intl.Segmenter==='function'?[...new Intl.Segmenter(lang,{granularity:'grapheme'}).segment(text)].map(s=>s.segment):Array.from(text);let out=[],line='';for(const ch of chars){if(g.measureText(line+ch).width>width&&line){out.push(line.trim());line=ch}else line+=ch}if(line)out.push(line.trim());return out};
 const title=lines(t('certTitle'),78,810),name=lines($('cert-name').textContent,66,790),body=lines(t('certBody'),32,780),division=lines($('cert-division').textContent,40,820),labels=[lines(t('clearedLabel'),25,360),lines(t('hintsLabel'),25,360)];
 const height=1250+title.length*95+name.length*90+body.length*56+division.length*60+Math.max(...labels.map(a=>a.length))*38;c.height=height;g=c.getContext('2d');
 let bg=g.createLinearGradient(0,0,1000,height);bg.addColorStop(0,'#56278b');bg.addColorStop(.5,'#34216f');bg.addColorStop(1,'#155f86');g.fillStyle=bg;g.fillRect(0,0,1000,height);
 g.strokeStyle='#f6ce73';g.lineWidth=12;g.strokeRect(20,20,960,height-40);g.strokeStyle='#f6ce7388';g.lineWidth=2;g.strokeRect(43,43,914,height-86);
 function text(value,y,size=32,color='#fff4da',bold=false){g.fillStyle=color;g.font=`${bold?'700 ':''}${size}px ${font}`;g.textAlign='center';g.textBaseline='middle';g.fillText(value,500,y)}
 function star(x,y,r){g.beginPath();for(let i=0;i<10;i++){let a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.45:r;g.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr)}g.closePath();g.fill()}
 g.fillStyle='#ffdf8a';for(let i=0;i<5;i++)star(160+i*170,100,i%2?18:25);text('KATAKANA POCKET',165,25,'#e6cffb',true);
 const gold=g.createLinearGradient(400,200,600,390);gold.addColorStop(0,'#fff0b3');gold.addColorStop(1,'#d89c31');g.fillStyle=gold;g.beginPath();g.arc(500,290,86,0,2*Math.PI);g.fill();g.strokeStyle='#f8d78966';g.lineWidth=10;g.stroke();g.fillStyle='#916022';star(500,290,49);
 let y=425;text(t('certKicker'),y,27,'#ffdc95',true);y+=80;for(const line of title){text(line,y,78,'#fff4da',true);y+=95}y+=12;
 const ribbon=g.createLinearGradient(80,0,920,0);ribbon.addColorStop(0,completion.mode==='random'?'#d49b3b':'#73c5d3');ribbon.addColorStop(.5,completion.mode==='random'?'#ffe8aa':'#ddffff');ribbon.addColorStop(1,completion.mode==='random'?'#e7b954':'#84d3de');g.fillStyle=ribbon;g.fillRect(65,y,870,division.length*60+34);y+=47;for(const line of division){text(line,y,40,'#352343',true);y+=60}y+=65;
 text(t('presented'),y,29,'#dbc9ee');y+=72;for(const line of name){text(line,y,66,'#ffffff',true);y+=90}g.strokeStyle='#f6ce7366';g.lineWidth=2;g.beginPath();g.moveTo(115,y-30);g.lineTo(885,y-30);g.stroke();y+=27;
 for(const line of body){text(line,y,32,'#eee1fa');y+=56}y+=66;
 for(let i=0;i<2;i++){g.fillStyle='#ffdf8a';g.font=`700 68px ${font}`;g.fillText(i?$('cert-hints').textContent:$('cert-count').textContent,i?715:285,y);g.font=`25px ${font}`;g.fillStyle='#e6d9f3';labels[i].forEach((line,j)=>g.fillText(line,i?715:285,y+65+j*38))}
 y+=120+Math.max(...labels.map(a=>a.length))*38;text(t('dateLabel'),y,25,'#ded1ed');y+=49;text($('cert-date').textContent,y,29);y+=84;g.strokeStyle='#ffffff44';g.beginPath();g.moveTo(100,y-25);g.lineTo(900,y-25);g.stroke();text($('cert-code').textContent+'   ·   WELL DONE',y+18,26,'#ffdf8a',true);
 return c;
}
let certificateObjectURL=null,saveGeneration=0;
function resetSavedImage(){saveGeneration++;if(certificateObjectURL){URL.revokeObjectURL(certificateObjectURL);certificateObjectURL=null}$('saved-image-panel').hidden=true;$('saved-image-panel').open=false;$('saved-image').removeAttribute('src');$('save-status').textContent='';$('save-certificate').disabled=false}
$('language').addEventListener('change',resetSavedImage);$('name-form').addEventListener('submit',resetSavedImage);$('issue-certificate').addEventListener('click',resetSavedImage);
$('save-certificate').onclick=async()=>{
 if(!completion||!$('cert-name').textContent.trim())return;
 resetSavedImage();const generation=saveGeneration;$('save-certificate').disabled=true;$('save-status').textContent=t('saving');
 try{if(document.fonts)await document.fonts.ready;if(generation!==saveGeneration)return;const image=certificateImage();const blob=await new Promise((resolve,reject)=>image.toBlob(b=>b?resolve(b):reject(Error('PNG export failed')),'image/png'));if(generation!==saveGeneration)return;
 certificateObjectURL=URL.createObjectURL(blob);$('saved-image').src=certificateObjectURL;$('saved-image').alt=t('certTitle')+' — '+$('cert-name').textContent;$('saved-image-panel').hidden=false;
 const a=document.createElement('a');a.href=certificateObjectURL;a.download=`katakana-${completion.mode==='random'?'random-10':'ordered-46'}-${completion.date.toISOString().slice(0,10)}.png`;document.body.appendChild(a);a.click();a.remove();$('save-status').textContent=t('downloadReady');
 }catch(error){$('save-status').textContent=t('saveError')}finally{if(generation===saveGeneration)$('save-certificate').disabled=false}
};
