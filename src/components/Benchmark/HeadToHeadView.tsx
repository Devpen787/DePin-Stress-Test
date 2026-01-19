import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, FlaskConical, Activity } from 'lucide-react';
import { HeadToHeadMetric } from '../../viewmodels/BenchmarkViewModel';
import { formatCompact } from '../../utils/format';

interface HeadToHeadViewProps {
    metrics: HeadToHeadMetric[];
    primaryName: string;
    competitorName: string;
}

export const HeadToHeadView: React.FC<HeadToHeadViewProps> = ({
    metrics,
    primaryName,
    competitorName
}) => {
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-wider">Head-to-Head</h3>
                    <p className="text-xs text-slate-400 mt-1">
                        Direct comparison under identical stress scenarios.
                    </p>
                </div>
                <div className="flex gap-4 text-xs font-bold uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                        <span className="text-white">{primaryName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-slate-600"></span>
                        <span className="text-slate-400">{competitorName}</span>
                    </div>
                </div>
            </div>

            <div className="divide-y divide-slate-800/50">
                {metrics.map((m, idx) => {
                    const isPositive = m.delta > 0;
                    const isBetter = (isPositive && m.betterDirection === 'higher') ||
                        (!isPositive && m.betterDirection === 'lower');

                    const deltaColor = m.delta === 0 ? 'text-slate-500' :
                        isBetter ? 'text-emerald-400' : 'text-rose-400';

                    const DeltaIcon = m.delta > 0 ? ArrowUpRight : m.delta < 0 ? ArrowDownRight : Minus;
                    const isLive = m.sourceLabel === 'Live Data' || m.sourceLabel === 'Anchored';

                    const formatValue = (value: number) => {
                        if (!Number.isFinite(value)) return '—';
                        if (m.metric.includes('Ratio') || m.metric.includes('ROI') || m.unit === '%') return `${value.toFixed(1)}%`;
                        if (m.unit === 'USD') return `$${formatCompact(value)}`;
                        return formatCompact(value);
                    };

                    const deltaDisplay = m.isValid ? `${Math.abs(m.delta).toFixed(1)}${m.deltaType === 'percentage' ? '%' : ''}` : '—';

                    return (
                        <div key={idx} className={`p-5 flex items-center justify-between hover:bg-slate-800/20 transition-colors group ${idx === 2 || idx === 3 ? 'bg-indigo-500/5 border-l-2 border-indigo-500' : 'border-l-2 border-transparent'}`}>
                            <div className="flex items-center gap-4 w-1/3">
                                <div className={`p-2 rounded-lg ${isLive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                                    {isLive ? <Activity size={16} /> : <FlaskConical size={16} />}
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-slate-300 uppercase tracking-wider group-hover:text-white transition-colors">
                                        {m.metric}
                                    </div>
                                    <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-0.5">
                                        {m.sourceLabel}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-12 w-2/3">
                                <div className="text-right relative">
                                    {isBetter && isPositive && (
                                        <div className="absolute -left-6 top-1 text-emerald-400 animate-pulse">
                                            <ArrowUpRight size={14} />
                                        </div>
                                    )}
                                    <div className={`text-xl font-mono font-bold ${isBetter && m.isValid ? 'text-emerald-400' : 'text-slate-200'}`}>
                                        {formatValue(m.onocoyValue)}
                                    </div>
                                </div>

                                <div className="w-24 flex flex-col items-center justify-center">
                                    <div className={`flex items-center text-xs font-bold ${m.isValid ? deltaColor : 'text-slate-500'} bg-slate-950/50 px-2 py-1 rounded-md border border-slate-800`}>
                                        <DeltaIcon size={12} className="mr-1" />
                                        {deltaDisplay}
                                    </div>
                                </div>

                                <div className="text-right w-24">
                                    <div className="text-lg font-mono font-bold text-slate-500">
                                        {m.isValid ? formatValue(m.competitorValue) : '—'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
