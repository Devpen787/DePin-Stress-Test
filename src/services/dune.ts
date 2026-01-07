/**
 * Dune Analytics Service
 * Fetches on-chain metrics for DePIN protocols
 * 
 * Note: Requires Dune API key for full functionality
 * Free tier: Limited queries per day
 * Docs: https://dune.com/docs/api/
 */

export interface DuneQueryResult {
  execution_id: string;
  state: 'QUERY_STATE_PENDING' | 'QUERY_STATE_EXECUTING' | 'QUERY_STATE_COMPLETED' | 'QUERY_STATE_FAILED';
  data?: {
    rows: Record<string, unknown>[];
    metadata: {
      column_names: string[];
      result_set_bytes: number;
      total_row_count: number;
    };
  };
  error?: string;
}

export interface OnChainMetrics {
  tokenBurned24h: number;
  tokenBurned7d: number;
  tokenBurnedTotal: number;
  revenueUSD24h: number;
  revenueUSD7d: number;
  activeNodes24h: number;
  activeNodesTotal: number;
  transactionCount24h: number;
  uniqueUsers24h: number;
  avgRewardPerNode: number;
  networkUptime: number;
  lastUpdated: string;
}

// Known Dune query IDs for DePIN protocols
// These would need to be created on Dune.com
export const DUNE_QUERY_IDS: Record<string, number> = {
  // Placeholder IDs - replace with actual Dune query IDs
  'onocoy_metrics': 0, // TODO: Create ONOCOY dashboard on Dune
  'helium_metrics': 3429545, // Example Helium query
  'render_metrics': 0,
  'filecoin_metrics': 2636883, // Example Filecoin query
};

// ONOCOY-specific endpoints (from their upcoming Dune dashboard)
export const ONOCOY_DUNE_ENDPOINTS = {
  tokenBurn: 'https://dune.com/onocoy/token-burn', // Placeholder
  networkGrowth: 'https://dune.com/onocoy/network-growth',
  revenueMetrics: 'https://dune.com/onocoy/enterprise-revenue',
  stationUptime: 'https://dune.com/onocoy/station-uptime',
};

const DUNE_API_BASE = 'https://api.dune.com/api/v1';

/**
 * Get Dune API key from environment or prompt
 */
function getDuneApiKey(): string | null {
  // Check for API key in environment
  if (typeof process !== 'undefined' && process.env?.DUNE_API_KEY) {
    return process.env.DUNE_API_KEY;
  }
  
  // Check localStorage for saved key
  try {
    return localStorage.getItem('dune_api_key');
  } catch {
    return null;
  }
}

/**
 * Save Dune API key to localStorage
 */
export function saveDuneApiKey(key: string): void {
  try {
    localStorage.setItem('dune_api_key', key);
  } catch (error) {
    console.warn('Failed to save Dune API key:', error);
  }
}

/**
 * Execute a Dune query
 */
