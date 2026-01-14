import React from 'react';

const FormulaDisplay: React.FC<{ label: string; formula: string }> = ({ label, formula }) => (
    <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 shadow-inner group transition-colors hover:border-indigo-500/50">
            <code className="text-[11px] text-slate-300 font-mono block overflow-x-auto whitespace-nowrap custom-scrollbar pb-1">{formula}</code>
        </div>
    </div>
);

export default FormulaDisplay;
