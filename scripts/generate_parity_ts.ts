/**
 * Generate TypeScript parity output for comparison with Python
 * 
 * Usage: npx ts-node scripts/generate_parity_ts.ts
 */

import * as fs from 'fs';

// Matching Python SeededRNG
class SeededRNG {
    private seed: number;

    constructor(seed: number) {
        this.seed = seed;
    }

    next(): number {
        this.seed = (this.seed * 1664525 + 1013904223) % (2 ** 32);
        return this.seed / (2 ** 32);
    }

    normal(mean: number = 0, std: number = 1): number {
        const u1 = Math.max(this.next(), 1e-10);
        const u2 = this.next();
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        return mean + std * z;
    }
}

// Simulation params matching Python
interface SimulationParams {
    T: number;
    initialSupply: number;
    initialPrice: number;
    maxMintWeekly: number;
    burnPct: number;
    initialLiquidity: number;
    baseDemand: number;
    demandVolatility: number;
    initialProviders: number;
    baseCapacityPerProvider: number;
    providerCostPerWeek: number;
    churnThreshold: number;
    seed: number;
}

const DEFAULT_PARAMS: SimulationParams = {
    T: 52,
    initialSupply: 1_000_000_000,
    initialPrice: 0.05,
    maxMintWeekly: 10_000_000,
    burnPct: 0.3,
    initialLiquidity: 500_000,
    baseDemand: 10_000,
    demandVolatility: 0.1,
    initialProviders: 100,
    baseCapacityPerProvider: 100,
    providerCostPerWeek: 50,
    churnThreshold: -100,
    seed: 42
};

function runSimulation(params: SimulationParams): any[] {
    const rng = new SeededRNG(params.seed);
    const results: any[] = [];

    let tokenPrice = params.initialPrice;
    let tokenSupply = params.initialSupply;
    const liquidity = params.initialLiquidity;
    let activeProviders = params.initialProviders;

    for (let t = 0; t < params.T; t++) {
        // Demand with noise
        let demand = params.baseDemand * (1 + rng.normal(0, params.demandVolatility));
        demand = Math.max(0, demand);

        // Capacity
        const capacity = activeProviders * params.baseCapacityPerProvider;

        // Demand served
        const demandServed = Math.min(demand, capacity);

        // Utilization
        const utilization = capacity > 0 ? (demandServed / capacity * 100) : 0;

        // Minting
        const minted = Math.min(params.maxMintWeekly, demandServed * 100);

        // Burning
        const burned = minted * params.burnPct;

        // Token economics
        tokenSupply = tokenSupply + minted - burned;

        // Price model
        if (tokenSupply > 0) {
            tokenPrice = liquidity / (tokenSupply * 0.01);
            tokenPrice = Math.max(0.001, Math.min(tokenPrice, 100));
        }

        // Provider economics
        const providerRevenue = activeProviders > 0 ? (minted / activeProviders) * tokenPrice : 0;
        const providerProfit = providerRevenue - params.providerCostPerWeek;

        // Churn
        const churnRate = providerProfit < params.churnThreshold ? 0.05 : 0.01;
        const churned = Math.floor(activeProviders * churnRate);
        activeProviders = Math.max(1, activeProviders - churned);

        // Solvency
        const solvencyScore = minted > 0 ? (burned / minted) : 0;

        results.push({
            t,
            price: tokenPrice,
            supply: tokenSupply,
            demand,
            demand_served: demandServed,
            providers: activeProviders,
            capacity,
            minted,
            burned,
            utilization,
            profit: providerProfit,
            solvencyScore
        });
    }

    return results;
}

// Main
console.log("Generating TypeScript parity output...");
const results = runSimulation(DEFAULT_PARAMS);
console.log(`Generated ${results.length} timesteps.`);

// Sample output
console.log("\n--- Sample Results (t=0, t=25, t=51) ---");
for (const t of [0, 25, 51]) {
    const r = results[t];
    console.log(`t=${t}: price=${r.price.toFixed(4)}, providers=${r.providers}, solvency=${r.solvencyScore.toFixed(2)}`);
}

// Save to JSON
const outputPath = 'scripts/parity_ts_output.json';
fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
console.log(`\nResults saved to: ${outputPath}`);
