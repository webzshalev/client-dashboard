const SECRET = import.meta.env.VITE_LINK_SECRET || 'webz'
const SEP = ':'

export function encodeClientId(clientId) {
  const raw = `${SECRET}${SEP}${clientId}`
  return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

export function decodeToken(token) {
  try {
    let b64 = token.replace(/-/g, '+').replace(/_/g, '/')
    while (b64.length % 4 !== 0) b64 += '='
    const decoded = atob(b64)
    const idx = decoded.indexOf(SEP)
    if (idx === -1) return null
    if (decoded.substring(0, idx) !== SECRET) return null
    const id = decoded.substring(idx + 1)
    const num = Number(id)
    if (!Number.isFinite(num) || !Number.isInteger(num) || num <= 0) return null
    return num
  } catch { return null }
}
