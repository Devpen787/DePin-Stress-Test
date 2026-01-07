/**
 * DePIN Stress Test - Parameter Configuration
 * Default values and comprehensive documentation for all simulation parameters
 */

import type { SimulationParams, ParamDocumentation, ProtocolProfileV1 } from './types';

// ============================================================================
// DEFAULT PARAMETERS
// ============================================================================

export const DEFAULT_PARAMS: SimulationParams = {
  // Time
  T: 52,                                // 1 year simulation
  
  // Tokenomics
  initialSupply: 100_000_000,           // 100M tokens
  initialPrice: 3.0,                    // $3 per token
  maxMintWeekly: 250_000,               // 250K tokens/week max emissions
  burnPct: 0.65,                        // 65% of spent tokens burned
  
  // Demand
  demandType: 'growth',
  baseDemand: 12_000,                   // Base demand units per week
  demandVolatility: 0.05,               // 5% demand noise
  
  // Macro
  macro: 'sideways',
  
  // Provider Economics
  initialProviders: 30,                 // Start with 30 providers
  baseCapacityPerProvider: 180,         // 180 units per provider
  capacityStdDev: 0.2,                  // 20% capacity variation
  providerCostPerWeek: 25.96,           // ~$26/week operational cost
  costStdDev: 0.15,                     // 15% cost variation
  hardwareLeadTime: 2,                  // 2 weeks to bring hardware online
  churnThreshold: 10,                   // Leave if profit < $10/week
  profitThresholdToJoin: 15,            // Join if expected profit > $15/week
  maxProviderGrowthRate: 0.15,          // Max 15% growth per week
  maxProviderChurnRate: 0.10,           // Max 10% churn per week
  
  // Price Sensitivity Coefficients
  kBuyPressure: 0.08,                   // Buy pressure coefficient
  kSellPressure: 0.12,                  // Sell pressure coefficient (providers selling)
  kDemandPrice: 0.15,                   // Demand/scarcity coefficient
  kMintPrice: 0.35,                     // Dilution coefficient
  
  // Service Pricing
  baseServicePrice: 0.5,                // $0.50 per unit
  servicePriceElasticity: 0.6,          // How fast price adjusts
  minServicePrice: 0.05,                // $0.05 floor
  maxServicePrice: 5.0,                 // $5.00 ceiling
  
  // Reward Mechanics
  rewardLagWeeks: 6,                    // 6 week reward delay
  
  // Simulation
  nSims: 100,                           // 100 Monte Carlo runs
  seed: 42,                             // Default seed
};

// ============================================================================
// PARAMETER DOCUMENTATION
// ============================================================================

