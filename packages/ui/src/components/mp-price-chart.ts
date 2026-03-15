import { LitElement, html, css, svg, nothing } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { themeStyles } from '../theme.js';

export interface ChartPoint {
  price: number;
  timestamp: number;
}

/**
 * Interactive SVG price chart with area fill, grid, crosshair, and tooltip.
 * Renders a time-series of ChartPoint data.
 */
@customElement('mp-price-chart')
export class MpPriceChart extends LitElement {
  static styles = [
    themeStyles,
    css`
      :host {
        display: block;
      }

      .chart-container {
        position: relative;
        width: 100%;
        background: var(--mp-bg);
        border: 1px solid var(--mp-border);
        border-radius: var(--mp-radius);
        overflow: hidden;
      }

      svg {
        display: block;
        width: 100%;
        height: 100%;
      }

      .tooltip {
        position: absolute;
        pointer-events: none;
        background: var(--mp-bg-card);
        border: 1px solid var(--mp-border);
        border-radius: var(--mp-radius-sm);
        padding: 6px 10px;
        font-size: 0.7rem;
        font-family: var(--mp-font-mono);
        color: var(--mp-text);
        white-space: nowrap;
        z-index: 10;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        transition: opacity 100ms ease;
      }

      .tooltip-price {
        font-weight: 700;
        font-size: 0.8rem;
      }

      .tooltip-time {
        color: var(--mp-text-muted);
        font-size: 0.65rem;
        margin-top: 2px;
      }

      .chart-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        border-bottom: 1px solid var(--mp-border);
        background: var(--mp-bg-card);
      }

      .chart-title {
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--mp-text-muted);
      }

      .chart-stats {
        display: flex;
        gap: 12px;
        font-family: var(--mp-font-mono);
        font-size: 0.7rem;
      }

      .stat-label {
        color: var(--mp-text-dim);
      }

      .stat-value {
        font-weight: 600;
      }

      .stat-high { color: var(--mp-positive); }
      .stat-low { color: var(--mp-negative); }
    `,
  ];

  @property({ type: Array }) data: ChartPoint[] = [];
  @property({ type: Number }) width = 600;
  @property({ type: Number }) height = 220;
  @property() label = 'Price';

  private padding = { top: 16, right: 54, bottom: 28, left: 12 };

  @state() private hoverIndex = -1;
  @state() private tooltipX = 0;
  @state() private tooltipY = 0;

  @query('.chart-container') private container!: HTMLElement;

  private get chartWidth() {
    return this.width - this.padding.left - this.padding.right;
  }

  private get chartHeight() {
    return this.height - this.padding.top - this.padding.bottom;
  }

  private getMinMax() {
    if (this.data.length === 0) return { min: 0, max: 1 };
    let min = Infinity, max = -Infinity;
    for (const p of this.data) {
      if (p.price < min) min = p.price;
      if (p.price > max) max = p.price;
    }
    const padding = (max - min) * 0.08 || 1;
    return { min: min - padding, max: max + padding };
  }

  private toX(i: number): number {
    return this.padding.left + (i / Math.max(this.data.length - 1, 1)) * this.chartWidth;
  }

  private toY(price: number): number {
    const { min, max } = this.getMinMax();
    return this.padding.top + this.chartHeight - ((price - min) / (max - min)) * this.chartHeight;
  }

  private handleMouseMove = (e: MouseEvent) => {
    if (this.data.length < 2) return;
    const rect = this.container?.getBoundingClientRect();
    if (!rect) return;

    const scaleX = this.width / rect.width;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const relX = mouseX - this.padding.left;
    const idx = Math.round((relX / this.chartWidth) * (this.data.length - 1));
    const clamped = Math.max(0, Math.min(this.data.length - 1, idx));

    this.hoverIndex = clamped;
    this.tooltipX = e.clientX - rect.left;
    this.tooltipY = e.clientY - rect.top;
  };

  private handleMouseLeave = () => {
    this.hoverIndex = -1;
  };

