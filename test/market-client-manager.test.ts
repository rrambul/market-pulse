import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MarketClientManager } from '@market-pulse/market-client';
import type { Asset } from '@market-pulse/contracts';
import {
  getAssetSignal,
  tradeEvents,
  alerts,
  clearTradeEvents,
  clearAlerts,
  getMarketControl,
} from '@market-pulse/state';
import { FakeWebSocket, installRaf } from './helpers/fake-ws';

let flushRaf: () => void;
let savedWebSocket: unknown;

function stubFetch(snapshot: unknown) {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => snapshot })));
}

const snapAsset = (symbol: string, price = 100): Asset => ({
  id: symbol.toLowerCase(), symbol, name: symbol, type: 'stock', price, previousPrice: price,
  open: price, high: price, low: price, change: 0, changePercent: 0, volume: 1, volatility: 'low', lastUpdated: 0,
});
const priceEvt = (symbol: string, price: number, ts = 2) => ({
  type: 'PRICE_UPDATED' as const, symbol, price, previousPrice: price - 1,
  change: 1, changePercent: 1, high: price, low: price - 2, timestamp: ts,
});

beforeEach(() => {
  FakeWebSocket.reset();
  savedWebSocket = (globalThis as { WebSocket?: unknown }).WebSocket;
  (globalThis as { WebSocket?: unknown }).WebSocket = FakeWebSocket;
  flushRaf = installRaf();
  clearTradeEvents();
  clearAlerts();
});
afterEach(() => {
  (globalThis as { WebSocket?: unknown }).WebSocket = savedWebSocket;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('MarketClientManager', () => {
  it('initialize registers control, applies the snapshot, and connects', async () => {
    stubFetch({ assets: [snapAsset('MGR1', 50)], timestamp: 7 });
    const mgr = new MarketClientManager('http://s', 'ws://s/ws');
    await mgr.initialize();

    expect(getMarketControl()).toBe(mgr.restClient);
    expect(getAssetSignal('MGR1')!.get().price).toBe(50);
    expect(FakeWebSocket.instances.length).toBe(1);

    mgr.destroy();
    expect(getMarketControl()).toBeNull();
  });

  it('initialize is idempotent', async () => {
    stubFetch({ assets: [], timestamp: 1 });
    const mgr = new MarketClientManager();
    await mgr.initialize();
    await mgr.initialize();
    expect(FakeWebSocket.instances.length).toBe(1);
    mgr.destroy();
  });

  it('still connects when the snapshot fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('boom');
    }));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const mgr = new MarketClientManager();
    await mgr.initialize();
    expect(FakeWebSocket.instances.length).toBe(1);
    expect(warn).toHaveBeenCalled();
    mgr.destroy();
  });

  it('applies a BATCH: dedups price per symbol, batches trades/alerts, applies volume + volatility', async () => {
    stubFetch({ assets: [snapAsset('BX', 100)], timestamp: 1 });
    const mgr = new MarketClientManager();
    await mgr.initialize();
    FakeWebSocket.instances.at(-1)!.open();

    FakeWebSocket.instances.at(-1)!.emit({
      type: 'BATCH',
      timestamp: 2,
      events: [
        priceEvt('BX', 101, 2),
        priceEvt('BX', 109, 3), // later wins after dedup
        { type: 'VOLUME_UPDATED', symbol: 'BX', volume: 555, timestamp: 3 },
        { type: 'VOLATILITY_CHANGED', symbol: 'BX', volatility: 'high', timestamp: 3 },
        { type: 'TRADE_EXECUTED', id: 't1', symbol: 'BX', side: 'buy', quantity: 1, price: 109, timestamp: 3 },
        { type: 'ALERT_TRIGGERED', id: 'al1', symbol: 'BX', severity: 'low', message: 'm', timestamp: 3 },
      ],
    });
    flushRaf();

    const bx = getAssetSignal('BX')!.get();
    expect(bx.price).toBe(109);
    expect(bx.volume).toBe(555);
    expect(bx.volatility).toBe('high');
    expect(tradeEvents.get().some((t) => t.id === 't1')).toBe(true);
    expect(alerts.get().some((a) => a.id === 'al1')).toBe(true);

    expect(mgr.signalUpdateCount).toBeGreaterThan(0);
    mgr.resetSignalUpdateCount();
    expect(mgr.signalUpdateCount).toBe(0);
    mgr.destroy();
  });

  it('SNAPSHOT over WS resyncs assets and SCENARIO_STARTED surfaces a MARKET alert', async () => {
    stubFetch({ assets: [], timestamp: 1 });
    const mgr = new MarketClientManager();
    await mgr.initialize();
    const ws = FakeWebSocket.instances.at(-1)!;
    ws.open();

    ws.emit({ type: 'SNAPSHOT', assets: [snapAsset('SNAP1', 12)], timestamp: 9 });
    expect(getAssetSignal('SNAP1')!.get().price).toBe(12);

    ws.emit({ type: 'SCENARIO_STARTED', scenario: 'flash-crash', timestamp: 10 });
    const scenarioAlert = alerts.get().find((a) => a.symbol === 'MARKET');
    expect(scenarioAlert?.message).toMatch(/Flash Crash/);
    mgr.destroy();
  });

  it('tracks ws message count and send() passes through to the socket', async () => {
    stubFetch({ assets: [], timestamp: 1 });
    const mgr = new MarketClientManager();
    await mgr.initialize();
    const ws = FakeWebSocket.instances.at(-1)!;
    ws.open();

    ws.emit({ type: 'BATCH', events: [], timestamp: 1 });
    expect(mgr.wsMessageCount).toBeGreaterThan(0);

    mgr.send({ hello: 1 });
    expect(ws.sent.at(-1)).toBe(JSON.stringify({ hello: 1 }));

    mgr.resetWsMessageCount();
    expect(mgr.wsMessageCount).toBe(0);
    mgr.destroy();
  });
});
