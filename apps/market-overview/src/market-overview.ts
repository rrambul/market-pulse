import { LitElement, html, css } from 'lit';
import { SignalWatcher } from '@lit-labs/signals';
import { customElement } from 'lit/decorators.js';
import {
  topGainers,
  topLosers,
  marketBreadth,
  assetsByType,
  totalAlertCount,
  getPriceHistory,
} from '@market-pulse/state';
import { setSelectedSymbol } from '@market-pulse/state';
import { formatPrice, formatPercent, formatVolume } from '@market-pulse/utils';
import { themeStyles } from '@market-pulse/ui';
import '@market-pulse/ui';
import type { Asset } from '@market-pulse/contracts';

@customElement('mp-market-overview')
export class MpMarketOverview extends SignalWatcher(LitElement) {
  static styles = [
    themeStyles,
    css`
      :host {
        display: block;
      }

      .grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-template-rows: auto auto auto;
        gap: 16px;
        height: 100%;
      }

      .kpi-row {
        grid-column: 1 / -1;
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }

      .kpi-card {
        background: var(--mp-bg-card);
        border: 1px solid var(--mp-border);
        border-radius: var(--mp-radius);
        padding: 12px 16px;
        flex: 1;
        min-width: 140px;
      }

      .kpi-label {
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--mp-text-muted);
        margin-bottom: 4px;
      }

      .kpi-value {
        font-family: var(--mp-font-mono);
        font-size: 1.4rem;
        font-weight: 700;
      }

      .kpi-value.positive { color: var(--mp-positive); }
      .kpi-value.negative { color: var(--mp-negative); }
      .kpi-value.neutral { color: var(--mp-text); }
      .kpi-value.warning { color: var(--mp-warning); }

      /* ─── Section Card ─── */
      .section {
        background: var(--mp-bg-card);
        border: 1px solid var(--mp-border);
        border-radius: var(--mp-radius);
        padding: 16px;
        overflow: hidden;
      }

      .section-title {
        font-size: 0.8rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--mp-text-muted);
        margin-bottom: 12px;
      }

      /* ─── Asset Table ─── */
      .asset-table {
        width: 100%;
        border-collapse: collapse;
      }

      .asset-table th {
        font-size: 0.65rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--mp-text-dim);
        text-align: left;
        padding: 4px 8px;
        border-bottom: 1px solid var(--mp-border);
      }

      .asset-table th:last-child,
      .asset-table td:last-child {
        text-align: right;
      }

      .asset-table td {
        padding: 6px 8px;
        font-size: 0.8rem;
        border-bottom: 1px solid var(--mp-border);
      }

      .asset-table tr {
        cursor: pointer;
        transition: background var(--mp-transition);
      }

      .asset-table tr:hover {
        background: var(--mp-bg-card-hover);
      }

      .symbol {
        font-family: var(--mp-font-mono);
        font-weight: 600;
        color: var(--mp-text);
      }

      .name {
        color: var(--mp-text-muted);
        font-size: 0.7rem;
      }

      .price {
        font-family: var(--mp-font-mono);
        font-weight: 500;
      }

      .change {
        font-family: var(--mp-font-mono);
        font-weight: 500;
        font-size: 0.8rem;
      }

      .change.positive { color: var(--mp-positive); }
      .change.negative { color: var(--mp-negative); }

      /* ─── Breadth Bar ─── */
      .breadth-bar {
        display: flex;
        height: 8px;
        border-radius: 4px;
        overflow: hidden;
        margin-top: 8px;
      }

      .breadth-segment {
        transition: width 300ms ease;
      }

      .breadth-segment.adv { background: var(--mp-positive); }
      .breadth-segment.unch { background: var(--mp-text-dim); }
      .breadth-segment.dec { background: var(--mp-negative); }

      .breadth-legend {
        display: flex;
        justify-content: space-between;
        margin-top: 6px;
        font-size: 0.7rem;
        color: var(--mp-text-muted);
      }

      /* ─── Type breakdown ─── */
      .type-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }

      .type-card {
        padding: 8px 12px;
        background: var(--mp-bg);
        border-radius: var(--mp-radius-sm);
        border: 1px solid var(--mp-border);
      }

      .type-label {
        font-size: 0.7rem;
        text-transform: uppercase;
        color: var(--mp-text-muted);
        margin-bottom: 2px;
      }

      .type-count {
        font-family: var(--mp-font-mono);
        font-weight: 600;
        font-size: 1rem;
      }
    `,
  ];

  private selectAsset(symbol: string) {
    setSelectedSymbol(symbol);
  }

