import 'dotenv/config'
import { createServer } from 'http'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync } from 'fs'
import express from 'express'
import compression from 'compression'
import cors from 'cors'
import { Server } from 'socket.io'
import { setIo }             from './lib/socket.js'
import { cacheStats }        from './lib/cache.js'
import pool                  from './lib/db.js'
import authRoutes            from './routes/auth.js'
import userRoutes            from './routes/users.js'
import roleRoutes            from './routes/roles.js'
import teamRoutes            from './routes/teams.js'
import incidentRoutes        from './routes/incidents.js'
import notificationRoutes    from './routes/notifications.js'
import adminRoutes           from './routes/admin.js'
import profileRoutes         from './routes/profile.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const app    = express()
const PORT   = process.env.PORT || 3001
const isProd = process.env.NODE_ENV === 'production'
const ORIGIN = process.env.FRONTEND_URL || (isProd ? 'https://uv-scars.com' : 'http://localhost:5173')

if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET is not set — login will fail. Add it to .env (local) or hPanel env vars (Hostinger).')
}

// ── CORS ──────────────────────────────────────────────────────────────────────
// Development: allow all origins (Vite dev server on :5173)
// Production:  restrict to FRONTEND_URL only
app.use(cors({
  origin: isProd ? ORIGIN : '*',
  credentials: true,
}))

// gzip/brotli — reduces JSON & HTML payloads by ~70%
app.use(compression())

app.use(express.json({ limit: '20mb' }))  // base64 profile/logo images

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes)
app.use('/api/users',         userRoutes)
app.use('/api/roles',         roleRoutes)
app.use('/api/teams',         teamRoutes)
app.use('/api/incidents',     incidentRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/admin',         adminRoutes)
app.use('/api/profile',       profileRoutes)

app.get('/api/health', async (_, res) => {
  let db = 'untested'
  try { await pool.execute('SELECT 1'); db = 'connected' } catch (e) { db = e.message }
  res.json({
    ok: db === 'connected',
    env: process.env.NODE_ENV || 'development',
    db,
    cache: cacheStats(),
    jwt: !!process.env.JWT_SECRET,
    dbUrl: process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':***@') : 'NOT SET',
    time: new Date().toISOString(),
  })
})

// ── Static frontend (production only) ────────────────────────────────────────
// In development, Vite dev server on :5173 serves the frontend — Express only serves the API.
// In production (Hostinger), Express serves the built React app from public/.
const publicPath = join(__dirname, '../public')
const indexPath  = join(publicPath, 'index.html')

// Check once at startup — avoids sync I/O on every request
const hasPublic = existsSync(publicPath)
const hasIndex  = existsSync(indexPath)

if (isProd && hasPublic) {
  app.use(express.static(publicPath, { maxAge: '1d', immutable: true }))
}

// ── SPA fallback ──────────────────────────────────────────────────────────────
app.get('/*splat', (req, res) => {
  if (hasIndex) {
    res.sendFile(indexPath)
  } else if (isProd) {
    res.status(503).send('Frontend not built. Run: npm run build')
  } else {
    res.status(200).json({
      message: 'SCARS API is running in development mode.',
      frontend: 'Open http://localhost:5173 — start with: cd frontend && npm run dev',
      health: '/api/health',
    })
  }
})

// ── Socket.io ─────────────────────────────────────────────────────────────────
const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: isProd
    ? { origin: ORIGIN, methods: ['GET', 'POST'], credentials: true }
    : { origin: '*',    methods: ['GET', 'POST'] },
  // polling first — more reliable on shared hosting; upgrades to websocket when available
  transports: ['polling', 'websocket'],
  allowEIO3: true,   // Engine.io v3 compatibility (some browsers / proxies)
})

setIo(io)

io.on('connection', (socket) => {
  if (!isProd) console.log(`🔌 Client connected: ${socket.id}`)
  socket.on('disconnect', () => {
    if (!isProd) console.log(`🔌 Client disconnected: ${socket.id}`)
  })
})

// ── Start ─────────────────────────────────────────────────────────────────────
httpServer.listen(PORT, async () => {
  try {
    await pool.execute('SELECT 1')
    console.log('   DB       : ✅ connected')
  } catch (e) {
    console.error('   DB       : ❌ connection failed —', e.message)
  }
  console.log(`\n🚀 SCARS server started`)
  console.log(`   Mode     : ${isProd ? 'production' : 'development'}`)
  console.log(`   Port     : ${PORT}`)
  console.log(`   DB       : ${process.env.DATABASE_URL
    ? process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':***@')
    : '⚠️  DATABASE_URL not set'}`)
  if (isProd) {
    console.log(`   Frontend : ${existsSync(publicPath) ? publicPath : '⚠️  not built — run npm run build'}`)
    console.log(`   Origin   : ${ORIGIN}`)
  } else {
    console.log(`   Frontend : http://localhost:5173 (Vite)`)
    console.log(`   API      : http://localhost:${PORT}/api`)
  }
  console.log()
})

// ── Error handling ────────────────────────────────────────────────────────────
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err?.message || err)
})
