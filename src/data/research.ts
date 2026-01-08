
export const RESEARCH_CONTENT = {
    methodology: {
        title: "1.2 Inferred Research Plan and Methodology",
        content: `Based on the specific data requirements for analyzing Onocoy's resilience, the underlying research plan governing this dashboard design is inferred to consist of four distinct phases. The dashboard must provide specific visualization modules for each phase.

**Phase I: Baseline Economic Modeling.** This phase establishes the "peace-time" operation of the network. It requires the dashboard to model the "DePIN Flywheel" where token incentives ($ONO) successfully drive hardware acquisition (CAPEX) and operational persistence (OPEX). The research necessitates a deep understanding of the Burn-and-Mint Equilibrium (BME) model employed by Onocoy, specifically tracking the conversion of fiat demand into Data Credits and the subsequent burning of ONO tokens.

**Phase II: Hardware and Agent Profiling.** The research aims to categorize the network's physical agents. Since Onocoy is hardware-agnostic, the dashboard must differentiate between "mercenary" miners using low-cost, L1-only equipment and "professional" operators deploying triple-frequency, survey-grade reference stations. This distinction is critical for modeling churn, as different agent classes have different break-even points and psychological commitments to the network.

**Phase III: The Stress Injection.** This is the core experimental phase. The dashboard must allow the simulation of exogenous and endogenous shocks. The research plan likely investigates the hypothesis that the "Location Scale" and "Quality Scale" mechanisms—designed to optimize density and signal integrity—may inadvertently accelerate miner capitulation during a token price crash by reducing rewards for honest nodes in competitive areas.

**Phase IV: Resilience and Recovery Analysis.** The final phase assesses the network's elasticity. The dashboard must quantify the "Recovery Hysteresis"—measuring whether a network that loses 50% of its nodes can recover them when prices rebound, or if the loss of trust results in permanent infrastructure degradation.`
    },
    mathModels: {
        title: "8. Mathematical Models & Simulation Logic",
        intro: "This section provides the rigorous mathematical definitions required for the dashboard's backend code.",
        models: [
            {
                id: "churn",
                name: "8.1 The Probability of Churn (P_churn)",
                description: "We model the probability of a miner leaving the network using a logistic function based on profitability and streak status.",
                formula: "P_{churn}(t) = \\frac{1}{1 + e^{k(ROI(t) - T_{churn})}} \\times (1 - S_{streak})",
                variables: [
                    "ROI(t): Rolling 30-day Return on Investment",
                    "T_churn: Psychological threshold for quitting (e.g., 0% ROI)",
                    "k: Sensitivity factor (how reactive miners are to price)",
                    "S_streak: Streak Appreciation factor (normalized 0-1)"
                ]
            },
            {
                id: "bme",
                name: "8.2 The 'Burn-to-Emission' Ratio (R_BE)",
                description: "This is the primary health metric for the BME model. If > 1, the network is deflationary (Healthy). If < 1, it is inflationary (Subsidy Phase).",
                formula: "R_{BE} = \\frac{\\sum_{t=0}^{n} (Usage_{GB} \\times Price_{GB})}{\\sum_{t=0}^{n} (Emissions_{ONO} \\times Price_{ONO})}"
            },
            {
                id: "spoofing",
                name: "8.3 The 'Spoofing Impact' Function",
                description: "Modeling the degradation of the network utility due to adversarial behavior.",
                formula: "U_{net} = U_{ideal} \\times (1 - \\alpha \\cdot I_{spoof})",
                variables: [
                    "U_net: Realized network utility",
                    "I_spoof: Intensity of spoofing attacks (0-1)",
                    "alpha: Resilience factor of the consensus algorithm"
                ]
            }
        ]
    }
};
