import type { WSMessage, MarketEvent } from '@market-pulse/contracts';
import { setConnectionStatus } from '@market-pulse/state';

export type WSEventHandler = (events: MarketEvent[]) => void;

/**
 * WebSocket client with auto-reconnect and exponential backoff.
 * Messages are parsed and forwarded to the handler without buffering here —
 * buffering/batching is handled by the RAF batcher in the ClientManager.
 */
export class MarketWebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private handler: WSEventHandler;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private baseDelay = 1000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private _messageCount = 0;
  private _destroyed = false;

  constructor(url: string, handler: WSEventHandler) {
    this.url = url;
    this.handler = handler;
  }

  get messageCount(): number {
    return this._messageCount;
  }

  resetMessageCount(): void {
    this._messageCount = 0;
  }

  connect(): void {
    if (this._destroyed) return;

    setConnectionStatus('connecting');

    try {
      this.ws = new WebSocket(this.url);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      setConnectionStatus('connected');
    };

    this.ws.onmessage = (event: MessageEvent) => {
      this._messageCount++;
      try {
        const msg: WSMessage = JSON.parse(event.data as string);
        if (msg.type === 'BATCH') {
          this.handler(msg.events);
        } else if (msg.type === 'SNAPSHOT') {
          // Snapshot is handled differently — emit as synthetic events
          this.handler([]);
        }
      } catch {
        // Silently ignore malformed messages
      }
    };

    this.ws.onclose = () => {
      if (!this._destroyed) {
        setConnectionStatus('reconnecting');
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  private scheduleReconnect(): void {
    if (this._destroyed) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      setConnectionStatus('disconnected');
      return;
    }

    const delay = this.baseDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;
    setConnectionStatus('reconnecting');

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  send(data: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  disconnect(): void {
    this._destroyed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
    setConnectionStatus('disconnected');
  }
}
