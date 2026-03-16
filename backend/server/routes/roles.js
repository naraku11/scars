import { Router } from 'express'
import pool, { parseJson } from '../lib/db.js'
import { authenticate } from '../middleware/auth.js'
import { emit } from '../lib/socket.js'
import { cacheGet, cacheSet, cacheDel } from '../lib/cache.js'

const router = Router()
router.use(authenticate)

function mapRole(row) {
  return { ...row, permissions: parseJson(row.permissions) }
}

router.get('/', async (req, res) => {
  try {
    const cached = cacheGet('roles')
    if (cached) return res.json(cached)

    const [rows] = await pool.execute('SELECT * FROM Role ORDER BY level ASC')
    const roles = rows.map(mapRole)
    cacheSet('roles', roles, 300_000)
    res.json(roles)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM Role WHERE id = ?', [+req.params.id])
    if (!rows.length) return res.status(404).json({ error: 'Not found' })
    res.json(mapRole(rows[0]))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.post('/', async (req, res) => {
  try {
    const { name, description, color, level, permissions } = req.body
    const [result] = await pool.execute(
      'INSERT INTO Role (name, description, color, level, permissions) VALUES (?, ?, ?, ?, ?)',
      [name, description, color ?? '#2E7D32', level ?? 99, JSON.stringify(permissions)]
    )
    const [rows] = await pool.execute('SELECT * FROM Role WHERE id = ?', [result.insertId])
    const role = mapRole(rows[0])
    cacheDel('roles')
    emit('role:updated', role)
    res.status(201).json(role)
  } catch (e) { res.status(400).json({ error: e.message }) }
})

router.put('/:id', async (req, res) => {
  try {
    const id = +req.params.id
    const { name, description, color, level, permissions } = req.body
    const fields = [], vals = []
    if (name        !== undefined) { fields.push('name = ?');        vals.push(name) }
    if (description !== undefined) { fields.push('description = ?'); vals.push(description) }
    if (color       !== undefined) { fields.push('color = ?');       vals.push(color) }
    if (level       !== undefined) { fields.push('level = ?');       vals.push(+level) }
    if (permissions !== undefined) { fields.push('permissions = ?'); vals.push(JSON.stringify(permissions)) }
    if (fields.length) {
      vals.push(id)
      await pool.execute(`UPDATE Role SET ${fields.join(', ')} WHERE id = ?`, vals)
    }
    const [rows] = await pool.execute('SELECT * FROM Role WHERE id = ?', [id])
    if (!rows.length) return res.status(404).json({ error: 'Not found' })
    const role = mapRole(rows[0])
    cacheDel('roles')
    emit('role:updated', role)
    res.json(role)
  } catch (e) { res.status(400).json({ error: e.message }) }
})

router.delete('/:id', async (req, res) => {
  try {
    const id = +req.params.id
    await pool.execute('DELETE FROM Role WHERE id = ?', [id])
    cacheDel('roles')
    emit('role:deleted', { id })
    res.json({ ok: true })
  } catch (e) { res.status(400).json({ error: e.message }) }
})

export default router
