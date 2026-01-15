export interface MetricDataPoint {
    minted?: number;
    burned?: number;
    solvencyScore?: number;
    providers?: number;
    churnCount?: number;
    utilization?: number;
    capacity?: number;
    demand_served?: number;
    urbanCount?: number;
    ruralCount?: number;
    treasuryBalance?: number;
    price?: number;
    supply?: number;
    [key: string]: number | undefined;
}

export interface RegisteredMetric {
    id: string;
    label: string;
    description: string;
    formula: string;
    compute?: (data: MetricDataPoint, params?: any) => number;  // Executable formula
    sourceId?: number; // Maps to src/data/sources.ts
    tier: 'survival' | 'viability' | 'utility';
    thresholds?: {
        healthy: number;
        critical: number;
        unit: string;
    };
}

export const METRICS: Record<string, RegisteredMetric> = {
    // --- TIER 1: SURVIVAL ---
    solvency_ratio: {
        id: 'solvency_ratio',
        label: 'Sustainability Ratio (Burn-to-Emission)',
        description: 'Ratio of Value Burned to Value Emitted. >1.0 indicates deflationary sustainability.',
        formula: '(DailyBurnUSD / DailyMintUSD)',
        compute: (d) => (d.burned || 0) / Math.max(d.minted || 1, 1),
        sourceId: 6,
        tier: 'survival',
        thresholds: { healthy: 1.0, critical: 0.8, unit: 'Ratio' }
    },
    weekly_retention_rate: {
        id: 'weekly_retention_rate',
        label: 'Weekly Retention Rate',
        description: 'Percentage of the starting provider cohort that remains active.',
        formula: '1 - (CumulativeChurn / StartProviders)',
        compute: (d) => {
            const startProviders = (d.providers || 0) + (d.churnCount || 0);
            return startProviders > 0 ? (1 - (d.churnCount || 0) / startProviders) * 100 : 100;
        },
        tier: 'survival',
        thresholds: { healthy: 0.98, critical: 0.90, unit: '%' }
    },
    urban_density: {
        id: 'urban_density',
        label: 'High Sunk Cost (Urban)',
        description: 'Providers in high-density areas with higher OPEX and capitulation risk.',
        formula: 'Count(Type == Urban)',
        compute: (d) => d.urbanCount || 0,
        sourceId: 11,
        tier: 'survival'
    },
    treasury_balance: {
        id: 'treasury_balance',
        label: 'Treasury Balance',
        description: 'Accumulated reserve funds to defend against volatility.',
        formula: 'Sum(Revenue) - Sum(Burn) [if Strategy=Reserve]',
        compute: (d) => d.treasuryBalance || 0,
        sourceId: 13,
        tier: 'survival',
        thresholds: { healthy: 1000000, critical: 0, unit: 'USD' }
    },

    // --- TIER 2: VIABILITY ---
    payback_period: {
        id: 'payback_period',
        label: 'Miner Payback Period',
        description: 'Time to recover hardware CAPEX based on current daily profit.',
        formula: 'HardwareCost / (DailyProfit * 30)',
        compute: (d, params) => {
            const hardwareCost = params?.hardwareCost || 1000;
            const weeklyProfit = d.weeklyProfit ?? (d.revenue ?? 0) - (d.operationalCost ?? 0);
            const monthlyProfit = (weeklyProfit / 7) * 30;
            return monthlyProfit > 0 ? hardwareCost / monthlyProfit : Infinity;
        },
        tier: 'viability',
        thresholds: { healthy: 12, critical: 24, unit: 'Months' }
    },
    network_coverage_score: {
        id: 'network_coverage_score',
        label: 'Network Coverage Score',
        description: 'Aggregate sum of location-based utility scores.',
        formula: 'Sum(LocationScale * 100) / ScalingFactor',
        compute: (d) => d.weightedCoverage ?? ((d.urbanCount || 0) * 1.5 + (d.ruralCount || 0) * 1.0),
        sourceId: 15,
        tier: 'viability'
    },
    vampire_churn: {
        id: 'vampire_churn',
        label: 'Vampire Attack Churn',
        description: 'Nodes leaving for a competitor offering higher yield.',
        formula: 'Count(Nodes leaving due to CompetitorYield)',
        compute: (d) => d.vampireChurn ?? 0,
        sourceId: 13,
        tier: 'viability'
    },

    // --- TIER 3: UTILITY ---
    effective_capacity: {
        id: 'effective_capacity',
        label: 'Effective Capacity (Serviceable Supply)',
        description: 'Total network capacity available to serve demand.',
        formula: 'Sum(ProviderCapacity)',
        compute: (d) => d.capacity ?? (d.providers || 0) * 100,
        tier: 'utility'
    },
    rural_density: {
        id: 'rural_density',
        label: 'Low Sunk Cost (Rural)',
        description: 'Providers in low-density areas. Often lower OPEX and higher resilience.',
        formula: 'Count(Type == Rural)',
        compute: (d) => d.ruralCount || 0,
        sourceId: 11,
        tier: 'utility'
    },
    network_utilization: {
        id: 'network_utilization',
        label: 'Network Utilization (%)',
        description: 'Percentage of total capacity currently serving demand.',
        formula: '(DemandServed / TotalCapacity) * 100',
        compute: (d) => {
            const capacity = d.capacity ?? (d.providers || 0) * 100;
            return capacity > 0 ? ((d.demand_served || 0) / capacity) * 100 : 0;
        },
        tier: 'utility'
    },
    quality_distribution: {
        id: 'quality_distribution',
        tier: 'utility',
        label: 'Quality Distribution',
        description: 'Split between Pro (High Cap/Eff) and Basic hardware tiers.',
        formula: 'Pro vs Basic Count',
        compute: (d) => {
            const pro = d.proCount ?? 0;
            const basic = d.basicCount ?? (d.providers || 0);
            return basic > 0 ? pro / basic : 0;
        },
        thresholds: { healthy: 0.5, critical: 0.1, unit: 'ratio' }
    },
    supply_trajectory: {
        id: 'supply_trajectory',
        label: 'Supply Trajectory',
        description: 'Projected growth of token supply based on emission schedule.',
        formula: 'TotalSupply_t',
        compute: (d) => d.supply || 0,
        tier: 'utility'
    }
};
