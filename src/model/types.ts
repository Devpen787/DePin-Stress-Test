/**
 * DePIN Stress Test - Type Definitions
 * Core interfaces for the simulation model
 */

// ============================================================================
// ENUMS & BASIC TYPES
// ============================================================================

export type DemandType = 'consistent' | 'high-to-decay' | 'growth' | 'volatile';
export type MacroCondition = 'bearish' | 'bullish' | 'sideways';
export type ThesisScenario = 'baseline' | 'winter' | 'saturation' | 'utility';
export type ViewMode = 'sandbox' | 'comparison' | 'explorer';

// ============================================================================
// PROVIDER AGENT MODEL
// ============================================================================

/**
 * Individual provider agent with heterogeneous characteristics
 * Based on Volt-Capital/depin_sim agent-based model
 */
export interface Provider {
  id: string;
  capacity: number;              // Units of service per week
  operationalCost: number;       // Weekly OPEX in USD
  joinedWeek: number;            // Week when provider joined
  cumulativeProfit: number;      // Total profit since joining
  consecutiveLossWeeks: number;  // Weeks of consecutive losses
  isActive: boolean;             // Whether provider is still active
  type: 'urban' | 'rural';       // Provider tier (Urban = High Cost, Rural = Low Cost)
  locationScore: number;         // Share Factor (1.0 = Unique, 0.3 = Dense/Redundant)
}

/**
 * Pool of providers in different states
 */
export interface ProviderPool {
  active: Provider[];            // Currently active providers
  churned: Provider[];           // Providers who have left
  pending: Provider[];           // Providers waiting to join (hardware lead time)
}

// ============================================================================
// SIMULATION PARAMETERS
// ============================================================================

export interface SimulationParams {
  // Time
  T: number;                           // Simulation duration in weeks

  // Tokenomics
  initialSupply: number;               // Initial token supply
  initialPrice: number;                // Initial token price in USD
  maxMintWeekly: number;               // Maximum weekly emissions
  burnPct: number;                     // Fraction of spent tokens burned (0-1)

  // Liquidity & Investor Unlock (Module 3)
  initialLiquidity: number;            // Initial USD in Liquidity Pool (Depth)
  investorUnlockWeek: number;          // Week when investors unlock
  investorSellPct: number;             // % of Total Supply sold by investors at unlock

  // Scenario Override (Thesis Section 9)
  scenario: ThesisScenario;


  // Demand
  demandType: DemandType;              // Demand curve shape
  baseDemand: number;                  // Base weekly demand units
  demandVolatility: number;            // Demand noise coefficient

  // Macro
  macro: MacroCondition;               // Market condition

  // Provider Economics
  initialProviders: number;            // Starting provider count
  baseCapacityPerProvider: number;     // Mean capacity per provider
  capacityStdDev: number;              // Capacity heterogeneity (std dev ratio)
  providerCostPerWeek: number;         // Mean weekly OPEX per provider
  costStdDev: number;                  // Cost heterogeneity (std dev ratio)
  hardwareLeadTime: number;            // Weeks delay for new providers to come online
  churnThreshold: number;              // Min profit threshold before considering churn
  profitThresholdToJoin: number;       // Min expected profit to attract new providers
  maxProviderGrowthRate: number;       // Max % provider growth per week
  maxProviderChurnRate: number;        // Max % provider churn per week

  // Price Sensitivity Coefficients
  kBuyPressure: number;                // Buy pressure → price coefficient
  kSellPressure: number;               // Sell pressure → price coefficient
  kDemandPrice: number;                // Demand scarcity → price coefficient
  kMintPrice: number;                  // Dilution → price coefficient

  // Service Pricing
  baseServicePrice: number;            // Starting service price
  servicePriceElasticity: number;      // How fast service price adjusts to scarcity
  minServicePrice: number;             // Service price floor
  maxServicePrice: number;             // Service price ceiling

  // Reward Mechanics
  rewardLagWeeks: number;              // Weeks delay before providers receive rewards

  // Simulation
  nSims: number;                       // Monte Carlo runs
  seed: number;                        // RNG seed for reproducibility
}

// ============================================================================
// SIMULATION STATE
// ============================================================================

/**
 * Complete state at a single timestep
 */
export interface SimulationState {
  t: number;

  // Token State
  tokenPrice: number;
  tokenSupply: number;

  // Service State
  servicePrice: number;
  demand: number;
  demandServed: number;
  capacity: number;
  utilisation: number;
  scarcity: number;

  // Provider State
  providers: ProviderPool;
  activeProviderCount: number;

  // Token Flows
  minted: number;
  burned: number;
  buyPressure: number;                 // Tokens bought by users for service
  sellPressure: number;                // Tokens sold by providers to cover costs
  netFlow: number;                     // Net token flow affecting price

