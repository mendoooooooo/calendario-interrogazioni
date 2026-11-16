/* visualizzazione calendari */
/* visualizzazione */
function lista(m){
  const cs=ld(K.c).filter(c=>c.mat===m);
  rt('lista',[m]);
  if(!cs.length)return show(`<h2>Calendario ancora non presente</h2><p class="mut">Non hai ancora creato calendari di ${T(m)}.</p><div class="row"><button onclick="crea('${m}')">Crea qui</button><button class="sec" onclick="home('vis')">← Indietro</button></div>`);
  show(`<h2>Calendari di ${T(m)}</h2><div class="grid">${cs.map((c,i)=>`<div class="cal${c.pending?' pend':''}" style="animation-delay:${i*70}ms" onclick="vedi(${c.id})"><span class="dots" onclick="event.stopPropagation();menu(this,${c.id},'${m}')">⋯</span>${esc(c.name||'Calendario '+(i+1))}:<span class="dt">${fmt(c.cols[0].data)} - ${fmt(c.cols[c.cols.length-1].data)}</span>${c.pending?'<span class="st">⏳ In attesa delle preferenze ('+Object.keys(c.prefs||{}).length+'/'+c.studs.length+')</span>':''}</div>`).join('')}</div><div class="row"><button class="sec" onclick="home('vis')">← Indietro</button></div>`);
}
function menu(el,id,m){
  document.querySelectorAll('.menu').forEach(x=>x.remove());
  const d=document.createElement('div');d.className='menu';
  d.innerHTML='<button class="rn">✏️ Rinomina</button><button class="danger">🗑 Elimina</button>';
  d.onclick=e=>{e.stopPropagation();const b=e.target.closest('button');if(!b)return;d.remove();if(b.classList.contains('rn'))renC(id,m);else conf(id,m)};
  el.parentNode.appendChild(d);
}
document.addEventListener('click',()=>document.querySelectorAll('.menu').forEach(x=>x.remove()));
const calNames=()=>{const cnt={};return ld(K.c).map(c=>{cnt[c.mat]=(cnt[c.mat]||0)+1;return{id:c.id,mat:c.mat,n:c.name||'Calendario '+cnt[c.mat],ex:!!c.name}})};
function renC(id,m){
  const all=ld(K.c),c=all.find(x=>x.id===id);if(!c)return;
  const cur=(calNames().find(x=>x.id===id)||{}).n||'';
  const ov=document.createElement('div');ov.className='ov';
  ov.innerHTML='<div class="card delete-card gate"><h3>Rinomina calendario</h3><p class="mut">Nome attuale: <b></b></p><div class="row"><input id="rn" maxlength="40" placeholder="Nuovo nome" autocomplete="off" enterkeyhint="done"></div><p id="re" class="err"></p><div class="row"><button class="sec" id="rx">Annulla</button><button id="rs">Salva</button></div></div>';
  ov.querySelector('b').textContent=cur;
  document.body.appendChild(ov);
  const inp=ov.querySelector('#rn'),re=ov.querySelector('#re'),rs=ov.querySelector('#rs');
  let was=null;
  const find=()=>{const k=inp.value.trim().toLowerCase();if(!k)return null;return calNames().find(x=>x.id!==id&&x.n.trim().toLowerCase()===k&&(x.mat===c.mat||x.ex))||null};
  const refresh=()=>{
    const d=find(),key=d?d.id:null;
    if(key===was)return;was=key;
    rs.textContent=d?'Sostituisci':'Salva';
    if(d){re.className='';void re.offsetWidth;re.className='warnmsg';re.textContent='Attenzione: hai già un calendario con lo stesso nome. Cambia nome oppure sostituisci i due calendari.'}
    else{re.className='err';re.textContent=''}
  };
  const save=()=>{
    const nome=inp.value.trim();
    if(!nome){re.className='err';return showErr(re,'Errore: inserisci il nuovo nome.')}
    const d=find();
    if(d){const o=all.find(x=>x.id===d.id);o.name=cur;c.name=d.n}
    else c.name=nome;
    sv(K.c,all);
    ov.classList.add('fade');
    setTimeout(()=>{ov.remove();lista(m)},650);
  };
  rs.onclick=save;
  ov.querySelector('#rx').onclick=()=>ov.remove();
  ov.onclick=e=>{if(e.target===ov)ov.remove()};
  inp.onkeydown=e=>{if(isEnter(e)){e.preventDefault();save()}};
  inp.oninput=()=>{if(!find()){re.className='err';re.textContent=''}refresh()};
  inp.focus();
}
const isoLocal=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
function nextDate(last,days){const d=new Date(last+'T12:00:00');do{d.setDate(d.getDate()+1)}while(!days.includes(d.getDay()));return isoLocal(d)}
function editPanel(w){
  const sw=$('#swf'),rm=$('#rmf');
  const swOn=w==='sw'&&sw.hidden,rmOn=w==='rm'&&rm.hidden;
  sw.hidden=!swOn;rm.hidden=!rmOn;
  RMSEL=[];updateRmBtn();const re=$('#rme');if(re)re.textContent='';
  $('#bsw').classList.toggle('sec',rmOn);$('#brm').classList.toggle('sec',swOn);
  if(swOn)setTimeout(()=>{const a=$('#a');if(a)a.focus()},60);
}
function toggleEdit(){
  const w=$('#swr');
  if(w.classList.contains('open'))return closeEdit();
  w.classList.add('open');
  setTimeout(()=>{const c=$('#sw');if(c)c.scrollIntoView({behavior:'smooth',block:'nearest'})},300);
}
function closeEdit(){
  $('#swr').classList.remove('open');
  setTimeout(()=>{
    if($('#swr').classList.contains('open'))return;
    $('#swf').hidden=true;$('#rmf').hidden=true;RMSEL=[];updateRmBtn();
    $('#bsw').classList.remove('sec');$('#brm').classList.remove('sec');
  },520);
  const t=document.querySelector('.calendar-full');
  if(t)t.scrollIntoView({behavior:'smooth',block:'center'});
}
let RMSEL=[];
function updateRmBtn(){
  const b=$('#rmpick');if(!b)return;
  if(RMSEL.length){b.className='okg';b.textContent='✓ Date selezionate'}
  else{b.className='sec';b.textContent='Scegli date'}
}
function pickDates(id){
  const c=ld(K.c).find(x=>x.id===id);if(!c)return;
  const ov=document.createElement('div');ov.className='ov';
  ov.innerHTML='<div class="card delete-card gate prob"><h3>Scegli le date da rimuovere</h3><p class="mut" style="font-size:.85rem;margin:4px 0">Puoi selezionare uno o più giorni.</p><div class="prob-list">'+c.cols.map((k,j)=>'<label class="li"><input type="checkbox" class="rc" value="'+j+'"'+(RMSEL.includes(j)?' checked':'')+'><span>'+esc(cap(DN[new Date(k.data+'T12:00:00').getDay()]))+' '+fmt(k.data)+'</span></label>').join('')+'</div><p id="rpe" class="err"></p><div class="row"><button class="sec" id="rpx">Annulla</button><button id="rpo">Conferma</button></div></div>';
  document.body.appendChild(ov);
  const pe=ov.querySelector('#rpe');
  ov.onclick=e=>{if(e.target===ov)ov.remove()};
  ov.querySelector('#rpx').onclick=()=>ov.remove();
  ov.querySelectorAll('.rc').forEach(x=>{x.onchange=()=>{pe.textContent=''}});
  ov.querySelector('#rpo').onclick=()=>{
    const sel=[...ov.querySelectorAll('.rc:checked')].map(x=>+x.value);
    if(!sel.length)return showErr(pe,'Errore: seleziona almeno una data da rimuovere, oppure premi Annulla.');
    RMSEL=sel;ov.remove();updateRmBtn();
    const re=$('#rme');if(re)re.textContent='';
  };
}
function remDay(id){
  const re=$('#rme');
  if(!RMSEL.length)return showErr(re,'Errore: non hai selezionato nessuna data. Premi "Scegli date" e seleziona almeno un giorno da rimuovere.');
  const all=ld(K.c),cc=all.find(x=>x.id===id);if(!cc)return;
  const sel=[...new Set(RMSEL)].filter(j=>cc.cols[j]).sort((a,b)=>a-b);if(!sel.length)return;
  const days=cc.days||[...new Set(cc.cols.map(k=>new Date(k.data+'T12:00:00').getDay()))];
  const removed=sel.map(j=>cc.cols[j].data),oldLast=cc.cols[cc.cols.length-1].data;
  const dates=cc.cols.map(k=>k.data).filter((_,j)=>!sel.includes(j));
  let last=oldLast;sel.forEach(()=>{last=nextDate(last,days);dates.push(last)});
  cc.cols.forEach((k,x)=>{k.data=dates[x]});
  (cc.log=cc.log||[]).push({t:'rem',day:removed[0],days:removed,ts:Date.now(),dev:devName()});
  RMSEL=[];sv(K.c,all);vedi(id,true);
}
function kSw(e,id){
  if(!isEnter(e))return;e.preventDefault();
  const t=e.target.id,v=x=>(($('#'+x)||{}).value||'').trim();
  if(t==='a')return ($('#na').hidden?$('#b'):$('#na')).focus();
  if(t==='na'&&!v('b'))return $('#b').focus();
  swap(id);
}
function conf(id,m){
  const o=document.createElement('div');o.className='ov';
  o.innerHTML=`<div class="card delete-card"><h3>Sei sicuro di voler cancellare questo calendario?</h3><p class="mut">L'azione non si può annullare.</p><div class="row"><button class="sec" id="no">Annulla</button><button class="danger" id="si">Conferma eliminazione</button></div></div>`;
  document.body.appendChild(o);
  o.querySelector('#no').onclick=()=>o.remove();
  o.querySelector('#si').onclick=()=>{sv(K.c,ld(K.c).filter(c=>c.id!==id));o.remove();ld(K.c).some(c=>c.mat===m)?lista(m):home()};
}
const isMob=()=>matchMedia('(max-width:600px)').matches;
const dayLbl=d=>cap(DN[new Date(d+'T12:00:00').getDay()]);
/* numero di righe = quante ne servono alla colonna più lunga (le altre colonne restano invariate) */
const nrows=c=>Math.max(1,...c.cols.map(k=>k.s.length));
function calHtml(c,N){
  const cell=(k,ci,r)=>{const x=k.s[r];return x?`<td data-c="${ci}" data-r="${r}"><div class="s-name">${esc(x.n)}</div><div class="s-surname">${esc(x.c)}</div></td>`:'<td></td>'};
  const one=(a,b,ch)=>{
    let h=`${ch?'<div class="cw">':''}<table${ch?' class="chunk"':''}><thead><tr>`;
    for(let i=a;i<b;i++)h+=`<th>${dayLbl(c.cols[i].data)}<br>${fmtShort(c.cols[i].data)}</th>`;
    h+='</tr></thead><tbody>';
    const nr=nrows(c);
    for(let r=0;r<nr;r++){h+='<tr>';for(let i=a;i<b;i++)h+=cell(c.cols[i],i,r);h+='</tr>'}
    return h+'</tbody></table>'+(ch?'</div>':'');
  };
  if(!N)return one(0,c.cols.length,false);
  let h='';for(let a=0;a<c.cols.length;a+=N)h+=one(a,Math.min(a+N,c.cols.length),true);
  return h;
}
function layoutCal(){
  if(CUR==null)return;
  const c=ld(K.c).find(x=>x.id===CUR),tw=$('.calendar-full .tw');if(!c||!tw)return;
  let N=0;
  if(isMob()){
    const av=tw.clientWidth||300,n0=Math.max(1,Math.floor(av/90));
    N=Math.min(n0,c.cols.length);
    tw.style.removeProperty('--cwtot');
  }
  tw.innerHTML=calHtml(c,N);
  if(N){
    const ts=[...tw.querySelectorAll('table.chunk')],nr=nrows(c)+1;
    for(let r=0;r<nr;r++){
      let h=0;
      ts.forEach(t=>{const tr=t.rows[r];if(tr)h=Math.max(h,tr.getBoundingClientRect().height)});
      ts.forEach(t=>{const tr=t.rows[r];if(tr)tr.style.height=h+'px'});
    }
  }
}
addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(layoutCal,150)});
function vedi(id,skip){
  const c=ld(K.c).find(x=>x.id===id);if(!c)return home();
  if(c.pending)return pendCard(c);
  const ro=ACC.prof&&!ACC.adm;
  if(!skip&&!calOk(c))return calGate(c);
  if(!ACC.ok.includes(id)){ACC.ok.push(id);saveAcc()}
  rt('vedi',[id]);
  RMSEL=[];
  const nl=(c.log||[]).length;
  const rmOpts=c.cols.map((k,j)=>'<option value="'+j+'">'+fmt(k.data)+'</option>').join('');
  show(`<h2>Calendario di ${T(c.mat)}</h2><div class="calendar-full"><div class="tw"></div></div>
  <div class="row cvb"><button class="sec" onclick="lista('${c.mat}')">← Indietro</button>${ro?'':`<button onclick="toggleEdit()">Modifica</button><button class="sec" onclick="showLog(${id})">Modifiche effettuate</button>${c.viaPref?'<button class="sec" onclick="showPrefs('+id+')">Preferenze inserite</button>':''}`}</div>
  <div id="swr" class="collapse"><div class="collapse-in"><div class="card" id="sw"><p>Cosa vuoi fare?</p><div class="row"><button id="bsw" onclick="editPanel('sw')">Scambia studenti</button><button id="brm" onclick="editPanel('rm')">Rimuovi giorno di interrogazione</button><button id="btb" onclick="tabCard(${id})">Modifica tabella</button><button id="bad" onclick="addCard(${id})">Aggiungi giorno di interrogazione</button></div><div id="swf" hidden><p>Inserisci i due cognomi da scambiare</p><div class="row" style="margin:8px 0"><input id="a" placeholder="Cognome 1" onkeydown="kSw(event,${id})"><input id="na" placeholder="Nome 1" hidden onkeydown="kSw(event,${id})"><input id="b" placeholder="Cognome 2" onkeydown="kSw(event,${id})"><input id="nb" placeholder="Nome 2" hidden onkeydown="kSw(event,${id})"><button onclick="swap(${id})">Scambia</button></div><p id="werr" class="err"></p></div><div id="rmf" class="card" hidden><h3 style="margin:.2em 0 .5em">Rimuovi giorno di interrogazione</h3><p class="mut" style="margin:.3em 0">Scegli le date da eliminare. Gli studenti verranno riprogrammati nelle lezioni successive.</p><div class="row" style="margin:10px 0"><button id="rmpick" class="sec" onclick="pickDates(${id})">Scegli date</button></div><p id="rme" class="err"></p><div class="row" style="margin:6px 0 2px"><button class="sec" onclick="editPanel('rm')">Annulla</button><button onclick="remDay(${id})">Conferma</button></div></div><div class="row" style="margin:6px 0 0"><button class="gry" onclick="closeEdit()">← Indietro</button></div></div></div></div>`);
  CUR=id;layoutCal();
}
