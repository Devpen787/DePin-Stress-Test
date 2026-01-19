import { LegacyAggregateResult as AggregateResult, LegacySimulationParams as SimulationParams } from '../model/legacy/engine';
import { ProtocolProfileV1 } from '../data/protocols';
import { TokenMarketData } from '../services/coingecko';
import { BENCHMARK_PEERS } from '../data/peerGroups';
import { ProtocolMetrics } from '../hooks/useProtocolMetrics';

// --- Benchmark Schemas ---

export interface SupplySideBenchmark {
    protocolId: string;
    snapshotDate?: string;
    activeNodes: number;
    hardwareCost: number;
    hardwareEntryCostMin?: number;
    hardwareEntryCostMax?: number;
    geoReachCountries?: number;
    receiverStandard?: string;
    growthYoY: number; // Projected annual growth based on simulation
    coverageScore: number;
    dataSource: 'simulated' | 'live' | 'mixed';
    sourceRefs: string[];
}

export interface DemandSideBenchmark {
    protocolId: string;
    snapshotDate?: string;
    annualizedRevenue: number;
    burnRateWeekly: number; // Tokens burned per week
    burnRatePeriod?: 'daily' | 'weekly' | 'monthly' | 'annual';
    pricingModel: string;
    dataSource: 'simulated' | 'live' | 'mixed';
    sourceRefs: string[];
}

export interface TokenomicsBenchmark {
    protocolId: string;
    snapshotDate?: string;
    maxSupply: number | null;
    circulatingSupply: number;
    emissionSchedule: string;
    burnPolicy: string; // e.g., "80% Revenue"
    sustainabilityRatio: number; // Burn / Emissions
    dataSource: 'simulated' | 'live' | 'mixed';
    sourceRefs: string[];
}

export interface HeadToHeadMetric {
    metric: string;
    unit: string;
    onocoyValue: number;
    competitorValue: number;
    delta: number; // (Onocoy - Competitor) or % difference
    deltaType: 'absolute' | 'percentage';
    betterDirection: 'higher' | 'lower' | 'neutral';
    isProjected: boolean;
    isValid: boolean;
    sourceLabel: 'Simulated' | 'Anchored' | 'Live Data' | 'Assumed';
}

// --- ViewModel Hook ---

