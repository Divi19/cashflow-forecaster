import { useMemo } from 'react'
import { addDays, todayISO } from './lib/dates'
import { buildForecast } from './lib/forecast'
import { formatCents, formatDate } from './lib/money'
import { SEED_ITEMS, SEED_OPENING_CENTS } from './lib/seed'

/** Fixed 90-day horizon. Far enough to catch an annual renewal, short enough to read. */
const HORIZON_DAYS = 90

export default function App() {
  const start = todayISO()
  const end = addDays(start, HORIZON_DAYS)

  const forecast = useMemo(
    () => buildForecast(SEED_ITEMS, SEED_OPENING_CENTS, start, end),
    [start, end]
  )

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-semibold">Cash-Flow Forecaster</h1>
        <p className="mt-1 text-sm text-neutral-400">
          {formatDate(start)} to {formatDate(end)} · opening balance{' '}
          {formatCents(SEED_OPENING_CENTS)}
        </p>

        <div
          className={`mt-6 rounded-lg border p-4 ${
            forecast.goesNegative
              ? 'border-red-900 bg-red-950/40'
              : 'border-neutral-800 bg-neutral-900'
          }`}
        >
          <div className="text-xs uppercase tracking-wide text-neutral-400">
            Lowest point
          </div>
          <div className="mt-1 text-xl font-semibold">
            {formatCents(forecast.troughCents)} on {formatDate(forecast.troughDate)}
          </div>
          <div className="mt-1 text-sm text-neutral-400">
            {forecast.goesNegative
              ? 'Your balance goes negative before then.'
              : 'You stay in the black across the whole window.'}
          </div>
        </div>

        <table className="mt-8 w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-neutral-500">
            <tr className="border-b border-neutral-800">
              <th className="py-2 font-medium">Date</th>
              <th className="py-2 font-medium">Activity</th>
              <th className="py-2 text-right font-medium">Change</th>
              <th className="py-2 text-right font-medium">Balance</th>
            </tr>
          </thead>
          <tbody>
            {forecast.days.map(day => {
              const isTrough = day.date === forecast.troughDate
              const net = day.closingCents - day.openingCents
              return (
                <tr
                  key={day.date}
                  className={`border-b border-neutral-900 ${
                    isTrough ? 'bg-red-950/50' : ''
                  } ${day.occurrences.length === 0 ? 'text-neutral-600' : ''}`}
                >
                  <td className="py-1.5 whitespace-nowrap">{formatDate(day.date)}</td>
                  <td className="py-1.5">
                    {day.occurrences.map(o => o.label).join(', ') || '—'}
                  </td>
                  <td className="py-1.5 text-right whitespace-nowrap">
                    {net === 0 ? '' : formatCents(net)}
                  </td>
                  <td
                    className={`py-1.5 text-right whitespace-nowrap ${
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
