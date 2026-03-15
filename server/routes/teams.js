import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authenticate } from '../middleware/auth.js'
import { emit } from '../lib/socket.js'

const router = Router()
router.use(authenticate)

const include = {
  members: { include: { user: { select: { id: true, name: true, avatar: true, email: true } } } },
  incidents: { select: { id: true, title: true, status: true } },
}

router.get('/', async (req, res) => {
  try {
    const teams = await prisma.team.findMany({ include, orderBy: { id: 'asc' } })
    res.json(teams)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.get('/:id', async (req, res) => {
  try {
    const team = await prisma.team.findUnique({ where: { id: +req.params.id }, include })
    if (!team) return res.status(404).json({ error: 'Not found' })
    res.json(team)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.post('/', async (req, res) => {
  try {
    const { name, status, specialty, memberIds = [] } = req.body
    const team = await prisma.team.create({
      data: {
        name, status, specialty,
        members: { create: memberIds.map(userId => ({ userId: +userId })) },
      },
      include,
    })
    emit('team:updated', team)
    res.status(201).json(team)
  } catch (e) { res.status(400).json({ error: e.message }) }
})

router.put('/:id', async (req, res) => {
  try {
    const { name, status, specialty, memberIds } = req.body
    const data = {}
    if (name      !== undefined) data.name      = name
    if (status    !== undefined) data.status    = status
    if (specialty !== undefined) data.specialty = specialty

    if (memberIds !== undefined) {
      await prisma.teamMember.deleteMany({ where: { teamId: +req.params.id } })
      data.members = { create: memberIds.map(userId => ({ userId: +userId })) }
    }

    const team = await prisma.team.update({ where: { id: +req.params.id }, data, include })
    emit('team:updated', team)
    res.json(team)
  } catch (e) { res.status(400).json({ error: e.message }) }
})

router.delete('/:id', async (req, res) => {
  try {
    const id = +req.params.id
    await prisma.team.delete({ where: { id } })
    emit('team:deleted', { id })
    res.json({ ok: true })
  } catch (e) { res.status(400).json({ error: e.message }) }
})

export default router
