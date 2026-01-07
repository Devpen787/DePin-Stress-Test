/**
 * CoinGecko API Service
 * Fetches real-time token data for DePIN protocols
 * 
 * Free tier: 10-30 calls/minute
 * Docs: https://www.coingecko.com/en/api/documentation
 */

export interface TokenMarketData {
  id: string;
  symbol: string;
  name: string;
  currentPrice: number;
  marketCap: number;
  circulatingSupply: number;
  totalSupply: number;
  maxSupply: number | null;
  priceChange24h: number;
  priceChangePercentage24h: number;
  priceChange7d?: number;
  priceChange30d?: number;
  ath: number;
  athDate: string;
  atl: number;
  atlDate: string;
  lastUpdated: string;
  sparkline7d?: number[];
}

export interface ProtocolLiveData {
  tokenData: TokenMarketData | null;
  networkStats?: {
    nodeCount?: number;
    activeNodes?: number;
    totalRewardsDistributed?: number;
  };
  error?: string;
  fetchedAt: string;
}

export interface DePINTokenInfo {
  name: string;
  symbol: string;
  category: string;
  coingeckoId: string;
  description?: string;
  website?: string;
  explorer?: string;
}

// CoinGecko token IDs for protocol profiles
export const COINGECKO_TOKEN_IDS: Record<string, string> = {
  'ono_v3_calibrated': 'onocoy-token',
  'helium_bme_v1': 'helium',
  'adaptive_elastic_v1': 'render-token',
  // Additional protocols
  'filecoin_v1': 'filecoin',
  'akash_v1': 'akash-network',
  'dimo_v1': 'dimo',
  'hivemapper_v1': 'hivemapper',
  'theta_v1': 'theta-token',
};

// Comprehensive DePIN token database
export const DEPIN_TOKENS: Record<string, DePINTokenInfo> = {
  'onocoy-token': { 
    name: 'ONOCOY', 
    symbol: 'ONO', 
    category: 'GPS/GNSS',
    coingeckoId: 'onocoy-token',
    description: 'Decentralised RTK correction network for precision positioning',
    website: 'https://onocoy.com',
  },
  'helium': { 
    name: 'Helium', 
    symbol: 'HNT', 
    category: 'IoT/Wireless',
    coingeckoId: 'helium',
    description: 'Decentralised wireless network for IoT devices',
    website: 'https://helium.com',
  },
  'render-token': { 
    name: 'Render', 
    symbol: 'RNDR', 
    category: 'GPU Computing',
    coingeckoId: 'render-token',
    description: 'Distributed GPU rendering network',
    website: 'https://rendernetwork.com',
  },
  'filecoin': { 
    name: 'Filecoin', 
    symbol: 'FIL', 
    category: 'Storage',
    coingeckoId: 'filecoin',
    description: 'Decentralised storage network',
    website: 'https://filecoin.io',
  },
  'theta-token': { 
    name: 'Theta', 
    symbol: 'THETA', 
    category: 'Video/CDN',
    coingeckoId: 'theta-token',
    description: 'Decentralised video delivery network',
    website: 'https://thetatoken.org',
  },
  'akash-network': { 
    name: 'Akash', 
    symbol: 'AKT', 
    category: 'Cloud Computing',
    coingeckoId: 'akash-network',
    description: 'Decentralised cloud computing marketplace',
    website: 'https://akash.network',
  },
  'hivemapper': { 
    name: 'Hivemapper', 
    symbol: 'HONEY', 
    category: 'Mapping',
    coingeckoId: 'hivemapper',
    description: 'Decentralised mapping network using dashcams',
    website: 'https://hivemapper.com',
  },
  'dimo': { 
    name: 'DIMO', 
    symbol: 'DIMO', 
    category: 'Vehicle Data',
    coingeckoId: 'dimo',
    description: 'User-owned vehicle data network',
    website: 'https://dimo.zone',
  },
  'iotex': {
    name: 'IoTeX',
    symbol: 'IOTX',
    category: 'IoT/Blockchain',
    coingeckoId: 'iotex',
    description: 'IoT-focused blockchain platform',
    website: 'https://iotex.io',
  },
  'arweave': {
    name: 'Arweave',
    symbol: 'AR',
    category: 'Permanent Storage',
    coingeckoId: 'arweave',
    description: 'Permanent decentralised storage',
    website: 'https://arweave.org',
  },
};

