import { describe, it, expect } from 'vitest'
import { buildForecast } from './forecast'
import type { CashItem } from './types'

const item = (over: Partial<CashItem>): CashItem => ({
  id: 'x',
  label: 'Test',
  amountCents: 10_000,
  direction: 'out',
  rule: { kind: 'monthlyOnDay', day: 1 },
  weekendPolicy: 'none',
  ...over,
})

const dayFor = (f: ReturnType<typeof buildForecast>, date: string) =>
  f.days.find(d => d.date === date)!

describe('window and shape', () => {
  it('emits every day in the window, inclusive of both ends', () => {
    const f = buildForecast([], 100_00, '2026-08-01', '2026-08-31')
    expect(f.days).toHaveLength(31)
    expect(f.days[0].date).toBe('2026-08-01')
    expect(f.days[30].date).toBe('2026-08-31')
  })

  it('holds the balance flat when there is no activity', () => {
    const f = buildForecast([], 250_00, '2026-08-01', '2026-08-05')
    expect(f.days.every(d => d.closingCents === 250_00)).toBe(true)
    expect(f.troughCents).toBe(250_00)
    expect(f.goesNegative).toBe(false)
  })

  it('carries the closing balance into the next day as opening', () => {
    const f = buildForecast(
      [item({ rule: { kind: 'once', date: '2026-08-02' }, amountCents: 30_00 })],
      100_00, '2026-08-01', '2026-08-03'
    )
    expect(dayFor(f, '2026-08-02').closingCents).toBe(70_00)
    expect(dayFor(f, '2026-08-03').openingCents).toBe(70_00)
  })
})

describe('golden scenario', () => {
  // Hand-computed. Opening RM1,000. Rent RM1,200 due the 1st — but 1 Aug 2026 is
  // a Saturday, so it shifts to Monday the 3rd. Salary RM3,000 on the 25th,
  // a Tuesday, so no shift.
  //
  //   1–2 Aug   1,000.00
  //   3 Aug     1,000.00 - 1,200.00 = -200.00   <- trough
  //   4–24 Aug   -200.00
  //   25 Aug     -200.00 + 3,000.00 = 2,800.00
  //   26–31 Aug  2,800.00
  const items = [
    item({
      id: 'rent', label: 'Rent', direction: 'out', amountCents: 1_200_00,
      rule: { kind: 'monthlyOnDay', day: 1 }, weekendPolicy: 'nextBusinessDay',
    }),
    item({
      id: 'salary', label: 'Salary', direction: 'in', amountCents: 3_000_00,
      rule: { kind: 'monthlyOnDay', day: 25 }, weekendPolicy: 'previousBusinessDay',
    }),
  ]

  const f = buildForecast(items, 1_000_00, '2026-08-01', '2026-08-31')

  it('shifts the weekend rent to Monday', () => {
    expect(dayFor(f, '2026-08-01').occurrences).toHaveLength(0)
    expect(dayFor(f, '2026-08-03').occurrences).toHaveLength(1)
  })

  it('matches the hand-computed balances', () => {
    expect(dayFor(f, '2026-08-02').closingCents).toBe(1_000_00)
    expect(dayFor(f, '2026-08-03').closingCents).toBe(-200_00)
    expect(dayFor(f, '2026-08-24').closingCents).toBe(-200_00)
    expect(dayFor(f, '2026-08-25').closingCents).toBe(2_800_00)
    expect(dayFor(f, '2026-08-31').closingCents).toBe(2_800_00)
  })

  it('finds the trough on the day rent actually clears', () => {
    expect(f.troughDate).toBe('2026-08-03')
    expect(f.troughCents).toBe(-200_00)
    expect(f.goesNegative).toBe(true)
  })
})

describe('same-day ordering', () => {
  // 10 Aug 2026 is a Monday. Rent out and salary in on the same date.
  // Debits first: 500.00 -> -500.00 -> 1,500.00
  const sameDay = [
    item({
      id: 'out', direction: 'out', amountCents: 1_000_00,
      rule: { kind: 'once', date: '2026-08-10' },
    }),
    item({
      id: 'in', direction: 'in', amountCents: 2_000_00,
      rule: { kind: 'once', date: '2026-08-10' },
    }),
  ]

  it('dips intra-day even though the day closes healthy', () => {
    const f = buildForecast(sameDay, 500_00, '2026-08-01', '2026-08-31')
    const d = dayFor(f, '2026-08-10')
    expect(d.lowestCents).toBe(-500_00)
    expect(d.closingCents).toBe(1_500_00)
  })

  it('reports the intra-day dip as the trough, not the closing balance', () => {
    const f = buildForecast(sameDay, 500_00, '2026-08-01', '2026-08-31')
    expect(f.troughDate).toBe('2026-08-10')
    expect(f.troughCents).toBe(-500_00)
    expect(f.goesNegative).toBe(true)
  })

  it('orders debits before credits within the day', () => {
    const f = buildForecast(sameDay, 500_00, '2026-08-01', '2026-08-31')
    const deltas = dayFor(f, '2026-08-10').occurrences.map(o => o.deltaCents)
    expect(deltas).toEqual([-1_000_00, 2_000_00])
  })
})

describe('trough selection', () => {
  it('resolves ties to the earliest date', () => {
    const f = buildForecast(
      [
        item({ rule: { kind: 'once', date: '2026-08-05' }, amountCents: 100_00 }),
        item({ id: 'y', direction: 'in', rule: { kind: 'once', date: '2026-08-10' }, amountCents: 100_00 }),
        item({ id: 'z', rule: { kind: 'once', date: '2026-08-15' }, amountCents: 100_00 }),
      ],
      500_00, '2026-08-01', '2026-08-31'
    )
    // Balance hits 400.00 on both the 5th and the 15th. Earliest wins.
    expect(f.troughDate).toBe('2026-08-05')
    expect(f.troughCents).toBe(400_00)
  })

  it('uses the opening balance as the trough when nothing ever goes out', () => {
    const f = buildForecast(
      [item({ direction: 'in', rule: { kind: 'once', date: '2026-08-10' } })],
      300_00, '2026-08-01', '2026-08-31'
    )
    expect(f.troughDate).toBe('2026-08-01')
    expect(f.troughCents).toBe(300_00)
  })
})
