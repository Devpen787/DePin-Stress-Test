import { useState, useEffect } from 'react';
import { OnChainMetrics, getMockOnChainMetrics } from '../services/dune';

// Expanded Metric Source Type
export type MetricSource = 'dune' | 'subgraph' | 'snapshot' | 'estimated';

export interface ProtocolMetrics extends OnChainMetrics {
    sourceType: MetricSource;
    lastUpdated: string; // Must match base definition
}

// Recent Snapshots (Q1 2025 Estimates)
const SNAPSHOTS: Record<string, Partial<ProtocolMetrics>> = {
    'helium_bme_v1': {
        activeNodesTotal: 96500, // Est. Active IOT Hotspots (filtered for rewards)
        tokenBurned7d: 125000,   // Est. HNT Burn (Data Credits)
        sourceType: 'snapshot'
    },
    'hivemapper_v1': {
        activeNodesTotal: 42000, // Monthly Active Contributors
        tokenBurned7d: 850000,   // HONEY Burn
        sourceType: 'snapshot'
    },
    'dimo_v1': {
        activeNodesTotal: 34000, // Connected Vehicles
        tokenBurned7d: 12000,    // DIMO Burn
        sourceType: 'snapshot'
    },
    'grass_v1': {
        activeNodesTotal: 2100000, // Residential Nodes
        tokenBurned7d: 0,
        sourceType: 'snapshot'
    }
};

export const useProtocolMetrics = (protocolIds: string[]) => {
    const [metrics, setMetrics] = useState<Record<string, ProtocolMetrics | null>>({});
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchMetrics = async () => {
            setLoading(true);
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 800));

            const newData: Record<string, ProtocolMetrics | null> = {};

            for (const pid of protocolIds) {
                // 1. Check for Timeline Snapshots (Helium, Hivemapper, etc)
                if (SNAPSHOTS[pid]) {
                    newData[pid] = {
                        ...getMockOnChainMetrics(pid), // Base structure
                        ...SNAPSHOTS[pid], // Override with snapshot data
                        lastUpdated: new Date().toISOString()
                    } as ProtocolMetrics;
                    continue;
                }

                // 2. Fallback to Dune Mocks (Onocoy, Geodnet)
                let mockKey = '';
                if (pid.includes('ono')) mockKey = 'onocoy';
                else if (pid.includes('geodnet')) mockKey = 'geodnet';

                if (mockKey) {
                    const duneMock = getMockOnChainMetrics(mockKey);
                    newData[pid] = {
                        ...duneMock,
                        sourceType: 'dune', // Simulated Dune
                        lastUpdated: new Date().toISOString()
                    };
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
