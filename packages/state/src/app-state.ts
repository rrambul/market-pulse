import { Signal } from 'signal-polyfill';
import type { ConnectionStatus, StressTestConfig } from '@market-pulse/contracts';

/** Currently selected asset symbol for the detail view */
export const selectedSymbol = new Signal.State<string | null>(null);

export function setSelectedSymbol(symbol: string | null): void {
  selectedSymbol.set(symbol);
}

/** WebSocket connection status */
export const connectionStatus = new Signal.State<ConnectionStatus>('disconnected');

export function setConnectionStatus(status: ConnectionStatus): void {
  connectionStatus.set(status);
}

/** Stress test configuration */
export const stressTestConfig = new Signal.State<StressTestConfig>({
  enabled: false,
  updateFrequencyMs: 100,
  batchSize: 10,
});

export function setStressTestConfig(config: Partial<StressTestConfig>): void {
  stressTestConfig.set({ ...stressTestConfig.get(), ...config });
}
