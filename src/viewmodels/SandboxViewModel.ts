/**
 * SandboxViewModel - Extracted data transformations from SandboxView
 * 
 * This ViewModel separates data shaping logic from presentation,
 * improving testability and maintainability.
 */

import { useMemo } from 'react';
import { LegacyAggregateResult as AggregateResult, LegacySimulationParams as SimulationParams } from '../model/legacy/engine';
import { assessConvergence, calculateAverageCV, ConvergenceResult } from '../utils/convergence';
import { normalizeBenchmark } from '../utils/benchmarkLoader';
import { HELIUM_BENCHMARK } from '../data/benchmarks/helium';

// ============================================================================
// TYPES
// ============================================================================

export interface ProcessedDataPoint extends AggregateResult {
    cumulativeNetLoss: number;
    retentionRate: number;  // Percentage (0-100)
    benchmarkPrice?: number | null;
}

export interface CounterfactualPoint {
    t: number;
    capacityRef: number;
    providersRef: number;
    burnRef: number;
    utilizationRef: number;
    pricingRef: number;
}

export interface DerivedMetrics {
    solvencyRatio: number;
    retentionRate: number;
    paybackPeriodMonths: number;
    treasuryBalance: number;
    providerCount: number;
    utilization: number;
}

export interface SandboxViewData {
    displayedData: ProcessedDataPoint[];
    counterfactualData: CounterfactualPoint[];
    chartDataWithBenchmark: ProcessedDataPoint[];
    stabilityResult: ConvergenceResult;
    lastMetrics: DerivedMetrics;
}

// ============================================================================
// DATA TRANSFORMATIONS
// ============================================================================

/**
 * Smart filtering for performance/clarity
 * Reduces data points while preserving important changes
 */
function smartFilter(data: AggregateResult[], aggregated: AggregateResult[], playbackWeek: number): AggregateResult[] {
    if (data.length < 25) return data;

    return data.filter((d, index) => {
        // Always show first 15 and last 5 points
        if (index <= 15) return true;
        if (index >= playbackWeek - 5) return true;

        // Show points with significant changes
        const prev = aggregated[index - 1];
        if (!prev) return true;

        const prevPrice = Math.max(prev.price?.mean || 0, 0.0001);
        const prevNodes = Math.max(prev.providers?.mean || 0, 1);
        const priceChangePct = Math.abs(d.price.mean - prevPrice) / prevPrice;
        const nodeChangePct = Math.abs(d.providers.mean - prevNodes) / prevNodes;

        return (priceChangePct > 0.05) || (nodeChangePct > 0.05);
    });
}

/**
 * Process data points with derived metrics
 */
function processDataPoints(data: AggregateResult[]): ProcessedDataPoint[] {
    let runningTotalLoss = 0;

    return data.map(d => {
        const netDailyLoss = d.netDailyLoss?.mean || 0;
        runningTotalLoss += netDailyLoss;

        // Calculate Weekly Retention Rate
        const churn = d.churnCount?.mean || 0;
        const startProviders = d.providers.mean + churn;
        const retentionRate = startProviders > 0
            ? Math.max(0, 1 - (churn / startProviders))
            : 1;

        return {
            ...d,
            cumulativeNetLoss: runningTotalLoss,
            retentionRate: retentionRate * 100
        };
    });
}

/**
 * Generate counterfactual reference data
 */
function generateCounterfactual(aggregated: AggregateResult[], initialPrice: number): CounterfactualPoint[] {
    return aggregated.map(d => ({
        t: d.t,
        capacityRef: (d.demand_served?.mean || 0) * 1.2,
        providersRef: 30,
        burnRef: d.minted?.mean || 0,
        utilizationRef: 60,
        pricingRef: initialPrice
    }));
}

/**
 * Calculate payback period in months
 */
