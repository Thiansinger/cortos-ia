// Trae los videos y audios generados desde Alibaba a la página (para poder montarlos y exportarlos)
export const config = { runtime: 'edge' };

export default async function handler(req) {
  const pw = process.env.APP_PASSWORD;
  if (pw && req.headers.get('x-clave') !== pw) return json({ error: 'Clave de acceso incorrecta.' }, 401);
  const target = new URL(req.url).searchParams.get('url') || '';
  let u;
  try { u = new URL(target); } catch { return json({ error: 'Dirección no válida.' }, 400); }
  // Solo archivos de Alibaba Cloud o de Pollinations: así nadie puede usar tu servidor para otra cosa
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return json({ error: 'Dirección no válida.' }, 400);
  if (!/(^|\.)aliyuncs\.com$|(^|\.)alicdn\.com$|(^|\.)pollinations\.ai$/i.test(u.hostname)) return json({ error: 'Solo se permiten archivos de Alibaba Cloud o Pollinations.' }, 403);
  const r = await fetch(u.toString());
  if (!r.ok) return json({ error: r.status === 403 || r.status === 404 ? 'El archivo expiró (duran 24 horas). Regenera la escena.' : 'No se pudo descargar el archivo (' + r.status + ').' }, r.status === 404 ? 404 : 502);
  return new Response(r.body, {
    status: 200,
    headers: { 'Content-Type': r.headers.get('content-type') || 'application/octet-stream', 'Cache-Control': 'private, max-age=3600' },
  });
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
}
