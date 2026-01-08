import React, { useState, useEffect, useMemo } from 'react';
import { Search, RotateCw, Filter } from 'lucide-react';
import { ExplorerTable } from './ExplorerTable';
import { ExplorerFilters } from './ExplorerFilters';
import { ExplorerProtocol, SortColumn, SortDirection } from './types';
import { fetchMultipleTokens, DEPIN_TOKENS } from '../../services/coingecko';

import { ProtocolProfileV1 } from '../../data/protocols';

import { SolanaService, OnChainData } from '../../services/solana';

interface ExplorerTabProps {
    onAnalyze: (protocolId: string) => void;
    onCompare: (protocolId: string) => void;
    profiles: ProtocolProfileV1[];
}

export const ExplorerTab: React.FC<ExplorerTabProps> = ({ onAnalyze, onCompare, profiles }) => {
    const [protocols, setProtocols] = useState<ExplorerProtocol[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortColumn, setSortColumn] = useState<SortColumn>('marketCap');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [verifiedData, setVerifiedData] = useState<Record<string, OnChainData>>({});

    // Filters
    const [filters, setFilters] = useState({
        searchQuery: '',
        categories: [] as string[],
        minMarketCap: 0,
        riskLevels: [] as string[],
    });

    // Helper to fetch all market data
    const fetchAllProtocolMarketData = async () => {
        const tokenIds = Object.values(DEPIN_TOKENS).map(t => t.coingeckoId);
        return await fetchMultipleTokens(tokenIds);
    };

    // Fetch data
    const refreshData = async () => {
        setLoading(true);
        try {
            // Fetch parallel: Market Data + On-Chain Verification
            const [marketData, onChainData] = await Promise.all([
                fetchAllProtocolMarketData(),
                SolanaService.verifySupplies()
            ]);

            setVerifiedData(onChainData);

            // Map to ExplorerProtocol
            const mappedProtocols: ExplorerProtocol[] = Object.entries(DEPIN_TOKENS).map(([key, info]) => {
                const market = marketData[info.coingeckoId];
                // Default values if market data is missing
                const price = market?.currentPrice || 0;
                const cap = market?.marketCap || 0;

                // Find matching profile from PROTOCOL_PROFILES
                const profile = profiles.find(p => p.metadata.coingeckoId === info.coingeckoId);

                // Derived Metrics Calculation (Simplified for Explorer View)
                let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | null = null;
                let paybackPeriod: number | null = null;
                let stressScore: number | null = null;

                if (profile) {
                    // Risk Level based on Demand Regime
                    const regime = profile.parameters.demand_regime.value;
                    if (regime === 'volatile') riskLevel = 'HIGH';
                    else if (regime === 'growth') riskLevel = 'MEDIUM';
                    else riskLevel = 'LOW';

                    // Payback Period: (Hardware + Setup) / Weekly Profit
                    // Simplified: We don't have hardware cost here, using a proxy based on OpEx
                    // Let's assume hardware is ~50x weekly OpEx for estimation
                    const weeklyOpEx = profile.parameters.provider_economics.opex_weekly.value;
                    const revenuePerWeek = (profile.parameters.emissions.value * price) / 10000; // Mock distribution
                    // This is a rough proxy since we lack full simulation engine here
                    // So we will just map some static values or use the profile hints if available

                    // Better approach: Use derived metrics if passed, otherwise estimate
                    if (regime === 'consistent') paybackPeriod = 24; // weeks
                    else if (regime === 'growth') paybackPeriod = 36;
                    else paybackPeriod = 52;

                    // Stress Score: 0-10, based on burn fraction and supply
                    stressScore = Math.min(10, Math.max(1, (profile.parameters.burn_fraction.value * 10) + (profile.parameters.demand_regime.value === 'volatile' ? -2 : 0)));
                }

                return {
                    id: key, // This key (e.g. 'helium') matches our DEPIN_TOKENS key.
                    name: info.name,
                    symbol: info.symbol,
                    category: info.category, // Using category from DEPIN_TOKENS
                    coingeckoId: info.coingeckoId,
                    description: info.description,
                    website: info.website,
                    explorer: info.explorer,
                    hasToken: true,

                    currentPrice: price,
                    volume24h: market?.totalVolume || 0,

                    priceChange24h: market?.priceChangePercentage24h || 0,

                    // Use On-Chain Supply if available (Real-Time Precision), otherwise fallback to CoinGecko
                    circulatingSupply: verifiedData[key]?.supply || market?.circulatingSupply || 0,
                    maxSupply: market?.maxSupply || null,

                    // Recalculate Market Cap if we have real-time supply
                    marketCap: verifiedData[key]
                        ? (verifiedData[key].supply * price)
                        : (cap || 0),

                    // On-Chain verification override (if available, use confirmed supply)
                    onChainVerified: !!verifiedData[key],

                    sparkline7d: market?.sparkline7d,

                    // Injected Metrics from Simulation/Profiles
                    stressScore: stressScore,
                    paybackPeriod: paybackPeriod,
                    riskLevel: riskLevel,

                    rank: 0, // Calculated later
                };
            });

            setProtocols(mappedProtocols);
            setLastUpdated(new Date());
        } catch (error) {
            console.error("Failed to load explorer data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshData();
        // Refresh every 5 minutes
        const interval = setInterval(refreshData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    // Filter and Sort
    const processedProtocols = useMemo(() => {
        let result = [...protocols];

        // Filter by Category
        const selectedCat = filters.categories[0] || 'All';
        if (selectedCat !== 'All') {
            result = result.filter(p => p.category === selectedCat);
        }

        // Filter by Search
        if (filters.searchQuery) {
            const q = filters.searchQuery.toLowerCase();
            result = result.filter(p =>
                p.name.toLowerCase().includes(q) ||
                p.symbol.toLowerCase().includes(q)
            );
        }

        // Sort
        result.sort((a, b) => {
            let valA = a[sortColumn] ?? 0;
            let valB = b[sortColumn] ?? 0;

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        // Assign Rank
        return result.map((p, i) => ({ ...p, rank: i + 1 }));
    }, [protocols, filters, sortColumn, sortDirection]);

    const categories = ['All', ...Array.from(new Set(protocols.map(p => p.category)))];

    return (
        <div className="flex flex-col h-full bg-slate-950 text-slate-50 overflow-hidden">
            {/* Header */}
            <div className="flex-none p-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-100">DePIN Explorer</h1>
                        <p className="text-slate-400 mt-1">Discover, rank, and analyze decentralized physical infrastructure networks</p>
                    </div>
                    <div className="flex gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search protocols..."
                                value={filters.searchQuery}
                                onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                                className="pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
                            />
                        </div>
                        <button
                            onClick={refreshData}
                            className="p-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors text-slate-400 hover:text-slate-200"
                            title="Refresh Data"
                        >
                            <RotateCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-2 flex items-center gap-1">
                        <Filter className="w-3 h-3" /> Filters:
                    </span>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilters(prev => ({ ...prev, categories: cat === 'All' ? [] : [cat] }))}
                            className={`px-3 py-1 text-xs rounded-full border transition-colors ${(filters.categories.includes(cat) || (cat === 'All' && filters.categories.length === 0))
                                ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400'
                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden relative">
                <ExplorerTable
                    protocols={processedProtocols}
                    loading={loading}
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSort={(col) => {
                        if (sortColumn === col) {
                            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                        } else {
                            setSortColumn(col);
                            setSortDirection('desc');
                        }
                    }}
                    onAnalyze={onAnalyze}
                    onCompare={onCompare}
                />
            </div>

            {/* Footer / Status */}
            <div className="flex-none px-6 py-2 border-t border-slate-800 bg-slate-900/80 text-xs text-slate-500 flex justify-between">
                <span>Showing {processedProtocols.length} protocols</span>
                <span>
                    Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}
                    {loading && ' (Updating...)'}
                </span>
            </div>
        </div>
    );
};
