import type {
  Asset,
  MarketEvent,
  WSMessage,
  WSScenarioMessage,
  PriceUpdatedEvent,
  TradeExecutedEvent,
  AlertTriggeredEvent,
} from '@market-pulse/contracts';
import { SCENARIOS } from '@market-pulse/contracts';
import {
  setAssets,
  updateAsset,
  addTradeEvents,
  addAlerts,
  addAlert,
  recordPrice,
  setMarketControl,
} from '@market-pulse/state';
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

  constructor(serverUrl: string = DEFAULT_SERVER, wsUrl: string = DEFAULT_WS) {
    this.restClient = new MarketRestClient(serverUrl);

    // Create RAF batcher that coalesces events per frame
    this.batcher = createRAFBatcher<MarketEvent>((events) => {
      this.applyEvents(events);
    });

    // WebSocket client feeds parsed messages here; events go through the batcher
    this.wsClient = new MarketWebSocketClient(wsUrl, (message) => {
      this.handleMessage(message);
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

    // Expose backend control (scenarios, stress test) to all microfrontends
    // without a window global or a direct dependency on this package.
    setMarketControl(this.restClient);

    try {
      // Fetch initial snapshot via REST
      const snapshot = await this.restClient.getSnapshot();
      this.applySnapshot(snapshot.assets, snapshot.timestamp);
    } catch (e) {
      console.warn('[MarketClient] Snapshot fetch failed, continuing with WebSocket only:', e);
    }

    // Connect WebSocket for live updates
    this.wsClient.connect();
  }

  /** Route a parsed WebSocket message to the right store operation. */
  private handleMessage(message: WSMessage): void {
    switch (message.type) {
      case 'BATCH':
        for (const event of message.events) this.batcher.add(event);
        break;
      case 'SNAPSHOT':
        // Re-applied on every (re)connect so a dropped socket resyncs cleanly.
        this.applySnapshot(message.assets, message.timestamp);
        break;
      case 'SCENARIO_STARTED':
        this.handleScenarioStarted(message);
        break;
    }
  }

  private applySnapshot(assets: Asset[], timestamp: number): void {
    setAssets(assets);
    // Seed chart history so charts have a starting point immediately.
    for (const asset of assets) recordPrice(asset.symbol, asset.price, timestamp);
  }

  private handleScenarioStarted(message: WSScenarioMessage): void {
    const config = SCENARIOS.find((s) => s.type === message.scenario);
    const alert: AlertTriggeredEvent = {
      type: 'ALERT_TRIGGERED',
      id: `scenario-${message.timestamp}`,
      symbol: 'MARKET',
      severity: 'high',
      message: `Scenario started: ${config?.label ?? message.scenario}`,
      timestamp: message.timestamp,
    };
    addAlert(alert);
  }

  /**
   * Apply a batch of events to the signal store.
   * Price updates are deduplicated per symbol (only the latest is applied);
   * trades and alerts are flushed as one batch each to cap array churn.
   */
  private applyEvents(events: MarketEvent[]): void {
    const priceUpdates = new Map<string, PriceUpdatedEvent>();
    const trades: TradeExecutedEvent[] = [];
    const alertEvents: AlertTriggeredEvent[] = [];

    for (const event of events) {
      switch (event.type) {
        case 'PRICE_UPDATED':
          priceUpdates.set(event.symbol, event);
          break;
        case 'TRADE_EXECUTED':
          trades.push(event);
          break;
        case 'ALERT_TRIGGERED':
          alertEvents.push(event);
          break;
        case 'VOLUME_UPDATED':
          this._signalUpdateCount++;
          updateAsset(event.symbol, { volume: event.volume, lastUpdated: event.timestamp });
          break;
        case 'VOLATILITY_CHANGED':
          this._signalUpdateCount++;
          updateAsset(event.symbol, { volatility: event.volatility, lastUpdated: event.timestamp });
          break;
      }
    }

    for (const event of priceUpdates.values()) {
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
      recordPrice(event.symbol, event.price, event.timestamp);
    }

    if (trades.length > 0) {
      this._signalUpdateCount++;
      addTradeEvents(trades);
    }
    if (alertEvents.length > 0) {
      this._signalUpdateCount++;
      addAlerts(alertEvents);
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
    setMarketControl(null);
    this._initialized = false;
  }
}
