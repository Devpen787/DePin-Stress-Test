import { useState, useEffect } from 'react';
import { OnChainMetrics, getMockOnChainMetrics, executeDuneQuery, DUNE_QUERY_IDS } from '../services/dune';

export const useDuneMetrics = (protocolIds: string[]) => {
    const [metrics, setMetrics] = useState<Record<string, OnChainMetrics | null>>({});
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchMetrics = async () => {
            setLoading(true);
            const newData: Record<string, OnChainMetrics | null> = {};

            for (const pid of protocolIds) {
                // In a real scenario with API Key:
                // const queryId = DUNE_QUERY_IDS[pid];
                // if (queryId) { 
                //    const result = await executeDuneQuery(queryId); 
                //    if (result) newData[pid] = parseOnocoyMetrics(result);
                // }

                // For MVP/Demo: Use Mock Data
                // Map protocol IDs to mock keys
                let mockKey = '';
                if (pid.includes('ono')) mockKey = 'onocoy';
                else if (pid.includes('geodnet')) mockKey = 'geodnet'; // Dune service needs 'geodnet' case added if not present, checking...
                else if (pid.includes('helium')) mockKey = 'helium';
                else if (pid.includes('hivemapper')) mockKey = 'hivemapper';

                // Fallback to generic if mock key found
                if (mockKey) {
                    newData[pid] = getMockOnChainMetrics(mockKey);
                } else {
                    newData[pid] = null;
                }
            }

            setMetrics(newData);
            setLoading(false);
        };

        fetchMetrics();
    }, [JSON.stringify(protocolIds)]);

    return { metrics, loading };
};
