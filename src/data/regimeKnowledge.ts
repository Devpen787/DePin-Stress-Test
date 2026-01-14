import { TrendingDown, Target, TrendingUp } from 'lucide-react';

export const REGIME_KNOWLEDGE = {
    'LOW-INCENTIVE DOMINANT': {
        title: 'Low-Incentive Dominant',
        color: 'rose',
        icon: TrendingDown,
        definition: 'A state where reward velocity falls below the operational floor (OpEx) required for hardware maintenance and operator participation.',
        symptoms: [
            { metric: 'Provider Count', signal: 'Chronic attrition/downward step-trend' },
            { metric: 'Retention Ratio', signal: 'Drop below 75% threshold' },
            { metric: 'Profit Delta', signal: 'Mean value consistently below churn threshold' }
        ],
        risks: 'Irreversible capacity collapse, loss of geographic coverage, and system-level security failure.',
        mitigations: 'Emission schedule adjustment, operational cost subsidies, or burn-rate reallocation.'
    },
    'EQUILIBRIUM WINDOW': {
        title: 'Equilibrium Window',
        color: 'emerald',
        icon: Target,
        definition: 'The target mechanistic state where emission velocity is calibrated to real-world utility capture, sustaining stable participation.',
        symptoms: [
            { metric: 'Capacity vs Demand', signal: 'Tight coupling with positive headroom' },
            { metric: 'Burn vs Emissions', signal: 'Narrowing sustainability gap (1:1 target)' },
            { metric: 'Utilization', signal: 'Stability within the 40-70% bandwidth' }
        ],
        risks: 'Complacency bias, vulnerability to sudden macro shocks, and low resistance to black swan events.',
        mitigations: 'Dynamic parameter calibration, governance monitoring, and liquidity provisioning.'
    },
    'HIGH-INCENTIVE DOMINANT': {
        title: 'High-Incentive Dominant',
        color: 'amber',
        icon: TrendingUp,
        definition: 'A state of over-subsidization where reward velocity significantly exceeds utility, or infrastructure load reaches saturation ceilings.',
        symptoms: [
            { metric: 'Utilization', signal: 'Flat-top ceilings exceeding 90%' },
            { metric: 'Burn vs Emissions', signal: 'Chronic decoupling (Emissions >> Burn)' },
            { metric: 'Pricing Proxy', signal: 'Hyper-volatility or run-away pricing spikes' }
        ],
        risks: 'Speculative capital dominance, hardware congestion, and hyper-inflationary supply expansion.',
        mitigations: 'Burn-fraction scaling, saturation-based emission decays, or fee rebalancing.'
    }
};
