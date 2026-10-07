// Funzione serverless di Vercel: legge e salva i dati del sito su Upstash Redis.
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

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const need = process.env.APP_KEY;
  if (need && req.headers['x-key'] !== need) {
    return res.status(401).json({ error: 'codice errato' });
  }
  if (!URL_ || !TOKEN) {
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
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'metodo non consentito' });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
};
