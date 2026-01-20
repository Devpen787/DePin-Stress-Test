import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { DiagnosticState } from './types';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

interface Props {
    state: DiagnosticState;
}

// Simple SVG Gauge Component
const Gauge = ({ value, label, status, subText }: { value: number, label: string, status: string, subText: string }) => {
    // value 0-100
    const rotation = (value / 100) * 180; // 0 to 180 degrees

    let color = '#ef4444'; // Red
    if (value < 30) color = '#10b981'; // Green (Low is good for some, need to be careful with context)
    if (value >= 30 && value < 70) color = '#eab308'; // Yellow

    // For "Retention" or "Capacity", High is Good. For "Overhead", Low is Good.
    // Let's assume input 'value' is normalized to "Badness" for color, or passed explicitly?
    // Let's rely on 'status' prop for color logic if needed, or stick to simple thresholds.
    // For this specific visual:
    // Latent Capacity Degradation: High % is BAD (Degradation amount). So Red is High.

    return (
        <div className="flex flex-col items-center bg-slate-900/50 p-4 rounded-xl border border-slate-800">
            <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">{label}</h4>
            <div className="relative w-32 h-16 overflow-hidden mb-2">
                <div className="absolute top-0 left-0 w-32 h-32 rounded-full border-[12px] border-slate-800" />
                <div
                    className="absolute top-0 left-0 w-32 h-32 rounded-full border-[12px] border-b-0 border-l-0 border-r-0 transition-transform duration-1000 ease-out origin-center"
                    style={{
                        borderColor: status === 'Critical' ? '#ef4444' : status === 'Warning' ? '#eab308' : '#10b981',
                        transform: `rotate(${rotation - 180}deg)` // Start from left (-180) to 0
                    }}
                />
                {/* Value Text */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 font-bold text-white text-xl">
                    {value}%
                </div>
            </div>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${status === 'Critical' ? 'bg-red-500/10 text-red-400' :
                    status === 'Warning' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-emerald-500/10 text-emerald-400'
                }`}>
                {status.toUpperCase()}
            </span>
            <p className="text-[10px] text-slate-500 mt-2 text-center max-w-[150px]">{subText}</p>
        </div>
    );
};

export const SignalsOfDeathPanel: React.FC<Props> = ({ state }) => {
    // 1. Latent Capacity Degradation
    // In our model, this is (100 - NRR). If NRR is 98%, Degradation is 2%.
    const capacityDegradation = 100 - state.nrr;
    let capStatus = 'Safe';
    if (capacityDegradation > 10) capStatus = 'Warning';
    if (capacityDegradation > 30) capStatus = 'Critical';

    // 2. Validation Overhead
    // Simulated based on GovScore mostly. Low Gov Score implies High Overhead/Inefficiency.
    const validationOverhead = Math.max(0, 100 - state.govScore);
    let valStatus = 'Safe';
    if (validationOverhead > 40) valStatus = 'Warning';
    if (validationOverhead > 70) valStatus = 'Critical';

    // 3. Equilibrium Gap (Price vs Value) chart
    // Price is market, Value is Utility.
    // Low BER (0.3) means Value is 30% of Price. Gap is large.
    const gapData = {
        labels: ['Market Price', 'Utility Value'],
        datasets: [{
            label: 'Value ($)',
            data: [1.0, state.r_be], // Normalized. Price = 1.0, Utility = r_be
            backgroundColor: ['#64748b', state.r_be < 0.5 ? '#ef4444' : '#10b981'],
        }]
    };

    // 4. Churn Elasticity (Mercenary vs Pro)
    const churnData = {
        labels: ['Month 1', 'M2', 'M3', 'M4', 'M5'],
        datasets: [
            {
                label: 'Mercenaries',
                data: [0, 10, 30, 60, 90],
                borderColor: '#ef4444',
                tension: 0.4
            },
            {
                label: 'Pros',
                data: [0, 2, 5, 10, 15],
                borderColor: '#10b981',
                tension: 0.4
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { display: false }, y: { display: false } }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 1. Latent Capacity */}
            <Gauge
                value={capacityDegradation}
                label="Latent Capacity Degradation"
                status={capStatus}
                subText="Capacity falling AFTER price drop."
            />

            {/* 2. Validation Overhead */}
            <Gauge
                value={validationOverhead}
                label="Validation Overhead"
                status={valStatus}
                subText="Cost of fighting spoofers."
            />

            {/* 3. Equilibrium Gap */}
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex flex-col items-center">
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Equilibrium Gap</h4>
                <div className="w-full h-24 mt-2">
                    <Bar data={gapData} options={chartOptions} />
                </div>
                <p className="text-[10px] text-slate-500 mt-2 text-center">
                    {state.r_be < 1 ? 'Market Price > Utility Value' : 'Healthy Equilibrium'}
                </p>
            </div>

            {/* 4. Churn Elasticity */}
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex flex-col items-center">
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Churn Elasticity</h4>
                <div className="w-full h-24 mt-2">
                    <Line data={churnData} options={chartOptions} />
                </div>
                <p className="text-[10px] text-slate-500 mt-2 text-center">
                    Mercenary (Red) vs Pro (Green) Exits
                </p>
            </div>

        </div>
    );
};
