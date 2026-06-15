import { describe, it, expect, vi, afterEach } from 'vitest';
import { getPriceHistory, recordPrice, seedPriceHistory } from '@market-pulse/state';

afterEach(() => vi.restoreAllMocks());

describe('price-history', () => {
  it('getPriceHistory creates one signal per symbol and reuses it', () => {
    const a = getPriceHistory('SYM1');
    const b = getPriceHistory('SYM1');
    expect(a).toBe(b);
    expect(a.get()).toEqual([]);
  });

  it('recordPrice appends points with the supplied timestamp', () => {
    recordPrice('SYM2', 10, 1000);
    recordPrice('SYM2', 11, 2000);
    expect(getPriceHistory('SYM2').get()).toEqual([
      { price: 10, timestamp: 1000 },
      { price: 11, timestamp: 2000 },
    ]);
  });

  it('recordPrice falls back to Date.now when no timestamp is given', () => {
    vi.spyOn(Date, 'now').mockReturnValue(42);
    recordPrice('SYM3', 5);
    expect(getPriceHistory('SYM3').get()).toEqual([{ price: 5, timestamp: 42 }]);
  });

  it('recordPrice caps history at 200 points, dropping the oldest', () => {
    for (let i = 0; i < 250; i++) recordPrice('SYM4', i, i);
    const hist = getPriceHistory('SYM4').get();
    expect(hist).toHaveLength(200);
    expect(hist[0].price).toBe(50); // first 50 dropped
    expect(hist[hist.length - 1].price).toBe(249);
  });

  it('seedPriceHistory replaces history and trims overflow to the newest 200', () => {
    seedPriceHistory('SYM5', [
      { price: 1, timestamp: 1 },
      { price: 2, timestamp: 2 },
    ]);
    expect(getPriceHistory('SYM5').get()).toHaveLength(2);

    const big = Array.from({ length: 300 }, (_, i) => ({ price: i, timestamp: i }));
    seedPriceHistory('SYM6', big);
    const seeded = getPriceHistory('SYM6').get();
    expect(seeded).toHaveLength(200);
    expect(seeded[0].price).toBe(100); // kept the last 200
  });
});
