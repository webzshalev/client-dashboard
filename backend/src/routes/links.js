const { Router } = require('express')
const crypto = require('crypto')
const db = require('../db/client')

const router = Router()

router.post('/', (req, res) => {
  const { client_id, label } = req.body

  if (!client_id) {
    return res.status(400).json({ success: false, error: 'client_id is required' })
  }

  const token = crypto.randomBytes(24).toString('hex')

  db.prepare(
    'INSERT INTO dashboard_links (token, client_id, label) VALUES (?, ?, ?)'
  ).run(token, client_id, label || null)

  const base = process.env.FRONTEND_URL || 'http://localhost:5177'
  res.status(201).json({
    success: true,
    data: { token, url: `${base}/dashboard/${client_id}?token=${token}` },
  })
})

router.get('/:token', (req, res) => {
  const row = db.prepare(
    'SELECT client_id, label, is_active FROM dashboard_links WHERE token = ?'
  ).get(req.params.token)

  if (!row || !row.is_active) {
    return res.status(404).json({ success: false, error: 'Link not found or inactive' })
  }

  res.json({ success: true, data: row })
})

module.exports = router
