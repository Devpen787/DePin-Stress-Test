import { SeededRNG } from '../rng';
import { DemandType, MacroCondition, MetricStats } from '../types';

export interface LegacySimulationParams {
    T: number;
    initialSupply: number;
    initialPrice: number;
    maxMintWeekly: number;
    burnPct: number;

    // Liquidity & Investor Unlock (Module 3)
    initialLiquidity: number;
    investorUnlockWeek: number;
    investorSellPct: number;

    demandType: DemandType;
    macro: MacroCondition;
    nSims: number;
    seed: number;
    providerCostPerWeek: number;
    baseCapacityPerProvider: number;
    kDemandPrice: number;
    kMintPrice: number;
    rewardLagWeeks: number;
    churnThreshold: number;
    hardwareCost: number; // [NEW] Added for customizable payback calc

    // Module 4: Competitive Resilience (Risk Engine)
    competitorYield: number;  // 0.0 to 2.0 (0% to 200% competitor yield advantage)
    emissionModel: 'fixed' | 'kpi';  // Fixed schedule vs demand-driven
    revenueStrategy: 'burn' | 'reserve';  // Buy & Burn vs Sinking Fund

    // Module 5: Report-Aligned Scenarios
    growthCallEventWeek?: number;        // Week to trigger "Supply Shock"
    growthCallEventPct?: number;         // Magnitude of shock (0.5 = +50%)
}

export interface LegacySimResult {
    t: number;
    price: number;
    supply: number;
    demand: number;
    demand_served: number;
    providers: number;
    capacity: number;
    servicePrice: number;
    minted: number;
    burned: number;
    utilization: number;
    profit: number;
    scarcity: number;
    incentive: number;
    solvencyScore: number;
    netDailyLoss: number;
    dailyMintUsd: number;
    dailyBurnUsd: number;
    netFlow: number;
    churnCount: number;
    joinCount: number;
    treasuryBalance: number;  // Module 4: Accumulated Sinking Fund
    vampireChurn: number;     // Module 4: Churn from competitor yield
}

export interface LegacyAggregateResult {
    t: number;
    price: MetricStats;
    supply: MetricStats;
    demand: MetricStats;
    demand_served: MetricStats;
    providers: MetricStats;
    capacity: MetricStats;
    servicePrice: MetricStats;
    minted: MetricStats;
    burned: MetricStats;
    utilization: MetricStats;
    profit: MetricStats;
    scarcity: MetricStats;
    incentive: MetricStats;
    solvencyScore: MetricStats;
    netDailyLoss: MetricStats;
    dailyMintUsd: MetricStats;
    dailyBurnUsd: MetricStats;
    netFlow: MetricStats;
    churnCount: MetricStats;
    joinCount: MetricStats;
    treasuryBalance: MetricStats;  // Module 4: Accumulated Sinking Fund
    vampireChurn: MetricStats;     // Module 4: Churn from competitor yield
}

export function getDemandSeries(T: number, base: number, type: DemandType, rng: SeededRNG): number[] {
    const series: number[] = [];
    for (let t = 0; t < T; t++) {
        let d = 0;
        if (type === 'consistent') d = base * (1 + 0.03 * rng.normal());
        else if (type === 'high-to-decay') d = base * (1.6 * Math.exp(-t / 10) + 0.6) * (1 + 0.05 * rng.normal());
        else if (type === 'growth') d = base * (0.8 + 0.02 * t) * (1 + 0.05 * rng.normal());
        else if (type === 'volatile') d = base * (1 + 0.20 * rng.normal());
        series.push(Math.max(0, d));
    }
    return series;
}

