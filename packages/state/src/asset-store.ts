import { Signal } from 'signal-polyfill';
import type { Asset } from '@market-pulse/contracts';

/**
 * TIER 1: Per-symbol signal map.
 * 
 * Each asset gets its own Signal<Asset>, stored in a Map keyed by symbol.
 * When a price update arrives for "AAPL", only the Signal for "AAPL" is
 * written to, so only components observing AAPL re-render.
 * 
 * This is the critical architectural choice for high-frequency updates:
 * a single Signal<Map> would invalidate every consumer on any update.
 */
const _assetMap = new Map<string, Signal.State<Asset>>();

/** Reactive signal tracking the set of known symbols (triggers when assets are added/removed) */
export const assetStore = new Signal.State<ReadonlyMap<string, Signal.State<Asset>>>(
  _assetMap
);

/**
 * Get or create the signal for a specific symbol.
 * Components should call this to subscribe to a single asset's updates.
 */
export function getAssetSignal(symbol: string): Signal.State<Asset> | undefined {
  return _assetMap.get(symbol);
}

/**
 * Update a single asset. This writes only to the per-symbol signal,
 * keeping the blast radius minimal.
 */
export function updateAsset(symbol: string, update: Partial<Asset>): void {
  const existing = _assetMap.get(symbol);
  if (existing) {
    const current = existing.get();
    existing.set({ ...current, ...update });
  }
}

/**
 * Bulk-set assets from a snapshot.
 * Creates per-symbol signals for any new symbols.
 */
export function setAssets(assets: Asset[]): void {
  let added = false;
  for (const asset of assets) {
    const existing = _assetMap.get(asset.symbol);
    if (existing) {
      existing.set(asset);
    } else {
      _assetMap.set(asset.symbol, new Signal.State(asset));
      added = true;
    }
  }
  if (added) {
    // Trigger the store signal so consumers of the symbol list re-render
    assetStore.set(_assetMap);
  }
}

/**
 * Get all current asset values as an array.
 * Reads every per-symbol signal, so the caller subscribes to all of them.
 * Use sparingly — prefer getAssetSignal for single-asset views.
 */
export function getAllAssets(): Asset[] {
  const result: Asset[] = [];
  for (const sig of _assetMap.values()) {
    result.push(sig.get());
  }
  return result;
}
