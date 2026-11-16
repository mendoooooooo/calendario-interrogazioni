// Salva le mail di studenti e prof. Il sito riceve solo una versione nascosta (es. "ma•••@gmail.com"), mai l'indirizzo intero.
const { cmd, dbOk, okMail, checkKey } = require('./_lib');

const mask = e => { const [u, d] = String(e).split('@'); return (u.length <= 2 ? u[0] : u.slice(0, 2)) + '•••@' + d; };

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!checkKey(req, res)) return;
  if (!dbOk()) return res.status(500).json({ error: 'database non collegato al progetto' });
  try {
    if (req.method === 'GET') {
      const a = (await cmd(['HGETALL', 'ci_mail'])) || [];
      const o = {};
      for (let i = 0; i < a.length; i += 2) o[a[i]] = mask(a[i + 1]);
      return res.status(200).json(o);
    }
    if (req.method === 'POST') {
      const b = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const k = String(b.k || ''), e = String(b.e || '').trim().toLowerCase();
      if (!/^[sp]:.{1,200}$/.test(k)) return res.status(400).json({ error: 'chiave non valida' });
      if (b.from && /^[sp]:.{1,200}$/.test(b.from) && b.from !== k) {
        const old = await cmd(['HGET', 'ci_mail', b.from]);
        await cmd(['HDEL', 'ci_mail', b.from]);
        if (!e && old) { await cmd(['HSET', 'ci_mail', k, old]); return res.status(200).json({ ok: true, m: mask(old) }); }
      }
      if (!e) { await cmd(['HDEL', 'ci_mail', k]); return res.status(200).json({ ok: true, m: null }); }
      if (!okMail(e)) return res.status(400).json({ error: 'indirizzo email non valido' });
      await cmd(['HSET', 'ci_mail', k, e]);
      return res.status(200).json({ ok: true, m: mask(e) });
    }
    return res.status(405).json({ error: 'metodo non consentito' });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
};
