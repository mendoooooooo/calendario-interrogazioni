// Funzione serverless di Vercel: legge e salva i dati del sito su Upstash Redis.
// Quando un calendario riceve una nuova modifica, manda una mail alla prof (se la sua mail è stata inserita).
const { cmd, dbOk, profKey, allMails, sendMail, cap, dl, esc, calName, checkKey } = require('./_lib');

/* descrizione di una voce di "Modifiche effettuate" */
function descr(m) {
  const nm = x => (x.n ? x.n + ' ' : '') + x.c;
  if (m.t === 'rem') return { t: 'Giorni rimossi', r: (m.days || [m.day]).map(d => 'Rimosso: ' + dl(d) + ' (interrogazioni riprogrammate)') };
  if (m.t === 'mv') return { t: 'Spostamento studenti', r: m.items.map(x => nm(x) + ' → ' + dl(x.to)) };
  if (m.t === 'mvd') return { t: 'Spostamento da ' + dl(m.from), r: m.items.map(x => nm(x) + ' → ' + dl(x.to) + (x.rnd ? ' (data casuale)' : '')) };
  if (m.t === 'add') return { t: 'Aggiunto il giorno ' + dl(m.day), r: m.items.map(x => nm(x) + ' → ' + dl(m.day) + ' (prima: ' + dl(x.from) + ')') };
  return { t: 'Scambio', r: [(m.n1 ? m.n1 + ' ' : '') + m.c1 + ' → ' + dl(m.d1), (m.n2 ? m.n2 + ' ' : '') + m.c2 + ' → ' + dl(m.d2)] };
}

function profMail(c, nuove) {
  const ds = nuove.map(descr);
  const subject = 'Calendario di ' + calName(c) + ' modificato';
  const tab = c.cols.map(k => dl(k.data) + ': ' + k.s.map(x => x.n + ' ' + x.c).join(', '));
  const text = 'Gentile prof. ' + cap(c.prof || '') + ',\n\nil calendario delle interrogazioni di ' + calName(c) + ' è stato modificato:\n\n'
    + ds.map(d => '• ' + d.t + '\n' + d.r.map(r => '   ' + r).join('\n')).join('\n\n')
    + '\n\nCalendario aggiornato:\n' + tab.join('\n') + '\n\nCalendario Interrogazioni Programmate\nhttps://calendario-interrogazioni.vercel.app';
  const html = '<div style="font-family:Arial,sans-serif;font-size:15px;color:#0c2a4a;line-height:1.5">'
    + '<p>Gentile prof. ' + esc(cap(c.prof || '')) + ',</p><p>il calendario delle interrogazioni di <b>' + esc(calName(c)) + '</b> è stato modificato:</p>'
    + ds.map(d => '<p style="margin:10px 0 4px"><b>' + esc(d.t) + '</b></p><ul style="margin:0">' + d.r.map(r => '<li>' + esc(r) + '</li>').join('') + '</ul>').join('')
    + '<p style="margin-top:16px"><b>Calendario aggiornato</b></p><table style="border-collapse:collapse;font-size:14px">'
    + c.cols.map(k => '<tr><td style="padding:4px 12px 4px 0;white-space:nowrap;vertical-align:top"><b>' + esc(dl(k.data)) + '</b></td><td style="padding:4px 0">' + esc(k.s.map(x => x.n + ' ' + x.c).join(', ')) + '</td></tr>').join('')
    + '</table><p style="color:#6b7280;font-size:13px">Calendario Interrogazioni Programmate · <a href="https://calendario-interrogazioni.vercel.app">apri il calendario</a></p></div>';
  return { subject, text, html };
}

/* confronta i calendari prima/dopo il salvataggio e avvisa le prof delle nuove modifiche */
async function avvisaProf(o, b) {
  const prima = new Map((o.c || []).map(c => [c.id, (c.log || []).length]));
  // solo modifiche nuove davvero: in più di quelle già salvate E fatte nelle ultime 12 ore
  // (così un dispositivo rimasto offline che sincronizza modifiche di giorni prima non fa partire mail;
  // 12 ore di margine per i telefoni con l'orologio un po' sbagliato)
  const recenti = c => (c.log || []).slice(prima.get(c.id)).filter(m => m.ts && Math.abs(Date.now() - m.ts) < 12 * 60 * 60 * 1000);
  const daAvvisare = (b.c || []).filter(c => !c.pending && c.prof && prima.has(c.id) && (c.log || []).length > prima.get(c.id) && recenti(c).length);
  if (!daAvvisare.length) return;
  const mails = await allMails();
  await Promise.all(daAvvisare.map(async c => {
    const to = mails[profKey(c.prof)];
    if (!to) return;
    try { await sendMail({ to, ...profMail(c, recenti(c)) }); } catch (e) { console.error('mail prof', e); }
  }));
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!checkKey(req, res)) return;
  if (!dbOk()) {
    return res.status(500).json({ error: 'database non collegato al progetto' });
  }
  try {
    if (req.method === 'GET') {
      const d = await cmd(['GET', 'ci_data']);
      return res.status(200).json(d ? JSON.parse(d) : {});
    }
    if (req.method === 'POST') {
      const b = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const old = await cmd(['GET', 'ci_data']);
      const o = old ? JSON.parse(old) : {};
      if (o.v && b.v < o.v) return res.status(409).json(o); // sul server c'è una versione più nuova
      await cmd(['SET', 'ci_data', JSON.stringify(b)]);
      // l'avviso alla prof non deve mai bloccare il salvataggio: al massimo 8 secondi, errori ignorati
      try { await Promise.race([avvisaProf(o, b), new Promise(r => setTimeout(r, 8000))]); } catch (e) { console.error('avviso prof', e); }
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'metodo non consentito' });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
};
module.exports.profMail = profMail;
