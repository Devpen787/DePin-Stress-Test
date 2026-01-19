import React, { useMemo } from 'react';
import {
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    Legend,
    ResponsiveContainer,
    Tooltip
} from 'recharts';
import { PeerId } from './PeerToggle';

// Peer colors matching PeerToggle
const COLORS: Record<string, string> = {
    onocoy: '#6366f1', // Indigo
    geodnet: '#f97316', // Orange
    hivemapper: '#10b981', // Emerald
    helium: '#a855f7' // Purple
};

interface RadarDataPoint {
    dimension: string;
    onocoy: number;
    geodnet: number;
    hivemapper: number;
    helium: number;
    fullMark: number;
}

interface StrategicEdgeRadarProps {
    selectedPeers: PeerId[];
    scenarioId: string;
}

// Mock radar data by scenario (keyed by scenario.id)
const SCENARIO_RADAR: Record<string, RadarDataPoint[]> = {
    // Default/Baseline
    baseline: [
        { dimension: 'Tech Stack', onocoy: 90, geodnet: 85, hivemapper: 80, helium: 75, fullMark: 100 },
        { dimension: 'Solvency', onocoy: 85, geodnet: 80, hivemapper: 70, helium: 95, fullMark: 100 },
        { dimension: 'Coverage', onocoy: 75, geodnet: 80, hivemapper: 85, helium: 95, fullMark: 100 },
        { dimension: 'Community', onocoy: 80, geodnet: 75, hivemapper: 90, helium: 60, fullMark: 100 },
        { dimension: 'Ease of Use', onocoy: 85, geodnet: 80, hivemapper: 75, helium: 60, fullMark: 100 }
    ],
    // Liquidity Shock (death_spiral)
    death_spiral: [
        { dimension: 'Tech Stack', onocoy: 90, geodnet: 85, hivemapper: 70, helium: 65, fullMark: 100 },
        { dimension: 'Solvency', onocoy: 80, geodnet: 70, hivemapper: 60, helium: 50, fullMark: 100 },
        { dimension: 'Coverage', onocoy: 70, geodnet: 75, hivemapper: 75, helium: 85, fullMark: 100 },
        { dimension: 'Community', onocoy: 75, geodnet: 70, hivemapper: 80, helium: 55, fullMark: 100 },
        { dimension: 'Ease of Use', onocoy: 80, geodnet: 70, hivemapper: 70, helium: 60, fullMark: 100 }
    ],
    // Subsidy Trap (infinite_subsidy)
    infinite_subsidy: [
        { dimension: 'Tech Stack', onocoy: 90, geodnet: 85, hivemapper: 80, helium: 75, fullMark: 100 },
        { dimension: 'Solvency', onocoy: 65, geodnet: 60, hivemapper: 55, helium: 50, fullMark: 100 },
        { dimension: 'Coverage', onocoy: 75, geodnet: 80, hivemapper: 85, helium: 90, fullMark: 100 },
        { dimension: 'Community', onocoy: 70, geodnet: 65, hivemapper: 80, helium: 55, fullMark: 100 },
        { dimension: 'Ease of Use', onocoy: 85, geodnet: 80, hivemapper: 75, helium: 60, fullMark: 100 }
    ],
    // Vampire Attack (vampire_attack)
    vampire_attack: [
        { dimension: 'Tech Stack', onocoy: 90, geodnet: 85, hivemapper: 80, helium: 75, fullMark: 100 },
        { dimension: 'Solvency', onocoy: 88, geodnet: 75, hivemapper: 65, helium: 60, fullMark: 100 },
        { dimension: 'Coverage', onocoy: 70, geodnet: 75, hivemapper: 80, helium: 90, fullMark: 100 },
        { dimension: 'Community', onocoy: 75, geodnet: 70, hivemapper: 85, helium: 50, fullMark: 100 },
        { dimension: 'Ease of Use', onocoy: 85, geodnet: 80, hivemapper: 75, helium: 60, fullMark: 100 }
    ],
    // Aggressive Expansion (growth_shock)
    growth_shock: [
        { dimension: 'Tech Stack', onocoy: 90, geodnet: 85, hivemapper: 80, helium: 75, fullMark: 100 },
        { dimension: 'Solvency', onocoy: 95, geodnet: 90, hivemapper: 85, helium: 98, fullMark: 100 },
        { dimension: 'Coverage', onocoy: 80, geodnet: 85, hivemapper: 90, helium: 98, fullMark: 100 },
        { dimension: 'Community', onocoy: 90, geodnet: 85, hivemapper: 95, helium: 70, fullMark: 100 },
        { dimension: 'Ease of Use', onocoy: 85, geodnet: 80, hivemapper: 75, helium: 60, fullMark: 100 }
    ]
};

export const StrategicEdgeRadar: React.FC<StrategicEdgeRadarProps> = ({
    selectedPeers,
    scenarioId
}) => {
    const data = useMemo(() => {
        return SCENARIO_RADAR[scenarioId] || SCENARIO_RADAR.baseline;
    }, [scenarioId]);

    return (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
            <div className="mb-2">
                <h3 className="text-sm font-bold text-white">Strategic "Edge"</h3>
                <p className="text-xs text-slate-400 mt-1">
                    Relative strengths vs Peer Set.
                </p>
            </div>

            <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                        <PolarGrid stroke="#334155" />
                        <PolarAngleAxis
                            dataKey="dimension"
                            tick={{ fill: '#94a3b8', fontSize: 10 }}
                        />
                        <PolarRadiusAxis
                            angle={90}
                            domain={[50, 100]}
                            tick={{ fill: '#64748b', fontSize: 8 }}
                            tickCount={3}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1e293b',
                                border: '1px solid #334155',
                                borderRadius: '8px',
                                fontSize: 12
                            }}
                        />

                        {/* Onocoy (Always shown, emphasized) */}
                        <Radar
                            name="Onocoy"
                            dataKey="onocoy"
                            stroke={COLORS.onocoy}
                            fill={COLORS.onocoy}
                            fillOpacity={0.3}
                            strokeWidth={2}
                        />

                        {/* Dynamic peer radars */}
                        {selectedPeers.includes('geodnet') && (
                            <Radar
                                name="Geodnet"
                                dataKey="geodnet"
                                stroke={COLORS.geodnet}
                                fill={COLORS.geodnet}
                                fillOpacity={0.15}
                                strokeWidth={1.5}
                            />
                        )}
                        {selectedPeers.includes('hivemapper') && (
                            <Radar
                                name="Hivemapper"
                                dataKey="hivemapper"
                                stroke={COLORS.hivemapper}
                                fill={COLORS.hivemapper}
                                fillOpacity={0.15}
                                strokeWidth={1.5}
                            />
                        )}
                        {selectedPeers.includes('helium') && (
                            <Radar
                                name="Helium"
                                dataKey="helium"
                                stroke={COLORS.helium}
                                fill={COLORS.helium}
                                fillOpacity={0.15}
                                strokeWidth={1.5}
                            />
                        )}
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
