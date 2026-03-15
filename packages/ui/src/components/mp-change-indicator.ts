import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { formatChange, formatPercent } from '@market-pulse/utils';
import { themeStyles } from '../theme.js';

@customElement('mp-change-indicator')
export class MpChangeIndicator extends LitElement {
  static styles = [
    themeStyles,
    css`
      :host {
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }
      .change {
        font-family: var(--mp-font-mono);
        font-size: 0.85rem;
        font-weight: 500;
        padding: 2px 6px;
        border-radius: var(--mp-radius-sm);
      }
      .positive {
        color: var(--mp-positive);
        background: var(--mp-positive-glow);
      }
      .negative {
        color: var(--mp-negative);
        background: var(--mp-negative-glow);
      }
      .neutral {
        color: var(--mp-text-muted);
      }
      .arrow {
        font-size: 0.7rem;
      }
    `,
  ];

  @property({ type: Number }) change = 0;
  @property({ type: Number }) changePercent = 0;
  @property({ type: Boolean, attribute: 'show-absolute' }) showAbsolute = false;

  render() {
    const cls =
      this.changePercent > 0
        ? 'positive'
        : this.changePercent < 0
          ? 'negative'
          : 'neutral';
    const arrow = this.changePercent > 0 ? '▲' : this.changePercent < 0 ? '▼' : '';

    return html`
      <span class="arrow ${cls}">${arrow}</span>
      ${this.showAbsolute
        ? html`<span class="change ${cls}">${formatChange(this.change)}</span>`
        : null}
      <span class="change ${cls}">${formatPercent(this.changePercent)}</span>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mp-change-indicator': MpChangeIndicator;
  }
}
