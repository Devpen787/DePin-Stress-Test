/**
 * DePIN Stress Test - Model Index
 * Re-exports all model components for clean imports
 */

// Types
export * from './types';

// RNG
export { SeededRNG } from './rng';

// Parameters
export {
  DEFAULT_PARAMS,
  PARAM_DOCS,
  PROTOCOL_PROFILES,
  getParamTooltip,
  validateParams,
} from './params';

// Demand
export {
  generateDemandSeries,
  generateSeasonalDemand,
  applyDemandShock,
  getDemandStats,
} from './demand';

// Simulation
export { simulateOne, runSimulation } from './simulation';

// Metrics
export {
  calculateMaxDrawdown,
  calculateVolatility,
  calculateSharpeRatio,
  calculateDeathSpiralProbability,
  calculateTokenVelocity,
  calculateInflationRate,
  calculateNetEmissions,
  calculateRetentionRate,
  calculateAvgUtilisation,
  calculateDemandSatisfactionRate,
  calculateNetworkRevenue,
  calculateProviderRevenue,
  calculateBurnedValue,
  calculateDerivedMetrics,
  formatMetric,
} from './metrics';

