import { Signal } from 'signal-polyfill';
import type { Asset, AssetType } from '@market-pulse/contracts';
import { assetStore } from './asset-store.js';
import { alerts } from './events-store.js';

/**
 * TIER 2: Computed/derived signals.
 * 
 * These lazily derive from Tier 1 per-symbol signals.
 * They only recompute when their dependencies change.
 * 
 * Note: Signal.Computed reads all per-symbol signals when computed,
 * so they subscribe to all assets. This is acceptable for aggregate
 * views like "top gainers" that inherently need all data.
 */

function readAllAssets(): Asset[] {
  const map = assetStore.get();
  const result: Asset[] = [];
  for (const sig of map.values()) {
    result.push(sig.get());
  }
  return result;
}

/** Top 10 gainers by percent change */
export const topGainers = new Signal.Computed<Asset[]>(() => {
  const assets = readAllAssets();
  return assets
    .filter(a => a.changePercent > 0)
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, 10);
});

/** Top 10 losers by percent change */
export const topLosers = new Signal.Computed<Asset[]>(() => {
  const assets = readAllAssets();
  return assets
    .filter(a => a.changePercent < 0)
    .sort((a, b) => a.changePercent - b.changePercent)
    .slice(0, 10);
});

/** Market breadth: ratio of advancers to total */
export const marketBreadth = new Signal.Computed<{
  advancers: number;
  decliners: number;
  unchanged: number;
  breadthRatio: number;
}>(() => {
  const assets = readAllAssets();
  let advancers = 0, decliners = 0, unchanged = 0;
  for (const a of assets) {
    if (a.changePercent > 0.01) advancers++;
    else if (a.changePercent < -0.01) decliners++;
    else unchanged++;
  }
  const total = assets.length || 1;
  return { advancers, decliners, unchanged, breadthRatio: advancers / total };
});

/** Assets grouped by type */
export const assetsByType = new Signal.Computed<Record<AssetType, Asset[]>>(() => {
  const assets = readAllAssets();
  const grouped: Record<AssetType, Asset[]> = {
    stock: [],
    crypto: [],
    forex: [],
    commodity: [],
  };
  for (const a of assets) {
    grouped[a.type].push(a);
  }
  return grouped;
});

/** Total unacknowledged alert count */
export const totalAlertCount = new Signal.Computed<number>(() => {
  return alerts.get().length;
});
