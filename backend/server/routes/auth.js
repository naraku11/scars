import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool, { USER_ROLE_SELECT, mapUser } from '../lib/db.js'
import { cacheGet, cacheSet } from '../lib/cache.js'

const router = Router()

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

    const [rows] = await pool.execute(`${USER_ROLE_SELECT} WHERE u.email = ?`, [email])
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' })

    const row = rows[0]
    if (row.status === 'Inactive') return res.status(403).json({ error: 'Account is inactive' })

    const valid = await bcrypt.compare(password, row.password)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

    const token = jwt.sign(
      { id: row.id, email: row.email, roleId: row.roleId },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    )

    const user = mapUser(row)
    cacheSet(`user:${user.id}`, user, 60_000)
    res.json({ token, user })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Server error' })
  }
})

// GET /api/auth/me
router.get('/me', async (req, res) => {
  try {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' })
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET)

    const cached = cacheGet(`user:${payload.id}`)
    if (cached) return res.json(cached)

    const [rows] = await pool.execute(`${USER_ROLE_SELECT} WHERE u.id = ?`, [payload.id])
    if (!rows.length) return res.status(404).json({ error: 'User not found' })

    const user = mapUser(rows[0])
    cacheSet(`user:${user.id}`, user, 60_000)
    res.json(user)
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
})

export default router
