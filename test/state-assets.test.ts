import { describe, it, expect } from 'vitest';
import type { Asset, AssetType, Volatility } from '@market-pulse/contracts';
import {
  setAssets,
  getAssetSignal,
  updateAsset,
  topGainers,
  topLosers,
  marketBreadth,
  assetsByType,
  totalAlertCount,
  addAlert,
  watchlistSymbols,
  watchlistAssets,
  addToWatchlist,
  removeFromWatchlist,
  isInWatchlist,
} from '@market-pulse/state';

function mkAsset(
  symbol: string,
  changePercent: number,
  type: AssetType = 'stock',
  volatility: Volatility = 'low',
): Asset {
  return {
    id: symbol.toLowerCase(),
    symbol,
    name: `${symbol} Inc`,
    type,
    price: 100,
    previousPrice: 100,
    open: 100,
    high: 100,
    low: 100,
    change: changePercent,
    changePercent,
    volume: 1000,
    volatility,
    lastUpdated: 0,
  };
}

describe('asset-store + derived (shared assetStore)', () => {
  it('marketBreadth handles the empty market without dividing by zero', () => {
    const breadth = marketBreadth.get();
    expect(breadth).toEqual({ advancers: 0, decliners: 0, unchanged: 0, breadthRatio: 0 });
    expect(topGainers.get()).toEqual([]);
  });

  it('setAssets creates per-symbol signals and aggregates recompute', () => {
    setAssets([
      mkAsset('AAA', 2, 'stock'),
      mkAsset('BBB', -3, 'crypto'),
      mkAsset('CCC', 0, 'forex'), // unchanged (|change| < 0.01)
      mkAsset('DDD', 5, 'commodity'),
    ]);

    expect(getAssetSignal('AAA')!.get().symbol).toBe('AAA');
    expect(getAssetSignal('MISSING')).toBeUndefined();

    expect(topGainers.get().map((a) => a.symbol)).toEqual(['DDD', 'AAA']);
    expect(topLosers.get().map((a) => a.symbol)).toEqual(['BBB']);

    const breadth = marketBreadth.get();
    expect(breadth.advancers).toBe(2);
    expect(breadth.decliners).toBe(1);
    expect(breadth.unchanged).toBe(1);
    expect(breadth.breadthRatio).toBeCloseTo(0.5);

    const byType = assetsByType.get();
    expect(byType.stock.map((a) => a.symbol)).toEqual(['AAA']);
    expect(byType.crypto).toHaveLength(1);
    expect(byType.forex).toHaveLength(1);
    expect(byType.commodity).toHaveLength(1);
  });

  it('top gainers/losers are capped at 10', () => {
    setAssets(Array.from({ length: 12 }, (_, i) => mkAsset(`UP${i}`, i + 1)));
    setAssets(Array.from({ length: 12 }, (_, i) => mkAsset(`DN${i}`, -(i + 1))));
    expect(topGainers.get()).toHaveLength(10);
    expect(topLosers.get()).toHaveLength(10);
    expect(topGainers.get()[0].changePercent).toBeGreaterThan(topGainers.get()[9].changePercent);
  });

  it('updateAsset merges into an existing signal and no-ops for unknown symbols', () => {
    setAssets([mkAsset('ZZZ', 1)]);
    updateAsset('ZZZ', { price: 250, volume: 99 });
    const z = getAssetSignal('ZZZ')!.get();
    expect(z.price).toBe(250);
    expect(z.volume).toBe(99);
    expect(z.symbol).toBe('ZZZ'); // untouched fields preserved

    expect(() => updateAsset('NOPE', { price: 1 })).not.toThrow();
    expect(getAssetSignal('NOPE')).toBeUndefined();
  });

  it('setAssets updates existing assets in place on a re-snapshot', () => {
    setAssets([mkAsset('RES', 1)]);
    setAssets([{ ...mkAsset('RES', 1), price: 777 }]);
    expect(getAssetSignal('RES')!.get().price).toBe(777);
  });

  it('totalAlertCount reflects the alerts buffer', () => {
    const before = totalAlertCount.get();
    addAlert({ type: 'ALERT_TRIGGERED', id: 'al1', symbol: 'AAA', severity: 'low', message: 'm', timestamp: 0 });
    expect(totalAlertCount.get()).toBe(before + 1);
  });
});

describe('watchlist-store', () => {
  it('ships with default symbols and reports membership', () => {
    expect(watchlistSymbols.get().has('AAPL')).toBe(true);
    expect(isInWatchlist('AAPL')).toBe(true);
    expect(isInWatchlist('NOTHERE')).toBe(false);
  });

  it('add/remove mutate the set immutably', () => {
    setAssets([mkAsset('WL', 3)]);
    addToWatchlist('WL');
    expect(isInWatchlist('WL')).toBe(true);
    expect(watchlistAssets.get().some((a) => a.symbol === 'WL')).toBe(true);

    removeFromWatchlist('WL');
    expect(isInWatchlist('WL')).toBe(false);
  });

  it('watchlistAssets only resolves symbols that exist in the store', () => {
    addToWatchlist('GHOST'); // never added to asset store
    expect(watchlistAssets.get().some((a) => a.symbol === 'GHOST')).toBe(false);
  });
});
