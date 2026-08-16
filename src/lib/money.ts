import type { Cents } from './types'

/** 123456 -> "RM 1,234.56". Negative values keep the sign in front: "-RM 12.00". */
export function formatCents(cents: Cents): string {
  const sign = cents < 0 ? '-' : ''
  const abs = Math.abs(cents)
  const whole = Math.floor(abs / 100).toLocaleString('en-MY')
  const frac = String(abs % 100).padStart(2, '0')
  return `${sign}RM ${whole}.${frac}`
}

/** "2026-08-15" -> "Sat 15 Aug". Display only. */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  const weekday = date.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' })
  const month = date.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' })
  return `${weekday} ${d} ${month}`
}