function calculatePaybackPeriod(
    lastPoint: AggregateResult,
    hardwareCost: number,
    providerCostPerWeek: number
): number {
    if (!lastPoint) return Infinity;

    const weeklyRevenue = (lastPoint.minted.mean / Math.max(1, lastPoint.providers.mean)) * lastPoint.price.mean;
    const profit = weeklyRevenue - providerCostPerWeek;

    if (profit <= 0) return Infinity;
    return (hardwareCost / profit) / 4.33; // Convert weeks to months
}

/**
 * Extract derived metrics from last data point
 */
function extractDerivedMetrics(aggregated: AggregateResult[], params: SimulationParams): DerivedMetrics {
    const lastPoint = aggregated[aggregated.length - 1];

    if (!lastPoint) {
        return {
            solvencyRatio: 0,
            retentionRate: 100,
            paybackPeriodMonths: Infinity,
            treasuryBalance: 0,
            providerCount: 0,
            utilization: 0
        };
    }

    return {
        solvencyRatio: lastPoint.solvencyScore?.mean || 0,
        retentionRate: 100, // Will be recalculated with churn
        paybackPeriodMonths: calculatePaybackPeriod(lastPoint, params.hardwareCost, params.providerCostPerWeek),
        treasuryBalance: lastPoint.treasuryBalance?.mean || 0,
        providerCount: lastPoint.providers?.mean || 0,
        utilization: lastPoint.utilization?.mean || 0
    };
}

// ============================================================================
// MAIN HOOK
// ============================================================================

/**
 * useSandboxViewModel - Main hook for SandboxView data
 * 
 * Extracts all data transformations from the view component,
 * making logic testable and the view purely presentational.
 */
export function useSandboxViewModel(
    aggregated: AggregateResult[],
    params: SimulationParams,
    playbackWeek: number,
    showBenchmark: boolean
): SandboxViewData {

    // Displayed data with smart filtering and derived fields
    const displayedData = useMemo(() => {
        if (!aggregated.length) return [];
        const sliced = aggregated.slice(0, playbackWeek);
        const filtered = smartFilter(sliced, aggregated, playbackWeek);
        return processDataPoints(filtered);
    }, [aggregated, playbackWeek]);

    // Counterfactual reference data
    const counterfactualData = useMemo(() => {
        if (!aggregated.length) return [];
        return generateCounterfactual(aggregated, params.initialPrice);
    }, [aggregated, params.initialPrice]);

    // Benchmark data (Helium historical)
    const benchmarkData = useMemo(() => {
        if (!showBenchmark) return [];
        return normalizeBenchmark(
            HELIUM_BENCHMARK,
            params.initialPrice,
            params.initialProviders,
            params.T
        );
    }, [showBenchmark, params.initialPrice, params.initialProviders, params.T]);

    // Merge benchmark into chart data
    const chartDataWithBenchmark = useMemo(() => {
        if (!showBenchmark || benchmarkData.length === 0) return displayedData;
        return displayedData.map(d => {
            const bm = benchmarkData.find(b => b.t === d.t);
            return {
                ...d,
                benchmarkPrice: bm?.benchmarkPrice || null
            };
        });
    }, [displayedData, benchmarkData, showBenchmark]);

    // Stability assessment
    const stabilityResult = useMemo(() => {
        if (!aggregated.length) return assessConvergence(params.nSims, 1);

        const means = aggregated.map(d => d.price?.mean || 0);
        const stdDevs = aggregated.map(d => d.price?.stdDev || 0);
        const avgCV = calculateAverageCV(means, stdDevs);

        return assessConvergence(params.nSims, avgCV);
    }, [aggregated, params.nSims]);

    // Derived metrics from last point
    const lastMetrics = useMemo(() => {
        return extractDerivedMetrics(aggregated, params);
    }, [aggregated, params]);

    return {
        displayedData,
        counterfactualData,
        chartDataWithBenchmark,
        stabilityResult,
        lastMetrics
    };
}

export default useSandboxViewModel;
