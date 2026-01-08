import React from 'react';
import { ArrowUp, ArrowDown, Activity, BarChart2, ExternalLink, ShieldCheck } from 'lucide-react';
import { ExplorerProtocol, SortColumn, SortDirection } from './types';
import { AreaChart, Area, ResponsiveContainer } from 'recharts'; // For sparklines

interface ExplorerTableProps {
    protocols: ExplorerProtocol[];
    loading: boolean;
    sortColumn: SortColumn;
    sortDirection: SortDirection;
    onSort: (column: SortColumn) => void;
    onAnalyze: (protocolId: string) => void;
    onCompare: (protocolId: string) => void;
}

export const ExplorerTable: React.FC<ExplorerTableProps> = ({
    protocols,
    loading,
    sortColumn,
    sortDirection,
    onSort,
    onAnalyze,
    onCompare
}) => {
    const SortIcon = ({ column }: { column: SortColumn }) => {
        if (sortColumn !== column) return <div className="w-4 h-4" />; // spacer
        return sortDirection === 'asc' ? <ArrowUp className="w-4 h-4 ml-1" /> : <ArrowDown className="w-4 h-4 ml-1" />;
    };

    const HeaderCell = ({ label, column, width, tooltip }: { label: string, column?: SortColumn, width?: string, tooltip?: string }) => (
        <th
            className={`px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider sticky top-0 bg-slate-900 z-10 ${column ? 'cursor-pointer hover:text-slate-200' : ''} ${width || ''}`}
            onClick={() => column && onSort(column)}
            title={tooltip}
        >
            <div className="flex items-center gap-1">
                {label}
                {column && <SortIcon column={column} />}
                {tooltip && <span className="text-[8px] font-normal lowercase bg-slate-800 px-1 rounded text-slate-500">src</span>}
            </div>
        </th>
    );

    if (loading && protocols.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-slate-500">
                <Activity className="w-6 h-6 animate-pulse mr-2" />
                Loading protocols...
            </div>
        );
    }

    return (
        <div className="h-full overflow-auto custom-scrollbar">
            <table className="min-w-full divide-y divide-slate-800">
                <thead className="bg-slate-900">
                    <tr>
                        <HeaderCell label="#" width="w-16" tooltip="Source: Calculated Rank" />
                        <HeaderCell label="Protocol" width="w-64" tooltip="Source: Protocol Registry" />
                        <HeaderCell label="Price" column="price" width="w-32" tooltip="Source: CoinGecko API" />
                        <HeaderCell label="24h Change" column="price" width="w-32" tooltip="Source: CoinGecko API" />
                        <HeaderCell label="Market Cap" column="marketCap" width="w-40" tooltip="Source: CoinGecko / Solana On-Chain" />
                        <HeaderCell label="Risk" column="riskLevel" width="w-24" tooltip="Source: Stress Model V1.2" />
                        <HeaderCell label="Score" column="stressScore" width="w-20" tooltip="Source: 52-Week Sim" />
                        <HeaderCell label="7d Trend" width="w-32" tooltip="Source: CoinGecko Sparkline" />
                        <HeaderCell label="Actions" width="w-48" />
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-950/50">
                    {protocols.map((protocol) => (
                        <tr key={protocol.id} className="hover:bg-slate-900/50 transition-colors group">
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">
                                {protocol.rank}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 mr-3 border border-slate-700">
                                        {protocol.symbol[0]}
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-slate-200">{protocol.name}</div>
                                        <div className="text-xs text-slate-500">{protocol.symbol} • {protocol.category}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-300 font-mono">
                                ${protocol.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                            </td>
                            <td className={`px-4 py-4 whitespace-nowrap text-sm font-mono font-medium ${protocol.priceChange24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {protocol.priceChange24h >= 0 ? '+' : ''}{protocol.priceChange24h.toFixed(2)}%
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-300 font-mono">
                                <div className="flex items-center gap-1">
                                    ${(protocol.marketCap / 1000000).toLocaleString(undefined, { maximumFractionDigits: 1 })}M
                                    {protocol.onChainVerified && (
                                        <ShieldCheck
                                            className="w-3 h-3 text-emerald-500 cursor-help"
                                            title={`Verified On-Chain: ${protocol.circulatingSupply.toLocaleString()} tokens`}
                                        />
                                    )}
                                </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                                {protocol.riskLevel ? (
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${protocol.riskLevel === 'LOW' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                        protocol.riskLevel === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                            'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                        }`}>
                                        {protocol.riskLevel}
                                    </span>
                                ) : (
                                    <span className="text-slate-600 font-mono">-</span>
                                )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                                {protocol.stressScore ? (
                                    <div className={`font-mono font-bold ${protocol.stressScore >= 7 ? 'text-emerald-400' :
                                        protocol.stressScore >= 4 ? 'text-amber-400' :
                                            'text-rose-400'
                                        }`}>
                                        {protocol.stressScore.toFixed(1)}
                                    </div>
                                ) : (
                                    <span className="text-slate-600 font-mono">-</span>
                                )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap h-16 w-32">
                                {/* Sparkline */}
                                {protocol.sparkline7d && protocol.sparkline7d.length > 0 ? (
                                    <div className="h-10 w-28">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={protocol.sparkline7d.map((v, i) => ({ i, v }))}>
                                                <defs>
                                                    <linearGradient id={`gradient-${protocol.id}`} x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor={protocol.priceChange24h >= 0 ? '#34d399' : '#fb7185'} stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor={protocol.priceChange24h >= 0 ? '#34d399' : '#fb7185'} stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <Area
                                                    type="monotone"
                                                    dataKey="v"
                                                    stroke={protocol.priceChange24h >= 0 ? '#10b981' : '#f43f5e'}
                                                    fill={`url(#gradient-${protocol.id})`}
                                                    strokeWidth={1.5}
                                                    isAnimationActive={false}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <span className="text-xs text-slate-600">No Data</span>
                                )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => onAnalyze(protocol.id)}
                                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-md shadow-sm transition-colors flex items-center gap-1"
                                    >
                                        <Activity className="w-3 h-3" /> Analyze
                                    </button>
                                    {/* Placeholder for Compare - functionality exists in parent prop but UI simplified for now */}
                                    <button
                                        onClick={() => onCompare(protocol.id)}
                                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-md border border-slate-700 transition-colors"
                                    >
                                        Compare
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
