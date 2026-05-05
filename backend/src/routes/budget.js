const { Router } = require('express')
const db = require('../db/client')

const router = Router()

router.get('/:clientId', (req, res) => {
  const clientId = parseInt(req.params.clientId, 10)
  const { month, year, project } = req.query

  let query = 'SELECT * FROM budgets WHERE client_id = ?'
  const params = [clientId]

  if (month) { query += ' AND month = ?'; params.push(parseInt(month, 10)) }
  if (year)  { query += ' AND year = ?';  params.push(parseInt(year, 10))  }
  if (project) { query += ' AND project_name = ?'; params.push(project) }

  const rows = db.prepare(query).all(...params)
  res.json({ success: true, data: rows })
})

router.post('/:clientId', (req, res) => {
  const clientId = parseInt(req.params.clientId, 10)
  const {
    project_name = '_global',
    platform = '_all',
    monthly_budget = 0,
    actual_spend = 0,
    leads_override = null,
    month,
    year,
  } = req.body

  if (!month || !year) {
    return res.status(400).json({ success: false, error: 'month and year are required' })
  }

  const stmt = db.prepare(`
    INSERT INTO budgets (client_id, project_name, platform, monthly_budget, actual_spend, leads_override, month, year, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(client_id, project_name, platform, month, year) DO UPDATE SET
      monthly_budget = excluded.monthly_budget,
      actual_spend   = excluded.actual_spend,
      leads_override = excluded.leads_override,
      updated_at     = CURRENT_TIMESTAMP
  `)

  stmt.run(clientId, project_name, platform, monthly_budget, actual_spend, leads_override, month, year)

  const row = db.prepare(
    'SELECT * FROM budgets WHERE client_id = ? AND project_name = ? AND platform = ? AND month = ? AND year = ?'
  ).get(clientId, project_name, platform, month, year)

  res.json({ success: true, data: row })
})

module.exports = router
