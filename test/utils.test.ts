import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  formatPrice,
  formatChange,
  formatPercent,
  formatVolume,
  formatTimestamp,
  formatCompactNumber,
} from '@market-pulse/utils';
import { clamp, round, randomBetween, randomGaussian } from '@market-pulse/utils';
import { debounce, throttle, createRAFBatcher } from '@market-pulse/utils';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('formatters', () => {
  it('formatPrice scales precision with magnitude', () => {
    expect(formatPrice(0.005)).toBe('0.005000'); // < 0.01 → 6 dp
    expect(formatPrice(0.5)).toBe('0.5000'); // < 1 → 4 dp
    expect(formatPrice(1234.5)).toBe('1,234.50'); // grouped, 2 dp
  });

  it('formatChange carries sign and scales precision', () => {
    expect(formatChange(0.005)).toBe('+0.005000');
    expect(formatChange(0.5)).toBe('+0.5000');
    expect(formatChange(-12.5)).toBe('-12.50');
  });

  it('formatPercent always signs', () => {
    expect(formatPercent(2.5)).toBe('+2.50%');
    expect(formatPercent(-1)).toBe('-1.00%');
  });

  it('formatVolume applies K/M/B suffixes', () => {
    expect(formatVolume(42)).toBe('42');
    expect(formatVolume(1500)).toBe('1.5K');
    expect(formatVolume(2_000_000)).toBe('2.00M');
    expect(formatVolume(3_000_000_000)).toBe('3.00B');
  });

  it('formatTimestamp renders HH:MM:SS.mmm zero-padded', () => {
    const ts = new Date(2024, 0, 1, 4, 3, 2, 5).getTime();
    expect(formatTimestamp(ts)).toBe('04:03:02.005');
  });

  it('formatCompactNumber uses compact notation', () => {
    expect(formatCompactNumber(1500)).toBe('1.5K');
  });
});

describe('math', () => {
  it('clamp bounds both ends', () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-2, 0, 3)).toBe(0);
    expect(clamp(2, 0, 3)).toBe(2);
  });

  it('round to N decimals', () => {
    expect(round(1.23456, 2)).toBe(1.23);
    expect(round(1.0, 0)).toBe(1);
  });

  it('randomBetween stays within range', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    expect(randomBetween(10, 20)).toBe(15);
  });

  it('randomGaussian applies mean and stddev', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const z = randomGaussian(0, 1);
    expect(Number.isFinite(z)).toBe(true);
    const shifted = randomGaussian(100, 0);
    expect(shifted).toBe(100); // stddev 0 collapses to mean
  });
});

describe('debounce', () => {
  it('fires once with the latest args after the quiet window', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const d = debounce(fn, 100);
    d('a');
    d('b');
    vi.advanceTimersByTime(99);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('b');
  });
});

describe('throttle', () => {
  it('runs immediately then suppresses until the interval elapses', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const t = throttle(fn, 100);
    t('a');
    t('b');
    expect(fn).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(100);
    t('c');
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith('c');
  });
});

describe('createRAFBatcher', () => {
  function installRaf() {
    let id = 0;
    const cbs = new Map<number, FrameRequestCallback>();
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      const i = ++id;
      cbs.set(i, cb);
      return i;
    });
    vi.stubGlobal('cancelAnimationFrame', (i: number) => cbs.delete(i));
    return () => {
      for (const [i, cb] of [...cbs.entries()]) {
        cbs.delete(i);
        cb(0);
      }
    };
  }

  it('coalesces items and flushes them once per frame', () => {
    const flushFrame = installRaf();
    const onFlush = vi.fn();
    const batcher = createRAFBatcher<number>(onFlush);

    batcher.add(1);
    batcher.add(2);
    flushFrame();
    expect(onFlush).toHaveBeenCalledTimes(1);
    expect(onFlush).toHaveBeenCalledWith([1, 2]);

    // empty frame → no flush call
    flushFrame();
    expect(onFlush).toHaveBeenCalledTimes(1);

    batcher.add(3);
    flushFrame();
    expect(onFlush).toHaveBeenLastCalledWith([3]);

    batcher.destroy();
  });

  it('destroy stops further flushes', () => {
    const flushFrame = installRaf();
    const onFlush = vi.fn();
    const batcher = createRAFBatcher<number>(onFlush);
    batcher.add(1);
    batcher.destroy();
    flushFrame();
    expect(onFlush).not.toHaveBeenCalled();
  });
});
