/**
 * DePIN Stress Test - Formatting Utilities
 */

/**
 * Format number with compact notation (1K, 1M, etc.)
 */
export function formatCompact(n: number): string {
  if (n === 0) return '0';
  if (Math.abs(n) >= 1_000_000_000) {
    return `${(n / 1_000_000_000).toFixed(1)}B`;
  }
  if (Math.abs(n) >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(n) >= 1_000) {
    return `${(n / 1_000).toFixed(1)}K`;
  }
  return n.toFixed(0);
}

/**
 * Format number with locale-specific formatting
 */
export function formatNum(n: number, decimals: number = 2): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: decimals });
}

/**
 * Format as currency
 */
export function formatCurrency(n: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

/**
 * Format as percentage
 */
export function formatPercent(n: number, decimals: number = 1): string {
  return `${n.toFixed(decimals)}%`;
}

/**
 * Format change with sign
 */
export function formatChange(n: number, decimals: number = 1): string {
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toFixed(decimals)}%`;
}

/**
 * Format duration in weeks/months/years
 */
export function formatDuration(weeks: number): string {
  if (weeks < 8) {
    return `${weeks} weeks`;
  }
  if (weeks < 52) {
    const months = Math.round(weeks / 4.33);
    return `${months} month${months === 1 ? '' : 's'}`;
  }
  const years = (weeks / 52).toFixed(1);
  return `${years} year${parseFloat(years) === 1 ? '' : 's'}`;
}

/**
 * Format large numbers for readability
 */
export function formatLargeNumber(n: number): string {
  if (n >= 1_000_000_000) {
    return `${(n / 1_000_000_000).toFixed(2)}B`;
  }
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(2)}M`;
  }
  if (n >= 1_000) {
    return `${(n / 1_000).toFixed(2)}K`;
  }
  return n.toFixed(2);
}

/**
 * Get colour class based on value sentiment
 */
export function getColourClass(
  value: number,
  thresholds: { good: number; bad: number },
  inverted: boolean = false
): string {
  const isGood = inverted ? value < thresholds.good : value > thresholds.good;
  const isBad = inverted ? value > thresholds.bad : value < thresholds.bad;

  if (isGood) return 'text-emerald-400';
  if (isBad) return 'text-rose-400';
  return 'text-amber-400';
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Linear interpolation
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

/**
 * Map value from one range to another
 */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

