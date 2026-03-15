import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { themeStyles } from '../theme.js';

@customElement('mp-loading-spinner')
export class MpLoadingSpinner extends LitElement {
  static styles = [
    themeStyles,
    css`
      :host {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
      }
      .spinner {
        width: 32px;
        height: 32px;
        border: 3px solid var(--mp-border);
        border-top-color: var(--mp-accent);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `,
  ];

  render() {
    return html`<div class="spinner"></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mp-loading-spinner': MpLoadingSpinner;
  }
}
