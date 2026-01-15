# Dashboard Capability Summary (For Research Alignment)

This document is a concise, exportable translation of the dashboard capability review.
It is intended for collaborators who do not have access to the full codebase.
Where code references are included, they are paired with short excerpts or paraphrases
so the meaning is still clear in isolation.

Scope note:
- The Simulator (sandbox/comparison) uses the agent-based model in `src/model/simulation.ts`
  when "useNewModel" is enabled. A legacy "vector" engine exists in
  `src/model/legacy/engine.ts` and is still referenced by some UI components.
- The Thesis tab uses a separate simplified model (`src/components/ThesisDashboard.tsx`)
  with its own logic and non-seeded randomness.

---

## Mechanisms Modeled

For each mechanism, the status indicates whether it is configurable, fixed, or scenario-dependent.

- Emissions (minting): `minted = min(maxMintWeekly, maxMintWeekly * (0.6 + 0.4*tanh(demand/15000) - 0.2*saturation))`
  - Status: Configurable (via `maxMintWeekly`); formula is fixed.
  - Context: Emission formula uses demand and saturation in `src/model/simulation.ts`.
- Burns: `burned = burnPct * tokensSpent`, capped at 95% of supply.
  - Status: Configurable (`burnPct`); cap is fixed.
- Reward allocation: rewards proportional to capacity.
  - Status: Fixed; capacity varies by provider heterogeneity and tier.
  - Excerpt: `rewardPerCapacityUnit = minted / totalCapacity`.
- Reward lag: delayed rewards via `rewardHistory`.
  - Status: Configurable (`rewardLagWeeks`).
- Buy pressure: users buy tokens to pay for service.
  - Status: Fixed.
  - Excerpt: `buyPressure = demandServed * servicePrice / tokenPrice`.
- Sell pressure: providers sell to cover OPEX.
  - Status: Fixed; costs are configurable.
  - Excerpt: `min(tokenReward, opex/tokenPrice)` per provider.
- Price formation: log-return combining buy/sell pressure, scarcity, dilution, deflation, and macro drift.
  - Status: Partially configurable (price sensitivity coefficients in params).
  - Excerpt: `logReturn = mu + buyPressureEffect + sellPressureEffect + demandPressure + dilutionPressure + deflationPressure + sigma*noise`.
- Liquidity shock (AMM): investor unlock uses constant product pool.
  - Status: Configurable (`initialLiquidity`, `investorUnlockWeek`, `investorSellPct`).
- Treasury strategy:
  - New model: treasury accumulation only (no price dampening).
  - Legacy model: reserve dampens negative price moves; burn gives a small price bump.
  - Status: Configurable toggle (`revenueStrategy`); effects differ by engine.
- Provider churn: probabilistic churn based on consecutive loss weeks and profit threshold, capped by max churn.
  - Status: Configurable thresholds; fixed logic.
- Panic churn: price-shock driven churn with urban/rural and hardware-tier sensitivity.
  - Status: Scenario-dependent (triggered by unlock shock); fixed logic.
- Provider entry: join decisions based on expected profit and hardware ROI, with lead time.
  - Status: Configurable thresholds/lead time; fixed logic.
- Growth shock: one-time join spike via `growthCallEventWeek/Pct`.
  - Status: Scenario-dependent.
- Saturation shock: mass join at `T/3` when `scenario = 'saturation'`.
  - Status: Scenario-dependent; not exposed in current presets.
- Hardware tiers: Pro vs Basic; pro has higher efficiency and higher OPEX.
  - Status: Configurable (`proTierPct`, `proTierEfficiency`); cost multiplier fixed.
- Urban vs Rural provider types: 30% urban / 70% rural with different costs.
  - Status: Fixed.
- Service pricing: scarcity-based price with min/max bounds.
  - Status: Fixed (values set in runner, not UI).
- Coverage/density: coverage uses locationScale; geospatial density penalties are visual-only.
  - Status: Coverage metric computed; density penalties not fed back into rewards.

---

## Stress Dimensions Supported

- Macro regime: bearish / sideways / bullish (affects drift and volatility).
- Demand regime: consistent, growth, volatile, high-to-decay (stochastic demand series).
- Liquidity shock: investor unlock week, sell percent, and liquidity depth.
- Competitor yield (vampire attack churn).
- Provider economics stress: OPEX, churn threshold, hardware cost, pro tier share.
- Tokenomics stress: burn %, max mint/week, initial price.
- Growth shock: `growthCallEventWeek/Pct`.
- Scenario enum: `winter`, `utility`, `saturation` (single scenario active at a time).

Combination rules:
- Parameter stresses can be combined freely (e.g., bearish macro + high burn + vampire attack).
- Scenario enum is mutually exclusive (only one scenario-specific behavior active).

---

## Agent Representation

Agents in the new model:
- Providers: individual heterogeneous agents (capacity, cost, type, tier).
- Users: not explicit; demand is exogenous.
- Protocol: rule-based system (emissions, burn, price).

Homogeneity vs heterogeneity:
- Providers are heterogeneous (capacity/cost randomness; urban/rural; pro/basic).
- Users are homogeneous (demand series).

