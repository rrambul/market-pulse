import { LitElement, html, css } from 'lit';
import { SignalWatcher } from '@lit-labs/signals';
import { customElement, property, state } from 'lit/decorators.js';
import { getAssetSignal, alerts, isInWatchlist, addToWatchlist, removeFromWatchlist, getPriceHistory } from '@market-pulse/state';
import { formatPrice, formatChange, formatPercent, formatVolume, formatTimestamp } from '@market-pulse/utils';
import { themeStyles } from '@market-pulse/ui';
import '@market-pulse/ui';
import type { AlertTriggeredEvent } from '@market-pulse/contracts';

@customElement('mp-asset-details')
export class MpAssetDetails extends SignalWatcher(LitElement) {
  static styles = [
    themeStyles,
    css`
      :host {
        display: block;
      }

      .detail-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }

      .detail-grid > .full-width {
        grid-column: 1 / -1;
      }

      /* ─── Hero Section ─── */
      .hero {
        background: var(--mp-bg-card);
        border: 1px solid var(--mp-border);
        border-radius: var(--mp-radius);
        padding: 24px;
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
      }

      .hero-left {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .hero-symbol {
        font-family: var(--mp-font-mono);
        font-size: 1.6rem;
        font-weight: 700;
      }

      .hero-name {
        color: var(--mp-text-muted);
        font-size: 0.85rem;
      }

      .hero-type {
        display: inline-block;
        font-size: 0.65rem;
        text-transform: uppercase;
        padding: 2px 8px;
        border-radius: 3px;
        background: var(--mp-bg);
        color: var(--mp-text-muted);
        border: 1px solid var(--mp-border);
        margin-top: 4px;
      }

      .hero-right {
        text-align: right;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 4px;
      }

      .hero-price {
        font-family: var(--mp-font-mono);
        font-size: 2rem;
        font-weight: 700;
      }

      .hero-change {
        font-family: var(--mp-font-mono);
        font-size: 0.9rem;
        font-weight: 500;
        padding: 4px 10px;
        border-radius: var(--mp-radius-sm);
      }

      .hero-change.positive {
        color: var(--mp-positive);
        background: var(--mp-positive-glow);
      }

      .hero-change.negative {
        color: var(--mp-negative);
        background: var(--mp-negative-glow);
      }

      .watchlist-btn {
        margin-top: 8px;
        background: none;
        border: 1px solid var(--mp-border);
        color: var(--mp-text-muted);
        padding: 6px 12px;
        border-radius: var(--mp-radius-sm);
        font-size: 0.75rem;
        cursor: pointer;
        transition: all var(--mp-transition);
      }

      .watchlist-btn:hover {
        border-color: var(--mp-accent);
        color: var(--mp-accent);
      }

      .watchlist-btn.active {
        background: var(--mp-accent-glow);
        border-color: var(--mp-accent);
        color: var(--mp-accent);
      }

      /* ─── Metrics Section ─── */
      .section {
        background: var(--mp-bg-card);
        border: 1px solid var(--mp-border);
        border-radius: var(--mp-radius);
        padding: 16px;
      }

      .section-title {
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--mp-text-muted);
        margin-bottom: 12px;
      }

      .metric-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      .metric {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .metric-label {
        font-size: 0.7rem;
        color: var(--mp-text-dim);
      }

      .metric-value {
        font-family: var(--mp-font-mono);
        font-size: 0.9rem;
        font-weight: 500;
      }

      /* ─── Alert Timeline ─── */
      .alert-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-height: 300px;
        overflow-y: auto;
      }

      .alert-item {
        padding: 8px 12px;
        background: var(--mp-bg);
        border-radius: var(--mp-radius-sm);
        border-left: 3px solid;
        font-size: 0.8rem;
      }

      .alert-item.high {
        border-left-color: var(--mp-negative);
      }

      .alert-item.medium {
        border-left-color: var(--mp-warning);
      }

      .alert-item.low {
        border-left-color: var(--mp-info);
      }

      .alert-time {
        font-family: var(--mp-font-mono);
        font-size: 0.65rem;
        color: var(--mp-text-dim);
      }

      .alert-message {
        color: var(--mp-text-muted);
        margin-top: 2px;
      }

      .empty {
        color: var(--mp-text-dim);
        font-size: 0.8rem;
        padding: 16px;
        text-align: center;
      }
    `,
  ];

