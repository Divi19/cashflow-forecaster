/**
 * All dates in this app are plain calendar dates ('YYYY-MM-DD'), never timestamps.
 *
 * Why: a bill due on the 1st is due on the 1st in every timezone. Using JS Date
 * with local time means a reviewer in a different timezone can see an occurrence
 * shift by a day, which silently moves an annual renewal into the wrong month.
 * Every helper here goes through Date.UTC so the arithmetic can't drift.
 */
export type ISODate = string  // 'YYYY-MM-DD'

export function toParts(d: ISODate): { y: number; m: number; day: number } {
  const [y, m, day] = d.split('-').map(Number)
  return { y, m, day }
}

export function fromParts(y: number, m: number, day: number): ISODate {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${y}-${pad(m)}-${pad(day)}`
}

export function toUTC(d: ISODate): Date {
  const { y, m, day } = toParts(d)
  return new Date(Date.UTC(y, m - 1, day))
}

export function fromUTC(date: Date): ISODate {
  return fromParts(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate())
}

export function addDays(d: ISODate, n: number): ISODate {
  const date = toUTC(d)
  date.setUTCDate(date.getUTCDate() + n)
  return fromUTC(date)
}

export function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate()
}

/** 0 = Sunday ... 6 = Saturday */
export function weekday(d: ISODate): number {
  return toUTC(d).getUTCDay()
}

export function isWeekend(d: ISODate): boolean {
  const w = weekday(d)
  return w === 0 || w === 6
}

/** Inclusive whole-day difference. */
export function daysBetween(a: ISODate, b: ISODate): number {
  return Math.round((toUTC(b).getTime() - toUTC(a).getTime()) / 86_400_000)
}

export function compare(a: ISODate, b: ISODate): number {
  return a < b ? -1 : a > b ? 1 : 0   // ISO strings sort correctly as strings
}

/** Today, as a plain calendar date in the user's local timezone. */
export function todayISO(): ISODate {
  const d = new Date()
  return fromParts(d.getFullYear(), d.getMonth() + 1, d.getDate())
}