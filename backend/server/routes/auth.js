import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool, { parseJson } from '../lib/db.js'
import { cacheSet } from '../lib/cache.js'

const router = Router()

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

    // Get user
    const [users] = await pool.execute(
      'SELECT * FROM User WHERE email = ? LIMIT 1',
      [email]
    )
    if (!users.length) return res.status(401).json({ error: 'Invalid credentials' })

    const u = users[0]
    if (u.status === 'Inactive') return res.status(403).json({ error: 'Account is inactive' })

    const valid = await bcrypt.compare(password, u.password)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

    // Get role
    const [roles] = await pool.execute(
      'SELECT * FROM Role WHERE id = ? LIMIT 1',
      [u.roleId]
    )
    const role = roles[0] ? { ...roles[0], permissions: parseJson(roles[0].permissions) } : null

    const secret = process.env.JWT_SECRET
    if (!secret) return res.status(500).json({ error: 'JWT_SECRET is not set — add it to hPanel environment variables' })

    const token = jwt.sign(
      { id: u.id, email: u.email, roleId: u.roleId },
      secret,
      { expiresIn: '8h' }
    )

    const user = {
      id: u.id, name: u.name, email: u.email, avatar: u.avatar,
      profileImage: u.profileImage ?? null, status: u.status,
      joined: u.joined, createdAt: u.createdAt, updatedAt: u.updatedAt,
      roleId: u.roleId, role,
    }

    cacheSet(`user:${user.id}`, user, 60_000)
    res.json({ token, user })
  } catch (e) {
    console.error('[login]', e)
    res.status(500).json({ error: e.message })
  }
})

// GET /api/auth/me
router.get('/me', async (req, res) => {
  try {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' })
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET)

    const [users] = await pool.execute(
      'SELECT * FROM User WHERE id = ? LIMIT 1',
      [payload.id]
    )
    if (!users.length) return res.status(404).json({ error: 'User not found' })

    const u = users[0]
    const [roles] = await pool.execute(
      'SELECT * FROM Role WHERE id = ? LIMIT 1',
      [u.roleId]
    )
    const role = roles[0] ? { ...roles[0], permissions: parseJson(roles[0].permissions) } : null

    const user = {
      id: u.id, name: u.name, email: u.email, avatar: u.avatar,
      profileImage: u.profileImage ?? null, status: u.status,
      joined: u.joined, createdAt: u.createdAt, updatedAt: u.updatedAt,
      roleId: u.roleId, role,
    }

    cacheSet(`user:${user.id}`, user, 60_000)
    res.json(user)
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
})

export default router
