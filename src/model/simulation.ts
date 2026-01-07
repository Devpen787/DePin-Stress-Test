/**
 * DePIN Stress Test - Core Simulation Engine
 * Individual provider agent-based model with complete token flow
 * Based on Volt-Capital/depin_sim architecture
 */

import type {
  SimulationParams,
  SimResult,
  Provider,
  ProviderPool,
  AggregateResult,
  MetricStats,
} from './types';
import { SeededRNG } from './rng';
import { generateDemandSeries } from './demand';

// ============================================================================
// PROVIDER AGENT FUNCTIONS
// ============================================================================

/**
 * Create a new provider with heterogeneous characteristics
 */
function createProvider(
  rng: SeededRNG,
  params: SimulationParams,
  joinedWeek: number
): Provider {
  // Heterogeneous capacity (normal distribution around base)
  const capacity = Math.max(
    10,
    params.baseCapacityPerProvider * (1 + params.capacityStdDev * rng.normal())
  );

  // Heterogeneous costs (normal distribution around base)
  const operationalCost = Math.max(
    1,
    params.providerCostPerWeek * (1 + params.costStdDev * rng.normal())
  );

  return {
    id: rng.uuid(),
    capacity,
    operationalCost,
    joinedWeek,
    cumulativeProfit: 0,
    consecutiveLossWeeks: 0,
    isActive: true,
  };
}

/**
 * Initialise provider pool with heterogeneous providers
 */
function initialiseProviders(
  rng: SeededRNG,
  params: SimulationParams
): ProviderPool {
  const active: Provider[] = [];

  for (let i = 0; i < params.initialProviders; i++) {
    active.push(createProvider(rng, params, 0));
  }

  return {
    active,
    churned: [],
    pending: [],
  };
}

/**
 * Calculate total capacity from active providers
 */
function getTotalCapacity(pool: ProviderPool): number {
  return pool.active.reduce((sum, p) => sum + p.capacity, 0);
}

/**
 * Process provider decisions (stay/leave)
 */
function processProviderDecisions(
  pool: ProviderPool,
  providerProfits: Map<string, number>,
  params: SimulationParams,
  currentWeek: number,
  rng: SeededRNG
): { pool: ProviderPool; churnCount: number; joinCount: number } {
  const newActive: Provider[] = [];
  const newChurned: Provider[] = [...pool.churned];
  let churnCount = 0;

  // Process each active provider's stay/leave decision
  for (const provider of pool.active) {
    const profit = providerProfits.get(provider.id) || 0;

    // Update provider state
    provider.cumulativeProfit += profit;

    if (profit < params.churnThreshold) {
      provider.consecutiveLossWeeks++;
    } else {
      provider.consecutiveLossWeeks = Math.max(0, provider.consecutiveLossWeeks - 1);
    }

    // Churn decision based on consecutive loss weeks
    // Probability increases with consecutive losses
    const churnProbability = calculateChurnProbability(
      provider.consecutiveLossWeeks,
      profit,
      params
    );

    if (rng.next() < churnProbability) {
      // Provider leaves
      provider.isActive = false;
      newChurned.push(provider);
      churnCount++;
    } else {
      newActive.push(provider);
    }
  }

  // Cap churn rate
  const maxChurn = Math.floor(pool.active.length * params.maxProviderChurnRate);
  if (churnCount > maxChurn) {
    // Some providers who were going to churn stay instead
    const excess = churnCount - maxChurn;
    for (let i = 0; i < excess; i++) {
      const provider = newChurned.pop();
      if (provider) {
        provider.isActive = true;
        newActive.push(provider);
        churnCount--;
      }
    }
  }

  // Process pending providers (hardware lead time)
  const newPending: Provider[] = [];
  let joinCount = 0;

  for (const provider of pool.pending) {
    if (currentWeek - provider.joinedWeek >= params.hardwareLeadTime) {
      // Provider comes online
      newActive.push(provider);
      joinCount++;
    } else {
      newPending.push(provider);
    }
  }

  // Attract new providers based on expected profit
  const avgProfit = calculateAverageProfit(providerProfits);
  if (avgProfit > params.profitThresholdToJoin) {
    const attractiveness = (avgProfit - params.profitThresholdToJoin) / params.profitThresholdToJoin;
    const potentialJoins = Math.floor(
      newActive.length * params.maxProviderGrowthRate * Math.min(1, attractiveness)
    );

    for (let i = 0; i < potentialJoins; i++) {
      // Add to pending (will come online after lead time)
      newPending.push(createProvider(rng, params, currentWeek));
    }
  }

  return {
    pool: {
      active: newActive,
      churned: newChurned,
      pending: newPending,
    },
    churnCount,
    joinCount,
  };
}

/**
 * Calculate churn probability based on provider state
 */
