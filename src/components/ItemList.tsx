import { formatCents } from '../lib/money'
import type { CashItem, RecurrenceRule } from '../lib/types'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function ordinal(n: number): string {
  if (n % 100 >= 11 && n % 100 <= 13) return `${n}th`
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`
}

/** Plain-English version of a rule, so the list is readable without decoding. */
function describeRule(rule: RecurrenceRule): string {
  switch (rule.kind) {
    case 'once':
      return `once on ${rule.date}`
    case 'everyNDays':
      return rule.n === 7 ? 'weekly' : rule.n === 14 ? 'fortnightly' : `every ${rule.n} days`
    case 'monthlyOnDay':
      return `monthly on the ${ordinal(rule.day)}`
    case 'semiMonthly':
      return `on the ${ordinal(rule.days[0])} and ${ordinal(rule.days[1])}`
    case 'annualOn':
      return `yearly on ${rule.day} ${MONTHS[rule.month - 1]}`
  }
}

export function ItemList({
  items,
  onDelete,
}: {
  items: CashItem[]
  onDelete: (id: string) => void
}) {
  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 text-sm text-neutral-400">
        No items yet. Add one above and the forecast will update.
      </p>
    )
  }

  return (
    <div className="divide-y divide-neutral-800 rounded-lg border border-neutral-800 bg-neutral-900">
      {items.map(item => (
        <div key={item.id} className="flex items-center justify-between px-4 py-2.5">
          <div className="min-w-0">
            <div className="truncate text-sm">{item.label}</div>
            <div className="text-xs text-neutral-500">{describeRule(item.rule)}</div>
          </div>
          <div className="flex items-center gap-3 pl-3">
            <span
              className={`text-sm whitespace-nowrap ${
                item.direction === 'in' ? 'text-emerald-400' : 'text-neutral-300'
              }`}
            >
              {item.direction === 'in' ? '+' : '−'}
              {formatCents(item.amountCents)}
            </span>
            <button
              onClick={() => onDelete(item.id)}
              className="text-xs text-neutral-500 hover:text-red-400"
              aria-label={`Delete ${item.label}`}
            >
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
