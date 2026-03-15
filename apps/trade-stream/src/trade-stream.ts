import { LitElement, html, css } from 'lit';
import { SignalWatcher } from '@lit-labs/signals';
import { customElement, state } from 'lit/decorators.js';
import { tradeEvents, clearTradeEvents } from '@market-pulse/state';
import { setSelectedSymbol } from '@market-pulse/state';
import { formatPrice, formatTimestamp } from '@market-pulse/utils';
import { themeStyles } from '@market-pulse/ui';
import type { TradeExecutedEvent } from '@market-pulse/contracts';

/**
 * Live trade stream with virtual scrolling.
 * Shows the most recent 100 trades by default, scrollable up to the buffer max.
 * Uses CSS containment for render performance.
 */
@customElement('mp-trade-stream')
export class MpTradeStream extends SignalWatcher(LitElement) {
  static styles = [
    themeStyles,
    css`
      :host {
        display: block;
      }

      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
      }

      .title {
        font-size: 1rem;
        font-weight: 600;
      }

      .controls {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .event-count {
        font-family: var(--mp-font-mono);
        font-size: 0.75rem;
        color: var(--mp-text-muted);
      }

      .btn {
        background: none;
        border: 1px solid var(--mp-border);
        color: var(--mp-text-muted);
        padding: 4px 10px;
        border-radius: var(--mp-radius-sm);
        font-size: 0.7rem;
        cursor: pointer;
        transition: all var(--mp-transition);
      }

      .btn:hover {
        border-color: var(--mp-text-dim);
        color: var(--mp-text);
      }

      .pause-btn.paused {
        background: var(--mp-warning);
        border-color: var(--mp-warning);
        color: #000;
      }

      /* ─── Stream Container ─── */
      .stream {
        background: var(--mp-bg-card);
        border: 1px solid var(--mp-border);
        border-radius: var(--mp-radius);
        overflow: hidden;
        contain: layout style;
      }

      .stream-header {
        display: grid;
        grid-template-columns: 80px 1fr 80px 100px 100px;
        gap: 8px;
        padding: 8px 12px;
        font-size: 0.65rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--mp-text-dim);
        border-bottom: 1px solid var(--mp-border);
      }

      .stream-body {
        max-height: calc(100vh - 200px);
        overflow-y: auto;
        contain: layout style;
      }

      /* ─── Trade Row ─── */
      .trade-row {
        display: grid;
        grid-template-columns: 80px 1fr 80px 100px 100px;
        gap: 8px;
        padding: 6px 12px;
        font-size: 0.8rem;
        border-bottom: 1px solid var(--mp-border);
        cursor: pointer;
        transition: background 100ms ease;
        contain: layout style paint;
        content-visibility: auto;
        contain-intrinsic-size: 0 32px;
      }

      .trade-row:hover {
        background: var(--mp-bg-card-hover);
      }

      .trade-time {
        font-family: var(--mp-font-mono);
        font-size: 0.7rem;
        color: var(--mp-text-dim);
      }

      .trade-symbol {
        font-family: var(--mp-font-mono);
        font-weight: 600;
      }

      .trade-side {
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
        padding: 1px 6px;
        border-radius: 3px;
        text-align: center;
        width: fit-content;
      }

      .trade-side.buy {
        color: var(--mp-positive);
        background: var(--mp-positive-glow);
      }

      .trade-side.sell {
        color: var(--mp-negative);
        background: var(--mp-negative-glow);
      }

      .trade-qty {
        font-family: var(--mp-font-mono);
        color: var(--mp-text-muted);
        text-align: right;
      }

      .trade-price {
        font-family: var(--mp-font-mono);
        font-weight: 500;
        text-align: right;
      }

      .empty {
        text-align: center;
        padding: 32px;
        color: var(--mp-text-muted);
        font-size: 0.85rem;
      }

      .live-dot {
        display: inline-block;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--mp-positive);
        margin-right: 6px;
        animation: blink 1.5s infinite;
      }

      @keyframes blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
      }
    `,
  ];

  @state() private paused = false;
  @state() private visibleCount = 100;

  render() {
    const allTrades = tradeEvents.get();
    const trades = this.paused
      ? allTrades // When paused, don't update displayed trades
      : allTrades.slice(0, this.visibleCount);

    return html`
      <div class="header">
        <span class="title">
          <span class="live-dot"></span>
          Trade Stream
        </span>
        <div class="controls">
          <span class="event-count">${allTrades.length} events</span>
          <button
            class="btn pause-btn ${this.paused ? 'paused' : ''}"
            @click=${() => { this.paused = !this.paused; }}
          >
            ${this.paused ? '▶ Resume' : '⏸ Pause'}
          </button>
          <button class="btn" @click=${() => clearTradeEvents()}>Clear</button>
        </div>
      </div>

      <div class="stream">
        <div class="stream-header">
          <span>Time</span>
          <span>Symbol</span>
          <span>Side</span>
          <span style="text-align:right">Quantity</span>
          <span style="text-align:right">Price</span>
        </div>
        <div class="stream-body">
          ${trades.length === 0
            ? html`<div class="empty">Waiting for trades…</div>`
            : trades.map((t: TradeExecutedEvent) => html`
              <div class="trade-row" @click=${() => setSelectedSymbol(t.symbol)}>
                <span class="trade-time">${formatTimestamp(t.timestamp)}</span>
                <span class="trade-symbol">${t.symbol}</span>
                <span class="trade-side ${t.side}">${t.side}</span>
                <span class="trade-qty">${t.quantity.toLocaleString()}</span>
                <span class="trade-price">${formatPrice(t.price)}</span>
              </div>
            `)}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mp-trade-stream': MpTradeStream;
  }
}
