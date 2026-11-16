// Funzioni condivise dalle funzioni serverless (i file che iniziano con "_" non diventano indirizzi del sito).
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function cmd(args) {
  const r = await fetch(URL_, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + TOKEN },
    body: JSON.stringify(args),
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}
const dbOk = () => !!(URL_ && TOKEN);

/* le mail stanno in una chiave separata ("ci_mail") che il sito non manda mai ai browser */
const nz = s => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
const studKey = (c, n) => 's:' + nz(c) + '|' + nz(n);
const profKey = p => 'p:' + nz(p);
async function allMails() {
  const a = (await cmd(['HGETALL', 'ci_mail'])) || [];
  const o = {};
  for (let i = 0; i < a.length; i += 2) o[a[i]] = a[i + 1];
  return o;
}
const okMail = e => /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(e) && e.length <= 120;

/* invio con Gmail (MAIL_USER + password per le app in MAIL_PASS), sempre con copia a MAIL_CC se impostata */
let tr = null;
async function sendMail({ to, subject, text, html }) {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) throw new Error('MAIL_USER o MAIL_PASS non impostate su Vercel');
  if (!tr) {
    const nodemailer = require('nodemailer');
    tr = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS } });
  }
  const cc = (process.env.MAIL_CC || '').trim();
  return tr.sendMail({
    from: '"Calendario Interrogazioni" <' + process.env.MAIL_USER + '>',
    to, cc: cc && nz(cc) !== nz(to) ? cc : undefined, subject, text, html,
  });
}

/* date e testi in italiano */
const DN = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
const cap = s => String(s || '').trim().split(/\s+/).map(w => w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : '').join(' ');
const fmt = d => { const [y, m, g] = d.split('-'); return g + '/' + m + '/' + y; };
const dayName = d => DN[new Date(d + 'T12:00:00Z').getUTCDay()];
const dl = d => cap(dayName(d)) + ' ' + fmt(d);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const calName = c => cap(c.mat) + (c.name ? ' (' + c.name + ')' : '');

/* ora attuale in Italia: { date:'2026-11-16', wd:1, h:14 } */
function romeNow(now = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23', weekday: 'short',
  }).formatToParts(now).map(x => [x.type, x.value]));
  const date = p.year + '-' + p.month + '-' + p.day;
  return { date, wd: new Date(date + 'T12:00:00Z').getUTCDay(), h: +p.hour };
}
function addDays(date, n) { const d = new Date(date + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }

function checkKey(req, res) {
  const need = process.env.APP_KEY;
  if (need && req.headers['x-key'] !== need) { res.status(401).json({ error: 'codice errato' }); return false; }
  return true;
}

module.exports = { cmd, dbOk, nz, studKey, profKey, allMails, okMail, sendMail, DN, cap, fmt, dl, esc, calName, romeNow, addDays, checkKey };
