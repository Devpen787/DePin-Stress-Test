import React, { useState } from 'react';
import { Filter, X, Check, ArrowDown, ArrowUp, Zap, Activity, DollarSign, Layers, Globe } from 'lucide-react';
import { ProtocolCategory } from './types';

interface ExplorerFiltersProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    selectedCategory: ProtocolCategory | 'ALL';
    onCategoryChange: (category: ProtocolCategory | 'ALL') => void;
    showFilters: boolean;
    onToggleFilters: () => void;
}

export const ExplorerFilters: React.FC<ExplorerFiltersProps> = ({
    searchQuery,
    onSearchChange,
    selectedCategory,
    onCategoryChange,
    showFilters,
    onToggleFilters
}) => {
    const categories: { id: ProtocolCategory | 'ALL'; label: string; icon?: any }[] = [
        { id: 'ALL', label: 'All Sectors', icon: Layers },
        { id: 'Compute', label: 'Compute', icon: Zap },
        { id: 'Storage', label: 'Storage', icon: DatabaseIcon },
        { id: 'Wireless', label: 'Wireless 5G/IoT', icon: WifiIcon },
        { id: 'Sensors', label: 'Sensor Networks', icon: Activity },
        { id: 'Vehicle', label: 'Vehicle Networks', icon: Activity },
        { id: 'AI/ML', label: 'Decentralized AI', icon: BrainIcon },
        { id: 'Other', label: 'Other / Services', icon: Globe },
    ];

    return (
        <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar mask-linear-fade">
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => onCategoryChange(cat.id)}
                        className={`
              flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide
              whitespace-nowrap transition-all border
              ${selectedCategory === cat.id
                                ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.2)]'
                                : 'bg-slate-900/50 text-slate-500 border-slate-800 hover:border-slate-700 hover:text-slate-400'
                            }
            `}
                    >
                        {cat.icon && <cat.icon size={12} />}
                        {cat.label}
                    </button>
                ))}
            </div>

            {showFilters && (
                <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl animate-in slide-in-from-top-2 duration-200">
                    <div className="flex justify-between items-start mb-3">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Advanced Filters</h4>
                        <button onClick={onToggleFilters} className="text-slate-600 hover:text-slate-400"><X size={14} /></button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Market Cap Tier */}
                        <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-2">Market Cap</label>
                            <select className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-[10px] text-slate-300 outline-none focus:border-indigo-500">
                                <option value="all">All Tiers</option>
                                <option value="large">Large Cap (&gt; $1B)</option>
                                <option value="mid">Mid Cap ($100M - $1B)</option>
                                <option value="small">Small Cap (&lt; $100M)</option>
                            </select>
                        </div>

                        {/* Performance */}
                        <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-2">24h Performance</label>
                            <select className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-[10px] text-slate-300 outline-none focus:border-indigo-500">
                                <option value="all">Any</option>
                                <option value="gainers">Gainers Only</option>
                                <option value="losers">Losers Only</option>
                            </select>
                        </div>

                        {/* Risk Level */}
                        <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-2">Risk Level</label>
                            <div className="flex gap-2">
                                <label className="flex items-center gap-1 cursor-pointer">
                                    <input type="checkbox" className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500" defaultChecked />
                                    <span className="text-[10px] text-emerald-400">Low</span>
                                </label>
                                <label className="flex items-center gap-1 cursor-pointer">
                                    <input type="checkbox" className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500" defaultChecked />
                                    <span className="text-[10px] text-amber-400">Med</span>
                                </label>
                                <label className="flex items-center gap-1 cursor-pointer">
                                    <input type="checkbox" className="rounded border-slate-700 bg-slate-900 text-rose-500 focus:ring-rose-500" defaultChecked />
                                    <span className="text-[10px] text-rose-400">High</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Icons helpers (mocking specific icons if not available in lucide props, but these likely exist)
const DatabaseIcon = ({ size, className }: { size?: number, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>
);
const WifiIcon = ({ size, className }: { size?: number, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>
);
const BrainIcon = ({ size, className }: { size?: number, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="M15 9h.01"></path><path d="M9 15h.01"></path><path d="M15 15h.01"></path></svg>
);
