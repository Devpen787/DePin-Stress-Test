import { useState, useEffect } from 'react';

export interface ResearchDataPoint {
    week: number;
    price_mean: number;
    price_p05: number;
    price_p95: number;
    nodes_mean: number;
    nodes_p05: number;
    nodes_p95: number;
    revenue_mean: number;
    revenue_p05: number;
    revenue_p95: number;
}

export interface ResearchDataset {
    metadata: {
        engine: string;
        scenario: string;
        n_sims: number;
        generated_at: string;
    };
    time_series: ResearchDataPoint[];
}

export type ResearchScenario = 'neutral' | 'bull' | 'bear' | 'hyper';

export const useResearchData = (scenario: ResearchScenario = 'neutral') => {
    const [data, setData] = useState<ResearchDataset | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            // UX: Artificial delay to make the scenario switch perceptible
            // Users trust the data change more if they see a brief loading state
            await new Promise(resolve => setTimeout(resolve, 600));

            try {
                const response = await fetch(`/data/research_${scenario}.json`);
                if (!response.ok) {
                    throw new Error(`Failed to load research data for ${scenario}`);
                }
                const json = await response.json();
                setData(json);
                setLoading(false);
            } catch (err) {
                console.error('Error loading research data:', err);
                setError(err instanceof Error ? err.message : 'Unknown error');
                setLoading(false);
            }
        };

        fetchData();
    }, [scenario]);

    return { data, loading, error };
};
