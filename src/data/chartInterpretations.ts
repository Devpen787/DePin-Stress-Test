import { METRICS, RegisteredMetric } from './MetricRegistry';

export interface ChartInterpretation {
    subtitle: string;
    question: string;
    formula: string;
    robust: string;
    fragile: string;
    failureMode: string;
    tier: RegisteredMetric['tier'];
    sourceId?: number;
    thresholds?: RegisteredMetric['thresholds'];
}

// Helper to map Registry to Interpretation
function createInterpretation(
    metric: RegisteredMetric,
    extras: Pick<ChartInterpretation, 'question' | 'robust' | 'fragile' | 'failureMode' | 'subtitle'>
): ChartInterpretation {
    return {
        ...extras,
        subtitle: extras.subtitle || metric.description,
        formula: metric.formula,
        tier: metric.tier,
        sourceId: metric.sourceId,
        thresholds: metric.thresholds
    };
}

/**
 * CHART_INTERPRETATIONS - Now keyed by METRIC ID (stable) instead of label (can change)
 * 
 * To look up: CHART_INTERPRETATIONS[METRICS.solvency_ratio.id]
 * For display: METRICS[id].label
 */
export const CHART_INTERPRETATIONS: Record<string, ChartInterpretation> = {
    // --- TIER 1: SURVIVAL ---
    [METRICS.solvency_ratio.id]: createInterpretation(METRICS.solvency_ratio, {
        subtitle: "Ratio of Value Burned to Value Emitted [Source 6].",
        question: "Is the network generating enough real value to offset its inflation?",
        robust: "Ratio > 1.0 (Deflationary); Network is profitable.",
        fragile: "Ratio < 0.5 (Highly Inflationary); Value dilution.",
        failureMode: "Ponzi Dynamics: Structural reliance on new capital to pay old yield."
    }),
    [METRICS.weekly_retention_rate.id]: createInterpretation(METRICS.weekly_retention_rate, {
        subtitle: "Percentage of the starting provider cohort that remains active.",
        question: "Are providers sticking around despite volatility?",
        robust: "Retention > 98% per week; extremely loyal base.",
        fragile: "Retention < 90%; massive periodic churn.",
        failureMode: "Exodus: Operators abandoning the network en masse."
    }),
    [METRICS.urban_density.id]: createInterpretation(METRICS.urban_density, {
        subtitle: "Composition of network supply by sunk cost [Source 11].",
        question: "Are we losing the 'High Sunk Cost' (Urban) nodes?",
        robust: "Stable Urban count; indicates professional miners are profitable.",
        fragile: "Sharp drop in Urban nodes; professionals are capitulating.",
        failureMode: "Network Hollow-Out: Loss of critical density in high-value areas."
    }),
    [METRICS.treasury_balance.id]: createInterpretation(METRICS.treasury_balance, {
        subtitle: "Resilience of reserves against competitor yield attacks [Source 13].",
        question: "Can the protocol survive a vampire attack using its treasury?",
        robust: "Treasury maintains > 6mo runway; Churn < 10%.",
        fragile: "Treasury depleted; Churn accelerates > 20%.",
        failureMode: "Liquidity Crisis: No reserves left to defend peg or retain miners."
    }),

    // --- TIER 2: VIABILITY ---
    [METRICS.payback_period.id]: createInterpretation(METRICS.payback_period, {
        subtitle: "Time required to recover hardware investment at current earnings.",
        question: "Is the payback period short enough to attract and retain rational miners?",
        robust: "Payback < 12 months; high incentive for new entrants.",
        fragile: "Payback > 24 months; existing miners barely breaking even.",
        failureMode: "Capital Flight: Investment recovery becomes mathematically impossible."
    }),
    [METRICS.network_coverage_score.id]: createInterpretation(METRICS.network_coverage_score, {
        subtitle: "Aggregate sum of location-based utility scores [Source 15].",
        question: "Is the network growing its physical footprint in valuable areas?",
        robust: "Growing Coverage Score > Node Growth (Efficiency).",
        fragile: "Stagnant Score despite Node Growth (Redundancy).",
        failureMode: "Over-saturation: Adding nodes adds zero marginal utility."
    }),
    [METRICS.vampire_churn.id]: createInterpretation(METRICS.vampire_churn, {
        subtitle: "Nodes leaving for a competitor offering higher yield.",
        question: "Is our yield competitive against the 'Vampire' protocol?",
        robust: "Zero to minimal loss despite higher competitor APY.",
        fragile: "Loss correlates 1:1 with competitor yield spread.",
        failureMode: "Sybil Attack / Vampire Drain: Network supply migrates instantly."
    }),

    // --- TIER 3: UTILITY ---
    [METRICS.effective_capacity.id]: createInterpretation(METRICS.effective_capacity, {
        subtitle: "Serviceable Demand vs Total Available Capacity.",
        question: "How much of the deployed infrastructure is actually useful?",
        robust: "High utilization of deployed assets; efficient capital allocation.",
        fragile: "Massive over-provisioning (Ghost Network).",
        failureMode: "Capital Inefficiency: Vast resources deployed for zero utility."
    }),
    [METRICS.rural_density.id]: createInterpretation(METRICS.rural_density, {
        subtitle: "Providers in low-density areas. Often lower OPEX and higher resilience.",
        question: "Is the 'Low Sunk Cost' (Rural) base maintaining coverage?",
        robust: "Balanced growth; Rural base maintains coverage stability.",
        fragile: "Rural churn indicates deep despair even among low-cost operators.",
        failureMode: "Complete Service Failure: Even hobbyists are leaving."
    }),

    [METRICS.network_utilization.id]: createInterpretation(METRICS.network_utilization, {
        subtitle: "Percentage of total capacity currently serving demand.",
        question: "Is the network supply actually being used?",
        robust: "Utilization > 60%; Healthy demand match.",
        fragile: "Utilization < 10%; Ghost network.",
        failureMode: "Obsolescence: Supply exists, but no one wants it."
    }),
    [METRICS.supply_trajectory.id]: createInterpretation(METRICS.supply_trajectory, {
        subtitle: "Projected growth of token supply based on emission schedule.",
        question: "Is the token supply inflating too effectively?",
        robust: "Supply curve flattens over time (disinflationary).",
        fragile: "Exponential supply growth (hyperinflationary).",
        failureMode: "Hyperinflation: Token value evaporates due to infinite supply."
    }),

    // --- LEGACY (Kept for compatibility or untiered charts) ---
    "liquidity_shock": {
        subtitle: "Impact of massive token unlock on price stability.",
        question: "Can the market absorb a supply shock without triggering a death spiral?",
        formula: "Price_{t} = k / (PoolTokens + UnlockAmount)",
        robust: "Price recovers within 4-8 weeks; Churn remains manageable.",
        fragile: "Price crashes > 60% and fails to recover; triggers mass exodus.",
        failureMode: "Liquidity Death Spiral: Price crash -> Miner Churn -> Service Fail -> Price Crash.",
        tier: 'survival',
        sourceId: undefined
    }
};

// NOTE: getInterpretationByLabel has been removed to enforce ID-based lookups.
// Use CHART_INTERPRETATIONS[metricId] directly, where metricId = METRICS.xxx.id
