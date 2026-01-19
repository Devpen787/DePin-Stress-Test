import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface BenchmarkMetricCardProps {
    label: string;
    value: string | number;
    unit?: string;
    delta: number;
    deltaType: 'better' | 'worse' | 'parity';
    inverse?: boolean; // For metrics where lower is better (e.g., Payback)
}

export const BenchmarkMetricCard: React.FC<BenchmarkMetricCardProps> = ({
    label,
    value,
    unit = '',
    delta,
    deltaType,
    inverse = false
}) => {
    // Determine color and icon based on delta type
    const getStatusStyles = () => {
        if (deltaType === 'parity' || Math.abs(delta) < 0.01) {
            return {
                color: 'text-amber-400',
                bgColor: 'bg-amber-500/10',
                icon: <Minus size={12} />,
                text: 'Parity'
            };
        }

        const isPositive = inverse ? delta < 0 : delta > 0;

        if (isPositive) {
            return {
                color: 'text-emerald-400',
                bgColor: 'bg-emerald-500/10',
                icon: inverse ? <TrendingDown size={12} /> : <TrendingUp size={12} />,
                text: `${inverse ? '▼' : '▲'} ${Math.abs(delta).toFixed(1)}${unit}`
            };
        } else {
            return {
                color: 'text-rose-400',
                bgColor: 'bg-rose-500/10',
                icon: inverse ? <TrendingUp size={12} /> : <TrendingDown size={12} />,
                text: `${inverse ? '▲' : '▼'} ${Math.abs(delta).toFixed(1)}${unit}`
            };
        }
    };

    const status = getStatusStyles();

    return (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 relative overflow-hidden">
            {/* Decorative Corner */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-bl-full -mr-2 -mt-2" />

            {/* Label */}
            <dt className="text-xs font-medium text-slate-400 relative z-10">
                {label}
            </dt>

            {/* Value */}
            <dd className="mt-2 text-3xl font-bold text-white relative z-10">
                {value}{unit && <span className="text-lg ml-1">{unit}</span>}
            </dd>

            {/* Delta Badge */}
            <div className="mt-3 flex items-center gap-2 text-xs relative z-10">
                <span className={`font-semibold flex items-center gap-1 ${status.color}`}>
                    {status.icon}
                    {status.text}
                </span>
                <span className="text-slate-500">vs Peer Median</span>
            </div>
        </div>
    );
};
