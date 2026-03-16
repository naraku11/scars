import { Router } from 'express'
import bcrypt from 'bcryptjs'
import pool, { USER_ROLE_SELECT, mapUser } from '../lib/db.js'
import { authenticate } from '../middleware/auth.js'
import { emit } from '../lib/socket.js'
import { cacheGet, cacheSet, cacheDel } from '../lib/cache.js'

const router = Router()
router.use(authenticate)

router.get('/', async (req, res) => {
  try {
    const cached = cacheGet('users')
    if (cached) return res.json(cached)

    const [rows] = await pool.execute(`${USER_ROLE_SELECT} ORDER BY u.id ASC`)
    const users = rows.map(mapUser)
    cacheSet('users', users, 60_000)
    res.json(users)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.get('/:id', async (req, res) => {
  try {
    const id = +req.params.id
    const cached = cacheGet(`user:${id}`)
    if (cached) return res.json(cached)

    const [rows] = await pool.execute(`${USER_ROLE_SELECT} WHERE u.id = ?`, [id])
    if (!rows.length) return res.status(404).json({ error: 'Not found' })
    const user = mapUser(rows[0])
    cacheSet(`user:${id}`, user, 60_000)
    res.json(user)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.post('/', async (req, res) => {
  try {
    const { name, email, password, avatar, roleId, status, joined } = req.body
    const hashed = await bcrypt.hash(password, 10)
    const joinedDate = joined ? new Date(joined) : new Date()
    const [result] = await pool.execute(
      'INSERT INTO User (name, email, password, avatar, roleId, status, joined) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, hashed, avatar, +roleId, status ?? 'Active', joinedDate]
    )
    const newId = result.insertId
    const [rows] = await pool.execute(`${USER_ROLE_SELECT} WHERE u.id = ?`, [newId])
    const user = mapUser(rows[0])
    cacheDel('users')
    emit('user:created', user)
    res.status(201).json(user)
  } catch (e) { res.status(400).json({ error: e.message }) }
})

router.put('/:id', async (req, res) => {
  try {
    const id = +req.params.id
    const { name, email, password, avatar, roleId, status } = req.body
    const fields = [], vals = []
    if (name     !== undefined) { fields.push('name = ?');     vals.push(name) }
    if (email    !== undefined) { fields.push('email = ?');    vals.push(email) }
    if (avatar   !== undefined) { fields.push('avatar = ?');   vals.push(avatar) }
    if (status   !== undefined) { fields.push('status = ?');   vals.push(status) }
    if (roleId   !== undefined) { fields.push('roleId = ?');   vals.push(+roleId) }
    if (password)               { fields.push('password = ?'); vals.push(await bcrypt.hash(password, 10)) }
    if (fields.length) {
      vals.push(id)
      await pool.execute(`UPDATE User SET ${fields.join(', ')} WHERE id = ?`, vals)
    }
    const [rows] = await pool.execute(`${USER_ROLE_SELECT} WHERE u.id = ?`, [id])
    if (!rows.length) return res.status(404).json({ error: 'Not found' })
    const user = mapUser(rows[0])
    cacheDel('users', `user:${id}`)
    emit('user:updated', user)
    res.json(user)
  } catch (e) { res.status(400).json({ error: e.message }) }
})

router.delete('/:id', async (req, res) => {
  try {
    const id = +req.params.id
    await pool.execute('DELETE FROM User WHERE id = ?', [id])
    cacheDel('users', `user:${id}`)
    emit('user:deleted', { id })
    res.json({ ok: true })
  } catch (e) { res.status(400).json({ error: e.message }) }
})

export default router
