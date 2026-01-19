import React from 'react';
import { Users, DollarSign, Activity, Database, CheckCircle2 } from 'lucide-react';
import { useBenchmarkViewModel } from '../../viewmodels/BenchmarkViewModel';
import { PEER_GROUPS } from '../../data/peerGroups';
import { formatCompact } from '../../utils/format';
import { ProtocolProfileV1 } from '../../data/protocols';

interface PeerSetTableProps {
    viewModel: ReturnType<typeof useBenchmarkViewModel>;
    profiles: ProtocolProfileV1[];
}

export const PeerSetTable: React.FC<PeerSetTableProps> = ({ viewModel, profiles }) => {
    const group = PEER_GROUPS[0]; // Default to GNSS/Location for now

    // Aggregate data for table
    const tableData = group.members.map(pid => {
        const supply = viewModel.getSupplySide(pid);
        const demand = viewModel.getDemandSide(pid);
        const token = viewModel.getTokenomics(pid);
        const profile = profiles.find(p => p.metadata.id === pid);
        const hwCost = supply.hardwareEntryCostMin ?? supply.hardwareCost;

        return {
            id: pid,
            name: profile?.metadata.name || pid,
            nodes: supply.activeNodes,
            hwCost,
            revenue: demand.annualizedRevenue,
            sustainability: token.sustainabilityRatio,
            source: supply.dataSource
        };
    }).sort((a, b) => b.nodes - a.nodes); // Rank by Nodes

    const formatValue = (value: number) => (Number.isFinite(value) ? formatCompact(value) : '—');

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-slate-800 bg-slate-950/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-800 rounded-lg">
                        <Database size={16} className="text-slate-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">{group.name} Cohort</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                            Ranked by Network Scale
                        </p>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-slate-800 bg-slate-950/30 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                            <th className="p-4 pl-6">Rank</th>
                            <th className="p-4">Protocol</th>
                            <th className="p-4 text-right">Active Nodes</th>
                            <th className="p-4 text-right">HW Cost (Min)</th>
                            <th className="p-4 text-right">Est. Revenue (Yr)</th>
                            <th className="p-4 text-right">Sust. Ratio</th>
                            <th className="p-4 text-center">Source</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {tableData.map((row, idx) => (
                            <tr key={row.id} className={`hover:bg-slate-800/20 transition-colors ${row.id.includes('ono') ? 'bg-indigo-900/10' : ''}`}>
                                <td className="p-4 pl-6 text-slate-500 font-mono text-xs">#{idx + 1}</td>
                                <td className="p-4">
                                    <span className={`text-xs font-bold ${row.id.includes('ono') ? 'text-indigo-400' : 'text-white'}`}>
                                        {row.name}
                                    </span>
                                </td>
                                <td className="p-4 text-right font-mono text-sm text-slate-300">
                                    {row.nodes > 0 ? formatValue(row.nodes) : '—'}
                                </td>
                                <td className="p-4 text-right font-mono text-sm text-slate-300">
                                    {row.hwCost > 0 ? `$${formatValue(row.hwCost)}` : '—'}
                                </td>
                                <td className="p-4 text-right font-mono text-sm text-slate-300">
                                    ${row.revenue > 0 ? formatValue(row.revenue) : '—'}
                                </td>
                                <td className="p-4 text-right font-mono text-sm">
                                    {Number.isFinite(row.sustainability) && row.sustainability > 0 ? (
                                        <span className={`${row.sustainability > 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                            {row.sustainability.toFixed(0)}%
                                        </span>
                                    ) : (
                                        <span className="text-slate-500">—</span>
                                    )}
                                </td>
                                <td className="p-4 text-center">
                                    {row.source === 'live' || row.source === 'mixed' ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-bold uppercase border border-emerald-500/20">
                                            <CheckCircle2 size={8} /> Live
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[9px] font-bold uppercase border border-indigo-500/20">
                                            Sim
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