  render() {
    const gainers = topGainers.get();
    const losers = topLosers.get();
    const breadth = marketBreadth.get();
    const byType = assetsByType.get();
    const alertsCount = totalAlertCount.get();

    const totalAssets = breadth.advancers + breadth.decliners + breadth.unchanged;
    const advPct = totalAssets ? (breadth.advancers / totalAssets) * 100 : 0;
    const unchPct = totalAssets ? (breadth.unchanged / totalAssets) * 100 : 0;
    const decPct = totalAssets ? (breadth.decliners / totalAssets) * 100 : 0;

    return html`
      <div class="grid">
        <!-- KPI Row -->
        <div class="kpi-row">
          <div class="kpi-card">
            <div class="kpi-label">Total Assets</div>
            <div class="kpi-value neutral">${totalAssets}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Advancers</div>
            <div class="kpi-value positive">${breadth.advancers}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Decliners</div>
            <div class="kpi-value negative">${breadth.decliners}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Breadth Ratio</div>
            <div class="kpi-value ${breadth.breadthRatio > 0.5 ? 'positive' : 'negative'}">
              ${(breadth.breadthRatio * 100).toFixed(1)}%
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Active Alerts</div>
            <div class="kpi-value ${alertsCount > 10 ? 'warning' : 'neutral'}">${alertsCount}</div>
          </div>
        </div>

        <!-- Top Gainers -->
        <div class="section">
          <div class="section-title">▲ Top Gainers</div>
          ${this.renderAssetTable(gainers)}
        </div>

        <!-- Top Losers -->
        <div class="section">
          <div class="section-title">▼ Top Losers</div>
          ${this.renderAssetTable(losers)}
        </div>

        <!-- Market Breadth -->
        <div class="section">
          <div class="section-title">Market Breadth</div>
          <div class="breadth-bar">
            <div class="breadth-segment adv" style="width: ${advPct}%"></div>
            <div class="breadth-segment unch" style="width: ${unchPct}%"></div>
            <div class="breadth-segment dec" style="width: ${decPct}%"></div>
          </div>
          <div class="breadth-legend">
            <span>▲ ${breadth.advancers} adv</span>
            <span>— ${breadth.unchanged} unch</span>
            <span>▼ ${breadth.decliners} dec</span>
          </div>

          <div class="type-grid" style="margin-top: 16px;">
            ${Object.entries(byType).map(
              ([type, assets]) => html`
                <div class="type-card">
                  <div class="type-label">${type}</div>
                  <div class="type-count">${assets.length}</div>
                </div>
              `
            )}
          </div>
        </div>

        <!-- Volatility Overview -->
        <div class="section">
          <div class="section-title">Volatility Distribution</div>
          ${this.renderVolatilityBreakdown()}
        </div>
      </div>
    `;
  }

  private renderAssetTable(assets: Asset[]) {
    return html`
      <table class="asset-table">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Chart</th>
            <th>Price</th>
            <th>Change</th>
            <th>Volume</th>
          </tr>
        </thead>
        <tbody>
          ${assets.map(
            (a) => html`
              <tr @click=${() => this.selectAsset(a.symbol)}>
                <td>
                  <div class="symbol">${a.symbol}</div>
                  <div class="name">${a.name}</div>
                </td>
                <td>
                  <mp-mini-chart
                    .data=${getPriceHistory(a.symbol).get().map(p => p.price)}
                    .width=${80}
                    .height=${28}
                  ></mp-mini-chart>
                </td>
                <td class="price">${formatPrice(a.price)}</td>
                <td class="change ${a.changePercent >= 0 ? 'positive' : 'negative'}">
                  ${formatPercent(a.changePercent)}
                </td>
                <td>${formatVolume(a.volume)}</td>
              </tr>
            `
          )}
        </tbody>
      </table>
    `;
  }

  private renderVolatilityBreakdown() {
    const byType = assetsByType.get();
    const allAssets = Object.values(byType).flat();
    const high = allAssets.filter(a => a.volatility === 'high').length;
    const medium = allAssets.filter(a => a.volatility === 'medium').length;
    const low = allAssets.filter(a => a.volatility === 'low').length;

    return html`
      <div class="type-grid">
        <div class="type-card">
          <div class="type-label" style="color: var(--mp-negative)">High</div>
          <div class="type-count">${high}</div>
        </div>
        <div class="type-card">
          <div class="type-label" style="color: var(--mp-warning)">Medium</div>
          <div class="type-count">${medium}</div>
        </div>
        <div class="type-card">
          <div class="type-label" style="color: var(--mp-positive)">Low</div>
          <div class="type-count">${low}</div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mp-market-overview': MpMarketOverview;
  }
}
