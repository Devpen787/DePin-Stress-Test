
export type DiagnosticVerdict = 'Solvent' | 'Subsidy-Dependent' | 'Insolvent' | 'Robust' | 'Fragile' | 'Zombie' | 'Critical' | 'Sustainable';

export interface DiagnosticInput {
    minerProfile: 'Mercenary' | 'Professional';
    emissionSchedule: 'Fixed' | 'Dynamic';
    growthCoordination: 'Uncoordinated' | 'Managed';
    demandLag: 'Low' | 'High';
    priceShock: 'None' | 'Moderate' | 'Severe';
    insiderOverhang: 'Low' | 'High';
    selectedArchetype?: string;
}

export interface MetricSignal {
    name: string;
    value: number;
    unit: string;
    status: 'Safe' | 'Warning' | 'Critical';
    description: string;
    translation: string; // "Down to earth" explanation
}

export interface DiagnosticState {
    r_be: number; // Burn to Emission Ratio
    lur: number; // Liquidity Utilization Rate
    nrr: number; // Node Retention Rate
    cpv: number; // CapEx Payback Velocity (months)
    govScore: number; // Governance Score (0-100)
    resilienceScore: number; // Final weighted score
    verdict: DiagnosticVerdict;
}
