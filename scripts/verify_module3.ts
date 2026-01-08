
import { simulateOne } from '../src/model/simulation';
import { SimulationParams } from '../src/model/types';
import { DEFAULT_PARAMS } from '../src/model/params';

console.log("Starting Verification of Module 3: Dynamic Panic Logic...");

// 1. Setup Parameters for a "High Unlock Dump"
const params: SimulationParams = {
    ...DEFAULT_PARAMS,
    T: 52,
    initialLiquidity: 100000, // $100k depth
    investorUnlockWeek: 20,
    investorSellPct: 0.20, // 20% Dump (High)
    initialSupply: 1000000,
    initialPrice: 1.0,
    macro: 'sideways',
    churnThreshold: 0.1
};

// 2. Run Simulation
const results = simulateOne(params, 12345);

// 3. Inspect Results at Shock Week
const shockWeek = params.investorUnlockWeek;
const preShock = results[shockWeek - 1];
const postShock = results[shockWeek];

if (!preShock || !postShock) {
    console.error("Simulation failed to generate data for shock week.");
    process.exit(1);
}

// 4. Calculate Drops
const urbanDrop = preShock.urbanCount - postShock.urbanCount;
const ruralDrop = preShock.ruralCount - postShock.ruralCount;

const urbanDropPct = (urbanDrop / preShock.urbanCount) * 100;
const ruralDropPct = (ruralDrop / preShock.ruralCount) * 100;

console.log(`\n--- Shock Event Analysis (Week ${shockWeek}) ---`);
console.log(`Price Drop: $${preShock.price.toFixed(2)} -> $${postShock.price.toFixed(2)} (${((1 - postShock.price / preShock.price) * 100).toFixed(1)}%)`);
console.log(`\nMiner Capitulation:`);
console.log(`Urban Miners (High Cost): ${preShock.urbanCount} -> ${postShock.urbanCount} (Drop: ${urbanDrop}, ${urbanDropPct.toFixed(1)}%)`);
console.log(`Rural Miners (Low Cost):  ${preShock.ruralCount} -> ${postShock.ruralCount} (Drop: ${ruralDrop}, ${ruralDropPct.toFixed(1)}%)`);

// 5. Assertions
let passed = true;

if (urbanDropPct <= ruralDropPct) {
    console.error(`\n[FAIL] Urban miners did not panic faster than Rural miners.`);
    passed = false;
} else {
    console.log(`\n[PASS] Urban miners panicked significantly faster than Rural miners.`);
}

if (postShock.churnCount === 0) {
    console.error(`\n[FAIL] No churn recorded in the shock week.`);
    passed = false;
} else {
    console.log(`[PASS] Immediate churn recorded: ${postShock.churnCount}`);
}

if (passed) {
    console.log("\n✅ VERIFICATION SUCCESSFUL: Dynamic Panic Logic is functioning correctly.");
    process.exit(0);
} else {
    console.log("\n❌ VERIFICATION FAILED.");
    process.exit(1);
}
