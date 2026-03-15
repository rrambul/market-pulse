import type { MarketEvent } from '@market-pulse/contracts';
import { setAssets, updateAsset, addTradeEvent, addAlert } from '@market-pulse/state';
import { createRAFBatcher } from '@market-pulse/utils';
import { MarketWebSocketClient } from './ws-client.js';
import { MarketRestClient } from './rest-client.js';

const DEFAULT_SERVER = 'http://localhost:4000';
const DEFAULT_WS = 'ws://localhost:4000/ws';

/**
 * Orchestrates the WebSocket connection and REST client, applying
 * incoming events to the signal store via a RAF batcher.
 * 
 * Pattern: WebSocket → buffer → RAF flush → signal writes
 * 
 * This ensures that even at 1000+ events/sec, signal writes are
 * coalesced to once per animation frame (~60 writes/sec), preventing
 * layout thrashing while keeping the UI current.
 */
export class MarketClientManager {
  private wsClient: MarketWebSocketClient;
  readonly restClient: MarketRestClient;
  private batcher: ReturnType<typeof createRAFBatcher<MarketEvent>>;
  private _signalUpdateCount = 0;
  private _initialized = false;

  constructor(
    serverUrl: string = DEFAULT_SERVER,
    wsUrl: string = DEFAULT_WS
  ) {
    this.restClient = new MarketRestClient(serverUrl);

    // Create RAF batcher that coalesces events per frame
    this.batcher = createRAFBatcher<MarketEvent>((events) => {
      this.applyEvents(events);
    });

    // WebSocket client feeds events into the batcher
    this.wsClient = new MarketWebSocketClient(wsUrl, (events) => {
      for (const event of events) {
        this.batcher.add(event);
      }
    });
  }

  get signalUpdateCount(): number {
    return this._signalUpdateCount;
  }

  resetSignalUpdateCount(): void {
    this._signalUpdateCount = 0;
  }

  get wsMessageCount(): number {
    return this.wsClient.messageCount;
  }

  resetWsMessageCount(): void {
    this.wsClient.resetMessageCount();
  }

  /**
   * Initialize: fetch snapshot, then connect WebSocket.
   */
  async initialize(): Promise<void> {
    if (this._initialized) return;
    this._initialized = true;

    try {
      // Fetch initial snapshot via REST
      const snapshot = await this.restClient.getSnapshot();
      setAssets(snapshot.assets);
    } catch (e) {
      console.warn('[MarketClient] Snapshot fetch failed, continuing with WebSocket only:', e);
    }

    // Connect WebSocket for live updates
    this.wsClient.connect();
  }

  /**
   * Apply a batch of events to the signal store.
   * Deduplicates price updates per symbol within the batch
   * (only the last update for each symbol is applied).
   */
  private applyEvents(events: MarketEvent[]): void {
    // Deduplicate price updates — keep only the latest per symbol
    const priceUpdates = new Map<string, MarketEvent>();
    const otherEvents: MarketEvent[] = [];

    for (const event of events) {
      if (event.type === 'PRICE_UPDATED') {
        priceUpdates.set(event.symbol, event);
      } else {
        otherEvents.push(event);
      }
    }

    // Apply deduplicated price updates
    for (const event of priceUpdates.values()) {
      if (event.type === 'PRICE_UPDATED') {
        this._signalUpdateCount++;
        updateAsset(event.symbol, {
          price: event.price,
          previousPrice: event.previousPrice,
          change: event.change,
          changePercent: event.changePercent,
          high: event.high,
          low: event.low,
          lastUpdated: event.timestamp,
        });
      }
    }

    // Apply other events
    for (const event of otherEvents) {
      this._signalUpdateCount++;
      switch (event.type) {
        case 'VOLUME_UPDATED':
          updateAsset(event.symbol, {
            volume: event.volume,
            lastUpdated: event.timestamp,
          });
          break;
        case 'TRADE_EXECUTED':
          addTradeEvent(event);
          break;
        case 'ALERT_TRIGGERED':
          addAlert(event);
          break;
        case 'VOLATILITY_CHANGED':
          updateAsset(event.symbol, {
            volatility: event.volatility,
            lastUpdated: event.timestamp,
          });
          break;
      }
    }
  }

  /**
   * Send a control message to the server.
   */
  send(data: unknown): void {
    this.wsClient.send(data);
  }

  /**
   * Disconnect and clean up resources.
   */
  destroy(): void {
    this.batcher.destroy();
    this.wsClient.disconnect();
    this._initialized = false;
  }
}
