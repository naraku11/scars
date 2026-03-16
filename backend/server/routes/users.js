import { Router } from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../lib/prisma.js'
import { authenticate } from '../middleware/auth.js'
import { emit } from '../lib/socket.js'

const router = Router()
router.use(authenticate)

const include = { role: true }

router.get('/', async (req, res) => {
  try {
    const users = await prisma.user.findMany({ include, orderBy: { id: 'asc' } })
    res.json(users.map(({ password: _, ...u }) => u))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.get('/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: +req.params.id }, include })
    if (!user) return res.status(404).json({ error: 'Not found' })
    const { password: _, ...u } = user
    res.json(u)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.post('/', async (req, res) => {
  try {
    const { name, email, password, avatar, roleId, status, joined } = req.body
    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { name, email, password: hashed, avatar, roleId: +roleId, status, joined: joined ? new Date(joined) : undefined },
      include,
    })
    const { password: _, ...u } = user
    emit('user:created', u)
    res.status(201).json(u)
  } catch (e) { res.status(400).json({ error: e.message }) }
})

router.put('/:id', async (req, res) => {
  try {
    const { name, email, password, avatar, roleId, status } = req.body
    const data = { name, email, avatar, status }
    if (roleId)   data.roleId   = +roleId
    if (password) data.password = await bcrypt.hash(password, 10)
    const user = await prisma.user.update({ where: { id: +req.params.id }, data, include })
    const { password: _, ...u } = user
    emit('user:updated', u)
    res.json(u)
  } catch (e) { res.status(400).json({ error: e.message }) }
})

router.delete('/:id', async (req, res) => {
  try {
    const id = +req.params.id
    await prisma.user.delete({ where: { id } })
    emit('user:deleted', { id })
    res.json({ ok: true })
  } catch (e) { res.status(400).json({ error: e.message }) }
})

export default router