function calculateChurnProbability(
  consecutiveLossWeeks: number,
  currentProfit: number,
  params: SimulationParams
): number {
  // Base probability increases with consecutive losses
  let prob = 0;

  if (consecutiveLossWeeks > 0) {
    prob = 0.05; // 5% base after 1 week of loss
  }
  if (consecutiveLossWeeks > 2) {
    prob = 0.15; // 15% after 3 weeks
  }
  if (consecutiveLossWeeks > 5) {
    prob = 0.40; // 40% after 6 weeks
  }
  if (consecutiveLossWeeks > 8) {
    prob = 0.70; // 70% after 9 weeks
  }

  // Increase probability if profit is very negative
  if (currentProfit < -params.churnThreshold) {
    prob += 0.1;
  }

  return Math.min(prob, 0.9); // Cap at 90%
}

/**
 * Calculate average profit across all providers
 */
function calculateAverageProfit(providerProfits: Map<string, number>): number {
  if (providerProfits.size === 0) return 0;
  const total = Array.from(providerProfits.values()).reduce((a, b) => a + b, 0);
  return total / providerProfits.size;
}

// ============================================================================
// TOKEN FLOW FUNCTIONS
// ============================================================================

/**
 * Calculate buy pressure from users purchasing tokens for service
 */
function calculateBuyPressure(
  demandServed: number,
  servicePrice: number,
  tokenPrice: number
): number {
  // Users buy tokens to pay for service
  // Buy pressure = USD value of service / token price
  const usdSpent = demandServed * servicePrice;
  return usdSpent / Math.max(tokenPrice, 0.0001);
}

/**
 * Calculate sell pressure from providers covering costs
 * This is the KEY missing mechanic from the original implementation
 */
function calculateSellPressure(
  providers: Provider[],
  rewardPerCapacityUnit: number,
  tokenPrice: number
): { totalSellPressure: number; providerProfits: Map<string, number> } {
  const providerProfits = new Map<string, number>();
  let totalSellPressure = 0;

  for (const provider of providers) {
    // Provider's token reward based on their capacity share
    const tokenReward = rewardPerCapacityUnit * provider.capacity;
    const rewardValueUSD = tokenReward * tokenPrice;

    // Provider sells tokens to cover operational costs
    // They sell the minimum of their reward or their costs
    const tokensToSell = Math.min(tokenReward, provider.operationalCost / Math.max(tokenPrice, 0.0001));
    totalSellPressure += tokensToSell;

    // Calculate profit (reward value - costs)
    const profit = rewardValueUSD - provider.operationalCost;
    providerProfits.set(provider.id, profit);
  }

  return { totalSellPressure, providerProfits };
}

// ============================================================================
// MAIN SIMULATION
// ============================================================================

/**
 * Run a single simulation with individual provider agents
 */
