// Crea un clip de video realista con Wan (POST) y consulta su estado (GET ?id=)
// Motor gratis: devuelve la URL directa de Pollinations (el navegador la descarga,
// porque el video tarda minutos y excede el tiempo máximo de una función serverless).
import { check, ali, fail, friendly, PBASE } from '../lib/ali.js';

const STYLE = ', photorealistic, cinematic film look, natural skin texture, realistic lighting, 35mm, no text, no subtitles, no watermark';
const NEG = 'cartoon, anime, illustration, 3d render, text, subtitles, watermark, logo, deformed hands, extra fingers, distorted face, blurry, low quality';

export default async function handler(req, res) {
  const motor = req.method === 'POST' ? (req.body?.motor || 'gratis') : 'gratis';
  if (!check(req, res, motor)) return;
  try {
    if (req.method === 'POST') {
      const { prompt, segundos = 5, resolucion = '720P' } = req.body || {};
      if (!prompt) return res.status(400).json({ error: 'Falta el prompt de la escena.' });
      const dur = Math.max(2, Math.min(15, parseInt(segundos, 10) || 5));
      if (motor === 'gratis') {
        const url = PBASE + '/video/' + encodeURIComponent(String(prompt).slice(0, 4500) + STYLE)
          + '?model=' + encodeURIComponent(process.env.POLLINATIONS_VIDEO_MODEL || 'alibaba/wan-2.7')
          + '&duration=' + dur
          + '&aspectRatio=9:16'
          + '&key=' + encodeURIComponent(process.env.POLLINATIONS_KEY);
        // modo directo: el navegador pide esta URL y espera el MP4 (tarda minutos).
        // La clave viaja en la URL; la app está protegida por APP_PASSWORD y es de uso personal.
        return res.status(200).json({ modo: 'directo', url });
      }
      const r = await ali('/api/v1/services/aigc/video-generation/video-synthesis', {
        model: process.env.WAN_MODEL || 'wan2.7-t2v',
        input: { prompt: String(prompt).slice(0, 4500) + STYLE, negative_prompt: NEG },
        parameters: {
          resolution: resolucion === '1080P' ? '1080P' : '720P',
          ratio: '9:16',
          duration: dur,
          prompt_extend: true,
          watermark: false,
        },
      }, { headers: { 'X-DashScope-Async': 'enable' } });
      return res.status(200).json({ id: r.output?.task_id, estado: r.output?.task_status || 'PENDING' });
    }
    if (req.method === 'GET') {
      const id = String(req.query.id || '');
      if (!/^[\w-]{6,}$/.test(id)) return res.status(400).json({ error: 'Falta el id de la tarea.' });
      const r = await ali('/api/v1/tasks/' + id, null, { method: 'GET' });
      const o = r.output || {};
      if (o.task_status === 'SUCCEEDED') return res.status(200).json({ estado: 'listo', url: o.video_url });
      if (o.task_status === 'FAILED' || o.task_status === 'CANCELED') return res.status(200).json({ estado: 'error', error: friendly(o.code, o.message, 'alibaba'), code: o.code || '' });
      if (o.task_status === 'UNKNOWN') return res.status(200).json({ estado: 'error', error: 'La tarea expiró (duran 24 horas). Regenera la escena.', code: 'expired' });
      return res.status(200).json({ estado: o.task_status === 'RUNNING' ? 'generando' : 'en cola' });
    }
    res.status(405).json({ error: 'Método no permitido.' });
  } catch (e) {
    fail(res, e);
  }
}
