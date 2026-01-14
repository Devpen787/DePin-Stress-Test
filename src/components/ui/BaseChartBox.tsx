import React, { useState, useEffect } from 'react';
import { ResponsiveContainer } from 'recharts';
import { Waves, HelpCircle, Maximize2, X, Binary, ShieldAlert } from 'lucide-react';
import { CHART_INTERPRETATIONS } from '../../data/chartInterpretations';

const BaseChartBox: React.FC<{
    title: string;
    icon: any;
    color: string;
    onExpand?: () => void;
    isDriver?: boolean;
    driverColor?: string;
    tooltip?: string;
    source?: string;
    className?: string;
    heightClass?: string;
    children: React.ReactNode
}> = ({ title, icon: Icon, color, onExpand, isDriver, driverColor = 'indigo', source, heightClass = "h-[380px]", children }) => {
    const interp = CHART_INTERPRETATIONS[title];
    const [showInterp, setShowInterp] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className={`bg-slate-900 border ${isDriver ? `border-${driverColor}-500/50 shadow-[0_0_20px_rgba(0,0,0,0.5),0_0_10px_rgba(var(--${driverColor}-rgb),0.2)]` : 'border-slate-800'} rounded-xl p-5 flex flex-col ${heightClass} shadow-sm relative overflow-hidden group transition-all duration-500`}>
            {isDriver && (
                <div className={`absolute top-0 right-0 px-3 py-1 bg-${driverColor}-500 text-white text-[8px] font-black uppercase tracking-widest rounded-bl-lg shadow-lg z-20 animate-pulse flex items-center gap-1.5`}>
                    <Waves size={10} />
                    Primary Signal
                </div>
            )}

            <div className="flex flex-col mb-4 z-10">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg bg-slate-950/50 text-${color}-400`}>
                            <Icon size={16} />
                        </div>
                        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-tight">{title}</h3>
                    </div>
                    <div className="flex items-center gap-1.5">
                        {interp && (
                            <button
                                onClick={() => setShowInterp(!showInterp)}
                                className={`p-1 rounded-full transition-colors ${showInterp ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-600 hover:text-slate-400'}`}
                                title="Academic Interpretation"
                            >
                                <HelpCircle size={14} />
                            </button>
                        )}
                        {onExpand && (
                            <button
                                onClick={onExpand}
                                className="p-1 rounded-full text-slate-600 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"
                                title="Expand Focused View"
                            >
                                <Maximize2 size={14} />
                            </button>
                        )}
                    </div>
                </div>
                <p className="text-[9px] text-slate-500 font-medium italic pl-8">{interp?.subtitle}</p>
            </div>

            <div className="flex-1 w-full min-h-[50px] min-w-[200px] relative">
                {/* Only render ResponsiveContainer client-side after mount to ensure dimensions are available */}
                <div style={{ width: '100%', height: '100%' }}>
                    {mounted ? (
                        <ResponsiveContainer width="100%" height="100%" minHeight={50} minWidth={200} debounce={50}>
                            {children as any}
                        </ResponsiveContainer>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center space-y-2 opacity-50">
                            <div className="w-full h-[80%] bg-slate-800/50 rounded-lg animate-pulse" />
                            <div className="w-24 h-2 bg-slate-800/50 rounded animate-pulse" />
                        </div>
                    )}
                </div>
                {source && (
                    <div className="absolute bottom-0 right-0 pointer-events-none">
                        <span className="text-[8px] text-slate-600 font-mono bg-slate-900/80 px-1 py-0.5 rounded backdrop-blur">
                            SRC: {source}
                        </span>
                    </div>
                )}
            </div>

            {showInterp && interp && (
                <div className="absolute inset-0 bg-slate-950 border-t border-slate-800 p-6 z-20 animate-in fade-in slide-in-from-bottom-2 duration-200 flex flex-col justify-start">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest bg-indigo-400/10 px-2 py-0.5 rounded">Research Context</span>
                        <button onClick={() => setShowInterp(false)} className="text-slate-600 hover:text-white bg-slate-800/50 p-1 rounded-full transition-colors"><X size={12} /></button>
                    </div>
                    <div className="space-y-5 overflow-y-auto custom-scrollbar pr-2">
                        <div>
                            <p className="text-[11px] text-slate-100 font-bold leading-relaxed mb-1">{interp.question}</p>
                            <div className="bg-slate-900 p-2 rounded-lg mb-3 border border-slate-800 flex items-center gap-2">
                                <Binary size={10} className="text-indigo-400" />
                                <code className="text-[9px] text-slate-400 font-mono">{interp.formula}</code>
                            </div>
                            <div className="flex items-center gap-2 p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                                <ShieldAlert size={12} className="text-rose-500 shrink-0" />
                                <span className="text-[9px] font-bold uppercase text-rose-400">System Risk: {interp.failureMode}</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-5 pt-3 border-t border-slate-800">
                            <div>
                                <span className="text-[9px] font-bold text-emerald-500 uppercase block mb-1.5">Robust Signal</span>
                                <p className="text-[10px] text-slate-400 leading-normal">{interp.robust}</p>
                            </div>
                            <div>
                                <span className="text-[9px] font-bold text-rose-500 uppercase block mb-1.5">Fragile Signal</span>
                                <p className="text-[10px] text-slate-400 leading-normal">{interp.fragile}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BaseChartBox;
