import type { Asset, MarketEvent, Volatility, AssetType, ScenarioType } from '@market-pulse/contracts';
import { ASSETS_SEED, SCENARIOS } from '@market-pulse/contracts';

type BatchHandler = (events: MarketEvent[]) => void;

interface AssetState extends Asset {
  basePrice: number;
  priceHistory: number[];
}

/**
 * Market simulation engine.
 * 
 * Uses random walk with volatility profiles, correlated movements,
 * and scenario injection for realistic market behavior.
 */
export class MarketEngine {
  private assets: Map<string, AssetState> = new Map();
  private handlers: BatchHandler[] = [];
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private activeScenario: { type: ScenarioType; endsAt: number; config: typeof SCENARIOS[0] } | null = null;

  // Configurable parameters
  private updateIntervalMs = 100; // 10 updates/sec per batch
  private batchSize = 10;         // events per batch
  private tradeFrequency = 0.3;   // probability of trade per tick
  private alertFrequency = 0.05;  // probability of alert per tick

  constructor() {
    this.initializeAssets();
  }

  private initializeAssets(): void {
    for (const seed of ASSETS_SEED) {
      const asset: AssetState = {
        id: seed.symbol.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        symbol: seed.symbol,
        name: seed.name,
        type: seed.type as AssetType,
        price: seed.basePrice,
        previousPrice: seed.basePrice,
        open: seed.basePrice,
        high: seed.basePrice,
        low: seed.basePrice,
        change: 0,
        changePercent: 0,
        volume: Math.floor(Math.random() * 10_000_000) + 1_000_000,
        volatility: seed.baseVolatility as Volatility,
        lastUpdated: Date.now(),
        basePrice: seed.basePrice,
        priceHistory: [seed.basePrice],
      };
      this.assets.set(seed.symbol, asset);
    }
  }

  onBatch(handler: BatchHandler): void {
    this.handlers.push(handler);
  }

  private emit(events: MarketEvent[]): void {
    for (const handler of this.handlers) {
      handler(events);
    }
  }

  getSnapshot(): Asset[] {
    return Array.from(this.assets.values()).map(({ basePrice, priceHistory, ...asset }) => asset);
  }

  getHistory(symbol: string): { price: number; volume: number; timestamp: number }[] {
    const asset = this.assets.get(symbol);
    if (!asset) return [];

    const now = Date.now();
    return asset.priceHistory.map((price, i) => ({
      price,
      volume: Math.floor(Math.random() * 1_000_000),
      timestamp: now - (asset.priceHistory.length - i) * 1000,
    }));
  }

  start(): void {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => this.tick(), this.updateIntervalMs);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  setUpdateConfig(intervalMs: number, batchSize: number): void {
    this.updateIntervalMs = intervalMs;
    this.batchSize = batchSize;
    if (this.intervalId) {
      this.stop();
      this.start();
    }
  }

  triggerScenario(scenarioType: ScenarioType): void {
    const config = SCENARIOS.find((s: typeof SCENARIOS[number]) => s.type === scenarioType);
    if (!config) return;

    this.activeScenario = {
      type: scenarioType,
      endsAt: Date.now() + config.durationMs,
      config,
    };

    console.log(`[Engine] Scenario started: ${config.label} (${config.durationMs / 1000}s)`);
  }

  private tick(): void {
    const events: MarketEvent[] = [];
    const now = Date.now();

    // Check scenario expiry
    if (this.activeScenario && now > this.activeScenario.endsAt) {
      console.log(`[Engine] Scenario ended: ${this.activeScenario.config.label}`);
      this.activeScenario = null;
    }

    // Select random assets to update this tick
    const allSymbols = Array.from(this.assets.keys());
    const updateCount = Math.min(this.batchSize, allSymbols.length);
    const selectedSymbols = this.pickRandom(allSymbols, updateCount);

    for (const symbol of selectedSymbols) {
      const asset = this.assets.get(symbol)!;

      // Generate price movement
      const priceEvent = this.generatePriceUpdate(asset, now);
      if (priceEvent) events.push(priceEvent);

      // Possibly generate volume update
      if (Math.random() < 0.4) {
        events.push(this.generateVolumeUpdate(asset, now));
      }

      // Possibly generate trade
      if (Math.random() < this.tradeFrequency) {
        events.push(this.generateTrade(asset, now));
      }

      // Possibly generate alert
      if (Math.random() < this.alertFrequency || Math.abs(asset.changePercent) > 3) {
        const alert = this.generateAlert(asset, now);
        if (alert) events.push(alert);
      }
    }

    if (events.length > 0) {
      this.emit(events);
    }
  }

