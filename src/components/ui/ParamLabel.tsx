import React, { useState } from 'react';
import { Lock, HelpCircle } from 'lucide-react';
import { SimulationParams as NewSimulationParams, getParamTooltip } from '../../model';

/**
 * Parameter label with tooltip
 */
const ParamLabel: React.FC<{
    label: string;
    paramKey?: keyof NewSimulationParams;
    locked?: boolean;
    children?: React.ReactNode;
}> = ({ label, paramKey, locked, children }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const tooltipText = paramKey ? getParamTooltip(paramKey) : '';

    return (
        <div className="relative">
            <label className="flex items-center gap-2 text-[9px] font-bold text-slate-600 uppercase mb-4 tracking-widest">
                {label}
                {locked && <Lock size={10} className="text-slate-500" />}
                {paramKey && tooltipText && (
                    <button
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                        className="p-0.5 text-slate-600 hover:text-indigo-400 transition-colors"
                    >
                        <HelpCircle size={10} />
                    </button>
                )}
                {children}
            </label>
            {showTooltip && tooltipText && (
                <div className="absolute left-0 top-6 z-50 w-64 p-3 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl text-[10px] text-slate-300 leading-relaxed whitespace-pre-wrap animate-in fade-in zoom-in-95 duration-150">
                    {tooltipText}
                </div>
            )}
        </div>
    );
};

export default ParamLabel;
