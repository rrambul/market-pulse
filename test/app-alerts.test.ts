// Side-effect import MUST precede @market-pulse/state so the element registers.
import '../apps/alerts/src/alerts-panel';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  addAlerts,
  clearAlerts,
  unreadAlertCount,
  selectedSymbol,
  setSelectedSymbol,
  setMarketControl,
} from '@market-pulse/state';
import type { MpAlertsPanel } from '../apps/alerts/src/alerts-panel';
import type { AlertTriggeredEvent } from '@market-pulse/contracts';

type Sev = AlertTriggeredEvent['severity'];
const mkAlert = (id: string, severity: Sev = 'low', symbol = 'AAA'): AlertTriggeredEvent => ({
  type: 'ALERT_TRIGGERED', id, symbol, severity, message: `msg ${id}`, timestamp: 0,
});

async function settle(el: MpAlertsPanel) {
  await new Promise((r) => setTimeout(r, 0));
  await el.updateComplete;
}
async function mount(): Promise<MpAlertsPanel> {
  const el = document.createElement('mp-alerts-panel') as MpAlertsPanel;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}
const items = (el: MpAlertsPanel) => el.shadowRoot!.querySelectorAll('.alert-item');
const byText = (el: MpAlertsPanel, sel: string, text: string) =>
  [...el.shadowRoot!.querySelectorAll(sel)].find((n) => n.textContent!.includes(text))!;

describe('mp-alerts-panel', () => {
  beforeEach(() => {
    clearAlerts();
    setSelectedSymbol(null);
    setMarketControl(null);
  });

  it('shows an empty state with no alerts', async () => {
    const el = await mount();
    expect(el.shadowRoot!.textContent).toContain('No alerts');
  });

  it('renders alerts and tracks the unread badge for alerts added while mounted', async () => {
    const el = await mount();
    addAlerts([mkAlert('a1'), mkAlert('a2', 'high')]);
    await settle(el);
    expect(items(el)).toHaveLength(2);
    expect(unreadAlertCount.get()).toBe(2);
    expect(el.shadowRoot!.querySelector('.unread-badge')).toBeTruthy();
  });

  it('filters by every severity and back to all', async () => {
    addAlerts([mkAlert('a1', 'low'), mkAlert('a2', 'medium'), mkAlert('a3', 'high')]);
    const el = await mount();
    for (const [label, count] of [['High', 1], ['Medium', 1], ['Low', 1], ['All', 3]] as const) {
      (byText(el, '.filter-btn', label) as HTMLElement).click();
      await el.updateComplete;
      expect(items(el)).toHaveLength(count);
    }
  });

  it('selects a symbol when an alert is clicked', async () => {
    addAlerts([mkAlert('a1', 'low', 'TSLA')]);
    const el = await mount();
    (items(el)[0] as HTMLElement).click();
    expect(selectedSymbol.get()).toBe('TSLA');
  });

  it('triggers a scenario through the market control seam', async () => {
    const triggerScenario = vi.fn().mockResolvedValue(undefined);
    setMarketControl({ triggerScenario, setStressTest: vi.fn() });
    const el = await mount();
    (el.shadowRoot!.querySelector('.scenario-card') as HTMLElement).click();
    expect(triggerScenario).toHaveBeenCalledOnce();
  });

  it('clears all alerts', async () => {
    addAlerts([mkAlert('a1')]);
    const el = await mount();
    (byText(el, 'button', 'Clear All') as HTMLElement).click();
    await settle(el);
    expect(el.shadowRoot!.textContent).toContain('No alerts');
  });
});
