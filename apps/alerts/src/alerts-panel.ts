import { LitElement, html, css } from 'lit';
import { SignalWatcher } from '@lit-labs/signals';
import { customElement, state } from 'lit/decorators.js';
import { alerts, clearAlerts, markAlertsRead, unreadAlertCount } from '@market-pulse/state';
import { setSelectedSymbol } from '@market-pulse/state';
import { formatTimestamp } from '@market-pulse/utils';
import { themeStyles } from '@market-pulse/ui';
import type { AlertTriggeredEvent } from '@market-pulse/contracts';
import type { ScenarioType } from '@market-pulse/contracts';

@customElement('mp-alerts-panel')
export class MpAlertsPanel extends SignalWatcher(LitElement) {
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

      .controls {
        display: flex;
        align-items: center;
        gap: 8px;
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

      .btn-scenario {
        background: var(--mp-bg);
        border: 1px solid var(--mp-border);
        color: var(--mp-text-muted);
        padding: 6px 12px;
        border-radius: var(--mp-radius-sm);
        font-size: 0.75rem;
        cursor: pointer;
        transition: all var(--mp-transition);
      }

      .btn-scenario:hover {
        border-color: var(--mp-accent);
        color: var(--mp-accent);
        background: var(--mp-accent-glow);
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
        color: white;
        border-color: transparent;
      }

      .filter-btn.active.all { background: var(--mp-accent); }
      .filter-btn.active.high { background: var(--mp-negative); }
      .filter-btn.active.medium { background: var(--mp-warning); }
      .filter-btn.active.low { background: var(--mp-info); }

      .filter-btn:hover:not(.active) {
        border-color: var(--mp-text-dim);
        color: var(--mp-text);
      }

      /* ─── Scenario Controls ─── */
      .scenarios {
        background: var(--mp-bg-card);
        border: 1px solid var(--mp-border);
        border-radius: var(--mp-radius);
        padding: 16px;
        margin-bottom: 16px;
      }

      .scenarios-title {
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--mp-text-muted);
        margin-bottom: 10px;
      }

