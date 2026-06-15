// Side-effect import MUST precede @market-pulse/state so the element registers.
import '../apps/trade-stream/src/trade-stream';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  addTradeEvents,
  clearTradeEvents,
  selectedSymbol,
  setSelectedSymbol,
} from '@market-pulse/state';
import type { TradeExecutedEvent } from '@market-pulse/contracts';
import type { MpTradeStream } from '../apps/trade-stream/src/trade-stream';

const mkTrade = (id: string): TradeExecutedEvent => ({
  type: 'TRADE_EXECUTED', id, symbol: 'AAA', side: 'buy', quantity: 10, price: 5, timestamp: Number(id) || 1,
});

async function settle(el: MpTradeStream) {
  await new Promise((r) => setTimeout(r, 0));
  await el.updateComplete;
}

async function mount(): Promise<MpTradeStream> {
  const el = document.createElement('mp-trade-stream') as MpTradeStream;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

const rows = (el: MpTradeStream) => el.shadowRoot!.querySelectorAll('.trade-row');
const button = (el: MpTradeStream, text: string) =>
  [...el.shadowRoot!.querySelectorAll('button')].find((b) => b.textContent!.includes(text))!;

describe('mp-trade-stream', () => {
  beforeEach(() => {
    clearTradeEvents();
    setSelectedSymbol(null);
  });

  it('shows the empty state with no trades', async () => {
    const el = await mount();
    expect(el.shadowRoot!.textContent).toContain('Waiting for trades');
  });

  it('renders rows for live trades', async () => {
    addTradeEvents([mkTrade('1'), mkTrade('2'), mkTrade('3')]);
    const el = await mount();
    expect(rows(el)).toHaveLength(3);
  });

  it('selects a symbol when a row is clicked', async () => {
    addTradeEvents([mkTrade('1')]);
    const el = await mount();
    (rows(el)[0] as HTMLElement).click();
    expect(selectedSymbol.get()).toBe('AAA');
  });

  it('pause freezes the displayed list against new trades', async () => {
    addTradeEvents([mkTrade('1'), mkTrade('2')]);
    const el = await mount();
    expect(rows(el)).toHaveLength(2);

    button(el, 'Pause').click();
    await el.updateComplete;
    expect(button(el, 'Resume')).toBeTruthy();

    addTradeEvents([mkTrade('3'), mkTrade('4')]);
    await settle(el);
    expect(rows(el)).toHaveLength(2); // frozen

    button(el, 'Resume').click();
    await settle(el);
    expect(rows(el)).toHaveLength(4); // live again
  });

  it('clears the stream', async () => {
    addTradeEvents([mkTrade('1')]);
    const el = await mount();
    button(el, 'Clear').click();
    await settle(el);
    expect(el.shadowRoot!.textContent).toContain('Waiting for trades');
  });
});
