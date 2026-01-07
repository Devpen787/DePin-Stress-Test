/**
 * DePIN Stress Test - Derived Metrics
 * Risk metrics, token metrics, and performance calculations
 */

import type { AggregateResult, DerivedMetrics, SimulationParams } from './types';

/**
 * Calculate maximum drawdown from price series
 * Maximum peak-to-trough decline as a percentage
 */
export function calculateMaxDrawdown(priceData: { mean: number }[]): number {
  if (priceData.length === 0) return 0;

  let peak = priceData[0].mean;
  let maxDrawdown = 0;

  for (const point of priceData) {
    if (point.mean > peak) {
      peak = point.mean;
    }
    const drawdown = (peak - point.mean) / peak;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  return maxDrawdown * 100; // Return as percentage
}

/**
 * Calculate price volatility (annualised standard deviation)
 */
export function calculateVolatility(priceData: { mean: number }[]): number {
  if (priceData.length < 2) return 0;

  // Calculate weekly returns
  const returns: number[] = [];
  for (let i = 1; i < priceData.length; i++) {
    const prevPrice = priceData[i - 1].mean;
    const currPrice = priceData[i].mean;
    if (prevPrice > 0) {
      returns.push(Math.log(currPrice / prevPrice));
    }
  }

  if (returns.length === 0) return 0;

  // Calculate standard deviation of returns
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + (r - mean) ** 2, 0) / returns.length;
  const weeklyVol = Math.sqrt(variance);

  // Annualise (52 weeks)
  return weeklyVol * Math.sqrt(52) * 100; // Return as percentage
}

/**
 * Calculate Sharpe ratio (risk-adjusted return)
 * Using 0% risk-free rate for simplicity
 */
export function calculateSharpeRatio(
  priceData: { mean: number }[],
  riskFreeRate: number = 0
): number {
  if (priceData.length < 2) return 0;

  const firstPrice = priceData[0].mean;
  const lastPrice = priceData[priceData.length - 1].mean;

  if (firstPrice <= 0) return 0;

  // Calculate total return
  const totalReturn = (lastPrice - firstPrice) / firstPrice;

  // Annualise return (assuming simulation is in weeks)
  const weeks = priceData.length;
  const annualisedReturn = totalReturn * (52 / weeks);

  // Get annualised volatility
  const volatility = calculateVolatility(priceData) / 100; // Convert back from percentage

  if (volatility === 0) return 0;

  // Sharpe = (Return - Risk-free rate) / Volatility
  return (annualisedReturn - riskFreeRate) / volatility;
}

/**
 * Calculate death spiral probability
 * Percentage of simulations where price falls below threshold
 */
export function calculateDeathSpiralProbability(
  priceData: { mean: number; p10: number }[],
  initialPrice: number,
  threshold: number = 0.1 // Default: 10% of initial price
): number {
  if (priceData.length === 0) return 0;

  const lastPoint = priceData[priceData.length - 1];
  const criticalPrice = initialPrice * threshold;

  // Using p10 as proxy for "bad case" scenarios
  // If p10 is below critical price, significant portion of sims failed
  if (lastPoint.p10 < criticalPrice) {
    // Estimate probability based on how far p10 is below threshold
    const ratio = lastPoint.p10 / criticalPrice;
    // If p10 = critical, prob ~10%. If p10 = 0, prob ~50%+
    return Math.min(90, 10 + (1 - ratio) * 40);
  }

  // Check if mean is trending toward crisis
  if (lastPoint.mean < criticalPrice * 2) {
    return 5; // Some risk
  }

  return 0;
}

/**
 * Calculate token velocity
 * How quickly tokens change hands (transactions / supply)
 */
export function calculateTokenVelocity(
  data: AggregateResult[],
  params: SimulationParams
): number {
  if (data.length === 0) return 0;

  // Sum of all tokens transacted (buy pressure)
  const totalTransacted = data.reduce(
    (sum, d) => sum + (d.buyPressure?.mean || 0),
    0
  );

  // Average supply
  const avgSupply = data.reduce(
    (sum, d) => sum + (d.supply?.mean || params.initialSupply),
    0
  ) / data.length;

  if (avgSupply === 0) return 0;

  // Annualise
  const weeks = data.length;
  return (totalTransacted / avgSupply) * (52 / weeks);
}

/**
 * Calculate inflation rate
 * Net (minted - burned) / supply, annualised
 */
export function calculateInflationRate(data: AggregateResult[]): number {
  if (data.length === 0) return 0;

  const firstSupply = data[0].supply?.mean || 1;
  const lastSupply = data[data.length - 1].supply?.mean || 1;

  const supplyChange = (lastSupply - firstSupply) / firstSupply;

  // Annualise
  const weeks = data.length;
  return supplyChange * (52 / weeks) * 100; // As percentage
}

/**
 * Calculate net emissions over simulation
 */
export function calculateNetEmissions(data: AggregateResult[]): number {
  return data.reduce((sum, d) => {
    const minted = d.minted?.mean || 0;
    const burned = d.burned?.mean || 0;
    return sum + minted - burned;
  }, 0);
}

/**
 * Calculate provider retention rate
 */
