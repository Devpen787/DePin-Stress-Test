import React from 'react';
import { ChevronDown } from 'lucide-react';

interface CollapsibleSectionProps {
    title: string;
    icon: React.ReactNode;
    iconColor: string;
    summary: string;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
    title,
    icon,
    iconColor,
    summary,
    isOpen,
    onToggle,
    children,
}) => {

    return (
        <section className="transition-all duration-300">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between mb-4 group cursor-pointer"
            >
                <div className="flex items-center gap-2">
                    <span className={iconColor}>{icon}</span>
                    <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 group-hover:text-slate-400 transition-colors">
                        {title}
                    </h2>

                </div>
                <div className="flex items-center gap-3">
                    {!isOpen && (
                        <span className="text-[9px] font-mono text-slate-606 truncate max-w-[120px]">{summary}</span>
                    )}
                    <ChevronDown
                        size={12}
                        className={`text-slate-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    />
                </div>
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="space-y-6 pb-2">
                    {children}
                </div>
            </div>
        </section>
    );
};
