import './app-shell';
import { MarketClientManager } from '@market-pulse/market-client';
import { updatePerformanceMetrics } from '@market-pulse/state';

// Initialize market client and connect
const client = new MarketClientManager();

// Store globally for access by components
(window as any).__marketClient = client;

// Remove loading screen and mount app shell
const loading = document.getElementById('loading');
if (loading) loading.remove();

const app = document.createElement('mp-app-shell');
document.body.appendChild(app);

// Initialize (fetch snapshot + connect WebSocket)
client.initialize().catch(console.error);

// Performance metrics collection
let frameCount = 0;
let lastFpsTime = performance.now();

function measurePerformance() {
  frameCount++;
  const now = performance.now();
  if (now - lastFpsTime >= 1000) {
    const fps = Math.round(frameCount * 1000 / (now - lastFpsTime));
    frameCount = 0;
    lastFpsTime = now;

    updatePerformanceMetrics({
      fps,
      domNodeCount: document.querySelectorAll('*').length,
      wsMessagesPerSec: client.wsMessageCount,
      signalUpdatesPerSec: client.signalUpdateCount,
      heapUsedMB: (performance as any).memory
        ? Math.round((performance as any).memory.usedJSHeapSize / 1048576)
        : 0,
    });
    client.resetWsMessageCount();
    client.resetSignalUpdateCount();
  }
  requestAnimationFrame(measurePerformance);
}

requestAnimationFrame(measurePerformance);
