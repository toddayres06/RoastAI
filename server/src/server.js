import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { authOptional, authRequired } from './auth.js'
import { rateLimit } from './rateLimit.js'   // ← add this

const app = express()
const PORT = process.env.PORT || 8080

app.use(helmet())
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET','POST','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Client-Id'],
}))
app.use(express.json())

app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.get('/api/whoami', authOptional, (req, res) => {
  res.json({ user: req.user ?? null })
})

app.get('/api/secret', authRequired, (req, res) => {
  res.json({ msg: `Hello ${req.user.email}` })
})

// ✅ Roast endpoint (stub) – uses optional auth + rate limit
app.post('/api/roast', authOptional, rateLimit, (req, res) => {
  // For now this just proves the limit & route work.
  // Phase 4 will accept an image and return an AI roast.
  res.json({
    ok: true,
    rate: res.locals.rate,
    message: 'Roast endpoint stub — image handling arrives in Phase 4.',
  })
})

app.listen(PORT, () => {
  console.log(`[api] listening on http://localhost:${PORT}`)
})
