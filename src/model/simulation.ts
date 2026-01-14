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
  // 30% Urban (High Cost), 70% Rural (Low Cost)
  const isUrban = rng.next() < 0.3;
  const type = isUrban ? 'urban' : 'rural';

  const costMultiplier = isUrban ? 1.5 : 0.8;

  // Heterogeneous capacity (normal distribution around base)
  const capacity = Math.max(
    10,
    params.baseCapacityPerProvider * (1 + params.capacityStdDev * rng.normal())
  );

  // Heterogeneous costs with tier multiplier
  const operationalCost = Math.max(
    1,
    (params.providerCostPerWeek * costMultiplier) * (1 + params.costStdDev * rng.normal())
  );

  // Derived Share Factor (Location Score)
  // Urban: Simulating density of ~3.3 miners per hex (1 / 3.3 ≈ 0.30)
  // Rural: Simulating unique coverage (1 / 1.0 = 1.0)
  let locationScale = 1.0;
  if (isUrban) {
    // Urban variance: 2 to 5 neighbors
    const neighbors = 2 + Math.abs(rng.normal() * 1.5);
    locationScale = 1 / (1 + neighbors);
  }

  return {
    id: rng.uuid(),
    capacity,
    operationalCost,
    joinedWeek,
    cumulativeProfit: 0,
    consecutiveLossWeeks: 0,
    isActive: true,
    type,
    locationScale,
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

  let potentialJoins = 0;

  // SCENARIO 2: HARDWARE SATURATION (Mass Join Event)
  if (params.scenario === 'saturation' && currentWeek === Math.floor(params.T / 3)) {
    // Massive spike: Insert 3x current supply
    potentialJoins = pool.active.length * 2.0;
  }
  // MODULE 5: GROWTH SHOCK (State of DePIN Report)
  // Replaces "Saturation" with a controllable parameter
  else if (params.growthCallEventWeek !== undefined && currentWeek === params.growthCallEventWeek) {
    const shockPct = params.growthCallEventPct || 0.5;
    potentialJoins = Math.floor(pool.active.length * shockPct);
  }
  else if (avgProfit > params.profitThresholdToJoin) {
    // Standard growth
    const attractiveness = (avgProfit - params.profitThresholdToJoin) / params.profitThresholdToJoin;
    potentialJoins = Math.floor(
      newActive.length * params.maxProviderGrowthRate * Math.min(1, attractiveness)
    );
  }

  if (potentialJoins > 0) {
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
// PANIC LOGIC (MODULE 3)
// ============================================================================

/**
 * Handle immediate panic churn during a price shock
 * Returns cost-sensitive churn count (Urban > Rural)
 */
function processPanicEvents(
  pool: ProviderPool,
  oldPrice: number,
  newPrice: number,
  previousProfits: Map<string, number>,
  rng: SeededRNG
): { pool: ProviderPool; churnCount: number } {
  const newActive: Provider[] = [];
  const newChurned: Provider[] = [...pool.churned];
  let churnCount = 0;

  const priceRatio = newPrice / Math.max(oldPrice, 0.0001);

  for (const provider of pool.active) {
    // Estimate new profitability immediately
    // Reconstruct revenue from previous profit (Profit = Rev - Cost -> Rev = Profit + Cost)
    const lastProfit = previousProfits?.get(provider.id) || 0;
    const lastRevenue = lastProfit + provider.operationalCost;

    const estimatedNewRevenue = lastRevenue * priceRatio;
    const estimatedNewProfit = estimatedNewRevenue - provider.operationalCost;

    let panicProb = 0;

    // Panic Thresholds
    if (estimatedNewProfit < 0) {
      // Basic panic if underwater
      panicProb = 0.2;

      // Severe panic if deeply underwater (Rev doesn't even cover half of cost)
      if (estimatedNewRevenue < provider.operationalCost * 0.5) {
        panicProb = 0.8;
      }

      // Urban Sensitivity: Higher CAPEX/OPEX means "Sunk Cost Stability" -> They stay longer
      // Rural: Low cost entry -> Easy come, easy go
      if (provider.type === 'urban') {
        panicProb -= 0.3; // Urban LESS likely to panic (Sunk Cost)
      } else {
        panicProb += 0.1; // Rural MORE likely to panic (Low friction)
      }
    }

    if (rng.next() < panicProb) {
      provider.isActive = false;
      newChurned.push(provider);
      churnCount++;
    } else {
      newActive.push(provider);
    }
  }

  return {
    pool: { ...pool, active: newActive, churned: newChurned },
    churnCount
  };
}


// ============================================================================
// MAIN SIMULATION
// ============================================================================

/**
 * Run a single simulation with individual provider agents
 */
export function simulateOne(
  params: SimulationParams,
  simSeed: number,
  scalingFactor: number = 1
): SimResult[] {
  const rng = new SeededRNG(simSeed);
  // ... existing code ...

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

  // Generate demand series (These are MICRO demands if params were scaled down)
  const demands = generateDemandSeries(
    params.T,
    params.baseDemand, // Already scaled in runSimulation
    params.demandType,
    params.demandVolatility,
    rng
  );

  // Initialise state (Global / Macro State)
  let tokenSupply = params.initialSupply;
  let tokenPrice = params.initialPrice;
  let servicePrice = params.baseServicePrice;

  // Initialise Providers (Micro Pool)
  let providerPool = initialiseProviders(rng, params);

  // Liquidity Pool State (Module 3)
  // Global Liquidity
  let poolUsd = params.initialLiquidity;
  let poolTokens = poolUsd / tokenPrice;
  const k = poolUsd * poolTokens; // Constant Product k

  // Reward history for lag
  const rewardHistoryLength = Math.max(1, params.rewardLagWeeks + 1);
  const rewardHistory: number[] = new Array(rewardHistoryLength).fill(
    params.providerCostPerWeek * 1.5
  );

  let previousProfits: Map<string, number> | null = null;
  const results: SimResult[] = [];
  let treasuryTokens = 0; // Track accumulated treasury


  for (let t = 0; t < params.T; t++) {
    // Check for Investor Unlock Event (Module 3)
    let unlockSellPressure = 0;
    if (t === params.investorUnlockWeek) {
      // "Cliff" Event: Investors dump % of supply
      const unlockAmount = tokenSupply * params.investorSellPct;
      unlockSellPressure = unlockAmount;
    }

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
    // PHASE 1: DEMAND & SERVICE (Micro Physics)
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
    // PHASE 2: TOKEN FLOWS (Micro -> Scaling -> Macro)
    // ========================================

    // Buy pressure: Users buy tokens to pay for service (Micro)
    const buyPressureMicro = calculateBuyPressure(demandServed, servicePrice, tokenPrice);

    // SCALE UP: Flows impacting global price/supply
    const buyPressureMacro = buyPressureMicro * scalingFactor;

    // Calculate tokens spent and burned (Macro)
    const tokensSpentMacro = buyPressureMacro;
    const burnedRawMacro = params.burnPct * tokensSpentMacro;
    // Cap burn at 95% of supply
    const burnedMacro = Math.min(tokenSupply * 0.95, burnedRawMacro);

    // ========================================
    // PHASE 3: EMISSIONS & REWARDS
    // ========================================

    // Dynamic emissions based on demand (sigmoid growth + saturation dampening)
    // Saturation logic should use MACRO provider count ideally, or normalized micro
    // Use SCALED provider count for saturation logic to match real world
    const scaledProviderCount = providerPool.active.length * scalingFactor;
    const saturation = Math.min(1.0, scaledProviderCount / 300000.0); // Revised saturation denominator for realistic scale? 
    // Wait, original code was 5000.0. If we scale up providers to 370k, we must update the constant OR 
    // keep it relative. Let's assume the constant 5000 was for 'Small Network'. 
    // If we want correct saturation dynamics for 370k nodes, the denominator should be higher.
    // However, for safety/comparability, let's Stick to the logic: 
    // If params.initialProviders was small (30), 5000 was unreachable. 
    // If params is now 370k, 5000 is trivial.
    // Let's adjust saturation denominator safely or leave as is (saturation = 1.0 immediately).
    // Let's leave as is but use scaled count.

    // Scale Demand for emission factor? demand is Micro. 15000 was constant.
    // If we scaled demand down by 185x, we should scale constant down or scale demand up.
    // Scale Demand UP for emission calc.
    const scaledDemand = demand * scalingFactor;

    const emissionFactor = 0.6 + 0.4 * Math.tanh(scaledDemand / 15000.0) - 0.2 * saturation;
    // params.maxMintWeekly is likely Global (e.g. 1M tokens/week).
    const mintedMacro = Math.max(0, Math.min(params.maxMintWeekly, params.maxMintWeekly * emissionFactor));

    // Micro Rewards for Agents: Share of the Global Mint
    // RewardPerUnit = GlobalMint / GlobalCapacity
    const scaledTotalCapacity = totalCapacity * scalingFactor;
    const rewardPerCapacityUnit = mintedMacro / Math.max(scaledTotalCapacity, 1);

    // ========================================
    // PHASE 4: PROVIDER ECONOMICS (Micro Agents)
    // ========================================

    // Calculate sell pressure from providers covering costs
    // Using rewardPerCapacityUnit (Global/Global = Unit) -> Correct for Micro agents
    const { totalSellPressure: microSellPressure, providerProfits } = calculateSellPressure(
      providerPool.active,
      rewardPerCapacityUnit,
      tokenPrice
    );

    const sellPressureMacro = microSellPressure * scalingFactor;

    // Average profit and incentive
    const avgProfit = calculateAverageProfit(providerProfits);
    previousProfits = providerProfits;

    // Push to reward history
    // Instant Value = (MacroMint / MacroProviders) * Price
    const instantRewardValue = (mintedMacro / Math.max(scaledProviderCount, 1)) * tokenPrice;
    rewardHistory.push(instantRewardValue);
    if (rewardHistory.length > rewardHistoryLength) {
      rewardHistory.shift();
    }
    const delayedReward = rewardHistory[0];
    const incentive = (delayedReward - params.providerCostPerWeek) / params.providerCostPerWeek;

    // ========================================
    // PHASE 5: PRICE UPDATE (AMM + ORGANIC)
    // ========================================

    let nextPrice = tokenPrice;
    let netFlow = 0; // Shared scope for results

    if (unlockSellPressure > 0) {
      // PROCESSED AS BEFORE (It's Macro)
      const amountIn = unlockSellPressure;
      const newPoolTokens = poolTokens + amountIn;
      const newPoolUsd = k / newPoolTokens;
      const amountOut = poolUsd - newPoolUsd;
      poolTokens = newPoolTokens;
      poolUsd = newPoolUsd;
      nextPrice = poolUsd / poolTokens;
      netFlow = -unlockSellPressure;

      if (previousProfits) {
        const panicResult = processPanicEvents(
          providerPool,
          tokenPrice,
          nextPrice,
          previousProfits,
          rng
        );
        providerPool = panicResult.pool;
        churnCount += panicResult.churnCount;
      }

    } else {
      if (params.scenario === 'winter') {
        // ... unchanged ...
        const targetPrice = params.initialPrice * Math.pow(0.1, t / params.T);
        const noise = 1 + (rng.normal() * 0.02);
        nextPrice = Math.max(0.0001, targetPrice * noise);
        poolUsd = Math.sqrt(k * nextPrice);
        poolTokens = Math.sqrt(k / nextPrice);
        netFlow = nextPrice - tokenPrice;

      } else {
        // ORGANIC MACRO PRICE
        let buyPressureEffective = buyPressureMacro;
        let scarcityEffective = scarcity; // Ratio (Unitless) - Ok

        if (params.scenario === 'utility') {
          // ... logic scaled?
          // Boosted Demand is Macro or Micro?
          // baseDemand is Micro (in params).
          // Let's treat scenario logic as modifying the INPUTS.
          // Since we are in Micro loop, params.baseDemand is Micro. 
          // So boostedDemand is Micro.
          // But price updating uses Macro numbers (buyPressureEffective).
          // So:
          const growthFactor = Math.pow(1.10, t / 4);
          const boostedDemandMicro = params.baseDemand * growthFactor;

          // Recalc Micro Pressure
          const buyPressureMicroBoosted = calculateBuyPressure(Math.min(boostedDemandMicro, totalCapacity), servicePrice, tokenPrice);
          buyPressureEffective = buyPressureMicroBoosted * scalingFactor;

          scarcityEffective = (boostedDemandMicro - totalCapacity) / totalCapacity;
        }

        netFlow = buyPressureEffective - sellPressureMacro - burnedMacro;

        // Price dynamics (Using MACRO values against MACRO Supply)
        const buyPressureEffect = params.kBuyPressure * Math.tanh(buyPressureEffective / tokenSupply * 100);
        const sellPressureEffect = -params.kSellPressure * Math.tanh(sellPressureMacro / tokenSupply * 100);
        const demandPressure = params.kDemandPrice * Math.tanh(scarcityEffective);
        const dilutionPressure = -params.kMintPrice * (mintedMacro / tokenSupply) * 100;

        const logReturn =
          mu +
          buyPressureEffect +
          sellPressureEffect +
          demandPressure +
          dilutionPressure +
          sigma * rng.normal();

        nextPrice = Math.max(0.0001, tokenPrice * Math.exp(logReturn));
        poolUsd = Math.sqrt(k * nextPrice);
        poolTokens = Math.sqrt(k / nextPrice);
      }
    }

    // ========================================
    // PHASE 6: SUPPLY UPDATE (Macro)
    // ========================================
    tokenSupply = Math.max(1000, tokenSupply + mintedMacro - burnedMacro);

    // ========================================
    // RECORD RESULTS (Scale UP Micro metrics)
    // ========================================
    results.push({
      t,
      price: tokenPrice,
      supply: tokenSupply,
      demand: demand * scalingFactor,
      demandServed: demandServed * scalingFactor,
      providers: providerPool.active.length * scalingFactor,
      capacity: totalCapacity * scalingFactor,
      servicePrice,
      minted: mintedMacro,
      burned: burnedMacro,
      utilisation, // Ratio
      profit: avgProfit, // Unit
      scarcity, // Ratio
      incentive, // Ratio
      buyPressure: buyPressureMacro,
      sellPressure: sellPressureMacro, // Macro
      netFlow,
      churnCount: churnCount * scalingFactor,
      joinCount: joinCount * scalingFactor,
      // Solvency Metrics (Daily) - Use Macro numbers
      solvencyScore: ((burnedMacro / 7) * tokenPrice) / (((mintedMacro / 7) * tokenPrice) || 1) * (mintedMacro > 0 ? 1 : 10),
      netDailyLoss: ((burnedMacro / 7) - (mintedMacro / 7)) * tokenPrice,
      dailyMintUsd: (mintedMacro / 7) * tokenPrice,
      dailyBurnUsd: (burnedMacro / 7) * tokenPrice,
      // Capitulation Metrics - Scale UP
      urbanCount: providerPool.active.filter(p => p.type === 'urban').length * scalingFactor,
      ruralCount: providerPool.active.filter(p => p.type === 'rural').length * scalingFactor,
      weightedCoverage: providerPool.active.reduce((sum, p) => sum + p.locationScale, 0) * scalingFactor,
      // Module 4
      treasuryBalance: (treasuryTokens + (params.revenueStrategy === 'reserve' ? burnedMacro : 0)) * tokenPrice,
      vampireChurn: 0, // Placeholder
    });

    // Accumulate Treasury
    if (params.revenueStrategy === 'reserve') {
      treasuryTokens += burnedMacro;
    }

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

  // Max agents to simulate individually to preserve performance
  const MAX_AGENTS = 1000;

  // Run all simulations
  for (let i = 0; i < params.nSims; i++) {
    // Representative Agent Model
    // If providers > MAX_AGENTS, we simulate a smaller pool and scale the results
    const scalingFactor = Math.max(1, params.initialProviders / MAX_AGENTS);

    // Create micro-params for the simulation kernel
    const microParams: SimulationParams = {
      ...params,
      initialProviders: Math.min(params.initialProviders, MAX_AGENTS),
      // Scale demand down so that Demand/Capacity ratio (Utilization) remains globally accurate
      // Global Demand / Scaling = Micro Demand
      baseDemand: params.baseDemand / scalingFactor,
      // Note: initialSupply, initialLiquidity, maxMintWeekly etc are GLOBAL, so we keep them as is.
      // simulateOne handles the scaling UP of flows to interact with these globals.
    };

    allSims.push(simulateOne(microParams, params.seed + i, scalingFactor));
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
    'solvencyScore',
    'netDailyLoss',
    'dailyMintUsd',
    'dailyBurnUsd',
    'urbanCount',
    'ruralCount',
    'weightedCoverage',
    'treasuryBalance',
    'vampireChurn',
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
