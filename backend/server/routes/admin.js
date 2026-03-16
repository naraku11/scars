import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()
router.use(authenticate)

// GET /api/admin/system-config
router.get('/system-config', async (req, res) => {
  try {
    const config = await prisma.systemConfig.findUnique({ where: { id: 1 } })
    res.json(config)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// PUT /api/admin/system-config
router.put('/system-config', async (req, res) => {
  try {
    const { siteName, timezone, sessionTimeout, maxFileSize, alertEmail, logoImage } = req.body
    const data = {}
    if (siteName       !== undefined) data.siteName       = siteName
    if (timezone       !== undefined) data.timezone       = timezone
    if (sessionTimeout !== undefined) data.sessionTimeout = +sessionTimeout
    if (maxFileSize    !== undefined) data.maxFileSize    = +maxFileSize
    if (alertEmail     !== undefined) data.alertEmail     = alertEmail
    if (logoImage      !== undefined) data.logoImage      = logoImage
    const config = await prisma.systemConfig.update({ where: { id: 1 }, data })
    res.json(config)
  } catch (e) { res.status(400).json({ error: e.message }) }
})

// GET /api/admin/backup-config
router.get('/backup-config', async (req, res) => {
  try {
    const config = await prisma.backupConfig.findUnique({ where: { id: 1 } })
    res.json(config)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// PUT /api/admin/backup-config
router.put('/backup-config', async (req, res) => {
  try {
    const { autoBackup, schedule, backupLocation, retentionDays } = req.body
    const data = {}
    if (autoBackup     !== undefined) data.autoBackup     = autoBackup
    if (schedule       !== undefined) data.schedule       = schedule
    if (backupLocation !== undefined) data.backupLocation = backupLocation
    if (retentionDays  !== undefined) data.retentionDays  = +retentionDays
    const config = await prisma.backupConfig.update({ where: { id: 1 }, data })
    res.json(config)
  } catch (e) { res.status(400).json({ error: e.message }) }
})

export default router
