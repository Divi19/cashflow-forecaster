import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCents, formatDate } from '../lib/money'
import type { Forecast } from '../lib/types'

interface Point {
  date: string
  balance: number      // ringgit, not sen — Recharts wants a plain number
  labels: string
}

/**
 * Recharts works in floats, so the chart converts sen to ringgit at the boundary.
 * All arithmetic upstream stays in integer sen; this is purely a display concern.
 */
function toPoints(forecast: Forecast): Point[] {
  return forecast.days.map(day => ({
    date: day.date,
    balance: day.closingCents / 100,
    labels: day.occurrences.map(o => o.label).join(', '),
  }))
}

function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const p: Point = payload[0].payload
  return (
    <div className="rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs">
      <div className="font-medium text-neutral-200">{formatDate(p.date)}</div>
      <div className="mt-0.5 text-neutral-300">{formatCents(Math.round(p.balance * 100))}</div>
      {p.labels && <div className="mt-1 text-neutral-500">{p.labels}</div>}
    </div>
  )
}

export function BalanceChart({ forecast }: { forecast: Forecast }) {
  const points = toPoints(forecast)
  const troughRinggit = forecast.troughCents / 100

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
      <div className="mb-3 text-xs uppercase tracking-wide text-neutral-500">
        Projected balance
      </div>
      <div style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
            <CartesianGrid stroke="#262626" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: '#737373', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#404040' }}
              // 91 points is far too many labels. Show roughly one a fortnight.
              interval={13}
              tickFormatter={d => formatDate(d).slice(4)}
            />
            <YAxis
              tick={{ fill: '#737373', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={60}
              tickFormatter={v => `${v >= 0 ? '' : '-'}${Math.abs(v).toLocaleString('en-MY')}`}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#525252' }} />

            {/* Zero line only when it's relevant — otherwise it's noise. */}
            {forecast.goesNegative && (
              <ReferenceLine y={0} stroke="#7f1d1d" strokeDasharray="3 3" />
            )}

            <Line
              type="stepAfter"
              dataKey="balance"
              stroke="#34d399"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />

            <ReferenceDot
              x={forecast.troughDate}
              y={troughRinggit}
              r={5}
              fill="#ef4444"
              stroke="#0a0a0a"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-3 text-xs text-neutral-500">
        Stepped, not smoothed: the balance holds flat between transactions and jumps
        on the day money moves. A smooth curve would imply values the account never
        actually held.
      </p>
    </div>
  )
}
