import React from 'react';
import { DiagnosticInput, DiagnosticState } from './types';

interface Props {
    inputs: DiagnosticInput;
    state: DiagnosticState;
}

const Hexagon = ({ color, size = 20, className }: { color: string, size?: number, className?: string }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={color}
        stroke="rgba(0,0,0,0.2)"
        strokeWidth="1"
        className={className}
        style={{ transition: 'fill 0.5s ease' }}
    >
        <path d="M12 2L20.6603 7V17L12 22L3.33975 17V7L12 2Z" />
    </svg>
);

export const HexDegradationMap: React.FC<Props> = ({ inputs, state }) => {
    // Simulate 50 Nodes/Hexes
    const totalNodes = 50;

    // States based on Logic
    // Green = Active & Profitable
    // Grey = Zombie (Unprofitable but Online)
    // Black = Latent (Offline/Exited)

    let pGreen = 1.0;
    let pGrey = 0.0;
    let pBlack = 0.0;

    if (inputs.priceShock === 'None') {
        pGreen = 0.95;
        pGrey = 0.05;
    } else if (inputs.priceShock === 'Moderate') {
        if (inputs.minerProfile === 'Mercenary') {
            pGreen = 0.3; pGrey = 0.1; pBlack = 0.6; // Exit
        } else {
            pGreen = 0.4; pGrey = 0.5; pBlack = 0.1; // Sticky
        }
    } else {
        // Severe
        if (inputs.minerProfile === 'Mercenary') {
            pGreen = 0.0; pGrey = 0.05; pBlack = 0.95; // Mass Extinction
        } else {
            pGreen = 0.1; pGrey = 0.7; pBlack = 0.2; // Massive Zombie Mode
        }
    }

    // Generate grid array
    const grid = Array.from({ length: totalNodes }).map((_, i) => {
        const rand = (i * 1337 + 7) % 100 / 100; // Deterministic random-ish
        let color = '#22c55e'; // Green-500
        let status = 'Profitable';

        if (rand < pBlack) {
            color = '#1e293b'; // Slate-800/Black (Latent)
            status = 'Latent';
        } else if (rand < pBlack + pGrey) {
            color = '#94a3b8'; // Slate-400 (Zombie)
            status = 'Zombie';
        } else {
            color = '#22c55e';
        }

        return { id: i, color, status };
    });

    return (
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6 flex flex-col items-center justify-center min-h-[300px]">

            {/* Legend */}
            <div className="flex gap-4 mb-6 text-xs font-bold text-slate-400 uppercase">
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded-sm" /> Profitable</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-slate-400 rounded-sm" /> Zombie (Sunk Cost)</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-slate-800 border border-slate-600 rounded-sm" /> Latent (Offline)</div>
            </div>

            {/* Grid */}
            <div className="flex flex-wrap gap-1 justify-center max-w-md">
                {grid.map((node, i) => (
                    <div key={i} className="relative group -ml-2 first:ml-0 hover:z-10 hover:scale-125 transition-transform" style={{ marginTop: (i % 10) % 2 === 0 ? '0px' : '10px' }}>
                        <Hexagon color={node.color} size={36} />
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-slate-800 text-white text-[10px] p-1 rounded whitespace-nowrap z-50 pointer-events-none">
                            Node #{node.id}: {node.status}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 text-center">
                <h3 className="text-xl font-bold text-white mb-1">
                    Effective Capacity: {Math.round((pGreen + pGrey) * 100)}%
                </h3>
                <p className="text-sm text-slate-400">
                    {inputs.minerProfile === 'Mercenary' ? 'Mercenaries exit violently.' : 'Professionals hold as Zombies.'}
                </p>
            </div>
        </div>
    );
};
