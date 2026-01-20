import React from 'react';
import { BookOpen, Database, Cpu, TrendingUp, ExternalLink, AlertTriangle, CheckCircle } from 'lucide-react';
import { DiagnosticInput } from './types';
import { verifiedProjects, VerifiedProject } from '../../data/verifiedProjectData';

interface Props {
    inputs: DiagnosticInput;
    archetypeId: string;
}

export const ArchetypeLogicPanel: React.FC<Props> = ({ inputs, archetypeId }) => {
    const project = verifiedProjects[archetypeId] || verifiedProjects['onocoy'];

    // Build assumptions from verified data
    const assumptions = [
        {
            label: "Hardware Class",
            value: project.hardware.priceRange.value,
            icon: <Cpu size={14} />,
            isVerified: project.hardware.priceRange.isVerified,
            source: project.hardware.priceRange.source,
            sourceUrl: project.hardware.priceRange.sourceUrl
        },
        {
            label: "Emission Model",
            value: project.emissions.model.value,
            icon: <TrendingUp size={14} />,
            isVerified: project.emissions.model.isVerified,
            source: project.emissions.model.source,
            sourceUrl: project.emissions.model.sourceUrl
        },
        {
            label: "Validation",
            value: project.validation.method.value,
            icon: <Database size={14} />,
            isVerified: project.validation.method.isVerified,
            source: project.validation.method.source,
            sourceUrl: project.validation.method.sourceUrl
        }
    ];

    const allVerified = assumptions.every(a => a.isVerified);

    return (
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4 my-4">
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <BookOpen size={16} className="text-indigo-400" />
                        Archetype DNA: {project.name}
                        {allVerified ? (
                            <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                <CheckCircle size={10} />
                                Verified
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 text-[10px] text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full">
                                <AlertTriangle size={10} />
                                Partially Verified
                            </span>
                        )}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">{project.category}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {assumptions.map((item, i) => (
                    <div key={i} className={`bg-slate-950/50 border rounded p-2 ${item.isVerified ? 'border-slate-800' : 'border-yellow-500/30'}`}>
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <div className="text-slate-500">{item.icon}</div>
                                <p className="text-[10px] uppercase text-slate-500 font-bold">{item.label}</p>
                            </div>
                            {item.isVerified ? (
                                <CheckCircle size={10} className="text-emerald-500" />
                            ) : (
                                <AlertTriangle size={10} className="text-yellow-500" />
                            )}
                        </div>
                        <p className="text-xs text-slate-200 font-medium">{item.value}</p>
                        {item.sourceUrl ? (
                            <a
                                href={item.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[9px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mt-1"
                            >
                                <ExternalLink size={8} />
                                {item.source}
                            </a>
                        ) : (
                            <p className="text-[9px] text-slate-600 mt-1">{item.source}</p>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-3 pt-2 border-t border-slate-800/50 flex items-start justify-between">
                <p className="text-xs text-slate-500">
                    <span className="font-bold">Critical Flaw:</span> {project.criticalFlaw || 'None identified'}
                </p>
                <div className={`text-[10px] px-2 py-0.5 rounded font-bold ${project.riskLevel === 'low' ? 'bg-emerald-500/10 text-emerald-400' :
                        project.riskLevel === 'moderate' ? 'bg-yellow-500/10 text-yellow-400' :
                            project.riskLevel === 'high' ? 'bg-orange-500/10 text-orange-400' :
                                'bg-red-500/10 text-red-400'
                    }`}>
                    {project.riskLevel.toUpperCase()} RISK
                </div>
            </div>
        </div>
    );
};
