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

/**
 * "1,200.50" -> 120050. Accepts an optional RM prefix and thousands separators.
 * Returns null on anything it can't parse, so the caller decides what to show.
 *
 * Parsing to an integer here rather than a float is the whole point: 12.10 as a
 * float is 12.099999999999998, and a forecast built on that drifts.
 */
export function parseAmountToCents(input: string): Cents | null {
  const cleaned = input.trim().replace(/^RM\s*/i, '').replace(/,/g, '')
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null
  const [whole, frac = ''] = cleaned.split('.')
  return Number(whole) * 100 + Number(frac.padEnd(2, '0'))
}

/** 120050 -> "1200.50". For pre-filling an input, no symbol or separators. */
export function centsToInput(cents: Cents): string {
  return (cents / 100).toFixed(2)
}