export async function executeDuneQuery(queryId: number): Promise<DuneQueryResult | null> {
  const apiKey = getDuneApiKey();
  
  if (!apiKey) {
    console.warn('Dune API key not configured. Set DUNE_API_KEY or call saveDuneApiKey()');
    return null;
  }

  try {
    // Start execution
    const execResponse = await fetch(`${DUNE_API_BASE}/query/${queryId}/execute`, {
      method: 'POST',
      headers: {
        'X-Dune-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!execResponse.ok) {
      console.error(`Dune API error: ${execResponse.status}`);
      return null;
    }

    const execData = await execResponse.json();
    const executionId = execData.execution_id;

    // Poll for results
    let attempts = 0;
    const maxAttempts = 30;
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const statusResponse = await fetch(`${DUNE_API_BASE}/execution/${executionId}/status`, {
        headers: { 'X-Dune-API-Key': apiKey },
      });

      if (!statusResponse.ok) continue;

      const statusData = await statusResponse.json();
      
      if (statusData.state === 'QUERY_STATE_COMPLETED') {
        // Get results
        const resultsResponse = await fetch(`${DUNE_API_BASE}/execution/${executionId}/results`, {
          headers: { 'X-Dune-API-Key': apiKey },
        });

        if (resultsResponse.ok) {
          const resultsData = await resultsResponse.json();
          return {
            execution_id: executionId,
            state: 'QUERY_STATE_COMPLETED',
            data: resultsData.result,
          };
        }
      } else if (statusData.state === 'QUERY_STATE_FAILED') {
        return {
          execution_id: executionId,
          state: 'QUERY_STATE_FAILED',
          error: statusData.error || 'Query execution failed',
        };
      }

      attempts++;
    }

    return {
      execution_id: executionId,
      state: 'QUERY_STATE_PENDING',
      error: 'Query timed out',
    };
  } catch (error) {
    console.error('Dune query failed:', error);
    return null;
  }
}

/**
 * Get latest results from a Dune query (cached)
 */
export async function getLatestDuneResults(queryId: number): Promise<DuneQueryResult | null> {
  const apiKey = getDuneApiKey();
  
  if (!apiKey) {
    return null;
  }

  try {
    const response = await fetch(`${DUNE_API_BASE}/query/${queryId}/results`, {
      headers: { 'X-Dune-API-Key': apiKey },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return {
      execution_id: data.execution_id,
      state: 'QUERY_STATE_COMPLETED',
      data: data.result,
    };
  } catch (error) {
    console.error('Failed to get Dune results:', error);
    return null;
  }
}

/**
 * Parse ONOCOY-specific metrics from Dune results
 */
export function parseOnocoyMetrics(results: DuneQueryResult): OnChainMetrics | null {
  if (!results.data?.rows || results.data.rows.length === 0) {
    return null;
  }

  const row = results.data.rows[0];
  
  return {
    tokenBurned24h: Number(row.token_burned_24h) || 0,
    tokenBurned7d: Number(row.token_burned_7d) || 0,
    tokenBurnedTotal: Number(row.token_burned_total) || 0,
    revenueUSD24h: Number(row.revenue_usd_24h) || 0,
    revenueUSD7d: Number(row.revenue_usd_7d) || 0,
    activeNodes24h: Number(row.active_nodes_24h) || 0,
    activeNodesTotal: Number(row.active_nodes_total) || 0,
    transactionCount24h: Number(row.tx_count_24h) || 0,
    uniqueUsers24h: Number(row.unique_users_24h) || 0,
    avgRewardPerNode: Number(row.avg_reward_per_node) || 0,
    networkUptime: Number(row.network_uptime) || 99.9,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Mock data for development/demo purposes
 */
export function getMockOnChainMetrics(protocol: string): OnChainMetrics {
  const baseMetrics: OnChainMetrics = {
    tokenBurned24h: 0,
    tokenBurned7d: 0,
    tokenBurnedTotal: 0,
    revenueUSD24h: 0,
    revenueUSD7d: 0,
    activeNodes24h: 0,
    activeNodesTotal: 0,
    transactionCount24h: 0,
    uniqueUsers24h: 0,
    avgRewardPerNode: 0,
    networkUptime: 99.9,
    lastUpdated: new Date().toISOString(),
  };

  switch (protocol) {
    case 'onocoy':
      return {
        ...baseMetrics,
        tokenBurned24h: 125000,
        tokenBurned7d: 875000,
        tokenBurnedTotal: 15000000,
        revenueUSD24h: 2500,
        revenueUSD7d: 17500,
        activeNodes24h: 2800,
        activeNodesTotal: 3200,
        transactionCount24h: 45000,
        uniqueUsers24h: 850,
        avgRewardPerNode: 15.5,
        networkUptime: 99.7,
      };
    case 'helium':
      return {
        ...baseMetrics,
        tokenBurned24h: 15000,
        tokenBurned7d: 105000,
        tokenBurnedTotal: 2500000,
        revenueUSD24h: 125000,
        revenueUSD7d: 875000,
        activeNodes24h: 350000,
        activeNodesTotal: 375000,
        transactionCount24h: 2500000,
        uniqueUsers24h: 45000,
        avgRewardPerNode: 0.35,
        networkUptime: 99.95,
      };
    case 'render':
      return {
        ...baseMetrics,
        tokenBurned24h: 50000,
        tokenBurned7d: 350000,
        tokenBurnedTotal: 8000000,
        revenueUSD24h: 85000,
        revenueUSD7d: 595000,
        activeNodes24h: 4500,
        activeNodesTotal: 6000,
        transactionCount24h: 125000,
        uniqueUsers24h: 12000,
        avgRewardPerNode: 18.9,
        networkUptime: 99.8,
      };
    default:
      return baseMetrics;
  }
}

/**
 * Check if Dune API is configured
 */
export function isDuneConfigured(): boolean {
  return getDuneApiKey() !== null;
}

/**
 * Dune integration status
 */
export interface DuneStatus {
  configured: boolean;
  lastQuery: Date | null;
  queriesRemaining: number | null;
  message: string;
}

export function getDuneStatus(): DuneStatus {
  const configured = isDuneConfigured();
  
  return {
    configured,
    lastQuery: null, // Would track this in production
    queriesRemaining: configured ? null : 0, // API would return this
    message: configured 
      ? 'Dune Analytics connected' 
      : 'Add your Dune API key to enable on-chain metrics',
  };
}

