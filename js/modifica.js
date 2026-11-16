/* Modifica tabella e avvio */
/* ===== Modifica tabella ===== */
function applyMoves(c,mv){
  const set=new Set(mv.map(m=>m.s));
  c.cols.forEach(k=>{k.s=k.s.filter(x=>!set.has(x))});
  mv.forEach(m=>m.to.s.push(m.s));
  c.cols=c.cols.filter(k=>k.s.length); /* colonne rimaste vuote eliminate, le altre non cambiano */
}
/* data casuale tra quelle scelte; se il calendario è nato con preferenze le usa come pesi */
function pickRnd(c,x,ch){
  ch=ch.slice().sort((a,b)=>a-b);
  const p=(c.pl||[]).find(m=>m.n===x.n&&m.c===x.c);
  const w=ch.map((j,t)=>{
    if(!p)return 1;
    if(p.a)return ch.length-t;
    const r=p.ch.indexOf(c.cols[j].data);
    return r>=0?[8,4,2][r]||2:1;
  });
  let r=Math.random()*w.reduce((a,b)=>a+b,0);
  for(let t=0;t<ch.length;t++){r-=w[t];if(r<0)return ch[t]}
  return ch[ch.length-1];
}
/* assegna le nuove date distribuendo gli studenti il più possibile in modo uniforme tra le date scelte */
function spread(c,its){
  const load={},res=new Array(its.length);
  its.forEach((it,k)=>{if(it.ch.length===1){res[k]=it.ch[0];load[it.ch[0]]=(load[it.ch[0]]||0)+1}});
  const rnd=its.map((_,k)=>k).filter(k=>its[k].ch.length>1).sort((a,b)=>its[a].ch.length-its[b].ch.length||Math.random()-.5);
  rnd.forEach(k=>{
    const ch=its[k].ch.slice().sort((a,b)=>a-b);
    const mn=Math.min(...ch.map(j=>load[j]||0));
    const cand=ch.filter(j=>(load[j]||0)===mn);
    const j=cand.length>1?pickRnd(c,its[k].x,cand):cand[0];
    res[k]=j;load[j]=(load[j]||0)+1;
  });
  return res;
}
function tabCard(id){
  const ov=document.createElement('div');ov.className='ov';
  ov.innerHTML='<div class="card delete-card gate prob"></div>';
  document.body.appendChild(ov);
  const box=ov.firstChild,cal=()=>ld(K.c).find(x=>x.id===id),q=s=>box.querySelector(s);
  const dl=d=>cap(DN[new Date(d+'T12:00:00').getDay()])+' '+fmt(d);
  const ds=d=>cap(DN[new Date(d+'T12:00:00').getDay()]).slice(0,3)+' '+fmtShort(d);
  let Q=[],M={},src=0,busy=false;
  ov.onclick=e=>{if(e.target===ov&&!busy)ov.remove()};
  const top=()=>{
    busy=false;Q=[];M={};
    box.innerHTML='<h3>Modifica tabella</h3><p class="mut">Cosa vuoi fare?</p><div class="row"><button id="t1">Sposta studenti</button><button id="t2">Sposta da una data</button></div><div class="row"><button class="sec" id="tx">Chiudi</button></div>';
    q('#t1').onclick=o1;q('#t2').onclick=o2;q('#tx').onclick=()=>ov.remove();
  };
  /* ---- 1: scelgo gli studenti, poi la loro nuova data ---- */
  const o1=()=>{
    const c=cal();if(!c)return ov.remove();
    busy=Q.length>0;
    const inQ=(ci,ri)=>Q.some(z=>z.ci===ci&&z.ri===ri);
    box.innerHTML='<h3>Sposta studenti</h3><p class="mut" style="font-size:.85rem;margin:4px 0">Tocca uno studente, poi scegli la nuova data.</p><div class="prob-list">'
     +c.cols.map((k,ci)=>k.s.map((x,ri)=>'<div class="li vd" data-c="'+ci+'" data-r="'+ri+'"><span>'+esc(x.n)+' '+esc(x.c)+'</span>'+(inQ(ci,ri)?'<span class="tag">spostato</span>':'')+'<small class="mut" style="margin-left:auto">'+ds(k.data)+'</small></div>').join('')).join('')+'</div>'
     +(Q.length?'<p style="margin:8px 0 2px;text-align:left"><b>Spostamenti:</b></p><div class="prob-list" style="max-height:20vh">'+Q.map((z,i)=>{const x=c.cols[z.ci].s[z.ri];return '<div class="li"><span>'+esc(x.n)+' '+esc(x.c)+' → '+dl(c.cols[z.to].data)+'</span><button class="x" data-q="'+i+'">✕</button></div>'}).join('')+'</div>':'')
     +'<p id="te" class="err"></p><div class="row"><button class="sec" id="bx">← Indietro</button><button id="bk"'+(Q.length?'':' disabled')+'>Conferma</button></div>';
    const ls=box.querySelectorAll('.prob-list');
    ls[0].onclick=e=>{const t=e.target.closest('.vd');if(t)o1b(+t.dataset.c,+t.dataset.r)};
    if(ls[1])ls[1].onclick=e=>{const b=e.target.closest('[data-q]');if(b){Q.splice(+b.dataset.q,1);o1()}};
    q('#bx').onclick=top;
    q('#bk').onclick=()=>{
      const all=ld(K.c),cc=all.find(x=>x.id===id);if(!cc)return ov.remove();
      const mv=Q.map(z=>({s:cc.cols[z.ci].s[z.ri],to:cc.cols[z.to]}));
      const items=mv.map(m=>({n:m.s.n,c:m.s.c,to:m.to.data}));
      applyMoves(cc,mv);
      (cc.log=cc.log||[]).push({t:'mv',ts:Date.now(),dev:devName(),items});
      sv(K.c,all);ov.remove();vedi(id,true);
    };
  };
  const o1b=(ci,ri)=>{
    const c=cal(),x=c.cols[ci].s[ri],ex=Q.find(z=>z.ci===ci&&z.ri===ri);
    box.innerHTML='<h3>'+esc(x.n)+' '+esc(x.c)+'</h3><p class="mut" style="font-size:.85rem;margin:4px 0">Ora: '+dl(c.cols[ci].data)+'. Scegli la nuova data.</p><div class="prob-list">'
     +c.cols.map((k,j)=>j===ci?'':'<label class="li"><input type="radio" name="nd" value="'+j+'"'+(ex&&ex.to===j?' checked':'')+'><span>'+dl(k.data)+'</span></label>').join('')
     +'</div><p id="te" class="err"></p><div class="row"><button class="sec" id="bx">← Indietro</button><button id="bk">Continua</button></div>';
    q('#bx').onclick=o1;
    q('#bk').onclick=()=>{
      const r=box.querySelector('input:checked');if(!r)return showErr(q('#te'),'Errore: scegli una data.');
      Q=Q.filter(z=>!(z.ci===ci&&z.ri===ri));Q.push({ci,ri,to:+r.value});o1();
    };
  };
  /* ---- 2: scelgo una data, poi dove mettere ognuno dei suoi studenti ---- */
  const o2=()=>{
    const c=cal();if(!c)return ov.remove();
    busy=false;M={};
    box.innerHTML='<h3>Sposta da una data</h3><p class="mut" style="font-size:.85rem;margin:4px 0">Scegli la data da cui spostare gli studenti.</p><div class="prob-list">'
     +c.cols.map((k,j)=>'<label class="li"><input type="radio" name="sd" value="'+j+'"><span>'+dl(k.data)+'</span><small class="mut" style="margin-left:auto">'+k.s.length+' '+(k.s.length==1?'studente':'studenti')+'</small></label>').join('')
     +'</div><p id="te" class="err"></p><div class="row"><button class="sec" id="bx">← Indietro</button><button id="bk">Continua</button></div>';
    q('#bx').onclick=top;
    q('#bk').onclick=()=>{const r=box.querySelector('input:checked');if(!r)return showErr(q('#te'),'Errore: scegli una data.');src=+r.value;M={};o2b()};
  };
  const lbl=a=>!a||!a.length?'Seleziona data':a.length===1?ds(cal().cols[a[0]].data):'🎲 Casuale ('+a.length+' date)';
  const o2b=()=>{
    const c=cal();if(!c)return ov.remove();
    busy=true;const k=c.cols[src];
    box.innerHTML='<h3>'+dl(k.data)+'</h3><p class="mut" style="font-size:.85rem;margin:4px 0">Per ogni studente scegli la nuova data: una sola = fissa, più date = scelta a caso, distribuendo gli studenti tra quelle date.</p><div class="prob-list">'
     +k.s.map((x,i)=>'<div class="li"><span>'+esc(x.n)+' '+esc(x.c)+'</span><button class="'+(M[i]&&M[i].length?'okg':'sec')+' sb" data-i="'+i+'" style="margin-left:auto;padding:7px 14px;font-size:.8rem">'+lbl(M[i])+'</button></div>').join('')
     +'</div><p id="te" class="err"></p><div class="row"><button class="sec" id="bx">← Indietro</button><button id="bk">Conferma</button></div>';
    box.querySelector('.prob-list').onclick=e=>{const b=e.target.closest('.sb');if(b)pickM(+b.dataset.i)};
    q('#bx').onclick=o2;
    q('#bk').onclick=()=>{
      const ks=Object.keys(M).filter(i=>M[i]&&M[i].length);
      if(!ks.length)return showErr(q('#te'),'Errore: scegli la nuova data per almeno uno studente.');
      const all=ld(K.c),cc=all.find(x=>x.id===id);if(!cc)return ov.remove();
      const from=cc.cols[src].data,mv=[],items=[];
      const its=ks.map(i=>({x:cc.cols[src].s[i],ch:M[i]})),js=spread(cc,its);
      its.forEach((it,t)=>{const j=js[t];mv.push({s:it.x,to:cc.cols[j]});items.push({n:it.x.n,c:it.x.c,to:cc.cols[j].data,rnd:it.ch.length>1})});
      applyMoves(cc,mv);
      (cc.log=cc.log||[]).push({t:'mvd',ts:Date.now(),dev:devName(),from,items});
      sv(K.c,all);ov.remove();vedi(id,true);
    };
  };
  const pickM=i=>{
    const c=cal(),x=c.cols[src].s[i],cur=M[i]||[];
    box.innerHTML='<h3>'+esc(x.n)+' '+esc(x.c)+'</h3><p class="mut" style="font-size:.85rem;margin:4px 0">Scegli una o più date. Con più date la nuova data è casuale'+(c.viaPref?', tenendo conto delle preferenze':'')+'.</p><div class="prob-list">'
     +c.cols.map((k,j)=>j===src?'':'<label class="li"><input type="checkbox" class="rc" value="'+j+'"'+(cur.includes(j)?' checked':'')+'><span>'+dl(k.data)+'</span></label>').join('')
     +'</div><div class="row"><button class="sec" id="bx">Annulla</button><button id="bk">Conferma</button></div>';
    q('#bx').onclick=o2b;
    q('#bk').onclick=()=>{const s=[...box.querySelectorAll('.rc:checked')].map(z=>+z.value);if(s.length)M[i]=s;else delete M[i];o2b()};
  };
  top();
}
/* ===== Aggiungi giorno di interrogazione =====
   1) scelgo la nuova data  2) scelgo gli studenti da spostare in quella data (a mano o a caso).
   Serve almeno uno studente: un giorno vuoto verrebbe eliminato alla modifica successiva. */
