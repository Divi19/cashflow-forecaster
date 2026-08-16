import { SEED_ITEMS, SEED_OPENING_CENTS } from './seed'
import type { CashItem, Cents } from './types'

/**
 * Versioned key. If the shape of CashItem ever changes, bumping the version
 * gives a clean break rather than crashing on data written by an older build.
 */
const KEY = 'cashflow-forecaster:v1'

export interface AppState {
  openingCents: Cents
  items: CashItem[]
}

/**
 * localStorage rather than a database or an API.
 *
 * DECISION: this is single-user, single-device, no accounts, no sharing. A
 * backend would add auth, hosting, and a schema for zero benefit to the one
 * person using it. The trade-off is real and worth stating: the data is gone
 * if the browser is cleared, and it does not follow you to another device.
 */
export function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { openingCents: SEED_OPENING_CENTS, items: SEED_ITEMS }
    const parsed = JSON.parse(raw) as AppState
    // Anything malformed falls back to the seed rather than rendering a broken
    // forecast from half-valid data.
    if (typeof parsed.openingCents !== 'number' || !Array.isArray(parsed.items)) {
      return { openingCents: SEED_OPENING_CENTS, items: SEED_ITEMS }
    }
    return parsed
  } catch {
    return { openingCents: SEED_OPENING_CENTS, items: SEED_ITEMS }
  }
}

export function save(state: AppState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // Quota exceeded or storage disabled. The app still works for this session;
    // silently losing persistence beats crashing the render.
  }
}

export function reset(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // Nothing useful to do here.
  }
}
