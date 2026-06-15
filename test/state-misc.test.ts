import { describe, it, expect } from 'vitest';
import {
  selectedSymbol,
  setSelectedSymbol,
  connectionStatus,
  setConnectionStatus,
  stressTestConfig,
  setStressTestConfig,
  performanceMetrics,
  updatePerformanceMetrics,
  setMarketControl,
  getMarketControl,
} from '@market-pulse/state';

describe('app-state', () => {
  it('selectedSymbol round-trips', () => {
    expect(selectedSymbol.get()).toBeNull();
    setSelectedSymbol('AAPL');
    expect(selectedSymbol.get()).toBe('AAPL');
    setSelectedSymbol(null);
    expect(selectedSymbol.get()).toBeNull();
  });

  it('connectionStatus round-trips', () => {
    expect(connectionStatus.get()).toBe('disconnected');
    setConnectionStatus('connected');
    expect(connectionStatus.get()).toBe('connected');
  });

  it('setStressTestConfig merges partials over the current config', () => {
    expect(stressTestConfig.get().enabled).toBe(false);
    setStressTestConfig({ enabled: true });
    expect(stressTestConfig.get().enabled).toBe(true);
    expect(stressTestConfig.get().updateFrequencyMs).toBe(100); // preserved
    setStressTestConfig({ updateFrequencyMs: 10, batchSize: 36 });
    expect(stressTestConfig.get()).toMatchObject({ enabled: true, updateFrequencyMs: 10, batchSize: 36 });
  });
});

describe('perf-store', () => {
  it('updatePerformanceMetrics merges partials', () => {
    updatePerformanceMetrics({ fps: 42 });
    expect(performanceMetrics.get().fps).toBe(42);
    expect(performanceMetrics.get().domNodeCount).toBe(0); // untouched default
    updatePerformanceMetrics({ domNodeCount: 1234, heapUsedMB: 50 });
    expect(performanceMetrics.get()).toMatchObject({ fps: 42, domNodeCount: 1234, heapUsedMB: 50 });
  });
});

describe('control seam', () => {
  it('defaults to null and round-trips a control object', async () => {
    expect(getMarketControl()).toBeNull();
    const control = { triggerScenario: async () => {}, setStressTest: async () => {} };
    setMarketControl(control);
    expect(getMarketControl()).toBe(control);
    setMarketControl(null);
    expect(getMarketControl()).toBeNull();
  });
});
