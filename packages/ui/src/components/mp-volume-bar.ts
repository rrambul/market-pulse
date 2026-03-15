import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { themeStyles } from '../theme.js';

@customElement('mp-volume-bar')
export class MpVolumeBar extends LitElement {
  static styles = [
    themeStyles,
    css`
      :host {
        display: block;
      }
      .bar-container {
        width: 100%;
        height: 6px;
        background: var(--mp-border);
        border-radius: 3px;
        overflow: hidden;
      }
      .bar-fill {
        height: 100%;
        border-radius: 3px;
        transition: width 200ms ease;
        background: var(--mp-info);
      }
      .bar-fill.high {
        background: var(--mp-warning);
      }
    `,
  ];

  /** Volume as a percentage 0-100 */
  @property({ type: Number }) percent = 0;

  render() {
    const clamped = Math.min(100, Math.max(0, this.percent));
    const cls = clamped > 80 ? 'high' : '';
    return html`
      <div class="bar-container">
        <div class="bar-fill ${cls}" style="width: ${clamped}%"></div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mp-volume-bar': MpVolumeBar;
  }
}
