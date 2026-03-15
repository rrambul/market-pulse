/**
 * Format price based on asset magnitude.
 * Small values (< 1): 6 decimal places (forex, low-cap crypto)
 * Medium values (< 100): 2 decimal places
 * Large values: 2 decimal places with commas
 */
export function formatPrice(price: number): string {
  if (price < 0.01) return price.toFixed(6);
  if (price < 1) return price.toFixed(4);
  return price.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format absolute change with sign.
 */
export function formatChange(change: number): string {
  const sign = change >= 0 ? '+' : '';
  if (Math.abs(change) < 0.01) return `${sign}${change.toFixed(6)}`;
  if (Math.abs(change) < 1) return `${sign}${change.toFixed(4)}`;
  return `${sign}${change.toFixed(2)}`;
}

/**
 * Format percent change with sign and % symbol.
 */
export function formatPercent(percent: number): string {
  const sign = percent >= 0 ? '+' : '';
  return `${sign}${percent.toFixed(2)}%`;
}

/**
 * Format volume with suffixes (K, M, B).
 */
export function formatVolume(volume: number): string {
  if (volume >= 1_000_000_000) return `${(volume / 1_000_000_000).toFixed(2)}B`;
  if (volume >= 1_000_000) return `${(volume / 1_000_000).toFixed(2)}M`;
  if (volume >= 1_000) return `${(volume / 1_000).toFixed(1)}K`;
  return volume.toString();
}

/**
 * Format timestamp to HH:MM:SS.mmm
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  const s = date.getSeconds().toString().padStart(2, '0');
  const ms = date.getMilliseconds().toString().padStart(3, '0');
  return `${h}:${m}:${s}.${ms}`;
}

/**
 * Format large numbers compactly.
 */
export function formatCompactNumber(n: number): string {
  return Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}
