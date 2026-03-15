import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authenticate } from '../middleware/auth.js'
import { emit } from '../lib/socket.js'

const router = Router()
router.use(authenticate)

const include = {
  reportedBy: { select: { id: true, name: true, avatar: true } },
  assignedTo:  { select: { id: true, name: true, status: true, specialty: true } },
}

router.get('/', async (req, res) => {
  try {
    const incidents = await prisma.incident.findMany({ include, orderBy: { createdAt: 'desc' } })
    res.json(incidents)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.get('/:id', async (req, res) => {
  try {
    const incident = await prisma.incident.findUnique({ where: { id: +req.params.id }, include })
    if (!incident) return res.status(404).json({ error: 'Not found' })
    res.json(incident)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.post('/', async (req, res) => {
  try {
    const { title, type, priority, location, description, reportedById, assignedToId } = req.body
    const incident = await prisma.incident.create({
      data: {
        title, type, priority, location, description,
        reportedById: +reportedById,
        assignedToId: assignedToId ? +assignedToId : null,
        media: [],
      },
      include,
    })
    emit('incident:created', incident)
    res.status(201).json(incident)
  } catch (e) { res.status(400).json({ error: e.message }) }
})

router.put('/:id', async (req, res) => {
  try {
    const { title, type, priority, location, description, status, validated, verified, assignedToId } = req.body
    const data = {}
    if (title        !== undefined) data.title        = title
    if (type         !== undefined) data.type          = type
    if (priority     !== undefined) data.priority      = priority
    if (location     !== undefined) data.location      = location
    if (description  !== undefined) data.description   = description
    if (status       !== undefined) data.status        = status
    if (validated    !== undefined) data.validated     = validated
    if (verified     !== undefined) data.verified      = verified
    if (assignedToId !== undefined) data.assignedToId  = assignedToId ? +assignedToId : null

    const incident = await prisma.incident.update({ where: { id: +req.params.id }, data, include })
    emit('incident:updated', incident)
    res.json(incident)
  } catch (e) { res.status(400).json({ error: e.message }) }
})

router.delete('/:id', async (req, res) => {
  try {
    const id = +req.params.id
    await prisma.incident.delete({ where: { id } })
    emit('incident:deleted', { id })
    res.json({ ok: true })
  } catch (e) { res.status(400).json({ error: e.message }) }
})

router.patch('/:id/validate', async (req, res) => {
  try {
    const incident = await prisma.incident.update({
      where: { id: +req.params.id },
      data: { validated: true },
      include,
    })
    emit('incident:updated', incident)
    res.json(incident)
  } catch (e) { res.status(400).json({ error: e.message }) }
})

router.patch('/:id/verify', async (req, res) => {
  try {
    const incident = await prisma.incident.update({
      where: { id: +req.params.id },
      data: { verified: true },
      include,
    })
    emit('incident:updated', incident)
    res.json(incident)
  } catch (e) { res.status(400).json({ error: e.message }) }
})

router.patch('/:id/assign', async (req, res) => {
  try {
    const { teamId } = req.body
    const incident = await prisma.incident.update({
      where: { id: +req.params.id },
      data: { assignedToId: teamId ? +teamId : null, status: 'In Progress' },
      include,
    })
    emit('incident:updated', incident)
    res.json(incident)
  } catch (e) { res.status(400).json({ error: e.message }) }
})

export default router
