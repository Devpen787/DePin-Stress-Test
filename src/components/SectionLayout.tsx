import React from 'react';

// I'll skip 'cn' import and write clean tailwind classes to avoid "module not found" errors if utils location varies.

interface SectionLayoutProps {
    title: string;
    subtitle?: string;
    description: React.ReactNode;
    children: React.ReactNode;
    id?: string;
    isHero?: boolean;
}

export const SectionLayout: React.FC<SectionLayoutProps> = ({
    title,
    subtitle,
    description,
    children,
    id,
    isHero = false
}) => {
    return (
        <section id={id} className={`w-full py-12 border-b border-slate-800/50 ${isHero ? 'pt-20' : ''}`}>
            <div className="max-w-[1600px] mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                    {/* Left Column: Narrative & Research (30%) */}
                    {/* Sticky positioning keeps context in view while user interacts with charts */}
                    <div className="lg:col-span-4 relative">
                        <div className="sticky top-24 space-y-6">
                            <header>
                                {subtitle && (
                                    <span className="text-indigo-400 font-mono text-xs font-bold uppercase tracking-widest mb-2 block">
                                        {subtitle}
                                    </span>
                                )}
                                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase">
                                    {title}
                                </h2>
                            </header>

                            <div className="prose prose-sm prose-invert text-slate-400 font-light leading-relaxed">
                                {description}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Simulation & Charts (70%) */}
                    <div className="lg:col-span-8">
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-1 shadow-2xl shadow-indigo-500/5 overflow-hidden">
                            {/* Inner container for distinct separation */}
                            <div className="bg-slate-950/50 rounded-[22px] p-6 md:p-8">
                                {children}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};
