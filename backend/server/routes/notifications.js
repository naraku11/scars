import { Router } from 'express'
import pool, { mapNotification } from '../lib/db.js'
import { authenticate } from '../middleware/auth.js'
import { emit } from '../lib/socket.js'
import { cacheGet, cacheSet, cacheDel } from '../lib/cache.js'

const router = Router()
router.use(authenticate)

const NOTIF_SELECT = `
  SELECT n.id, n.type, n.title, n.message, n.target, n.status, n.sentAt, n.sentById,
         u.id AS sb_id, u.name AS sb_name, u.avatar AS sb_avatar
  FROM Notification n
  INNER JOIN User u ON n.sentById = u.id`

router.get('/', async (req, res) => {
  try {
    const cached = cacheGet('notifications')
    if (cached) return res.json(cached)

    const [rows] = await pool.execute(`${NOTIF_SELECT} ORDER BY n.sentAt DESC`)
    const notifications = rows.map(mapNotification)
    cacheSet('notifications', notifications, 30_000)
    res.json(notifications)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.post('/', async (req, res) => {
  try {
    const { type, title, message, target, sentById } = req.body
    const [result] = await pool.execute(
      'INSERT INTO Notification (type, title, message, target, sentById) VALUES (?, ?, ?, ?, ?)',
      [type, title, message, target, +sentById]
    )
    const [rows] = await pool.execute(`${NOTIF_SELECT} WHERE n.id = ?`, [result.insertId])
    const notification = mapNotification(rows[0])
    cacheDel('notifications')
    emit('notification:sent', notification)
    res.status(201).json(notification)
  } catch (e) { res.status(400).json({ error: e.message }) }
})

router.delete('/:id', async (req, res) => {
  try {
    const id = +req.params.id
    await pool.execute('DELETE FROM Notification WHERE id = ?', [id])
    cacheDel('notifications')
    emit('notification:deleted', { id })
    res.json({ ok: true })
  } catch (e) { res.status(400).json({ error: e.message }) }
})

export default router
