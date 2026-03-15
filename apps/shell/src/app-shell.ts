import { LitElement, html, css } from 'lit';
import { SignalWatcher } from '@lit-labs/signals';
import { customElement, state } from 'lit/decorators.js';
import { connectionStatus, performanceMetrics, selectedSymbol, unreadAlertCount, stressTestConfig } from '@market-pulse/state';
import { themeStyles } from '@market-pulse/ui';

type ViewTab = 'overview' | 'watchlist' | 'details' | 'stream' | 'alerts';

/**
 * Main application shell — host component.
 * Handles layout, navigation, and lazy-loading of remote microfrontends.
 */
@customElement('mp-app-shell')
export class MpAppShell extends SignalWatcher(LitElement) {
  static styles = [
    themeStyles,
    css`
      :host {
        display: block;
        width: 100vw;
        height: 100vh;
        background: var(--mp-bg);
        overflow: hidden;
      }

      .layout {
        display: grid;
        grid-template-rows: auto 1fr auto;
        height: 100%;
      }

      /* ─── Header ─── */
      header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 16px;
        background: var(--mp-bg-card);
        border-bottom: 1px solid var(--mp-border);
        gap: 16px;
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .brand-icon {
        width: 28px;
        height: 28px;
        background: linear-gradient(135deg, var(--mp-accent), var(--mp-info));
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
      }

      .brand-name {
        font-weight: 700;
        font-size: 1rem;
        letter-spacing: -0.02em;
      }

      .brand-name span {
        color: var(--mp-accent);
      }

      /* ─── Navigation Tabs ─── */
      nav {
        display: flex;
        gap: 2px;
        background: var(--mp-bg);
        padding: 2px;
        border-radius: var(--mp-radius);
      }

      nav button {
        background: none;
        border: none;
        color: var(--mp-text-muted);
        font-family: var(--mp-font-sans);
        font-size: 0.8rem;
        font-weight: 500;
        padding: 6px 14px;
        border-radius: 6px;
        cursor: pointer;
        transition: all var(--mp-transition);
        position: relative;
      }

      nav button:hover {
        color: var(--mp-text);
        background: var(--mp-bg-card-hover);
      }

      nav button.active {
        color: var(--mp-text);
        background: var(--mp-bg-card);
      }

      .badge {
        position: absolute;
        top: 2px;
        right: 2px;
        background: var(--mp-negative);
        color: white;
        font-size: 0.6rem;
        font-weight: 700;
        padding: 1px 4px;
        border-radius: 9999px;
        min-width: 14px;
        text-align: center;
      }

      /* ─── Header Controls ─── */
      .controls {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        display: inline-block;
      }

      .status-dot.connected { background: var(--mp-positive); box-shadow: 0 0 6px var(--mp-positive-glow); }
      .status-dot.disconnected { background: var(--mp-negative); }
      .status-dot.connecting,
      .status-dot.reconnecting { background: var(--mp-warning); animation: pulse 1s infinite; }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }

      .status-text {
        font-size: 0.75rem;
        color: var(--mp-text-muted);
        text-transform: capitalize;
      }

      /* ─── Main Content ─── */
      main {
        overflow: auto;
        padding: 16px;
      }

      /* ─── Footer / Performance Bar ─── */
      footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 4px 16px;
        background: var(--mp-bg-card);
        border-top: 1px solid var(--mp-border);
        font-family: var(--mp-font-mono);
        font-size: 0.7rem;
        color: var(--mp-text-dim);
        gap: 16px;
      }

      .perf-item {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .perf-label {
        color: var(--mp-text-muted);
      }

      .perf-value {
        color: var(--mp-text);
        font-weight: 500;
      }

      .perf-value.warn {
        color: var(--mp-warning);
      }

      .perf-value.critical {
        color: var(--mp-negative);
      }

      /* ─── Stress Test Toggle ─── */
      .stress-toggle {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .stress-toggle label {
        font-size: 0.75rem;
        color: var(--mp-text-muted);
        cursor: pointer;
      }

      .stress-toggle input[type="checkbox"] {
        accent-color: var(--mp-negative);
      }

      /* ─── Remote Loading Fallback ─── */
      .remote-fallback {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: var(--mp-text-muted);
        font-size: 0.9rem;
      }
    `,
  ];