Endogenous vs exogenous:
- Endogenous: price, supply, service price, churn/join, profits, burn/mint flows.
- Exogenous: demand series, macro regime, investor unlock, competitor yield, tokenomic settings.

Stochastic elements:
- Demand noise, provider heterogeneity, churn decisions, price noise.
- Seeded RNG drives reproducibility in the simulation engines.

---

## Metrics Produced

Time-series outputs (mean/p10/p90 across Monte Carlo runs):
- price, supply, demand, demandServed, providers, capacity, servicePrice
- minted, burned, utilisation, profit, scarcity, incentive
- buyPressure, sellPressure, netFlow
- churnCount, joinCount
- solvencyScore, netDailyLoss, dailyMintUsd, dailyBurnUsd
- urbanCount, ruralCount, weightedCoverage, proCount
- treasuryBalance, vampireChurn

Formula / proxy notes (selected):
- utilisation = `demandServed / capacity * 100`
- incentive = `(delayedReward - opex) / opex`
- solvencyScore = `dailyBurnUsd / dailyMintUsd`
- netDailyLoss = `(burned/7 - minted/7) * price`
- weightedCoverage = sum(locationScale) across active providers

Derived summary metrics:
- maxDrawdown, priceVolatility, sharpeRatio, deathSpiralProbability
- tokenVelocity, inflationRate, netEmissions
- avgProviderProfit, providerProfitability, totalChurn, totalJoins, retentionRate
- avgUtilisation, demandSatisfactionRate, capacityUtilisationEfficiency
- totalNetworkRevenue, totalProviderRevenue, totalBurnedValue

UI-derived metrics (not core model):
- weeklyRetentionRate computed in the view layer
- paybackPeriod in UI uses a fixed $500 capex proxy
- incentiveRegime is a heuristic classification

Interpretation:
- Most outputs are absolute values (price, supply, counts).
- Ratios and percentages (utilisation, solvencyScore, retention) are comparative.

---

## Scenario Comparability

Yes. The comparison view runs the same stress scenario across multiple parameterized
protocol profiles:
- Shared stress inputs: macro, demand type, investor unlock, competitor yield, etc.
- Profile-specific inputs: supply, emissions, burn fraction, provider economics.

To compare ONO vs a hypothetical DePIN:
- Add/edit a profile in `src/data/protocols.ts`.
- Use comparison mode to run the same stress parameters across profiles.

---

## Assumptions & Limitations

Explicit or implied assumptions:
- Weekly timestep; no intra-week dynamics.
- Demand is exogenous; no endogenous demand-price feedback (except a utility scenario).
- Rewards proportional to capacity only; location/density not used for rewards.
- Providers sell only enough to cover costs (no speculative holding behavior).
- EmissionModel toggle (KPI vs fixed) is not applied in the new engine; it exists in legacy.
- RevenueStrategy impacts price only in legacy; new engine uses treasury accumulation only.
- Some model constants are hardcoded in the runner (base demand, demand volatility, service price bounds).
- Representative-agent scaling used at large provider counts (assumes linear scaling).
- Geo density model is a UI visualization, not a feedback loop.
- Thesis tab uses a simplified model with unseeded randomness (not reproducible).

---

## Reproducibility Status

Inputs required to reproduce:
- Full `SimulationParams` (including seed and nSims).
- Selected protocol profile (supply, emissions, burn fraction, etc.).
- Engine choice (new agent-based vs legacy vector).

Deterministic vs stochastic:
- Deterministic given the same params and seed.
- Stochastic behaviors are from seeded RNG (demand noise, churn, price noise).

Exports:
- JSON/CSV export includes parameters and time series for replay.

---

## Minimal Code Excerpts (for context only)

These are short excerpts or paraphrases to anchor the above without shipping full source:

- Emissions and burn (new model):
  - `emissionFactor = 0.6 + 0.4 * tanh(demand/15000) - 0.2 * saturation`
  - `minted = min(maxMintWeekly, maxMintWeekly * emissionFactor)`
  - `burned = burnPct * tokensSpent`

- Buy/sell pressure:
  - `buyPressure = demandServed * servicePrice / tokenPrice`
  - `sellPressure = sum(min(tokenReward, opex/tokenPrice))`

- Solvency ratio:
  - `solvencyScore = dailyBurnUsd / dailyMintUsd`

- Liquidity shock:
  - `unlockAmount = supply * investorSellPct`
  - Constant-product pool updates price on unlock week

---

## Where This Lives in the Codebase

These file references are provided for collaborators with access:
- Core agent model: `src/model/simulation.ts`
- Demand generation: `src/model/demand.ts`
- Type definitions: `src/model/types.ts`
- Derived metrics: `src/model/metrics.ts`
- Protocol profiles: `src/data/protocols.ts`
- Scenarios: `src/data/scenarios.ts`
- Legacy engine: `src/model/legacy/engine.ts`
- Geo model (visual only): `src/model/geoModels.ts`
- Sandbox charts & computed UI metrics: `src/components/Simulator/SandboxView.tsx`
- Thesis tab simplified model: `src/components/ThesisDashboard.tsx`

