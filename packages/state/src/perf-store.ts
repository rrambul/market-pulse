import { Signal } from 'signal-polyfill';
import type { PerformanceMetrics } from '@market-pulse/contracts';

export const performanceMetrics = new Signal.State<PerformanceMetrics>({
  fps: 60,
  signalUpdatesPerSec: 0,
  wsMessagesPerSec: 0,
  domNodeCount: 0,
  heapUsedMB: 0,
});

export function updatePerformanceMetrics(partial: Partial<PerformanceMetrics>): void {
  performanceMetrics.set({ ...performanceMetrics.get(), ...partial });
}
