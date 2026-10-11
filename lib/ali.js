// Conexión con Alibaba Cloud Model Studio (región internacional / Singapur)
// y con Pollinations (motor gratis, sin tarjeta).
const BASE = (process.env.DASHSCOPE_BASE || 'https://dashscope-intl.aliyuncs.com').replace(/\/$/, '');
export const PBASE = (process.env.POLLINATIONS_BASE || 'https://gen.pollinations.ai').replace(/\/$/, '');

export function check(req, res, motor) {
  const gratis = motor === 'gratis';
  const key = gratis ? process.env.POLLINATIONS_KEY : process.env.DASHSCOPE_API_KEY;
  if (!key) {
    res.status(500).json({ error: gratis
      ? 'Falta la variable POLLINATIONS_KEY en Vercel (Settings → Environment Variables). La consigues gratis en https://enter.pollinations.ai (sin tarjeta).'
      : 'Falta la variable DASHSCOPE_API_KEY en Vercel (Settings → Environment Variables).' });
    return false;
  }
  const pw = process.env.APP_PASSWORD;
  if (pw && req.headers['x-clave'] !== pw) {
    res.status(401).json({ error: 'Clave de acceso incorrecta.', code: 'bad_password' });
    return false;
  }
  return true;
}

export async function ali(path, body, { method = 'POST', headers = {} } = {}) {
  const r = await fetch(BASE + path, {
    method,
    headers: { Authorization: 'Bearer ' + process.env.DASHSCOPE_API_KEY, 'Content-Type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const e = new Error(j.message || j.error?.message || 'Alibaba respondió con error ' + r.status);
    e.status = r.status;
    e.code = j.code || j.error?.code || '';
    e.provider = 'alibaba';
    throw e;
  }
  return j;
}

// Llamada JSON a Pollinations (motor gratis)
export async function pol(path, body) {
  const r = await fetch(PBASE + path, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + process.env.POLLINATIONS_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const e = new Error(j.error?.message || j.message || 'Pollinations respondió con error ' + r.status);
    e.status = r.status;
    e.code = j.error?.code || '';
    e.provider = 'pollinations';
    throw e;
  }
  return j;
}

// Llamada binaria a Pollinations (devuelve ArrayBuffer o lanza)
export async function polBin(path, body) {
  const r = await fetch(PBASE + path, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + process.env.POLLINATIONS_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const j = await r.json().catch(() => ({}));
    const e = new Error(j.error?.message || j.message || 'Pollinations respondió con error ' + r.status);
    e.status = r.status;
    e.code = j.error?.code || '';
    e.provider = 'pollinations';
    throw e;
  }
  return await r.arrayBuffer();
}

export function friendly(code, message, provider) {
  const c = String(code || '');
  const keyName = provider === 'pollinations' ? 'Pollinations' : 'Alibaba';
  if (/InvalidApiKey|Unauthorized|AccessDenied/i.test(c) || String(code) === '401')
    return 'La clave de ' + keyName + ' no es válida.' + (provider === 'pollinations' ? ' Consíguela gratis en https://enter.pollinations.ai' : ' Revisa que esté bien copiada en Vercel.');
  if (/402|PaymentRequired|Insufficient|QuotaExhausted|Arrearage/i.test(c))
    return provider === 'pollinations'
      ? 'Se acabó tu cuota gratis de Pollinations. Revisa tu cuenta en https://enter.pollinations.ai'
      : 'Se acabó la cuota gratis o el saldo de tu cuenta de Alibaba. Revisa la sección de facturación de Model Studio.';
  if (/Throttling|RateLimit|429/i.test(c))
    return provider === 'pollinations'
      ? 'Pollinations está ocupado (límite del plan gratis). Espera unos segundos y reintenta.'
      : 'Alibaba está ocupado con tus otras escenas. Reintentando…';
  if (/DataInspection|Moderation|IPInfringement|Inspection/i.test(c)) return 'El filtro de contenido bloqueó esta escena. Cambia el prompt (sin violencia, famosos ni marcas) y regenera.';
  if (/ModelNotFound|InvalidParameter/i.test(c)) return keyName + ' rechazó la petición: ' + (message || c) + '.';
  return message || 'Error de ' + keyName + (c ? ' (' + c + ')' : '') + '.';
}

export function fail(res, e) {
  const status = e.status && e.status >= 400 && e.status < 600 ? e.status : 500;
  res.status(status).json({ error: friendly(e.code || e.status, e.message, e.provider), code: e.code || '' });
}
