import { useState, useEffect, useMemo } from 'react';
import { LegacySimulationParams, LegacySimResult, simulateOne } from '../model/legacy/engine';
import { ProtocolProfileV1 } from '../data/protocols';

export interface SensitivityResult {
    leverName: string;
    leverId: keyof LegacySimulationParams;
    baselineValue: number;
    impactScore: number; // 0-100 score of how much this lever affects the target metric
    direction: 'positive' | 'negative' | 'mixed'; // Improving lever increases/decreases metric
    description: string;
}

export const useSensitivityAnalysis = (
    baseParams: LegacySimulationParams,
    activeProfile: ProtocolProfileV1 | undefined
) => {
    const [results, setResults] = useState<SensitivityResult[]>([]);
    const [isCalculating, setIsCalculating] = useState(false);

    // Debounce params to avoid recalculating on every slider drag
    // In a real app we'd use useDebounce, here we rely on useEffect deps

    useEffect(() => {
        if (!activeProfile) return;

        const runAnalysis = async () => {
            setIsCalculating(true);

            // Allow UI to render loading state
            await new Promise(resolve => setTimeout(resolve, 10));

            const levers: { id: keyof LegacySimulationParams; name: string; desc: string }[] = [
                { id: 'maxMintWeekly', name: 'Emission Cap', desc: 'Weekly token mint limit' },
                { id: 'burnPct', name: 'Burn Rate', desc: '% of revenue burned' },
                { id: 'kDemandPrice', name: 'Demand Sensitivity', desc: 'Price impact from demand' },
                { id: 'providerCostPerWeek', name: 'Hardware Opex', desc: 'Weekly cost for providers' },
                { id: 'initialPrice', name: 'Token Price', desc: 'Starting token price' }
            ];

            // 1. Run Baseline
            // Use fixed seed for deterministic comparison
            const baselineSims = simulateOne({ ...baseParams, seed: 12345 }, 12345);
            // Target Metric: Final Sustainability Ratio (Burn / Mint) or Solvency Score
            const getScore = (sims: LegacySimResult[]) => {
                const last = sims[sims.length - 1];
                return last.solvencyScore; // Higher is better
            };
            const baselineScore = getScore(baselineSims);

            const calculatedResults: SensitivityResult[] = [];

            for (const lever of levers) {
                const baseVal = baseParams[lever.id] as number;

                // Test +10%
                const highParams = { ...baseParams, [lever.id]: baseVal * 1.1, seed: 12345 };
                const highSims = simulateOne(highParams, 12345);
                const highScore = getScore(highSims);

                // Test -10%
                const lowParams = { ...baseParams, [lever.id]: baseVal * 0.9, seed: 12345 };
                const lowSims = simulateOne(lowParams, 12345);
                const lowScore = getScore(lowSims);

                // Calculate Impact
                // Max deviation from baseline
                const deltaHigh = highScore - baselineScore;
                const deltaLow = lowScore - baselineScore;

                const range = Math.abs(highScore - lowScore);
                const impactRaw = range / (baselineScore || 1); // % change relative to baseline

                // Determine Direction
                // If increasing lever (+10%) increased score => Positive
                let direction: 'positive' | 'negative' | 'mixed' = 'mixed';
                if (deltaHigh > 0 && deltaLow < 0) direction = 'positive';
                else if (deltaHigh < 0 && deltaLow > 0) direction = 'negative';

                calculatedResults.push({
                    leverName: lever.name,
                    leverId: lever.id,
                    baselineValue: baseVal,
                    impactScore: Math.min(100, impactRaw * 100 * 5), // Scale to 0-100 roughly (5x multiplier for visibility)
                    direction,
                    description: lever.desc
                });
            }

            // Sort by Impact
            calculatedResults.sort((a, b) => b.impactScore - a.impactScore);

            setResults(calculatedResults.slice(0, 3)); // Keep Top 3
            setIsCalculating(false);
        };

        runAnalysis();

    }, [baseParams, activeProfile?.metadata.id]); // Re-run when params or profile changes

    return { results, isCalculating };
};
