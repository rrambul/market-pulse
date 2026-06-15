// Side-effect import MUST precede @market-pulse/state so the element registers.
import '../apps/shell/src/app-shell';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  stressTestConfig,
  setStressTestConfig,
  setMarketControl,
  setSelectedSymbol,
  addAlert,
  clearAlerts,
  markAlertsRead,
  updatePerformanceMetrics,
} from '@market-pulse/state';
import type { MpAppShell } from '../apps/shell/src/app-shell';

async function settle(el: MpAppShell) {
  await new Promise((r) => setTimeout(r, 0));
  await el.updateComplete;
}
async function mount(): Promise<MpAppShell> {
  const el = document.createElement('mp-app-shell') as MpAppShell;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}
const navButton = (el: MpAppShell, label: string) =>
  [...el.shadowRoot!.querySelectorAll('nav button')].find((b) => b.textContent!.includes(label))! as HTMLElement;
const main = (el: MpAppShell) => el.shadowRoot!.querySelector('main')!;

describe('mp-app-shell', () => {
  beforeEach(() => {
    setSelectedSymbol(null);
    setStressTestConfig({ enabled: false, updateFrequencyMs: 100, batchSize: 10 });
    setMarketControl(null);
    clearAlerts();
    markAlertsRead();
  });

  it('renders the overview view by default', async () => {
    const el = await mount();
    expect(main(el).querySelector('mp-market-overview')).toBeTruthy();
  });

  it('switches the mounted view when tabs are clicked', async () => {
    const el = await mount();
    navButton(el, 'Watchlist').click();
    await el.updateComplete;
    expect(main(el).querySelector('mp-watchlist-panel')).toBeTruthy();

    navButton(el, 'Trade Stream').click();
    await el.updateComplete;
    expect(main(el).querySelector('mp-trade-stream')).toBeTruthy();

    navButton(el, 'Alerts').click();
    await el.updateComplete;
    expect(main(el).querySelector('mp-alerts-panel')).toBeTruthy();
  });

  it('shows a fallback on the details tab until a symbol is selected', async () => {
    const el = await mount();
    navButton(el, 'Details').click();
    await el.updateComplete;
    expect(main(el).textContent).toContain('Select an asset');

    setSelectedSymbol('AAPL');
    await settle(el);
    expect(main(el).querySelector('mp-asset-details')).toBeTruthy();
  });

  it('drives the stress toggle through the control seam and updates state', async () => {
    const setStressTest = vi.fn().mockResolvedValue(undefined);
    setMarketControl({ triggerScenario: vi.fn(), setStressTest });
    const el = await mount();

    const checkbox = el.shadowRoot!.querySelector('#stress') as HTMLInputElement;
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change'));
    await settle(el);

    expect(stressTestConfig.get().enabled).toBe(true);
    expect(stressTestConfig.get().updateFrequencyMs).toBe(10); // STRESS_PROFILE
    expect(setStressTest).toHaveBeenCalledWith(expect.objectContaining({ enabled: true }));

    // toggling back off applies the NORMAL profile branch
    checkbox.checked = false;
    checkbox.dispatchEvent(new Event('change'));
    await settle(el);
    expect(stressTestConfig.get().enabled).toBe(false);
    expect(stressTestConfig.get().updateFrequencyMs).toBe(100); // NORMAL_PROFILE
  });

  it('flags degraded performance in the footer', async () => {
    updatePerformanceMetrics({ fps: 20, domNodeCount: 6000 });
    const el = await mount();
    expect(el.shadowRoot!.querySelector('.perf-value.critical')).toBeTruthy(); // fps < 30
    expect(el.shadowRoot!.querySelector('.perf-value.warn')).toBeTruthy(); // domNodes > 5000
  });

  it('shows an unread badge on the Alerts tab', async () => {
    const el = await mount();
    addAlert({ type: 'ALERT_TRIGGERED', id: 'b1', symbol: 'AAA', severity: 'high', message: 'm', timestamp: 0 });
    await settle(el);
    expect(navButton(el, 'Alerts').querySelector('.badge')).toBeTruthy();
  });
});
