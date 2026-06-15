import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MarketWebSocketClient } from '@market-pulse/market-client';
import { connectionStatus } from '@market-pulse/state';
import { FakeWebSocket } from './helpers/fake-ws';

let savedWebSocket: unknown;
beforeEach(() => {
  FakeWebSocket.reset();
  savedWebSocket = (globalThis as { WebSocket?: unknown }).WebSocket;
  (globalThis as { WebSocket?: unknown }).WebSocket = FakeWebSocket;
});
afterEach(() => {
  (globalThis as { WebSocket?: unknown }).WebSocket = savedWebSocket;
  vi.useRealTimers();
});

const last = () => FakeWebSocket.instances.at(-1)!;

describe('MarketWebSocketClient', () => {
  it('connects and transitions connecting → connected on open', () => {
    const c = new MarketWebSocketClient('ws://x', vi.fn());
    c.connect();
    expect(connectionStatus.get()).toBe('connecting');
    last().open();
    expect(connectionStatus.get()).toBe('connected');
  });

  it('forwards parsed messages and counts them', () => {
    const onMsg = vi.fn();
    const c = new MarketWebSocketClient('ws://x', onMsg);
    c.connect();
    last().emit({ type: 'BATCH', events: [], timestamp: 1 });
    expect(onMsg).toHaveBeenCalledWith({ type: 'BATCH', events: [], timestamp: 1 });
    expect(c.messageCount).toBe(1);
  });

  it('ignores malformed messages but still counts them', () => {
    const onMsg = vi.fn();
    const c = new MarketWebSocketClient('ws://x', onMsg);
    c.connect();
    last().raw('{ not json');
    expect(onMsg).not.toHaveBeenCalled();
    expect(c.messageCount).toBe(1);
    c.resetMessageCount();
    expect(c.messageCount).toBe(0);
  });

  it('schedules a reconnect on close and reconnects after backoff', () => {
    vi.useFakeTimers();
    const c = new MarketWebSocketClient('ws://x', vi.fn());
    c.connect();
    last().open();
    const before = FakeWebSocket.instances.length;
    last().close();
    expect(connectionStatus.get()).toBe('reconnecting');
    vi.advanceTimersByTime(1000);
    expect(FakeWebSocket.instances.length).toBe(before + 1);
  });

  it('gives up and reports disconnected after the max attempts', () => {
    vi.useFakeTimers();
    const c = new MarketWebSocketClient('ws://x', vi.fn());
    c.connect();
    for (let i = 0; i < 11; i++) {
      last().close(); // never opened → attempts keep climbing
      vi.advanceTimersByTime(60_000);
    }
    expect(connectionStatus.get()).toBe('disconnected');
  });

  it('schedules a reconnect if WebSocket construction throws', () => {
    vi.useFakeTimers();
    (globalThis as { WebSocket?: unknown }).WebSocket = class {
      constructor() {
        throw new Error('no socket');
      }
    };
    const c = new MarketWebSocketClient('ws://x', vi.fn());
    c.connect();
    expect(connectionStatus.get()).toBe('reconnecting');
  });

  it('onerror closes the underlying socket', () => {
    const c = new MarketWebSocketClient('ws://x', vi.fn());
    c.connect();
    last().open();
    last().onerror?.();
    expect(last().readyState).toBe(3);
  });

  it('send only transmits when the socket is open', () => {
    const c = new MarketWebSocketClient('ws://x', vi.fn());
    c.connect();
    c.send({ a: 1 });
    expect(last().sent).toHaveLength(0);
    last().open();
    c.send({ a: 1 });
    expect(last().sent).toEqual([JSON.stringify({ a: 1 })]);
  });

  it('disconnect tears down and suppresses further reconnects', () => {
    vi.useFakeTimers();
    const c = new MarketWebSocketClient('ws://x', vi.fn());
    c.connect();
    last().open();
    const count = FakeWebSocket.instances.length;
    c.disconnect();
    expect(connectionStatus.get()).toBe('disconnected');
    vi.advanceTimersByTime(60_000);
    expect(FakeWebSocket.instances.length).toBe(count); // no reconnect
  });
});
