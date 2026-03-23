import { Router } from 'express'
import pool from '../lib/db.js'
import { authenticate } from '../middleware/auth.js'
import { emit } from '../lib/socket.js'
import { cacheGet, cacheSet, cacheDel } from '../lib/cache.js'

const router = Router()
router.use(authenticate)

async function fetchTeam(id) {
  const [teamRows] = await pool.execute('SELECT * FROM Team WHERE id = ?', [id])
  if (!teamRows.length) return null
  const team = teamRows[0]

  const [memberRows] = await pool.execute(
    `SELECT tm.userId, u.id, u.name, u.avatar, u.email
     FROM TeamMember tm INNER JOIN User u ON tm.userId = u.id
     WHERE tm.teamId = ?`,
    [id]
  )
  const [incidentRows] = await pool.execute(
    'SELECT id, title, status FROM Incident WHERE assignedToId = ?',
    [id]
  )
  team.members = memberRows.map(r => ({ userId: r.userId, user: { id: r.id, name: r.name, avatar: r.avatar, email: r.email } }))
  team.incidents = incidentRows
  return team
}

async function fetchAllTeams() {
  const [teams] = await pool.execute('SELECT * FROM Team ORDER BY id ASC')
  if (!teams.length) return []

  const teamIds = teams.map(t => t.id)
  const placeholders = teamIds.map(() => '?').join(',')

  const [memberRows, incidentRows] = await Promise.all([
    pool.execute(
      `SELECT tm.teamId, tm.userId, u.id, u.name, u.avatar, u.email
       FROM TeamMember tm INNER JOIN User u ON tm.userId = u.id
       WHERE tm.teamId IN (${placeholders})`,
      teamIds
    ).then(([rows]) => rows),
    pool.execute(
      `SELECT id, title, status, assignedToId FROM Incident WHERE assignedToId IN (${placeholders})`,
      teamIds
    ).then(([rows]) => rows),
  ])

  // Group by teamId using Maps — O(n) instead of O(n*m) filter per team
  const membersByTeam = new Map()
  for (const r of memberRows) {
    if (!membersByTeam.has(r.teamId)) membersByTeam.set(r.teamId, [])
    membersByTeam.get(r.teamId).push({ userId: r.userId, user: { id: r.id, name: r.name, avatar: r.avatar, email: r.email } })
  }
  const incidentsByTeam = new Map()
  for (const r of incidentRows) {
    if (!incidentsByTeam.has(r.assignedToId)) incidentsByTeam.set(r.assignedToId, [])
    incidentsByTeam.get(r.assignedToId).push({ id: r.id, title: r.title, status: r.status })
  }

  return teams.map(team => ({
    ...team,
    members: membersByTeam.get(team.id) || [],
    incidents: incidentsByTeam.get(team.id) || [],
  }))
}

router.get('/', async (req, res) => {
  try {
    const cached = cacheGet('teams')
    if (cached) return res.json(cached)

    const teams = await fetchAllTeams()
    cacheSet('teams', teams, 60_000)
    res.json(teams)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.get('/:id', async (req, res) => {
  try {
    const team = await fetchTeam(+req.params.id)
    if (!team) return res.status(404).json({ error: 'Not found' })
    res.json(team)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.post('/', async (req, res) => {
  try {
    const { name, status, specialty, memberIds = [] } = req.body
    const [result] = await pool.execute(
      'INSERT INTO Team (name, status, specialty) VALUES (?, ?, ?)',
      [name, status ?? 'Available', specialty]
    )
    const newId = result.insertId
    if (memberIds.length) {
      const values = memberIds.map(uid => [+uid, newId])
      await pool.query('INSERT INTO TeamMember (userId, teamId) VALUES ?', [values])
    }
    const team = await fetchTeam(newId)
    cacheDel('teams')
    emit('team:updated', team)
    res.status(201).json(team)
  } catch (e) { res.status(400).json({ error: e.message }) }
})

router.put('/:id', async (req, res) => {
  try {
    const id = +req.params.id
    const { name, status, specialty, memberIds } = req.body
    const fields = [], vals = []
    if (name      !== undefined) { fields.push('name = ?');      vals.push(name) }
    if (status    !== undefined) { fields.push('status = ?');    vals.push(status) }
    if (specialty !== undefined) { fields.push('specialty = ?'); vals.push(specialty) }
    if (fields.length) {
      vals.push(id)
      await pool.execute(`UPDATE Team SET ${fields.join(', ')} WHERE id = ?`, vals)
    }
    if (memberIds !== undefined) {
      await pool.execute('DELETE FROM TeamMember WHERE teamId = ?', [id])
      if (memberIds.length) {
        const values = memberIds.map(uid => [+uid, id])
        await pool.query('INSERT INTO TeamMember (userId, teamId) VALUES ?', [values])
      }
    }
    const team = await fetchTeam(id)
    if (!team) return res.status(404).json({ error: 'Not found' })
    cacheDel('teams')
    emit('team:updated', team)
    res.json(team)
  } catch (e) { res.status(400).json({ error: e.message }) }
})

router.delete('/:id', async (req, res) => {
  try {
    const id = +req.params.id
    await pool.execute('DELETE FROM Team WHERE id = ?', [id])
    cacheDel('teams')
    emit('team:deleted', { id })
    res.json({ ok: true })
  } catch (e) { res.status(400).json({ error: e.message }) }
})

export default router