export function simulateOne(params: SimulationParams, simSeed: number): SimResult[] {
  const rng = new SeededRNG(simSeed);

  // Macro conditions
  let mu = 0.002;
  let sigma = 0.05;
  if (params.macro === 'bearish') {
    mu = -0.01;
    sigma = 0.06;
  } else if (params.macro === 'bullish') {
    mu = 0.015;
    sigma = 0.06;
  }

  // Generate demand series
  const demands = generateDemandSeries(
    params.T,
    params.baseDemand,
    params.demandType,
    params.demandVolatility,
    rng
  );

  // Initialise state
  let tokenSupply = params.initialSupply;
  let tokenPrice = params.initialPrice;
  let servicePrice = params.baseServicePrice;
  let providerPool = initialiseProviders(rng, params);

  // Reward history for lag
  const rewardHistoryLength = Math.max(1, params.rewardLagWeeks + 1);
  const rewardHistory: number[] = new Array(rewardHistoryLength).fill(
    params.providerCostPerWeek * 1.5
  );

  let previousProfits: Map<string, number> | null = null;
  const results: SimResult[] = [];

  for (let t = 0; t < params.T; t++) {
    let churnCount = 0;
    let joinCount = 0;

    if (previousProfits) {
      const decision = processProviderDecisions(
        providerPool,
        previousProfits,
        params,
        t,
        rng
      );
      providerPool = decision.pool;
      churnCount = decision.churnCount;
      joinCount = decision.joinCount;
    }

    // ========================================
    // PHASE 1: DEMAND & SERVICE
    // ========================================
    const demand = demands[t];
    const totalCapacity = Math.max(1, getTotalCapacity(providerPool));
    const demandServed = Math.min(demand, totalCapacity);
    const utilisation = (demandServed / totalCapacity) * 100;
    const scarcity = (demand - totalCapacity) / totalCapacity;

    // Update service price based on scarcity
    servicePrice = Math.min(
      params.maxServicePrice,
      Math.max(
        params.minServicePrice,
        servicePrice * (1 + params.servicePriceElasticity * scarcity)
      )
    );

    // ========================================
    // PHASE 2: TOKEN FLOWS
    // ========================================

    // Buy pressure: Users buy tokens to pay for service
    const buyPressure = calculateBuyPressure(demandServed, servicePrice, tokenPrice);

    // Calculate tokens spent and burned
    const tokensSpent = buyPressure;
    const burnedRaw = params.burnPct * tokensSpent;
    const burned = Math.min(tokenSupply * 0.95, burnedRaw);

    // ========================================
    // PHASE 3: EMISSIONS & REWARDS
    // ========================================

    // Dynamic emissions based on demand (sigmoid growth + saturation dampening)
    const saturation = Math.min(1.0, providerPool.active.length / 5000.0);
    const emissionFactor = 0.6 + 0.4 * Math.tanh(demand / 15000.0) - 0.2 * saturation;
    const minted = Math.max(0, Math.min(params.maxMintWeekly, params.maxMintWeekly * emissionFactor));

    // Reward per unit of capacity
    const rewardPerCapacityUnit = minted / Math.max(totalCapacity, 1);

    // ========================================
    // PHASE 4: PROVIDER ECONOMICS (NEW!)
    // ========================================

    // Calculate sell pressure from providers covering costs
    const { totalSellPressure, providerProfits } = calculateSellPressure(
      providerPool.active,
      rewardPerCapacityUnit,
      tokenPrice
    );

    // Average profit and incentive
    const avgProfit = calculateAverageProfit(providerProfits);
    previousProfits = providerProfits;

    // Push to reward history (for delayed reward signal)
    const instantRewardValue = (minted / Math.max(providerPool.active.length, 1)) * tokenPrice;
    rewardHistory.push(instantRewardValue);
    if (rewardHistory.length > rewardHistoryLength) {
      rewardHistory.shift();
    }
    const delayedReward = rewardHistory[0];
    const incentive = (delayedReward - params.providerCostPerWeek) / params.providerCostPerWeek;

    // ========================================
    // PHASE 5: PRICE UPDATE (NOW WITH SELL PRESSURE!)
    // ========================================

    // Net token flow affecting price
    const netFlow = buyPressure - totalSellPressure - burned;

    // Price dynamics with buy/sell pressure
    const buyPressureEffect = params.kBuyPressure * Math.tanh(buyPressure / tokenSupply * 100);
    const sellPressureEffect = -params.kSellPressure * Math.tanh(totalSellPressure / tokenSupply * 100);
    const demandPressure = params.kDemandPrice * Math.tanh(scarcity);
    const dilutionPressure = -params.kMintPrice * (minted / tokenSupply) * 100;

    const logReturn =
      mu +
      buyPressureEffect +
      sellPressureEffect +
      demandPressure +
      dilutionPressure +
      sigma * rng.normal();

    const nextPrice = Math.max(0.01, tokenPrice * Math.exp(logReturn));

    // ========================================
    // PHASE 6: SUPPLY UPDATE
    // ========================================
    tokenSupply = Math.max(1000, tokenSupply + minted - burned);

    // ========================================
    // RECORD RESULTS
    // ========================================
    results.push({
      t,
      price: tokenPrice,
      supply: tokenSupply,
      demand,
      demandServed,
      providers: providerPool.active.length,
      capacity: totalCapacity,
      servicePrice,
      minted,
      burned,
      utilisation,
      profit: avgProfit,
      scarcity,
      incentive,
      buyPressure,
      sellPressure: totalSellPressure,
      netFlow,
      churnCount,
      joinCount,
    });

    // Update state for next iteration
    tokenPrice = nextPrice;
  }

  return results;
}

// ============================================================================
// AGGREGATION
// ============================================================================

/**
 * Calculate statistics for a set of values
 */
function calculateStats(values: number[]): MetricStats {
  if (values.length === 0) {
    return { mean: 0, p10: 0, p90: 0, min: 0, max: 0, stdDev: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const p10 = sorted[Math.floor(n * 0.1)] || 0;
  const p90 = sorted[Math.floor(n * 0.9)] || 0;
  const min = sorted[0];
  const max = sorted[n - 1];
  const variance = values.reduce((sum, x) => sum + (x - mean) ** 2, 0) / n;
  const stdDev = Math.sqrt(variance);

  return { mean, p10, p90, min, max, stdDev };
}

/**
 * Run Monte Carlo simulation and aggregate results
 */
export function runSimulation(params: SimulationParams): AggregateResult[] {
  const allSims: SimResult[][] = [];

  // Run all simulations
  for (let i = 0; i < params.nSims; i++) {
    allSims.push(simulateOne(params, params.seed + i));
  }

  // Aggregate results
  const aggregate: AggregateResult[] = [];
  const keys: (keyof SimResult)[] = [
    'price',
    'supply',
    'demand',
    'demandServed',
    'providers',
    'capacity',
    'servicePrice',
    'minted',
    'burned',
    'utilisation',
    'profit',
    'scarcity',
    'incentive',
    'buyPressure',
    'sellPressure',
    'netFlow',
    'churnCount',
    'joinCount',
  ];

  for (let t = 0; t < params.T; t++) {
    const step: Partial<AggregateResult> = { t };

    for (const key of keys) {
      const values = allSims
        .map((sim) => sim[t]?.[key] as number)
        .filter((v) => v !== undefined && !isNaN(v));

      (step as Record<string, MetricStats>)[key] = calculateStats(values);
    }

    aggregate.push(step as AggregateResult);
  }

  return aggregate;
}
