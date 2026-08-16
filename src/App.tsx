import { useEffect, useMemo, useState } from 'react'
import { BalanceChart } from './components/BalanceChart'
import { ItemForm } from './components/ItemForm'
import { ItemList } from './components/ItemList'
import { addDays, todayISO } from './lib/dates'
import { buildForecast } from './lib/forecast'
import { centsToInput, formatCents, formatDate, parseAmountToCents } from './lib/money'
import { load, reset, save, type AppState } from './lib/storage'
import type { CashItem } from './lib/types'

/** Fixed 90-day horizon. Far enough to catch an annual renewal, short enough to read. */
const HORIZON_DAYS = 90

export default function App() {
  const [state, setState] = useState<AppState>(() => load())
  const [openingInput, setOpeningInput] = useState(() => centsToInput(load().openingCents))
  const [showAllDays, setShowAllDays] = useState(true)

  useEffect(() => {
    save(state)
  }, [state])

  const start = todayISO()
  const end = addDays(start, HORIZON_DAYS)

  const forecast = useMemo(
    () => buildForecast(state.items, state.openingCents, start, end),
    [state.items, state.openingCents, start, end]
  )

  const visibleDays = useMemo(
    () =>
      showAllDays
        ? forecast.days
        : forecast.days.filter(
            d => d.occurrences.length > 0 || d.date === forecast.troughDate
          ),
    [forecast, showAllDays]
  )

  function addItem(item: CashItem) {
    setState(s => ({ ...s, items: [...s.items, item] }))
  }

  function deleteItem(id: string) {
    setState(s => ({ ...s, items: s.items.filter(i => i.id !== id) }))
  }

  function commitOpening(value: string) {
    const cents = parseAmountToCents(value)
    if (cents === null) {
      setOpeningInput(centsToInput(state.openingCents))   // reject, restore
      return
    }
    setState(s => ({ ...s, openingCents: cents }))
  }

  function handleReset() {
    reset()
    const fresh = load()
    setState(fresh)
    setOpeningInput(centsToInput(fresh.openingCents))
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <header className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Cash-Flow Forecaster</h1>
            <p className="mt-1 text-sm text-neutral-400">
              {formatDate(start)} to {formatDate(end)}
            </p>
          </div>
          <button
            onClick={handleReset}
            className="text-xs text-neutral-500 hover:text-neutral-300"
          >
            Reset to sample data
          </button>
        </header>

        <div className="mt-6 flex items-end gap-3">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-neutral-500">
              Balance today (RM)
            </label>
            <input
              className="w-40 rounded border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm focus:border-neutral-500 focus:outline-none"
              value={openingInput}
              onChange={e => setOpeningInput(e.target.value)}
              onBlur={e => commitOpening(e.target.value)}
            />
          </div>
        </div>

        <div
          className={`mt-6 rounded-lg border p-4 ${
            forecast.goesNegative
              ? 'border-red-900 bg-red-950/40'
              : 'border-neutral-800 bg-neutral-900'
          }`}
        >
          <div className="text-xs uppercase tracking-wide text-neutral-400">Lowest point</div>
          <div className="mt-1 text-xl font-semibold">
            {formatCents(forecast.troughCents)} on {formatDate(forecast.troughDate)}
          </div>
          <div className="mt-1 text-sm text-neutral-400">
            {forecast.goesNegative
              ? 'Your balance goes negative before then.'
              : 'You stay in the black across the whole window.'}
          </div>
        </div>

        <div className="mt-6">
          <BalanceChart forecast={forecast} />
        </div>

        <div className="mt-8">
          <ItemForm onAdd={addItem} />
        </div>

        <div className="mt-4">
          <ItemList items={state.items} onDelete={deleteItem} />
        </div>

        <div className="mt-8 flex items-baseline justify-between">
          <p className="text-xs text-neutral-500">
            {showAllDays
              ? `Showing all ${forecast.days.length} days.`
              : `Showing the ${visibleDays.length} days with activity.`}
          </p>
          <button
            onClick={() => setShowAllDays(v => !v)}
            className="text-xs text-neutral-400 hover:text-neutral-200"
          >
            {showAllDays ? 'Show activity only ↑' : 'Show every day ↓'}
          </button>
        </div>

        <table className="mt-2 w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-neutral-500">
            <tr className="border-b border-neutral-800">
              <th className="py-2.5 font-medium">Date</th>
              <th className="py-2.5 font-medium">Activity</th>
              <th className="py-2.5 text-right font-medium">Change</th>
              <th className="py-2.5 text-right font-medium">Balance</th>
            </tr>
          </thead>
          <tbody>
            {visibleDays.map(day => {
              const isTrough = day.date === forecast.troughDate
              const net = day.closingCents - day.openingCents
              return (
                <tr
                  key={day.date}
                  className={`border-b border-neutral-900 ${isTrough ? 'bg-red-950/50' : ''} ${
                    day.occurrences.length === 0 ? 'text-neutral-600' : ''
                  }`}
                >
                  <td className="py-2.5 whitespace-nowrap">{formatDate(day.date)}</td>
                  <td className="py-2.5">
                    {day.occurrences.map(o => o.label).join(', ') || '—'}
                  </td>
                  <td className="py-2.5 text-right whitespace-nowrap">
                    {net === 0 ? '' : formatCents(net)}
                  </td>
                  <td
                    className={`py-2.5 text-right whitespace-nowrap ${
                      day.closingCents < 0 ? 'text-red-400' : ''
                    }`}
                  >
                    {formatCents(day.closingCents)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
