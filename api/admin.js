// Controlla la password dell'account admin. La password sta solo su Vercel (variabile ADMIN_PW), mai nel codice del sito.
// Massimo 10 tentativi sbagliati ogni 15 minuti per dispositivo/rete, per evitare che qualcuno provi password a raffica.
const crypto = require('crypto');
const { cmd, dbOk, checkKey } = require('./_lib');

const MAX = 10, FINESTRA = 15 * 60;

function uguali(a, b) {
  const x = crypto.createHash('sha256').update(String(a)).digest();
  const y = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!checkKey(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'metodo non consentito' });
  const pw = process.env.ADMIN_PW;
  if (!pw) return res.status(500).json({ error: 'password admin non impostata su Vercel (ADMIN_PW)' });
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'x').split(',')[0].trim();
  const k = 'ci_admtry:' + ip;
  try {
    const n = dbOk() ? +(await cmd(['GET', k])) || 0 : 0;
    if (n >= MAX) return res.status(429).json({ error: 'Troppi tentativi sbagliati. Riprova tra 15 minuti.' });
    const b = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    if (uguali(b.pw || '', pw)) {
      if (dbOk() && n) await cmd(['DEL', k]);
      return res.status(200).json({ ok: true });
    }
    if (dbOk()) { await cmd(['INCR', k]); await cmd(['EXPIRE', k, FINESTRA]); }
    return res.status(401).json({ error: 'Errore: password errata.' });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
};
