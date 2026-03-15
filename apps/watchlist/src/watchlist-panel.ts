import { LitElement, html, css } from 'lit';
import { SignalWatcher } from '@lit-labs/signals';
import { customElement, state } from 'lit/decorators.js';
import {
  watchlistAssets,
  removeFromWatchlist,
  addToWatchlist,
  watchlistSymbols,
  assetStore,
} from '@market-pulse/state';
import { setSelectedSymbol } from '@market-pulse/state';
import { formatPrice, formatPercent, formatVolume } from '@market-pulse/utils';
import { themeStyles } from '@market-pulse/ui';

type SortField = 'symbol' | 'price' | 'changePercent' | 'volume';
type SortDir = 'asc' | 'desc';

@customElement('mp-watchlist-panel')
export class MpWatchlistPanel extends SignalWatcher(LitElement) {
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
        margin-bottom: 16px;
      }

      .title {
        font-size: 1rem;
        font-weight: 600;
      }

      .add-form {
        display: flex;
        gap: 8px;
      }

      .add-form input {
        background: var(--mp-bg);
        border: 1px solid var(--mp-border);
        border-radius: var(--mp-radius-sm);
        color: var(--mp-text);
        font-family: var(--mp-font-mono);
        padding: 6px 10px;
        font-size: 0.8rem;
        width: 120px;
        outline: none;
      }

      .add-form input:focus {
        border-color: var(--mp-border-active);
      }

      .add-form input::placeholder {
        color: var(--mp-text-dim);
      }

      .btn {
        background: var(--mp-accent);
        color: white;
        border: none;
        border-radius: var(--mp-radius-sm);
        padding: 6px 12px;
        font-size: 0.75rem;
        font-weight: 600;
        cursor: pointer;
        transition: opacity var(--mp-transition);
      }

      .btn:hover {
        opacity: 0.85;
      }

      .btn-remove {
        background: none;
        border: none;
        color: var(--mp-text-dim);
        cursor: pointer;
        font-size: 1rem;
        padding: 2px 6px;
        border-radius: var(--mp-radius-sm);
        transition: all var(--mp-transition);
      }

      .btn-remove:hover {
        color: var(--mp-negative);
        background: var(--mp-negative-glow);
      }

      /* ─── Table ─── */
      .table-container {
        background: var(--mp-bg-card);
        border: 1px solid var(--mp-border);
        border-radius: var(--mp-radius);
        overflow: hidden;
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      th {
        font-size: 0.65rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--mp-text-dim);
        text-align: left;
        padding: 10px 12px;
        border-bottom: 1px solid var(--mp-border);
        cursor: pointer;
        user-select: none;
        transition: color var(--mp-transition);
      }

      th:hover {
        color: var(--mp-text);
      }

      th.sorted {
        color: var(--mp-accent);
      }

      td {
        padding: 10px 12px;
        font-size: 0.85rem;
        border-bottom: 1px solid var(--mp-border);
      }

      tr {
        cursor: pointer;
        transition: background var(--mp-transition);
      }

      tr:hover {
        background: var(--mp-bg-card-hover);
      }

      .symbol-cell {
        font-family: var(--mp-font-mono);
        font-weight: 600;
      }

      .name-cell {
        color: var(--mp-text-muted);
        font-size: 0.7rem;
      }

      .price-cell {
        font-family: var(--mp-font-mono);
        font-weight: 500;
      }

      .change-cell {
        font-family: var(--mp-font-mono);
        font-weight: 500;
      }

      .change-cell.positive { color: var(--mp-positive); }
      .change-cell.negative { color: var(--mp-negative); }

      .type-badge {
        font-size: 0.6rem;
        text-transform: uppercase;
        padding: 2px 6px;
        border-radius: 3px;
        background: var(--mp-bg);
        color: var(--mp-text-muted);
        border: 1px solid var(--mp-border);
      }

      .empty {
        text-align: center;
        padding: 32px;
        color: var(--mp-text-muted);
      }

      .filter-bar {
        display: flex;
        gap: 8px;
        margin-bottom: 12px;
      }

      .filter-btn {
        background: var(--mp-bg);
        border: 1px solid var(--mp-border);
        color: var(--mp-text-muted);
        font-size: 0.7rem;
        padding: 4px 10px;
        border-radius: 9999px;
        cursor: pointer;
        transition: all var(--mp-transition);
      }

      .filter-btn.active {
        background: var(--mp-accent);
        color: white;
        border-color: var(--mp-accent);
      }

      .filter-btn:hover:not(.active) {
        border-color: var(--mp-text-dim);
        color: var(--mp-text);
      }
    `,
  ];

  @state() private sortField: SortField = 'symbol';
  @state() private sortDir: SortDir = 'asc';
  @state() private filterType: string = 'all';
  @state() private addSymbolInput = '';

  private handleSort(field: SortField) {
    if (this.sortField === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDir = field === 'changePercent' ? 'desc' : 'asc';
    }
  }

  private handleAddSymbol() {
    const symbol = this.addSymbolInput.trim().toUpperCase();
    if (symbol) {
      addToWatchlist(symbol);
      this.addSymbolInput = '';
    }
  }

  private handleAddInput(e: Event) {
    this.addSymbolInput = (e.target as HTMLInputElement).value;
  }

  private handleAddKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') this.handleAddSymbol();
  }

  render() {
    let assets = watchlistAssets.get();

    // Filter
    if (this.filterType !== 'all') {
      assets = assets.filter(a => a.type === this.filterType);
    }

    // Sort
    assets = [...assets].sort((a, b) => {
      let cmp = 0;
      switch (this.sortField) {
        case 'symbol': cmp = a.symbol.localeCompare(b.symbol); break;
        case 'price': cmp = a.price - b.price; break;
        case 'changePercent': cmp = a.changePercent - b.changePercent; break;
        case 'volume': cmp = a.volume - b.volume; break;
      }
      return this.sortDir === 'asc' ? cmp : -cmp;
    });

    return html`
      <div class="header">
        <span class="title">Watchlist (${watchlistSymbols.get().size})</span>
        <div class="add-form">
          <input
            placeholder="Add symbol…"
            .value=${this.addSymbolInput}
            @input=${this.handleAddInput}
            @keydown=${this.handleAddKeydown}
          >
          <button class="btn" @click=${this.handleAddSymbol}>Add</button>
        </div>
      </div>

      <div class="filter-bar">
        ${['all', 'stock', 'crypto', 'forex', 'commodity'].map(
          type => html`
            <button
              class="filter-btn ${this.filterType === type ? 'active' : ''}"
              @click=${() => { this.filterType = type; }}
            >${type === 'all' ? 'All' : type}</button>
          `
        )}
      </div>

      <div class="table-container">
        ${assets.length === 0
          ? html`<div class="empty">No assets in watchlist</div>`
          : html`
            <table>
              <thead>
                <tr>
                  <th class=${this.sortField === 'symbol' ? 'sorted' : ''} @click=${() => this.handleSort('symbol')}>
                    Symbol ${this.sortField === 'symbol' ? (this.sortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th>Type</th>
                  <th class=${this.sortField === 'price' ? 'sorted' : ''} @click=${() => this.handleSort('price')}>
                    Price ${this.sortField === 'price' ? (this.sortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th class=${this.sortField === 'changePercent' ? 'sorted' : ''} @click=${() => this.handleSort('changePercent')}>
                    Change ${this.sortField === 'changePercent' ? (this.sortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th class=${this.sortField === 'volume' ? 'sorted' : ''} @click=${() => this.handleSort('volume')}>
                    Volume ${this.sortField === 'volume' ? (this.sortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${assets.map(a => html`
                  <tr @click=${() => setSelectedSymbol(a.symbol)}>
                    <td>
                      <div class="symbol-cell">${a.symbol}</div>
                      <div class="name-cell">${a.name}</div>
                    </td>
                    <td><span class="type-badge">${a.type}</span></td>
                    <td class="price-cell">${formatPrice(a.price)}</td>
                    <td class="change-cell ${a.changePercent >= 0 ? 'positive' : 'negative'}">
                      ${formatPercent(a.changePercent)}
                    </td>
                    <td>${formatVolume(a.volume)}</td>
                    <td>
                      <button
                        class="btn-remove"
                        @click=${(e: Event) => { e.stopPropagation(); removeFromWatchlist(a.symbol); }}
                        title="Remove from watchlist"
                      >×</button>
                    </td>
                  </tr>
                `)}
              </tbody>
            </table>
          `
        }
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mp-watchlist-panel': MpWatchlistPanel;
  }
}
