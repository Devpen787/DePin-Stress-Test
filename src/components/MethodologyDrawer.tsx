import React from 'react';
import { X, BookOpen, Sigma } from 'lucide-react';
import { RESEARCH_CONTENT } from '../data/research';

interface MethodologyDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export const MethodologyDrawer: React.FC<MethodologyDrawerProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Drawer Panel */}
            <div className="relative w-full max-w-2xl h-full bg-slate-900 border-l border-slate-800 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">

                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-slate-900/95 backdrop-blur border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
                            <BookOpen size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight">Research Methodology</h2>
                            <p className="text-xs text-slate-400 font-mono">Thesis: DePIN Tokenomics Under Stress</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 space-y-10">

                    {/* Section 1.2: Methodology */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-bold text-indigo-400 uppercase tracking-widest border-b border-indigo-500/20 pb-2">
                            {RESEARCH_CONTENT.methodology.title}
                        </h3>
                        <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed space-y-4">
                            {RESEARCH_CONTENT.methodology.content.split('\n\n').map((paragraph, idx) => (
                                <p key={idx} dangerouslySetInnerHTML={{
                                    __html: paragraph.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
                                }} />
                            ))}
                        </div>
                    </section>

                    {/* Section 8: Math Models */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Sigma className="text-emerald-500" size={20} />
                            <h3 className="text-lg font-bold text-emerald-500 uppercase tracking-widest flex-1 border-b border-emerald-500/20 pb-2">
                                {RESEARCH_CONTENT.mathModels.title}
                            </h3>
                        </div>
                        <p className="text-sm text-slate-400 italic mb-6">{RESEARCH_CONTENT.mathModels.intro}</p>

                        <div className="space-y-8">
                            {RESEARCH_CONTENT.mathModels.models.map((model) => (
                                <div key={model.id} className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-colors">
                                    <div className="p-4 bg-slate-900/50 border-b border-slate-800 flex justify-between items-center">
                                        <h4 className="font-bold text-slate-200">{model.name}</h4>
                                    </div>
                                    <div className="p-5 space-y-4">
                                        <p className="text-sm text-slate-400">{model.description}</p>

                                        {/* Formula Box */}
                                        <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 font-mono text-center text-indigo-300 text-sm overflow-x-auto whitespace-nowrap custom-scrollbar">
                                            {model.formula}
                                        </div>

                                        {/* Variables */}
                                        {model.variables && (
                                            <div className="bg-slate-900/30 p-3 rounded-lg border border-slate-800/50">
                                                <ul className="space-y-1">
                                                    {model.variables.map((v, i) => (
                                                        <li key={i} className="text-xs text-slate-500 font-mono flex items-start gap-2">
                                                            <span className="text-slate-600">•</span>
                                                            {v}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Footer */}
                    <div className="pt-8 border-t border-slate-800 text-center">
                        <p className="text-xs text-slate-600 font-mono">
                            Source: "DePIN Tokenomics Under Stress" - Doctoral Research Thesis (2025)
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
};
