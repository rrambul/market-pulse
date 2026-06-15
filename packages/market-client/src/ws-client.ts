import type { WSMessage } from '@market-pulse/contracts';
import { setConnectionStatus } from '@market-pulse/state';

export type WSMessageHandler = (message: WSMessage) => void;

/**
 * WebSocket client with auto-reconnect and (capped) exponential backoff.
 * Parsed messages are forwarded as-is to the handler; message-type dispatch and
 * buffering/batching live in the ClientManager so this stays transport-only.
 */
export class MarketWebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private onMessage: WSMessageHandler;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private baseDelay = 1000;
  private maxDelay = 30_000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private _messageCount = 0;
  private _destroyed = false;

  constructor(url: string, onMessage: WSMessageHandler) {
    this.url = url;
    this.onMessage = onMessage;
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
      let msg: WSMessage;
      try {
        msg = JSON.parse(event.data as string);
      } catch {
        return; // Silently ignore malformed messages
      }
      this.onMessage(msg);
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

    const delay = Math.min(this.baseDelay * 2 ** this.reconnectAttempts, this.maxDelay);
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
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
    setConnectionStatus('disconnected');
  }
}
