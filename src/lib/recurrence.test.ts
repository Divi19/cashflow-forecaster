import { describe, it, expect } from 'vitest'
import { expand } from './recurrence'
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

const dates = (occ: { date: string }[]) => occ.map(o => o.date)

describe('monthlyOnDay', () => {
  it('fires once per month on the given day', () => {
    const r = expand(item({ rule: { kind: 'monthlyOnDay', day: 15 } }),
                     '2026-01-01', '2026-03-31')
    expect(dates(r)).toEqual(['2026-01-15', '2026-02-15', '2026-03-15'])
  })

  it('clamps day 31 to the last day of short months', () => {
    const r = expand(item({ rule: { kind: 'monthlyOnDay', day: 31 } }),
                     '2026-01-01', '2026-04-30')
    expect(dates(r)).toEqual(['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30'])
  })

  it('clamps to 29 Feb in a leap year', () => {
    const r = expand(item({ rule: { kind: 'monthlyOnDay', day: 30 } }),
                     '2028-02-01', '2028-02-29')
    expect(dates(r)).toEqual(['2028-02-29'])
  })

  it('includes occurrences on both window boundaries', () => {
    const r = expand(item({ rule: { kind: 'monthlyOnDay', day: 1 } }),
                     '2026-01-01', '2026-02-01')
    expect(dates(r)).toEqual(['2026-01-01', '2026-02-01'])
  })
})

describe('everyNDays vs semiMonthly', () => {
  it('every 14 days produces three paydays in some months', () => {
    const r = expand(item({ rule: { kind: 'everyNDays', n: 14, anchor: '2026-01-02' } }),
                     '2026-01-01', '2026-01-31')
    expect(dates(r)).toEqual(['2026-01-02', '2026-01-16', '2026-01-30'])
  })

  it('semi-monthly produces exactly two, always', () => {
    const r = expand(item({ rule: { kind: 'semiMonthly', days: [1, 15] } }),
                     '2026-01-01', '2026-01-31')
    expect(dates(r)).toEqual(['2026-01-01', '2026-01-15'])
  })

  it('every 14 days yields 26 occurrences across a year, not 24', () => {
    const r = expand(item({ rule: { kind: 'everyNDays', n: 14, anchor: '2026-01-02' } }),
                     '2026-01-01', '2026-12-31')
    expect(r).toHaveLength(26)
  })

  it('walks backward from an anchor that sits after the window', () => {
    const r = expand(item({ rule: { kind: 'everyNDays', n: 7, anchor: '2026-03-04' } }),
                     '2026-02-01', '2026-02-28')
    expect(dates(r)).toContain('2026-02-25')
    expect(dates(r)).toHaveLength(4)
  })
})

describe('weekend policy', () => {
  // 2026-08-01 is a Saturday; 2026-08-02 is a Sunday.
  it('shifts an outgoing bill forward to Monday', () => {
    const r = expand(item({
      rule: { kind: 'monthlyOnDay', day: 1 },
      weekendPolicy: 'nextBusinessDay',
    }), '2026-08-01', '2026-08-31')
    expect(r[0].date).toBe('2026-08-03')
    expect(r[0].scheduledDate).toBe('2026-08-01')
  })

  it('shifts incoming salary back to Friday', () => {
    const r = expand(item({
      direction: 'in',
      rule: { kind: 'monthlyOnDay', day: 1 },
      weekendPolicy: 'previousBusinessDay',
    }), '2026-07-01', '2026-08-31')
    const august = r.find(o => o.scheduledDate === '2026-08-01')
    expect(august?.date).toBe('2026-07-31')
  })

  it('leaves weekday occurrences untouched', () => {
    const r = expand(item({
      rule: { kind: 'monthlyOnDay', day: 5 },   // 2026-08-05 is a Wednesday
      weekendPolicy: 'nextBusinessDay',
    }), '2026-08-01', '2026-08-31')
    expect(r[0].date).toBe(r[0].scheduledDate)
  })
})

describe('annual and once', () => {
  it('fires an annual renewal once per year', () => {
    const r = expand(item({ rule: { kind: 'annualOn', month: 6, day: 20 } }),
                     '2026-01-01', '2027-12-31')
    expect(dates(r)).toEqual(['2026-06-20', '2027-06-20'])
  })

  it('emits a one-off only if it falls inside the window', () => {
    const inside = expand(item({ rule: { kind: 'once', date: '2026-08-10' } }),
                          '2026-08-01', '2026-08-31')
    const outside = expand(item({ rule: { kind: 'once', date: '2026-09-10' } }),
                           '2026-08-01', '2026-08-31')
    expect(dates(inside)).toEqual(['2026-08-10'])
    expect(outside).toEqual([])
  })
})

describe('bounds and signs', () => {
  it('respects startDate and endDate', () => {
    const r = expand(item({
      rule: { kind: 'monthlyOnDay', day: 10 },
      startDate: '2026-02-01',
      endDate: '2026-03-31',
    }), '2026-01-01', '2026-05-31')
    expect(dates(r)).toEqual(['2026-02-10', '2026-03-10'])
  })

  it('signs outgoing amounts negative and incoming positive', () => {
    const out = expand(item({ direction: 'out', amountCents: 5_000 }),
                       '2026-01-01', '2026-01-31')
    const inc = expand(item({ direction: 'in', amountCents: 5_000 }),
                       '2026-01-01', '2026-01-31')
    expect(out[0].deltaCents).toBe(-5_000)
    expect(inc[0].deltaCents).toBe(5_000)
  })

  it('returns results sorted ascending', () => {
    const r = expand(item({ rule: { kind: 'semiMonthly', days: [25, 5] } }),
                     '2026-01-01', '2026-02-28')
    expect(dates(r)).toEqual([...dates(r)].sort())
  })
})