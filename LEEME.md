# Estudio de Cortos IA

Escribe una idea → la IA escribe el guion → genera clips realistas y voces en español → monta el corto vertical con subtítulos → lo descargas.

## Dos motores

- **Gratis (Pollinations)** — guion, video (Wan 2.7) y voz sin tarjeta. La clave se consigue gratis en https://enter.pollinations.ai (te registras con tu correo, sin tarjeta). Tiene límites de uso del plan gratis: si dice que está ocupado, espera unos segundos y reintenta.
- **Pro (Alibaba)** — Qwen + Wan 2.7 directo en Model Studio (región Singapur). Más rápido y con más cuota.

Además, en cada escena hay un botón **"Subir clip"**: puedes generar el clip gratis donde quieras (p. ej. Meta AI) y subirlo; el estudio lo monta con voz, subtítulos y música igual.

## Variables en Vercel (Settings → Environment Variables)

| Nombre | Valor |
|---|---|
| `POLLINATIONS_KEY` | Tu clave gratis de https://enter.pollinations.ai (sin tarjeta) |
| `APP_PASSWORD` | Una contraseña que tú inventes para entrar a la plataforma |
| `DASHSCOPE_API_KEY` | Solo si usas el motor Pro: tu clave de Alibaba Cloud Model Studio (región Singapur) |

Opcionales: `POLLINATIONS_TEXT_MODEL` (por defecto `openai/gpt-5.4-nano`), `POLLINATIONS_VIDEO_MODEL` (por defecto `alibaba/wan-2.7`), `POLLINATIONS_TTS_MODEL` (por defecto `qwen/qwen3-tts-flash`), `QWEN_MODEL` (por defecto `qwen-plus`), `WAN_MODEL` (por defecto `wan2.7-t2v`), `TTS_MODEL` (por defecto `qwen3-tts-flash`), `DASHSCOPE_BASE` (por defecto `https://dashscope-intl.aliyuncs.com`).

Después de cambiar una variable, vuelve a desplegar (Deployments → ⋯ → Redeploy).
