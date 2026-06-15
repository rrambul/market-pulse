// Side-effect import MUST precede @market-pulse/state so the element registers.
import '../apps/market-overview/src/market-overview';
import { describe, it, expect, beforeEach } from 'vitest';
import { setAssets, selectedSymbol, setSelectedSymbol } from '@market-pulse/state';
import type { MpMarketOverview } from '../apps/market-overview/src/market-overview';
import type { Asset, AssetType, Volatility } from '@market-pulse/contracts';

function mkAsset(
  symbol: string,
  changePercent: number,
  type: AssetType = 'stock',
  volatility: Volatility = 'low',
): Asset {
  return {
    id: symbol.toLowerCase(), symbol, name: `${symbol} Inc`, type, price: 100, previousPrice: 100,
    open: 100, high: 100, low: 100, change: changePercent, changePercent, volume: 1000, volatility, lastUpdated: 0,
  };
}

async function mount(): Promise<MpMarketOverview> {
  const el = document.createElement('mp-market-overview') as MpMarketOverview;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

describe('mp-market-overview', () => {
  beforeEach(() => setSelectedSymbol(null));

  // Runs first, while the (file-isolated) asset store is still empty, to cover
  // the divide-by-zero guards and the "low breadth" KPI class branches.
  it('handles an empty market without dividing by zero', async () => {
    const el = await mount();
    const kpis = [...el.shadowRoot!.querySelectorAll('.kpi-value')].map((n) => n.textContent!.trim());
    expect(kpis[0]).toBe('0'); // total assets
    expect(el.shadowRoot!.textContent).toContain('0.0%'); // breadth ratio
  });

  it('renders KPIs, gainer/loser tables and breakdowns', async () => {
    setAssets([
      mkAsset('UP1', 3, 'stock', 'high'),
      mkAsset('UP2', 1.5, 'crypto', 'medium'),
      mkAsset('DN1', -2, 'forex', 'low'),
      mkAsset('FLAT', 0, 'commodity', 'low'),
    ]);
    const el = await mount();
    const root = el.shadowRoot!;

    // KPI cards (Total, Advancers, Decliners, Breadth, Alerts)
    const kpis = [...root.querySelectorAll('.kpi-value')].map((n) => n.textContent!.trim());
    expect(kpis[0]).toBe('4'); // total assets
    expect(kpis[1]).toBe('2'); // advancers

    // Gainers table has the two advancers
    const gainerRows = root.querySelectorAll('.section .asset-table tbody tr');
    expect(gainerRows.length).toBeGreaterThanOrEqual(2);

    // Type + volatility breakdowns render counts
    expect(root.querySelectorAll('.type-count').length).toBeGreaterThan(0);
  });

  it('selects a symbol when a gainer row is clicked', async () => {
    setAssets([mkAsset('NVDA', 4, 'stock')]);
    const el = await mount();
    const row = el.shadowRoot!.querySelector('.asset-table tbody tr') as HTMLElement;
    row.click();
    expect(selectedSymbol.get()).toBe('NVDA');
  });
});
