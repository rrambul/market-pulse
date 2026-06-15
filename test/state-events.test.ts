import { describe, it, expect, beforeEach } from 'vitest';
import type { TradeExecutedEvent, AlertTriggeredEvent } from '@market-pulse/contracts';
import {
  tradeEvents,
  addTradeEvent,
  addTradeEvents,
  clearTradeEvents,
  alerts,
  addAlert,
  addAlerts,
  clearAlerts,
  unreadAlertCount,
  markAlertsRead,
} from '@market-pulse/state';

const mkTrade = (id: string, q: number): TradeExecutedEvent => ({
  type: 'TRADE_EXECUTED', id, symbol: 'AAA', side: 'buy', quantity: q, price: 1, timestamp: q,
});
const mkAlert = (id: string): AlertTriggeredEvent => ({
  type: 'ALERT_TRIGGERED', id, symbol: 'AAA', severity: 'low', message: 'm', timestamp: 0,
});

describe('trade events', () => {
  beforeEach(() => clearTradeEvents());

  it('addTradeEvent prepends single events newest-first', () => {
    addTradeEvent(mkTrade('a', 1));
    addTradeEvent(mkTrade('b', 2));
    expect(tradeEvents.get().map((t) => t.id)).toEqual(['b', 'a']);
  });

  it('addTradeEvents prepends a chronological batch newest-first', () => {
    addTradeEvents([mkTrade('a', 1), mkTrade('b', 2), mkTrade('c', 3)]);
    expect(tradeEvents.get().map((t) => t.id)).toEqual(['c', 'b', 'a']);
  });

  it('caps the buffer at 500 keeping the newest', () => {
    addTradeEvents(Array.from({ length: 600 }, (_, i) => mkTrade(`x${i}`, i)));
    const list = tradeEvents.get();
    expect(list).toHaveLength(500);
    expect(list[0].id).toBe('x599');
  });

  it('empty batches are a no-op (same reference)', () => {
    const ref = tradeEvents.get();
    addTradeEvents([]);
    expect(tradeEvents.get()).toBe(ref);
  });

  it('clearTradeEvents empties the buffer', () => {
    addTradeEvent(mkTrade('a', 1));
    clearTradeEvents();
    expect(tradeEvents.get()).toEqual([]);
  });
});

describe('alerts', () => {
  beforeEach(() => clearAlerts());

  it('addAlert increments unread and prepends', () => {
    addAlert(mkAlert('a1'));
    expect(alerts.get()[0].id).toBe('a1');
    expect(unreadAlertCount.get()).toBe(1);
  });

  it('addAlerts bumps unread by the batch size', () => {
    addAlerts([mkAlert('a1'), mkAlert('a2'), mkAlert('a3')]);
    expect(unreadAlertCount.get()).toBe(3);
    expect(alerts.get()[0].id).toBe('a3');
  });

  it('caps the buffer at 200', () => {
    addAlerts(Array.from({ length: 250 }, (_, i) => mkAlert(`a${i}`)));
    expect(alerts.get()).toHaveLength(200);
  });

  it('markAlertsRead resets only the unread counter', () => {
    addAlerts([mkAlert('a1'), mkAlert('a2')]);
    markAlertsRead();
    expect(unreadAlertCount.get()).toBe(0);
    expect(alerts.get()).toHaveLength(2);
  });

  it('clearAlerts resets buffer and counter', () => {
    addAlerts([mkAlert('a1')]);
    clearAlerts();
    expect(alerts.get()).toEqual([]);
    expect(unreadAlertCount.get()).toBe(0);
  });

  it('empty alert batches are a no-op', () => {
    const ref = alerts.get();
    addAlerts([]);
    expect(alerts.get()).toBe(ref);
  });
});
