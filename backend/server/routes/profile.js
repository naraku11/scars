import { Router } from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../lib/prisma.js'
import { authenticate } from '../middleware/auth.js'
import { emit } from '../lib/socket.js'

const router = Router()

// GET /api/profile — current user's full profile
router.get('/', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { role: true },
    })
    if (!user) return res.status(404).json({ error: 'User not found' })
    const { password: _, ...safe } = user
    res.json(safe)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/profile — update name, email, password, profileImage
router.put('/', authenticate, async (req, res) => {
  const { name, email, password, profileImage } = req.body
  try {
    const data = {}
    if (name)                      data.name = name
    if (email)                     data.email = email
    if (password)                  data.password = await bcrypt.hash(password, 10)
    if (profileImage !== undefined) data.profileImage = profileImage
    if (name) {
      data.avatar = name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'U'
    }
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
      include: { role: true },
    })
    const { password: _, ...safe } = user
    emit('user:updated', safe)
    res.json(safe)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/profile/verify-face — check if uploaded image contains a real face
router.post('/verify-face', authenticate, async (req, res) => {
  const { image } = req.body
  if (!image) return res.status(400).json({ error: 'No image provided' })

  const base64 = image.replace(/^data:image\/\w+;base64,/, '')

  // Rough size check (~0.75 bytes per base64 char)
  const sizeKB = Math.round(base64.length * 0.75 / 1024)
  if (sizeKB > 5120) {
    return res.json({ valid: false, message: 'Image too large (max 5MB). Please choose a smaller photo.' })
  }

  const apiKey    = process.env.FACEPP_API_KEY
  const apiSecret = process.env.FACEPP_API_SECRET

  if (!apiKey || !apiSecret) {
    // No Face++ credentials configured — accept any valid image
    return res.json({
      valid: true,
      faceCount: null,
      message: 'Image accepted.',
      noApi: true,
    })
  }

  try {
    const form = new FormData()
    form.append('api_key', apiKey)
    form.append('api_secret', apiSecret)
    form.append('image_base64', base64)

    const response = await fetch('https://api-us.faceplusplus.com/facepp/v3/detect', {
      method: 'POST',
      body: form,
    })
    const data = await response.json()

    if (data.error_message) throw new Error(data.error_message)

    const faceCount = data.faces?.length ?? 0
    const valid = faceCount === 1

    res.json({
      valid,
      faceCount,
      message: faceCount === 0
        ? 'No face detected. Please upload a clear portrait photo of yourself.'
        : faceCount > 1
        ? 'Multiple faces detected. Please use a solo portrait photo.'
        : 'Face verified successfully.',
    })
  } catch (err) {
    res.status(500).json({ error: 'Face verification service error: ' + err.message })
  }
})

export default router
