import { useState } from 'react'
import { todayISO } from '../lib/dates'
import { parseAmountToCents } from '../lib/money'
import type { CashItem, Direction, RecurrenceRule } from '../lib/types'

type RuleKind = RecurrenceRule['kind']

const inputClass =
  'w-full rounded border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm ' +
  'text-neutral-100 focus:border-neutral-500 focus:outline-none'

const labelClass = 'block text-xs uppercase tracking-wide text-neutral-500 mb-1'

export function ItemForm({ onAdd }: { onAdd: (item: CashItem) => void }) {
  const [label, setLabel] = useState('')
  const [amount, setAmount] = useState('')
  const [direction, setDirection] = useState<Direction>('out')
  const [kind, setKind] = useState<RuleKind>('monthlyOnDay')
  const [day, setDay] = useState('1')
  const [day2, setDay2] = useState('15')
  const [month, setMonth] = useState('1')
  const [n, setN] = useState('14')
  const [anchor, setAnchor] = useState(todayISO())
  const [onceDate, setOnceDate] = useState(todayISO())
  const [error, setError] = useState<string | null>(null)

  function buildRule(): RecurrenceRule | string {
    const d = Number(day)
    switch (kind) {
      case 'once':
        return { kind: 'once', date: onceDate }
      case 'everyNDays': {
        const days = Number(n)
        if (!Number.isInteger(days) || days < 1) return 'Interval must be a whole number of days, 1 or more.'
        return { kind: 'everyNDays', n: days, anchor }
      }
      case 'monthlyOnDay':
        if (!Number.isInteger(d) || d < 1 || d > 31) return 'Day of month must be between 1 and 31.'
        return { kind: 'monthlyOnDay', day: d }
      case 'semiMonthly': {
        const d2 = Number(day2)
        if (!Number.isInteger(d) || d < 1 || d > 31) return 'First day must be between 1 and 31.'
        if (!Number.isInteger(d2) || d2 < 1 || d2 > 31) return 'Second day must be between 1 and 31.'
        return { kind: 'semiMonthly', days: [d, d2] }
      }
      case 'annualOn': {
        const m = Number(month)
        if (!Number.isInteger(m) || m < 1 || m > 12) return 'Month must be between 1 and 12.'
        if (!Number.isInteger(d) || d < 1 || d > 31) return 'Day must be between 1 and 31.'
        return { kind: 'annualOn', month: m, day: d }
      }
    }
  }

  function handleAdd() {
    if (!label.trim()) return setError('Give it a name.')

    const cents = parseAmountToCents(amount)
    if (cents === null) return setError('Amount must be a number like 1200 or 1,200.50.')
    if (cents === 0) return setError('Amount must be more than zero.')

    const rule = buildRule()
    if (typeof rule === 'string') return setError(rule)

    onAdd({
      id: crypto.randomUUID(),
      label: label.trim(),
      amountCents: cents,
      direction,
      rule,
      // Sensible default per direction: salary arrives before the weekend,
      // a bill clears after it. The user can't override this yet — noted as a
      // deliberate omission in the README.
      weekendPolicy: direction === 'in' ? 'previousBusinessDay' : 'nextBusinessDay',
    })

    setLabel('')
    setAmount('')
    setError(null)
  }

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
      <h2 className="text-sm font-semibold">Add an item</h2>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Name</label>
          <input
            className={inputClass}
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="Rent"
          />
        </div>

        <div>
          <label className={labelClass}>Amount (RM)</label>
          <input
            className={inputClass}
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="1200.00"
          />
        </div>

        <div>
          <label className={labelClass}>Direction</label>
          <select
            className={inputClass}
            value={direction}
            onChange={e => setDirection(e.target.value as Direction)}
          >
            <option value="out">Money out</option>
            <option value="in">Money in</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Repeats</label>
          <select
            className={inputClass}
            value={kind}
            onChange={e => setKind(e.target.value as RuleKind)}
          >
            <option value="monthlyOnDay">Monthly on a day</option>
            <option value="semiMonthly">Twice a month</option>
            <option value="everyNDays">Every N days</option>
            <option value="annualOn">Once a year</option>
            <option value="once">One-off</option>
          </select>
        </div>

        {kind === 'monthlyOnDay' && (
          <div>
            <label className={labelClass}>Day of month</label>
            <input className={inputClass} value={day} onChange={e => setDay(e.target.value)} />
          </div>
        )}

        {kind === 'semiMonthly' && (
          <>
            <div>
              <label className={labelClass}>First day</label>
              <input className={inputClass} value={day} onChange={e => setDay(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Second day</label>
              <input className={inputClass} value={day2} onChange={e => setDay2(e.target.value)} />
            </div>
          </>
        )}

        {kind === 'everyNDays' && (
          <>
            <div>
              <label className={labelClass}>Every (days)</label>
              <input className={inputClass} value={n} onChange={e => setN(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Starting from</label>
              <input
                type="date"
                className={inputClass}
                value={anchor}
                onChange={e => setAnchor(e.target.value)}
              />
            </div>
          </>
        )}

        {kind === 'annualOn' && (
          <>
            <div>
              <label className={labelClass}>Month (1–12)</label>
              <input className={inputClass} value={month} onChange={e => setMonth(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Day</label>
              <input className={inputClass} value={day} onChange={e => setDay(e.target.value)} />
            </div>
          </>
        )}

        {kind === 'once' && (
          <div>
            <label className={labelClass}>Date</label>
            <input
              type="date"
              className={inputClass}
              value={onceDate}
              onChange={e => setOnceDate(e.target.value)}
            />
          </div>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      <button
        onClick={handleAdd}
        className="mt-4 rounded bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-900 hover:bg-white"
      >
        Add item
      </button>
    </div>
  )
}
