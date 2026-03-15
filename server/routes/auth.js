import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../lib/prisma.js'

const router = Router()

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true },
    })
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })
    if (user.status === 'Inactive') return res.status(403).json({ error: 'Account is inactive' })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

    const token = jwt.sign(
      { id: user.id, email: user.email, roleId: user.roleId },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    )

    const { password: _, ...safeUser } = user
    res.json({ token, user: safeUser })
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
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      include: { role: true },
    })
    if (!user) return res.status(404).json({ error: 'User not found' })
    const { password: _, ...safeUser } = user
    res.json(safeUser)
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
})

export default router
