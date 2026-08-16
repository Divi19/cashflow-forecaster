import { todayISO } from './dates'
import type { CashItem, Cents } from './types'

/**
 * A realistic Malaysian month, loaded on first run so the app is never empty.
 * Having concrete data on screen from the first render is deliberate: an empty
 * state teaches you nothing about whether the forecast is right.
 */
export const SEED_OPENING_CENTS: Cents = 2_100_00

export const SEED_ITEMS: CashItem[] = [
  {
    id: 'salary',
    label: 'Salary',
    amountCents: 3_800_00,
    direction: 'in',
    rule: { kind: 'monthlyOnDay', day: 25 },
    weekendPolicy: 'previousBusinessDay',
  },
  {
    id: 'rent',
    label: 'Rent',
    amountCents: 1_200_00,
    direction: 'out',
    rule: { kind: 'monthlyOnDay', day: 1 },
    weekendPolicy: 'nextBusinessDay',
  },
  {
    id: 'ptptn',
    label: 'PTPTN repayment',
    amountCents: 220_00,
    direction: 'out',
    rule: { kind: 'monthlyOnDay', day: 5 },
    weekendPolicy: 'nextBusinessDay',
  },
  {
    id: 'car-loan',
    label: 'Car loan',
    amountCents: 680_00,
    direction: 'out',
    rule: { kind: 'monthlyOnDay', day: 10 },
    weekendPolicy: 'nextBusinessDay',
  },
  {
    id: 'phone',
    label: 'Phone bill',
    amountCents: 88_00,
    direction: 'out',
    rule: { kind: 'monthlyOnDay', day: 12 },
    weekendPolicy: 'none',
  },
  {
    id: 'gym',
    label: 'Gym membership',
    amountCents: 120_00,
    direction: 'out',
    rule: { kind: 'monthlyOnDay', day: 2 },
    weekendPolicy: 'none',
  },
  {
    id: 'streaming',
    label: 'Streaming subscriptions',
    amountCents: 57_90,
    direction: 'out',
    rule: { kind: 'monthlyOnDay', day: 18 },
    weekendPolicy: 'none',
  },
  {
    id: 'groceries',
    label: 'Groceries',
    amountCents: 250_00,
    direction: 'out',
    // Fortnightly, anchored to today — the every-N-days cycle that drifts
    // against the calendar and produces three shops in some months.
    rule: { kind: 'everyNDays', n: 14, anchor: todayISO() },
    weekendPolicy: 'none',
  },
  {
    id: 'insurance',
    label: 'Car insurance + road tax',
    amountCents: 1_450_00,
    direction: 'out',
    // The annual renewal that quietly ruins a month.
    rule: { kind: 'annualOn', month: 10, day: 8 },
    weekendPolicy: 'nextBusinessDay',
  },
]
