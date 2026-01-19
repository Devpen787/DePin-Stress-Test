import React from 'react';
import { Share2, Clock, Info, AlertTriangle, Play, TrendingDown, Infinity, Swords, Zap } from 'lucide-react';
import { LegacySimulationParams as SimulationParams } from '../../model/legacy/engine';
import { ScenarioManager } from '../ui/ScenarioManager';
import { SCENARIOS } from '../../data/scenarios';

interface BenchmarkHeaderProps {
    params: SimulationParams;
    setParams: React.Dispatch<React.SetStateAction<SimulationParams>>;
    activeProtocolId: string;
    activeProtocolName: string;
    lastUpdated?: Date;
    engineLabel: string;
    activeScenarioId?: string | null;
}

export const BenchmarkHeader: React.FC<BenchmarkHeaderProps> = ({
    params,
    setParams,
    activeProtocolId,
    activeProtocolName,
    lastUpdated,
    engineLabel,
    activeScenarioId
}) => {
    // Find active scenario details
    const activeScenario = SCENARIOS.find(s => s.id === activeScenarioId);

    // Icon mapper
    const getIcon = (iconName: string) => {
        switch (iconName) {
            case 'TrendingDown': return <TrendingDown size={14} className="text-white" />;
            case 'Infinity': return <Infinity size={14} className="text-white" />;
            case 'Swords': return <Swords size={14} className="text-white" />;
            case 'Zap': return <Zap size={14} className="text-white" />;
            default: return <Play size={14} className="text-white" />;
        }
    };

    return (
        <div className="space-y-4 mb-8">
            {/* Disclaimer & Engine Badge */}
            <div className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                        <Share2 size={16} className="text-indigo-400" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-sm font-bold text-white">Benchmark Control Plane</h2>
                            {activeScenario && (
                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-600 rounded-full border border-indigo-400/30 shadow-lg shadow-indigo-500/20">
                                    {getIcon(activeScenario.iconName)}
                                    <span className="text-[10px] font-bold text-white uppercase tracking-wide">
                                        {activeScenario.name}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                                Engine: {engineLabel}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                            <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                <Clock size={10} />
                                Updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Live'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                        <AlertTriangle size={12} className="text-amber-500" />
                        <span className="text-[10px] font-medium text-amber-500">
                            Simulated Projections • Not Financial Advice
                        </span>
                    </div>

                    <ScenarioManager
                        currentParams={params}
                        protocolId={activeProtocolId}
                        protocolName={activeProtocolName}
                        onLoadScenario={(scenarioParams) => setParams(prev => ({ ...prev, ...scenarioParams }))}
                    />
                </div>
            </div>
        </div>
    );
};
