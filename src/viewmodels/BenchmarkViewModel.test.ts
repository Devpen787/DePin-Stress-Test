import { describe, it, expect } from 'vitest';
import { useBenchmarkViewModel } from './BenchmarkViewModel';
import { PROTOCOL_PROFILES } from '../data/protocols';
import { LegacyAggregateResult as AggregateResult, LegacySimulationParams } from '../model/legacy/engine';

// Mock Data Helpers
const createMockResult = (weeks: number, finalNodes: number, finalRevenue: number): AggregateResult[] => {
    return Array.from({ length: weeks }).map((_, i) => ({
        week: i + 1,
        providers: { mean: finalNodes * ((i + 1) / weeks), p5: 0, p95: 0, min: 0, max: 0 },
        revenue: { mean: finalRevenue, p5: 0, p95: 0, min: 0, max: 0 },
        price: { mean: 1, p5: 0, p95: 0, min: 0, max: 0 },
        supply: { mean: 1000000, p5: 0, p95: 0, min: 0, max: 0 },
        // ... other fields mocked as 0
        sentiment: { mean: 0.5, p5: 0, p95: 0, min: 0, max: 0 },
        adoption: { mean: 0.5, p5: 0, p95: 0, min: 0, max: 0 },
        utilization: { mean: 0.5, p5: 0, p95: 0, min: 0, max: 0 },
        emissions: { mean: 1000, p5: 0, p95: 0, min: 0, max: 0 },
        minted: { mean: 1000, p5: 0, p95: 0, min: 0, max: 0 },
        burned: { mean: 500, p5: 0, p95: 0, min: 0, max: 0 },
        active_providers: { mean: finalNodes * ((i + 1) / weeks), p5: 0, p95: 0, min: 0, max: 0 },
        provider_revenue: { mean: 100, p5: 0, p95: 0, min: 0, max: 0 },
        protocol_revenue: { mean: finalRevenue, p5: 0, p95: 0, min: 0, max: 0 },
        market_cap: { mean: 1000000, p5: 0, p95: 0, min: 0, max: 0 },
        token_price: { mean: 1, p5: 0, p95: 0, min: 0, max: 0 },
        utility: { mean: 0.5, p5: 0, p95: 0, min: 0, max: 0 },
        demand_served: { mean: 0, p5: 0, p95: 0, min: 0, max: 0 },
        servicePrice: { mean: 0, p5: 0, p95: 0, min: 0, max: 0 },
        weightedCoverage: { mean: 0, p5: 0, p95: 0, min: 0, max: 0 },
    } as unknown as AggregateResult));
};

describe('BenchmarkViewModel', () => {
    const mockParams = {
        nSims: 1,
        weeks: 52,
        T: 52,
        initialSupply: 1000000,
        initialPrice: 0.10,
        initialProviders: 1000,
        maxMintWeekly: 50000,
        burnPct: 0.10,
        demandType: 'growth',
        macro: 'neutral',
        hardwareCost: 1500,
        // Add minimized other required fields
        providerCostPerWeek: 10,
        baseCapacityPerProvider: 100,
        kDemandPrice: 0.5,
        kMintPrice: 0.5,
        rewardLagWeeks: 0,
        churnThreshold: 0,
        initialLiquidity: 1000000,
        investorUnlockWeek: 999,
        investorSellPct: 0,
        competitorYield: 0,
        emissionModel: 'fixed',
        revenueStrategy: 'burn'
    } as unknown as LegacySimulationParams;

    const mockMultiAggregated: Record<string, AggregateResult[]> = {
        'ono_v3_calibrated': createMockResult(52, 5000, 1000), // Onocoy: 5000 nodes
        'geodnet_v1': createMockResult(52, 4000, 800),         // Geodnet: 4000 nodes
    };

    const mockLiveData = {
        'ono_v3_calibrated': null,
        'geodnet_v1': null
    };

    it('should calculate correct head-to-head active nodes delta', () => {
        const result = useBenchmarkViewModel(
            mockParams,
            mockMultiAggregated,
            PROTOCOL_PROFILES,
            mockLiveData
        );

        const metrics = result.getHeadToHeadMetrics();
        const nodesMetric = metrics.find(m => m.metric === 'Active Nodes');

        expect(nodesMetric).toBeDefined();
        expect(nodesMetric?.onocoyValue).toBe(5000); // Last point
        expect(nodesMetric?.competitorValue).toBe(4000);

        // (5000 - 4000) / 4000 = 0.25 = 25%
        expect(nodesMetric?.delta).toBeCloseTo(25);
        expect(nodesMetric?.betterDirection).toBe('higher');
    });

    it('should identify hardware cost advantage properly', () => {
        const result = useBenchmarkViewModel(
            mockParams,
            mockMultiAggregated,
            PROTOCOL_PROFILES,
            mockLiveData
        );

        // Note: Hardware cost comes from PROTOCOL_PROFILES.
        // Onocoy: 150, Geodnet (loaded from profiles if exists, else defaults)
        const metrics = result.getHeadToHeadMetrics();
        const hwMetric = metrics.find(m => m.metric === 'Hardware Cost');

        expect(hwMetric).toBeDefined();
        // Check if delta is correct direction (lower is better)
        expect(hwMetric?.betterDirection).toBe('lower');
    }); // Close previous IT block

    it('should override simulated metrics with live on-chain data when available', () => {
        // Mock On-Chain Data
        const mockOnChainData: any = {
            'ono_v3_calibrated': {
                activeNodesTotal: 9999, // Live value
                tokenBurned7d: 500,     // Live value
                lastUpdated: new Date().toISOString(),
                sourceType: 'dune'
            }
        };

        const result = useBenchmarkViewModel(
            mockParams as any, // Cast to any or full type
            mockMultiAggregated,
            PROTOCOL_PROFILES,
            mockLiveData,
            mockOnChainData
        );

        // Check Supply Side (Active Nodes)
        const supply = result.getSupplySide('ono_v3_calibrated');
        expect(supply.activeNodes).toBe(9999);
        expect(supply.dataSource).toBe('live');
        expect(supply.sourceRefs).toContain('Dune Analytics');

        // Check Demand Side (Burn)
        const demand = result.getDemandSide('ono_v3_calibrated');
        expect(demand.burnRateWeekly).toBe(500);
        expect(demand.dataSource).toBe('live');

        // Check Tokenomics (Burn derived)
        const tokenomics = result.getTokenomics('ono_v3_calibrated');
        // Sustainability = (Burn * Price) / (Mint * Price)
        // Burn = 500 * $0.50 = $250
        // Mint = 1000 * $0.50 = $500
        // Ratio = 0.5 = 50%
        expect(tokenomics.sustainabilityRatio).toBeCloseTo(50);
        expect(tokenomics.dataSource).toBe('mixed');
    });
});
