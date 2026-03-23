import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool, { USER_ROLE_SELECT, mapUser } from '../lib/db.js'
import { cacheSet } from '../lib/cache.js'

const router = Router()

// POST /api/auth/login — single JOIN query instead of 2 separate queries
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

    const [rows] = await pool.execute(`${USER_ROLE_SELECT} WHERE u.email = ? LIMIT 1`, [email])
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' })

    const row = rows[0]
    if (row.status === 'Inactive') return res.status(403).json({ error: 'Account is inactive' })

    const valid = await bcrypt.compare(password, row.password)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

    const secret = process.env.JWT_SECRET
    if (!secret) return res.status(500).json({ error: 'JWT_SECRET is not set — add it to hPanel environment variables' })

    const token = jwt.sign(
      { id: row.id, email: row.email, roleId: row.roleId },
      secret,
      { expiresIn: '8h' }
    )

    const user = mapUser(row)
    cacheSet(`user:${user.id}`, user, 60_000)
    res.json({ token, user })
  } catch (e) {
    console.error('[login]', e)
    res.status(500).json({ error: e.message })
  }
})

// POST /api/auth/verify-password  — checks current user's password (requires Bearer token)
router.post('/verify-password', async (req, res) => {
  try {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' })
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET)

    const { password } = req.body
    if (!password) return res.status(400).json({ error: 'Password required' })

    const [users] = await pool.execute(
      'SELECT password FROM User WHERE id = ? LIMIT 1',
      [payload.id]
    )
    if (!users.length) return res.status(404).json({ error: 'User not found' })

    const valid = await bcrypt.compare(password, users[0].password)
    if (!valid) return res.status(401).json({ error: 'Incorrect password' })

    res.json({ ok: true })
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
})

// GET /api/auth/me — single JOIN query instead of 2 separate queries
router.get('/me', async (req, res) => {
  try {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' })
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET)

    const [rows] = await pool.execute(`${USER_ROLE_SELECT} WHERE u.id = ? LIMIT 1`, [payload.id])
    if (!rows.length) return res.status(404).json({ error: 'User not found' })

    const user = mapUser(rows[0])
    cacheSet(`user:${user.id}`, user, 60_000)
    res.json(user)
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
})

export default router
