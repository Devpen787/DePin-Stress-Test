import React from 'react';
import { TrendingUp, TrendingDown, ShieldCheck, AlertOctagon } from 'lucide-react';
import { HeadToHeadMetric } from '../../viewmodels/BenchmarkViewModel';

interface EdgeSummaryProps {
    metrics: HeadToHeadMetric[];
}

export const EdgeSummary: React.FC<EdgeSummaryProps> = ({ metrics }) => {
    const validMetrics = metrics.filter(m => m.isValid);
    // Identify edges and lags
    const leads = validMetrics.filter(m =>
        (m.delta > 0 && m.betterDirection === 'higher') ||
        (m.delta < 0 && m.betterDirection === 'lower')
    );

    const lags = validMetrics.filter(m =>
        (m.delta < 0 && m.betterDirection === 'higher') ||
        (m.delta > 0 && m.betterDirection === 'lower')
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Competitive Edge */}
            <div className="bg-emerald-900/10 border border-emerald-500/20 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                    <TrendingUp size={16} className="text-emerald-400" />
                    <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest">Competitive Edge</h3>
                </div>
                <ul className="space-y-2">
                    {leads.length > 0 ? leads.map(m => (
                        <li key={m.metric} className="text-xs text-slate-300 flex items-start gap-2">
                            <ShieldCheck size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                            <span>
                                Onocoy has <strong className="text-white">better {m.metric}</strong>.
                                <span className="text-slate-500 ml-1">
                                    ({m.deltaType === 'percentage' ? '+' : ''}{Math.abs(m.delta).toFixed(1)}{m.deltaType === 'percentage' ? '%' : ''})
                                </span>
                            </span>
                        </li>
                    )) : (
                        <li className="text-xs text-slate-500 italic">No clear edges identified in this scenario.</li>
                    )}
                </ul>
            </div>

            {/* Competitive Risk */}
            <div className="bg-rose-900/10 border border-rose-500/20 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                    <TrendingDown size={16} className="text-rose-400" />
                    <h3 className="text-xs font-black text-rose-400 uppercase tracking-widest">Competitive Gap</h3>
                </div>
                <ul className="space-y-2">
                    {lags.length > 0 ? lags.map(m => (
                        <li key={m.metric} className="text-xs text-slate-300 flex items-start gap-2">
                            <AlertOctagon size={14} className="text-rose-500 mt-0.5 shrink-0" />
                            <span>
                                Trailing in <strong className="text-white">{m.metric}</strong>.
                                <span className="text-slate-500 ml-1">
                                    (-{Math.abs(m.delta).toFixed(1)}{m.deltaType === 'percentage' ? '%' : ''})
                                </span>
                            </span>
                        </li>
                    )) : (
                        <li className="text-xs text-slate-500 italic">Leading or neutral in all tracked metrics.</li>
                    )}
                </ul>
            </div>
        </div>
    );
};
