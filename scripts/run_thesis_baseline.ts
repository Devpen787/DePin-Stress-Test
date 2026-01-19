import fs from 'fs';
import path from 'path';
import {
    simulateOne,
    SimulationParams,
    SimResult
} from '../src/model/index';

import {
    PROTOCOL_PROFILES
} from '../src/data/protocols';

// ============================================================================
// CONFIGURATION
// ============================================================================
const ARGS = process.argv.slice(2);
const IS_DRY_RUN = ARGS.includes('--dry-run');

const CONFIG = {
    MASTER_SEED: 42,
    N_SIMS: IS_DRY_RUN ? 2 : 100,
    T: IS_DRY_RUN ? 10 : 52,
    OUTPUT_DIR: path.join(process.cwd(), IS_DRY_RUN ? 'thesis_results/baseline_dryrun' : 'thesis_results/baseline')
};

// ============================================================================
// TYPES
// ============================================================================
interface AggregatedStats {
    p25: number;
    median: number;
    p75: number;
}

// ============================================================================
// UTILS
// ============================================================================
function ensureDir(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

function calculateQuartiles(values: number[]): AggregatedStats {
    if (values.length === 0) return { p25: 0, median: 0, p75: 0 };

    // Sort logic requires explicit number comparison
    const sorted = [...values].sort((a, b) => a - b);

    const p25Index = Math.floor(sorted.length * 0.25);
    const medianIndex = Math.floor(sorted.length * 0.50);
    const p75Index = Math.floor(sorted.length * 0.75);

    return {
        p25: sorted[p25Index],
        median: sorted[medianIndex],
        p75: sorted[p75Index]
    };
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================
async function runBaseline() {
    console.log(`Starting Baseline Simulations...`);
    if (IS_DRY_RUN) console.log('=== DRY RUN MODE ===');
    console.log(`Config: T=${CONFIG.T}, N_SIMS=${CONFIG.N_SIMS}, Seed=${CONFIG.MASTER_SEED}`);

    ensureDir(CONFIG.OUTPUT_DIR);

    // Prepare Output Streams
    const tidyCsvPath = path.join(CONFIG.OUTPUT_DIR, 'baseline_tidy.csv');
    const summaryCsvPath = path.join(CONFIG.OUTPUT_DIR, 'baseline_summary.csv');
    const reportPath = path.join(CONFIG.OUTPUT_DIR, 'summary.md');

    // CSV Headers
    const tidyStream = fs.createWriteStream(tidyCsvPath);
    tidyStream.write('week,profile_id,sim_index,metric,value\n');

    const summaryStream = fs.createWriteStream(summaryCsvPath);
    summaryStream.write('profile_id,metric,week,p25,median,p75\n');

    const observations: string[] = [];

    for (const profile of PROTOCOL_PROFILES) {
        console.log(`Simulating Profile: ${profile.metadata.name} (${profile.metadata.id})`);

        // ----------------------------------------
        // CONSTRAINTS & OVERRIDES (STRICT NEUTRALITY)
        // ----------------------------------------
        const simParams: SimulationParams = {
            // Base parameters from the profile structure in src/data/protocols.ts
            T: CONFIG.T,
            initialSupply: profile.parameters.supply.value,
            initialPrice: profile.parameters.initial_price.value,
            maxMintWeekly: profile.parameters.emissions.value,
            burnPct: profile.parameters.burn_fraction.value,

            // Demand
            demandType: 'consistent', // STRICT OVERRIDE
            baseDemand: 12_000,       // Default neutral 12k
            demandVolatility: 0.0,    // STRICT OVERRIDE

            // Macro
            macro: 'sideways',        // STRICT OVERRIDE

            // Provider Economics
            initialProviders: profile.parameters.initial_active_providers.value,
            baseCapacityPerProvider: 180,
            capacityStdDev: 0.2,
            providerCostPerWeek: profile.parameters.provider_economics.opex_weekly.value,
            costStdDev: 0.15,
            hardwareLeadTime: 2,
            churnThreshold: profile.parameters.provider_economics.churn_threshold.value,
            profitThresholdToJoin: 15,

            // Constants
            kBuyPressure: 0.08,
            kSellPressure: 0.12,
            kDemandPrice: 0.15,
            kMintPrice: 0.35,
            baseServicePrice: 0.5,
            servicePriceElasticity: 0.6,
            minServicePrice: 0.05,
            maxServicePrice: 5.0,
            rewardLagWeeks: profile.parameters.adjustment_lag.value,

            // Simulation
            nSims: CONFIG.N_SIMS,
            seed: 0, // Will override in loop

            // Force Disable Scenarios
            scenario: undefined as any,         // STRICT DISABLE
            investorUnlockWeek: undefined as any, // STRICT DISABLE
            investorSellPct: 0.0,               // STRICT DISABLE
            growthCallEventWeek: undefined,     // STRICT DISABLE
            competitorYield: 0.0,               // STRICT DISABLE

            // Defaults
            initialLiquidity: 50000,
            maxProviderGrowthRate: 0.15,
            maxProviderChurnRate: 0.10,
            emissionModel: 'fixed',
            revenueStrategy: 'burn',
            hardwareCost: profile.parameters.hardware_cost.value,
            proTierPct: 0.0,
            proTierEfficiency: 1.5,
        };

        // ----------------------------------------
        // SCALING LOGIC (Avoid OOM on large networks)
        // ----------------------------------------
        const MAX_AGENTS = 2000;
        let scalingFactor = 1.0;

        if (simParams.initialProviders > MAX_AGENTS) {
            scalingFactor = simParams.initialProviders / MAX_AGENTS;
            simParams.initialProviders = MAX_AGENTS;
            console.log(`  -> Scaling active agents: ${Math.round(scalingFactor * MAX_AGENTS)} -> ${MAX_AGENTS} (Factor: ${scalingFactor.toFixed(2)}x)`);
        }

        // ----------------------------------------
        // MONTE CARLO LOOP
        // ----------------------------------------

        // Storage for aggregation: metric -> week -> values[]
        const rawData: Record<string, number[][]> = {
            price: [], supply: [], minted: [], burned: [],
            providers: [], capacity: [], utilization: [],
            solvencyScore: [], profit_avg_provider: [], incentive_ratio: [],
            retention_absolute: [], retention_rate: []
        };

        // Initialize arrays
        for (const key of Object.keys(rawData)) {
            rawData[key] = Array(CONFIG.T).fill(0).map(() => []);
        }

        for (let i = 0; i < CONFIG.N_SIMS; i++) {
            const runSeed = CONFIG.MASTER_SEED + i;
            const results = simulateOne(simParams, runSeed, scalingFactor);

            // Capture initial provider count for retention
            const initialProviders = results[0]?.providers ?? 0;
            const startZero = initialProviders === 0;

            if (startZero && i === 0) {
                console.warn(`[WARNING] Profile ${profile.metadata.id} starts with 0 providers. Retention will be NULL.`);
                observations.push(`- **Warning**: ${profile.metadata.name} starts with 0 providers; Retention metrics are undefined.`);
            }

            results.forEach((r: SimResult, t: number) => {
                if (t >= CONFIG.T) return;

                // --- 1. Core Metrics ---
                const metrics: Record<string, number> = {
                    price: r.price,
                    supply: r.supply,
                    minted: r.minted,
                    burned: r.burned,
                    providers: r.providers,
                    capacity: r.capacity,
                    utilization: r.utilisation,
                    solvencyScore: r.solvencyScore,
                    profit_avg_provider: r.profit,      // Renamed
                    incentive_ratio: r.incentive        // Renamed
                };

                // --- 2. Retention Metrics ---
                // Absolute Retention: Current / Initial
                let retentionAbs = -1; // -1 as sentinel for NULL/NA
                if (!startZero) {
                    retentionAbs = r.providers / initialProviders;
                }

                // Retention Rate: 1 - (Churn / Previous)
                let retentionRate = -1;
                const prevProviders = t > 0 ? results[t - 1].providers : initialProviders;
                if (prevProviders > 0) {
                    retentionRate = 1.0 - (r.churnCount / prevProviders);
                } else {
                    retentionRate = -1;
                }

                // Add to metrics for loop
                metrics['retention_absolute'] = retentionAbs;
                metrics['retention_rate'] = retentionRate;

                // --- 3. Write to Tidy CSV & Store for Summary ---
                for (const [key, val] of Object.entries(metrics)) {
                    // Store for aggregation
                    if (val !== -1) {
                        rawData[key][t].push(val);
                    }

                    // Tidy CSV: Write exact value (or NA)
                    const valStr = val === -1 ? 'NA' : val.toFixed(6);
                    tidyStream.write(`${t},${profile.metadata.id},${i},${key},${valStr}\n`);
                }
            });
        }

        // ----------------------------------------
        // AGGREGATION & SUMMARY CSV
        // ----------------------------------------
        for (const [metric, weeks] of Object.entries(rawData)) {
            weeks.forEach((values, t) => {
                if (values.length === 0) {
                    // All were NA
                    summaryStream.write(`${profile.metadata.id},${metric},${t},NA,NA,NA\n`);
                } else {
                    const stats = calculateQuartiles(values);
                    summaryStream.write(`${profile.metadata.id},${metric},${t},${stats.p25.toFixed(6)},${stats.median.toFixed(6)},${stats.p75.toFixed(6)}\n`);
                }
            });
        }
    }

    tidyStream.end();
    summaryStream.end();

    // ----------------------------------------
    // GENERATE REPORT SUMMARY.MD
    // ----------------------------------------
    const reportContent = `
# Baseline Simulation Summary (Section 6.2)

**Timestamp:** ${new Date().toISOString()}

## Configuration
| Parameter | Value |
|-----------|-------|
| Time Horizon (T) | ${CONFIG.T} weeks |
| Timestep | Weekly (Index 0-${CONFIG.T - 1}) |
| Simulations (N) | ${CONFIG.N_SIMS} |
| Master Seed | ${CONFIG.MASTER_SEED} |
| Protocol Profiles | ${PROTOCOL_PROFILES.map(p => p.metadata.name).join(', ')} |

## Baseline Integrity Checklist
- [x] **Scenario Disabled**: \`scenario\` explicitly set to \`undefined\`.
- [x] **Unlock Shock Disabled**: \`investorUnlockWeek\` undefined, \`investorSellPct\` = 0.
- [x] **Growth/Competitor Shocks Disabled**: Explicit nullification.
- [x] **Demand Volatility**: Set to 0.0 (Strict Neutrality).

## Observations
*(Generated via script logic)*
${observations.length > 0 ? observations.join('\n') : '- No warnings or irregularities detected during initialization.'}

## Output Files
- **Raw Data**: \`baseline_tidy.csv\` (Tidy format: week, profile, sim, metric, value)
- **Summary Stats**: \`baseline_summary.csv\` (Median, p25, p75)
`;

    fs.writeFileSync(reportPath, reportContent.trim());
    console.log(`Baseline Simulation Complete. Results saved to: ${CONFIG.OUTPUT_DIR}`);
}

runBaseline().catch(console.error);
