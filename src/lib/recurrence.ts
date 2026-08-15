import {
  addDays,
  daysBetween,
  daysInMonth,
  fromParts,
  isWeekend,
  toParts,
  type ISODate,
} from './dates'
import type { CashItem, Occurrence, RecurrenceRule, WeekendPolicy } from './types'

/**
 * Occurrences are generated over a window padded by a week on each side, because
 * the weekend shift can move a date across the window boundary in either
 * direction. We generate wide, shift, then clip to the real window.
 */
const PAD_DAYS = 7

function inRange(d: ISODate, from: ISODate, to: ISODate): boolean {
  return d >= from && d <= to      // ISO strings compare correctly as strings
}

/** Every (year, month) pair touched by [from, to], inclusive. */
function monthsBetween(from: ISODate, to: ISODate): { y: number; m: number }[] {
  const start = toParts(from)
  const end = toParts(to)
  const out: { y: number; m: number }[] = []
  let y = start.y
  let m = start.m
  while (y < end.y || (y === end.y && m <= end.m)) {
    out.push({ y, m })
    m++
    if (m > 12) {
      m = 1
      y++
    }
  }
  return out
}

/**
 * Clamp a day-of-month to the last valid day of that month.
 * DECISION: day 31 in February becomes the 28th (29th in a leap year) rather
 * than skipping the month. Real billers bill — they don't skip February.
 */
function clampDay(y: number, m: number, day: number): ISODate {
  return fromParts(y, m, Math.min(day, daysInMonth(y, m)))
}

/** Raw dates the rule produces in [from, to], before any weekend adjustment. */
function scheduledDates(rule: RecurrenceRule, from: ISODate, to: ISODate): ISODate[] {
  switch (rule.kind) {
    case 'once':
      return inRange(rule.date, from, to) ? [rule.date] : []

    case 'everyNDays': {
      if (rule.n < 1) return []
      // Solve for the k range where anchor + k*n lands inside [from, to].
      // k is allowed to go negative, which is how an anchor after the window
      // still produces occurrences inside it.
      const kStart = Math.ceil(daysBetween(rule.anchor, from) / rule.n)
      const kEnd = Math.floor(daysBetween(rule.anchor, to) / rule.n)
      const out: ISODate[] = []
      for (let k = kStart; k <= kEnd; k++) {
        out.push(addDays(rule.anchor, k * rule.n))
      }
      return out
    }

    case 'monthlyOnDay':
      return monthsBetween(from, to)
        .map(({ y, m }) => clampDay(y, m, rule.day))
        .filter(d => inRange(d, from, to))

    case 'semiMonthly':
      return monthsBetween(from, to)
        .flatMap(({ y, m }) => rule.days.map(day => clampDay(y, m, day)))
        .filter(d => inRange(d, from, to))

    case 'annualOn': {
      const out: ISODate[] = []
      for (let y = toParts(from).y; y <= toParts(to).y; y++) {
        // Clamped so a 29 Feb rule still fires (on the 28th) in non-leap years.
        const d = clampDay(y, rule.month, rule.day)
        if (inRange(d, from, to)) out.push(d)
      }
      return out
    }
  }
}

/**
 * Move a date off a weekend.
 *
 * The default differs by direction: salary due Saturday usually arrives Friday,
 * a bill due Saturday usually clears Monday. Same weekend, opposite shift.
 * Kept separate from generation so the two concerns stay independently testable.
 */
function applyWeekendPolicy(d: ISODate, policy: WeekendPolicy): ISODate {
  if (policy === 'none') return d
  const step = policy === 'nextBusinessDay' ? 1 : -1
  let out = d
  while (isWeekend(out)) out = addDays(out, step)
  return out
}

/**
 * Expand one item's rule into every occurrence within [windowStart, windowEnd],
 * inclusive on both ends, sorted ascending, weekend policy applied.
 *
 * Pipeline order (DECISION): generate wide → clip to the item's own start/end →
 * apply the weekend shift → clip to the window → sort. Shifting before the
 * window clip means an occurrence is judged on where it actually lands, not
 * where it was nominally scheduled. A consequence we accept: a shift can push
 * an occurrence into the next calendar month, matching how a bank statement
 * actually reads.
 */
export function expand(
  item: CashItem,
  windowStart: ISODate,
  windowEnd: ISODate
): Occurrence[] {
  const from = addDays(windowStart, -PAD_DAYS)
  const to = addDays(windowEnd, PAD_DAYS)

  return scheduledDates(item.rule, from, to)
    .filter(d => !item.startDate || d >= item.startDate)
    .filter(d => !item.endDate || d <= item.endDate)
    .map(scheduledDate => ({
      itemId: item.id,
      label: item.label,
      scheduledDate,
      date: applyWeekendPolicy(scheduledDate, item.weekendPolicy),
      deltaCents: item.direction === 'out' ? -item.amountCents : item.amountCents,
    }))
    .filter(o => inRange(o.date, windowStart, windowEnd))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
}