import { Router } from 'express'
import pool, { parseJson } from '../lib/db.js'
import { authenticate } from '../middleware/auth.js'
import { cacheGet, cacheSet, cacheDel } from '../lib/cache.js'

const router = Router()
router.use(authenticate)

// GET /api/admin/system-config
router.get('/system-config', async (req, res) => {
  try {
    const cached = cacheGet('system_config')
    if (cached) return res.json(cached)

    const [rows] = await pool.execute('SELECT * FROM SystemConfig WHERE id = 1')
    if (!rows.length) return res.status(404).json({ error: 'Not found' })
    cacheSet('system_config', rows[0], 120_000)
    res.json(rows[0])
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// PUT /api/admin/system-config
router.put('/system-config', async (req, res) => {
  try {
    const { siteName, timezone, sessionTimeout, maxFileSize, alertEmail, logoImage } = req.body
    const fields = [], vals = []
    if (siteName       !== undefined) { fields.push('siteName = ?');       vals.push(siteName) }
    if (timezone       !== undefined) { fields.push('timezone = ?');       vals.push(timezone) }
    if (sessionTimeout !== undefined) { fields.push('sessionTimeout = ?'); vals.push(+sessionTimeout) }
    if (maxFileSize    !== undefined) { fields.push('maxFileSize = ?');    vals.push(+maxFileSize) }
    if (alertEmail     !== undefined) { fields.push('alertEmail = ?');     vals.push(alertEmail) }
    if (logoImage      !== undefined) { fields.push('logoImage = ?');      vals.push(logoImage) }
    if (fields.length) {
      vals.push(1)
      await pool.execute(`UPDATE SystemConfig SET ${fields.join(', ')} WHERE id = ?`, vals)
    }
    const [rows] = await pool.execute('SELECT * FROM SystemConfig WHERE id = 1')
    cacheDel('system_config')
    res.json(rows[0])
  } catch (e) { res.status(400).json({ error: e.message }) }
})

// GET /api/admin/backup-config
router.get('/backup-config', async (req, res) => {
  try {
    const cached = cacheGet('backup_config')
    if (cached) return res.json(cached)

    const [rows] = await pool.execute('SELECT * FROM BackupConfig WHERE id = 1')
    if (!rows.length) return res.status(404).json({ error: 'Not found' })
    const config = { ...rows[0], schedule: parseJson(rows[0].schedule) }
    cacheSet('backup_config', config, 120_000)
    res.json(config)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// PUT /api/admin/backup-config
router.put('/backup-config', async (req, res) => {
  try {
    const { autoBackup, schedule, backupLocation, retentionDays } = req.body
    const fields = [], vals = []
    if (autoBackup     !== undefined) { fields.push('autoBackup = ?');     vals.push(autoBackup ? 1 : 0) }
    if (schedule       !== undefined) { fields.push('schedule = ?');       vals.push(JSON.stringify(schedule)) }
    if (backupLocation !== undefined) { fields.push('backupLocation = ?'); vals.push(backupLocation) }
    if (retentionDays  !== undefined) { fields.push('retentionDays = ?');  vals.push(+retentionDays) }
    if (fields.length) {
      vals.push(1)
      await pool.execute(`UPDATE BackupConfig SET ${fields.join(', ')} WHERE id = ?`, vals)
    }
    const [rows] = await pool.execute('SELECT * FROM BackupConfig WHERE id = 1')
    const config = { ...rows[0], schedule: parseJson(rows[0].schedule) }
    cacheDel('backup_config')
    res.json(config)
  } catch (e) { res.status(400).json({ error: e.message }) }
})

export default router