function addCard(id){
  const ov=document.createElement('div');ov.className='ov';
  ov.innerHTML='<div class="card delete-card gate prob"></div>';
  document.body.appendChild(ov);
  const box=ov.firstChild,cal=()=>ld(K.c).find(x=>x.id===id),q=s=>box.querySelector(s);
  const dl=d=>cap(DN[new Date(d+'T12:00:00').getDay()])+' '+fmt(d);
  const ds=d=>cap(DN[new Date(d+'T12:00:00').getDay()]).slice(0,3)+' '+fmtShort(d);
  let nd='',SEL=[];
  ov.onclick=e=>{if(e.target===ov)ov.remove()};
  const a1=()=>{
    const c=cal();if(!c)return ov.remove();
    box.innerHTML='<h3>Aggiungi giorno di interrogazione</h3><p class="mut" style="font-size:.85rem;margin:4px 0">Scegli la data da aggiungere al calendario.</p><input type="date" id="and" min="'+todayStr()+'" value="'+nd+'"><p id="adw" class="mut" style="margin:6px 0 0;font-size:.85rem"></p><p id="te" class="err"></p><div class="row"><button class="sec" id="bx">Annulla</button><button id="bk">Continua</button></div>';
    const inp=q('#and'),w=q('#adw');
    const upd=()=>{q('#te').textContent='';w.textContent=inp.value?dl(inp.value):''};
    inp.oninput=upd;upd();
    inp.onkeydown=e=>{if(isEnter(e)){e.preventDefault();q('#bk').click()}};
    q('#bx').onclick=()=>ov.remove();
    q('#bk').onclick=()=>{
      const v=inp.value,te=q('#te');
      if(!v)return showErr(te,'Errore: scegli una data.');
      if(v<todayStr())return showErr(te,'Errore: la data non può essere nel passato.');
      if(new Date(v+'T12:00:00').getDay()===0)return showErr(te,'Errore: il '+fmt(v)+' è una domenica.');
      if(c.cols.some(k=>k.data===v))return showErr(te,'Errore: il '+fmt(v)+' è già nel calendario.');
      if(nd!==v)SEL=[];
      nd=v;a2();
    };
    inp.focus();
  };
  const a2=()=>{
    const c=cal();if(!c)return ov.remove();
    const pp=c.pp||Math.max(1,...c.cols.map(k=>k.s.length));
    box.innerHTML='<h3>'+dl(nd)+'</h3><p class="mut" style="font-size:.85rem;margin:4px 0">Scegli gli studenti da spostare in questa data (almeno uno). Le date che restano senza studenti vengono tolte.</p><div class="row" style="margin:6px 0"><button class="sec" id="brn" style="padding:7px 14px;font-size:.8rem">🎲 Scegli '+pp+' a caso</button></div><div class="prob-list">'
     +c.cols.map((k,ci)=>k.s.map((x,ri)=>'<label class="li"><input type="checkbox" class="rc" value="'+ci+':'+ri+'"'+(SEL.includes(ci+':'+ri)?' checked':'')+'><span>'+esc(x.n)+' '+esc(x.c)+'</span><small class="mut" style="margin-left:auto">'+ds(k.data)+'</small></label>').join('')).join('')
     +'</div><p id="te" class="err"></p><div class="row"><button class="sec" id="bx">← Indietro</button><button id="bk">Conferma</button></div>';
    const rd=()=>{SEL=[...box.querySelectorAll('.rc:checked')].map(z=>z.value);q('#te').textContent=''};
    box.querySelectorAll('.rc').forEach(z=>{z.onchange=rd});
    q('#brn').onclick=()=>{
      const all=[...box.querySelectorAll('.rc')].map(z=>z.value);
      for(let i=all.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[all[i],all[j]]=[all[j],all[i]]}
      SEL=all.slice(0,pp);a2();
    };
    q('#bx').onclick=a1;
    q('#bk').onclick=()=>{
      rd();
      if(!SEL.length)return showErr(q('#te'),'Errore: scegli almeno uno studente da spostare nel nuovo giorno.');
      const all=ld(K.c),cc=all.find(x=>x.id===id);if(!cc)return ov.remove();
      if(cc.cols.some(k=>k.data===nd)){showErr(q('#te'),'Errore: questa data è già nel calendario.');return}
      const sel=SEL.map(v=>v.split(':').map(Number)).filter(([ci,ri])=>cc.cols[ci]&&cc.cols[ci].s[ri]);
      const col={data:nd,s:[]},mv=sel.map(([ci,ri])=>({s:cc.cols[ci].s[ri],to:col}));
      const items=sel.map(([ci,ri])=>({n:cc.cols[ci].s[ri].n,c:cc.cols[ci].s[ri].c,from:cc.cols[ci].data}));
      cc.cols.push(col);cc.cols.sort((a,b)=>a.data<b.data?-1:a.data>b.data?1:0);
      applyMoves(cc,mv);
      (cc.log=cc.log||[]).push({t:'add',day:nd,ts:Date.now(),dev:devName(),items});
      sv(K.c,all);ov.remove();vedi(id,true);
    };
  };
  a1();
}
function showLog(id){
  const c=ld(K.c).find(x=>x.id===id);if(!c)return;
  const L=c.log||[];
  const dl=d=>esc(cap(DN[new Date(d+'T12:00:00').getDay()]))+' '+fmt(d);
  const when=m=>{const t=m.ts||(typeof m.t==='number'?m.t:0);if(!t)return'';const d=new Date(t);
    return esc(cap(d.toLocaleDateString('it-IT',{weekday:'long'})))+' '+fmt(d)+' alle '+d.toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'})+(m.dev?' · '+esc(m.dev):'')};
  /* una riga = nome a sinistra, nuova data a destra (eventuale nota sotto la data) */
  const nm=(n,c)=>'<span>'+esc(n)+'</span> <span>'+esc(c)+'</span>';
  const lr=(n,v,note,lab)=>'<div class="lr"><span class="lr-n">'+n+'</span><span class="lr-a">'+(lab?'<i></i><b>'+lab+'</b>':'')+'<i class="h"></i></span><span class="lr-v">'+v+(note?'<small>'+note+'</small>':'')+'</span></div>';
  const row=(m,i)=>{
    let ti,sub='',rows='';
    if(m.t==='rem'){const ds=m.days||[m.day];ti=ds.length>1?'Giorni rimossi':'Giorno rimosso';sub='Riprogrammazione delle interrogazioni';rows=ds.map(d=>lr('Giorno rimosso',dl(d))).join('')}
    else if(m.t==='mv'){ti='Spostamento studenti';rows=m.items.map(x=>lr(nm(x.n,x.c),dl(x.to),'','NUOVA DATA')).join('')}
    else if(m.t==='mvd'){ti='Spostamento da una data';sub='Da '+dl(m.from);rows=m.items.map(x=>lr(nm(x.n,x.c),dl(x.to),x.rnd?'🎲 generata casualmente':'✋ scelta','NUOVA DATA')).join('')}
    else if(m.t==='add'){ti='Giorno aggiunto';sub='Nuovo giorno: '+dl(m.day);rows=m.items.map(x=>lr(nm(x.n,x.c),dl(m.day),'prima: '+dl(x.from),'NUOVA DATA')).join('')}
    else{ti='Scambio';rows=lr(m.n1?nm(m.n1,m.c1):esc(m.c1),dl(m.d1),'','NUOVA DATA')+lr(m.n2?nm(m.n2,m.c2):esc(m.c2),dl(m.d2),'','NUOVA DATA')}
    return '<div class="lg" style="animation-delay:'+(i*50)+'ms"><div class="log-n">'+(i+1)+'</div><div class="lg-b"><div class="log-t">'+ti+'</div>'+(sub?'<div class="lg-d">'+sub+'</div>':'')+(when(m)?'<div class="lg-t"><span>🕒 '+when(m)+'</span></div>':'')+'<div class="lg-rows">'+rows+'</div></div></div>';
  };
  const o=document.createElement('div');o.className='ov';
  o.innerHTML='<div class="log-card"><h3>Modifiche effettuate</h3><div class="log-list">'+(L.length?L.map(row).join(''):'<p class="log-empty">Nessuna modifica effettuata.</p>')+'</div><div class="row"><button class="sec" id="lb">← Indietro</button></div></div>';
  document.body.appendChild(o);
  o.querySelector('#lb').onclick=()=>o.remove();
  o.onclick=e=>{if(e.target===o)o.remove()};
}
function swap(id){
  const all=ld(K.c),c=all.find(x=>x.id===id),w=$('#werr'),st=[];
  c.cols.forEach((k,i)=>k.s.forEach((s,j)=>st.push([i,j,s])));
  const err=m=>{w.textContent=m;w.classList.remove('err');void w.offsetWidth;w.classList.add('err');return null};
  const find=(cs,ns,nid)=>{
    const q=cs.trim().toLowerCase(),nm=ns.trim().toLowerCase();
    if(!q)return err('Errore: inserisci i due cognomi.');
    let m=st.filter(x=>x[2].c.toLowerCase()===q);
    if(!m.length)m=st.filter(x=>(x[2].n+' '+x[2].c).toLowerCase()===q);
    if(!m.length)return err(`Errore: studente "${cs.trim()}" non trovato.`);
    if(m.length>1){
      const inp=$('#'+nid);inp.hidden=false;
      if(!nm){inp.focus();return err(`Errore: ci sono più studenti con cognome "${cs.trim()}": inserisci anche il nome.`)}
      m=m.filter(x=>x[2].n.toLowerCase()===nm);
      if(!m.length)return err(`Errore: nessuno studente "${ns.trim()} ${cs.trim()}" trovato.`);
      if(m.length>1)return err(`Errore: ci sono più studenti identici "${ns.trim()} ${cs.trim()}".`);
    }
    return m[0];
  };
  const p=find($('#a').value,$('#na').value,'na');if(!p)return;
  const q=find($('#b').value,$('#nb').value,'nb');if(!q)return;
  if(p[0]===q[0]&&p[1]===q[1])return err('Errore: hai scelto lo stesso studente due volte.');
  const t=c.cols[p[0]].s[p[1]],u=c.cols[q[0]].s[q[1]];
  c.cols[p[0]].s[p[1]]=u;c.cols[q[0]].s[q[1]]=t;
  (c.log=c.log||[]).push({c1:t.c,c2:u.c,n1:t.n,n2:u.n,d1:c.cols[q[0]].data,d2:c.cols[p[0]].data,t:Date.now(),dev:devName()});
  sv(K.c,all);vedi(id,true);
  const pk=p[0]+','+p[1],qk=q[0]+','+q[1];
  document.querySelectorAll('td').forEach(td=>{const a=td.dataset.c+','+td.dataset.r;if(a===pk||a===qk)td.classList.add('flash')});
}
document.body.insertAdjacentHTML('afterbegin','<div class="bg"><i class="bl" style="--k:.06;left:-12vmax;top:-10vmax;background:#22d3ee"></i><i class="bl" style="--k:-.09;right:-14vmax;top:12vmax;background:#f43f5e;animation-delay:-4s"></i><i class="bl" style="--k:.04;left:18vw;bottom:-18vmax;background:#facc15;animation-delay:-8s"></i><i class="glow"></i></div>');
addEventListener('pointermove',e=>{const s=document.documentElement.style;s.setProperty('--mx',e.clientX-innerWidth/2);s.setProperty('--my',e.clientY-innerHeight/2);s.setProperty('--gx',e.clientX+'px');s.setProperty('--gy',e.clientY+'px')});
document.body.insertAdjacentHTML('beforeend','<div id="sync" class="sync" hidden></div>');
loadServer().finally(()=>home());
