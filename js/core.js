/* dati, salvataggio su Vercel, utilità */
const $=s=>document.querySelector(s),app=$('#app');
const K={l:'ci_liste',c:'ci_cal',s:'ci_mat2'};
const raw=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
const DATA={[K.l]:raw(K.l),[K.c]:raw(K.c),[K.s]:raw(K.s)};
const ld=k=>{try{return JSON.parse(k in DATA?DATA[k]:raw(k))||[]}catch(e){return[]}};
const setLocal=(k,v)=>{const j=JSON.stringify(v);DATA[k]=j;try{localStorage.setItem(k,j)}catch(e){}};
const pj=x=>{try{return JSON.parse(x)||[]}catch(e){return[]}};
const SEED=(()=>{try{return JSON.parse(document.getElementById('seed').textContent)||{}}catch(e){return{}}})();
let LV=+(raw('ci_v')||0),art=null,tmr=null;
function stampLocal(){LV=Date.now();try{localStorage.setItem('ci_v',String(LV))}catch(e){}}
const sv=(k,v)=>{setLocal(k,v);stampLocal();pushCloud()};
/* i dati condivisi sono salvati dentro il codice della pagina (blocco "seed"): ogni dispositivo li legge da lì */
if(SEED.v&&SEED.v>=LV){
  setLocal(K.l,SEED.l||[]);setLocal(K.c,SEED.c||[]);if(SEED.s)setLocal(K.s,SEED.s);
  LV=SEED.v;try{localStorage.setItem('ci_v',String(LV))}catch(e){}
}
function setBadge(t){const e=document.getElementById('sync');if(e){e.textContent=t;e.hidden=!t}}
let KEY='';try{KEY=localStorage.getItem('ci_key')||''}catch(e){}
function pushCloud(){clearTimeout(tmr);tmr=setTimeout(publishNow,700)}
async function api(m,body){
  const r=await fetch('/api/data',{method:m,headers:{'Content-Type':'application/json','x-key':KEY},body:body?JSON.stringify(body):undefined});
  if(r.status===401){
    let j=null;try{j=await r.clone().json()}catch(e){}
    if(!(j&&j.error==='codice errato'))throw new Error('401: accesso bloccato da Vercel, apri calendario-interrogazioni.vercel.app');
    KEY=prompt('Codice di accesso:')||'';
    try{localStorage.setItem('ci_key',KEY)}catch(e){}
    if(KEY)return api(m,body);
    throw new Error('401: codice non inserito');
  }
  return r;
}
function applySrv(d){setLocal(K.l,d.l||[]);setLocal(K.c,d.c||[]);if(d.s)setLocal(K.s,d.s);LV=d.v;try{localStorage.setItem('ci_v',String(LV))}catch(e){}}
async function publishNow(){
  tmr=null;
  try{
    const r=await api('POST',{v:LV,l:ld(K.l),c:ld(K.c),s:DATA[K.s]?ld(K.s):null});
    if(r.status===409){applySrv(await r.json());setBadge('☁️ Aggiornato da un altro dispositivo');return}
    if(!r.ok){let m='';try{m=(await r.json()).error||''}catch(e){}return setBadge('⚠️ Salvataggio online non riuscito ('+r.status+(m?': '+m:'')+')')}
    setBadge('☁️ Salvato online');
  }catch(e){setBadge('⚠️ Salvataggio online non riuscito ('+(e.message||'errore')+')')}
}
async function loadServer(){
  try{
    const r=await api('GET');if(!r.ok){let m='';try{m=(await r.json()).error||''}catch(e){}throw new Error(r.status+(m?': '+m:''))}
    const d=await r.json();
    if(d&&d.v&&d.v>LV)applySrv(d);
    else if(LV&&(!d||!d.v||LV>d.v))pushCloud();
    setBadge('☁️ Collegato al database');
    loadMails();
  }catch(e){setBadge('📱 Solo su questo dispositivo ('+(e.message||'errore')+')')}
}
/* mail di studenti e prof: stanno sul server in una parte separata; qui arriva solo la versione nascosta (es. "ma•••@gmail.com") */
let MAILS={};
const mkS=(c,n)=>'s:'+nz(c)+'|'+nz(n),mkP=p=>'p:'+nz(p);
const okMail=e=>/^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(e);
async function loadMails(){try{const r=await fetch('/api/mail',{headers:{'x-key':KEY}});if(r.ok){MAILS=await r.json();if($('#ls'))rl()}}catch(e){}}
async function setMail(k,e,from){
  const r=await fetch('/api/mail',{method:'POST',headers:{'Content-Type':'application/json','x-key':KEY},body:JSON.stringify({k,e,from})});
  let j={};try{j=await r.json()}catch(x){}
  if(!r.ok)throw new Error(j.error||('errore '+r.status));
  if(from&&from!==k)delete MAILS[from];
  if(j.m)MAILS[k]=j.m;else delete MAILS[k];
  return j;
}
const isEnter=e=>e.key==='Enter'||e.keyCode===13;
let S={mat:null,studs:[],cfg:null},mem=null,CUR=null,curKey=null,restoring=false,rz=null;
let ACC={c:'',n:'',pf:'',adm:false,prof:false,ok:[]};
try{const a=JSON.parse(sessionStorage.getItem('ci_acc'));if(a)ACC=Object.assign(ACC,a)}catch(e){}
const saveAcc=()=>{try{sessionStorage.setItem('ci_acc',JSON.stringify(ACC))}catch(e){}};
/* scadenza accesso: dopo 20 minuti senza attività il cognome viene dimenticato */
const IDLE=20*60*1000;
let LAST=Date.now();
try{const t=+sessionStorage.getItem('ci_last');if(t)LAST=t}catch(e){}
function idleCheck(){
  if(Date.now()-LAST<IDLE)return;
  if(ACC.c||ACC.adm||ACC.prof||(ACC.ok&&ACC.ok.length)){
    ACC={c:'',n:'',adm:false,prof:false,ok:[]};saveAcc();
    document.querySelectorAll('.ov').forEach(x=>x.remove());
    if(app.innerHTML)home();
  }
}
function touchAct(){
  const now=Date.now();
  if(now-LAST>=IDLE)idleCheck();
  if(now-LAST>1000){LAST=now;try{sessionStorage.setItem('ci_last',String(now))}catch(e){}}
}
['pointerdown','keydown','touchstart','wheel','scroll'].forEach(ev=>addEventListener(ev,touchAct,{passive:true,capture:true}));
setInterval(idleCheck,15000);
addEventListener('visibilitychange',()=>{if(!document.hidden)idleCheck()});
addEventListener('pageshow',idleCheck);
const fmt=d=>new Date(d).toLocaleDateString('it-IT',{day:'2-digit',month:'2-digit',year:'numeric'});
const fmtShort=d=>new Date(d).toLocaleDateString('it-IT',{day:'2-digit',month:'2-digit',year:'2-digit'});
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const cap=s=>s.trim().split(/\s+/).map(w=>w?w.charAt(0).toUpperCase()+w.slice(1).toLowerCase():'').join(' ');
const T=m=>cap(m);
/* confronto cognome/nome: ignora maiuscole e spazi doppi, richiede il cognome COMPLETO */
const nz=s=>String(s||'').trim().toLowerCase().replace(/\s+/g,' ');
/* cognome composto: vale il cognome intero oppure una qualsiasi delle sue parole (es. "leon alvarez" → "leon", "alvarez", "leon alvarez") */
const cm=(x,v)=>{const c=nz(x.c);return c===v||c.split(' ').includes(v)};
const hit=(x,v,nm)=>cm(x,v)&&(!nm||nz(x.n)===nm);
/* il professore entra solo se il suo cognome è quello indicato nella lista/calendario */
/* Presciutti è autorizzato ad accedere alle risorse dei docenti, indipendentemente dal docente associato alla lista. */
const DOCENTI_AUTORIZZATI=['presciutti'];
const profAutorizzato=v=>DOCENTI_AUTORIZZATI.includes(nz(v));
const profOk=p=>!!(ACC.prof&&p&&(profAutorizzato(ACC.pf)||cm({c:p},ACC.pf)));
function allStuds(){
  const a=[];
  ld(K.l).forEach(l=>l.s.forEach(x=>a.push(x)));
  ld(K.c).forEach(c=>c.cols.forEach(k=>k.s.forEach(x=>a.push(x))));
  return a;
}
/* serve il nome solo se lo stesso cognome esiste con nomi DIVERSI */
const needsName=v=>new Set(allStuds().filter(x=>cm(x,v)).map(x=>nz(x.n))).size>1;
function rt(n,a){
  const key=JSON.stringify([n,a]);
  if(restoring){curKey=key;return}
  if(key===curKey)return;
  try{const st={n,a};if(curKey===null)history.replaceState(st,'');else{history.pushState(st,'');window.scrollTo(0,0)}}catch(e){}
  curKey=key;
}
addEventListener('popstate',e=>{
  restoring=true;
  try{const st=e.state;if(st&&typeof window[st.n]==='function')window[st.n](...(st.a||[]));else home()}catch(x){}
  restoring=false;window.scrollTo(0,0);
});
function show(h){CUR=null;document.body.classList.remove('home');app.innerHTML='<div class="view">'+h+'</div>'}
const title='<h1>Calendario Interrogazioni Programmate</h1>';

