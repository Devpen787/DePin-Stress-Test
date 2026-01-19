import React, { useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts';
import { PeerId } from './PeerToggle';

interface SolvencyDataPoint {
    month: string;
    onocoy: number;
    geodnet?: number;
    hivemapper?: number;
    helium?: number;
}

// Peer colors matching PeerToggle
const COLORS: Record<string, string> = {
    onocoy: '#6366f1', // Indigo
    geodnet: '#f97316', // Orange
    hivemapper: '#10b981', // Emerald
    helium: '#a855f7' // Purple
};

interface SolvencyProjectionChartProps {
    selectedPeers: PeerId[];
    scenarioId: string;
}

// Mock solvency projection data by scenario (keyed by scenario.id)
const SCENARIO_DATA: Record<string, SolvencyDataPoint[]> = {
    // Default/Baseline
    baseline: [
        { month: 'Now', onocoy: 100, geodnet: 100, hivemapper: 100, helium: 100 },
        { month: 'M3', onocoy: 102, geodnet: 101, hivemapper: 98, helium: 99 },
        { month: 'M6', onocoy: 105, geodnet: 102, hivemapper: 97, helium: 98 },
        { month: 'M9', onocoy: 108, geodnet: 103, hivemapper: 105, helium: 97 },
        { month: 'M12', onocoy: 112, geodnet: 104, hivemapper: 110, helium: 96 },
        { month: 'M18', onocoy: 118, geodnet: 106, hivemapper: 115, helium: 94 },
        { month: 'M24', onocoy: 125, geodnet: 108, hivemapper: 120, helium: 92 }
    ],
    // Liquidity Shock (death_spiral)
    death_spiral: [
        { month: 'Now', onocoy: 100, geodnet: 100, hivemapper: 100, helium: 100 },
        { month: 'M3', onocoy: 85, geodnet: 75, hivemapper: 70, helium: 60 },
        { month: 'M6', onocoy: 80, geodnet: 65, hivemapper: 60, helium: 45 },
        { month: 'M9', onocoy: 85, geodnet: 60, hivemapper: 55, helium: 40 },
        { month: 'M12', onocoy: 92, geodnet: 58, hivemapper: 58, helium: 38 },
        { month: 'M18', onocoy: 100, geodnet: 55, hivemapper: 62, helium: 35 },
        { month: 'M24', onocoy: 108, geodnet: 52, hivemapper: 65, helium: 30 }
    ],
    // Subsidy Trap (infinite_subsidy)
    infinite_subsidy: [
        { month: 'Now', onocoy: 100, geodnet: 100, hivemapper: 100, helium: 100 },
        { month: 'M3', onocoy: 95, geodnet: 92, hivemapper: 88, helium: 85 },
        { month: 'M6', onocoy: 88, geodnet: 85, hivemapper: 80, helium: 75 },
        { month: 'M9', onocoy: 82, geodnet: 78, hivemapper: 72, helium: 65 },
        { month: 'M12', onocoy: 78, geodnet: 72, hivemapper: 68, helium: 58 },
        { month: 'M18', onocoy: 70, geodnet: 65, hivemapper: 60, helium: 50 },
        { month: 'M24', onocoy: 65, geodnet: 58, hivemapper: 55, helium: 42 }
    ],
    // Vampire Attack (vampire_attack)
    vampire_attack: [
        { month: 'Now', onocoy: 100, geodnet: 100, hivemapper: 100, helium: 100 },
        { month: 'M3', onocoy: 98, geodnet: 95, hivemapper: 90, helium: 85 },
        { month: 'M6', onocoy: 97, geodnet: 90, hivemapper: 85, helium: 70 },
        { month: 'M9', onocoy: 98, geodnet: 88, hivemapper: 82, helium: 65 },
        { month: 'M12', onocoy: 100, geodnet: 85, hivemapper: 80, helium: 60 },
        { month: 'M18', onocoy: 104, geodnet: 83, hivemapper: 85, helium: 55 },
        { month: 'M24', onocoy: 108, geodnet: 80, hivemapper: 88, helium: 50 }
    ],
    // Aggressive Expansion (growth_shock)
    growth_shock: [
        { month: 'Now', onocoy: 100, geodnet: 100, hivemapper: 100, helium: 100 },
        { month: 'M3', onocoy: 120, geodnet: 115, hivemapper: 110, helium: 105 },
        { month: 'M6', onocoy: 140, geodnet: 130, hivemapper: 125, helium: 110 },
        { month: 'M9', onocoy: 160, geodnet: 145, hivemapper: 150, helium: 115 },
        { month: 'M12', onocoy: 180, geodnet: 160, hivemapper: 180, helium: 120 },
        { month: 'M18', onocoy: 210, geodnet: 180, hivemapper: 200, helium: 130 },
        { month: 'M24', onocoy: 250, geodnet: 200, hivemapper: 220, helium: 140 }
    ]
};

// Runway estimates by scenario (keyed by scenario.id)
const RUNWAY_ESTIMATES: Record<string, { months: number; date: string }> = {
    baseline: { months: 36, date: 'Jan 2029' },
    death_spiral: { months: 12, date: 'Jan 2027' },       // Liquidity Shock
    infinite_subsidy: { months: 14, date: 'Mar 2027' },   // Subsidy Trap
    vampire_attack: { months: 18, date: 'Jul 2027' },     // Vampire Attack
    growth_shock: { months: 48, date: 'Jan 2030' }        // Aggressive Expansion
};

// Critical threshold (solvency index below this = danger)
const CRITICAL_THRESHOLD = 70;

export const SolvencyProjectionChart: React.FC<SolvencyProjectionChartProps> = ({
    selectedPeers,
    scenarioId
}) => {
    const data = useMemo(() => {
        return SCENARIO_DATA[scenarioId] || SCENARIO_DATA.baseline;
    }, [scenarioId]);

    const runway = useMemo(() => {
        return RUNWAY_ESTIMATES[scenarioId] || RUNWAY_ESTIMATES.baseline;
    }, [scenarioId]);

    // Determine health status
    const healthStatus = useMemo(() => {
        if (runway.months >= 24) return { label: 'Healthy', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
        if (runway.months >= 12) return { label: 'Caution', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' };
        return { label: 'Critical', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' };
    }, [runway]);

    return (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
            {/* Header with Runway Badge */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                <div>
                    <h3 className="text-sm font-bold text-white">Solvency Projection (24 Months)</h3>
                    <p className="text-xs text-slate-400 mt-1">
                        Runway projection based on selected scenario parameters.
                    </p>
                </div>

                {/* Treasury Runway Badge */}
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${healthStatus.bg} ${healthStatus.border}`}>
                    <div className="text-right">
                        <div className="text-[10px] text-slate-400 uppercase tracking-wide">Treasury Runway</div>
                        <div className="text-sm font-bold text-white">{runway.date}</div>
                    </div>
                    <div className={`text-xs font-bold px-2 py-1 rounded ${healthStatus.bg} ${healthStatus.color}`}>
                        {healthStatus.label}
                    </div>
                </div>
            </div>

            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis
                            dataKey="month"
                            stroke="#64748b"
                            tick={{ fill: '#94a3b8', fontSize: 10 }}
                        />
                        <YAxis
                            stroke="#64748b"
                            tick={{ fill: '#94a3b8', fontSize: 10 }}
                            domain={['auto', 'auto']}
                            label={{
                                value: 'Solvency Index',
                                angle: -90,
                                position: 'insideLeft',
                                fill: '#64748b',
                                fontSize: 10
                            }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1e293b',
                                border: '1px solid #334155',
                                borderRadius: '8px',
                                fontSize: 12
                            }}
                            labelStyle={{ color: '#f1f5f9' }}
                        />
                        <Legend
                            wrapperStyle={{ fontSize: 10 }}
                            iconType="circle"
                        />
                        <ReferenceLine y={100} stroke="#475569" strokeDasharray="5 5" label={{ value: 'Baseline', position: 'right', fill: '#64748b', fontSize: 9 }} />
                        <ReferenceLine y={CRITICAL_THRESHOLD} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Critical', position: 'right', fill: '#ef4444', fontSize: 9 }} />

                        {/* Onocoy (Always shown) */}
                        <Line
                            type="monotone"
                            dataKey="onocoy"
                            name="Onocoy"
                            stroke={COLORS.onocoy}
                            strokeWidth={3}
                            dot={{ fill: COLORS.onocoy, r: 3 }}
                            activeDot={{ r: 5 }}
                        />

                        {/* Dynamic peer lines */}
                        {selectedPeers.includes('geodnet') && (
                            <Line
                                type="monotone"
                                dataKey="geodnet"
                                name="Geodnet"
                                stroke={COLORS.geodnet}
                                strokeWidth={2}
                                dot={{ fill: COLORS.geodnet, r: 2 }}
                            />
                        )}
                        {selectedPeers.includes('hivemapper') && (
                            <Line
                                type="monotone"
                                dataKey="hivemapper"
                                name="Hivemapper"
                                stroke={COLORS.hivemapper}
                                strokeWidth={2}
                                dot={{ fill: COLORS.hivemapper, r: 2 }}
                            />
                        )}
                        {selectedPeers.includes('helium') && (
                            <Line
                                type="monotone"
                                dataKey="helium"
                                name="Helium"
                                stroke={COLORS.helium}
                                strokeWidth={2}
                                dot={{ fill: COLORS.helium, r: 2 }}
                            />
                        )}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
