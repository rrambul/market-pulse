// Side-effect import MUST precede @market-pulse/state so the element registers.
import '../apps/watchlist/src/watchlist-panel';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  setAssets,
  watchlistSymbols,
  addToWatchlist,
  removeFromWatchlist,
  isInWatchlist,
  selectedSymbol,
  setSelectedSymbol,
} from '@market-pulse/state';
import type { MpWatchlistPanel } from '../apps/watchlist/src/watchlist-panel';
import type { Asset, AssetType } from '@market-pulse/contracts';

function mkAsset(symbol: string, price: number, changePercent: number, type: AssetType = 'stock'): Asset {
  return {
    id: symbol.toLowerCase(), symbol, name: `${symbol} Inc`, type, price, previousPrice: price,
    open: price, high: price, low: price, change: changePercent, changePercent, volume: 1000, volatility: 'low', lastUpdated: 0,
  };
}

async function settle(el: MpWatchlistPanel) {
  await new Promise((r) => setTimeout(r, 0));
  await el.updateComplete;
}
async function mount(): Promise<MpWatchlistPanel> {
  const el = document.createElement('mp-watchlist-panel') as MpWatchlistPanel;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}
const rows = (el: MpWatchlistPanel) => el.shadowRoot!.querySelectorAll('tbody tr');

describe('mp-watchlist-panel', () => {
  beforeEach(() => {
    // reset to a known watchlist of two seeded symbols
    for (const s of [...watchlistSymbols.get()]) removeFromWatchlist(s);
    setSelectedSymbol(null);
    setAssets([mkAsset('AAA', 100, 2, 'stock'), mkAsset('BBB', 5, -1, 'crypto')]);
    addToWatchlist('AAA');
    addToWatchlist('BBB');
  });

  it('renders watchlist rows', async () => {
    const el = await mount();
    expect(rows(el)).toHaveLength(2);
  });

  it('filters by asset type', async () => {
    const el = await mount();
    const cryptoBtn = [...el.shadowRoot!.querySelectorAll('.filter-btn')].find(
      (b) => b.textContent!.trim() === 'crypto',
    ) as HTMLElement;
    cryptoBtn.click();
    await el.updateComplete;
    expect(rows(el)).toHaveLength(1);
  });

  it('sorts when a column header is clicked', async () => {
    const el = await mount();
    const priceHeader = [...el.shadowRoot!.querySelectorAll('th')].find((h) =>
      h.textContent!.includes('Price'),
    ) as HTMLElement;
    priceHeader.click();
    await el.updateComplete;
    const firstSymbol = el.shadowRoot!.querySelector('.symbol-cell')!.textContent;
    expect(firstSymbol).toBe('BBB'); // ascending by price → 5 before 100
  });

  it('toggles sort direction when the active column is clicked again', async () => {
    const el = await mount();
    const symbolHeader = [...el.shadowRoot!.querySelectorAll('th')].find((h) =>
      h.textContent!.includes('Symbol'),
    ) as HTMLElement;
    symbolHeader.click(); // default sort is 'symbol' asc → clicking toggles to desc
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.symbol-cell')!.textContent).toBe('BBB'); // desc
  });

  it('adds a symbol via the input button', async () => {
    const el = await mount();
    const input = el.shadowRoot!.querySelector('input') as HTMLInputElement;
    input.value = 'ccc';
    input.dispatchEvent(new Event('input'));
    (el.shadowRoot!.querySelector('.btn') as HTMLElement).click();
    await settle(el);
    expect(isInWatchlist('CCC')).toBe(true);
  });

  it('adds a symbol via the Enter key', async () => {
    const el = await mount();
    const input = el.shadowRoot!.querySelector('input') as HTMLInputElement;
    input.value = 'ddd';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    await settle(el);
    expect(isInWatchlist('DDD')).toBe(true);
  });

  it('removes a symbol via the × button', async () => {
    const el = await mount();
    (el.shadowRoot!.querySelector('.btn-remove') as HTMLElement).click();
    await settle(el);
    expect(rows(el)).toHaveLength(1);
  });

  it('selects a symbol when a row is clicked', async () => {
    const el = await mount();
    (rows(el)[0] as HTMLElement).click();
    expect(selectedSymbol.get()).not.toBeNull();
  });

  it('shows the empty state when the watchlist is empty', async () => {
    removeFromWatchlist('AAA');
    removeFromWatchlist('BBB');
    const el = await mount();
    expect(el.shadowRoot!.textContent).toContain('No assets in watchlist');
  });
});
