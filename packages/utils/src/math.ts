export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Box-Muller transform for normally distributed random numbers.
 * Useful for realistic price movement simulation.
 */
export function randomGaussian(mean = 0, stddev = 1): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return z * stddev + mean;
}
