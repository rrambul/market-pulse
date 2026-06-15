import { vi } from 'vitest';

/** Minimal scriptable WebSocket stand-in for driving the client in tests. */
export class FakeWebSocket {
  static OPEN = 1;
  static instances: FakeWebSocket[] = [];
  static reset(): void {
    FakeWebSocket.instances = [];
  }

  url: string;
  readyState = 0;
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  sent: string[] = [];

  constructor(url: string) {
    this.url = url;
    FakeWebSocket.instances.push(this);
  }

  send(data: string): void {
    this.sent.push(data);
  }

  close(): void {
    this.readyState = 3;
    this.onclose?.();
  }

  // --- test helpers ---
  open(): void {
    this.readyState = FakeWebSocket.OPEN;
    this.onopen?.();
  }
  emit(message: unknown): void {
    this.onmessage?.({ data: JSON.stringify(message) });
  }
  raw(data: string): void {
    this.onmessage?.({ data });
  }
}

/** Manual requestAnimationFrame queue; returns a flusher that runs one frame. */
export function installRaf(): () => void {
  let id = 0;
  const cbs = new Map<number, FrameRequestCallback>();
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    const i = ++id;
    cbs.set(i, cb);
    return i;
  });
  vi.stubGlobal('cancelAnimationFrame', (i: number) => {
    cbs.delete(i);
  });
  return () => {
    for (const [i, cb] of [...cbs.entries()]) {
      cbs.delete(i);
      cb(0);
    }
  };
}