export const useBenchmarkViewModel = (
    params: SimulationParams,
    multiAggregated: Record<string, AggregateResult[]>,
    profiles: ProtocolProfileV1[],
    liveData: Record<string, TokenMarketData | null>,
    onChainData: Record<string, ProtocolMetrics | null> = {}, // Updated type
    engineLabel: string = 'Legacy Engine v1.2'
) => {

    // Helper to get last simulation point or default to 0
    const getLastPoint = (protocolId: string): AggregateResult | null => {
        const results = multiAggregated[protocolId];
        return results && results.length > 0 ? results[results.length - 1] : null;
    };

    const getProfile = (protocolId: string): ProtocolProfileV1 | undefined => {
        return profiles.find(p => p.metadata.id === protocolId);
    };

    const toSnapshotDate = (iso?: string) => {
        if (!iso) return undefined;
        return iso.slice(0, 10);
    };

    const safePercentDelta = (a: number, b: number) => {
        if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) {
            return { delta: 0, isValid: false };
        }
        return { delta: ((a - b) / b) * 100, isValid: true };
    };

    const safeAbsoluteDelta = (a: number, b: number) => {
        if (!Number.isFinite(a) || !Number.isFinite(b)) {
            return { delta: 0, isValid: false };
        }
        return { delta: a - b, isValid: true };
    };

    const resolveSourceLabel = (sources: Array<'simulated' | 'live' | 'mixed'>) => {
        const hasLive = sources.includes('live');
        const hasMixed = sources.includes('mixed');
        const hasSim = sources.includes('simulated');

        if (hasLive && !hasMixed && !hasSim) {
            return { label: 'Live Data' as const, isProjected: false };
        }

        if (hasLive || hasMixed) {
            return { label: 'Anchored' as const, isProjected: false };
        }

        return { label: 'Simulated' as const, isProjected: true };
    };

    // 1. Supply Side Derivation
    const getSupplySide = (protocolId: string): SupplySideBenchmark => {
        const last = getLastPoint(protocolId);
        const profile = getProfile(protocolId);
        const chain = onChainData[protocolId];

        // Calculate CAGR / Growth if possible, else 0
        const results = multiAggregated[protocolId] || [];
        let growthYoY = 0;
        if (results.length > 0) {
            const startNodes = results[0]?.providers?.mean || 1;
            const endNodes = last?.providers?.mean || 1;
            const weeks = results.length;
            if (weeks > 0 && startNodes > 0) {
                const weeklyGrowth = Math.pow(endNodes / startNodes, 1 / weeks) - 1;
                growthYoY = (Math.pow(1 + weeklyGrowth, 52) - 1) * 100;
            }
        }

        // Live Override for Active Nodes
        const useLiveNodes = chain && chain.activeNodesTotal > 0;
        const activeNodes = useLiveNodes ? chain.activeNodesTotal : (last?.providers?.mean || 0);

        // Determine Label
        const sourceLabel = chain?.sourceType === 'snapshot' ? 'Market Snapshot (Q1 2025)' :
            chain?.sourceType === 'dune' ? 'Dune Analytics' :
                engineLabel;

        return {
            protocolId,
            snapshotDate: toSnapshotDate(chain?.lastUpdated),
            activeNodes,
            hardwareCost: profile?.parameters.hardware_cost.value || 0,
            hardwareEntryCostMin: profile?.parameters.hardware_cost.value || 0,
            hardwareEntryCostMax: profile?.parameters.hardware_cost.value || 0,
            growthYoY,
            // Legacy schema doesn't have weightedCoverage, use capacity as proxy for now or 0
            coverageScore: last?.capacity?.mean || 0,
            receiverStandard: profile?.metadata.model_type === 'location_based' ? 'Location-Based' : 'Fungible Resource',
            dataSource: useLiveNodes ? 'live' : 'simulated',
            sourceRefs: useLiveNodes
                ? [sourceLabel, 'On-Chain']
                : [sourceLabel, 'Protocol Attributes']
        };
    };

    // 2. Demand Side Derivation
    const getDemandSide = (protocolId: string): DemandSideBenchmark => {
        const last = getLastPoint(protocolId);
        const profile = getProfile(protocolId);
        const chain = onChainData[protocolId];

        // Revenue derived from demand_served * servicePrice
        const revenuePerWeek = ((last?.demand_served?.mean || 0) * (last?.servicePrice?.mean || 0));

        // Live Override for Burn
        const useLiveBurn = chain && chain.tokenBurned7d > 0;
        const tokensBurned = useLiveBurn ? chain.tokenBurned7d : (last?.burned?.mean || 0);

        const sourceLabel = chain?.sourceType === 'snapshot' ? 'Market Snapshot (Q1 2025)' :
            chain?.sourceType === 'dune' ? 'Dune Analytics' :
                engineLabel;

        return {
            protocolId,
            snapshotDate: toSnapshotDate(chain?.lastUpdated),
            annualizedRevenue: revenuePerWeek * 52,
            burnRateWeekly: tokensBurned,
            burnRatePeriod: 'weekly',
            pricingModel: profile?.metadata.mechanism || 'Unknown',
            dataSource: useLiveBurn ? 'live' : 'simulated',
            sourceRefs: useLiveBurn
                ? [sourceLabel, 'On-Chain']
                : [sourceLabel, 'Protocol Attributes']
        };
    };

    // 3. Tokenomics Derivation
    const getTokenomics = (protocolId: string): TokenomicsBenchmark => {
        const last = getLastPoint(protocolId);
        const profile = getProfile(protocolId);
        const live = liveData[protocolId];
        const chain = onChainData[protocolId];

        const emissionsVal = (last?.minted?.mean || 0) * (last?.price?.mean || 0);
        // Burn value: use Live burn if available * Live price if available
        const burnAmt = chain ? chain.tokenBurned7d : (last?.burned?.mean || 0);
        const price = live ? live.currentPrice : (last?.price?.mean || 0);
        const burnVal = burnAmt * price;

        const ratio = emissionsVal > 0 ? burnVal / emissionsVal : 0;

        const isHybrid = live || chain;
        const chainSource = chain?.sourceType === 'snapshot' ? 'Snapshot' : 'Dune';

        return {
            protocolId,
            snapshotDate: toSnapshotDate(chain?.lastUpdated || live?.lastUpdated),
            maxSupply: live?.maxSupply || null,
            circulatingSupply: last?.supply?.mean || live?.circulatingSupply || 0,
            emissionSchedule: `${formatLarge(profile?.parameters.emissions.value || 0)}/wk`,
            burnPolicy: `${(profile?.parameters.burn_fraction.value || 0) * 100}%`,
            sustainabilityRatio: ratio * 100, // Percentage
            dataSource: isHybrid ? 'mixed' : 'simulated',
            sourceRefs: isHybrid
                ? ['CoinGecko', chain ? chainSource : null, engineLabel].filter(Boolean) as string[]
                : [engineLabel]
        };
    };

    // 4. Head-to-Head Calculator
    const getHeadToHeadMetrics = (): HeadToHeadMetric[] => {
        const p1 = BENCHMARK_PEERS.primary; // Onocoy
        const p2 = BENCHMARK_PEERS.competitor; // Geodnet

        const s1 = getSupplySide(p1);
        const s2 = getSupplySide(p2);
        const d1 = getDemandSide(p1);
        const d2 = getDemandSide(p2);
        const t1 = getTokenomics(p1);
        const t2 = getTokenomics(p2);

        const revenueDelta = safeAbsoluteDelta(d1.annualizedRevenue, d2.annualizedRevenue);
        const nodeDelta = safePercentDelta(s1.activeNodes, s2.activeNodes);
        const sustainabilityDelta = safeAbsoluteDelta(t1.sustainabilityRatio, t2.sustainabilityRatio);
        const hardwareDelta = safeAbsoluteDelta(s1.hardwareCost, s2.hardwareCost);

        const revenuePerNode1 = s1.activeNodes > 0 ? d1.annualizedRevenue / s1.activeNodes : 0;
        const revenuePerNode2 = s2.activeNodes > 0 ? d2.annualizedRevenue / s2.activeNodes : 0;
        const revenuePerNodeValid = s1.activeNodes > 0 && s2.activeNodes > 0;
        const revenuePerNodeDelta = safeAbsoluteDelta(revenuePerNode1, revenuePerNode2);

        const roi1 = s1.hardwareCost > 0 ? (revenuePerNode1 / s1.hardwareCost) * 100 : 0;
        const roi2 = s2.hardwareCost > 0 ? (revenuePerNode2 / s2.hardwareCost) * 100 : 0;
        const roiValid = revenuePerNodeValid && s1.hardwareCost > 0 && s2.hardwareCost > 0;
        const roiDelta = safeAbsoluteDelta(roi1, roi2);

        const activeNodesSource = resolveSourceLabel([s1.dataSource, s2.dataSource]);
        const sustainabilitySource = resolveSourceLabel([t1.dataSource, t2.dataSource]);

        return [
            {
                metric: 'Annual Revenue',
                unit: 'USD',
                onocoyValue: d1.annualizedRevenue,
                competitorValue: d2.annualizedRevenue,
                delta: revenueDelta.delta,
                deltaType: 'absolute',
                betterDirection: 'higher',
                isProjected: true,
                isValid: revenueDelta.isValid,
                sourceLabel: 'Simulated'
            },
            {
                metric: 'Active Nodes',
                unit: 'Nodes',
                onocoyValue: s1.activeNodes,
                competitorValue: s2.activeNodes,
                delta: nodeDelta.delta,
                deltaType: 'percentage',
                betterDirection: 'higher',
                isProjected: activeNodesSource.isProjected,
                isValid: nodeDelta.isValid,
                sourceLabel: activeNodesSource.label
            },
            {
                metric: 'Revenue Per Node',
                unit: 'USD',
                onocoyValue: revenuePerNode1,
                competitorValue: revenuePerNode2,
                delta: revenuePerNodeDelta.delta,
                deltaType: 'absolute',
                betterDirection: 'higher',
                isProjected: true,
                isValid: revenuePerNodeDelta.isValid && revenuePerNodeValid,
                sourceLabel: 'Simulated'
            },
            {
                metric: 'Hardware ROI (1Y)',
                unit: '%',
                onocoyValue: roi1,
                competitorValue: roi2,
                delta: roiDelta.delta,
                deltaType: 'absolute',
                betterDirection: 'higher',
                isProjected: true,
                isValid: roiDelta.isValid && roiValid,
                sourceLabel: 'Simulated'
            },
            {
                metric: 'Sustainability Ratio',
                unit: '%',
                onocoyValue: t1.sustainabilityRatio,
                competitorValue: t2.sustainabilityRatio,
                delta: sustainabilityDelta.delta,
                deltaType: 'absolute',
                betterDirection: 'higher',
                isProjected: sustainabilitySource.isProjected,
                isValid: sustainabilityDelta.isValid,
                sourceLabel: sustainabilitySource.label
            },
            {
                metric: 'Hardware Cost',
                unit: 'USD',
                onocoyValue: s1.hardwareCost,
                competitorValue: s2.hardwareCost,
                delta: hardwareDelta.delta,
                deltaType: 'absolute',
                betterDirection: 'lower',
                isProjected: true,
                isValid: hardwareDelta.isValid && s1.hardwareCost > 0 && s2.hardwareCost > 0,
                sourceLabel: 'Assumed'
            }
        ];
    };

    // Helper formatter
    const formatLarge = (num: number) => {
        if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
        if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
        return num.toString();
    };

    return {
        getSupplySide,
        getDemandSide,
        getTokenomics,
        getHeadToHeadMetrics
    };
};
