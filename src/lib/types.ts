import type { ISODate } from './dates'

/**
 * Money is stored in cents as integers. 0.1 + 0.2 !== 0.3 in floating point,
 * and a forecast that's off by fractions of a sen at the trough is a forecast
 * you can't trust. Format to ringgit only at render time.
 */
export type Cents = number

/**
 * Recurrence rules. This union is deliberately small — it covers the cycles
 * that actually appear in a personal cash flow, and nothing else.
 *
 * Note that `everyNDays: 14` and `semiMonthly` are NOT the same thing:
 * every-14-days produces 26 payments a year, semi-monthly produces 24.
 * Two months a year have three biweekly paydays. Conflating them is the
 * most common way a forecast quietly drifts out of true.
 */
export type RecurrenceRule =
  | { kind: 'once'; date: ISODate }
  | { kind: 'everyNDays'; n: number; anchor: ISODate }
  | { kind: 'monthlyOnDay'; day: number }              // 1–31
  | { kind: 'semiMonthly'; days: [number, number] }    // e.g. [1, 15]
  | { kind: 'annualOn'; month: number; day: number }

/**
 * What happens when an occurrence lands on a weekend.
 *
 * Real-world default differs by direction: salary due Saturday usually
 * arrives Friday (previous), a bill due Saturday usually clears Monday (next).
 * Same weekend, opposite shift.
 */
export type WeekendPolicy = 'none' | 'previousBusinessDay' | 'nextBusinessDay'

export type Direction = 'in' | 'out'

export interface CashItem {
  id: string
  label: string
  amountCents: Cents        // always positive; `direction` carries the sign
  direction: Direction
  rule: RecurrenceRule
  weekendPolicy: WeekendPolicy
  startDate?: ISODate       // rule doesn't apply before this
  endDate?: ISODate         // rule doesn't apply after this
}

export interface Occurrence {
  itemId: string
  label: string
  date: ISODate             // AFTER weekend adjustment
  scheduledDate: ISODate    // BEFORE adjustment — keep both, the UI explains the shift
  deltaCents: Cents         // signed: negative for 'out'
}

export interface DayBalance {
  date: ISODate
  openingCents: Cents
  occurrences: Occurrence[]
  /**
   * The lowest the balance goes *during* the day, which is not always the
   * closing balance. If rent leaves and salary arrives on the same date, the
   * account dips before it recovers — and that dip is real money you didn't
   * have. See the ordering decision in forecast.ts.
   */
  lowestCents: Cents
  closingCents: Cents
}

export interface Forecast {
  days: DayBalance[]
  troughDate: ISODate
  troughCents: Cents
  goesNegative: boolean
}