import React from 'react';

export type PeerId = 'geodnet' | 'hivemapper' | 'helium';

interface PeerConfig {
    id: PeerId;
    name: string;
    color: string; // Tailwind color class (e.g., 'orange', 'green', 'purple')
}

const PEERS: PeerConfig[] = [
    { id: 'geodnet', name: 'Geodnet', color: 'orange' },
    { id: 'hivemapper', name: 'Hivemapper', color: 'green' },
    { id: 'helium', name: 'Helium (IoT)', color: 'purple' }
];

interface PeerToggleProps {
    selectedPeers: PeerId[];
    onToggle: (peerId: PeerId) => void;
}

export const PeerToggle: React.FC<PeerToggleProps> = ({ selectedPeers, onToggle }) => {
    return (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                    Compare Onocoy vs:
                </span>

                <div className="flex flex-wrap gap-3">
                    {PEERS.map(peer => {
                        const isActive = selectedPeers.includes(peer.id);

                        // Dynamic color classes based on peer
                        const colorClasses = {
                            orange: {
                                active: 'bg-orange-500/20 border-orange-500/50 text-orange-400',
                                dot: 'bg-orange-500'
                            },
                            green: {
                                active: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400',
                                dot: 'bg-emerald-500'
                            },
                            purple: {
                                active: 'bg-purple-500/20 border-purple-500/50 text-purple-400',
                                dot: 'bg-purple-500'
                            }
                        };

                        const colors = colorClasses[peer.color as keyof typeof colorClasses];

                        return (
                            <button
                                key={peer.id}
                                onClick={() => onToggle(peer.id)}
                                className={`
                                    flex items-center gap-2 px-4 py-2 rounded-lg border transition-all text-xs font-bold
                                    ${isActive
                                        ? colors.active
                                        : 'bg-slate-800 border-slate-700 text-slate-500 hover:bg-slate-700/50'
                                    }
                                `}
                            >
                                <span className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
                                {peer.name}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
