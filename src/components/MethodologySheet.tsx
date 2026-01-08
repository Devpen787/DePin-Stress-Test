import React from 'react';
import { X, BookOpen, Binary, ShieldAlert, Target, TrendingDown, TrendingUp, Activity } from 'lucide-react';
import { PARAM_DOCS } from '../model/params';

interface MethodologySheetProps {
    isOpen: boolean;
    onClose: () => void;
}

export const MethodologySheet: React.FC<MethodologySheetProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="relative w-full max-w-2xl h-full bg-slate-950 border-l border-slate-800 shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                            <BookOpen size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">Methodology & Glossary</h2>
                            <p className="text-xs text-slate-500 font-medium">Thesis Validation Framework • DePIN Volatility Model 1.2</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-500 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-12">

                    {/* Section 1: Core Definitions */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                            <ShieldAlert size={16} className="text-rose-400" />
                            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Critical Definitions</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <span className="text-xs font-bold text-slate-300 uppercase block">The Death Spiral</span>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    A recursive feedback loop where <span className="text-rose-400">Price Crash → Miner Churn → Network Utility Drop → Further Price Crash</span>.
                                    Our model defines this as a <span className="font-mono text-rose-400">{'>'}40%</span> recursive drop in 4 weeks.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <span className="text-xs font-bold text-slate-300 uppercase block">Shareholder Dilution</span>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    When <code>Net Emissions {'>'} Net Burn</code>.
                                    The protocol is subsidizing operations via inflation, diluting token holders to pay hardware operators.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <span className="text-xs font-bold text-slate-300 uppercase block">Miner Capitulation</span>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    The "Kill Switch" event where token rewards fall below OpEx for {'>'}6 weeks, triggering mass node disconnection.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <span className="text-xs font-bold text-slate-300 uppercase block">Reliability Premium</span>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    The additional cost users are willing to pay for a network with {'>'}99.9% uptime (High Resilience Score).
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Section 2: Mathematical Models */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                            <Binary size={16} className="text-indigo-400" />
                            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Mathematical Models</h3>
                        </div>

                        <div className="space-y-8">
                            <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
                                <div className="flex justify-between items-start mb-4">
                                    <h4 className="text-sm font-bold text-white">1. Burn-and-Mint Equilibrium (BME)</h4>
                                    <span className="text-[10px] font-mono text-slate-500">Module 01</span>
                                </div>
                                <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs text-indigo-300 mb-4 border border-slate-800/50">
                                    P_market = (Demand_fiat) / (Velocity * Supply_circulating)
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    The theoretical price floor where fiat demand for service credits exactly matches the USD value of tokens burned for access.
                                </p>
                            </div>

                            <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
                                <div className="flex justify-between items-start mb-4">
                                    <h4 className="text-sm font-bold text-white">2. Geometric Brownian Motion (GBM)</h4>
                                    <span className="text-[10px] font-mono text-slate-500">Stochastic Engine</span>
                                </div>
                                <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs text-indigo-300 mb-4 border border-slate-800/50">
                                    dS_t = µS_t dt + σS_t dW_t
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Used to model organic price drift and demand volatility.
                                    <br /><code>µ (Drift)</code>: Macro sentiment (Bear/Bull).
                                    <br /><code>σ (Volatility)</code>: Crypto-native variance (5-6% daily).
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Section 3: Parameter Reference */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                            <Activity size={16} className="text-emerald-400" />
                            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Key Parameters</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {Object.entries(PARAM_DOCS).map(([key, doc]) => (
                                <div key={key} className="flex flex-col md:flex-row md:items-start gap-4 p-4 bg-slate-900/30 rounded-lg hover:bg-slate-900/50 transition-colors border border-slate-800/50">
                                    <div className="w-32 shrink-0">
                                        <span className="text-[10px] font-mono font-bold text-indigo-400 block break-words">{doc.name}</span>
                                        <span className="text-[9px] text-slate-600 block mt-1">{doc.unit}</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-slate-300 mb-1 font-medium">{doc.description}</p>
                                        <p className="text-[10px] text-slate-500 italic">Impact: {doc.impact}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-800 bg-slate-900/50 text-center">
                    <p className="text-[10px] text-slate-600">
                        DePIN Stress Test Framework v1.2 • Implemented by Google DeepMind Agents
                    </p>
                </div>
            </div>
        </div>
    );
};
