require('dotenv').config()

const express = require('express')
const cors = require('cors')
const { runMigrations } = require('./db/migrations')

runMigrations()

const app = express()

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/budget', require('./routes/budget'))
app.use('/api/links',  require('./routes/links'))
app.use('/api/monitor', require('./routes/proxy'))

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`)
})

module.exports = app
