export type DemandType = 'consistent' | 'high-to-decay' | 'growth' | 'volatile';
export type MacroCondition = 'bearish' | 'bullish' | 'sideways';

export interface ProtocolProfileV1 {
    version: string;
    metadata: {
        id: string;
        name: string;
        mechanism: string;
        notes: string;
        model_type: 'location_based' | 'fungible_resource';
        source: string;
        coingeckoId: string;
    };
    parameters: {
        supply: { value: number; unit: string };
        emissions: { value: number; unit: string };
        burn_fraction: { value: number; unit: string };
        adjustment_lag: { value: number; unit: string };
        demand_regime: { value: DemandType; unit: string };
        provider_economics: {
            opex_weekly: { value: number; unit: string };
            churn_threshold: { value: number; unit: string };
        };
    };
}

export const PROTOCOL_PROFILES: ProtocolProfileV1[] = [
    {
        version: "1.2",
        metadata: {
            id: "ono_v3_calibrated",
            name: "ONOCOY",
            mechanism: "Fixed Emissions w/ Partial Burn",
            notes: "Real data from CoinGecko. GPS/GNSS precision network. ~3000 active stations.",
            model_type: "location_based",
            source: "CoinGecko + Onocoy Docs",
            coingeckoId: "onocoy-token"
        },
        parameters: {
            // Real data: 410M circulating, 810M total supply
            supply: { value: 410_000_000, unit: "tokens" },
            // Estimated from tokenomics docs - ~5M tokens/week emissions
            emissions: { value: 5_000_000, unit: "tokens/week" },
            burn_fraction: { value: 0.65, unit: "decimal" },
            adjustment_lag: { value: 6, unit: "weeks" },
            demand_regime: { value: "growth", unit: "category" },
            provider_economics: {
                // Typical GNSS station OpEx ~$100-150/month = ~$25-35/week
                opex_weekly: { value: 30.00, unit: "usd/week" },
                churn_threshold: { value: 10, unit: "usd/week_profit" }
            }
        }
    },
    {
        version: "1.2",
        metadata: {
            id: "helium_bme_v1",
            name: "Helium",
            mechanism: "Burn-and-Mint Equilibrium",
            notes: "Real Helium Network data. IoT/5G wireless network. 370K+ hotspots.",
            model_type: "location_based",
            source: "CoinGecko + Helium Explorer",
            coingeckoId: "helium"
        },
        parameters: {
            // Real data: ~180M circulating supply
            supply: { value: 180_000_000, unit: "tokens" },
            // HNT emissions ~2.5M/month = ~625K/week (post-halving)
            emissions: { value: 625_000, unit: "tokens/week" },
            burn_fraction: { value: 1.0, unit: "decimal" },
            adjustment_lag: { value: 0, unit: "weeks" },
            demand_regime: { value: "consistent", unit: "category" },
            provider_economics: {
                // Helium hotspot OpEx varies: $5-50/month electricity
                opex_weekly: { value: 8.00, unit: "usd/week" },
                churn_threshold: { value: 2.00, unit: "usd/week_profit" }
            }
        }
    },
    {
        version: "1.2",
        metadata: {
            id: "adaptive_elastic_v1",
            name: "Render",
            mechanism: "Burn-and-Mint + Work Rewards",
            notes: "Real Render Network data. Distributed GPU computing. Elastic supply based on work.",
            model_type: "fungible_resource",
            source: "CoinGecko + Render Docs",
            coingeckoId: "render-token"
        },
        parameters: {
            // Real data: ~520M circulating supply
            supply: { value: 520_000_000, unit: "tokens" },
            // RNDR emissions tied to work - estimate ~1M/week
            emissions: { value: 1_000_000, unit: "tokens/week" },
            burn_fraction: { value: 0.50, unit: "decimal" },
            adjustment_lag: { value: 1, unit: "weeks" },
            demand_regime: { value: "growth", unit: "category" },
            provider_economics: {
                // GPU node OpEx: electricity + hardware depreciation ~$50-200/week
                opex_weekly: { value: 75.00, unit: "usd/week" },
                churn_threshold: { value: 25.00, unit: "usd/week_profit" }
            }
        }
    },
    {
        version: "1.2",
        metadata: {
            id: "filecoin_v1",
            name: "Filecoin",
            mechanism: "Proof-of-Storage + Collateral",
            notes: "Decentralised storage network. Storage providers stake FIL as collateral.",
            model_type: "fungible_resource",
            source: "CoinGecko + Filecoin Docs",
            coingeckoId: "filecoin"
        },
        parameters: {
            supply: { value: 500_000_000, unit: "tokens" },
            emissions: { value: 2_000_000, unit: "tokens/week" },
            burn_fraction: { value: 0.30, unit: "decimal" },
            adjustment_lag: { value: 4, unit: "weeks" },
            demand_regime: { value: "growth", unit: "category" },
            provider_economics: {
                opex_weekly: { value: 150.00, unit: "usd/week" },
                churn_threshold: { value: 50.00, unit: "usd/week_profit" }
            }
        }
    },
    {
        version: "1.2",
        metadata: {
            id: "akash_v1",
            name: "Akash",
            mechanism: "Reverse Auction Marketplace",
            notes: "Decentralised cloud computing. Providers bid for compute jobs.",
            model_type: "fungible_resource",
            source: "CoinGecko + Akash Docs",
            coingeckoId: "akash-network"
        },
        parameters: {
            supply: { value: 230_000_000, unit: "tokens" },
            emissions: { value: 500_000, unit: "tokens/week" },
            burn_fraction: { value: 0.20, unit: "decimal" },
            adjustment_lag: { value: 2, unit: "weeks" },
            demand_regime: { value: "volatile", unit: "category" },
            provider_economics: {
                opex_weekly: { value: 40.00, unit: "usd/week" },
                churn_threshold: { value: 15.00, unit: "usd/week_profit" }
            }
        }
    },
    {
        version: "1.2",
        metadata: {
            id: "hivemapper_v1",
            name: "Hivemapper",
            mechanism: "Map-to-Earn + Data Sales",
            notes: "Decentralised mapping using dashcams. Rewards for fresh map coverage.",
            model_type: "location_based",
            source: "CoinGecko + Hivemapper Docs",
            coingeckoId: "hivemapper"
        },
        parameters: {
            supply: { value: 100_000_000, unit: "tokens" },
            emissions: { value: 3_000_000, unit: "tokens/week" },
            burn_fraction: { value: 0.40, unit: "decimal" },
            adjustment_lag: { value: 1, unit: "weeks" },
            demand_regime: { value: "growth", unit: "category" },
            provider_economics: {
                opex_weekly: { value: 5.00, unit: "usd/week" },
                churn_threshold: { value: 2.00, unit: "usd/week_profit" }
            }
        }
    },
    {
        version: "1.2",
        metadata: {
            id: "dimo_v1",
            name: "DIMO",
            mechanism: "Vehicle Data Marketplace",
            notes: "User-owned vehicle data network. Drivers earn for sharing telemetry.",
            model_type: "location_based",
            source: "CoinGecko + DIMO Docs",
            coingeckoId: "dimo"
        },
        parameters: {
            supply: { value: 70_000_000, unit: "tokens" },
            emissions: { value: 1_500_000, unit: "tokens/week" },
            burn_fraction: { value: 0.25, unit: "decimal" },
            adjustment_lag: { value: 2, unit: "weeks" },
            demand_regime: { value: "growth", unit: "category" },
            provider_economics: {
                opex_weekly: { value: 2.00, unit: "usd/week" },
                churn_threshold: { value: 1.00, unit: "usd/week_profit" }
            }
        }
    }
];