export function calculateRetentionRate(
  data: AggregateResult[],
  initialProviders: number
): number {
  if (data.length === 0) return 100;

  // Find peak provider count
  const peak = Math.max(
    initialProviders,
    ...data.map((d) => d.providers?.mean || 0)
  );

  const final = data[data.length - 1].providers?.mean || 0;

  if (peak === 0) return 100;
  return (final / peak) * 100;
}

/**
 * Calculate average utilisation over simulation
 */
export function calculateAvgUtilisation(data: AggregateResult[]): number {
  if (data.length === 0) return 0;

  return data.reduce(
    (sum, d) => sum + (d.utilisation?.mean || 0),
    0
  ) / data.length;
}

/**
 * Calculate demand satisfaction rate
 */
export function calculateDemandSatisfactionRate(data: AggregateResult[]): number {
  if (data.length === 0) return 100;

  const totalDemand = data.reduce((sum, d) => sum + (d.demand?.mean || 0), 0);
  const totalServed = data.reduce((sum, d) => sum + (d.demandServed?.mean || 0), 0);

  if (totalDemand === 0) return 100;
  return (totalServed / totalDemand) * 100;
}

/**
 * Calculate total network revenue (USD)
 */
export function calculateNetworkRevenue(data: AggregateResult[]): number {
  return data.reduce((sum, d) => {
    const served = d.demandServed?.mean || 0;
    const price = d.servicePrice?.mean || 0;
    return sum + served * price;
  }, 0);
}

/**
 * Calculate total provider revenue (USD value of rewards)
 */
export function calculateProviderRevenue(
  data: AggregateResult[],
  priceData: { mean: number }[]
): number {
  return data.reduce((sum, d, i) => {
    const minted = d.minted?.mean || 0;
    const price = priceData[i]?.mean || 1;
    return sum + minted * price;
  }, 0);
}

/**
 * Calculate total burned value (USD)
 */
export function calculateBurnedValue(
  data: AggregateResult[],
  priceData: { mean: number }[]
): number {
  return data.reduce((sum, d, i) => {
    const burned = d.burned?.mean || 0;
    const price = priceData[i]?.mean || 1;
    return sum + burned * price;
  }, 0);
}

/**
 * Calculate all derived metrics from simulation results
 */
export function calculateDerivedMetrics(
  data: AggregateResult[],
  params: SimulationParams
): DerivedMetrics {
  const priceData = data.map((d) => d.price);

  // Risk Metrics
  const maxDrawdown = calculateMaxDrawdown(priceData);
  const priceVolatility = calculateVolatility(priceData);
  const sharpeRatio = calculateSharpeRatio(priceData);
  const deathSpiralProbability = calculateDeathSpiralProbability(
    priceData,
    params.initialPrice
  );

  // Token Metrics
  const tokenVelocity = calculateTokenVelocity(data, params);
  const inflationRate = calculateInflationRate(data);
  const netEmissions = calculateNetEmissions(data);

  // Provider Metrics
  const avgProviderProfit = data.length > 0
    ? data[data.length - 1].profit?.mean || 0
    : 0;
  const providerProfitability = data.filter(
    (d) => (d.profit?.mean || 0) > 0
  ).length / Math.max(data.length, 1) * 100;
  const totalChurn = data.reduce((sum, d) => sum + (d.churnCount?.mean || 0), 0);
  const totalJoins = data.reduce((sum, d) => sum + (d.joinCount?.mean || 0), 0);
  const retentionRate = calculateRetentionRate(data, params.initialProviders);

  // Network Metrics
  const avgUtilisation = calculateAvgUtilisation(data);
  const demandSatisfactionRate = calculateDemandSatisfactionRate(data);
  const capacityUtilisationEfficiency = avgUtilisation / 100; // Normalise

  // Economic Metrics
  const totalNetworkRevenue = calculateNetworkRevenue(data);
  const totalProviderRevenue = calculateProviderRevenue(data, priceData);
  const totalBurnedValue = calculateBurnedValue(data, priceData);

  return {
    // Risk
    maxDrawdown,
    priceVolatility,
    sharpeRatio,
    deathSpiralProbability,

    // Token
    tokenVelocity,
    inflationRate,
    netEmissions,

    // Provider
    avgProviderProfit,
    providerProfitability,
    totalChurn,
    totalJoins,
    retentionRate,

    // Network
    avgUtilisation,
    demandSatisfactionRate,
    capacityUtilisationEfficiency,

    // Economic
    totalNetworkRevenue,
    totalProviderRevenue,
    totalBurnedValue,
  };
}

/**
 * Format metric for display
 */
export function formatMetric(value: number, type: 'percent' | 'currency' | 'number' | 'ratio'): string {
  switch (type) {
    case 'percent':
      return `${value.toFixed(1)}%`;
    case 'currency':
      return value >= 1000000
        ? `$${(value / 1000000).toFixed(2)}M`
        : value >= 1000
        ? `$${(value / 1000).toFixed(1)}K`
        : `$${value.toFixed(2)}`;
    case 'ratio':
      return value.toFixed(2);
    case 'number':
    default:
      return value >= 1000000
        ? `${(value / 1000000).toFixed(2)}M`
        : value >= 1000
        ? `${(value / 1000).toFixed(1)}K`
        : value.toFixed(0);
  }
}

