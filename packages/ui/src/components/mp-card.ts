import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { themeStyles } from '../theme.js';

@customElement('mp-card')
export class MpCard extends LitElement {
  static styles = [
    themeStyles,
    css`
      :host {
        display: block;
      }
      .card {
        background: var(--mp-bg-card);
        border: 1px solid var(--mp-border);
        border-radius: var(--mp-radius);
        padding: 16px;
        overflow: hidden;
      }
      .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
      }
      .card-header ::slotted(*) {
        margin: 0;
      }
      .card-title {
        font-size: 0.8rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--mp-text-muted);
      }
    `,
  ];

  render() {
    return html`
      <div class="card">
        <div class="card-header">
          <slot name="title"></slot>
          <slot name="actions"></slot>
        </div>
        <slot></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mp-card': MpCard;
  }
}
