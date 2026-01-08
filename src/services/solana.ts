import { DEPIN_TOKENS } from './coingecko';

const SOLANA_RPC_URL = 'https://api.mainnet-beta.solana.com';

// Map of CoinGecko IDs to Solana Mint Addresses
const TOKEN_MINTS: Record<string, string> = {
    'helium': 'hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux',
    'helium-mobile': 'mb1eu7TzEc71KxDpsmsKoucSSuuoGLv1drys1oP2jh6',
    'nosana': 'nosXBVoaCTtYdLvKY6Csb4AC8JCdQKKAaWYtx2ZMoo7',
    'hivemapper': '4vMsoUT2BWatFweudnQM1xedRLfJgJ7hswhcpz4xgBTy',
    'render-token': 'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof',
    'shadow-token': 'SHDWyBxihqiCj6YekG2GUr7wqKLeLAMK1gHZck9pL6y',
    'onocoy-token': 'onoyC1ZjHNtT2tShqvVSg5WEcQDbu5zht6sdU9Nwjrc',
    'grass': 'Grass7B4RdKfBCjTKgSqnXkqjwiGvQyFbuSCUJr3XXjs',
    'aleph': '3UCMiSnkcnkPE1pgQ5ggPCBv6dXgVUy16TmMUe1WpG9x',
    'iotex': 'QUUzqeiXHxjs9Yxm33tvugvUsKr5T8vjeyV4XhVsAfZ',
};

export interface OnChainData {
    mint: string;
    supply: number;
    decimals: number;
    verified: boolean;
}

export const SolanaService = {
    /**
     * Fetch token supply directly from Solana RPC
     */
    async getTokenSupply(mintAddress: string): Promise<OnChainData | null> {
        try {
            const response = await fetch(SOLANA_RPC_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'getTokenSupply',
                    params: [mintAddress]
                })
            });

            const data = await response.json();
            if (data.result && data.result.value) {
                return {
                    mint: mintAddress,
                    supply: data.result.value.uiAmount,
                    decimals: data.result.value.decimals,
                    verified: true
                };
            }
            return null;
        } catch (e) {
            console.error('Failed to fetch on-chain supply:', e);
            return null;
        }
    },

    /**
     * Fetch verification data for known DePIN tokens
     */
    async verifySupplies(): Promise<Record<string, OnChainData>> {
        const results: Record<string, OnChainData> = {};
        const promises = Object.entries(TOKEN_MINTS).map(async ([coingeckoId, mint]) => {
            const data = await this.getTokenSupply(mint);
            if (data) {
                results[coingeckoId] = data;
            }
        });

        await Promise.all(promises);
        return results;
    }
};