      .scenario-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 8px;
      }

      .scenario-card {
        background: var(--mp-bg);
        border: 1px solid var(--mp-border);
        border-radius: var(--mp-radius-sm);
        padding: 10px 12px;
        cursor: pointer;
        transition: all var(--mp-transition);
      }

      .scenario-card:hover {
        border-color: var(--mp-accent);
        background: var(--mp-accent-glow);
      }

      .scenario-label {
        font-weight: 600;
        font-size: 0.8rem;
        margin-bottom: 2px;
      }

      .scenario-desc {
        font-size: 0.7rem;
        color: var(--mp-text-dim);
      }

      /* ─── Alert List ─── */
      .alert-container {
        background: var(--mp-bg-card);
        border: 1px solid var(--mp-border);
        border-radius: var(--mp-radius);
        overflow: hidden;
      }

      .alert-list {
        max-height: calc(100vh - 320px);
        overflow-y: auto;
      }

      .alert-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 10px 16px;
        border-bottom: 1px solid var(--mp-border);
        cursor: pointer;
        transition: background var(--mp-transition);
        contain: layout style;
      }

      .alert-item:hover {
        background: var(--mp-bg-card-hover);
      }

      .severity-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-top: 5px;
        flex-shrink: 0;
      }

      .severity-dot.high { background: var(--mp-negative); box-shadow: 0 0 6px var(--mp-negative-glow); }
      .severity-dot.medium { background: var(--mp-warning); }
      .severity-dot.low { background: var(--mp-info); }

      .alert-content {
        flex: 1;
        min-width: 0;
      }

      .alert-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }

      .alert-symbol {
        font-family: var(--mp-font-mono);
        font-weight: 600;
        font-size: 0.8rem;
      }

      .alert-time {
        font-family: var(--mp-font-mono);
        font-size: 0.65rem;
        color: var(--mp-text-dim);
      }

      .alert-message {
        font-size: 0.8rem;
        color: var(--mp-text-muted);
        margin-top: 2px;
      }

      .alert-count {
        font-family: var(--mp-font-mono);
        font-size: 0.75rem;
        color: var(--mp-text-muted);
      }

      .empty {
        text-align: center;
        padding: 32px;
        color: var(--mp-text-dim);
        font-size: 0.85rem;
      }

      .unread-badge {
        background: var(--mp-negative);
        color: white;
        font-size: 0.65rem;
        font-weight: 700;
        padding: 1px 6px;
        border-radius: 9999px;
        margin-left: 8px;
      }
    `,
  ];

  @state() private filterSeverity: 'all' | 'high' | 'medium' | 'low' = 'all';

  private scenarios = [
    { type: 'tech-selloff' as ScenarioType, label: 'Tech Selloff', desc: 'Heavy selling in tech stocks' },
    { type: 'crypto-rally' as ScenarioType, label: 'Crypto Rally', desc: 'Crypto market surges' },
    { type: 'flash-crash' as ScenarioType, label: 'Flash Crash', desc: 'Sudden market-wide crash' },
    { type: 'volume-burst' as ScenarioType, label: 'Volume Burst', desc: 'Unusual trading volume' },
    { type: 'forex-shock' as ScenarioType, label: 'Forex Shock', desc: 'Currency pair volatility' },
    { type: 'commodity-surge' as ScenarioType, label: 'Commodity Surge', desc: 'Supply-driven price spike' },
  ];

  private triggerScenario(type: ScenarioType) {
    const client = (window as any).__marketClient;
    if (client) {
      client.restClient.triggerScenario(type).catch(console.error);
    }
  }

  connectedCallback() {
    super.connectedCallback();
    markAlertsRead();
  }

  render() {
    const allAlerts = alerts.get();
    const unread = unreadAlertCount.get();

    let filteredAlerts = allAlerts;
    if (this.filterSeverity !== 'all') {
      filteredAlerts = allAlerts.filter(a => a.severity === this.filterSeverity);
    }

    const highCount = allAlerts.filter(a => a.severity === 'high').length;
    const medCount = allAlerts.filter(a => a.severity === 'medium').length;
    const lowCount = allAlerts.filter(a => a.severity === 'low').length;

    return html`
      <!-- Scenario Injection -->
      <div class="scenarios">
        <div class="scenarios-title">Inject Market Scenario</div>
        <div class="scenario-grid">
          ${this.scenarios.map(
            s => html`
              <div class="scenario-card" @click=${() => this.triggerScenario(s.type)}>
                <div class="scenario-label">${s.label}</div>
                <div class="scenario-desc">${s.desc}</div>
              </div>
            `
          )}
        </div>
      </div>

      <!-- Alerts -->
      <div class="header">
        <span class="title">
          Alerts
          ${unread > 0 ? html`<span class="unread-badge">${unread}</span>` : null}
        </span>
        <div class="controls">
          <span class="alert-count">${allAlerts.length} total</span>
          <button class="btn" @click=${() => { markAlertsRead(); }}>Mark Read</button>
          <button class="btn" @click=${() => clearAlerts()}>Clear All</button>
        </div>
      </div>

      <div class="filter-bar">
        <button
          class="filter-btn all ${this.filterSeverity === 'all' ? 'active' : ''}"
          @click=${() => { this.filterSeverity = 'all'; }}
        >All (${allAlerts.length})</button>
        <button
          class="filter-btn high ${this.filterSeverity === 'high' ? 'active' : ''}"
          @click=${() => { this.filterSeverity = 'high'; }}
        >High (${highCount})</button>
        <button
          class="filter-btn medium ${this.filterSeverity === 'medium' ? 'active' : ''}"
          @click=${() => { this.filterSeverity = 'medium'; }}
        >Medium (${medCount})</button>
        <button
          class="filter-btn low ${this.filterSeverity === 'low' ? 'active' : ''}"
          @click=${() => { this.filterSeverity = 'low'; }}
        >Low (${lowCount})</button>
      </div>

      <div class="alert-container">
        <div class="alert-list">
          ${filteredAlerts.length === 0
            ? html`<div class="empty">No alerts${this.filterSeverity !== 'all' ? ` with ${this.filterSeverity} severity` : ''}</div>`
            : filteredAlerts.map(
                (alert: AlertTriggeredEvent) => html`
                  <div
                    class="alert-item"
                    @click=${() => setSelectedSymbol(alert.symbol)}
                  >
                    <span class="severity-dot ${alert.severity}"></span>
                    <div class="alert-content">
                      <div class="alert-top">
                        <span class="alert-symbol">${alert.symbol}</span>
                        <span class="alert-time">${formatTimestamp(alert.timestamp)}</span>
                      </div>
                      <div class="alert-message">${alert.message}</div>
                    </div>
                  </div>
                `
              )}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mp-alerts-panel': MpAlertsPanel;
  }
}
