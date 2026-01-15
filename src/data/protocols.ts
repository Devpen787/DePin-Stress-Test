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
        chain: 'solana' | 'ethereum' | 'polygon' | 'cosmos' | 'filecoin' | 'other';
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
        initial_active_providers: { value: number; unit: string };
        initial_price: { value: number; unit: string };
        hardware_cost: { value: number; unit: string };
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
            coingeckoId: "onocoy-token",
            chain: "solana"
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
            },
            initial_active_providers: { value: 3000, unit: "nodes" },
            initial_price: { value: 0.10, unit: "usd" }, // Break-even baseline
            hardware_cost: { value: 150, unit: "usd" }
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
            coingeckoId: "helium",
            chain: "solana"
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
            },
            initial_active_providers: { value: 370000, unit: "hotspots" },
            initial_price: { value: 3.00, unit: "usd" },
            hardware_cost: { value: 300, unit: "usd" }
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
            coingeckoId: "render-token",
            chain: "solana"
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
            },
            initial_active_providers: { value: 5000, unit: "gpu_nodes" },
            initial_price: { value: 4.50, unit: "usd" },
            hardware_cost: { value: 800, unit: "usd" }
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
            coingeckoId: "filecoin",
            chain: "filecoin"
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
            },
            initial_active_providers: { value: 3500, unit: "storage_providers" },
            initial_price: { value: 5.00, unit: "usd" },
            hardware_cost: { value: 2500, unit: "usd" }
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
            coingeckoId: "akash-network",
            chain: "cosmos"
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
            },
            initial_active_providers: { value: 1000, unit: "providers" },
            initial_price: { value: 2.50, unit: "usd" },
            hardware_cost: { value: 500, unit: "usd" }
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
            coingeckoId: "hivemapper",
            chain: "solana"
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
            },
            initial_active_providers: { value: 60000, unit: "cameras" },
            initial_price: { value: 0.15, unit: "usd" },
            hardware_cost: { value: 300, unit: "usd" }
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
            coingeckoId: "dimo",
            chain: "polygon"
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
            },
            initial_active_providers: { value: 25000, unit: "vehicles" },
            initial_price: { value: 0.20, unit: "usd" },
            hardware_cost: { value: 300, unit: "usd" }
        }
    },
    {
        version: "1.2",
        metadata: {
            id: "grass_v1",
            name: "Grass",
            mechanism: "Bandwidth Sharing + AI Data",
            notes: "Residential proxy network for AI training. 2.5M+ nodes. Solana L2.",
            model_type: "fungible_resource",
            source: "CoinGecko + Grass Foundation",
            coingeckoId: "grass",
            chain: "solana"
        },
        parameters: {
            // Real data: ~244M circulating, 1B total
            supply: { value: 244_000_000, unit: "tokens" },
            // Estimate based on unlocks + rewards
            emissions: { value: 3_500_000, unit: "tokens/week" },
            burn_fraction: { value: 0.10, unit: "decimal" }, // Buyback model
            adjustment_lag: { value: 0, unit: "weeks" },
            demand_regime: { value: "growth", unit: "category" },
            provider_economics: {
                // Negligible OpEx for user (bandwidth sharing)
                opex_weekly: { value: 0.50, unit: "usd/week" },
                churn_threshold: { value: 0.10, unit: "usd/week_profit" }
            },
            initial_active_providers: { value: 2_500_000, unit: "nodes" },
            initial_price: { value: 1.50, unit: "usd" },
            hardware_cost: { value: 0, unit: "usd" } // Software only
        }
    },
    {
        version: "1.2",
        metadata: {
            id: "ionet_v1",
            name: "io.net",
            mechanism: "GPU Marketplace + Staking",
            notes: "Decentralized GPU cloud. 800M max supply with disinflationary emissions over 20 years.",
            model_type: "fungible_resource",
            source: "CoinGecko + io.net Docs",
            coingeckoId: "io",
            chain: "solana"
        },
        parameters: {
            // 500M initial + 300M for emissions over 20 years
            supply: { value: 500_000_000, unit: "tokens" },
            // 8% Y1 emission rate = ~770K/week, decreasing 12% annually
            emissions: { value: 770_000, unit: "tokens/week" },
            burn_fraction: { value: 0.0, unit: "decimal" }, // No burn, staking rewards
            adjustment_lag: { value: 0, unit: "weeks" },
            demand_regime: { value: "growth", unit: "category" },
            provider_economics: {
                // GPU node costs vary widely: $100-500/week for high-end GPUs
                opex_weekly: { value: 150.00, unit: "usd/week" },
                churn_threshold: { value: 50.00, unit: "usd/week_profit" }
            },
            initial_active_providers: { value: 50000, unit: "gpu_nodes" },
            initial_price: { value: 2.00, unit: "usd" },
            hardware_cost: { value: 800, unit: "usd" }
        }
    },
    {
        version: "1.2",
        metadata: {
            id: "nosana_v1",
            name: "Nosana",
            mechanism: "GPU Grid + CI/CD",
            notes: "Solana-native GPU grid for AI inference. 100M max supply. Mining rewards ending 2025.",
            model_type: "fungible_resource",
            source: "CoinGecko + Nosana Docs",
            coingeckoId: "nosana",
            chain: "solana"
        },
        parameters: {
            // 100M total, ~48-83M circulating (vesting ending 2025)
            supply: { value: 48_000_000, unit: "tokens" },
            // Mining pool 20% = 20M over 24 months = ~190K/week
            emissions: { value: 190_000, unit: "tokens/week" },
            burn_fraction: { value: 0.0, unit: "decimal" },
            adjustment_lag: { value: 1, unit: "weeks" },
            demand_regime: { value: "growth", unit: "category" },
            provider_economics: {
                // Consumer GPU mining: $20-80/week in electricity
                opex_weekly: { value: 40.00, unit: "usd/week" },
                churn_threshold: { value: 15.00, unit: "usd/week_profit" }
            },
            initial_active_providers: { value: 3000, unit: "gpu_nodes" },
            initial_price: { value: 3.50, unit: "usd" },
            hardware_cost: { value: 600, unit: "usd" }
        }
    },
    {
        version: "1.2",
        metadata: {
            id: "geodnet_v1",
            name: "Geodnet",
            mechanism: "RTK Mining + Token Burn",
            notes: "GNSS/RTK network for precision positioning. 80% revenue burn. Annual emission halving.",
            model_type: "location_based",
            source: "CoinGecko + Geodnet Docs",
            coingeckoId: "geodnet",
            chain: "solana" // Migrating from Polygon to Solana
        },
        parameters: {
            // 1B total, ~440M circulating
            supply: { value: 440_000_000, unit: "tokens" },
            // 35% to miners over time, halving annually. ~24-48 GEOD/day per miner
            // ~10K active miners * 36 GEOD/day avg = 360K/day = 2.5M/week
            emissions: { value: 2_500_000, unit: "tokens/week" },
            burn_fraction: { value: 0.80, unit: "decimal" }, // 80% revenue burn
            adjustment_lag: { value: 0, unit: "weeks" },
            demand_regime: { value: "growth", unit: "category" },
            provider_economics: {
                // Triple-band GNSS station: $50-100/month = ~$15-25/week
                opex_weekly: { value: 20.00, unit: "usd/week" },
                churn_threshold: { value: 8.00, unit: "usd/week_profit" }
            },
            initial_active_providers: { value: 10000, unit: "gnss_stations" },
            initial_price: { value: 0.15, unit: "usd" },
            hardware_cost: { value: 500, unit: "usd" }
        }
    }
];
