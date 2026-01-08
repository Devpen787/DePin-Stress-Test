import { TokenMarketData } from '../../services/coingecko';

export type ProtocolCategory =
    | 'Wireless'
    | 'Compute'
    | 'Storage'
    | 'AI/ML'
    | 'Sensors'
    | 'Vehicle'
    | 'Other';

export interface ExplorerProtocol {
    // Identity
    id: string;                    // unique internal id (e.g. 'helium_bme_v1')
    name: string;                  // 'Helium'
    symbol: string;                // 'HNT'
    logo?: string;                  // URL to logo image (optional)
    website?: string;               // Official website
    explorer?: string;              // Block explorer URL
    description?: string;          // Short protocol summary

    // Classification
    category: string;             // 'Wireless' | 'Compute' ...
    blockchain?: string;            // 'Solana' | 'Ethereum' ...
    hasToken: boolean;             // true if has token

    // Market Data (from CoinGecko)
    coingeckoId: string;           // 'helium'
    currentPrice: number;          // $1.58
    priceChange24h: number;        // 2.34 (%)
    priceChange7d?: number;        // 7d % change
    marketCap: number;             // $285,400,000
    volume24h: number;             // $12,500,000
    circulatingSupply: number;     // 180,000,000
    maxSupply: number | null;      // null (unlimited) or number
    sparkline7d?: number[];        // 7 daily prices

    // Our Unique Metrics (from stress tests)
    stressScore: number | null;    // 0-10, null if not tested
    paybackPeriod: number | null;  // Weeks, null if not tested
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | null;
    lastStressTest?: string | null; // ISO timestamp

    // On-Chain Data
    onChainVerified?: boolean;     // Verified via Solana RPC

    // Rankings
    rank: number;                  // Calculated
}

// Table sorting options
export type SortColumn = 'rank' | 'name' | 'price' | 'marketCap' | 'change24h' | 'riskLevel' | 'stressScore';

export type SortDirection = 'asc' | 'desc';
