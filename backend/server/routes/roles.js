import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authenticate } from '../middleware/auth.js'
import { emit } from '../lib/socket.js'

const router = Router()
router.use(authenticate)

router.get('/', async (req, res) => {
  try {
    const roles = await prisma.role.findMany({ orderBy: { level: 'asc' } })
    res.json(roles)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.get('/:id', async (req, res) => {
  try {
    const role = await prisma.role.findUnique({ where: { id: +req.params.id } })
    if (!role) return res.status(404).json({ error: 'Not found' })
    res.json(role)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.post('/', async (req, res) => {
  try {
    const { name, description, color, level, permissions } = req.body
    const role = await prisma.role.create({ data: { name, description, color, level, permissions } })
    emit('role:updated', role)
    res.status(201).json(role)
  } catch (e) { res.status(400).json({ error: e.message }) }
})

router.put('/:id', async (req, res) => {
  try {
    const { name, description, color, level, permissions } = req.body
    const role = await prisma.role.update({
      where: { id: +req.params.id },
      data: { name, description, color, level, permissions },
    })
    emit('role:updated', role)
    res.json(role)
  } catch (e) { res.status(400).json({ error: e.message }) }
})

router.delete('/:id', async (req, res) => {
  try {
    const id = +req.params.id
    await prisma.role.delete({ where: { id } })
    emit('role:deleted', { id })
    res.json({ ok: true })
  } catch (e) { res.status(400).json({ error: e.message }) }
})

export default router
