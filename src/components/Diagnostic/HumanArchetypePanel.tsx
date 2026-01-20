import React from 'react';
import { DiagnosticState, DiagnosticInput } from './types';
import { Scale, Gauge, Network, AlertTriangle, TrendingDown, Zap, ArrowRight } from 'lucide-react';

interface Props {
    inputs: DiagnosticInput;
    state: DiagnosticState;
}

interface ArchetypeData {
    id: string;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    colorClass: string;
    behavior: string;
    rationalization: string;
    reality: string;
    signal: string;
    verdict: string;
    verdictDetail: string;
}

export const HumanArchetypePanel: React.FC<Props> = ({ inputs, state }) => {

    let archetype: ArchetypeData;

    if (state.verdict === 'Robust') {
        archetype = {
            id: 'retargeting',
            title: "Human Archetype II",
            subtitle: "Incentive Re-Targeting",
            icon: <Scale size={28} className="text-emerald-400" />,
            colorClass: "emerald",
            behavior: "Fork in the Road: Choosing Quality over Quantity. Reward quality over quantity.",
            rationalization: "\"We must adapt to survive, even if it hurts short-term growth.\"",
            reality: "Slower growth initially, but higher efficiency and long-term survival.",
            signal: "Rising validation overhead, but stable or rising real revenue. Quality metrics improve.",
            verdict: "Adaptation over Panic",
            verdictDetail: "Do not confuse 'Incentive Strength' with 'Incentive Alignment'. This archetype prioritizes alignment."
        };
    } else if (inputs.emissionSchedule === 'Fixed') {
        archetype = {
            id: 'inertia',
            title: "Human Archetype I",
            subtitle: "Subsidy Inertia",
            icon: <Gauge size={28} className="text-red-400" />,
            colorClass: "red",
            behavior: "Refusing to cut emissions when demand is low. The 'Paralysis of Design'.",
            rationalization: "\"We need to keep miners happy for the future. Cutting rewards will kill growth.\"",
            reality: "Draining the treasury for a network that doesn't exist yet. Paying for presence, not utility.",
            signal: "Declining Burn-to-Emission Ratio (R_BE < 1.0) + Stable Nominal Rewards.",
            verdict: "Time-Shifting Risk",
            verdictDetail: "A mechanism that trades early stability for catastrophic adjustment later. The longer the delay, the harder the crash."
        };
    } else {
        archetype = {
            id: 'centralization',
            title: "Human Archetype III",
            subtitle: "Emergency Centralization",
            icon: <Network size={28} className="text-orange-400" />,
            colorClass: "orange",
            behavior: "\"The protocol is failing, let's manually pick the winners.\" Override the incentive layer.",
            rationalization: "\"Survival at all costs. We can decentralize again later.\"",
            reality: "Saves the network short-term, but kills the 'De' in DePIN. Power consolidates.",
            signal: "Reduced volatility, lower churn, but rising Gini Coefficient (Concentration of Power).",
            verdict: "Survivability over Purity",
            verdictDetail: "Prioritizing network survival over architectural purity. A necessary evil, but rarely reversible."
        };
    }

    const colorMap: Record<string, { bg: string; border: string; text: string; accent: string }> = {
        emerald: { bg: 'bg-emerald-950/20', border: 'border-emerald-500/30', text: 'text-emerald-400', accent: 'bg-emerald-500/10' },
        red: { bg: 'bg-red-950/20', border: 'border-red-500/30', text: 'text-red-400', accent: 'bg-red-500/10' },
        orange: { bg: 'bg-orange-950/20', border: 'border-orange-500/30', text: 'text-orange-400', accent: 'bg-orange-500/10' }
    };
    const colors = colorMap[archetype.colorClass];

    return (
        <div className={`w-full ${colors.bg} border ${colors.border} rounded-xl p-6 space-y-6`}>

            {/* Header */}
            <div className="flex items-center gap-4">
                <div className={`p-3 ${colors.accent} rounded-xl border ${colors.border}`}>
                    {archetype.icon}
                </div>
                <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{archetype.title}</p>
                    <h3 className={`text-xl font-bold ${colors.text}`}>{archetype.subtitle}</h3>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Left Column: Behavior & Rationalization */}
                <div className="space-y-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${colors.text.replace('text-', 'bg-')}`} />
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">The Behavior</span>
                        </div>
                        <p className="text-sm text-slate-200 leading-relaxed">{archetype.behavior}</p>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${colors.text.replace('text-', 'bg-')}`} />
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">The Rationalization</span>
                        </div>
                        <p className="text-sm text-slate-400 italic leading-relaxed">{archetype.rationalization}</p>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${colors.text.replace('text-', 'bg-')}`} />
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">The Reality</span>
                        </div>
                        <p className={`text-sm ${colors.text} font-medium leading-relaxed`}>{archetype.reality}</p>
                    </div>
                </div>

                {/* Right Column: Signal & Verdict */}
                <div className="space-y-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Zap size={12} className="text-yellow-500" />
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">The Signal</span>
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed">{archetype.signal}</p>
                    </div>

                    {/* Verdict Box */}
                    <div className={`${colors.accent} border ${colors.border} rounded-lg p-4 space-y-2`}>
                        <div className="flex items-center gap-2">
                            <AlertTriangle size={14} className={colors.text} />
                            <span className={`text-xs font-black ${colors.text} uppercase tracking-widest`}>Verdict</span>
                        </div>
                        <h4 className={`text-lg font-bold ${colors.text}`}>{archetype.verdict}</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">{archetype.verdictDetail}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
