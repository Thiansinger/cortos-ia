// Convierte el texto de una escena en voz en español:
// Qwen TTS (Alibaba) o Pollinations TTS (motor gratis)
import { check, ali, polBin, fail } from '../lib/ali.js';

const VOCES = ['Sonrisa', 'Bodega', 'Cherry', 'Ethan', 'Serena', 'Ryan', 'Jennifer', 'Marcus', 'Katerina', 'Arthur', 'Maia', 'Kai'];
// Voces en español disponibles en Pollinations (motor gratis)
const VOCES_GRATIS = ['es-MX-Valeria', 'es-ES-Marta', 'es-MX-Alejo', 'es-MX-Grant', 'es-MX-Harper'];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Usa POST.' });
  const { texto, voz = 'Sonrisa', motor = 'gratis' } = req.body || {};
  if (!check(req, res, motor)) return;
  if (!texto || !String(texto).trim()) return res.status(400).json({ error: 'No hay texto para convertir en voz.' });
  try {
    if (motor === 'gratis') {
      const v = VOCES_GRATIS.includes(voz) ? voz : 'es-MX-Valeria';
      const buf = await polBin('/v1/audio/speech', {
        model: process.env.POLLINATIONS_TTS_MODEL || 'qwen/qwen3-tts-flash',
        input: String(texto).slice(0, 590),
        voice: v,
        response_format: 'mp3',
      });
      // Se devuelve como data URI para mantener el mismo contrato {url};
      // el navegador lo descarga con fetch() igual que una URL normal.
      const b64 = Buffer.from(buf).toString('base64');
      return res.status(200).json({ url: 'data:audio/mpeg;base64,' + b64 });
    }
    const r = await ali('/api/v1/services/aigc/multimodal-generation/generation', {
      model: process.env.TTS_MODEL || 'qwen3-tts-flash',
      input: { text: String(texto).slice(0, 590), voice: VOCES.includes(voz) ? voz : 'Sonrisa', language_type: 'Spanish' },
    });
    const url = r.output?.audio?.url;
    if (!url) return res.status(502).json({ error: 'Alibaba no devolvió el audio. Inténtalo otra vez.' });
    res.status(200).json({ url });
  } catch (e) {
    fail(res, e);
  }
}
