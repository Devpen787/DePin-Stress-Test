import { useState, useEffect } from 'react';
import {
    PROTOCOL_PROFILES,
    ProtocolProfileV1
} from '../data/protocols';
import { PEER_GROUPS } from '../data/peerGroups';
import {
    type SimulationParams as NewSimulationParams,
    type AggregateResult as NewAggregateResult,
    type DerivedMetrics,
    runSimulation as runNewSimulation,
    calculateDerivedMetrics,
} from '../model';
// Use adapter instead of direct engine imports (Phase 9: Engine Consolidation)
import {
    SimulationParams,
    SimResult,
    AggregateResult,
    simulateOne
} from '../model/SimulationAdapter';
import { Optimizer } from '../model/optimizer';

export const useSimulationRunner = () => {
    // --- STATE ---
    const [viewMode, setViewMode] = useState<'sandbox' | 'comparison' | 'thesis' | 'benchmark' | 'settings' | 'explorer'>('sandbox');
    const [selectedProtocolIds, setSelectedProtocolIds] = useState<string[]>([PROTOCOL_PROFILES[0].metadata.id]);
    const [activeProfile, setActiveProfile] = useState<ProtocolProfileV1>(PROTOCOL_PROFILES[0]);
    const [focusChart, setFocusChart] = useState<string | null>(null);

    const [params, setParams] = useState<SimulationParams>({
        T: 52,
        initialSupply: PROTOCOL_PROFILES[0].parameters.supply.value,
        initialPrice: PROTOCOL_PROFILES[0].parameters.initial_price.value,
        maxMintWeekly: PROTOCOL_PROFILES[0].parameters.emissions.value,
        burnPct: PROTOCOL_PROFILES[0].parameters.burn_fraction.value,
        demandType: PROTOCOL_PROFILES[0].parameters.demand_regime.value,
        macro: 'bearish',
        nSims: 25,
        seed: 42,
        providerCostPerWeek: PROTOCOL_PROFILES[0].parameters.provider_economics.opex_weekly.value,
        baseCapacityPerProvider: 180.0,
        hardwareCost: PROTOCOL_PROFILES[0].parameters.hardware_cost.value,
        kDemandPrice: 0.15,
        kMintPrice: 0.35,
        rewardLagWeeks: PROTOCOL_PROFILES[0].parameters.adjustment_lag.value,
        churnThreshold: PROTOCOL_PROFILES[0].parameters.provider_economics.churn_threshold.value,
        initialLiquidity: 50000,
        investorUnlockWeek: 26,
        investorSellPct: 0.15,
        competitorYield: 0.0,
        emissionModel: 'fixed',
        revenueStrategy: 'burn',
        initialProviders: PROTOCOL_PROFILES[0].parameters.initial_active_providers?.value || 30,
        proTierPct: 0.0,
        proTierEfficiency: 1.5,
    });

    const [aggregated, setAggregated] = useState<AggregateResult[]>([]);
    const [multiAggregated, setMultiAggregated] = useState<Record<string, AggregateResult[]>>({});
    const [loading, setLoading] = useState(false);
    const [autoRun, setAutoRun] = useState(true);
    const [playbackWeek, setPlaybackWeek] = useState(52);
    const [derivedMetrics, setDerivedMetrics] = useState<DerivedMetrics | null>(null);
    const [useNewModel, setUseNewModel] = useState(true);

    // --- ACTIONS ---

    const runSimulation = () => {
        setLoading(true);
        setPlaybackWeek(0);

        setTimeout(() => {
            const allResults: Record<string, AggregateResult[]> = {};

            const benchmarkGroup = PEER_GROUPS[0];
            const benchmarkIds = benchmarkGroup ? benchmarkGroup.members : [];

            const protocolsToSimulate = viewMode === 'comparison'
                ? PROTOCOL_PROFILES.filter(p => selectedProtocolIds.includes(p.metadata.id))
                : viewMode === 'benchmark'
                    ? PROTOCOL_PROFILES.filter(p => benchmarkIds.includes(p.metadata.id))
                    : [activeProfile];

            protocolsToSimulate.forEach(profile => {
                const isSandbox = viewMode === 'sandbox';

                const localParams: NewSimulationParams = {
                    scenario: params.scenario,
                    T: params.T,
                    initialSupply: profile.parameters.supply.value,
                    initialPrice: params.initialPrice,
                    initialLiquidity: params.initialLiquidity,
                    investorUnlockWeek: params.investorUnlockWeek,
                    investorSellPct: params.investorSellPct,
                    maxMintWeekly: profile.parameters.emissions.value,
                    burnPct: isSandbox ? params.burnPct : profile.parameters.burn_fraction.value,
                    demandType: isSandbox ? params.demandType : profile.parameters.demand_regime.value,
                    baseDemand: 12000,
                    demandVolatility: 0.05,
                    macro: params.macro,
                    initialProviders: profile.parameters.initial_active_providers.value,
                    baseCapacityPerProvider: params.baseCapacityPerProvider,
                    capacityStdDev: 0.2,
                    providerCostPerWeek: isSandbox ? params.providerCostPerWeek : profile.parameters.provider_economics.opex_weekly.value,
                    costStdDev: 0.15,
                    hardwareLeadTime: 2,
                    churnThreshold: isSandbox ? params.churnThreshold : profile.parameters.provider_economics.churn_threshold.value,
                    profitThresholdToJoin: 15,
                    maxProviderGrowthRate: 0.15,
                    maxProviderChurnRate: 0.10,
                    kBuyPressure: 0.08,
                    kSellPressure: 0.12,
                    kDemandPrice: params.kDemandPrice,
                    kMintPrice: params.kMintPrice,
                    baseServicePrice: 0.5,
                    servicePriceElasticity: 0.6,
                    minServicePrice: 0.05,
                    maxServicePrice: 5.0,
                    rewardLagWeeks: profile.parameters.adjustment_lag.value,
                    nSims: params.nSims,
                    seed: params.seed,
                    competitorYield: params.competitorYield,
                    emissionModel: params.emissionModel,
                    revenueStrategy: params.revenueStrategy,
                    hardwareCost: params.hardwareCost,
                    proTierPct: params.proTierPct,
                    proTierEfficiency: params.proTierEfficiency,
                };

                let aggregate: AggregateResult[];

                if (useNewModel) {
                    const newResults = runNewSimulation(localParams);
                    aggregate = newResults.map(r => ({
                        t: r.t,
                        price: r.price,
                        supply: r.supply,
                        demand: r.demand,
                        demand_served: r.demandServed,
                        providers: r.providers,
                        capacity: r.capacity,
                        servicePrice: r.servicePrice,
                        minted: r.minted,
                        burned: r.burned,
                        utilization: r.utilisation,
                        profit: r.profit,
                        scarcity: r.scarcity,
                        incentive: r.incentive,
                        buyPressure: r.buyPressure,
                        sellPressure: r.sellPressure,
                        netFlow: r.netFlow,
                        churnCount: r.churnCount,
                        joinCount: r.joinCount,
                        solvencyScore: r.solvencyScore,
                        netDailyLoss: r.netDailyLoss,
                        dailyMintUsd: r.dailyMintUsd,
                        dailyBurnUsd: r.dailyBurnUsd,
                        urbanCount: r.urbanCount,
                        ruralCount: r.ruralCount,
                        weightedCoverage: r.weightedCoverage,
                        proCount: r.proCount || 0,
                        treasuryBalance: r.treasuryBalance || { mean: 0, p10: 0, p90: 0 },
                        vampireChurn: r.vampireChurn || { mean: 0, p10: 0, p90: 0 }
                    })) as unknown as AggregateResult[];

                    if (profile.metadata.id === activeProfile.metadata.id) {
                        const metrics = calculateDerivedMetrics(newResults, localParams);
                        setDerivedMetrics(metrics);
                    }
                } else {
                    const allSims: SimResult[][] = [];
                    for (let i = 0; i < params.nSims; i++) {
                        allSims.push(simulateOne(localParams as unknown as SimulationParams, params.seed + i));
                    }

                    aggregate = [];
                    const keys: (keyof SimResult)[] = ['price', 'supply', 'demand', 'demand_served', 'providers', 'capacity', 'servicePrice', 'minted', 'burned', 'utilization', 'profit', 'scarcity', 'incentive', 'solvencyScore', 'netDailyLoss', 'dailyMintUsd', 'dailyBurnUsd', 'treasuryBalance', 'vampireChurn'];

                    for (let tStep = 0; tStep < params.T; tStep++) {
                        const step: any = { t: tStep };
                        keys.forEach(key => {
                            const values = allSims.map(sim => sim[tStep]?.[key] as number).filter(v => v !== undefined).sort((a, b) => a - b);
                            if (values.length === 0) return;
                            const mean = values.reduce((a, b) => a + b, 0) / values.length;
                            const p10 = values[Math.floor(values.length * 0.1)] || 0;
                            const p90 = values[Math.floor(values.length * 0.9)] || 0;
                            step[key] = { mean, p10, p90 };
                        });
                        aggregate.push(step as AggregateResult);
                    }
                }

                allResults[profile.metadata.id] = aggregate;
            });

            setMultiAggregated(allResults);
            if (allResults[activeProfile.metadata.id]) {
                setAggregated(allResults[activeProfile.metadata.id]);
            }
            setLoading(false);
            setPlaybackWeek(params.T);
        }, 100);
    };

    const loadProfile = (profile: ProtocolProfileV1) => {
        setActiveProfile(profile);
        if (!selectedProtocolIds.includes(profile.metadata.id)) {
            setSelectedProtocolIds([...selectedProtocolIds, profile.metadata.id]);
        }
        setParams({
            ...params,
            initialSupply: profile.parameters.supply.value,
            initialPrice: profile.parameters.initial_price.value,
            maxMintWeekly: profile.parameters.emissions.value,
            burnPct: profile.parameters.burn_fraction.value,
            rewardLagWeeks: profile.parameters.adjustment_lag.value,
            providerCostPerWeek: profile.parameters.provider_economics.opex_weekly.value,
            churnThreshold: profile.parameters.provider_economics.churn_threshold.value,
            hardwareCost: profile.parameters.hardware_cost.value,
            initialProviders: profile.parameters.initial_active_providers?.value || 30,
        });
        setTimeout(runSimulation, 50);
    };

    const resetToDefaults = () => {
        loadProfile(activeProfile);
        setParams(prev => ({
            ...prev,
            scenario: 'baseline',
            macro: 'bearish',
            demandType: activeProfile.parameters.demand_regime.value,
            nSims: 25,
            competitorYield: 0.0,
            emissionModel: 'fixed',
            revenueStrategy: 'burn',
            initialLiquidity: 50000,
            investorSellPct: 0.15,
            hardwareCost: activeProfile.parameters.hardware_cost.value,
            initialProviders: activeProfile.parameters.initial_active_providers?.value || 30,
            proTierPct: 0.0,
            proTierEfficiency: 1.5,
        }));
        setViewMode('sandbox');
    };

    const toggleProtocolSelection = (id: string) => {
        if (selectedProtocolIds.includes(id)) {
            if (selectedProtocolIds.length > 1) {
                setSelectedProtocolIds(selectedProtocolIds.filter(pid => pid !== id));
            }
        } else {
            setSelectedProtocolIds([...selectedProtocolIds, id]);
        }
    };

    useEffect(() => {
        if (autoRun && (viewMode === 'sandbox' || viewMode === 'benchmark')) {
            const timer = setTimeout(() => {
                runSimulation();
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [params, autoRun, viewMode]);

    useEffect(() => { runSimulation(); }, []);

    return {
        params, setParams,
        aggregated,
        multiAggregated,
        loading,
        autoRun, setAutoRun,
        playbackWeek, setPlaybackWeek,
        derivedMetrics,
        viewMode, setViewMode,
        selectedProtocolIds,
        activeProfile,
        runSimulation,
        resetToDefaults,
        toggleProtocolSelection,
        loadProfile,
        setSelectedProtocolIds,
        focusChart, setFocusChart,
        useNewModel, setUseNewModel,
        findBreakEven: () => {
            setLoading(true);
            setTimeout(() => {
                const optimalPrice = Optimizer.findBreakEvenPrice(params, 'solvency', 1.0);
                setParams(prev => ({ ...prev, initialPrice: optimalPrice }));
                setLoading(false);
            }, 100);
        },
        runOptimization: (type: 'scale' | 'defense') => {
            setLoading(true);
            setTimeout(() => {
                if (type === 'scale') {
                    const maxScale = Optimizer.findMaxScalableSupply(params);
                    setParams(prev => ({ ...prev, initialProviders: maxScale }));
                } else if (type === 'defense') {
                    // Ensure we have a threat to defend against
                    const threat = params.competitorYield > 0 ? params.competitorYield : 0.5;
                    const optimalEmission = Optimizer.findRetentionAPY({ ...params, competitorYield: threat });
                    setParams(prev => ({ ...prev, maxMintWeekly: optimalEmission, competitorYield: threat }));
                }
                setLoading(false);
            }, 100);
        }
    };
};