  render() {
    const pts = this.data;
    if (pts.length < 2) {
      return html`
        <div class="chart-container" style="height: ${this.height}px;">
          <div class="chart-header">
            <span class="chart-title">${this.label}</span>
          </div>
          <div style="display:flex;align-items:center;justify-content:center;height:${this.height - 36}px;color:var(--mp-text-dim);font-size:0.8rem;">
            Waiting for data…
          </div>
        </div>
      `;
    }

    const { min, max } = this.getMinMax();
    const first = pts[0].price;
    const last = pts[pts.length - 1].price;
    const trend = last >= first;
    const lineColor = trend ? 'var(--mp-positive)' : 'var(--mp-negative)';
    const fillColor = trend ? 'rgba(34,197,94,0.10)' : 'rgba(239,68,68,0.10)';

    const highVal = Math.max(...pts.map(p => p.price));
    const lowVal = Math.min(...pts.map(p => p.price));

    // Build path
    const linePts = pts.map((p, i) => `${this.toX(i)},${this.toY(p.price)}`);
    const linePath = `M ${linePts.join(' L ')}`;

    // Area fill path
    const areaPath = `${linePath} L ${this.toX(pts.length - 1)},${this.padding.top + this.chartHeight} L ${this.toX(0)},${this.padding.top + this.chartHeight} Z`;

    // Grid lines (4 horizontal)
    const gridLines = 4;
    const gridYs = Array.from({ length: gridLines }, (_, i) => {
      const frac = (i + 1) / (gridLines + 1);
      return this.padding.top + frac * this.chartHeight;
    });

    // Y-axis labels
    const yLabels = gridYs.map(y => {
      const price = max - ((y - this.padding.top) / this.chartHeight) * (max - min);
      return { y, label: this.formatAxisPrice(price) };
    });

    // X-axis labels (5 evenly spaced)
    const xLabelCount = 5;
    const xLabels = Array.from({ length: xLabelCount }, (_, i) => {
      const idx = Math.round((i / (xLabelCount - 1)) * (pts.length - 1));
      return { x: this.toX(idx), label: this.formatTime(pts[idx].timestamp) };
    });

    // Hover crosshair
    const hoverPt = this.hoverIndex >= 0 ? pts[this.hoverIndex] : null;

    return html`
      <div class="chart-container" style="height: ${this.height + 36}px;">
        <div class="chart-header">
          <span class="chart-title">${this.label}</span>
          <div class="chart-stats">
            <span><span class="stat-label">H </span><span class="stat-value stat-high">${this.formatAxisPrice(highVal)}</span></span>
            <span><span class="stat-label">L </span><span class="stat-value stat-low">${this.formatAxisPrice(lowVal)}</span></span>
            <span><span class="stat-label">Pts </span><span class="stat-value">${pts.length}</span></span>
          </div>
        </div>
        <svg
          viewBox="0 0 ${this.width} ${this.height}"
          preserveAspectRatio="none"
          @mousemove=${this.handleMouseMove}
          @mouseleave=${this.handleMouseLeave}
        >
          <!-- Grid lines -->
          ${gridYs.map(y => svg`
            <line x1="${this.padding.left}" y1="${y}" x2="${this.width - this.padding.right}" y2="${y}"
                  stroke="var(--mp-border)" stroke-width="0.5" stroke-dasharray="4,3" />
          `)}

          <!-- Area fill -->
          ${svg`<path d="${areaPath}" fill="${fillColor}" />`}

          <!-- Price line -->
          ${svg`<path d="${linePath}" fill="none" stroke="${lineColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />`}

          <!-- Y-axis labels -->
          ${yLabels.map(({ y, label }) => svg`
            <text x="${this.width - this.padding.right + 6}" y="${y + 3}"
                  fill="var(--mp-text-dim)" font-size="9" font-family="var(--mp-font-mono)">
              ${label}
            </text>
          `)}

          <!-- X-axis labels -->
          ${xLabels.map(({ x, label }) => svg`
            <text x="${x}" y="${this.height - 4}"
                  fill="var(--mp-text-dim)" font-size="9" font-family="var(--mp-font-mono)"
                  text-anchor="middle">
              ${label}
            </text>
          `)}

          <!-- Crosshair -->
          ${hoverPt ? svg`
            <line x1="${this.toX(this.hoverIndex)}" y1="${this.padding.top}"
                  x2="${this.toX(this.hoverIndex)}" y2="${this.padding.top + this.chartHeight}"
                  stroke="var(--mp-text-dim)" stroke-width="0.5" stroke-dasharray="3,2" />
            <line x1="${this.padding.left}" y1="${this.toY(hoverPt.price)}"
                  x2="${this.width - this.padding.right}" y2="${this.toY(hoverPt.price)}"
                  stroke="var(--mp-text-dim)" stroke-width="0.5" stroke-dasharray="3,2" />
            <circle cx="${this.toX(this.hoverIndex)}" cy="${this.toY(hoverPt.price)}" r="3.5"
                    fill="${lineColor}" stroke="var(--mp-bg)" stroke-width="1.5" />
          ` : nothing}
        </svg>

        <!-- Tooltip -->
        ${hoverPt ? html`
          <div class="tooltip" style="left: ${Math.min(this.tooltipX + 12, (this.container?.offsetWidth ?? this.width) - 120)}px; top: ${Math.max(this.tooltipY - 50, 40)}px;">
            <div class="tooltip-price">${this.formatAxisPrice(hoverPt.price)}</div>
            <div class="tooltip-time">${this.formatFullTime(hoverPt.timestamp)}</div>
          </div>
        ` : nothing}
      </div>
    `;
  }

  private formatAxisPrice(price: number): string {
    if (price >= 1000) return price.toFixed(0);
    if (price >= 1) return price.toFixed(2);
    return price.toFixed(4);
  }

  private formatTime(ts: number): string {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
  }

  private formatFullTime(ts: number): string {
    const d = new Date(ts);
    return d.toLocaleTimeString();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mp-price-chart': MpPriceChart;
  }
}
