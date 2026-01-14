// ChartInterpretation interface defined locally below 
// It was defined locally in index.tsx: interface ChartInterpretation ...
// checking index.tsx line 241... yes local.
// I should verify where to put the interface.
// Ideally types go to types.ts?
// For now, I'll export the interface from here or rely on types.ts if I move it there.
// Since I haven't moved the interface to types.ts yet (it wasn't in the plan explicitly but implied by "Extract Data"), 
// I will define the interface here for now to be safe, or check types.ts again.
// types.ts (Step 61) does NOT have ChartInterpretation.
// So I will include the interface here.

export interface ChartInterpretation {
    subtitle: string;
    question: string;
    formula: string;
    robust: string;
    fragile: string;
    failureMode: string;
}

export const CHART_INTERPRETATIONS: Record<string, ChartInterpretation> = {
    "Capacity vs Demand": {
        subtitle: "Analysis of market clearing and service availability.",
        question: "Does the network maintain sufficient throughput to satisfy exogenous demand without extreme over-provisioning?",
        formula: "min(Demand_t, Providers_t * BaseCapacity)",
        robust: "Capacity remains slightly above demand; minimal unserved requests.",
        fragile: "Sustained service gaps or excessive idle hardware waste.",
        failureMode: "Supply-side bottleneck: The network cannot scale to meet utility needs."
    },
    "Burn vs Emissions": {
        subtitle: "Evaluation of tokenomic sustainability and equilibrium.",
        question: "Is the protocol achieving a self-sustaining circulation equilibrium through real-world utility?",
        formula: "Sustainability = Burn_Rate - Mint_Rate",
        robust: "Burn rate periodically matches or exceeds emissions during growth.",
        fragile: "Chronic decoupling where emissions dwarf burn regardless of utility.",
        failureMode: "Structural Over-Subsidization: Network relies on infinite inflation to survive."
    },
    "Network Utilization (%)": {
        subtitle: "Measurement of capital efficiency and infrastructure load.",
        question: "What is the efficiency ratio of the hardware deployed within the network?",
        formula: "(Demand_Served / Total_Capacity) * 100",
        robust: "Stable utilization (40-80%); maintained operational headroom.",
        fragile: "Values below 10% (irrelevance) or 100% saturation (bottleneck).",
        failureMode: "Infrastructure Irrelevance: Physical assets are deployed but not utilized."
    },
    "Supply Trajectory": {
        subtitle: "Monitoring of issuance constraints and token mass predictability.",
        question: "Does the token issuance remain bounded and predictable over the horizon?",
        formula: "Supply_{t+1} = Supply_t + Minted_t - Burned_t",
        robust: "Controlled expansion or demand-responsive contraction.",
        fragile: "Exponential issuance growth leading to irreversible dilution.",
        failureMode: "Hyper-inflation: Token mass expansion outpaces value capture."
    },
    "Service Pricing Proxy": {
        subtitle: "Proxy for end-user cost stability and market competitiveness.",
        question: "Does the unit cost of service remain affordable and stable for end-users?",
        formula: "Price_{s,t+1} = Price_{s,t} * (1 + 0.6 * Scarcity)",
        robust: "Mean-reverting pricing; predictable cost basis for service buyers.",
        fragile: "Runaway cost spikes or hyper-volatility decoupling from market norms.",
        failureMode: "Pricing Collapse/Spike: The network becomes too expensive to use."
    },
    "Liquidity Shock Impact": {
        subtitle: "Impact of massive token unlock on price stability.",
        question: "Can the market absorb a supply shock without triggering a death spiral?",
        formula: "Price_{t} = k / (PoolTokens + UnlockAmount)",
        robust: "Price recovers within 4-8 weeks; Churn remains manageable.",
        fragile: "Price crashes > 60% and fails to recover; triggers mass exodus.",
        failureMode: "Liquidity Death Spiral: Price crash -> Miner Churn -> Service Fail -> Price Crash."
    },
    "Miner Payback Period (Months)": {
        subtitle: "Time required to recover hardware investment at current earnings.",
        question: "Is the payback period short enough to attract and retain rational miners?",
        formula: "Payback = HardwareCost / (DailyEarnings * 30)",
        robust: "Payback < 12 months; high incentive for new entrants.",
        fragile: "Payback > 24 months; existing miners barely breaking even.",
        failureMode: "Capital Flight: Investment recovery becomes mathematically impossible."
    },
    "The Solvency Ratio": {
        subtitle: "Ratio of Value Burned to Value Emitted.",
        question: "Is the network generating enough real value to offset its inflation?",
        formula: "Ratio = (Burned_USD / Minted_USD)",
        robust: "Ratio > 1.0 (Deflationary); Network is profitable.",
        fragile: "Ratio < 0.5 (Highly Inflationary); Value dilution.",
        failureMode: "Ponzi Dynamics: Structural reliance on new capital to pay old yield."
    },
    "The Capitulation Stack": {
        subtitle: "Composition of network supply by provider type.",
        question: "Are we losing the 'Mercenaries' (Urban) or the 'Believers' (Rural)?",
        formula: "Stack = Urban_Count + Rural_Count",
        robust: "Balanced growth; Rural base maintains coverage stability.",
        fragile: "Urban collapse leaving gaps; Rural churn indicates deep despair.",
        failureMode: "Network Hollow-Out: Loss of critical density in high-value areas."
    },
    "Effective Service Capacity": {
        subtitle: "Serviceable Demand vs Total Available Capacity.",
        question: "How much of the deployed infrastructure is actually useful?",
        formula: "Utilization = Demand_Served / Total_Capacity",
        robust: "High utilization of deployed assets; efficient capital allocation.",
        fragile: "Massive over-provisioning (Ghost Network).",
        failureMode: "Capital Inefficiency: Vast resources deployed for zero utility."
    },
    "Provider Count": {
        subtitle: "Total active service providers participating in the network.",
        question: "Is the network maintaining a healthy base of physical infrastructure providers?",
        formula: "Σ Active_Nodes_t",
        robust: "Stable or growing node count aligned with token emissions.",
        fragile: "Sharp decline (>15%) indicating capitulation or hardware obsolescence.",
        failureMode: "miner_capitulation: Network contraction below service viability threshold."
    },
    "Treasury Health & Vampire Churn": {
        subtitle: "Resilience of reserves against competitor yield attacks.",
        question: "Can the protocol survive a vampire attack using its treasury?",
        formula: "Net_Treasury = Revenue - BuyBacks - Churn_Cost",
        robust: "Treasury maintains > 6mo runway; Churn < 10%.",
        fragile: "Treasury depleted; Churn accelerates > 20%.",
        failureMode: "Liquidity Crisis: No reserves left to defend peg or retain miners."
    }
};
