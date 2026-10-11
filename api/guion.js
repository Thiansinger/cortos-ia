// Escribe el guion del corto con Qwen (Alibaba) o con Pollinations (motor gratis)
import { check, ali, pol, fail } from '../lib/ali.js';

function parseJSON(t) {
  t = String(t || '').trim();
  const f = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (f) t = f[1];
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a < 0 || b < 0) throw Object.assign(new Error('El guion no llegó en el formato esperado. Inténtalo otra vez.'), { status: 502 });
  return JSON.parse(t.slice(a, b + 1));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Usa POST.' });
  const { idea, escenas = 5, tono = 'automático', motor = 'gratis' } = req.body || {};
  if (!check(req, res, motor)) return;
  if (!idea || !String(idea).trim()) return res.status(400).json({ error: 'Escribe una idea primero.' });
  const n = Math.max(2, Math.min(10, parseInt(escenas, 10) || 5));

  const prompt = `Idea del corto: "${String(idea).slice(0, 800)}". Tono: ${tono}. Escribe exactamente ${n} escenas.
Reglas:
- Escena 1 con gancho fuerte; giro sorpresa en la última. Historia clara de principio a fin.
- Define cada personaje con una descripción física MUY detallada en inglés (edad, rasgos, pelo, ropa exacta y colores) y REPÍTELA literal dentro del "prompt" de cada escena donde aparezca, para que se vea igual en todas.
- "prompt": en inglés, UNA toma continua de unos 5 segundos: lugar, acción simple y concreta, emoción, iluminación y movimiento de cámara. Estilo: photorealistic, cinematic film look, shot on 35mm, shallow depth of field. Sin texto en pantalla, sin famosos reales, sin marcas, sin violencia gráfica.
- "texto": en español, máximo 16 palabras, diálogo o narración que se escucha en esa escena.
- "habla": nombre exacto de un personaje o "Narrador".
Responde SOLO con JSON válido, sin explicaciones:
{"titulo":"máx 4 palabras","gancho":"máx 7 palabras","cierre":"llamado a la acción máx 7 palabras",
"personajes":[{"nombre":"...","genero":"mujer|hombre","descripcion_en":"..."}],
"escenas":[{"prompt":"...","habla":"...","texto":"..."}]}`;

  const system = 'Eres guionista y director de cortos virales verticales realistas (TikTok, Reels, Shorts) en español. Respondes solo con JSON válido.';

  try {
    let text;
    if (motor === 'gratis') {
      const r = await pol('/v1/chat/completions', {
        model: process.env.POLLINATIONS_TEXT_MODEL || 'openai/gpt-5.4-nano',
        temperature: 0.9,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt },
        ],
      });
      text = r.choices?.[0]?.message?.content;
    } else {
      const r = await ali('/compatible-mode/v1/chat/completions', {
        model: process.env.QWEN_MODEL || 'qwen-plus',
        temperature: 0.9,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt },
        ],
      });
      text = r.choices?.[0]?.message?.content;
    }
    const d = parseJSON(text);
    if (!Array.isArray(d.escenas) || !d.escenas.length) throw Object.assign(new Error('El guion llegó sin escenas. Inténtalo otra vez.'), { status: 502 });
    res.status(200).json(d);
  } catch (e) {
    fail(res, e);
  }
}
