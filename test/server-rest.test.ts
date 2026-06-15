import { describe, it, expect, vi } from 'vitest';
import { EventEmitter } from 'node:events';
import { MarketEngine } from '../server/market-simulator/src/engine';
import { handleRestRoutes } from '../server/market-simulator/src/rest';

function mkReq(method: string, url: string) {
  const req = new EventEmitter() as EventEmitter & { method: string; url: string; headers: Record<string, string> };
  req.method = method;
  req.url = url;
  req.headers = { host: 'localhost' };
  return req;
}

function mkRes() {
  const res = {
    statusCode: 0,
    body: '',
    writeHead: vi.fn(function (this: { statusCode: number }, code: number) {
      this.statusCode = code;
    }),
    setHeader: vi.fn(),
    end: vi.fn(function (this: { body: string }, b?: string) {
      this.body = b ?? '';
    }),
  };
  return res;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function route(engine: MarketEngine, method: string, url: string, body?: unknown) {
  const req = mkReq(method, url);
  const res = mkRes();
  handleRestRoutes(req as never, res as never, engine);
  if (body !== undefined) {
    req.emit('data', JSON.stringify(body));
    req.emit('end');
  }
  return res;
}

describe('handleRestRoutes', () => {
  it('GET /api/snapshot returns assets', () => {
    const res = route(new MarketEngine(), 'GET', '/api/snapshot');
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).assets.length).toBeGreaterThan(0);
  });

  it('GET /api/history/:symbol returns the symbol history', () => {
    const engine = new MarketEngine();
    const sym = engine.getSnapshot()[0].symbol;
    const res = route(engine, 'GET', `/api/history/${encodeURIComponent(sym)}`);
    const json = JSON.parse(res.body);
    expect(json.symbol).toBe(sym);
    expect(Array.isArray(json.points)).toBe(true);
  });

  it('GET /api/health reports ok', () => {
    const res = route(new MarketEngine(), 'GET', '/api/health');
    expect(JSON.parse(res.body).status).toBe('ok');
  });

  it('POST /api/scenario triggers the scenario', () => {
    const engine = new MarketEngine();
    const spy = vi.spyOn(engine, 'triggerScenario');
    const res = route(engine, 'POST', '/api/scenario', { scenario: 'flash-crash' });
    expect(spy).toHaveBeenCalledWith('flash-crash');
    expect(JSON.parse(res.body)).toMatchObject({ ok: true });
  });

  it('POST /api/scenario with invalid JSON responds 400', () => {
    const engine = new MarketEngine();
    const req = mkReq('POST', '/api/scenario');
    const res = mkRes();
    handleRestRoutes(req as never, res as never, engine);
    req.emit('data', '{ broken');
    req.emit('end');
    expect(res.statusCode).toBe(400);
  });

  it('POST /api/stress-test enabled applies the stress profile', () => {
    const engine = new MarketEngine();
    const spy = vi.spyOn(engine, 'setUpdateConfig');
    route(engine, 'POST', '/api/stress-test', { enabled: true });
    expect(spy).toHaveBeenCalledWith(10, 36);
  });

  it('POST /api/stress-test disabled applies the normal profile', () => {
    const engine = new MarketEngine();
    const spy = vi.spyOn(engine, 'setUpdateConfig');
    route(engine, 'POST', '/api/stress-test', { enabled: false });
    expect(spy).toHaveBeenCalledWith(100, 10);
  });

  it('POST /api/stress-test clamps out-of-range values to the safe bounds', () => {
    const engine = new MarketEngine();
    const spy = vi.spyOn(engine, 'setUpdateConfig');
    route(engine, 'POST', '/api/stress-test', { enabled: true, updateFrequencyMs: 0, batchSize: 99999 });
    expect(spy).toHaveBeenCalledWith(10, 200); // min freq, max batch
  });

  it('POST /api/stress-test with invalid JSON responds 400', () => {
    const engine = new MarketEngine();
    const req = mkReq('POST', '/api/stress-test');
    const res = mkRes();
    handleRestRoutes(req as never, res as never, engine);
    req.emit('data', 'nonsense{');
    req.emit('end');
    expect(res.statusCode).toBe(400);
  });

  it('unknown routes respond 404', () => {
    const res = route(new MarketEngine(), 'GET', '/api/nope');
    expect(res.statusCode).toBe(404);
  });
});
