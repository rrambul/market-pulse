import { describe, it, expect } from 'vitest';
import '@market-pulse/ui';
import type { MpPriceChart } from '@market-pulse/ui';
import type { ChartPoint } from '@market-pulse/ui';

async function mount(data: ChartPoint[]): Promise<MpPriceChart> {
  const el = document.createElement('mp-price-chart') as MpPriceChart;
  el.data = data;
  el.width = 600;
  el.height = 220;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

const series = (n: number): ChartPoint[] =>
  Array.from({ length: n }, (_, i) => ({ price: 100 + i, timestamp: 1000 + i * 1000 }));

describe('mp-price-chart', () => {
  it('shows a waiting state with fewer than 2 points', async () => {
    const el = await mount([{ price: 1, timestamp: 0 }]);
    expect(el.shadowRoot!.textContent).toContain('Waiting for data');
  });

  it('renders paths, grid lines, axis labels and a points stat', async () => {
    const el = await mount(series(10));
    const root = el.shadowRoot!;
    expect(root.querySelectorAll('path').length).toBe(2); // area + line
    expect(root.querySelectorAll('line').length).toBeGreaterThanOrEqual(4); // grid
    expect(root.querySelectorAll('text').length).toBeGreaterThan(0); // axis labels
    expect(root.textContent).toContain('Pts');
  });

  it('shows a crosshair and tooltip on hover and hides them on leave', async () => {
    const el = await mount(series(10));
    const container = el.shadowRoot!.querySelector('.chart-container') as HTMLElement;
    container.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 600, height: 220 }) as DOMRect;

    (el as unknown as { handleMouseMove: (e: MouseEvent) => void }).handleMouseMove({
      clientX: 300,
      clientY: 100,
    } as MouseEvent);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('circle')).toBeTruthy();
    expect(el.shadowRoot!.querySelector('.tooltip')).toBeTruthy();

    (el as unknown as { handleMouseLeave: () => void }).handleMouseLeave();
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.tooltip')).toBeNull();
  });

  it('formats axis prices by magnitude', async () => {
    const el = await mount(series(3));
    const fmt = (el as unknown as { formatAxisPrice: (p: number) => string }).formatAxisPrice;
    expect(fmt.call(el, 1500)).toBe('1500');
    expect(fmt.call(el, 50)).toBe('50.00');
    expect(fmt.call(el, 0.5)).toBe('0.5000');
  });

  it('getMinMax pads a real series and defaults on empty data', async () => {
    const el = await mount(series(5));
    const getMinMax = (el as unknown as { getMinMax: () => { min: number; max: number } }).getMinMax;
    const ranged = getMinMax.call(el);
    expect(ranged.min).toBeLessThan(100);
    expect(ranged.max).toBeGreaterThan(104);

    el.data = [];
    expect(getMinMax.call(el)).toEqual({ min: 0, max: 1 });
  });
});
