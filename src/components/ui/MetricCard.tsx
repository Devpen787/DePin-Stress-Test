import React from 'react';

// Using any for icon as it was in original index.tsx, but ideally should be LucideIcon
const MetricCard: React.FC<{
    title: string;
    value: string;
    subValue?: string;
    subColor?: string;
    icon?: any;
    tooltip?: string;
    formula?: string;
    source?: string;
    className?: string;
}> = ({ title, value, subValue, subColor, icon: Icon, tooltip, formula, source, className }) => (
    <div className={`bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm group relative flex flex-col justify-between h-full ${className || ''}`}>
        <div>
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <div className="text-slate-500 text-[9px] font-bold uppercase tracking-wider">{title}</div>
                    {formula && (
                        <div className="px-1.5 py-0.5 bg-indigo-500/10 border border-indigo-500/30 rounded text-[8px] font-mono text-indigo-400 opacity-50 group-hover:opacity-100 transition-opacity cursor-help" title="Formula Available">
                            ƒx
                        </div>
                    )}
                </div>
                {Icon && <Icon size={14} className="text-slate-700" />}
            </div>
            <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold text-white tracking-tight">{value}</div>
                {subValue && <div className={`text-[10px] font-bold ${subColor || 'text-rose-400'}`}>{subValue}</div>}
            </div>
        </div>
        {source && (
            <div className="mt-3 pt-2 border-t border-slate-800/50">
                <span className="text-[8px] text-slate-600 font-mono tracking-tight flex items-center gap-1">
                    SRC: <span className="text-slate-500">{source}</span>
                </span>
            </div>
        )}

        {/* Combined Tooltip for Description & Formula */}
        {(tooltip || formula) && (
            <div className="absolute top-full left-0 mt-2 w-64 p-3 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-[110] text-[10px] leading-relaxed font-medium">
                {tooltip && <div className="text-slate-400 mb-2">{tooltip}</div>}
                {formula && (
                    <div className="bg-slate-900 p-2 rounded border border-slate-800 mt-1">
                        <span className="text-[8px] text-indigo-400 font-bold uppercase block mb-1">Mathematical Model</span>
                        <code className="text-indigo-200 font-mono text-[9px]">{formula}</code>
                    </div>
                )}
            </div>
        )}
    </div>
);

export default MetricCard;
