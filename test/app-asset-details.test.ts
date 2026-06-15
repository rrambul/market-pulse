// Side-effect import MUST precede @market-pulse/state so the element registers.
import '../apps/asset-details/src/asset-details';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  setAssets,
  addAlert,
  clearAlerts,
  isInWatchlist,
  removeFromWatchlist,
} from '@market-pulse/state';
import type { MpAssetDetails } from '../apps/asset-details/src/asset-details';
import type { Asset } from '@market-pulse/contracts';

const asset: Asset = {
  id: 'aaa', symbol: 'AAA', name: 'Triple A', type: 'stock', price: 123.45, previousPrice: 120,
  open: 119, high: 130, low: 118, change: 3.45, changePercent: 2.9, volume: 5000, volatility: 'medium', lastUpdated: 0,
};

async function settle(el: MpAssetDetails) {
  await new Promise((r) => setTimeout(r, 0));
  await el.updateComplete;
}
async function mount(symbol: string): Promise<MpAssetDetails> {
  const el = document.createElement('mp-asset-details') as MpAssetDetails;
  el.symbol = symbol;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

describe('mp-asset-details', () => {
  beforeEach(() => {
    clearAlerts();
    setAssets([asset]);
    removeFromWatchlist('AAA');
  });

  it('prompts to select an asset when no symbol is set', async () => {
    const el = await mount('');
    expect(el.shadowRoot!.textContent).toContain('Select an asset');
  });

  it('shows a not-found message for an unknown symbol', async () => {
    const el = await mount('GHOST');
    expect(el.shadowRoot!.textContent).toContain('Asset not found');
  });

  it('renders the hero and price metrics for a known asset', async () => {
    const el = await mount('AAA');
    const root = el.shadowRoot!;
    expect(root.querySelector('.hero-symbol')!.textContent).toBe('AAA');
    expect(root.querySelector('.hero-price')!.textContent).toContain('123.45');
    expect(root.querySelectorAll('.metric-value').length).toBeGreaterThanOrEqual(6);
  });

  it('toggles watchlist membership from the hero button', async () => {
    const el = await mount('AAA');
    expect(isInWatchlist('AAA')).toBe(false);
    (el.shadowRoot!.querySelector('.watchlist-btn') as HTMLElement).click();
    await settle(el);
    expect(isInWatchlist('AAA')).toBe(true);
  });

  it('lists alerts for the asset', async () => {
    const el = await mount('AAA');
    addAlert({ type: 'ALERT_TRIGGERED', id: 'x1', symbol: 'AAA', severity: 'high', message: 'spike', timestamp: 0 });
    await settle(el);
    expect(el.shadowRoot!.textContent).toContain('spike');
  });
});
