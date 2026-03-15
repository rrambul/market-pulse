import { Signal } from 'signal-polyfill';
import type { Asset } from '@market-pulse/contracts';
import { assetStore } from './asset-store.js';

/** Set of watched symbol strings */
export const watchlistSymbols = new Signal.State<Set<string>>(
  new Set(['AAPL', 'BTC', 'ETH', 'GOLD', 'EUR/USD'])
);

export function addToWatchlist(symbol: string): void {
  const current = watchlistSymbols.get();
  const next = new Set(current);
  next.add(symbol);
  watchlistSymbols.set(next);
}

export function removeFromWatchlist(symbol: string): void {
  const current = watchlistSymbols.get();
  const next = new Set(current);
  next.delete(symbol);
  watchlistSymbols.set(next);
}

export function isInWatchlist(symbol: string): boolean {
  return watchlistSymbols.get().has(symbol);
}

/** Derived: watchlist assets (reads all watched symbol signals) */
export const watchlistAssets = new Signal.Computed<Asset[]>(() => {
  const symbols = watchlistSymbols.get();
  const map = assetStore.get();
  const result: Asset[] = [];
  for (const sym of symbols) {
    const sig = map.get(sym);
    if (sig) result.push(sig.get());
  }
  return result;
});