export function simulateOne(params: LegacySimulationParams, simSeed: number): LegacySimResult[] {
    const rng = new SeededRNG(simSeed);
    const { T, initialSupply, initialPrice, maxMintWeekly, burnPct, demandType, macro,
        providerCostPerWeek, baseCapacityPerProvider, kDemandPrice, kMintPrice, rewardLagWeeks, churnThreshold,
        initialLiquidity, investorUnlockWeek, investorSellPct,
        // Module 4: Competitive Resilience
        competitorYield, emissionModel, revenueStrategy
    } = params;

    let mu = 0.002, sigma = 0.05;
    if (macro === 'bearish') { mu = -0.01; sigma = 0.06; }
    else if (macro === 'bullish') { mu = 0.015; sigma = 0.06; }

    const demands = getDemandSeries(T, 12000, demandType, rng);
    const results: LegacySimResult[] = [];

    let currentSupply = initialSupply;
    let currentPrice = initialPrice;
    let currentProviders = 30;
    let currentServicePrice = 0.5;

    let poolUsd = initialLiquidity;
    let poolTokens = poolUsd / currentPrice;
    const kAmm = poolUsd * poolTokens;

    let consecutiveLowProfitWeeks = 0;
    // Initialize reward history array properly for TS
    const rewardHistory: number[] = new Array(Math.max(1, rewardLagWeeks)).fill(params.providerCostPerWeek * 1.5);

    // Module 4: Treasury tracking for Sinking Fund
    let treasuryBalance = 0;

    for (let t = 0; t < T; t++) {
        const demand = demands[t];
        const capacity = Math.max(0.001, currentProviders * baseCapacityPerProvider);
        const demand_served = Math.min(demand, capacity);
        const utilization = (demand_served / capacity) * 100;

        const scarcity = (demand - capacity) / capacity;
        currentServicePrice = Math.min(Math.max(currentServicePrice * (1 + 0.6 * scarcity), 0.05), 5.0);

        const safePrice = Math.max(currentPrice, 0.0001);
        const tokensSpent = (demand_served * currentServicePrice) / safePrice;

        const burnedRaw = burnPct * tokensSpent;
        const burned = Math.min(currentSupply * 0.95, burnedRaw);

        // Emissions sigmoid growth + saturation dampening
        const saturation = Math.min(1.0, currentProviders / 5000.0);
        let emissionFactor = 0.6 + 0.4 * Math.tanh(demand / 15000.0) - (0.2 * saturation);

        // Module 4: KPI-Based Emissions - reduce emissions during low utilization/bear market
        if (emissionModel === 'kpi') {
            const utilizationRatio = Math.min(1, demand_served / capacity);
            emissionFactor *= Math.max(0.3, utilizationRatio); // Scale by utilization
            // In bear market (low price), reduce emissions further to preserve value
            if (currentPrice < initialPrice * 0.8) {
                emissionFactor *= 0.6;
            }
        }

        const minted = Math.max(0, Math.min(maxMintWeekly, maxMintWeekly * emissionFactor));
        currentSupply = Math.max(1000.0, currentSupply + minted - burned);

        const instantRewardValue = (minted / Math.max(currentProviders, 0.1)) * safePrice;
        rewardHistory.push(instantRewardValue);
        if (rewardHistory.length > Math.max(1, rewardLagWeeks)) rewardHistory.shift();

        const delayedReward = rewardHistory[0];
        const profit = delayedReward - providerCostPerWeek;
        const incentive = profit / providerCostPerWeek;

        if (profit < churnThreshold) {
            consecutiveLowProfitWeeks++;
        } else {
            consecutiveLowProfitWeeks = Math.max(0, consecutiveLowProfitWeeks - 1);
        }

        let churnMultiplier = 1.0;
        if (consecutiveLowProfitWeeks > 2) churnMultiplier = 1.8;
        if (consecutiveLowProfitWeeks > 5) churnMultiplier = 4.0;

        // Dampen provider growth (Max 15% growth per week to simulate hardware leads)
        const maxGrowth = currentProviders * 0.15;
        const rawDelta = (incentive * 4.5 * churnMultiplier) + rng.normal() * 0.5;
        let delta = Math.max(-currentProviders * 0.1, Math.min(maxGrowth, rawDelta));

        // Module 4: Vampire Attack - competitor yield stealing nodes
        let vampireChurnAmount = 0;
        if (competitorYield > 0.2) {
            // Extra churn: 2.5% of providers per 100% yield difference (scaled for weekly, was 10%/month)
            vampireChurnAmount = currentProviders * competitorYield * 0.025;
            delta -= vampireChurnAmount;
        }

        // Module 4: ROI-based churn (payback period triggers)
        const weeklyRewardUsd = instantRewardValue;
        const paybackMonths = weeklyRewardUsd > 0 ? params.hardwareCost / (weeklyRewardUsd * 4.33) : 999;
        if (paybackMonths > 24) delta -= currentProviders * 0.0125; // +5%/month = 1.25%/week
        if (paybackMonths > 36) delta -= currentProviders * 0.025;  // +10%/month additional

        let netFlow = 0;
        let nextPrice = currentPrice;

        if (t === investorUnlockWeek) {
            // SHOCK EVENT
            const unlockAmount = currentSupply * investorSellPct;
            const newPoolTokens = poolTokens + unlockAmount;
            const newPoolUsd = kAmm / newPoolTokens;

            poolTokens = newPoolTokens;
            poolUsd = newPoolUsd;
            nextPrice = poolUsd / poolTokens;
            netFlow = -unlockAmount;

            // Massive panic churn (Dynamic V1 Approximation)
            // Instead of hardcoded 30%, scale by price drop magnitude * sensitivity (1.5x)
            const priceDropPct = Math.max(0, 1 - (nextPrice / currentPrice));
            const panicChurn = currentProviders * priceDropPct * 1.5;
            delta -= panicChurn;
        } else {
            const demandPressure = kDemandPrice * Math.tanh(scarcity);
            const dilutionPressure = -kMintPrice * (minted / currentSupply) * 100;
            const logRet = mu + demandPressure + dilutionPressure + sigma * rng.normal();
            nextPrice = Math.max(0.01, currentPrice * Math.exp(logRet));

            // Re-sync AMM pool depth to price
            poolUsd = Math.sqrt(kAmm * nextPrice);
            poolTokens = Math.sqrt(kAmm / nextPrice);
        }

        const dailyMintUsd = (minted / 7) * currentPrice;
        const dailyBurnUsd = (burned / 7) * currentPrice;
        let netDailyLoss = dailyBurnUsd - dailyMintUsd;
        const solvencyScore = dailyMintUsd > 0 ? dailyBurnUsd / dailyMintUsd : 10; // Default to healthy if no minting

        // Module 4: Sinking Fund - accumulate treasury and dampen price drops
        if (revenueStrategy === 'reserve') {
            // Accumulate 10% of emission value as reserve
            treasuryBalance += minted * currentPrice * 0.1;
            // Dampen negative price movements by 50%
            if (nextPrice < currentPrice) {
                const priceDrop = currentPrice - nextPrice;
                nextPrice = currentPrice - (priceDrop * 0.5);
            }
        } else {
            // Burn strategy: slight price bump (0.1%/week ≈ 5.3%/year)
            nextPrice = nextPrice * 1.001;
        }

        results.push({
            t, price: currentPrice, supply: currentSupply, demand, demand_served,
            providers: currentProviders, capacity, servicePrice: currentServicePrice,
            minted, burned, utilization, profit, scarcity, incentive,
            solvencyScore, netDailyLoss, dailyMintUsd, dailyBurnUsd,
            netFlow, churnCount: delta < 0 ? Math.abs(delta) : 0, joinCount: delta > 0 ? delta : 0,
            treasuryBalance, vampireChurn: vampireChurnAmount
        } as LegacySimResult);

        currentPrice = nextPrice;
        currentProviders = Math.max(2, currentProviders + delta);
    }
    return results;
}
