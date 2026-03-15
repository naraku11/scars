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

app.use(cors({
  origin: isProd ? false : '*',   // in prod, same-origin only (Express serves frontend)
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
const distPath = join(__dirname, '../dist')
if (existsSync(distPath)) {
  app.use(express.static(distPath))
  // SPA fallback — any non-API route returns index.html
  app.get('*', (req, res) => {
    res.sendFile(join(distPath, 'index.html'))
  })
}

const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: isProd
    ? false                                              // same-origin in production
    : { origin: '*', methods: ['GET', 'POST'] },         // open in dev
})

setIo(io)

io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`)
  socket.on('disconnect', () => console.log(`🔌 Client disconnected: ${socket.id}`))
})

httpServer.listen(PORT, () => console.log(`🚀 SCARS API running on http://localhost:${PORT}`))
