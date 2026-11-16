// Promemoria via mail: il giorno prima dell'interrogazione alle 14 (ora italiana);
// se l'interrogazione è di lunedì, la domenica alle 10.
// Vercel la richiama da solo (vedi vercel.json) più volte al giorno: manda solo quando è l'ora giusta
// e segna chi ha già ricevuto la mail, così nessuno la riceve due volte.
// Prova a mano dal browser: /api/promemoria?prova=<CRON_SECRET>  → manda una mail di prova a MAIL_USER (+ copia)
// e mostra chi riceverebbe il promemoria per domani, senza inviarlo.
const { cmd, dbOk, studKey, allMails, sendMail, cap, dl, esc, calName, romeNow, addDays } = require('./_lib');

function mailFor(x, c, day) {
  const others = c.cols.find(k => k.data === day).s.filter(y => y !== x).map(y => y.n + ' ' + y.c);
  const prof = c.prof ? ' con la prof. ' + cap(c.prof) : '';
  const quando = 'domani, ' + dl(day).toLowerCase();
  const subject = 'Promemoria: domani interrogazione di ' + cap(c.mat);
  const text = 'Ciao ' + x.n + ',\n\nti ricordiamo che ' + quando + ', sei in programma per l\'interrogazione di ' + cap(c.mat) + prof + '.\n'
    + (others.length ? '\nInterrogati nello stesso giorno: ' + others.join(', ') + '.\n' : '')
    + '\nIn bocca al lupo!\n\nCalendario Interrogazioni Programmate\nhttps://calendario-interrogazioni.vercel.app';
  const html = '<div style="font-family:Arial,sans-serif;font-size:15px;color:#0c2a4a;line-height:1.5">'
    + '<p>Ciao <b>' + esc(x.n) + '</b>,</p><p>ti ricordiamo che <b>' + esc(quando) + '</b> sei in programma per l\'interrogazione di <b>' + esc(cap(c.mat)) + '</b>' + esc(prof) + '.</p>'
    + (others.length ? '<p>Interrogati nello stesso giorno: ' + esc(others.join(', ')) + '.</p>' : '')
    + '<p>In bocca al lupo!</p><p style="color:#6b7280;font-size:13px">Calendario Interrogazioni Programmate · <a href="https://calendario-interrogazioni.vercel.app">apri il calendario</a></p></div>';
  return { subject, text, html };
}

/* chi va avvisato per il giorno "day": [{c, x, key, to}] */
async function chiAvvisare(day) {
  const raw = await cmd(['GET', 'ci_data']);
  const data = raw ? JSON.parse(raw) : {};
  const mails = await allMails();
  const out = [];
  for (const c of data.c || []) {
    if (c.pending || !Array.isArray(c.cols)) continue;
    const col = c.cols.find(k => k.data === day);
    if (!col) continue;
    for (const x of col.s) {
      const to = mails[studKey(x.c, x.n)];
      out.push({ c, x, to: to || null, key: c.id + '|' + studKey(x.c, x.n) });
    }
  }
  return out;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const secret = process.env.CRON_SECRET;
  const prova = req.query && req.query.prova;
  const auth = req.headers.authorization === 'Bearer ' + secret;
  if (!secret || !(auth || prova === secret)) return res.status(401).json({ error: 'non autorizzato' });
  if (!dbOk()) return res.status(500).json({ error: 'database non collegato al progetto' });
  try {
    const now = romeNow(), day = addDays(now.date, 1);
    const ora = new Date(day + 'T12:00:00Z').getUTCDay() === 1 ? 10 : 14; // lunedì → domenica alle 10
    const lista = await chiAvvisare(day);

    if (prova) {
      let test = 'inviata a ' + process.env.MAIL_USER + (process.env.MAIL_CC ? ' (copia a MAIL_CC)' : '');
      try {
        await sendMail({ to: process.env.MAIL_USER, subject: 'Prova promemoria – Calendario Interrogazioni',
          text: 'Se leggi questa mail, l\'invio dei promemoria funziona.\n\nDomani (' + dl(day) + ') sono in programma ' + lista.length + ' interrogazioni, '
            + lista.filter(z => z.to).length + ' con email.' });
      } catch (e) { test = 'ERRORE: ' + (e.message || e); }
      return res.status(200).json({
        mail_di_prova: test, ora_italiana: now.date + ' ore ' + now.h, domani: dl(day), invio_previsto_alle: ora + ':00',
        promemoria_per_domani: lista.map(z => ({ calendario: calName(z.c), studente: z.x.n + ' ' + z.x.c, email: z.to ? 'sì' : 'manca' })),
      });
    }

    if (now.h < ora || now.h >= 22) return res.status(200).json({ ok: true, saltato: 'non è ancora ora (ora italiana ' + now.h + ', invio dalle ' + ora + ')' });
    const sentKey = 'ci_sent:' + day, inviati = [], errori = [];
    for (const z of lista) {
      if (!z.to) continue;
      if (!(await cmd(['SADD', sentKey, z.key]))) continue; // già inviato
      try { await sendMail({ to: z.to, ...mailFor(z.x, z.c, day) }); inviati.push(z.x.n + ' ' + z.x.c); }
      catch (e) { await cmd(['SREM', sentKey, z.key]); errori.push(z.x.n + ' ' + z.x.c + ': ' + (e.message || e)); }
    }
    await cmd(['EXPIRE', sentKey, 60 * 60 * 24 * 7]);
    return res.status(200).json({ ok: true, giorno: day, inviati, errori });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
};
module.exports.mailFor = mailFor;
