import React from 'react';
import { Settings2, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { SensitivityResult } from '../../hooks/useSensitivityAnalysis';

interface SensitivitySummaryProps {
    results: SensitivityResult[];
    isLoading: boolean;
}

export const SensitivitySummary: React.FC<SensitivitySummaryProps> = ({ results, isLoading }) => {
    return (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <Settings2 size={16} className="text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-200">Key Sustainability Levers</h3>
            </div>

            {isLoading ? (
                <div className="space-y-3 animate-pulse">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-10 bg-slate-800/50 rounded-lg" />
                    ))}
                </div>
            ) : (
                <div className="space-y-3">
                    {results.map((lever, idx) => (
                        <div key={lever.leverId} className="group relative bg-slate-800/30 hover:bg-slate-800/60 transition-colors rounded-lg p-2.5 border border-slate-700/30">

                            <div className="flex justify-between items-center mb-1.5">
                                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                                    <span className="text-indigo-500/50 font-mono">{idx + 1}.</span>
                                    {lever.leverName}
                                </span>
                                <div className="flex items-center gap-1 text-[10px] font-mono">
                                    {lever.direction === 'positive' && <ArrowUpRight size={10} className="text-emerald-400" />}
                                    {lever.direction === 'negative' && <ArrowDownRight size={10} className="text-rose-400" />}
                                    {lever.direction === 'mixed' && <Minus size={10} className="text-amber-400" />}
                                    <span className={
                                        lever.direction === 'positive' ? 'text-emerald-400' :
                                            lever.direction === 'negative' ? 'text-rose-400' : 'text-amber-400'
                                    }>
                                        {lever.direction === 'positive' ? 'Pro-cyclical' :
                                            lever.direction === 'negative' ? 'Counter-cyclical' : 'Mixed'}
                                    </span>
                                </div>
                            </div>

                            {/* Impact Bar */}
                            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000"
                                    style={{ width: `${Math.max(5, lever.impactScore)}%` }}
                                />
                            </div>

                            {/* Tooltip on Hover */}
                            <div className="absolute left-0 -top-8 w-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <div className="bg-slate-950 border border-slate-700 text-[10px] text-slate-300 p-1.5 rounded shadow-xl text-center">
                                    {lever.description} (Impact: {lever.impactScore.toFixed(0)}/100)
                                </div>
                            </div>
                        </div>
                    ))}

                    {results.length === 0 && (
                        <div className="text-xs text-slate-500 text-center py-4 italic">
                            No significant levers found.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