  private generatePriceUpdate(asset: AssetState, timestamp: number): MarketEvent | null {
    // Volatility-based random walk
    const volatilityMultiplier =
      asset.volatility === 'high' ? 0.015 :
      asset.volatility === 'medium' ? 0.005 :
      0.002;

    let changePercent = this.gaussianRandom() * volatilityMultiplier;

    // Apply scenario multiplier
    if (this.activeScenario) {
      const { config } = this.activeScenario;
      if (config.affectedTypes.includes(asset.type)) {
        changePercent += (config.priceMultiplier / 100) * volatilityMultiplier * 3;
      }
    }

    // Mean reversion: pull toward base price if drifted too far
    const drift = (asset.price - asset.basePrice) / asset.basePrice;
    if (Math.abs(drift) > 0.1) {
      changePercent -= drift * 0.01;
    }

    const previousPrice = asset.price;
    const newPrice = Math.max(asset.price * (1 + changePercent), 0.0001);
    const absoluteChange = newPrice - asset.open;
    const percentFromOpen = (absoluteChange / asset.open) * 100;

    // Update internal state
    asset.previousPrice = previousPrice;
    asset.price = newPrice;
    asset.change = absoluteChange;
    asset.changePercent = percentFromOpen;
    asset.high = Math.max(asset.high, newPrice);
    asset.low = Math.min(asset.low, newPrice);
    asset.lastUpdated = timestamp;

    // Keep price history (last 200 points)
    asset.priceHistory.push(newPrice);
    if (asset.priceHistory.length > 200) {
      asset.priceHistory.shift();
    }

    return {
      type: 'PRICE_UPDATED',
      symbol: asset.symbol,
      price: Math.round(newPrice * 10000) / 10000,
      previousPrice: Math.round(previousPrice * 10000) / 10000,
      change: Math.round(absoluteChange * 10000) / 10000,
      changePercent: Math.round(percentFromOpen * 100) / 100,
      high: Math.round(asset.high * 10000) / 10000,
      low: Math.round(asset.low * 10000) / 10000,
      timestamp,
    };
  }

  private generateVolumeUpdate(asset: AssetState, timestamp: number): MarketEvent {
    // Volume varies +/- 20% per update
    const volumeChange = 1 + (Math.random() - 0.5) * 0.4;
    asset.volume = Math.floor(asset.volume * volumeChange);
    if (asset.volume < 10000) asset.volume = 10000;

    return {
      type: 'VOLUME_UPDATED',
      symbol: asset.symbol,
      volume: asset.volume,
      timestamp,
    };
  }

  private generateTrade(asset: AssetState, timestamp: number): MarketEvent {
    const side = Math.random() > 0.5 ? 'buy' : 'sell';
    const quantity = Math.floor(Math.random() * 1000) + 1;

    return {
      type: 'TRADE_EXECUTED',
      symbol: asset.symbol,
      side,
      quantity,
      price: asset.price,
      timestamp,
    };
  }

  private generateAlert(asset: AssetState, timestamp: number): MarketEvent | null {
    const absChange = Math.abs(asset.changePercent);

    if (absChange < 1 && Math.random() > 0.1) return null;

    const severity: 'low' | 'medium' | 'high' =
      absChange > 5 ? 'high' :
      absChange > 2 ? 'medium' : 'low';

    const messages = {
      high: [
        `${asset.symbol} extreme movement: ${asset.changePercent > 0 ? '+' : ''}${asset.changePercent.toFixed(2)}%`,
        `Flash activity detected on ${asset.symbol}`,
        `${asset.symbol} breached volatility threshold`,
      ],
      medium: [
        `${asset.symbol} unusual activity: ${asset.changePercent > 0 ? '+' : ''}${asset.changePercent.toFixed(2)}%`,
        `Elevated volume on ${asset.symbol}`,
      ],
      low: [
        `${asset.symbol} price update: $${asset.price.toFixed(2)}`,
        `${asset.symbol} crossed moving average`,
      ],
    };

    const pool = messages[severity];
    const message = pool[Math.floor(Math.random() * pool.length)];

    return {
      type: 'ALERT_TRIGGERED',
      id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      symbol: asset.symbol,
      severity,
      message,
      timestamp,
    };
  }

  private gaussianRandom(): number {
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  private pickRandom<T>(arr: T[], count: number): T[] {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, count);
  }
}
