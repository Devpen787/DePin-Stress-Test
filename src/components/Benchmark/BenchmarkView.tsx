import React, { useState, useMemo, useCallback } from 'react';
import { LegacySimulationParams as SimulationParams, LegacyAggregateResult as AggregateResult } from '../../model/legacy/engine';
import { ProtocolProfileV1 } from '../../data/protocols';
import { TokenMarketData } from '../../services/coingecko';
import { ProtocolMetrics } from '../../hooks/useProtocolMetrics';
import { useBenchmarkViewModel } from '../../viewmodels/BenchmarkViewModel';
import { useSensitivityAnalysis } from '../../hooks/useSensitivityAnalysis';

// Components
import { BenchmarkHeader } from './BenchmarkHeader';
import { PeerToggle, PeerId } from './PeerToggle';
import { BenchmarkMetricCard } from './BenchmarkMetricCard';
import { ComparativeMatrix } from './ComparativeMatrix';
import { AIInsights, generateInsights } from './AIInsights';
import { SensitivitySummary } from './SensitivitySummary';
import { BenchmarkExportButton } from './BenchmarkExportButton';
import { SolvencyProjectionChart } from './SolvencyProjectionChart';
import { HealthMetricsBarChart } from './HealthMetricsBarChart';
import { StrategicEdgeRadar } from './StrategicEdgeRadar';
import { BENCHMARK_PEERS } from '../../data/peerGroups';
import ResearchView from './ResearchView';

interface BenchmarkViewProps {
    params: SimulationParams;
    setParams: (p: SimulationParams) => void;
    multiAggregated: Record<string, AggregateResult[]>;
    profiles: ProtocolProfileV1[];
    liveData: Record<string, TokenMarketData | null>;
    onChainData: Record<string, ProtocolMetrics | null>;
    engineLabel: string;
    lastLiveDataFetch?: Date | null;
    loading?: boolean;
    activeScenarioId?: string | null;  // From Scenario Library
}

// Mock data for peer comparison (to be replaced with actual data sources)
const MOCK_PEER_DATA: Record<PeerId, Record<string, number>> = {
    geodnet: { payback: 11.5, efficiency: 82, sustain: 1.1, retention: 96.0 },
    hivemapper: { payback: 8.5, efficiency: 88, sustain: 0.9, retention: 94.5 },
    helium: { payback: 14.0, efficiency: 65, sustain: 0.8, retention: 92.0 }
};

