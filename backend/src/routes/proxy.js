const { Router } = require('express')
const axios = require('axios')

const router = Router()

const BASE_URL = process.env.VITE_API_URL || 'https://api.truecontrol.co.il'
const TENANT_ID = process.env.VITE_TENANT_ID || '1'

const monitorApi = axios.create({ baseURL: `${BASE_URL}/api` })

let _token = null

async function login() {
  const res = await axios.post(`${BASE_URL}/api/auth/login`, {
    username: process.env.VITE_MONITOR_USERNAME,
    password: process.env.VITE_MONITOR_PASSWORD,
  })
  _token = res.data.token
  return _token
}

async function proxyGet(monitorPath, query, res) {
  const params = new URLSearchParams(query).toString()
  const url = params ? `${monitorPath}?${params}` : monitorPath

  const doRequest = async (token) =>
    monitorApi.get(url, {
      headers: { Authorization: `Bearer ${token}`, 'X-Tenant-Id': TENANT_ID },
    })

  try {
    if (!_token) await login()
    const { data } = await doRequest(_token)
    return res.json(data)
  } catch (err) {
    if (err.response?.status === 401) {
      try {
        _token = null
        await login()
        const { data } = await doRequest(_token)
        return res.json(data)
      } catch (retryErr) {
        return res.status(retryErr.response?.status || 502).json({ success: false, error: retryErr.message })
      }
    }
    return res.status(err.response?.status || 502).json({ success: false, error: err.message })
  }
}

// Leads: date_from, date_to, page, per_page, sort, dir, search, platform, status, project_name
router.get('/client/:id/leads', (req, res) => proxyGet(`/leads/client/${req.params.id}`, req.query, res))

// Clients list (used to resolve client name)
router.get('/clients', (req, res) => proxyGet('/clients', req.query, res))

// Campaigns / projects: month, year
router.get('/campaigns', (req, res) => proxyGet('/campaigns', req.query, res))

module.exports = router
