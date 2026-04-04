import { Router } from 'express'
import pool, { INCIDENT_SELECT, mapIncident } from '../lib/db.js'
import { authenticate } from '../middleware/auth.js'
import { emit } from '../lib/socket.js'
import { cacheGet, cacheSet, cacheDel } from '../lib/cache.js'

const router = Router()
router.use(authenticate)

async function fetchIncident(id) {
  const [rows] = await pool.execute(`${INCIDENT_SELECT} WHERE i.id = ?`, [id])
  return rows.length ? mapIncident(rows[0]) : null
}

router.get('/', async (req, res) => {
  try {
    const cached = cacheGet('incidents')
    if (cached) return res.json(cached)

    const [rows] = await pool.execute(`${INCIDENT_SELECT} WHERE i.deletedAt IS NULL ORDER BY i.createdAt DESC`)
    const incidents = rows.map(mapIncident)
    cacheSet('incidents', incidents, 30_000)
    res.json(incidents)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// Must be registered before /:id to avoid collision
router.get('/deleted', async (req, res) => {
  try {
    const [rows] = await pool.execute(`${INCIDENT_SELECT} WHERE i.deletedAt IS NOT NULL ORDER BY i.deletedAt DESC`)
    res.json(rows.map(mapIncident))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.get('/:id', async (req, res) => {
  try {
    const incident = await fetchIncident(+req.params.id)
    if (!incident) return res.status(404).json({ error: 'Not found' })
    res.json(incident)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.post('/', async (req, res) => {
  try {
    const { title, type, priority, location, description, reportedById, assignedToId } = req.body
    const [result] = await pool.execute(
      'INSERT INTO Incident (title, type, priority, location, description, reportedById, assignedToId, media) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [title, type, priority, location, description, +reportedById, assignedToId ? +assignedToId : null, '[]']
    )
    const incident = await fetchIncident(result.insertId)
    cacheDel('incidents')
    emit('incident:created', incident)
    res.status(201).json(incident)
  } catch (e) { res.status(400).json({ error: e.message }) }
})

router.put('/:id', async (req, res) => {
  try {
    const id = +req.params.id
    const { title, type, priority, location, description, status, validated, verified, assignedToId } = req.body
    const fields = [], vals = []
    if (title        !== undefined) { fields.push('title = ?');        vals.push(title) }
    if (type         !== undefined) { fields.push('type = ?');         vals.push(type) }
    if (priority     !== undefined) { fields.push('priority = ?');     vals.push(priority) }
    if (location     !== undefined) { fields.push('location = ?');     vals.push(location) }
    if (description  !== undefined) { fields.push('description = ?');  vals.push(description) }
    if (status       !== undefined) { fields.push('status = ?');       vals.push(status) }
    if (validated    !== undefined) { fields.push('validated = ?');    vals.push(validated ? 1 : 0) }
    if (verified     !== undefined) { fields.push('verified = ?');     vals.push(verified ? 1 : 0) }
    if (assignedToId !== undefined) { fields.push('assignedToId = ?'); vals.push(assignedToId ? +assignedToId : null) }
    if (fields.length) {
      vals.push(id)
      await pool.execute(`UPDATE Incident SET ${fields.join(', ')} WHERE id = ?`, vals)
    }
    const incident = await fetchIncident(id)
    if (!incident) return res.status(404).json({ error: 'Not found' })
    cacheDel('incidents')
    emit('incident:updated', incident)
    res.json(incident)
  } catch (e) { res.status(400).json({ error: e.message }) }
})

router.delete('/:id', async (req, res) => {
  try {
    const id = +req.params.id
    await pool.execute('UPDATE Incident SET deletedAt = NOW() WHERE id = ?', [id])
    const incident = await fetchIncident(id)
    cacheDel('incidents')
    emit('incident:deleted', { id, incident })
    res.json(incident)
  } catch (e) { res.status(400).json({ error: e.message }) }
})

router.patch('/:id/restore', async (req, res) => {
  try {
    const id = +req.params.id
    await pool.execute('UPDATE Incident SET deletedAt = NULL WHERE id = ?', [id])
    const incident = await fetchIncident(id)
    cacheDel('incidents')
    emit('incident:restored', incident)
    res.json(incident)
  } catch (e) { res.status(400).json({ error: e.message }) }
})

router.patch('/:id/validate', async (req, res) => {
  try {
    const id = +req.params.id
    await pool.execute('UPDATE Incident SET validated = 1 WHERE id = ?', [id])
    const incident = await fetchIncident(id)
    cacheDel('incidents')
    emit('incident:updated', incident)
    res.json(incident)
  } catch (e) { res.status(400).json({ error: e.message }) }
})

router.patch('/:id/verify', async (req, res) => {
  try {
    const id = +req.params.id
    await pool.execute('UPDATE Incident SET verified = 1 WHERE id = ?', [id])
    const incident = await fetchIncident(id)
    cacheDel('incidents')
    emit('incident:updated', incident)
    res.json(incident)
  } catch (e) { res.status(400).json({ error: e.message }) }
})

router.patch('/:id/assign', async (req, res) => {
  try {
    const id = +req.params.id
    const { teamId } = req.body
    await pool.execute(
      "UPDATE Incident SET assignedToId = ?, status = 'In Progress' WHERE id = ?",
      [teamId ? +teamId : null, id]
    )
    const incident = await fetchIncident(id)
    cacheDel('incidents')
    emit('incident:updated', incident)
    res.json(incident)
  } catch (e) { res.status(400).json({ error: e.message }) }
})

export default router
