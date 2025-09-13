// server/src/ai.js
// OpenAI Vision helper (Node 18+). Chat Completions with multimodal content.

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OPENAI_MODEL   = process.env.OPENAI_MODEL || 'gpt-4o-mini'
const OPENAI_PROJECT = process.env.OPENAI_PROJECT // optional

export async function roastWithAI({ imageBuffer, mime, spice = 'hot', sentences = 4 }) {
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY missing')

  const base64 = imageBuffer.toString('base64')
  const prompt = makePrompt(spice, sentences)

  const body = {
    model: OPENAI_MODEL,
    temperature: 0.9,
    max_tokens: 350,
    messages: [
      {
        role: 'system',
        content:
          'You are a witty roastmaster. Be playful and snappy, but safe-for-work. ' +
          'NEVER use slurs, hate speech, or target protected classes. Roast the photo’s vibe, composition, pose, lighting, outfit, background—avoid immutable traits.',
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: `data:${mime};base64,${base64}` } },
        ],
      },
    ],
  }

  const headers = {
    Authorization: `Bearer ${OPENAI_API_KEY}`,
    'Content-Type': 'application/json',
  }
  if (OPENAI_PROJECT) headers['OpenAI-Project'] = OPENAI_PROJECT

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`OpenAI ${res.status}: ${text.slice(0, 800)}`)
  }

  const data = await res.json()
  const text = data?.choices?.[0]?.message?.content?.trim()
  if (!text) throw new Error('No text from model')
  return text
}

function makePrompt(spice, sentences) {
  const s = String(spice || 'hot').toLowerCase()
  const n = Math.max(1, Math.min(6, Number(sentences) || 4))
  const tone =
    s === 'mild'    ? 'lightly teasing, friendly ribbing' :
    s === 'inferno' ? 'savage but still playful, no slurs' :
                      'punchy, confident, clever'

  return [
    `Roast this photo in ${n} distinct sentences.`,
    `Tone: ${tone}.`,
    'Focus on pose, expression, composition, lighting, outfit, background, and overall vibe.',
    'Avoid real harm: no slurs, hate, sexual content, doxxing, or attacking protected traits.',
    'Be original—short paragraph, end on a zinger.',
  ].join(' ')
}
