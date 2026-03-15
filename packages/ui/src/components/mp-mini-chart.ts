import { LitElement, html, css, svg, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { themeStyles } from '../theme.js';

export interface MiniChartPoint {
  value: number;
  timestamp: number;
}

/**
 * Mini area chart for embedding in cards and table rows.
 * Compact, no axes — just the shape + area fill.
 */
@customElement('mp-mini-chart')
export class MpMiniChart extends LitElement {
  static styles = [
    themeStyles,
    css`
      :host {
        display: inline-block;
      }
      .wrapper {
        position: relative;
      }
      svg {
        display: block;
        overflow: visible;
      }
    `,
  ];

  @property({ type: Array }) data: number[] = [];
  @property({ type: Number }) width = 100;
  @property({ type: Number }) height = 32;

  render() {
    if (this.data.length < 2) {
      return html`<svg width="${this.width}" height="${this.height}"></svg>`;
    }

    const pad = 1;
    const w = this.width - pad * 2;
    const h = this.height - pad * 2;

    let min = Infinity, max = -Infinity;
    for (const v of this.data) {
      if (v < min) min = v;
      if (v > max) max = v;
    }
    const range = max - min || 1;

    const points = this.data.map((v, i) => {
      const x = pad + (i / (this.data.length - 1)) * w;
      const y = pad + h - ((v - min) / range) * h;
      return { x, y };
    });

    const linePath = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
    const areaPath = `${linePath} L ${points[points.length - 1].x},${pad + h} L ${points[0].x},${pad + h} Z`;

    const trend = this.data[this.data.length - 1] >= this.data[0];
    const lineColor = trend ? 'var(--mp-positive)' : 'var(--mp-negative)';
    const fillColor = trend ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)';

    return html`
      <svg width="${this.width}" height="${this.height}" viewBox="0 0 ${this.width} ${this.height}">
        ${svg`<path d="${areaPath}" fill="${fillColor}" />`}
        ${svg`<path d="${linePath}" fill="none" stroke="${lineColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />`}
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mp-mini-chart': MpMiniChart;
  }
}
