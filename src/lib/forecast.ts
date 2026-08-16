import { addDays, type ISODate } from './dates'
import { expand } from './recurrence'
import type { CashItem, Cents, DayBalance, Forecast, Occurrence } from './types'

/**
 * Within a single day, apply money going OUT before money coming IN.
 *
 * DECISION: this is the pessimistic ordering. If rent leaves and salary arrives
 * on the same date, we assume the worst case — the debit clears first and the
 * account dips. Banks don't guarantee intra-day ordering, so a forecast that
 * assumes the favourable order would tell you you're fine on a day you might
 * actually bounce. A cash-flow tool that is optimistic about the tight days is
 * worse than useless.
 */
function debitsFirst(a: Occurrence, b: Occurrence): number {
  return a.deltaCents - b.deltaCents
}

/**
 * Build a day-by-day balance projection across [windowStart, windowEnd].
 *
 * Every day in the window appears in the output, including days with no
 * activity — the chart needs a continuous series, and "nothing happened" is
 * itself information when you're looking for the tight stretch.
 */
export function buildForecast(
  items: CashItem[],
  openingCents: Cents,
  windowStart: ISODate,
  windowEnd: ISODate
): Forecast {
  // Expand every item once, then bucket occurrences by the date they land on.
  const byDate = new Map<ISODate, Occurrence[]>()
  for (const item of items) {
    for (const occ of expand(item, windowStart, windowEnd)) {
      const bucket = byDate.get(occ.date)
      if (bucket) bucket.push(occ)
      else byDate.set(occ.date, [occ])
    }
  }

  const days: DayBalance[] = []
  let running = openingCents

  for (let date = windowStart; date <= windowEnd; date = addDays(date, 1)) {
    const occurrences = (byDate.get(date) ?? []).sort(debitsFirst)

    const openingForDay = running
    let lowest = running
    for (const occ of occurrences) {
      running += occ.deltaCents
      if (running < lowest) lowest = running
    }

    days.push({
      date,
      openingCents: openingForDay,
      occurrences,
      lowestCents: lowest,
      closingCents: running,
    })
  }

  // The trough is the lowest point the balance reaches, using each day's
  // intra-day low rather than its closing balance. Ties resolve to the earliest
  // date, because the first time you run out is the one you need to plan for.
  let trough = days[0]
  for (const day of days) {
    if (day.lowestCents < trough.lowestCents) trough = day
  }

  return {
    days,
    troughDate: trough.date,
    troughCents: trough.lowestCents,
    goesNegative: trough.lowestCents < 0,
  }
}
