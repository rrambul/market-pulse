import type { SnapshotResponse, AssetHistoryResponse, ScenarioType, StressTestConfig } from '@market-pulse/contracts';

/**
 * REST client for initial snapshots, history, and control endpoints.
 */
export class MarketRestClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async getSnapshot(): Promise<SnapshotResponse> {
    const res = await fetch(`${this.baseUrl}/api/snapshot`);
    if (!res.ok) throw new Error(`Snapshot fetch failed: ${res.status}`);
    return res.json();
  }

  async getHistory(symbol: string, points = 100): Promise<AssetHistoryResponse> {
    const res = await fetch(`${this.baseUrl}/api/history/${encodeURIComponent(symbol)}?points=${points}`);
    if (!res.ok) throw new Error(`History fetch failed: ${res.status}`);
    return res.json();
  }

  async triggerScenario(scenario: ScenarioType): Promise<void> {
    await fetch(`${this.baseUrl}/api/scenario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario }),
    });
  }

  async setStressTest(config: StressTestConfig): Promise<void> {
    await fetch(`${this.baseUrl}/api/stress-test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
  }
}
