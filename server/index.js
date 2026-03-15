import 'dotenv/config'
import { createServer } from 'http'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync } from 'fs'
import express from 'express'
import cors from 'cors'
import { Server } from 'socket.io'
import { setIo }             from './lib/socket.js'
import authRoutes            from './routes/auth.js'
import userRoutes            from './routes/users.js'
import roleRoutes            from './routes/roles.js'
import teamRoutes            from './routes/teams.js'
import incidentRoutes        from './routes/incidents.js'
import notificationRoutes    from './routes/notifications.js'
import adminRoutes           from './routes/admin.js'
import profileRoutes         from './routes/profile.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const app  = express()
const PORT = process.env.PORT || 3001
const isProd = process.env.NODE_ENV === 'production'
const ORIGIN  = process.env.FRONTEND_URL || 'https://uv-scars.com'

app.use(cors({
  origin: isProd ? ORIGIN : '*',
  credentials: true,
}))
app.use(express.json({ limit: '20mb' }))   // allow base64 profile images

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes)
app.use('/api/users',         userRoutes)
app.use('/api/roles',         roleRoutes)
app.use('/api/teams',         teamRoutes)
app.use('/api/incidents',     incidentRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/admin',         adminRoutes)
app.use('/api/profile',       profileRoutes)

app.get('/api/health', (_, res) => res.json({ ok: true, time: new Date().toISOString() }))

// ── Serve React build (production) ───────────────────────────────────────────
const distPath  = join(__dirname, '../dist')
const indexPath = join(distPath, 'index.html')

if (existsSync(distPath)) {
  app.use(express.static(distPath))
}

// SPA fallback — always registered so direct URL access never hits Express 404
app.get('*', (req, res) => {
  if (existsSync(indexPath)) {
    res.sendFile(indexPath)
  } else {
    res.status(503).send(
      'Frontend not built. Run <code>npm run build</code> then restart the server.'
    )
  }
})

const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: isProd
    ? { origin: ORIGIN, methods: ['GET', 'POST'], credentials: true }
    : { origin: '*',    methods: ['GET', 'POST'] },
})

setIo(io)

io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`)
  socket.on('disconnect', () => console.log(`🔌 Client disconnected: ${socket.id}`))
})

httpServer.listen(PORT, () => console.log(`🚀 SCARS API running on http://localhost:${PORT}`))