  @state() private activeTab: ViewTab = 'overview';

  private handleTabClick(tab: ViewTab) {
    this.activeTab = tab;
  }

  private handleStressToggle(e: Event) {
    const checked = (e.target as HTMLInputElement).checked;
    const config = stressTestConfig.get();
    const newConfig = { ...config, enabled: checked };

    import('@market-pulse/state').then(({ setStressTestConfig }) => {
      setStressTestConfig(newConfig);
    });

    // Notify server
    const client = (window as any).__marketClient;
    if (client) {
      client.restClient.setStressTest(newConfig).catch(console.error);
    }
  }

  render() {
    const status = connectionStatus.get();
    const perf = performanceMetrics.get();
    const alertCount = unreadAlertCount.get();
    const stress = stressTestConfig.get();

    return html`
      <div class="layout">
        <!-- Header -->
        <header>
          <div class="brand">
            <div class="brand-icon">⚡</div>
            <div class="brand-name">Market<span>Pulse</span></div>
          </div>

          <nav>
            ${this.renderTab('overview', 'Overview')}
            ${this.renderTab('watchlist', 'Watchlist')}
            ${this.renderTab('details', 'Details')}
            ${this.renderTab('stream', 'Trade Stream')}
            ${this.renderTab('alerts', 'Alerts', alertCount)}
          </nav>

          <div class="controls">
            <div class="stress-toggle">
              <input
                type="checkbox"
                id="stress"
                .checked=${stress.enabled}
                @change=${this.handleStressToggle}
              >
              <label for="stress">Stress Test</label>
            </div>
            <span class="status-dot ${status}"></span>
            <span class="status-text">${status}</span>
          </div>
        </header>

        <!-- Main Content -->
        <main>
          ${this.renderActiveView()}
        </main>

        <!-- Performance Footer -->
        <footer>
          <div class="perf-item">
            <span class="perf-label">FPS</span>
            <span class="perf-value ${perf.fps < 30 ? 'critical' : perf.fps < 50 ? 'warn' : ''}">${perf.fps}</span>
          </div>
          <div class="perf-item">
            <span class="perf-label">Signals/s</span>
            <span class="perf-value">${perf.signalUpdatesPerSec}</span>
          </div>
          <div class="perf-item">
            <span class="perf-label">WS msg/s</span>
            <span class="perf-value">${perf.wsMessagesPerSec}</span>
          </div>
          <div class="perf-item">
            <span class="perf-label">DOM Nodes</span>
            <span class="perf-value ${perf.domNodeCount > 5000 ? 'warn' : ''}">${perf.domNodeCount}</span>
          </div>
          <div class="perf-item">
            <span class="perf-label">Heap</span>
            <span class="perf-value">${perf.heapUsedMB}MB</span>
          </div>
        </footer>
      </div>
    `;
  }

  private renderTab(tab: ViewTab, label: string, badgeCount = 0) {
    return html`
      <button
        class=${this.activeTab === tab ? 'active' : ''}
        @click=${() => this.handleTabClick(tab)}
      >
        ${label}
        ${badgeCount > 0 ? html`<span class="badge">${badgeCount > 99 ? '99+' : badgeCount}</span>` : null}
      </button>
    `;
  }

  private renderActiveView() {
    switch (this.activeTab) {
      case 'overview':
        return html`<mp-market-overview></mp-market-overview>`;
      case 'watchlist':
        return html`<mp-watchlist-panel></mp-watchlist-panel>`;
      case 'details': {
        const sym = selectedSymbol.get();
        return sym
          ? html`<mp-asset-details symbol="${sym}"></mp-asset-details>`
          : html`<div class="remote-fallback">Select an asset to view details</div>`;
      }
      case 'stream':
        return html`<mp-trade-stream></mp-trade-stream>`;
      case 'alerts':
        return html`<mp-alerts-panel></mp-alerts-panel>`;
      default:
        return null;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mp-app-shell': MpAppShell;
  }
}
