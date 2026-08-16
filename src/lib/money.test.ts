import { describe, it, expect } from 'vitest'
import { parseAmountToCents, formatCents } from './money'

describe('parseAmountToCents', () => {
  it('parses plain and decimal amounts', () => {
    expect(parseAmountToCents('1200')).toBe(120_000)
    expect(parseAmountToCents('12.50')).toBe(1250)
    expect(parseAmountToCents('0.05')).toBe(5)
  })

  it('tolerates separators and an RM prefix', () => {
    expect(parseAmountToCents('1,200.50')).toBe(120_050)
    expect(parseAmountToCents('RM 88')).toBe(8800)
    expect(parseAmountToCents('  rm1,000  ')).toBe(100_000)
  })

  it('pads a single decimal place', () => {
    expect(parseAmountToCents('12.5')).toBe(1250)
  })

  it('rejects anything it cannot parse cleanly', () => {
    expect(parseAmountToCents('abc')).toBeNull()
    expect(parseAmountToCents('12.345')).toBeNull()
    expect(parseAmountToCents('-5')).toBeNull()
    expect(parseAmountToCents('')).toBeNull()
  })

  it('avoids floating-point drift on amounts that break naive parsing', () => {
    // 12.10 * 100 === 1209.9999999999998 in floating point.
    expect(parseAmountToCents('12.10')).toBe(1210)
    expect(parseAmountToCents('0.29')).toBe(29)
  })
})

describe('formatCents', () => {
  it('formats with a symbol, separators, and two decimals', () => {
    expect(formatCents(120_050)).toBe('RM 1,200.50')
    expect(formatCents(5)).toBe('RM 0.05')
  })

  it('puts the sign in front of the symbol', () => {
    expect(formatCents(-1200)).toBe('-RM 12.00')
  })
})
