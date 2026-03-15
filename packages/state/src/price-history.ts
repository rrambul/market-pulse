import { Signal } from 'signal-polyfill';

/**
 * Rolling price history per symbol for chart rendering.
 * Stores the last N price points per symbol with timestamps.
 * Updated on every price change via `recordPrice()`.
 */

export interface PricePoint {
  price: number;
  timestamp: number;
}

const MAX_HISTORY = 200;

const _historyMap = new Map<string, Signal.State<PricePoint[]>>();

/** Get (or create) the history signal for a symbol. */
export function getPriceHistory(symbol: string): Signal.State<PricePoint[]> {
  let sig = _historyMap.get(symbol);
  if (!sig) {
    sig = new Signal.State<PricePoint[]>([]);
    _historyMap.set(symbol, sig);
  }
  return sig;
}

/** Record a new price data point for a symbol. */
export function recordPrice(symbol: string, price: number, timestamp?: number): void {
  const sig = getPriceHistory(symbol);
  const current = sig.get();
  const point: PricePoint = { price, timestamp: timestamp ?? Date.now() };

  if (current.length >= MAX_HISTORY) {
    // Shift out oldest, push new — reuse array reference pattern for perf
    const next = current.slice(current.length - MAX_HISTORY + 1);
    next.push(point);
    sig.set(next);
  } else {
    sig.set([...current, point]);
  }
}

/** Seed history from an API response array. */
export function seedPriceHistory(symbol: string, points: PricePoint[]): void {
  const sig = getPriceHistory(symbol);
  const trimmed = points.length > MAX_HISTORY ? points.slice(points.length - MAX_HISTORY) : points;
  sig.set(trimmed);
}
