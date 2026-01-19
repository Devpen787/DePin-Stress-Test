export interface PeerGroup {
    id: string;
    name: string;
    description: string;
    inclusionCriteria: string[];
    members: string[]; // Protocol IDs
}

export const PEER_GROUPS: PeerGroup[] = [
    {
        id: 'gnss_location',
        name: 'GNSS & Location-Based',
        description: 'Physical infrastructure networks focused on location verification, mapping, and navigation.',
        inclusionCriteria: [
            'Hardware-based participation',
            'Location-dependent utility',
            'Tokenized incentives',
            'Burn-and-mint or similar tokenomics'
        ],
        members: [
            'ono_v3_calibrated', // Primary
            'geodnet_v1',        // Direct Competitor
            'hivemapper_v1',     // Mapping / Location
            'helium_bme_v1',     // Wireless / Location
            'dimo_v1'            // Vehicle Data / Location
        ]
    }
];

export const BENCHMARK_PEERS = {
    primary: 'ono_v3_calibrated',
    competitor: 'geodnet_v1'
};