export const PARAM_DOCS: Record<keyof SimulationParams, ParamDocumentation> = {
  T: {
    name: 'Time Horizon',
    description: 'Total duration of the simulation in weeks. Longer horizons reveal long-term dynamics but increase computation time.',
    unit: 'weeks',
    min: 12,
    max: 208,
    default: 52,
    impact: 'Longer simulations show equilibrium states and long-term sustainability.',
    category: 'time',
  },
  
  initialSupply: {
    name: 'Initial Supply',
    description: 'Starting circulating token supply. Higher supply means more liquidity but potential dilution concerns.',
    unit: 'tokens',
    min: 1_000_000,
    max: 10_000_000_000,
    default: 100_000_000,
    impact: 'Affects token price sensitivity and emission ratios.',
    category: 'tokenomics',
  },
  
  initialPrice: {
    name: 'Initial Price',
    description: 'Starting token price in USD. Sets the baseline for measuring returns and provider economics.',
    unit: 'USD',
    min: 0.001,
    max: 1000,
    default: 3.0,
    impact: 'Higher prices mean higher provider rewards in USD terms.',
    category: 'tokenomics',
  },
  
  maxMintWeekly: {
    name: 'Max Weekly Emissions',
    description: 'Maximum tokens minted per week as provider rewards. Controls inflation rate.',
    unit: 'tokens/week',
    min: 1000,
    max: 10_000_000,
    default: 250_000,
    impact: 'Higher emissions attract providers but dilute token value.',
    category: 'tokenomics',
  },
  
  burnPct: {
    name: 'Burn Percentage',
    description: 'Fraction of tokens spent on services that are permanently burned. Key deflationary mechanism.',
    unit: 'decimal (0-1)',
    min: 0,
    max: 1,
    default: 0.65,
    impact: 'Higher burn creates deflation, countering emission inflation.',
    category: 'tokenomics',
  },
  
  demandType: {
    name: 'Demand Regime',
    description: 'Shape of the demand curve over time. Simulates different market adoption scenarios.',
    unit: 'category',
    min: 0,
    max: 3,
    default: 0,
    impact: 'Growth = adoption curve, Volatile = uncertain market, Decay = fading interest.',
    category: 'demand',
  },
  
  baseDemand: {
    name: 'Base Demand',
    description: 'Baseline weekly demand for network services in units.',
    unit: 'units/week',
    min: 100,
    max: 1_000_000,
    default: 12_000,
    impact: 'Higher demand increases utilisation and token burn.',
    category: 'demand',
  },
  
  demandVolatility: {
    name: 'Demand Volatility',
    description: 'Standard deviation of demand noise as a fraction of base demand.',
    unit: 'decimal',
    min: 0,
    max: 0.5,
    default: 0.05,
    impact: 'Higher volatility creates more uncertain revenue for providers.',
    category: 'demand',
  },
  
  macro: {
    name: 'Macro Condition',
    description: 'Overall market sentiment affecting token price drift.',
    unit: 'category',
    min: 0,
    max: 2,
    default: 1,
    impact: 'Bearish = downward drift, Bullish = upward drift, Sideways = neutral.',
    category: 'macro',
  },
  
  initialProviders: {
    name: 'Initial Providers',
    description: 'Number of providers at simulation start.',
    unit: 'count',
    min: 1,
    max: 10_000,
    default: 30,
    impact: 'More providers = more capacity but rewards spread thinner.',
    category: 'provider',
  },
  
  baseCapacityPerProvider: {
    name: 'Base Capacity per Provider',
    description: 'Average service units each provider can deliver per week.',
    unit: 'units/week',
    min: 10,
    max: 10_000,
    default: 180,
    impact: 'Higher capacity means fewer providers needed to meet demand.',
    category: 'provider',
  },
  
  capacityStdDev: {
    name: 'Capacity Std Dev',
    description: 'Heterogeneity in provider capacity as fraction of base.',
    unit: 'decimal',
    min: 0,
    max: 0.5,
    default: 0.2,
    impact: 'Higher values create more diverse provider economics.',
    category: 'provider',
  },
  
  providerCostPerWeek: {
    name: 'Provider Weekly Cost',
    description: 'Average operational expense per provider per week (electricity, hardware, etc.).',
    unit: 'USD/week',
    min: 1,
    max: 1000,
    default: 25.96,
    impact: 'Higher costs require higher rewards to retain providers.',
    category: 'provider',
  },
  
  costStdDev: {
    name: 'Cost Std Dev',
    description: 'Heterogeneity in provider costs as fraction of base.',
    unit: 'decimal',
    min: 0,
    max: 0.5,
    default: 0.15,
    impact: 'Higher values mean some providers are more efficient than others.',
    category: 'provider',
  },
  
  hardwareLeadTime: {
    name: 'Hardware Lead Time',
    description: 'Weeks delay before new providers can start earning rewards.',
    unit: 'weeks',
    min: 0,
    max: 12,
    default: 2,
    impact: 'Longer lead times slow network growth response to demand.',
    category: 'provider',
  },
  
  churnThreshold: {
    name: 'Churn Threshold',
    description: 'Minimum weekly profit below which providers consider leaving.',
    unit: 'USD/week',
    min: -100,
    max: 100,
    default: 10,
    impact: 'Lower threshold makes providers more tolerant of low profits.',
    category: 'provider',
  },
  
  profitThresholdToJoin: {
    name: 'Join Profit Threshold',
    description: 'Minimum expected weekly profit to attract new providers.',
    unit: 'USD/week',
    min: 0,
    max: 200,
    default: 15,
    impact: 'Higher threshold makes it harder to attract new providers.',
    category: 'provider',
  },
  
  maxProviderGrowthRate: {
    name: 'Max Provider Growth Rate',
    description: 'Maximum percentage of provider count that can join per week.',
    unit: 'decimal',
    min: 0.01,
    max: 0.5,
    default: 0.15,
    impact: 'Simulates hardware lead times and market friction.',
    category: 'provider',
  },
  
  maxProviderChurnRate: {
    name: 'Max Provider Churn Rate',
    description: 'Maximum percentage of providers that can leave per week.',
    unit: 'decimal',
    min: 0.01,
    max: 0.5,
    default: 0.10,
    impact: 'Higher values allow faster network collapse under stress.',
    category: 'provider',
  },
  
  kBuyPressure: {
    name: 'Buy Pressure Coefficient',
    description: 'How much user token purchases affect price.',
    unit: 'coefficient',
    min: 0,
    max: 1,
    default: 0.08,
    impact: 'Higher values make price more responsive to service demand.',
    category: 'price',
  },
  
  kSellPressure: {
    name: 'Sell Pressure Coefficient',
    description: 'How much provider token sales affect price.',
    unit: 'coefficient',
    min: 0,
    max: 1,
    default: 0.12,
    impact: 'Higher values make price drop more when providers sell.',
    category: 'price',
  },
  
  kDemandPrice: {
    name: 'Demand-Price Coefficient',
    description: 'How much demand scarcity affects token price.',
    unit: 'coefficient',
    min: 0,
    max: 1,
    default: 0.15,
    impact: 'Higher values create stronger demand-driven price movements.',
    category: 'price',
  },
  
  kMintPrice: {
    name: 'Mint-Price Coefficient',
    description: 'How much token minting dilutes the price.',
    unit: 'coefficient',
    min: 0,
    max: 1,
    default: 0.35,
    impact: 'Higher values make emissions more dilutive to price.',
    category: 'price',
  },
  
  baseServicePrice: {
    name: 'Base Service Price',
    description: 'Starting price per unit of service.',
    unit: 'USD/unit',
    min: 0.01,
    max: 100,
    default: 0.5,
    impact: 'Higher prices mean more token burn but may reduce demand.',
    category: 'service',
  },
  
  servicePriceElasticity: {
    name: 'Service Price Elasticity',
    description: 'How quickly service price responds to scarcity.',
    unit: 'coefficient',
    min: 0,
    max: 2,
    default: 0.6,
    impact: 'Higher values cause more volatile service pricing.',
    category: 'service',
  },
  
  minServicePrice: {
    name: 'Min Service Price',
    description: 'Floor for service price.',
    unit: 'USD/unit',
    min: 0.001,
    max: 1,
    default: 0.05,
    impact: 'Prevents service from becoming too cheap.',
    category: 'service',
  },
  
  maxServicePrice: {
    name: 'Max Service Price',
    description: 'Ceiling for service price.',
    unit: 'USD/unit',
    min: 1,
    max: 1000,
    default: 5.0,
    impact: 'Prevents service from becoming prohibitively expensive.',
    category: 'service',
  },
  
  rewardLagWeeks: {
    name: 'Reward Lag',
    description: 'Weeks delay between service provision and reward receipt.',
    unit: 'weeks',
    min: 0,
    max: 12,
    default: 6,
    impact: 'Longer lag creates cash flow challenges for providers.',
    category: 'provider',
  },
  
  nSims: {
    name: 'Monte Carlo Runs',
    description: 'Number of simulation runs for statistical confidence.',
    unit: 'count',
    min: 10,
    max: 1000,
    default: 100,
    impact: 'More runs = better statistics but slower computation.',
    category: 'simulation',
  },
  
  seed: {
    name: 'Random Seed',
    description: 'Seed for random number generator. Same seed = reproducible results.',
    unit: 'integer',
    min: 0,
    max: 2147483647,
    default: 42,
    impact: 'Change to explore different random scenarios.',
    category: 'simulation',
  },
};