  @property() symbol = '';

  render() {
    if (!this.symbol) {
      return html`<div class="empty">Select an asset to view details</div>`;
    }

    const assetSignal = getAssetSignal(this.symbol);
    if (!assetSignal) {
      return html`<div class="empty">Asset not found: ${this.symbol}</div>`;
    }

    const asset = assetSignal.get();
    const inWatchlist = isInWatchlist(this.symbol);
    const changeClass = asset.changePercent >= 0 ? 'positive' : 'negative';

    // Get alerts for this symbol
    const allAlerts = alerts.get();
    const symbolAlerts = allAlerts
      .filter((a: AlertTriggeredEvent) => a.symbol === this.symbol)
      .slice(0, 20);

    return html`
      <div class="detail-grid">
        <!-- Hero -->
        <div class="hero full-width">
          <div class="hero-left">
            <div class="hero-symbol">${asset.symbol}</div>
            <div class="hero-name">${asset.name}</div>
            <span class="hero-type">${asset.type}</span>
          </div>
          <div class="hero-right">
            <div class="hero-price">${formatPrice(asset.price)}</div>
            <div class="hero-change ${changeClass}">
              ${formatChange(asset.change)} (${formatPercent(asset.changePercent)})
            </div>
            <button
              class="watchlist-btn ${inWatchlist ? 'active' : ''}"
              @click=${() => inWatchlist ? removeFromWatchlist(asset.symbol) : addToWatchlist(asset.symbol)}
            >
              ${inWatchlist ? '★ In Watchlist' : '☆ Add to Watchlist'}
            </button>
          </div>
        </div>

        <!-- Price Chart -->
        <div class="full-width">
          <mp-price-chart
            .data=${getPriceHistory(this.symbol).get().map(p => ({ price: p.price, timestamp: p.timestamp }))}
            label="${asset.symbol} Price"
            .height=${240}
          ></mp-price-chart>
        </div>

        <!-- Price Metrics -->
        <div class="section">
          <div class="section-title">Price Metrics</div>
          <div class="metric-grid">
            <div class="metric">
              <span class="metric-label">Open</span>
              <span class="metric-value">${formatPrice(asset.open)}</span>
            </div>
            <div class="metric">
              <span class="metric-label">Previous</span>
              <span class="metric-value">${formatPrice(asset.previousPrice)}</span>
            </div>
            <div class="metric">
              <span class="metric-label">High</span>
              <span class="metric-value" style="color: var(--mp-positive)">${formatPrice(asset.high)}</span>
            </div>
            <div class="metric">
              <span class="metric-label">Low</span>
              <span class="metric-value" style="color: var(--mp-negative)">${formatPrice(asset.low)}</span>
            </div>
            <div class="metric">
              <span class="metric-label">Volume</span>
              <span class="metric-value">${formatVolume(asset.volume)}</span>
            </div>
            <div class="metric">
              <span class="metric-label">Volatility</span>
              <span class="metric-value">${asset.volatility}</span>
            </div>
          </div>
        </div>

        <!-- Recent Alerts -->
        <div class="section">
          <div class="section-title">Recent Alerts (${symbolAlerts.length})</div>
          ${symbolAlerts.length === 0
            ? html`<div class="empty">No alerts for this asset</div>`
            : html`
              <div class="alert-list">
                ${symbolAlerts.map(
                  (alert: AlertTriggeredEvent) => html`
                    <div class="alert-item ${alert.severity}">
                      <div class="alert-time">${formatTimestamp(alert.timestamp)}</div>
                      <div class="alert-message">${alert.message}</div>
                    </div>
                  `
                )}
              </div>
            `
          }
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mp-asset-details': MpAssetDetails;
  }
}
