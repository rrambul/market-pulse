import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { MarketEngine } from './engine.js';
import { handleRestRoutes } from './rest.js';

const PORT = Number(process.env.PORT) || 4000;

const engine = new MarketEngine();
const httpServer = createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  handleRestRoutes(req, res, engine);
});

const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

wss.on('connection', (ws) => {
  console.log(`[WS] Client connected (total: ${wss.clients.size})`);

  // Send initial snapshot
  const snapshot = JSON.stringify({
    type: 'SNAPSHOT',
    assets: engine.getSnapshot(),
    timestamp: Date.now(),
  });
  ws.send(snapshot);

  ws.on('close', () => {
    console.log(`[WS] Client disconnected (total: ${wss.clients.size})`);
  });
});

// Engine broadcasts events to all connected clients
engine.onBatch((events) => {
  if (wss.clients.size === 0) return;

  const message = JSON.stringify({
    type: 'BATCH',
    events,
    timestamp: Date.now(),
  });

  for (const client of wss.clients) {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(message);
    }
  }
});

engine.start();

httpServer.listen(PORT, () => {
  console.log(`\n🚀 MarketPulse Simulator running on port ${PORT}`);
  console.log(`   REST:      http://localhost:${PORT}/api/snapshot`);
  console.log(`   WebSocket: ws://localhost:${PORT}/ws`);
  console.log(`   Assets:    ${engine.getSnapshot().length}`);
  console.log('');
});