// All available DePIN token IDs for fetching
export const ALL_DEPIN_TOKEN_IDS = Object.keys(DEPIN_TOKENS);

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';
const STORAGE_KEY = 'depin_live_data';
const STORAGE_TIMESTAMP_KEY = 'depin_live_data_timestamp';
const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

/**
 * localStorage helpers
 */
export function saveToLocalStorage(data: Record<string, TokenMarketData>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    localStorage.setItem(STORAGE_TIMESTAMP_KEY, new Date().toISOString());
  } catch (error) {
    console.warn('Failed to save to localStorage:', error);
  }
}

export function loadFromLocalStorage(): {
  data: Record<string, TokenMarketData> | null;
  timestamp: Date | null;
} {
  try {
    const dataStr = localStorage.getItem(STORAGE_KEY);
    const timestampStr = localStorage.getItem(STORAGE_TIMESTAMP_KEY);
    
    if (!dataStr) return { data: null, timestamp: null };
    
    return {
      data: JSON.parse(dataStr),
      timestamp: timestampStr ? new Date(timestampStr) : null,
    };
  } catch (error) {
    console.warn('Failed to load from localStorage:', error);
    return { data: null, timestamp: null };
  }
}

export function clearLocalStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
  } catch (error) {
    console.warn('Failed to clear localStorage:', error);
  }
}

/**
 * Check if cached data is still fresh
 */
export function isCacheFresh(timestamp: Date | null, maxAge: number = AUTO_REFRESH_INTERVAL): boolean {
  if (!timestamp) return false;
  return Date.now() - timestamp.getTime() < maxAge;
}

/**
 * Fetch token market data from CoinGecko
 */
