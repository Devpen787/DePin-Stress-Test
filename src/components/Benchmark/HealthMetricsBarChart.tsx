import React, { useMemo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { PeerId } from './PeerToggle';

// Peer colors matching PeerToggle
const COLORS: Record<string, string> = {
    onocoy: '#6366f1', // Indigo
    geodnet: '#f97316', // Orange
    hivemapper: '#10b981', // Emerald
    helium: '#a855f7' // Purple
};

interface HealthMetricsBarChartProps {
    selectedPeers: PeerId[];
    onocoyData: Record<string, number>;
    peerData: Record<PeerId, Record<string, number>>;
}

// Normalize metrics to 0-100 scale
const normalizeMetric = (value: number, metric: string): number => {
    switch (metric) {
        case 'payback':
            // Lower is better: 24 months = 0, 0 months = 100
            return Math.max(0, Math.min(100, (24 - value) / 24 * 100));
        case 'efficiency':
            // Already 0-100
            return value;
        case 'sustain':
            // 0x = 0, 2x = 100
            return Math.max(0, Math.min(100, value * 50));
        case 'retention':
            // Scale 80-100 to 0-100 for better visualization
            return Math.max(0, (value - 80) * 5);
        default:
            return value;
    }
};

export const HealthMetricsBarChart: React.FC<HealthMetricsBarChartProps> = ({
    selectedPeers,
    onocoyData,
    peerData
}) => {
    const chartData = useMemo(() => {
        const metrics = ['payback', 'efficiency', 'sustain', 'retention'];
        const labels: Record<string, string> = {
            payback: 'Payback Score',
            efficiency: 'Efficiency',
            sustain: 'Sustainability',
            retention: 'Retention'
        };

        return metrics.map(metric => {
            const dataPoint: Record<string, string | number> = {
                metric: labels[metric],
                onocoy: normalizeMetric(onocoyData[metric] ?? 0, metric)
            };

            selectedPeers.forEach(peer => {
                dataPoint[peer] = normalizeMetric(peerData[peer]?.[metric] ?? 0, metric);
            });

            return dataPoint;
        });
    }, [onocoyData, peerData, selectedPeers]);

    const allBars = ['onocoy', ...selectedPeers];

    return (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
            <div className="mb-4">
                <h3 className="text-sm font-bold text-white">Key Health Metrics Comparison</h3>
                <p className="text-xs text-slate-400 mt-1">
                    Normalized scores (0-100 scale) for direct comparison.
                </p>
            </div>

            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                        barCategoryGap="20%"
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis
                            dataKey="metric"
                            stroke="#64748b"
                            tick={{ fill: '#94a3b8', fontSize: 10 }}
                        />
                        <YAxis
                            stroke="#64748b"
                            tick={{ fill: '#94a3b8', fontSize: 10 }}
                            domain={[0, 100]}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1e293b',
                                border: '1px solid #334155',
                                borderRadius: '8px',
                                fontSize: 12
                            }}
                            labelStyle={{ color: '#f1f5f9' }}
                            formatter={(value: number) => [value.toFixed(0), 'Score']}
                        />
                        <Legend
                            wrapperStyle={{ fontSize: 10 }}
                            iconType="square"
                        />

                        {allBars.map(key => (
                            <Bar
                                key={key}
                                dataKey={key}
                                name={key.charAt(0).toUpperCase() + key.slice(1)}
                                fill={COLORS[key]}
                                radius={[4, 4, 0, 0]}
                            />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
