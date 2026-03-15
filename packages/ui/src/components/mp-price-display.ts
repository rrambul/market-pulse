import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { formatPrice } from '@market-pulse/utils';
import { themeStyles } from '../theme.js';

@customElement('mp-price-display')
export class MpPriceDisplay extends LitElement {
  static styles = [
    themeStyles,
    css`
      :host {
        display: inline-block;
      }
      .price {
        font-family: var(--mp-font-mono);
        font-size: 1rem;
        font-weight: 600;
        transition: color var(--mp-transition);
      }
      .price.flash-up {
        color: var(--mp-positive);
        text-shadow: 0 0 8px var(--mp-positive-glow);
      }
      .price.flash-down {
        color: var(--mp-negative);
        text-shadow: 0 0 8px var(--mp-negative-glow);
      }
      .price.neutral {
        color: var(--mp-text);
      }
    `,
  ];

  @property({ type: Number }) price = 0;
  @property({ type: Number }) previousPrice = 0;

  render() {
    const direction =
      this.price > this.previousPrice
        ? 'flash-up'
        : this.price < this.previousPrice
          ? 'flash-down'
          : 'neutral';
    return html`<span class="price ${direction}">${formatPrice(this.price)}</span>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mp-price-display': MpPriceDisplay;
  }
}
