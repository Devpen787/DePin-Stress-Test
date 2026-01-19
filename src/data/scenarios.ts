import { SimulationParams } from '../model/types';
import { TrendingDown, Infinity, Swords, Zap } from 'lucide-react';

export interface SimulationScenario {
    id: string;
    name: string;
    iconName: string; // Storing string name to map to icon component in UI
    description: string;
    thesisPoint: string;
    focusChart?: string; // Optional: Name of the chart to auto-open
    params: Partial<SimulationParams>;
}

export const SCENARIOS: SimulationScenario[] = [
    {
        id: 'death_spiral',
        name: 'Liquidity Shock',
        iconName: 'TrendingDown',
        description: 'Simulate a 50% instant price crash due to investor unlocks.',
        thesisPoint: 'Notice how high-OpEx networks suffer immediate mass churn (Capitulation), while low-OpEx networks merely hibernate. This proves that high-cost hardware is a systemic risk during volatility.',
        focusChart: 'The Capitulation Stack',
        params: {
            investorSellPct: 0.5, // 50% dump
            investorUnlockWeek: 20, // Week 20
            macro: 'bearish',
            growthCallEventPct: 0, // Reset others
            competitorYield: 0,
            maxMintWeekly: 5_000_000
        }
    },
    {
        id: 'infinite_subsidy',
        name: 'The Subsidy Trap',
        iconName: 'Infinity',
        description: 'High emissions with low organic demand.',
        thesisPoint: 'Observe the "Solvency Ratio" flatline below 0.5. The token price may rise temporarily, but the "Real Value" (Burn) never catches up, leading to an inevitable long-term collapse.',
        focusChart: 'Burn vs Emissions',
        params: {
            maxMintWeekly: 10_000_000, // Excessive printing
            demandType: 'consistent', // Flat demand
            burnPct: 0.1, // Low burn
            kMintPrice: 0.8, // High sensitivity to dilution
            investorSellPct: 0, // Reset
            growthCallEventPct: 0,
            competitorYield: 0,
            macro: 'neutral'
        }
    },
    {
        id: 'vampire_attack',
        name: 'Vampire Attack',
        iconName: 'Swords',
        description: 'A competitor offers 200% higher yields.',
        thesisPoint: 'Aggressive competitor yields drain your supply. If your "Moat" (Retention) is low, you will lose maximum node density in weeks, destroying the network effect.',
        focusChart: 'Treasury Health & Vampire Churn',
        params: {
            churnThreshold: 50, // Providers leave easily
            competitorYield: 2.0, // 200% advantage
            revenueStrategy: 'reserve', // Active treasury defense
            investorSellPct: 0, // Reset
            growthCallEventPct: 0,
            macro: 'bearish'
        }
    },
    {
        id: 'growth_shock',
        name: 'Aggressive Expansion',
        iconName: 'Zap',
        description: 'Viral marketing triggers +50% node growth in Week 20.',
        thesisPoint: 'Tests "Supply is King" thesis. If demand is laggy, this massive supply shock will crash token price (oversupply) unless the "Burn" (Usage) ramps up efficiently.',
        focusChart: 'Provider Count',
        params: {
            growthCallEventWeek: 20,
            growthCallEventPct: 0.5, // +50% instant growth
            demandType: 'growth', // Assume organic demand is growing
            investorSellPct: 0, // Reset
            competitorYield: 0,
            macro: 'bullish'
        }
    }
];
