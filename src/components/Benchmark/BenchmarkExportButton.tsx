import React from 'react';
import { Download } from 'lucide-react';
import { HeadToHeadMetric } from '../../viewmodels/BenchmarkViewModel';

interface BenchmarkExportButtonProps {
    metrics: HeadToHeadMetric[];
    activeProtocolName: string;
}

export const BenchmarkExportButton: React.FC<BenchmarkExportButtonProps> = ({ metrics, activeProtocolName }) => {

    const handleExport = () => {
        // 1. Build CSV Content
        const headers = [
            'Category',
            'Metric',
            'Unit',
            `${activeProtocolName} Value`,
            'Competitor Value',
            'Delta',
            'Delta Type',
            'Direction',
            'Source'
        ];
        const rows = metrics.map(m => {
            // Determine Category based on metric name (heuristic)
            let category = 'General';
            if (['Active Nodes', 'YoY Growth', 'Coverage Score'].includes(m.metric)) category = 'Supply Side';
            else if (['Annual Revenue', 'Burn Rate'].includes(m.metric)) category = 'Demand Side';
            else if (['Sustainability Ratio', 'Circulating Supply'].includes(m.metric)) category = 'Tokenomics';

            const deltaValue = m.isValid ? m.delta.toFixed(1) : '';

            return [
                category,
                m.metric,
                m.unit,
                m.onocoyValue,
                m.competitorValue,
                deltaValue,
                m.deltaType,
                m.betterDirection,
                m.sourceLabel
            ].join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');

        // 2. Create Blob & Link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `benchmark_${activeProtocolName.toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors border border-slate-700"
            title="Download Report (CSV)"
        >
            <Download size={14} />
            Export CSV
        </button>
    );
};
