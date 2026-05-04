export const PLATFORM_COLORS = {
  facebook: '#1877F2',
  instagram: '#E1306C',
  google: '#EA4335',
  tiktok: '#69C9D0',
  website: '#8B5CF6',
  webhook: '#EC4899',
  api: '#94A3B8',
  unknown: '#5A5E72',
}

export const PLATFORM_LABELS = {
  facebook: 'פייסבוק',
  instagram: 'אינסטגרם',
  google: 'גוגל',
  tiktok: 'טיקטוק',
  website: 'אתר',
  webhook: 'Webhook',
  api: 'API',
  unknown: 'לא ידוע',
}

export const STATUS_CONFIG = {
  sent:       { label: 'נשלח',    color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  pending:    { label: 'ממתין',   color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  processing: { label: 'בעיבוד', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  failed:     { label: 'נכשל',   color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  skipped:    { label: 'דולג',   color: '#94A3B8', bg: 'rgba(148,163,184,0.12)' },
  unknown:    { label: 'לא ידוע', color: '#5A5E72', bg: 'rgba(90,94,114,0.12)' },
}

export function getPlatformColor(platform) {
  return PLATFORM_COLORS[platform?.toLowerCase()] || PLATFORM_COLORS.unknown
}

export function getPlatformLabel(platform) {
  return PLATFORM_LABELS[platform?.toLowerCase()] || platform || 'לא ידוע'
}

export function getStatusConfig(status) {
  return STATUS_CONFIG[status?.toLowerCase()] || STATUS_CONFIG.unknown
}

export function formatNumber(n) {
  if (n == null) return '—'
  return Number(n).toLocaleString('he-IL')
}

export function formatCurrency(n) {
  if (n == null || n === 0) return '₪0'
  return '₪' + Number(n).toLocaleString('he-IL')
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