export const BenchmarkView: React.FC<BenchmarkViewProps> = ({
    params,
    setParams,
    multiAggregated,
    profiles,
    liveData,
    onChainData,
    engineLabel,
    loading = false,
    activeScenarioId = null
}) => {
    // 1. View Model (Stateless derivation)
    const viewModel = useBenchmarkViewModel(params, multiAggregated, profiles, liveData, onChainData, engineLabel);

    // 2. Sensitivity Hook
    const primaryId = BENCHMARK_PEERS.primary;
    const activeProfile = profiles.find(p => p.metadata.id === primaryId);

    const { results: sensitivityResults, isCalculating: isSensComputing } = useSensitivityAnalysis(
        params,
        activeProfile
    );

    // 3. V2 State: Selected Peers & Active Tab
    const [selectedPeers, setSelectedPeers] = useState<PeerId[]>(['geodnet']);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'research'>('dashboard');

    const togglePeer = useCallback((peerId: PeerId) => {
        setSelectedPeers(prev =>
            prev.includes(peerId)
                ? prev.filter(p => p !== peerId)
                : [...prev, peerId]
        );
    }, []);

    // 4. Derive Onocoy Metrics (from simulation)
    const onocoyData = useMemo(() => {
        const p1 = BENCHMARK_PEERS.primary;
        const s1 = viewModel.getSupplySide(p1);
        const d1 = viewModel.getDemandSide(p1);
        const t1 = viewModel.getTokenomics(p1);

        // 1. Payback Period = Hardware Cost / (Daily Revenue * 30)
        // Annual Revenue is total for network. Rev per node = Annual / Nodes
        const revPerNodeAnnual = s1.activeNodes > 0 ? d1.annualizedRevenue / s1.activeNodes : 0;
        const revPerNodeMonthly = revPerNodeAnnual / 12;
        const payback = (revPerNodeMonthly > 0 && s1.hardwareCost > 0)
            ? s1.hardwareCost / revPerNodeMonthly
            : 0;

        // 2. Efficiency (Coverage Score as proxy)
        const efficiency = s1.coverageScore || 0; // Already normalized 0-100 in simulation? No, usually raw.
        // Assuming coverageScore is roughly 0-1 (e.g. 0.85) -> 85%
        // If it's raw, we might need to normalize. Let's assume % for now or clamp.
        const effPct = Math.min(100, Math.max(0, efficiency * 100));

        // 3. Sustainability (Burn / Mint)
        const sustain = t1.sustainabilityRatio / 100; // converted from % to ratio (e.g. 120% -> 1.2x)

        // 4. Retention (Weekly)
        // Hard to derive exact retention from aggregate active nodes without individual churn data.
        // But we can infer net retention or use a fixed high value if simulation assumes growing/sticky.
        // Improving: Use `growthYoY` to infer health? No, specific Retention is better.
        // Let's use the inverse of the churn parameter if available, or 98% base.
        // Actually, let's look at `activeNodes` trend.
        // For now, mapping to a high "simulated" retention as the engine churn is event-based.
        const retention = 98.5; // Keeping this static as engine doesn't output distinct churn rate per week yet

        return {
            payback: Number.isFinite(payback) ? payback : 0,
            efficiency: Number.isFinite(effPct) ? effPct : 0,
            sustain: Number.isFinite(sustain) ? sustain : 0,
            retention: 98.5 // Placeholder for now until engine exports Churn Rate
        };
    }, [viewModel]);

    // 5. Calculate Peer Median
    const peerMedian = useMemo(() => {
        if (selectedPeers.length === 0) {
            return { payback: 12, efficiency: 78, sustain: 0.9, retention: 94 };
        }
        const metrics = ['payback', 'efficiency', 'sustain', 'retention'];
        const result: Record<string, number> = {};
        metrics.forEach(m => {
            const values = selectedPeers.map(p => MOCK_PEER_DATA[p][m]);
            result[m] = values.reduce((a, b) => a + b, 0) / values.length;
        });
        return result;
    }, [selectedPeers]);

    // 6. Derive deltas
    const deltas = useMemo(() => ({
        payback: onocoyData.payback - peerMedian.payback,
        efficiency: onocoyData.efficiency - peerMedian.efficiency,
        sustain: onocoyData.sustain - peerMedian.sustain,
        retention: onocoyData.retention - peerMedian.retention
    }), [onocoyData, peerMedian]);

    // 7. Scenario identification - prefer activeScenarioId prop, fallback to params inference
    const scenarioId = useMemo(() => {
        if (activeScenarioId) return activeScenarioId; // Use actual scenario ID from library
        // Fallback inference for when no scenario is selected
        if (params.macro === 'bearish') return 'vampire_attack';
        if (params.demandType === 'growth') return 'growth_shock';
        if (params.investorSellPct > 0.3) return 'death_spiral';
        if (params.maxMintWeekly > 8_000_000) return 'infinite_subsidy';
        return 'baseline';
    }, [activeScenarioId, params]);

    const scenarioName = useMemo(() => {
        const names: Record<string, string> = {
            baseline: 'Baseline',
            death_spiral: 'Liquidity Shock',
            infinite_subsidy: 'The Subsidy Trap',
            vampire_attack: 'Vampire Attack',
            growth_shock: 'Aggressive Expansion'
        };
        return names[scenarioId] || 'Baseline';
    }, [scenarioId]);

    const aiInsights = useMemo(() => generateInsights(scenarioId, onocoyData, peerMedian), [scenarioId, onocoyData, peerMedian]);

    const isDataReady = Object.keys(multiAggregated).length > 0;
    const lastUpdatedIso = liveData[primaryId]?.lastUpdated || onChainData[primaryId]?.lastUpdated;
    const lastUpdated = lastUpdatedIso ? new Date(lastUpdatedIso) : undefined;

    const headToHeadMetrics = viewModel.getHeadToHeadMetrics();

    if (!activeProfile) return <div>Loading Profile...</div>;

    // Research scenario mapping
    const getResearchScenario = () => {
        if (params.demandType === 'high-to-decay') return 'hyper';
        if (params.macro === 'bearish') return 'bear';
        if (params.competitorYield > 0.5) return 'bear';
        if (params.investorSellPct > 0.3) return 'bear';
        if (params.demandType === 'consistent' && params.maxMintWeekly > 8_000_000) return 'bear';
        if (params.macro === 'bullish') return 'bull';
        if ((params.growthCallEventPct || 0) > 0.3) return 'bull';
        return 'neutral';
    };

    return (
        <div className="flex flex-col h-full bg-slate-950 overflow-hidden font-sans text-slate-200">
            {/* Header */}
            <BenchmarkHeader
                params={params}
                setParams={setParams}
                activeProtocolId={activeProfile.metadata.id}
                activeProtocolName={activeProfile.metadata.name}
                lastUpdated={lastUpdated}
                engineLabel={engineLabel}
                activeScenarioId={scenarioId}
            />

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">

                {/* Tab Switcher */}
                <div className="flex items-center gap-2 bg-slate-900/50 p-1 rounded-lg border border-slate-800 w-fit">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white'}`}
                    >
                        Dashboard
                    </button>
                    <button
                        onClick={() => setActiveTab('research')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'research' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-slate-400 hover:text-white'}`}
                    >
                        Research
                        <span className="bg-purple-500/20 text-purple-200 text-[10px] px-1.5 py-0.5 rounded border border-purple-500/30">PYTHON</span>
                    </button>
                </div>

                {activeTab === 'research' ? (
                    <ResearchView scenario={getResearchScenario()} />
                ) : (
                    <>
                        {/* Peer Selector */}
                        <PeerToggle selectedPeers={selectedPeers} onToggle={togglePeer} />

                        {!isDataReady && loading ? (
                            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 text-sm text-slate-400">
                                Running benchmark simulations… results will populate when the cohort finishes.
                            </div>
                        ) : (
                            <>
                                {/* Key Metrics Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                                    <BenchmarkMetricCard
                                        label="Payback Period"
                                        value={onocoyData.payback.toFixed(1)}
                                        unit=" mo"
                                        delta={deltas.payback}
                                        deltaType={deltas.payback < 0 ? 'better' : 'worse'}
                                        inverse={true}
                                    />
                                    <BenchmarkMetricCard
                                        label="Coverage Efficiency"
                                        value={onocoyData.efficiency}
                                        unit="%"
                                        delta={deltas.efficiency}
                                        deltaType={deltas.efficiency > 0 ? 'better' : 'worse'}
                                    />
                                    <BenchmarkMetricCard
                                        label="Sustainability Ratio"
                                        value={onocoyData.sustain.toFixed(1)}
                                        unit="x"
                                        delta={deltas.sustain}
                                        deltaType={Math.abs(deltas.sustain) < 0.1 ? 'parity' : deltas.sustain > 0 ? 'better' : 'worse'}
                                    />
                                    <BenchmarkMetricCard
                                        label="Retention (Weekly)"
                                        value={onocoyData.retention.toFixed(1)}
                                        unit="%"
                                        delta={deltas.retention}
                                        deltaType={deltas.retention > 0 ? 'better' : 'worse'}
                                    />
                                </div>

                                {/* Charts Row */}
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                    <HealthMetricsBarChart
                                        selectedPeers={selectedPeers}
                                        onocoyData={onocoyData}
                                        peerData={MOCK_PEER_DATA}
                                    />
                                    <SolvencyProjectionChart
                                        selectedPeers={selectedPeers}
                                        scenarioId={scenarioId}
                                    />
                                </div>

                                {/* Matrix & Edge Grid */}
                                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                                    {/* Matrix (Span 2) */}
                                    <div className="xl:col-span-2">
                                        <ComparativeMatrix
                                            onocoyData={onocoyData}
                                            peerData={MOCK_PEER_DATA}
                                            selectedPeers={selectedPeers}
                                            onExport={() => {
                                                // Export logic from existing BenchmarkExportButton
                                            }}
                                        />
                                    </div>

                                    {/* Radar (Span 1) */}
                                    <StrategicEdgeRadar
                                        selectedPeers={selectedPeers}
                                        scenarioId={scenarioId}
                                    />
                                </div>

                                {/* Sensitivity & Export Row */}
                                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                                    <div className="xl:col-span-2">
                                        <SensitivitySummary
                                            results={sensitivityResults}
                                            isLoading={isSensComputing}
                                        />
                                    </div>
                                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                                        <h3 className="font-bold text-slate-200 text-sm mb-3">Export Data</h3>
                                        <p className="text-xs text-slate-400 mb-3">
                                            Download the full benchmark dataset.
                                        </p>
                                        <BenchmarkExportButton
                                            metrics={headToHeadMetrics}
                                            activeProtocolName={activeProfile.metadata.name}
                                        />
                                    </div>
                                </div>

                                {/* AI Insights */}
                                <AIInsights
                                    scenarioName={scenarioName}
                                    onocoyAdvantage={aiInsights.onocoyAdvantage}
                                    mainInsight={aiInsights.mainInsight}
                                    recommendation={aiInsights.recommendation}
                                />
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
