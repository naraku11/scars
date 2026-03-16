import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authenticate } from '../middleware/auth.js'
import { emit } from '../lib/socket.js'

const router = Router()
router.use(authenticate)

const include = {
  sentBy: { select: { id: true, name: true, avatar: true } },
}

router.get('/', async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({ include, orderBy: { sentAt: 'desc' } })
    res.json(notifications)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.post('/', async (req, res) => {
  try {
    const { type, title, message, target, sentById } = req.body
    const notification = await prisma.notification.create({
      data: { type, title, message, target, sentById: +sentById },
      include,
    })
    emit('notification:sent', notification)
    res.status(201).json(notification)
  } catch (e) { res.status(400).json({ error: e.message }) }
})

router.delete('/:id', async (req, res) => {
  try {
    const id = +req.params.id
    await prisma.notification.delete({ where: { id } })
    emit('notification:deleted', { id })
    res.json({ ok: true })
  } catch (e) { res.status(400).json({ error: e.message }) }
})

export default router
