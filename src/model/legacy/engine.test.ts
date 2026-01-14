import { describe, it, expect } from 'vitest';
import { simulateOne, getDemandSeries, LegacySimulationParams } from './engine';
import { SeededRNG } from '../rng';

// Mock Params for V2
const MOCK_PARAMS_V2: LegacySimulationParams = {
    T: 52,
    initialSupply: 1000000,
    initialPrice: 0.5,
    maxMintWeekly: 10000,
    burnPct: 0.1,
    initialLiquidity: 500000,
    investorUnlockWeek: -1,
    investorSellPct: 0,
    demandType: 'consistent',
    macro: 'sideways',
    nSims: 1,
    seed: 123,
    providerCostPerWeek: 10,
    baseCapacityPerProvider: 100,
    kDemandPrice: 0.01,
    kMintPrice: 0.01,
    rewardLagWeeks: 0,
    churnThreshold: 0,
    competitorYield: 0,
    emissionModel: 'fixed',
    revenueStrategy: 'burn',
    hardwareCost: 1000
};

describe('V2 Legacy Engine (Math Verification)', () => {

    describe('1. Demand Curve Logic', () => {
        it('Growth demand should strictly increase over time (mostly)', () => {
            const rng = new SeededRNG(123);
            const series = getDemandSeries(52, 1000, 'growth', rng);

            // Compare start vs end
            const startAvg = (series[0] + series[1] + series[2]) / 3;
            const endAvg = (series[50] + series[51]) / 2;

            expect(endAvg).toBeGreaterThan(startAvg);
        });

        it('Volatile demand should have higher variance than Consistent', () => {
            const rng1 = new SeededRNG(123);
            const consistent = getDemandSeries(52, 1000, 'consistent', rng1);

            const rng2 = new SeededRNG(123);
            const volatile = getDemandSeries(52, 1000, 'volatile', rng2);

            // Simple variance calc
            const varC = consistent.reduce((acc, val) => acc + Math.abs(val - 1000), 0);
            const varV = volatile.reduce((acc, val) => acc + Math.abs(val - 1000), 0);

            expect(varV).toBeGreaterThan(varC * 2);
        });
    });

    describe('2. Solvency Logic', () => {
        it('Solvency Score should reflect Mint vs Burn ratio', () => {
            // Case A: High Burn, Low Mint -> Good Score
            const paramsA = { ...MOCK_PARAMS_V2, burnPct: 1.0, maxMintWeekly: 100, seed: 123 };
            const resA = simulateOne(paramsA, 123);
            const scoreA = resA[10].solvencyScore;

            // Case B: Low Burn, High Mint -> Bad Score
            const paramsB = { ...MOCK_PARAMS_V2, burnPct: 0.01, maxMintWeekly: 100000, seed: 123 };
            const resB = simulateOne(paramsB, 123);
            const scoreB = resB[10].solvencyScore;

            expect(scoreA).toBeGreaterThan(scoreB);
        });
    });

    describe('3. Shock Event Logic', () => {
        it('Price should drop immediately at Investor Unlock Week', () => {
            const unlockWeek = 25;
            const params = {
                ...MOCK_PARAMS_V2,
                investorUnlockWeek: unlockWeek,
                investorSellPct: 0.2 // 20% Dump
            };

            const res = simulateOne(params, 123);

            const priceBefore = res[unlockWeek].price;
            const priceAfter = res[unlockWeek + 1].price;

            // Price should drop significantly (> 15% drop check)
            // Theoretical drop for 20% supply dump into AMM is ~30%, but organic buy pressure fights it.
            // We verify it drops at least 15%.
            expect(priceAfter).toBeLessThan(priceBefore * 0.85);
        });
    });

});
