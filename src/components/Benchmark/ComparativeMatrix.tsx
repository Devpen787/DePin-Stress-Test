import React from 'react';
import { Download } from 'lucide-react';
import { PeerId } from './PeerToggle';

interface MetricRow {
    id: string;
    label: string;
    inverse: boolean; // Lower is better?
    unit?: string;
}

const METRICS: MetricRow[] = [
    { id: 'payback', label: 'Payback (Mo)', inverse: true },
    { id: 'efficiency', label: 'Coverage Eff.', inverse: false, unit: '%' },
    { id: 'sustain', label: 'Sustain Ratio', inverse: false, unit: 'x' },
    { id: 'retention', label: 'Retention %', inverse: false, unit: '%' }
];

// Peer display config
const PEER_COLORS: Record<PeerId, string> = {
    geodnet: 'text-orange-400',
    hivemapper: 'text-emerald-400',
    helium: 'text-purple-400'
};

interface ComparativeMatrixProps {
    onocoyData: Record<string, number>;
    peerData: Record<PeerId, Record<string, number>>;
    selectedPeers: PeerId[];
    onExport?: () => void;
}

export const ComparativeMatrix: React.FC<ComparativeMatrixProps> = ({
    onocoyData,
    peerData,
    selectedPeers,
    onExport
}) => {
    // Determine cell color based on comparison
    const getCellColor = (metric: MetricRow, onocoyVal: number, peerVal: number): string => {
        if (metric.inverse) {
            // Lower is better: if peer > onocoy, onocoy wins (peer is red)
            return peerVal > onocoyVal ? 'text-rose-400' : 'text-emerald-400';
        } else {
            // Higher is better: if peer < onocoy, onocoy wins (peer is red)
            return peerVal < onocoyVal ? 'text-rose-400' : 'text-emerald-400';
        }
    };

    const formatValue = (val: number, unit?: string): string => {
        if (unit === 'x') return val.toFixed(2) + 'x';
        if (unit === '%') return val.toFixed(1) + '%';
        return val.toFixed(1);
    };

    return (
        <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                <h3 className="text-sm font-bold text-white">Comparative Matrix</h3>
                {onExport && (
                    <button
                        onClick={onExport}
                        className="text-indigo-400 text-xs font-medium hover:text-indigo-300 flex items-center gap-1"
                    >
                        <Download size={12} />
                        Export CSV
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-800">
                    <thead className="bg-slate-800/50">
                        <tr>
                            <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Metric
                            </th>
                            <th className="px-4 py-3 text-center text-[10px] font-bold text-indigo-400 uppercase tracking-wider bg-indigo-500/10 border-x border-indigo-500/20">
                                Onocoy
                            </th>
                            {selectedPeers.map(peer => (
                                <th
                                    key={peer}
                                    className={`px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider ${PEER_COLORS[peer]}`}
                                >
                                    {peer.charAt(0).toUpperCase() + peer.slice(1)}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {METRICS.map(metric => {
                            const onocoyVal = onocoyData[metric.id] ?? 0;

                            return (
                                <tr key={metric.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-slate-300">
                                        {metric.label}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-bold text-white bg-indigo-500/5 border-x border-indigo-500/10">
                                        {formatValue(onocoyVal, metric.unit)}
                                    </td>
                                    {selectedPeers.map(peer => {
                                        const peerVal = peerData[peer]?.[metric.id] ?? 0;
                                        const colorClass = getCellColor(metric, onocoyVal, peerVal);

                                        return (
                                            <td
                                                key={peer}
                                                className={`px-4 py-3 whitespace-nowrap text-center text-sm font-semibold ${colorClass}`}
                                            >
                                                {formatValue(peerVal, metric.unit)}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="bg-slate-800/30 px-4 py-2 text-[10px] text-slate-500 border-t border-slate-800">
                Values colored <span className="text-emerald-400">green</span> indicate Onocoy advantage.
                <span className="text-rose-400 ml-1">Red</span> indicates disadvantage.
            </div>
        </div>
    );
};
