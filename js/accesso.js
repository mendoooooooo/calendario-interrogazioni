/* accesso per cognome */
/* ===== accesso per cognome ===== */
/* la password admin la controlla il server (variabile ADMIN_PW su Vercel): qui non c'è */
async function checkAdmin(pw,btn,err){
  if(!pw)return showErr(err,'Errore: scrivi la password.'),false;
  if(btn)btn.disabled=true;
  try{
    const r=await fetch('/api/admin',{method:'POST',headers:{'Content-Type':'application/json','x-key':KEY},body:JSON.stringify({pw})});
    let j={};try{j=await r.json()}catch(x){}
    if(r.ok&&j.ok)return true;
    showErr(err,r.status===401?'Errore: password errata.':(j.error||'Errore: controllo password non riuscito.'));
  }catch(e){showErr(err,'Errore: serve la connessione a internet per l\'accesso admin.')}
  finally{if(btn)btn.disabled=false}
  return false;
}
function showErr(el,m){if(!el)return;el.textContent=m;el.classList.remove('err');void el.offsetWidth;el.classList.add('err')}
function gate(o){
  const ov=document.createElement('div');ov.className='ov';
  ov.innerHTML='<div class="card delete-card gate"></div>';
  document.body.appendChild(ov);
  const box=ov.firstChild,close=()=>ov.remove();
  const done=act=>{
    box.innerHTML='<h3 class="ok">✅ Perfetto!</h3><p class="mut">Accesso consentito.</p>';
    setTimeout(()=>{ov.classList.add('fade');setTimeout(()=>{close();o.onOk(act)},650)},1000);
  };
  const ask0=()=>{
    box.innerHTML='<h3>Chi sei?</h3><p class="mut">Scegli come vuoi accedere.</p><div class="row"><button id="rs1">Studente</button><button id="rp1">Professore</button></div><div class="row"><button class="sec" id="gx">Annulla</button></div>';
    box.querySelector('#rs1').onclick=()=>ask('s');
    box.querySelector('#rp1').onclick=()=>ask('p');
    box.querySelector('#gx').onclick=close;
  };
  const ask=role=>{
    box.innerHTML='<h3>'+(role==='p'?'Accesso professore':'Accesso studente')+'</h3><p class="mut">'+(role==='p'?'Scrivi il tuo cognome per accedere come professore.':'Scrivi il tuo cognome per continuare.')+'</p><div class="row"><input id="gs" placeholder="Il tuo cognome" autocomplete="off" enterkeyhint="done"></div><p id="ge" class="err"></p><div class="row"><button class="sec" id="gx">← Indietro</button><button id="gk">Continua</button></div>';
    const inp=box.querySelector('#gs'),ge=box.querySelector('#ge');
    const go=()=>{
      const rw=inp.value.trim(),v=nz(rw);
      if(!v)return showErr(ge,'Errore: scrivi il tuo cognome.');
      if(v==='menditto')return askPw();
      if(role==='p'){
        if(profAutorizzato(v)||(o.pcheck&&o.pcheck(v))){ACC.prof=true;ACC.pf=v;ACC.adm=false;ACC.c='';ACC.n='';saveAcc();return done(o.mode)}
        return showErr(ge,'Errore: "'+rw+'" non risulta come docente di questa lista.');
      }
      if(!o.check(v))return showErr(ge,o.errMsg(rw));
      if(needsName(v))return askName(v,rw);
      ACC.c=v;ACC.n='';ACC.adm=false;ACC.prof=false;saveAcc();done(o.mode);
    };
    box.querySelector('#gk').onclick=go;box.querySelector('#gx').onclick=ask0;
    inp.onkeydown=e=>{if(isEnter(e)){e.preventDefault();go()}};inp.oninput=()=>{ge.textContent=''};inp.focus();
  };
  const askName=(v,rw)=>{
    box.innerHTML='<h3>Cognome presente in più liste</h3><p class="mut">Il cognome "<b></b>" appare in più liste.</p><p>Inserisci anche il nome</p><div class="row"><input id="gn2" placeholder="Il tuo nome" autocomplete="off" enterkeyhint="done"></div><p id="ge" class="err"></p><div class="row"><button class="sec" id="gx2">Annulla</button><button id="gk">Conferma</button></div>';
    box.querySelector('b').textContent=cap(rw);
    const inp=box.querySelector('#gn2'),ge=box.querySelector('#ge');
    const go=()=>{
      const rwn=inp.value.trim(),nm=nz(rwn);
      if(!nm)return showErr(ge,'Errore: inserisci il nome.');
      if(!o.check(v,nm))return showErr(ge,'Errore: "'+rwn+' '+rw+'" non risulta qui. Per motivi di privacy non puoi accedere.');
      ACC.c=v;ACC.n=nm;ACC.adm=false;ACC.prof=false;saveAcc();done(o.mode);
    };
    box.querySelector('#gk').onclick=go;box.querySelector('#gx2').onclick=close;
    inp.onkeydown=e=>{if(isEnter(e)){e.preventDefault();go()}};inp.oninput=()=>{ge.textContent=''};inp.focus();
  };
  const askPw=()=>{
    box.innerHTML='<h3>Password</h3><p class="mut">Inserisci la password per continuare.</p><div class="row"><input id="gp" type="password" placeholder="Password" autocomplete="off" enterkeyhint="done"></div><p id="ge" class="err"></p><div class="row"><button class="sec" id="gb">← Indietro</button><button id="gk">Conferma</button></div>';
    const inp=box.querySelector('#gp'),ge=box.querySelector('#ge');
    const go=async()=>{
      if(!await checkAdmin(inp.value,box.querySelector('#gk'),ge))return;
      ACC.adm=true;ACC.c='';ACC.n='';ACC.prof=false;saveAcc();
      done(o.mode);
    };
    box.querySelector('#gk').onclick=go;box.querySelector('#gb').onclick=()=>ask('s');
    inp.onkeydown=e=>{if(isEnter(e)){e.preventDefault();go()}};inp.oninput=()=>{ge.textContent=''};inp.focus();
  };
  ov.onclick=e=>{if(e.target===ov)close()};
  ask0();
}
function cambiaNome(){
  const had=ACC.c||ACC.adm||ACC.prof;
  ACC={c:'',n:'',adm:false,prof:false,ok:[]};saveAcc();
  if(S.li!=null&&S.show!==false){S.show=false;rl()}
  const ok=$('#lsuccess');
  if(ok){ok.textContent=had?'Nome azzerato: al prossimo accesso ti verrà richiesto il cognome ✓':'Non c\'è nessun cognome inserito al momento.';ok.classList.remove('success');void ok.offsetWidth;ok.classList.add('success')}
}
function selL(i,mode){
  const L=ld(K.l)[i];if(!L)return;
  if(ACC.adm||profOk(L.p))return useL(i,mode==='view');
  if(ACC.prof)return denied('questa lista','visualizzarla',()=>selL(i,mode));
  if(ACC.c){
    if(L.s.some(x=>hit(x,ACC.c,ACC.n)))return useL(i,mode==='view');
    return denied('questa lista','visualizzarla',()=>selL(i,mode));
  }
  gate({mode,
    pcheck:v=>cm({c:L.p||''},v),
    check:(v,nm)=>L.s.some(x=>hit(x,v,nm)),
    errMsg:n=>'Errore: il cognome "'+n+'" non risulta in questa lista. Per motivi di privacy non puoi visualizzarla.',
    onOk:act=>useL(i,act==='view')});
}
function adminCard(i){
  const ov=document.createElement('div');ov.className='ov';
  ov.innerHTML='<div class="card delete-card gate"><h3>Bentornato Mirko 👋</h3><p class="mut">Cosa vuoi fare?</p><div class="row"><button id="gv">Visualizza lista</button><button class="sec" id="gm">Modifica probabilità</button></div><div class="row"><button class="sec" id="gc">Chiudi</button></div></div>';
  document.body.appendChild(ov);
  ov.querySelector('#gv').onclick=()=>{ov.remove();useL(i,true)};
  ov.querySelector('#gm').onclick=()=>{ov.remove();probCard(i)};
  ov.querySelector('#gc').onclick=()=>ov.remove();
  ov.onclick=e=>{if(e.target===ov)ov.remove()};
}
function lmenu(el,i){
  if(ACC.adm)return adminCard(i);
  document.querySelectorAll('.menu').forEach(x=>x.remove());
  const d=document.createElement('div');d.className='menu';
  d.innerHTML='<button>Visualizza lista</button>';
  d.onclick=e=>{e.stopPropagation();d.remove();selL(i,'view')};
  el.parentNode.appendChild(d);
}
const inCal=(c,v,nm)=>c.cols.some(k=>k.s.some(x=>hit(x,v,nm)));
const calOk=c=>ACC.adm||profOk(c.prof)||ACC.ok.includes(c.id)||(ACC.c&&inCal(c,ACC.c,ACC.n));
function denied(what,verb,retry){
  const ov=document.createElement('div');ov.className='ov';
  ov.innerHTML='<div class="card delete-card gate"><h3>Accesso negato</h3><p>Il cognome "<b></b>" non è presente in '+what+'. Per motivi di privacy non puoi '+verb+'.</p><div class="row"><button class="sec" id="gc">Chiudi</button><button id="gn">Cambia cognome</button></div></div>';
  ov.querySelector('b').textContent=cap(ACC.c||ACC.pf||'');
  document.body.appendChild(ov);
  ov.onclick=e=>{if(e.target===ov)ov.remove()};
  ov.querySelector('#gc').onclick=()=>ov.remove();
  ov.querySelector('#gn').onclick=()=>{ov.remove();ACC={c:'',n:'',adm:false,prof:false,ok:[]};saveAcc();retry()};
}
function calGate(c){
  if((ACC.c||ACC.prof)&&!ACC.adm)return denied('questo calendario','visualizzarlo',()=>calGate(c));
  gate({mode:'view',admin:false,pcheck:v=>cm({c:c.prof||''},v),check:(v,nm)=>inCal(c,v,nm),
    errMsg:n=>'Errore: il cognome "'+n+'" non risulta in questo calendario. Per motivi di privacy non puoi visualizzarlo.',
    onOk:()=>vedi(c.id,true)});
}
function probCard(i){
  if(!ld(K.l)[i])return;
  const ov=document.createElement('div');ov.className='ov';
  const rows=()=>ld(K.l)[i].s.map((x,j)=>'<label class="li"><input type="checkbox" class="pc" value="'+j+'"><span>'+esc(x.n)+' '+esc(x.c)+'</span>'+(x.d?'<span class="tag">DSA</span>':'')+'<small class="mut" style="margin-left:auto">'+(x.r?x.r[0]+' – '+x.r[1]:'predefinito')+'</small></label>').join('');
  ov.innerHTML='<div class="card delete-card gate prob"><h3>Modifica probabilità</h3><p class="mut" style="font-size:.85rem;margin:4px 0">Numeri bassi: interrogati prima. Numeri alti: interrogati dopo. Predefinito: da 0 a 1 (DSA: da 0,7 a 1,7).</p><div class="row prange" style="margin:8px 0"><span>Da</span><input type="number" id="pa" min="0" step="0.1" value="0" style="width:90px"><span>a</span><input type="number" id="pb" min="1" step="0.1" value="1" style="width:90px"></div><div class="row small" style="margin:4px 0"><button class="sec" id="pt">Seleziona / deseleziona tutti</button></div><div class="prob-list">'+rows()+'</div><p id="pe" class="err"></p><p id="ps" class="success"></p><div class="row"><button class="sec" id="px">Chiudi</button><button class="sec" id="pr">Ripristina</button><button id="po">Applica</button></div></div>';
  document.body.appendChild(ov);
  const pe=ov.querySelector('#pe'),pl=ov.querySelector('.prob-list'),sel=()=>[...ov.querySelectorAll('.pc:checked')].map(x=>+x.value);
  let tm=null;
  const fin=(LL,m)=>{
    sv(K.l,LL);
    if(S.li===i){S.studs=LL[i].s.map(x=>({...x})).sort((a,b)=>a.c.localeCompare(b.c,'it')||a.n.localeCompare(b.n,'it'));rl()}
    pl.innerHTML=rows();
    const ps=ov.querySelector('#ps');ps.textContent=m+' ✓';ps.classList.remove('success');void ps.offsetWidth;ps.classList.add('success');
    clearTimeout(tm);tm=setTimeout(()=>{ps.textContent=''},2500);
  };
  ov.onclick=e=>{if(e.target===ov)ov.remove()};
  ov.querySelector('#px').onclick=()=>ov.remove();
  ov.querySelector('#pt').onclick=()=>{const c=[...ov.querySelectorAll('.pc')],on=c.some(x=>!x.checked);c.forEach(x=>{x.checked=on})};
  ov.querySelector('#po').onclick=()=>{
    pe.textContent='';
    const a=parseFloat(ov.querySelector('#pa').value),b=parseFloat(ov.querySelector('#pb').value),s=sel();
    if(isNaN(a)||isNaN(b))return showErr(pe,'Errore: inserisci i due numeri.');
    if(a<0)return showErr(pe,'Errore: il numero minimo non può essere minore di 0.');
    if(b<1)return showErr(pe,'Errore: il numero massimo non può essere minore di 1.');
    if(a>b)return showErr(pe,'Errore: il numero minimo non può essere maggiore del massimo.');
    if(!s.length)return showErr(pe,'Errore: seleziona almeno uno studente.');
    const LL=ld(K.l);s.forEach(j=>{LL[i].s[j].r=[a,b]});fin(LL,'Probabilità aggiornate per '+s.length+(s.length==1?' studente':' studenti'));
  };
  ov.querySelector('#pr').onclick=()=>{
    pe.textContent='';
    const LL=ld(K.l);LL[i].s.forEach(x=>{delete x.r});
    fin(LL,'Tutti gli studenti sono tornati ai valori predefiniti');
  };
}
