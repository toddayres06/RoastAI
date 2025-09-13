import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import multer from 'multer'
import { authOptional, authRequired } from './auth.js'
import { rateLimit } from './rateLimit.js'
import { roastWithAI } from './ai.js' // AI helper (falls back to template in route on error)

// Startup info
console.log(
  `[api] MODE=${process.env.ROAST_MODE || 'auto'}  aiKey=${process.env.OPENAI_API_KEY ? 'present' : 'missing'}  model=${process.env.OPENAI_MODEL || 'gpt-4o-mini'}`
)

// Roast mode: 'template' | 'auto' | 'ai'
// - template: always use the built-in generator
// - auto: try AI if OPENAI_API_KEY exists, else fallback to template
// - ai: require AI (return 503 if key missing)
const ROAST_MODE = (process.env.ROAST_MODE || 'auto').toLowerCase()

// ---- Roast config ----
const DEFAULT_ROAST_SENTENCES = 4
const DEFAULT_SPICE = 'hot'

function generateRoast({ name, who, spice = DEFAULT_SPICE, sentences = DEFAULT_ROAST_SENTENCES }) {
  const s = ('' + spice).toLowerCase()
  const pool = {
    mild: [
      `Uploading "${name}"${who}? Respect the confidence.`,
      `That lighting says "I tried", which is adorable.`,
      `Nice composition—did the camera blink too or just you?`,
      `Bold choice; the background is doing most of the heavy lifting.`,
      `A gentle nudge: maybe clean the lens, not the audience.`,
    ],
    hot: [
      `"${name}"${who}? This looks like a witness protection headshot that lost the case.`,
      `The focus is so confused it booked therapy.`,
      `If pixels were calories, this would be a cheat week.`,
      `That angle adds five years and subtracts all hope.`,
      `This photo whispers "I was taken on a toaster" and the toaster is ashamed.`,
    ],
    inferno: [
      `Calling this "${name}"${who} is generous—it's more of a cry for help in 12 megapixels.`,
      `The exposure isn't blown out, just your chances.`,
      `I've seen CCTV with more charisma and fewer crimes.`,
      `The vibe is "I opened the front camera by accident" and then doubled down.`,
      `If confidence had EXIF data, yours would be set to 'null'.`,
    ],
  }
  const bag = pool[s] || pool.hot
  const n = Math.max(1, Math.min(6, Number(sentences) || DEFAULT_ROAST_SENTENCES))
  const picks = []
  for (let i = 0; i < n; i++) picks.push(bag[Math.floor(Math.random() * bag.length)])
  return picks.join(' ')
}

const app = express()
const PORT = process.env.PORT || 8080

// Multer for in-memory image uploads (10MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Only images allowed'))
    cb(null, true)
  },
})

// ---- CORS (env-driven) ----
const ORIGINS = (
  process.env.ALLOWED_ORIGINS ||
  'http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174'
)
  .split(',')
  .map((s) => s.trim())

app.use(helmet())
app.use(
  cors({
    origin: ORIGINS,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Client-Id'],
  })
)
app.use(express.json())

// ---- Routes ----
app.get('/api/health', (_req, res) => res.json({ ok: true }))
app.get('/api/whoami', authOptional, (req, res) => res.json({ user: req.user ?? null }))
app.get('/api/secret', authRequired, (req, res) => res.json({ msg: `Hello ${req.user.email}` }))

// ---- Roast endpoint (AI-first with safe fallback) ----
app.post('/api/roast', authOptional, rateLimit, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Missing image file (field name: image)' })

  const name = (req.file.originalname || 'that file').split(/[\\/]/).pop()
  const who = req.user?.email ? `, ${req.user.email}` : ''

  const spice = req.body.spice || DEFAULT_SPICE // 'mild' | 'hot' | 'inferno'
  const sentences = req.body.sentences || DEFAULT_ROAST_SENTENCES

  const hasKey = !!process.env.OPENAI_API_KEY
  const mode = ROAST_MODE
  const wantAI = mode === 'ai' || (mode === 'auto' && hasKey)

  let roast = ''
  let source = 'template'
  let diag = undefined

  if (wantAI) {
    if (!hasKey && mode === 'ai') {
      return res.status(503).json({ error: 'AI mode requires OPENAI_API_KEY', mode })
    }
    try {
      roast = await roastWithAI({
        imageBuffer: req.file.buffer,
        mime: req.file.mimetype,
        spice,
        sentences,
      })
      source = 'ai'
    } catch (e) {
      console.error('[roast ai fallback]', e.message)
      roast = generateRoast({ name, who, spice, sentences })
      source = 'template'
      if (process.env.DEBUG_AI === '1') {
        diag = { mode, hasKey, error: String(e.message).slice(0, 800) }
      }
    }
  } else {
    roast = generateRoast({ name, who, spice, sentences })
  }

  const payload = {
    ok: true,
    roast,
    source,
    spice,
    sentences: Number(sentences),
    rate: res.locals.rate,
    meta: { filename: name, type: req.file.mimetype, bytes: req.file.size },
  }
  if (diag) payload.diag = diag

  res.json(payload)
})

app.listen(PORT, () => console.log(`[api] listening on http://localhost:${PORT}`))
