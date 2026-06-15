import { describe, it, expect, vi, afterEach } from 'vitest';
import { MarketRestClient } from '@market-pulse/market-client';

afterEach(() => vi.unstubAllGlobals());

function stubFetch(impl: (...a: unknown[]) => unknown) {
  const f = vi.fn(impl);
  vi.stubGlobal('fetch', f);
  return f;
}

describe('MarketRestClient', () => {
  it('getSnapshot returns parsed JSON and hits the snapshot route', async () => {
    const f = stubFetch(async () => ({ ok: true, status: 200, json: async () => ({ assets: [], timestamp: 7 }) }));
    const snap = await new MarketRestClient('http://srv').getSnapshot();
    expect(snap.timestamp).toBe(7);
    expect(f).toHaveBeenCalledWith('http://srv/api/snapshot');
  });

  it('getSnapshot throws on a non-ok response', async () => {
    stubFetch(async () => ({ ok: false, status: 500 }));
    await expect(new MarketRestClient('http://srv').getSnapshot()).rejects.toThrow(/500/);
  });

  it('getHistory URL-encodes the symbol and passes the points param', async () => {
    const f = stubFetch(async () => ({ ok: true, json: async () => ({ symbol: 'EUR/USD', points: [] }) }));
    await new MarketRestClient('http://srv').getHistory('EUR/USD', 50);
    expect(f).toHaveBeenCalledWith('http://srv/api/history/EUR%2FUSD?points=50');
  });

  it('getHistory defaults to 100 points and throws on non-ok', async () => {
    const f = stubFetch(async () => ({ ok: false, status: 404 }));
    await expect(new MarketRestClient('http://srv').getHistory('X')).rejects.toThrow(/404/);
    expect(f).toHaveBeenCalledWith('http://srv/api/history/X?points=100');
  });

  it('triggerScenario POSTs the scenario body', async () => {
    const f = stubFetch(async () => ({ ok: true, json: async () => ({}) }));
    await new MarketRestClient('http://srv').triggerScenario('flash-crash');
    expect(f).toHaveBeenCalledWith(
      'http://srv/api/scenario',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ scenario: 'flash-crash' }) }),
    );
  });

  it('setStressTest POSTs the config body', async () => {
    const f = stubFetch(async () => ({ ok: true, json: async () => ({}) }));
    const cfg = { enabled: true, updateFrequencyMs: 10, batchSize: 36 };
    await new MarketRestClient('http://srv').setStressTest(cfg);
    expect(f).toHaveBeenCalledWith(
      'http://srv/api/stress-test',
      expect.objectContaining({ method: 'POST', body: JSON.stringify(cfg) }),
    );
  });
});
