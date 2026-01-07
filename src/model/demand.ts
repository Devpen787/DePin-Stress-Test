/**
 * DePIN Stress Test - Demand Generation
 * Functions for generating stochastic demand series
 */

import type { DemandType } from './types';
import { SeededRNG } from './rng';

/**
 * Generate a demand time series based on demand type
 */
export function generateDemandSeries(
  T: number,
  baseDemand: number,
  demandType: DemandType,
  volatility: number,
  rng: SeededRNG
): number[] {
  const series: number[] = [];

  for (let t = 0; t < T; t++) {
    let demand = 0;
    const noise = volatility * rng.normal();

    switch (demandType) {
      case 'consistent':
        // Stable demand with small fluctuations
        demand = baseDemand * (1 + noise);
        break;

      case 'growth':
        // Linear growth over time (adoption curve)
        // Starts at 80% of base, grows 2% per week
        demand = baseDemand * (0.8 + 0.02 * t) * (1 + noise);
        break;

      case 'volatile':
        // High variance demand
        demand = baseDemand * (1 + volatility * 4 * rng.normal());
        break;

      case 'high-to-decay':
        // Initial hype followed by decay to baseline
        // Exponential decay from 1.6x to 0.6x baseline
        const decayFactor = 1.6 * Math.exp(-t / 10) + 0.6;
        demand = baseDemand * decayFactor * (1 + noise);
        break;

      default:
        demand = baseDemand * (1 + noise);
    }

    // Ensure non-negative demand
    series.push(Math.max(0, demand));
  }

  return series;
}

/**
 * Generate demand with seasonal patterns
 */
export function generateSeasonalDemand(
  T: number,
  baseDemand: number,
  seasonalAmplitude: number,
  seasonalPeriod: number,
  volatility: number,
  rng: SeededRNG
): number[] {
  const series: number[] = [];

  for (let t = 0; t < T; t++) {
    const seasonal = seasonalAmplitude * Math.sin((2 * Math.PI * t) / seasonalPeriod);
    const noise = volatility * rng.normal();
    const demand = baseDemand * (1 + seasonal + noise);
    series.push(Math.max(0, demand));
  }

  return series;
}

/**
 * Apply demand shock at a specific week
 */
export function applyDemandShock(
  series: number[],
  week: number,
  multiplier: number,
  decayRate: number = 0.1
): number[] {
  return series.map((demand, t) => {
    if (t < week) return demand;
    // Shock decays over time
    const weeksAfterShock = t - week;
    const effectiveMultiplier = 1 + (multiplier - 1) * Math.exp(-decayRate * weeksAfterShock);
    return demand * effectiveMultiplier;
  });
}

/**
 * Calculate demand statistics
 */
export function getDemandStats(series: number[]): {
  mean: number;
  min: number;
  max: number;
  stdDev: number;
  total: number;
} {
  const n = series.length;
  const total = series.reduce((a, b) => a + b, 0);
  const mean = total / n;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const variance = series.reduce((sum, x) => sum + (x - mean) ** 2, 0) / n;
  const stdDev = Math.sqrt(variance);

  return { mean, min, max, stdDev, total };
}
