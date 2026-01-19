import React from 'react';
import { Bot } from 'lucide-react';

interface AIInsightsProps {
    scenarioName: string;
    onocoyAdvantage: string; // e.g., "15% efficiency advantage"
    mainInsight: string;
    recommendation: string;
}

export const AIInsights: React.FC<AIInsightsProps> = ({
    scenarioName,
    onocoyAdvantage,
    mainInsight,
    recommendation
}) => {
    return (
        <section className="bg-gradient-to-br from-indigo-900/80 to-slate-900 border border-indigo-500/30 rounded-xl p-6 mt-6">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <span className="bg-indigo-600/50 p-1.5 rounded-lg">
                    <Bot size={14} className="text-indigo-300" />
                </span>
                AI Analysis: Scenario Impact
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Position Analysis */}
                <div>
                    <h4 className="font-semibold text-indigo-300 text-xs uppercase tracking-wide mb-2">
                        Onocoy's Position
                    </h4>
                    <p className="text-sm text-slate-300 leading-relaxed">
                        Under the <strong className="text-white">{scenarioName}</strong> scenario,
                        Onocoy demonstrates a <strong className="text-emerald-400">{onocoyAdvantage}</strong> over
                        the peer cohort. {mainInsight}
                    </p>
                </div>

                {/* Recommendation */}
                <div>
                    <h4 className="font-semibold text-indigo-300 text-xs uppercase tracking-wide mb-2">
                        Recommended Action
                    </h4>
                    <p className="text-sm text-slate-300 leading-relaxed">
                        {recommendation}
                    </p>
                </div>
            </div>
        </section>
    );
};

// Utility to generate insights based on scenario and data
export const generateInsights = (
    scenarioId: string,
    onocoyData: Record<string, number>,
    peerMedian: Record<string, number>
): Omit<AIInsightsProps, 'scenarioName'> => {
    // Calculate efficiency advantage
    const efficiencyDelta = (onocoyData.efficiency ?? 0) - (peerMedian.efficiency ?? 80);
    const efficiencyAdvStr = efficiencyDelta > 0
        ? `${efficiencyDelta.toFixed(0)}% efficiency advantage`
        : `${Math.abs(efficiencyDelta).toFixed(0)}% efficiency gap to close`;

    // Scenario-specific insights (keyed by scenario.id)
    const insights: Record<string, { main: string; rec: string }> = {
        baseline: {
            main: 'Hardware overhead remains competitive, and retention metrics are strong.',
            rec: 'Focus operator acquisition on coverage density rather than raw count to maintain the OPEX advantage. Monitor Geodnet\'s token emission schedule in Q3.'
        },
        death_spiral: {
            main: 'Lower token price sensitivity gives Onocoy more runway than competitors with aggressive emission schedules.',
            rec: 'Monitor investor unlock schedules. Consider adding POL (Protocol-Owned Liquidity) to stabilize price during volatile periods.'
        },
        infinite_subsidy: {
            main: 'High emissions relative to burn create long-term solvency risk. "Solvency Ratio" may flatline below sustainable levels.',
            rec: 'Reduce emission rate by 15-20% to extend runway. Implement burn incentives to improve tokenomics balance.'
        },
        vampire_attack: {
            main: 'Aggressive competitor yields threaten node retention. Focus on differentiators beyond APY.',
            rec: 'Strengthen non-yield value props (coverage quality, API reliability). Consider matching yields temporarily while building moat.'
        },
        growth_shock: {
            main: 'Network capacity headroom allows Onocoy to capture demand surge without emergency scaling.',
            rec: 'Pre-position marketing for potential viral adoption windows. Ensure treasury has reserves for accelerated emissions if growth exceeds projections.'
        }
    };

    const scenarioInsight = insights[scenarioId] ?? insights.baseline;

    return {
        onocoyAdvantage: efficiencyAdvStr,
        mainInsight: scenarioInsight.main,
        recommendation: scenarioInsight.rec
    };
};