// ============================================================================
// PROTOCOL PRESETS
// ============================================================================

export const PROTOCOL_PROFILES: ProtocolProfileV1[] = [
  {
    version: '1.1',
    metadata: {
      id: 'ono_v3_calibrated',
      name: 'ONO',
      mechanism: 'Fixed Emissions w/ Partial Burn',
      notes: 'Expert calibrated based on 2024 interviews. Low node count target (30-100).',
      source: 'Interview-Derived',
    },
    parameters: {
      supply: { value: 100_000_000, unit: 'tokens' },
      emissions: { value: 250_000, unit: 'tokens/week' },
      burn_fraction: { value: 0.65, unit: 'decimal' },
      adjustment_lag: { value: 6, unit: 'weeks' },
      demand_regime: { value: 'growth', unit: 'category' },
      provider_economics: {
        opex_weekly: { value: 25.96, unit: 'chf/week' },
        churn_threshold: { value: 10, unit: 'chf/week_profit' },
      },
    },
  },
  {
    version: '1.1',
    metadata: {
      id: 'helium_bme_v1',
      name: 'Helium-like',
      mechanism: 'Burn-and-Mint Equilibrium',
      notes: 'Modelled after BME structures. High node count capability. 100% burn of service fees.',
      source: 'Placeholder-Derived',
    },
    parameters: {
      supply: { value: 100_000_000, unit: 'tokens' },
      emissions: { value: 1_250_000, unit: 'tokens/week' },
      burn_fraction: { value: 1.0, unit: 'decimal' },
      adjustment_lag: { value: 0, unit: 'weeks' },
      demand_regime: { value: 'consistent', unit: 'category' },
      provider_economics: {
        opex_weekly: { value: 50.0, unit: 'chf/week' },
        churn_threshold: { value: 5.0, unit: 'chf/week_profit' },
      },
    },
  },
  {
    version: '1.1',
    metadata: {
      id: 'adaptive_elastic_v1',
      name: 'Adaptive',
      mechanism: 'Algorithmic Supply Adjustment',
      notes: 'Elastic supply protocol. Low opex threshold node operations.',
      source: 'Placeholder-Derived',
    },
    parameters: {
      supply: { value: 50_000_000, unit: 'tokens' },
      emissions: { value: 100_000, unit: 'tokens/week' },
      burn_fraction: { value: 0.5, unit: 'decimal' },
      adjustment_lag: { value: 2, unit: 'weeks' },
      demand_regime: { value: 'volatile', unit: 'category' },
      provider_economics: {
        opex_weekly: { value: 15.0, unit: 'chf/week' },
        churn_threshold: { value: 15.0, unit: 'chf/week_profit' },
      },
    },
  },
  {
    version: '1.1',
    metadata: {
      id: 'death_spiral_test',
      name: 'Death Spiral',
      mechanism: 'Stress Test Scenario',
      notes: 'Designed to trigger protocol failure. High costs, low burn, bearish conditions.',
      source: 'Placeholder-Derived',
    },
    parameters: {
      supply: { value: 100_000_000, unit: 'tokens' },
      emissions: { value: 500_000, unit: 'tokens/week' },
      burn_fraction: { value: 0.1, unit: 'decimal' },
      adjustment_lag: { value: 8, unit: 'weeks' },
      demand_regime: { value: 'high-to-decay', unit: 'category' },
      provider_economics: {
        opex_weekly: { value: 75.0, unit: 'chf/week' },
        churn_threshold: { value: 20.0, unit: 'chf/week_profit' },
      },
    },
  },
];

/**
 * Get tooltip text for a parameter
 */
export function getParamTooltip(key: keyof SimulationParams): string {
  const doc = PARAM_DOCS[key];
  if (!doc) return '';
  return `${doc.description}\n\nRange: ${doc.min} - ${doc.max} ${doc.unit}\nDefault: ${doc.default}\n\nImpact: ${doc.impact}`;
}

/**
 * Validate parameters are within acceptable ranges
 */
export function validateParams(params: SimulationParams): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (const [key, value] of Object.entries(params)) {
    const doc = PARAM_DOCS[key as keyof SimulationParams];
    if (!doc) continue;
    
    if (typeof value === 'number') {
      if (value < doc.min) {
        errors.push(`${doc.name} (${value}) is below minimum (${doc.min})`);
      }
      if (value > doc.max) {
        errors.push(`${doc.name} (${value}) is above maximum (${doc.max})`);
      }
    }
  }
  
  return { valid: errors.length === 0, errors };
}

