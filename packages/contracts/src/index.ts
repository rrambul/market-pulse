// ─── Asset Types ───

export type AssetType = 'stock' | 'crypto' | 'forex' | 'commodity';
export type Volatility = 'low' | 'medium' | 'high';

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  type: AssetType;
  price: number;
  previousPrice: number;
  open: number;
  high: number;
  low: number;
  change: number;
  changePercent: number;
  volume: number;
  volatility: Volatility;
  lastUpdated: number;
}

// ─── Market Events ───

export interface PriceUpdatedEvent {
  type: 'PRICE_UPDATED';
  symbol: string;
  price: number;
  previousPrice: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  timestamp: number;
}

export interface VolumeUpdatedEvent {
  type: 'VOLUME_UPDATED';
  symbol: string;
  volume: number;
  timestamp: number;
}

export interface TradeExecutedEvent {
  type: 'TRADE_EXECUTED';
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  timestamp: number;
}

export interface AlertTriggeredEvent {
  type: 'ALERT_TRIGGERED';
  id: string;
  symbol: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: number;
}

export interface VolatilityChangedEvent {
  type: 'VOLATILITY_CHANGED';
  symbol: string;
  volatility: Volatility;
  timestamp: number;
}

export type MarketEvent =
  | PriceUpdatedEvent
  | VolumeUpdatedEvent
  | TradeExecutedEvent
  | AlertTriggeredEvent
  | VolatilityChangedEvent;

// ─── WebSocket Messages ───

export interface WSBatchMessage {
  type: 'BATCH';
  events: MarketEvent[];
  timestamp: number;
}

export interface WSSnapshotMessage {
  type: 'SNAPSHOT';
  assets: Asset[];
  timestamp: number;
}

export interface WSScenarioMessage {
  type: 'SCENARIO_STARTED';
  scenario: ScenarioType;
  timestamp: number;
}

export type WSMessage = WSBatchMessage | WSSnapshotMessage | WSScenarioMessage;

// ─── Scenarios ───

export type ScenarioType =
  | 'tech-selloff'
  | 'crypto-rally'
  | 'flash-crash'
  | 'volume-burst'
  | 'forex-shock'
  | 'commodity-surge';

export interface ScenarioConfig {
  type: ScenarioType;
  label: string;
  description: string;
  durationMs: number;
  affectedTypes: AssetType[];
  priceMultiplier: number;
  volatilityOverride?: Volatility;
}

// ─── Connection ───

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

// ─── Stress Test ───

export interface StressTestConfig {
  enabled: boolean;
  updateFrequencyMs: number;
  batchSize: number;
}

/**
 * Engine cadence profiles. `normal` is the baseline; `stress` drives ~10x the
 * event volume (10ms ticks, larger batches) so signal reactivity can be
 * observed under load. Both ends of the wire share these so the toggle and the
 * server can never silently disagree.
 */
export const NORMAL_PROFILE: Readonly<Pick<StressTestConfig, 'updateFrequencyMs' | 'batchSize'>> = {
  updateFrequencyMs: 100,
  batchSize: 10,
};

export const STRESS_PROFILE: Readonly<Pick<StressTestConfig, 'updateFrequencyMs' | 'batchSize'>> = {
  updateFrequencyMs: 10,
  batchSize: 36,
};

/** Safety bounds the server clamps incoming cadence config to. */
export const ENGINE_LIMITS = {
  minUpdateFrequencyMs: 10,
  maxUpdateFrequencyMs: 5000,
  minBatchSize: 1,
  maxBatchSize: 200,
} as const;

// ─── REST API ───

export interface SnapshotResponse {
  assets: Asset[];
  timestamp: number;
}

export interface HistoryPoint {
  price: number;
  volume: number;
  timestamp: number;
}

export interface AssetHistoryResponse {
  symbol: string;
  points: HistoryPoint[];
}

// ─── Performance Metrics ───

export interface PerformanceMetrics {
  fps: number;
  signalUpdatesPerSec: number;
  wsMessagesPerSec: number;
  domNodeCount: number;
  heapUsedMB: number;
}

// ─── Re-export Seed Data ───
export { ASSETS_SEED, SCENARIOS } from './seed.js';
