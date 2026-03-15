import type { IncomingMessage, ServerResponse } from 'http';
import type { MarketEngine } from './engine.js';

export function handleRestRoutes(
  req: IncomingMessage,
  res: ServerResponse,
  engine: MarketEngine
): void {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const pathname = url.pathname;

  // GET /api/snapshot
  if (req.method === 'GET' && pathname === '/api/snapshot') {
    const assets = engine.getSnapshot();
    sendJSON(res, { assets, timestamp: Date.now() });
    return;
  }

  // GET /api/history/:symbol
  if (req.method === 'GET' && pathname.startsWith('/api/history/')) {
    const symbol = decodeURIComponent(pathname.replace('/api/history/', ''));
    const points = engine.getHistory(symbol);
    sendJSON(res, { symbol, points });
    return;
  }

  // POST /api/scenario
  if (req.method === 'POST' && pathname === '/api/scenario') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { scenario } = JSON.parse(body);
        engine.triggerScenario(scenario);
        sendJSON(res, { ok: true, scenario });
      } catch {
        res.writeHead(400);
        res.end('Invalid JSON');
      }
    });
    return;
  }

  // POST /api/stress-test
  if (req.method === 'POST' && pathname === '/api/stress-test') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const config = JSON.parse(body);
        if (config.enabled) {
          engine.setUpdateConfig(
            config.updateFrequencyMs || 10,
            config.batchSize || 36
          );
        } else {
          engine.setUpdateConfig(100, 10);
        }
        sendJSON(res, { ok: true, config });
      } catch {
        res.writeHead(400);
        res.end('Invalid JSON');
      }
    });
    return;
  }

  // GET /api/health
  if (req.method === 'GET' && pathname === '/api/health') {
    sendJSON(res, { status: 'ok', uptime: process.uptime() });
    return;
  }

  // 404
  res.writeHead(404);
  res.end('Not Found');
}

function sendJSON(res: ServerResponse, data: unknown): void {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}