  // Economics
  avgProviderProfit: number;
  avgProviderRevenue: number;
  incentive: number;                   // ROI ratio
}

// ============================================================================
// SIMULATION RESULTS
// ============================================================================

/**
 * Result for a single timestep (simplified for aggregation)
 */
export interface SimResult {
  t: number;
  price: number;
  supply: number;
  demand: number;
  demandServed: number;
  providers: number;
  capacity: number;
  servicePrice: number;
  minted: number;
  burned: number;
  utilisation: number;
  profit: number;
  scarcity: number;
  incentive: number;
  buyPressure: number;
  sellPressure: number;
  netFlow: number;
  churnCount: number;
  joinCount: number;

  // Solvency Metrics
  solvencyScore: number;
  netDailyLoss: number;
  dailyMintUsd: number;
  dailyBurnUsd: number;

  // Capitulation Metrics
  urbanCount: number;
  ruralCount: number;
  weightedCoverage: number;
}

/**
 * Statistical summary of a metric across Monte Carlo runs
 */
export interface MetricStats {
  mean: number;
  p10: number;
  p90: number;
  min: number;
  max: number;
  stdDev: number;
}

/**
 * Aggregated results across all Monte Carlo simulations
 */
export interface AggregateResult {
  t: number;
  price: MetricStats;
  supply: MetricStats;
  demand: MetricStats;
  demandServed: MetricStats;
  providers: MetricStats;
  capacity: MetricStats;
  servicePrice: MetricStats;
  minted: MetricStats;
  burned: MetricStats;
  utilisation: MetricStats;
  profit: MetricStats;
  scarcity: MetricStats;
  incentive: MetricStats;
  buyPressure: MetricStats;
  sellPressure: MetricStats;
  netFlow: MetricStats;
  churnCount: MetricStats;
  joinCount: MetricStats;

  // Solvency Metrics
  solvencyScore: MetricStats;
  netDailyLoss: MetricStats;
  dailyMintUsd: MetricStats;
  dailyBurnUsd: MetricStats;

  // Capitulation Metrics
  urbanCount: MetricStats;
  ruralCount: MetricStats;
  weightedCoverage: MetricStats;
}

// ============================================================================
// DERIVED METRICS
// ============================================================================

/**
 * Risk and performance metrics derived from simulation results
 */
export interface DerivedMetrics {
  // Risk Metrics
  maxDrawdown: number;                 // Largest peak-to-trough price decline (%)
  priceVolatility: number;             // Price standard deviation
  sharpeRatio: number;                 // Risk-adjusted return
  deathSpiralProbability: number;      // % of sims where price < 10% of initial

  // Token Metrics
  tokenVelocity: number;               // Tokens transacted / supply
  inflationRate: number;               // (minted - burned) / supply annualised
  netEmissions: number;                // Cumulative minted - burned

  // Provider Metrics
  avgProviderProfit: number;
  providerProfitability: number;       // % of time providers were profitable
  totalChurn: number;                  // Total providers who left
  totalJoins: number;                  // Total providers who joined
  retentionRate: number;               // Final providers / peak providers

  // Network Metrics
  avgUtilisation: number;
  demandSatisfactionRate: number;      // Demand served / demand requested
  capacityUtilisationEfficiency: number;

  // Economic Metrics
  totalNetworkRevenue: number;         // Sum of (demandServed * servicePrice)
  totalProviderRevenue: number;        // Sum of minted token value
  totalBurnedValue: number;            // Sum of burned token value
}

// ============================================================================
// PROTOCOL PROFILES
// ============================================================================

export interface ProtocolProfileV1 {
  version: string;
  metadata: {
    id: string;
    name: string;
    notes: string;
    mechanism: string;
    model_type: 'location_based' | 'fungible_resource';
    source: 'Interview-Derived' | 'Placeholder-Derived';
  };
  parameters: {
    supply: { value: number; unit: string };
    emissions: { value: number; unit: string };
    burn_fraction: { value: number; unit: string };
    adjustment_lag: { value: number; unit: string };
    demand_regime: { value: DemandType; unit: string };
    provider_economics: {
      opex_weekly: { value: number; unit: string };
      churn_threshold: { value: number; unit: string };
    };
  };
}

// ============================================================================
// PARAMETER DOCUMENTATION
// ============================================================================

export interface ParamDocumentation {
  name: string;
  description: string;
  unit: string;
  min: number;
  max: number;
  default: number;
  impact: string;
  category: 'time' | 'tokenomics' | 'demand' | 'macro' | 'provider' | 'price' | 'service' | 'simulation';
}

