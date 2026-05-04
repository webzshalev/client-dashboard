import axios from 'axios'

const TENANT_ID = import.meta.env.VITE_TENANT_ID || '1'

// In dev the Vite proxy routes /api → https://api.truecontrol.co.il
// In production VITE_API_URL provides the full origin
const BASE = import.meta.env.PROD
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'

const api = axios.create({ baseURL: BASE })

// ── Request interceptor: attach token + tenant ─────────────────────────────
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('_mtoken')
  if (token) config.headers['Authorization'] = `Bearer ${token}`
  config.headers['X-Tenant-Id'] = TENANT_ID
  return config
})

// ── Response interceptor: auto-relogin on 401 ─────────────────────────────
api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        await loginWithEnvCredentials()
        const token = sessionStorage.getItem('_mtoken')
        original.headers['Authorization'] = `Bearer ${token}`
        return api(original)
      } catch {
        return Promise.reject(err)
      }
    }
    return Promise.reject(err)
  }
)

export async function loginWithEnvCredentials() {
  const res = await axios.post(`${BASE}/auth/login`, {
    username: import.meta.env.VITE_MONITOR_USERNAME,
    password: import.meta.env.VITE_MONITOR_PASSWORD,
  })
  sessionStorage.setItem('_mtoken', res.data.token)
  return res.data.token
}

let _loginPromise = null

export function ensureLoggedIn() {
  if (!_loginPromise) {
    _loginPromise = loginWithEnvCredentials().catch((e) => {
      _loginPromise = null
      throw e
    })
  }
  return _loginPromise
}

export default api
