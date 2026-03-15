import { LitElement, html, css, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { themeStyles } from '../theme.js';

/**
 * Mini sparkline chart rendered as SVG.
 * Accepts an array of numbers to plot.
 */
@customElement('mp-sparkline')
export class MpSparkline extends LitElement {
  static styles = [
    themeStyles,
    css`
      :host {
        display: inline-block;
      }
      svg {
        overflow: visible;
      }
    `,
  ];

  @property({ type: Array }) data: number[] = [];
  @property({ type: Number }) width = 80;
  @property({ type: Number }) height = 24;
  @property() color = 'var(--mp-info)';

  render() {
    if (this.data.length < 2) return html`<svg width="${this.width}" height="${this.height}"></svg>`;

    const min = Math.min(...this.data);
    const max = Math.max(...this.data);
    const range = max - min || 1;
    const padding = 2;
    const h = this.height - padding * 2;
    const w = this.width - padding * 2;

    const points = this.data.map((v, i) => {
      const x = padding + (i / (this.data.length - 1)) * w;
      const y = padding + h - ((v - min) / range) * h;
      return `${x},${y}`;
    });

    const pathData = `M ${points.join(' L ')}`;

    // Determine color from trend
    const trend = this.data[this.data.length - 1] >= this.data[0];
    const lineColor = trend ? 'var(--mp-positive)' : 'var(--mp-negative)';

    return html`
      <svg width="${this.width}" height="${this.height}" viewBox="0 0 ${this.width} ${this.height}">
        ${svg`<path d="${pathData}" fill="none" stroke="${lineColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />`}
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mp-sparkline': MpSparkline;
  }
}
