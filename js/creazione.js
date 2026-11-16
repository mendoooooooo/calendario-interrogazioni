/* creazione liste */
/* creazione */
function crea(m,keep){
  if(!keep||S.mat!==m)S={mat:m,studs:[],cfg:null,li:null,show:true,prof:''};
  rt('crea',[m,1]);
  const l=ld(K.l);
  show(`<h2>Nuovo calendario: ${T(m)}</h2><div class="card create-head"><button class="back-circle" title="Torna indietro" onclick="home('crea')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg></button><h3>Aggiungi studenti</h3>
  <div class="row" style="margin:8px 0"><input id="n" placeholder="Nome" onkeydown="kS(event)"><input id="c" placeholder="Cognome" onkeydown="kS(event)"><label class="chk"><input type="checkbox" id="d" onkeydown="kS(event)"> DSA</label><button id="ab" onclick="addS()">Aggiungi</button></div><div class="row" id="emr" hidden style="margin:0 0 8px"><input id="em" type="email" autocomplete="off" placeholder="Email dello studente (facoltativa)" onkeydown="kS(event)"><button class="sec" id="emx" hidden onclick="S.emDel=1;$('#em').value='';$('#em').placeholder='Email verrà tolta: premi Salva';this.hidden=true">Togli email</button></div><p id="serr" class="form-err"></p>
  <ol id="ls"></ol>
  <div class="row pr" style="margin:10px 0"><b>Prof.</b><input id="pf" placeholder="Cognome della docente" autocomplete="off" oninput="S.prof=this.value;rl();pfeUpd()"><input id="pfe" type="email" autocomplete="off" placeholder="Email della docente (facoltativa)" oninput="$('#lerr').textContent=''"><button class="sec" id="pfx" hidden onclick="S.pfDel=1;$('#pfe').value='';$('#pfe').placeholder='Email della docente verrà tolta: premi Salva';this.hidden=true">Togli email</button></div>
  <div class="row"><input id="ln" placeholder="Nome della lista" enterkeyhint="done" oninput="$('#lerr').textContent='';snewUpd()" onkeydown="if(isEnter(event)){event.preventDefault();saveL()}"><button onclick="saveL()">Salva</button><button class="sec" id="snew" hidden onclick="saveL(true)">Salva come nuova lista</button></div><p id="cur" class="mut" style="margin:0"></p><p id="lerr" class="err"></p><p id="lsuccess" class="success"></p></div>
  <div class="card" id="sl" hidden></div>
  <div class="row"><button class="sec" onclick="home('crea')">← Indietro</button><button class="sec" onclick="cambiaNome()">Cambia nome</button><button onclick="cfg()">Continua</button></div>`);
  rl();rsl();
  if(S.li!=null){const x=ld(K.l)[S.li];if(x)$('#ln').value=x.nome}
  {const pf=$('#pf');if(pf)pf.value=S.prof||''}
  pfeUpd();
}
function pfeUpd(){const x=$('#pfe');if(!x)return;S.pfDel=0;const m=(S.prof||'').trim()&&MAILS[mkP(S.prof)];x.placeholder=m?'Email docente: '+m+' (scrivi per cambiarla)':'Email della docente (facoltativa)';const b=$('#pfx');if(b)b.hidden=!m}
function snewUpd(){const b=$('#snew'),i=$('#ln');if(!b||!i)return;const k=i.value.trim().toLowerCase();b.hidden=!(k&&ld(K.l).some(x=>x.nome.trim().toLowerCase()===k))}
function rsl(){
  snewUpd();
  const l=ld(K.l),b=$('#sl'),cu=$('#cur');
  if(cu)cu.textContent=(S.li!=null&&l[S.li])?`Stai modificando la lista "${l[S.li].nome}".`:'Lista non ancora salvata.';
  if(!b)return;
  b.hidden=!l.length;
  b.innerHTML='<h3>Oppure usa una lista salvata</h3><div class="row">'+l.map((x,i)=>`<span class="lb"><button class="sec${i===S.li?' sel okg':''}" onclick="selL(${i},'sel')">${i===S.li?'✓ ':''}${esc(x.nome)} (${x.s.length} ${x.s.length==1?'studente':'studenti'})</button><button class="lbd" title="Altro" onclick="event.stopPropagation();lmenu(this,${i})"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg></button><button class="x" title="Elimina lista" onclick="confL(${i})">🗑</button></span>`).join('')+'</div>';
}
function confL(i){
  const o=document.createElement('div');o.className='ov';
  o.innerHTML=`<div class="card delete-card"><h3>Sei sicuro di voler cancellare la lista "${esc(ld(K.l)[i].nome)}"?</h3><p class="mut">I calendari già creati non vengono toccati.</p><div class="row"><button class="sec" id="no">Annulla</button><button class="danger" id="si">Conferma eliminazione</button></div></div>`;
  document.body.appendChild(o);
  o.querySelector('#no').onclick=()=>o.remove();
  o.querySelector('#si').onclick=()=>{const l=ld(K.l);l.splice(i,1);sv(K.l,l);if(S.li===i)S.li=null;else if(S.li>i)S.li--;o.remove();rsl()};
}
function rl(){
  if(S.show===false){
    const nm=(ld(K.l)[S.li]||{}).nome||'',n=S.studs.length;
    $('#ls').innerHTML=`<li class="li hid">🔒<span>Lista "${esc(nm)}" selezionata (${n} ${n==1?'studente':'studenti'}). I nomi sono nascosti: usa ⋮ → "Visualizza lista" per vederli.</span></li>`;return;
  }
  $('#ls').innerHTML=((S.prof||'').trim()?'<li class="li prof">Prof. '+esc(cap(S.prof))+(MAILS[mkP(S.prof)]?' <span class="tag" title="Email: '+esc(MAILS[mkP(S.prof)])+'">✉️</span>':'')+'</li>':'')+S.studs.map((s,i)=>`<li class="li"><b>${i+1}</b><span>${esc(s.n)} ${esc(s.c)}</span>${s.d?'<span class="tag">DSA</span>':''}${MAILS[mkS(s.c,s.n)]?'<span class="tag" title="Email: '+esc(MAILS[mkS(s.c,s.n)])+'">✉️</span>':''}<button class="ed" title="Modifica" onclick="editS(${i})">✎</button><button class="x" onclick="S.studs.splice(${i},1);rl()">✕</button></li>`).join('');
}
function kS(e){
  if(!isEnter(e))return;e.preventDefault();
  if(e.target.id==='em')return addS();
  if(e.target.id==='n')return $('#c').focus();
  if(e.target.id==='d'){if(!$('#n').value.trim())return $('#n').focus();if(!$('#c').value.trim())return $('#c').focus();return addS()}
  if(!$('#n').value.trim())return $('#n').focus();
  if(!$('#c').value.trim())return;
  addS();
}
const sortS=()=>S.studs.sort((a,b)=>a.c.localeCompare(b.c,'it')||a.n.localeCompare(b.n,'it'));
function editS(i){
  const t=S.studs[i];
  if(S.edit){S.studs.push(S.edit);sortS()}
  S.studs.splice(S.studs.indexOf(t),1);
  S.edit=t;
  $('#n').value=t.n;$('#c').value=t.c;$('#d').checked=t.d;
  S.emDel=0;{const m=MAILS[mkS(t.c,t.n)],em=$('#em');$('#emr').hidden=false;em.value='';em.placeholder=m?'Email attuale: '+m+' (scrivi per cambiarla)':'Email dello studente (facoltativa)';$('#emx').hidden=!m}
  $('#ab').textContent='Salva';rl();$('#n').focus();
}
function addS(){
  const n=$('#n').value.trim(),c=$('#c').value.trim(),e=$('#serr');
  if(S.show===false){if(e){e.textContent='Errore: la lista è nascosta. Usa ⋮ → "Visualizza lista" prima di modificarla.';e.classList.remove('form-err');void e.offsetWidth;e.classList.add('form-err')}return}
  if(!n||!c){if(e){e.textContent=!n&&!c?'Errore: non hai inserito nè il nome nè il cognome':!n?'Errore: non hai inserito il nome':'Errore: non hai inserito il cognome';e.classList.remove('form-err');void e.offsetWidth;e.classList.add('form-err')}if(!n)return $('#n').focus();return $('#c').focus()}
  const em=$('#em'),ev=em&&!$('#emr').hidden?em.value.trim().toLowerCase():'',was=S.edit;
  if(ev&&!okMail(ev)){if(e){e.textContent='Errore: l\'email non è valida.';e.classList.remove('form-err');void e.offsetWidth;e.classList.add('form-err')}return em.focus()}
  if(was){
    const ok=mkS(was.c,was.n),nk=mkS(cap(c),cap(n));
    if(ev||S.emDel||(ok!==nk&&MAILS[ok]))setMail(nk,S.emDel&&!ev?'':ev,ok!==nk?ok:undefined).then(()=>rl()).catch(x=>{if(e){e.textContent='Errore nel salvataggio dell\'email: '+x.message;e.classList.remove('form-err');void e.offsetWidth;e.classList.add('form-err')}});
  }
  S.emDel=0;if($('#emr')){$('#emr').hidden=true;em.value=''}
  if(e)e.textContent='';
  S.studs.push({n:cap(n),c:cap(c),d:$('#d').checked,...(S.edit&&S.edit.r?{r:S.edit.r}:{})});sortS();
  S.edit=null;$('#ab').textContent='Aggiungi';
  $('#n').value=$('#c').value='';$('#d').checked=false;rl();$('#n').focus();
}
function errL(m){const e=$('#lerr');if(!e)return;e.textContent=m;e.classList.remove('err');void e.offsetWidth;e.classList.add('err')}
function saveL(nuova){
  if(S.edit)return errL('Errore: premi "Salva" sullo studente in modifica prima di salvare la lista.');
  if(!S.studs.length)return errL('Errore: aggiungi almeno uno studente prima di salvare la lista.');
  let nome=$('#ln').value.trim();
  if(!nome)return errL('Errore: inserisci il nome della lista.');
  const p=cap(($('#pf')||{}).value||'');
  if(!p)return errL('Errore: inserisci il cognome della docente prima di salvare la lista.');
  const pe=(($('#pfe')||{}).value||'').trim().toLowerCase();
  if(pe&&!okMail(pe))return errL('Errore: l\'email della docente non è valida.');
  S.prof=p;
  if(!pe&&S.pfDel)setMail(mkP(p),'').then(()=>{pfeUpd();rl()}).catch(x=>errL('Errore nel togliere l\'email della docente: '+x.message));
  if(pe)setMail(mkP(p),pe).then(()=>{const x=$('#pfe');if(x)x.value='';pfeUpd();rl()}).catch(x=>errL('Errore nel salvataggio dell\'email della docente: '+x.message));
  const l=ld(K.l),kk=x=>x.trim().toLowerCase(),idx=l.findIndex(x=>kk(x.nome)===kk(nome));let msg;
  if(nuova){
    const b=nome;let n=2;while(l.some(x=>kk(x.nome)===kk(b+' ('+n+')')))n++;
    nome=b+' ('+n+')';l.push({nome,s:S.studs,p});S.li=l.length-1;msg='Salvata come nuova lista: "'+nome+'"';
  }else if(idx>=0){
    if(idx!==S.li)return errL(`Errore: esiste già una lista chiamata "${nome}". Scegli un altro nome oppure usa "Salva come nuova lista".`);
    l[idx]={nome,s:S.studs,p};msg='Lista aggiornata!';
  }else{l.push({nome,s:S.studs,p});S.li=l.length-1;msg='Lista salvata!'}
  $('#lerr').textContent='';$('#ln').value=nome;
  sv(K.l,l);rsl();rl();
  const ok=$('#lsuccess');if(ok){ok.textContent=msg+' ✓';ok.classList.remove('success');void ok.offsetWidth;ok.classList.add('success')}
  const b=$('#sl');b.classList.remove('hl');void b.offsetWidth;b.classList.add('hl');b.scrollIntoView({behavior:'smooth',block:'center'});
}
function useL(i,show){S.li=i;S.show=!!show;S.prof=ld(K.l)[i].p||'';{const pf=$('#pf');if(pf)pf.value=S.prof}pfeUpd();$('#ln').value=ld(K.l)[i].nome;S.studs=ld(K.l)[i].s.map(x=>({...x})).sort((a,b)=>a.c.localeCompare(b.c,'it')||a.n.localeCompare(b.n,'it'));rl();rsl();window.scrollTo({top:0,behavior:'smooth'})}
