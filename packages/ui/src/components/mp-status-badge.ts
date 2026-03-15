import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { themeStyles } from '../theme.js';

@customElement('mp-status-badge')
export class MpStatusBadge extends LitElement {
  static styles = [
    themeStyles,
    css`
      :host {
        display: inline-block;
      }
      .badge {
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        padding: 2px 8px;
        border-radius: 9999px;
      }
      .badge.low {
        color: var(--mp-positive);
        background: var(--mp-positive-glow);
      }
      .badge.medium {
        color: var(--mp-warning);
        background: #f59e0b30;
      }
      .badge.high {
        color: var(--mp-negative);
        background: var(--mp-negative-glow);
      }
      .badge.connected {
        color: var(--mp-positive);
        background: var(--mp-positive-glow);
      }
      .badge.disconnected {
        color: var(--mp-negative);
        background: var(--mp-negative-glow);
      }
      .badge.connecting,
      .badge.reconnecting {
        color: var(--mp-warning);
        background: #f59e0b30;
      }
    `,
  ];

  @property() variant: string = 'low';

  render() {
    return html`<span class="badge ${this.variant}"><slot></slot></span>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mp-status-badge': MpStatusBadge;
  }
}
