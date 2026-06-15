import type { ScenarioType, StressTestConfig } from '@market-pulse/contracts';

/**
 * Control surface for the live market backend (scenario injection, stress test).
 *
 * The shell owns the market client and registers it here once at startup via
 * {@link setMarketControl}. Any microfrontend can then drive the backend through
 * {@link getMarketControl} without reaching through `window` globals or taking a
 * direct dependency on the market-client package.
 */
export interface MarketControl {
  triggerScenario(scenario: ScenarioType): Promise<void>;
  setStressTest(config: StressTestConfig): Promise<void>;
}

let _control: MarketControl | null = null;

export function setMarketControl(control: MarketControl | null): void {
  _control = control;
}

export function getMarketControl(): MarketControl | null {
  return _control;
}
