import React from 'react';
import { RefreshCw, Database, CheckCircle2, Clock } from 'lucide-react';
import { TokenMarketData } from '../../services/coingecko';
import { ProtocolMetrics } from '../../hooks/useProtocolMetrics';

interface BenchmarkFreshnessProps {
    duneMetrics: Record<string, ProtocolMetrics | null>;
    coingeckoData: Record<string, TokenMarketData | null>;
    lastRefresh?: Date;
    onRefresh?: () => void;
    isLoading?: boolean;
}

export const BenchmarkFreshness: React.FC<BenchmarkFreshnessProps> = ({
    duneMetrics,
    coingeckoData,
    lastRefresh,
    onRefresh,
    isLoading = false
}) => {
    // Check if we have any valid live data
    const hasDune = Object.values(duneMetrics).some(m => m !== null);
    const hasCoingecko = Object.values(coingeckoData).some(d => d !== null);

    // Format time ago
    const getTimeAgo = (date?: Date | string) => {
        if (!date) return 'Unknown';
        const d = typeof date === 'string' ? new Date(date) : date;
        const seconds = Math.floor((new Date().getTime() - d.getTime()) / 1000);

        if (seconds < 60) return `Just now`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        return `${Math.floor(seconds / 3600)}h ago`;
    };

    return (
        <div className="flex items-center gap-4 bg-slate-900/50 rounded-lg p-2 px-4 border border-slate-700/50 text-xs">
            <div className="flex items-center gap-2">
                <Database size={12} className={hasCoingecko || hasDune ? "text-emerald-400" : "text-slate-500"} />
                <span className="font-semibold text-slate-300">Live Anchors:</span>
            </div>

            {/* Source Badges */}
            <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border ${hasCoingecko ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300' : 'bg-slate-800 border-slate-700 text-slate-500'
                    }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${hasCoingecko ? 'bg-indigo-400 animate-pulse' : 'bg-slate-600'}`} />
                    Price
                </div>
                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border ${hasDune ? 'bg-orange-500/10 border-orange-500/30 text-orange-300' : 'bg-slate-800 border-slate-700 text-slate-500'
                    }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${hasDune ? 'bg-orange-400 animate-pulse' : 'bg-slate-600'}`} />
                    On-Chain
                </div>
            </div>

            {/* Divider */}
            <div className="w-px h-4 bg-slate-700" />

            {/* Freshness Timer */}
            <div className="flex items-center gap-1.5 text-slate-400">
                <Clock size={12} />
                <span>Updated: {getTimeAgo(lastRefresh)}</span>
            </div>

            {/* Refresh Button */}
            {onRefresh && (
                <button
                    onClick={onRefresh}
                    disabled={isLoading}
                    className={`ml-1 focus:outline-none transition-all ${isLoading ? 'animate-spin text-indigo-400' : 'text-slate-500 hover:text-white'}`}
                    title="Refresh Live Data"
                >
                    <RefreshCw size={12} />
                </button>
            )}
        </div>
    );
};
