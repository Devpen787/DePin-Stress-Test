import { describe, it, expect } from 'vitest';
import {
    simulateOne,
    processPanicEvents,
    createProvider,
    calculateChurnProbability
} from './simulation';
import { SeededRNG } from './rng';
import { SimulationParams, ProviderPool, Provider } from './types';

// Mock Params
const MOCK_PARAMS: SimulationParams = {
    initialSupply: 1000000,
    initialLiquidity: 500000,
    initialPrice: 0.5,
    initialProviders: 100,
    baseDemand: 2000,
    maxMintWeekly: 10000,
    burnPct: 0.1,
    providerCostPerWeek: 10,
    // Scenario defaults
    T: 52,
    seed: 123,
    scenario: 'baseline',
    demandType: 'consistent',
    demandVolatility: 0.1,
    macro: 'sideways',
    baseServicePrice: 1,
    minServicePrice: 0.1,
    maxServicePrice: 10,
    servicePriceElasticity: 0.1,
    baseCapacityPerProvider: 100,
    capacityStdDev: 0.1,
    costStdDev: 0.1,
    churnThreshold: 0,
    maxProviderChurnRate: 1.0, // Allow 100% churn for the test to see the full spike
    hardwareLeadTime: 4,
    profitThresholdToJoin: 20,
    maxProviderGrowthRate: 0.1,
    investorUnlockWeek: -1,
    investorSellPct: 0,
    revenueStrategy: 'burn',
    kBuyPressure: 0.05,
    kSellPressure: 0.05,
    kDemandPrice: 0.01,
    kMintPrice: 0.01,
    rewardLagWeeks: 0,
    competitorYield: 0,
    emissionModel: 'fixed',
    hardwareCost: 1000,
    nSims: 1
};

describe('V3 Simulation Engine (Math Verification)', () => {

    describe('1. Logic Proof: Urban vs Rural (Sunk Cost Stability)', () => {
        it('Urban miners should have lower panic probability than Rural miners', () => {
            const rng = new SeededRNG(123);
            const pool: ProviderPool = {
                active: [],
                churned: [],
                pending: []
            };

            // Manually create one Urban and one Rural provider
            const urbanMiner: Provider = { ...createProvider(rng, MOCK_PARAMS, 0), type: 'urban', operationalCost: 100, id: 'urban-1' };
            const ruralMiner: Provider = { ...createProvider(rng, MOCK_PARAMS, 0), type: 'rural', operationalCost: 100, id: 'rural-1' };

            pool.active.push(urbanMiner, ruralMiner);

            // Simulate a massive price crash (Panic Trigger)
            // Previous Profit was 0 (Breaking Even)
            // New Price is 50% lower -> Revenue Halves
            const oldPrice = 1.0;
            const newPrice = 0.5;
            const prevProfits = new Map<string, number>();
            prevProfits.set('urban-1', 0);
            prevProfits.set('rural-1', 0);

            // We run this 1000 times to test the PROBABILITY
            let urbanChurns = 0;
            let ruralChurns = 0;

            for (let i = 0; i < 1000; i++) {
                // Reset active state
                urbanMiner.isActive = true;
                ruralMiner.isActive = true;
                const tempPool = { active: [urbanMiner, ruralMiner], churned: [], pending: [] };

                const res = processPanicEvents(tempPool, oldPrice, newPrice, prevProfits, rng);

                // Active list decreased?
                const survivors = res.pool.active.map(p => p.id);
                if (!survivors.includes('urban-1')) urbanChurns++;
                if (!survivors.includes('rural-1')) ruralChurns++;
            }

            console.log(`Urban Churns: ${urbanChurns}, Rural Churns: ${ruralChurns}`);

            // MATH PROOF: Urban should represent "Sunk Cost" -> Lower Churn
            expect(urbanChurns).toBeLessThan(ruralChurns);
        });
    });

    describe('2. Logic Proof: Death Spiral (Panic Trigger)', () => {
        it('should trigger significantly higher churn during a crash compared to a normal week', () => {
            // CONTROL GROUP: No Crash
            const controlParams = { ...MOCK_PARAMS, initialProviders: 1000, seed: 999 };
            const controlResults = simulateOne(controlParams, 999);

            // EXPERIMENT GROUP: Crash at Week 20
            const crashParams = {
                ...MOCK_PARAMS,
                initialProviders: 1000,
                seed: 999, // Same seed to ensure identical agents
                investorUnlockWeek: 20,
                investorSellPct: 0.50 // 50% Supply Dump -> Massive Crash
            };
            const crashResults = simulateOne(crashParams, 999);

            // Compare Churn at Week 20
            // Note: We check the specific week of the event
            const controlChurn = controlResults[20].churnCount;
            const crashChurn = crashResults[20].churnCount;

            console.log(`Control Week 20 Churn: ${controlChurn}, Crash Week 20 Churn: ${crashChurn}`);

            // MATH PROOF: Churn should be at least 5x higher in the crash scenario
            // Using a large multiplier to ensure statistical significance
            expect(crashChurn).toBeGreaterThan(controlChurn * 5);
        });
    });

    describe('3. Logic Proof: Formula Correctness', () => {
        it('Churn Probability should increase with consecutive losses', () => {
            // Loss = 1 week
            const prob1 = calculateChurnProbability(1, -10, MOCK_PARAMS);
            // Loss = 10 weeks
            const prob10 = calculateChurnProbability(10, -10, MOCK_PARAMS);

            expect(prob10).toBeGreaterThan(prob1);
        });

        it('Solvency Score should be < 1.0 when Minted > Burned (Dilution)', () => {
            // Since we can't easily force specific mint/burn values in the complex simulation,
            // we rely on the logic that simulateOne returns.
            // But we can check the formula logic from the output.

            const res = simulateOne(MOCK_PARAMS, 123)[10];

            // Solvency = (Burned USD) / (Minted USD)
            // If we set burnPct to 0, Solvency should be 0 (or close to)
            const paramsNoBurn = { ...MOCK_PARAMS, burnPct: 0 };
            const resNoBurn = simulateOne(paramsNoBurn, 123)[10];

            expect(resNoBurn.solvencyScore).toBeLessThan(0.1); // Should be near zero
        });
    });

});