function home(openMode){
  rt('home',[openMode||null]);
  const has=ld(K.c).length>0;
  show(`<div class="hero">${title}<p>Organizza le interrogazioni in un attimo</p><div class="row"><button class="main" onclick="pick('crea')">Crea nuovo calendario</button><button class="main" id="bvis" ${has?'':'disabled'} onclick="pick('vis')">Visualizza calendari</button></div><div id="sub"></div></div>`);
  document.body.classList.add('home');
  if(openMode)pick(openMode);
}
const mats=()=>{let r=DATA[K.s];
  if(r==null)return['italiano','storia',...ld('ci_mat')];
  try{return JSON.parse(r)}catch(e){return['italiano','storia']}};
function pick(mode){
  const f=mode==='crea'?'crea':'lista';
  document.querySelectorAll('.hero button.main').forEach(b=>{const clicked=(mode==='crea')===!b.id;b.classList.remove('dim1','dim2');b.classList.add(clicked?'dim1':'dim2')});
  $('#sub').innerHTML=`<div class="subin"><div class="view"><h2>${mode==='crea'?'Per quale materia?':'Quali calendari?'}</h2><div class="row">${mats().map(m=>`<button onclick="${f}('${m}')">${esc(T(m))}</button>`).join('')}</div><div class="row small">${mode==='crea'?'<button class="sec" onclick="addM()">+ Aggiungi materia</button><button class="sec" onclick="delM()">− Elimina materia</button>':''}<button class="sec" onclick="closeSub()">Indietro</button></div><div id="am"></div></div></div>`;
  const sb=$('#sub');if(!sb.classList.contains('open')){void sb.offsetHeight;sb.classList.add('open')}
}
function closeSub(){
  const v=document.querySelector('#sub .view');if(!v)return;
  document.querySelectorAll('.hero button.main').forEach(b=>b.classList.remove('dim1','dim2'));
  v.classList.add('out');$('#sub').classList.remove('open');setTimeout(()=>{const sb=$('#sub');if(sb&&!sb.classList.contains('open'))sb.innerHTML=''},580);
}
function addM(){
  $('#am').innerHTML=`<div class="view"><div class="row" style="margin:6px 0"><input id="mn" placeholder="Nome della materia" maxlength="30" onkeydown="if(isEnter(event)){event.preventDefault();saveM()}"><button class="sm" onclick="saveM()">Aggiungi</button></div><p id="merr" class="err"></p></div>`;
  $('#mn').focus();
}
function saveM(){
  const n=$('#mn').value.trim().replace(/'/g,'’').replace(/[\\"<>&`$]/g,'').toLowerCase(),e=$('#merr');
  if(!n){e.textContent='Errore: inserisci il nome della materia';return}
  if(mats().includes(n)){e.textContent='Errore: questa materia esiste già';return}
  const s=mats();s.push(n);sv(K.s,s);pick('crea');
}
function delM(){
  const m=mats();
  $('#am').innerHTML='<div class="view card delete-card"><h3>Elimina materia</h3><ul class="l">'+(m.length?m.map((x,i)=>`<li class="li"><span>${esc(T(x))}</span><button class="x" onclick="confM(${i})">🗑 Elimina</button></li>`).join(''):'<li class="mut">Nessuna materia presente</li>')+'</ul></div>';
}
function confM(i){
  const m=mats()[i],n=ld(K.c).filter(c=>c.mat===m).length;
  const o=document.createElement('div');o.className='ov';
  o.innerHTML=`<div class="card delete-card"><h3>Sei sicuro di voler cancellare la materia "${esc(T(m))}"?</h3><p class="mut">${n?(n==1?'Verrà eliminato anche 1 calendario di questa materia.':`Verranno eliminati anche ${n} calendari di questa materia.`):'Non ci sono calendari di questa materia.'}</p><div class="row"><button class="sec" id="no">Annulla</button><button class="danger" id="si">Conferma eliminazione</button></div></div>`;
  document.body.appendChild(o);
  o.querySelector('#no').onclick=()=>o.remove();
  o.querySelector('#si').onclick=()=>{const s=mats();s.splice(i,1);sv(K.s,s);sv(K.c,ld(K.c).filter(c=>c.mat!==m));o.remove();pick('crea');delM();const b=$('#bvis');if(b)b.disabled=!ld(K.c).length};
}
