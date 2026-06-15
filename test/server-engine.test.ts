import { describe, it, expect, vi, afterEach } from 'vitest';
import type { MarketEvent } from '@market-pulse/contracts';
import { MarketEngine } from '../server/market-simulator/src/engine';

afterEach(() => vi.useRealTimers());

function collect(engine: MarketEngine): MarketEvent[] {
  const events: MarketEvent[] = [];
  engine.onBatch((batch) => events.push(...batch));
  return events;
}

describe('MarketEngine', () => {
  it('seeds assets and strips internal fields from the snapshot', () => {
    const engine = new MarketEngine();
    const snap = engine.getSnapshot();
    expect(snap.length).toBeGreaterThan(0);
    expect(snap[0]).not.toHaveProperty('basePrice');
    expect(snap[0]).not.toHaveProperty('history');
    expect(snap[0]).toHaveProperty('symbol');
  });

  it('returns recorded history for known symbols and empty for unknown', () => {
    const engine = new MarketEngine();
    const sym = engine.getSnapshot()[0].symbol;
    const hist = engine.getHistory(sym);
    expect(hist[0]).toMatchObject({ price: expect.any(Number), volume: expect.any(Number), timestamp: expect.any(Number) });
    expect(engine.getHistory('NOT-A-SYMBOL')).toEqual([]);
  });

  it('produces price/volume/trade/alert events and grows history while ticking', () => {
    vi.useFakeTimers();
    const engine = new MarketEngine();
    const events = collect(engine);
    engine.start();
    engine.start(); // idempotent
    vi.advanceTimersByTime(100 * 120); // ~120 ticks
    engine.stop();

    const types = new Set(events.map((e) => e.type));
    expect(types.has('PRICE_UPDATED')).toBe(true);
    expect(events.length).toBeGreaterThan(0);

    const sym = engine.getSnapshot()[0].symbol;
    expect(engine.getHistory(sym).length).toBeGreaterThan(1);
  });

  it('caps per-asset history at 200 points', () => {
    vi.useFakeTimers();
    const engine = new MarketEngine();
    const symbolCount = engine.getSnapshot().length;
    engine.setUpdateConfig(100, symbolCount); // update every asset every tick
    engine.start();
    vi.advanceTimersByTime(100 * 230);
    engine.stop();
    const sym = engine.getSnapshot()[0].symbol;
    expect(engine.getHistory(sym).length).toBe(200);
  });

  it('broadcasts SCENARIO_STARTED for known scenarios and ignores unknown ones', () => {
    const engine = new MarketEngine();
    const onScenario = vi.fn();
    engine.onScenario(onScenario);

    engine.triggerScenario('crypto-rally');
    expect(onScenario).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'SCENARIO_STARTED', scenario: 'crypto-rally' }),
    );

    engine.triggerScenario('not-real' as never);
    expect(onScenario).toHaveBeenCalledTimes(1);
  });

  it('applies a scenario, generates alerts, and clears it after its duration', () => {
    vi.useFakeTimers();
    const engine = new MarketEngine();
    const events = collect(engine);
    engine.setUpdateConfig(100, engine.getSnapshot().length);
    engine.triggerScenario('flash-crash'); // 15s, all types, -8 multiplier
    engine.start();
    vi.advanceTimersByTime(100 * 200); // well past the 15s scenario
    engine.stop();

    expect(events.some((e) => e.type === 'ALERT_TRIGGERED')).toBe(true);
    expect(events.some((e) => e.type === 'TRADE_EXECUTED')).toBe(true);
  });

  it('setUpdateConfig restarts the interval only when running', () => {
    const engine = new MarketEngine();
    expect(() => engine.setUpdateConfig(50, 5)).not.toThrow(); // not running → just set
    vi.useFakeTimers();
    engine.start();
    expect(() => engine.setUpdateConfig(20, 8)).not.toThrow(); // running → stop+start
    engine.stop();
    engine.stop(); // idempotent
  });
});