export async function fetchTokenData(tokenId: string): Promise<TokenMarketData | null> {
  try {
    const response = await fetch(
      `${COINGECKO_BASE_URL}/coins/${tokenId}?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=true`
    );
    
    if (!response.ok) {
      console.error(`CoinGecko API error: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    return {
      id: data.id,
      symbol: data.symbol?.toUpperCase(),
      name: data.name,
      currentPrice: data.market_data?.current_price?.usd || 0,
      marketCap: data.market_data?.market_cap?.usd || 0,
      circulatingSupply: data.market_data?.circulating_supply || 0,
      totalSupply: data.market_data?.total_supply || 0,
      maxSupply: data.market_data?.max_supply,
      priceChange24h: data.market_data?.price_change_24h || 0,
      priceChangePercentage24h: data.market_data?.price_change_percentage_24h || 0,
      priceChange7d: data.market_data?.price_change_percentage_7d,
      priceChange30d: data.market_data?.price_change_percentage_30d,
      ath: data.market_data?.ath?.usd || 0,
      athDate: data.market_data?.ath_date?.usd || '',
      atl: data.market_data?.atl?.usd || 0,
      atlDate: data.market_data?.atl_date?.usd || '',
      lastUpdated: data.last_updated || new Date().toISOString(),
      sparkline7d: data.market_data?.sparkline_7d?.price,
    };
  } catch (error) {
    console.error(`Failed to fetch token data for ${tokenId}:`, error);
    return null;
  }
}

/**
 * Fetch multiple tokens at once (more efficient)
 */
export async function fetchMultipleTokens(tokenIds: string[]): Promise<Record<string, TokenMarketData>> {
  const results: Record<string, TokenMarketData> = {};
  
  try {
    const ids = tokenIds.join(',');
    const response = await fetch(
      `${COINGECKO_BASE_URL}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=true&price_change_percentage=24h,7d,30d`
    );
    
    if (!response.ok) {
      console.error(`CoinGecko API error: ${response.status}`);
      return results;
    }
    
    const data = await response.json();
    
    for (const token of data) {
      results[token.id] = {
        id: token.id,
        symbol: token.symbol?.toUpperCase(),
        name: token.name,
        currentPrice: token.current_price || 0,
        marketCap: token.market_cap || 0,
        circulatingSupply: token.circulating_supply || 0,
        totalSupply: token.total_supply || 0,
        maxSupply: token.max_supply,
        priceChange24h: token.price_change_24h || 0,
        priceChangePercentage24h: token.price_change_percentage_24h || 0,
        priceChange7d: token.price_change_percentage_7d_in_currency,
        priceChange30d: token.price_change_percentage_30d_in_currency,
        ath: token.ath || 0,
        athDate: token.ath_date || '',
        atl: token.atl || 0,
        atlDate: token.atl_date || '',
        lastUpdated: token.last_updated || new Date().toISOString(),
        sparkline7d: token.sparkline_in_7d?.price,
      };
    }
    
    // Save to localStorage
    saveToLocalStorage(results);
    
  } catch (error) {
    console.error('Failed to fetch multiple tokens:', error);
  }
  
  return results;
}

/**
 * Fetch all DePIN tokens
 */
export async function fetchAllDePINTokens(): Promise<Record<string, TokenMarketData>> {
  return fetchMultipleTokens(ALL_DEPIN_TOKEN_IDS);
}

/**
 * Fetch all protocol data for the simulation
 */
export async function fetchAllProtocolData(): Promise<Record<string, ProtocolLiveData>> {
  const results: Record<string, ProtocolLiveData> = {};
  const tokenIds = Object.values(COINGECKO_TOKEN_IDS);
  const fetchedAt = new Date().toISOString();
  
  const tokenDataMap = await fetchMultipleTokens(tokenIds);
  
  for (const [protocolId, tokenId] of Object.entries(COINGECKO_TOKEN_IDS)) {
    const tokenData = tokenDataMap[tokenId] || null;
    results[protocolId] = {
      tokenData,
      error: tokenData ? undefined : `Failed to fetch data for ${tokenId}`,
      fetchedAt,
    };
  }
  
  return results;
}

/**
 * Get simple price data (minimal API call)
 */
export async function getSimplePrices(tokenIds: string[]): Promise<Record<string, number>> {
  try {
    const ids = tokenIds.join(',');
    const response = await fetch(
      `${COINGECKO_BASE_URL}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
    );
    
    if (!response.ok) {
      return {};
    }
    
    const data = await response.json();
    const result: Record<string, number> = {};
    
    for (const id of tokenIds) {
      result[id] = data[id]?.usd || 0;
    }
    
    return result;
  } catch (error) {
    console.error('Failed to fetch simple prices:', error);
    return {};
  }
}

/**
 * Convert live data to simulation parameters
 */
export function liveDataToSimParams(liveData: TokenMarketData): {
  initialSupply: number;
  initialPrice: number;
} {
  return {
    initialSupply: liveData.circulatingSupply,
    initialPrice: liveData.currentPrice,
  };
}

/**
 * Cache for rate limiting
 */
let lastFetchTime = 0;
const MIN_FETCH_INTERVAL = 60000; // 1 minute minimum between fetches

export async function fetchWithRateLimit<T>(
  fetchFn: () => Promise<T>
): Promise<T | null> {
  const now = Date.now();
  if (now - lastFetchTime < MIN_FETCH_INTERVAL) {
    console.warn('Rate limit: Please wait before fetching again');
    return null;
  }
  
  lastFetchTime = now;
  return fetchFn();
}

/**
 * Auto-refresh manager
 */
export class AutoRefreshManager {
  private intervalId: NodeJS.Timeout | null = null;
  private callback: (() => void) | null = null;
  private interval: number = AUTO_REFRESH_INTERVAL;

  start(callback: () => void, interval: number = AUTO_REFRESH_INTERVAL): void {
    this.stop();
    this.callback = callback;
    this.interval = interval;
    this.intervalId = setInterval(() => {
      if (this.callback) {
        this.callback();
      }
    }, this.interval);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  isRunning(): boolean {
    return this.intervalId !== null;
  }

  getInterval(): number {
    return this.interval;
  }
}

// Singleton instance
export const autoRefreshManager = new AutoRefreshManager();

/**
 * Format time until next refresh
 */
export function getTimeUntilNextRefresh(lastFetch: Date | null): string {
  if (!lastFetch) return 'Never';
  
  const elapsed = Date.now() - lastFetch.getTime();
  const remaining = AUTO_REFRESH_INTERVAL - elapsed;
  
  if (remaining <= 0) return 'Now';
  
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}
