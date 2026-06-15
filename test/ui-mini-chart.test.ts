import { describe, it, expect } from 'vitest';
import '@market-pulse/ui';
import type { MpMiniChart } from '@market-pulse/ui';

async function mount(data: number[], width = 100, height = 32): Promise<MpMiniChart> {
  const el = document.createElement('mp-mini-chart') as MpMiniChart;
  el.data = data;
  el.width = width;
  el.height = height;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

describe('mp-mini-chart', () => {
  it('renders an empty svg when there are fewer than 2 points', async () => {
    const el = await mount([5]);
    const svg = el.shadowRoot!.querySelector('svg')!;
    expect(svg).toBeTruthy();
    expect(svg.querySelector('path')).toBeNull();
  });

  it('draws a line + area path for a series', async () => {
    const el = await mount([1, 2, 3, 4]);
    const paths = el.shadowRoot!.querySelectorAll('path');
    expect(paths.length).toBe(2); // area + line
    expect(paths[1].getAttribute('d')!.startsWith('M ')).toBe(true);
  });

  it('uses the positive color when the series trends up', async () => {
    const el = await mount([1, 5]);
    const line = el.shadowRoot!.querySelectorAll('path')[1];
    expect(line.getAttribute('stroke')).toContain('positive');
  });

  it('uses the negative color when the series trends down', async () => {
    const el = await mount([5, 1]);
    const line = el.shadowRoot!.querySelectorAll('path')[1];
    expect(line.getAttribute('stroke')).toContain('negative');
  });
});
