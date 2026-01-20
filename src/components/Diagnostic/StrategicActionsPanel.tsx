import React from 'react';
import { AlertTriangle, CheckCircle, ArrowRight, Shield } from 'lucide-react';
import { DiagnosticInput, DiagnosticState } from './types';

interface Props {
    inputs: DiagnosticInput;
    state: DiagnosticState;
}

export const StrategicActionsPanel: React.FC<Props> = ({ inputs, state }) => {
    // Generate Recommendations
    const recommendations: { level: 'Critical' | 'Warning' | 'Good', text: string, action: string }[] = [];

    // 1. Subsidy Trap Checks
    if (state.r_be < 0.5) {
        recommendations.push({
            level: 'Critical',
            text: `R_BE is ${state.r_be.toFixed(2)} (Insolvent Zones). Protocol is bleeding value.`,
            action: "IMMEDIATE: Switch to Dynamic Emission Schedule to peg burn to demand."
        });
    } else if (state.r_be < 1.0) {
        recommendations.push({
            level: 'Warning',
            text: `Deficit spending detected (R_BE: ${state.r_be.toFixed(2)}).`,
            action: "Plan transition to Dynamic Emissions within 6 months."
        });
    }

    // 2. Churn / miner Profile Checks
    if (inputs.minerProfile === 'Mercenary' && inputs.priceShock !== 'None') {
        recommendations.push({
            level: 'Critical',
            text: `Mercenary capital flight risk is extreme. NRR drops to ${state.nrr}% under stress.`,
            action: "Mechanism Design: Implement 'Proof of Engagement' or longer staking locks to filter mercenaries."
        });
    }

    // 3. Density / Governance Checks
    if (inputs.growthCoordination === 'Uncoordinated') {
        recommendations.push({
            level: 'Warning',
            text: "Uncoordinated growth is diluting individual miner ROI.",
            action: "Implement 'Hex-Capped' rewards to disincentivize over-density."
        });
    }

    // 4. Insider Overhang (LUR)
    if (inputs.insiderOverhang === 'High') {
        recommendations.push({
            level: 'Critical',
            text: `High Insider Overhang (${inputs.insiderOverhang}) threatens order book depth.`,
            action: "Treasury Management: Diversify into stablecoins to buy back during 'Cliff Events'."
        });
    }

    if (recommendations.length === 0) {
        recommendations.push({
            level: 'Good',
            text: "System appears structurally robust under current assumptions.",
            action: "Maintain current parameters. Monitor volatility."
        });
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Shield size={20} className="text-indigo-500" />
                    Strategic Engineering Mandates
                </h2>
            </div>

            <div className="grid gap-3">
                {recommendations.map((rec, i) => (
                    <div
                        key={i}
                        className={`p-4 rounded-xl border flex items-start gap-4 ${rec.level === 'Critical' ? 'bg-red-500/10 border-red-500/20' :
                                rec.level === 'Warning' ? 'bg-orange-500/10 border-orange-500/20' :
                                    'bg-emerald-500/10 border-emerald-500/20'
                            }`}
                    >
                        <div className={`mt-1 p-1.5 rounded-full ${rec.level === 'Critical' ? 'bg-red-500/20 text-red-400' :
                                rec.level === 'Warning' ? 'bg-orange-500/20 text-orange-400' :
                                    'bg-emerald-500/20 text-emerald-400'
                            }`}>
                            {rec.level === 'Critical' ? <AlertTriangle size={16} /> :
                                rec.level === 'Warning' ? <AlertTriangle size={16} /> :
                                    <CheckCircle size={16} />}
                        </div>

                        <div className="flex-1">
                            <h4 className={`text-sm font-bold uppercase tracking-wider mb-1 ${rec.level === 'Critical' ? 'text-red-400' :
                                    rec.level === 'Warning' ? 'text-orange-400' :
                                        'text-emerald-400'
                                }`}>
                                {rec.level} Priority
                            </h4>
                            <p className="text-slate-300 text-sm mb-2">{rec.text}</p>

                            <div className="flex items-center gap-2 text-indigo-300 bg-slate-900/50 p-2 rounded-lg text-xs font-mono">
                                <ArrowRight size={12} />
                                <span className="font-bold">ACTION:</span>
                                {rec.action}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
