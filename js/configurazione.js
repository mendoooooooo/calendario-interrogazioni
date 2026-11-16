/* configurazione e generazione calendario */
/* configurazione */
const todayStr=()=>{const t=new Date();return t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0')};
function errG(id,m){const e=$('#'+id);if(!e)return;e.textContent=m;e.classList.remove('err');void e.offsetWidth;e.classList.add('err')}
function cfg(){
  if(S.edit)return errL('Errore: premi "Salva" sullo studente in modifica prima di continuare.');
  if(!S.studs.length)return errL('Errore: aggiungi almeno uno studente prima di continuare.');
  rt('cfg',[]);
  const lname=(((S.li!=null)&&ld(K.l)[S.li])||{}).nome||(($('#ln')||{}).value)||'';
  const defDays=lname.toLowerCase().replace(/\s+/g,'')==='5cin'?(S.mat==='italiano'?[1,4]:S.mat==='storia'?[2]:[]):[];
  let defDate='';
  if(defDays.length){const t=new Date();t.setHours(12,0,0,0);do{t.setDate(t.getDate()+1)}while(!defDays.includes(t.getDay()));defDate=isoLocal(t)}
  const dn=[['Lunedì',1],['Martedì',2],['Mercoledì',3],['Giovedì',4],['Venerdì',5],['Sabato',6]];
  show(`<h2>Quando si interroga? (${T(S.mat)})</h2><div class="card"><p>Giorni di interrogazione</p><div class="row" style="margin:8px 0">${dn.map(d=>`<label class="chk"><input type="checkbox" class="dd" value="${d[1]}"${defDays.includes(d[1])?' checked':''} onchange="$('#derr').textContent=''"> ${d[0]}</label>`).join('')}</div><p id="derr" class="err"></p>
  <p>Data di inizio</p><input type="date" id="sd" min="${todayStr()}" value="${defDate}" oninput="$('#err').textContent=''"><p id="err" class="err"></p><p>Interrogati per lezione</p><input type="number" id="pp" min="1" value="4" style="width:100px"><hr style="border:0;border-top:1px solid var(--bd);margin:18px 0 14px"><p>Che tipo di generazione vuoi?</p><div class="row gmr" style="margin:8px 0"><button id="gma" onclick="setGm('auto')">Automatica</button><span class="gmw"><button id="gmp" onclick="setGm('pref')">Con preferenze</button><button class="infob" title="Come funziona" onclick="infoPref()">i</button></span></div></div>
  <div class="row"><button class="sec" onclick="crea('${S.mat}',1)">← Indietro</button><button onclick="gen()">Genera calendario</button></div>`);
  setGm(S.gm||'auto');
}
const DN=['domenica','lunedì','martedì','mercoledì','giovedì','venerdì','sabato'];
function warnGen(msg){
  const o=document.createElement('div');o.className='ov';
  o.innerHTML=`<div class="card delete-card warn"><h3>⚠️ Attenzione</h3><p>${esc(msg)}</p><p><b>Vuoi continuare lo stesso?</b></p><div class="row"><button class="sec" id="no">← Torna indietro</button><button id="si">Continua lo stesso</button></div></div>`;
  document.body.appendChild(o);
  o.querySelector('#no').onclick=()=>o.remove();
  o.querySelector('#si').onclick=()=>{o.remove();gen(true)};
}
function gen(force){
  const days=[...document.querySelectorAll('.dd:checked')].map(x=>+x.value),sd=$('#sd').value,pp=Math.max(1,+$('#pp').value||1);
  $('#derr').textContent='';$('#err').textContent='';
  if(!days.length)return errG('derr','Errore: scegli almeno un giorno di interrogazione.');
  if(!sd)return errG('err','Errore: scegli la data di inizio.');
  if(sd<todayStr())return errG('err','Errore: la data di inizio non può essere nel passato. Scegli oggi o una data futura.');
  let d=new Date(sd+'T12:00:00');
  if(!days.includes(d.getDay())){
    const N=['domenica','lunedì','martedì','mercoledì','giovedì','venerdì','sabato'],e=$('#err');
    e.textContent=`Errore: il ${fmt(sd)} è un ${N[d.getDay()]}, ma hai scelto ${days.map(x=>N[x]).join(', ')}. Scegli una data di inizio che cada in uno di questi giorni.`;
    e.classList.remove('err');void e.offsetWidth;e.classList.add('err');return;
  }
  const order=S.studs.map(s=>({s,k:s.r?s.r[0]+Math.random()*(s.r[1]-s.r[0]):Math.random()+(s.d?.7:0)})).sort((a,b)=>a.k-b.k).map(x=>x.s);
  const nd=Math.ceil(order.length/pp),dates=[];
  while(dates.length<nd){if(days.includes(d.getDay()))dates.push(d.toISOString().slice(0,10));d.setDate(d.getDate()+1)}
  const used=new Set(dates.map(x=>new Date(x+'T12:00:00').getDay())),unused=days.filter(x=>!used.has(x));
  if(unused.length&&!force){
    const ns=S.studs.length;
    return warnGen(`Hai scelto ${days.length} giorni di interrogazione, ma con ${ns} ${ns==1?'studente':'studenti'} e ${pp} ${pp==1?'interrogato':'interrogati'} per lezione ${nd==1?'basta 1 lezione':`bastano ${nd} lezioni`}: ${unused.length==1?'il giorno':'i giorni'} ${unused.map(x=>DN[x]).join(', ')} non ${unused.length==1?'verrà usato':'verranno usati'}.`);
  }
  if(S.gm==='pref'){
    const al=ld(K.c);al.push({id:Date.now(),mat:S.mat,pp,days,prof:cap(S.prof||''),pending:true,studs:S.studs.map(x=>({n:x.n,c:x.c,d:x.d})),prefs:{},viaPref:true,pl:[],cols:dates.map(dt=>({data:dt,s:[]}))});
    sv(K.c,al);return lista(S.mat);
  }
  const cols=dates.map((dt,i)=>({data:dt,s:order.slice(i*pp,i*pp+pp)}));
  const all=ld(K.c);all.push({id:Date.now(),mat:S.mat,pp,cols,days,prof:cap(S.prof||'')});sv(K.c,all);
  vedi(all[all.length-1].id,true);
}
function setGm(m){
  S.gm=m;
  [['auto','gma','Automatica'],['pref','gmp','Con preferenze']].forEach(a=>{const b=$('#'+a[1]);if(!b)return;const on=S.gm===a[0];b.className=on?'okg':'sec';b.textContent=(on?'✓ ':'')+a[2]});
}
function infoPref(){
  const ov=document.createElement('div');ov.className='ov';
  ov.innerHTML='<div class="card delete-card gate"><h3>Generazione con preferenze</h3><p style="text-align:left">Il calendario nasce vuoto, con solo le date. Ogni studente inserisce il proprio cognome e sceglie fino a 3 giorni in ordine di preferenza (1 = preferito), oppure "Per me è uguale". Quando tutti hanno votato il calendario si genera da solo: se un giorno è troppo richiesto, chi resta fuori passa alla scelta successiva. Gli studenti con DSA hanno più probabilità di ottenere il giorno desiderato. Chi sceglie "Per me è uguale" ha molta più probabilità di essere interrogato nei primi giorni.</p><div class="row"><button id="ik">Ho capito</button></div></div>';
  document.body.appendChild(ov);
  ov.onclick=e=>{if(e.target===ov)ov.remove()};
  ov.querySelector('#ik').onclick=()=>ov.remove();
}
function devName(){
  const u=navigator.userAgent||'';
  let os='Dispositivo',br='Browser';
  if(/iPhone/.test(u))os='iPhone';else if(/iPad/.test(u))os='iPad';else if(/Android/.test(u))os='Android';else if(/Windows/.test(u))os='Windows';else if(/Mac OS X|Macintosh/.test(u))os='Mac';else if(/Linux/.test(u))os='Linux';
  if(/Edg\//.test(u))br='Edge';else if(/OPR\/|Opera/.test(u))br='Opera';else if(/CriOS|Chrome/.test(u))br='Chrome';else if(/FxiOS|Firefox/.test(u))br='Firefox';else if(/Safari/.test(u))br='Safari';
  return os+' · '+br;
}
function blockCard(c,dv){
  const n=c.studs.length,v=Object.keys(c.prefs||{}).length;
  const ov=document.createElement('div');ov.className='ov';
  ov.innerHTML='<div class="card delete-card warn"><div style="font-size:2.4rem;line-height:1.2">📱🔒</div><h3>Hai già inserito le preferenze</h3><p>Da questo dispositivo sono già state inviate le preferenze per <b></b>. Ogni dispositivo può votare per un solo studente: così nessuno può votare al posto di un altro.</p><p class="mut">Hanno votato '+v+' studenti su '+n+'. Il calendario sarà pronto quando avranno votato tutti.</p><div class="row"><button class="sec" id="bc">← Indietro</button><button id="be">✏️ Modifica scelte</button></div><div class="row small" style="margin:4px 0 0"><button class="sec" id="ba">Accesso admin</button></div></div>';
  ov.querySelector('b').textContent=dv.n+' '+dv.c;
  document.body.appendChild(ov);
  ov.onclick=e=>{if(e.target===ov)ov.remove()};
  ov.querySelector('#bc').onclick=()=>ov.remove();
  ov.querySelector('#be').onclick=()=>{ov.remove();const ix=c.studs.findIndex(x=>x.n===dv.n&&x.c===dv.c);voteCard(c.id,false,ix>=0?ix:undefined)};
  ov.querySelector('#ba').onclick=()=>{ov.remove();voteCard(c.id,true)};
}
function showPrefs(id){
  const c=ld(K.c).find(x=>x.id===id);if(!c)return;
  const base=(c.pl||[]).slice().sort((a,b)=>a.ts-b.ts);
  let key='ins',dir=1;
  const dt=ts=>{const d=new Date(ts);return fmt(d)+' alle '+d.toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'})};
  const dl=m=>m.a?'<div>Per me è uguale</div>':m.ch.map((d,k)=>'<div>'+(k+1)+'° '+esc(cap(DN[new Date(d+'T12:00:00').getDay()]))+' '+fmt(d)+'</div>').join('');
  const o=document.createElement('div');o.className='ov';
  o.innerHTML='<div class="log-card"><h3>Preferenze inserite</h3>'+(base.length>1?'<div class="psb"><select id="psk" aria-label="Ordina per"><option value="ins">Per inserimento</option><option value="alf">Alfabetico</option></select><button class="sec" id="psd" type="button"></button></div>':'')+'<div class="log-list"></div><div class="row"><button class="sec" id="lb">← Indietro</button></div></div>';
  document.body.appendChild(o);
  const lst=o.querySelector('.log-list');
  const draw=()=>{
    const L=base.slice();
    if(key==='alf')L.sort((a,b)=>a.c.localeCompare(b.c,'it')||a.n.localeCompare(b.n,'it'));
    if(dir<0)L.reverse();
    lst.innerHTML=L.length?L.map((m,i)=>'<div class="log-item" style="animation-delay:'+(i*50)+'ms"><div class="log-n">'+(i+1)+'</div><div class="log-mid"><div class="log-t">'+esc(m.n)+' '+esc(m.c)+'</div><div class="log-s">'+dt(m.ts)+(m.dev?'<br>'+esc(m.dev):'')+'</div></div><div class="log-r" style="text-align:left"><div class="log-nd">Date selezionate:</div>'+dl(m)+'</div></div>').join(''):'<p class="log-empty">Nessuna preferenza registrata.</p>';
    const bd=o.querySelector('#psd');if(bd)bd.textContent=dir>0?'↑ Crescente':'↓ Decrescente';
  };
  const sk=o.querySelector('#psk'),sd=o.querySelector('#psd');
  if(sk)sk.onchange=()=>{key=sk.value;draw()};
  if(sd)sd.onclick=()=>{dir=-dir;draw()};
  draw();
  o.querySelector('#lb').onclick=()=>o.remove();
  o.onclick=e=>{if(e.target===o)o.remove()};
}
function pendCard(c){
  let dv=null;try{dv=JSON.parse(localStorage.getItem('ci_dev_'+c.id)||'null')}catch(e){}
  if(dv&&!ACC.adm)return blockCard(c,dv);
  const n=c.studs.length,v=Object.keys(c.prefs||{}).length;
  const ov=document.createElement('div');ov.className='ov';
  ov.innerHTML='<div class="card delete-card warn"><h3>⏳ Calendario non ancora pronto</h3><p>Hanno inserito le preferenze '+v+' studenti su '+n+'. Il calendario si genera quando tutti i partecipanti della lista hanno votato.</p><div class="row"><button class="sec" id="pc">Chiudi</button><button id="pv">Inserisci preferenze</button></div></div>';
  document.body.appendChild(ov);
  ov.onclick=e=>{if(e.target===ov)ov.remove()};
  ov.querySelector('#pc').onclick=()=>ov.remove();
  ov.querySelector('#pv').onclick=()=>{ov.remove();voteCard(c.id)};
}
function finalizeCal(c){
  const n=c.studs.length,nd=c.cols.length;
  const cp=c.cols.map((_,j)=>j<nd-1?c.pp:n-c.pp*(nd-1));
  const out=c.cols.map(()=>[]),left=[],withP=[],free=[];
  c.studs.forEach((s,i)=>{const p=c.prefs[i];(p&&p.ch&&p.ch.length?withP:free).push({s,p,k:Math.random()-(s.d?.7:0)})});
  /* a turni: prima tutte le 1ª scelte, poi le 2ª nei posti rimasti, poi le 3ª.
     Così una 1ª scelta ha sempre la precedenza su una 2ª/3ª scelta di un altro studente. */
  let pend=withP.slice();
  for(let rd=0;rd<3&&pend.length;rd++){
    const by={},next=[];
    pend.forEach(x=>{const d=x.p.ch[rd];if(d===undefined||!out[d])next.push(x);else(by[d]=by[d]||[]).push(x)});
    Object.keys(by).forEach(d=>{
      const g=by[d].sort((a,b)=>a.k-b.k),fr=cp[d]-out[d].length;
      g.forEach((x,t)=>{if(t<fr)out[d].push(x.s);else next.push(x)});
    });
    pend=next;
  }
  pend.forEach(x=>left.push(x.s));
  const sp=Math.max(1,nd*0.3);
  const slots=[];out.forEach((a,j)=>{for(let t=a.length;t<cp[j];t++)slots.push({j,k:j+Math.random()*sp})});
  slots.sort((a,b)=>a.k-b.k);
  const anyS=free.map(x=>x.s).sort(()=>Math.random()-.5);
  anyS.forEach((st,t)=>out[slots[t].j].push(st));
  const rem=slots.slice(anyS.length).sort(()=>Math.random()-.5);
  left.forEach((st,t)=>out[rem[t].j].push(st));
  c.cols.forEach((k,j)=>{k.s=out[j]});
  delete c.pending;delete c.prefs;delete c.studs;
}
function voteCard(id,pw,editIdx){
  const ov=document.createElement('div');ov.className='ov';
  ov.innerHTML='<div class="card delete-card gate prob"></div>';
  document.body.appendChild(ov);
  const box=ov.firstChild,cal=()=>ld(K.c).find(x=>x.id===id);
  let ad=false;
  ov.onclick=e=>{if(e.target===ov)ov.remove()};
  const askN=(v,rw)=>{
    box.innerHTML='<h3>Cognome presente più volte</h3><p class="mut">Il cognome "<b></b>" appare più volte in questo calendario.</p><p>Inserisci anche il nome</p><div class="row"><input id="vn" placeholder="Il tuo nome" autocomplete="off" enterkeyhint="done"></div><p id="ve" class="err"></p><div class="row"><button class="sec" id="vx">Annulla</button><button id="vk">Conferma</button></div>';
    box.querySelector('b').textContent=cap(rw);
    const inp=box.querySelector('#vn'),ve=box.querySelector('#ve');
    const go=()=>{
      const c=cal();if(!c)return ov.remove();
      const rn=inp.value.trim(),nm=nz(rn);
      if(!nm)return showErr(ve,'Errore: inserisci il nome.');
      const m=c.studs.map((s,i)=>[s,i]).filter(x=>cm(x[0],v)&&nz(x[0].n)===nm);
      if(!m.length)return showErr(ve,'Errore: "'+rn+' '+rw+'" non risulta tra i partecipanti.');
      choose(m[0][1]);
    };
    box.querySelector('#vk').onclick=go;box.querySelector('#vx').onclick=()=>ov.remove();
    inp.onkeydown=e=>{if(isEnter(e)){e.preventDefault();go()}};inp.oninput=()=>{ve.textContent=''};inp.focus();
  };
  const askP=()=>{
    box.innerHTML='<h3>Password admin</h3><p class="mut">Inserisci la password per continuare.</p><div class="row"><input id="vp" type="password" placeholder="Password" autocomplete="off" enterkeyhint="done"></div><p id="ve" class="err"></p><div class="row"><button class="sec" id="vx">← Indietro</button><button id="vk">Conferma</button></div>';
    const inp=box.querySelector('#vp'),ve=box.querySelector('#ve');
    const go=()=>{
      if(inp.value!==ADMIN_PW)return showErr(ve,'Errore: password errata.');
      ad=true;askS();
    };
    box.querySelector('#vk').onclick=go;box.querySelector('#vx').onclick=()=>{ad=false;askC()};
    inp.onkeydown=e=>{if(isEnter(e)){e.preventDefault();go()}};inp.oninput=()=>{ve.textContent=''};inp.focus();
  };
  const choose=i=>{
    const c=cal();if(!c)return ov.remove();
    if(ad||!(c.prefs||{})[i])return pickD(i);
    const st=c.studs[i];
    box.innerHTML='<div style="font-size:2.4rem;line-height:1.2">✅</div><h3>Hai già inserito le preferenze</h3><p>Le preferenze per <b></b> sono già state inviate. Vuoi modificare le tue scelte?</p><div class="row"><button class="sec" id="hb">← Indietro</button><button id="hm">✏️ Modifica scelte</button></div>';
    box.querySelector('b').textContent=st.n+' '+st.c;
    box.querySelector('#hb').onclick=()=>ov.remove();
    box.querySelector('#hm').onclick=()=>pickD(i);
  };
  const askS=()=>{
    const c=cal();if(!c)return ov.remove();
    box.innerHTML='<h3>Modalità admin</h3><p class="mut" style="font-size:.85rem;margin:4px 0">Scegli lo studente per cui inserire le preferenze.</p><div class="prob-list">'+c.studs.map((x,i)=>'<div class="li vd" data-i="'+i+'"><span>'+esc(x.n)+' '+esc(x.c)+'</span>'+((c.prefs||{})[i]?'<span class="tag">già votato</span>':'')+'</div>').join('')+'</div><div class="row"><button class="sec" id="vx">← Indietro</button><button id="vc">Chiudi</button></div>';
    box.querySelector('#vc').onclick=()=>{ov.remove();lista(c.mat)};
    box.querySelector('.prob-list').onclick=e=>{const t=e.target.closest('.vd');if(t)pickD(+t.dataset.i)};
    box.querySelector('#vx').onclick=()=>{ad=false;askC()};
  };
  const askC=()=>{
    box.innerHTML='<h3>Inserisci le tue preferenze</h3><p class="mut">Scrivi il tuo cognome.</p>'+(ACC.adm?'<p class="mut" style="font-size:.8rem">🔧 Modalità admin: puoi inserire più cognomi.</p>':'')+'<div class="row"><input id="vs" placeholder="Il tuo cognome" autocomplete="off" enterkeyhint="done"></div><p id="ve" class="err"></p><div class="row"><button class="sec" id="vx">Annulla</button><button id="vk">Continua</button></div>';
    const inp=box.querySelector('#vs'),ve=box.querySelector('#ve');
    const go=()=>{
      const c=cal();if(!c)return ov.remove();
      const rw=inp.value.trim(),v=nz(rw);
      if(!v)return showErr(ve,'Errore: scrivi il tuo cognome.');
      if(v==='menditto')return askP();
      const m=c.studs.map((s,i)=>[s,i]).filter(x=>cm(x[0],v));
      if(!m.length)return showErr(ve,'Errore: il cognome "'+rw+'" non risulta tra i partecipanti di questo calendario.');
      if(m.length>1)return askN(v,rw);
      choose(m[0][1]);
    };
    box.querySelector('#vk').onclick=go;box.querySelector('#vx').onclick=()=>ov.remove();
    inp.onkeydown=e=>{if(isEnter(e)){e.preventDefault();go()}};inp.oninput=()=>{ve.textContent=''};inp.focus();
  };
  const pickD=i=>{
    const c0=cal(),s=c0.studs[i],pr=(c0.prefs||{})[i]||{};
    let any=!!pr.a,sel=(pr.ch||[]).slice();
    const draw=()=>{
      const old=box.querySelector('.prob-list'),sc=old?old.scrollTop:0,c=cal();
      box.innerHTML='<h3>'+esc(s.n)+' '+esc(s.c)+'</h3><p class="mut" style="font-size:.85rem;margin:4px 0">Scegli fino a 3 giorni: 1 = il preferito, 2 e 3 = alternative. Oppure scegli "Per me è uguale".</p><div class="prob-list"><div class="li vd'+(any?' sel':'')+'" data-a="1"><span class="vb">'+(any?'✓':'')+'</span><span>Per me è uguale</span></div>'+c.cols.map((k,j)=>{const r=sel.indexOf(j);return '<div class="li vd'+(r>=0?' sel':'')+(any?' dis':'')+'" data-j="'+j+'"><span class="vb">'+(r>=0?r+1:'')+'</span><span>'+esc(cap(DN[new Date(k.data+'T12:00:00').getDay()]))+' '+fmt(k.data)+'</span></div>'}).join('')+'</div><p id="ve" class="err"></p><div class="row"><button class="sec" id="vx">Annulla</button><button id="vk">Conferma</button></div>';
      const pl=box.querySelector('.prob-list'),ve=box.querySelector('#ve');pl.scrollTop=sc;
      pl.onclick=e=>{
        const t=e.target.closest('.vd');if(!t)return;
        if(t.dataset.a){any=!any;if(any)sel=[]}
        else{
          if(any)return;
          const j=+t.dataset.j,q=sel.indexOf(j);
          if(q>=0)sel.splice(q,1);
          else if(sel.length>=3)return showErr(ve,'Errore: puoi scegliere al massimo 3 giorni.');
          else sel.push(j);
        }
        draw();
      };
      box.querySelector('#vx').onclick=()=>{if(ad)askS();else ov.remove()};
      box.querySelector('#vk').onclick=()=>{
        if(!any&&!sel.length)return showErr(ve,'Errore: scegli almeno un giorno oppure "Per me è uguale".');
        const all=ld(K.c),cc=all.find(x=>x.id===id);if(!cc)return ov.remove();
        cc.prefs=cc.prefs||{};cc.prefs[i]=any?{a:1}:{ch:sel.slice()};
        cc.pl=(cc.pl||[]).filter(x=>!(x.n===s.n&&x.c===s.c));
        cc.pl.push({n:s.n,c:s.c,ts:Date.now(),dev:devName(),a:!!any,ch:any?[]:sel.map(j=>cc.cols[j].data)});
        if(!ACC.adm&&!ad){try{localStorage.setItem('ci_dev_'+id,JSON.stringify({n:s.n,c:s.c}))}catch(e){}}
        const nv=Object.keys(cc.prefs).length,tot=cc.studs.length,fin=nv>=tot,mt=cc.mat;
        if(fin)finalizeCal(cc);
        sv(K.c,all);
        if(ad&&!fin)return askS();
        box.innerHTML=fin?'<h3 class="ok">✅ Fatto!</h3><p class="mut">Tutti hanno inserito le preferenze: il calendario è stato generato.</p>':'<h3 class="ok">✅ Preferenze salvate</h3><p class="mut">Hanno votato '+nv+' studenti su '+tot+'.</p>';
        setTimeout(()=>{ov.remove();lista(mt)},1500);
      };
    };
    draw();
  };
  if(editIdx!==undefined)pickD(editIdx);else if(pw)askP();else askC();
}
