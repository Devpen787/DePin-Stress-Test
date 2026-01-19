# Benchmark View Plan (Onocoy Competitive Benchmark)

Purpose: define a dedicated Benchmark tab that provides Onocoy-focused, decision-support comparisons against Geodnet and a broader peer set, with clear assumptions and reproducibility.

---

## 1) Goals
- Deliver actionable, *conditional* insights for Onocoy (no over-claiming).
- Provide a direct head-to-head view: Onocoy vs Geodnet under the same scenario.
- Provide a broader peer benchmarking view: Onocoy vs location-based DePIN cohort.
- Make assumptions, calibration, and data freshness explicit and visible.
- Keep Comparison tab as a general-purpose tool; Benchmark is curated and Onocoy-centric.

## 2) Non-Goals
- Not a real-time trading dashboard or compliance-grade reporting.
- Not a substitute for internal financial or operational forecasting.
- Not a marketing page; this is a technical decision-support interface.

---

## 3) Primary Users (Personas)
1. **Onocoy Operator/PM**: wants “what to watch” and “what to change” signals.
2. **Strategy/BD**: wants comparative strength vs peers in shared scenarios.
3. **Research/Analyst**: wants defensible assumptions, formulas, and confidence bounds.
4. **Executive**: wants a single summary of where Onocoy leads or lags.

---

## 4) Key Questions the Benchmark View Must Answer
- How does Onocoy perform vs Geodnet under the same stress scenario?
- Where does Onocoy lead/lag in solvency, payback, retention, utilization, coverage efficiency?
- Which parameters most influence Onocoy’s edge (burn %, emissions, demand, OPEX)?
- What is “likely” vs “uncertain” given Monte Carlo variance?
- How sensitive are results to different scenario regimes?

---

## 5) Scope of Data and Assumptions

### 5.1 Simulation Inputs
- Uses protocol profiles from `src/data/protocols.ts`.
- Scenario parameters aligned with `src/data/scenarios.ts`.
- Standardized definitions via Metric Registry or Metrics Pipeline.

### 5.2 Live Data Anchors (Optional, Where Available)
- Price data via `src/services/coingecko.ts`.
- On-chain metrics via `src/services/dune.ts` (Onocoy endpoints TBD).

### 5.3 Calibration Status
- Explicit badge for “Calibrated vs Assumed.”
- Each protocol displays last updated and source references.

---

## 6) Peer Sets

### 6.1 Direct Competitor
- **Onocoy vs Geodnet** (primary head-to-head).

### 6.2 GNSS/Location-Based Cohort (Broader Peer Set)
- Onocoy
- Geodnet
- Hivemapper
- Helium (IoT/Wireless, location-centric)
- Any additional GNSS or mapping networks as profiles become available

### 6.2.1 Peer Inclusion Criteria (Research-Aligned)
- Tokenized incentives with on-chain burn mechanics.
- Physical coverage network with location-sensitive utility.
- Open or semi-open hardware participation (to reflect operator churn dynamics).
- Comparable demand model (usage-based revenue or data credit burn).

### 6.3 Peer Group Governance
- Peer sets are curated and versioned in `src/data/peerGroups.ts`.
- Each group has an explicit rationale and inclusion rule.

---

## 7) Metrics to Compare (Benchmark Core Set)

### 7.1 Core Health Metrics
- Sustainability Ratio (Burn-to-Emission)
- Weekly Retention Rate (standardize definition and keep consistent across views)
- Payback Period (months)
- Network Utilization (%)
- Coverage Score (non-normalized sum)

### 7.2 Normalized Metrics
- Coverage per Provider (coverage efficiency)
- Revenue per Provider (if revenue modeled)
- Cost per Coverage Unit (if OPEX + coverage are available)
- Solvency vs Emissions (normalized to scenario baseline)

### 7.3 Risk Metrics
- Max Drawdown (price)
- Death Spiral Probability
- Churn Rate (total churn / total joins)

### 7.4 “Edge” Summary Metrics
- Edge Score = weighted composite (transparent weights)
- Rank position within cohort
- Confidence badge (based on Monte Carlo CV or CI width)

---

## 8) Scenario Strategy
- Benchmark results are **scenario-locked**: all peers use identical stress inputs.
- Default scenarios:
  - Baseline
  - Crypto Winter
  - Liquidity Shock
  - Demand Spike
- Users can select scenario, but comparison must remain consistent across peers.

### 8.1 GNSS-Specific Scenario Additions (Research-Driven)
- **S1: Subsidy Cliff**: accelerate emission decay to test deflationary crossover timing.
- **S2: Crypto Winter**: -90% price shock to test retention anchor.
- **S3: Density Trap**: inject dense nodes in a hex to observe Location Scale dilution.
- **S4: Adversarial Flood**: increase spoofing prevalence to test validation overhead.

---

## 9) UX / IA (Information Architecture)

### 9.1 Navigation
- New top-level tab: **Benchmark**.
- Entry points:
  - Header nav
  - Explorer quick action: “Benchmark Onocoy vs Geodnet”

### 9.2 Page Layout (High Level)
1. **Assumptions Banner**
   - Scenario selector, data freshness, calibration status, disclaimer.
2. **Head-to-Head**
   - Onocoy vs Geodnet with deltas and “good direction.”
3. **Peer Set Ranking**
   - Heatmap table + rank chips + legend.
4. **Edge Summary**
   - “Onocoy leads in X, lags in Y” with confidence tags.
5. **Sensitivity Panel**
   - Top 3 parameters affecting Onocoy outcomes.
6. **Notes & Sources**
   - Citations pulled from `src/data/sources.ts`.

### 9.3 Interaction Details
- Hover tooltips: formula + unit + source.
- Delta labels: positive/negative with “good direction” coloring.
- Baseline selection: choose “Onocoy baseline” or “Peer median.”
- Export: CSV/JSON of benchmark table + assumptions.

---

## 10) Data Flow (Architecture)

### 10.1 Core Pipeline
Simulation output (`useSimulationRunner` / Legacy Engine) -> Metrics Pipeline -> Benchmark ViewModel -> UI

### 10.2 Proposed Files
- `src/components/Benchmark/BenchmarkView.tsx` (new)
- `src/viewmodels/BenchmarkViewModel.ts` (new)
- `src/data/peerGroups.ts` (new)
- `src/metrics/BenchmarkMetrics.ts` (new or extend MetricsPipeline)
- `src/components/ui/BenchmarkLegend.tsx` (new)

### 10.3 Integration Points
- Navigation: `src/index.tsx` or top-level router.
- Protocol profiles: `src/data/protocols.ts`.
- Live data: `src/services/coingecko.ts`.

---

## 11) Validation and Trust
- Every metric shows definition and source in tooltips.
- CI or unit tests validate core metrics (solvency, payback, retention).
- Benchmark outputs include metadata: scenario, params, seed, model version.
- Confidence badges default to 95% CI for simulated projections.

---

## 11.1 Stakeholder Readiness (Internal and External)

### Internal Use (Operators, PMs, Strategy)
- Full metric set + sensitivity panel + scenario toggles.
- Assumption banner always visible.
- Export includes raw inputs and derived outputs.

### External Use (Clients, Partners, VCs)
- Curated summary view with reduced metric set and explicit caveats.
- Clear labeling of simulated vs real data (no ambiguity).
- Optional redaction of proprietary parameters (OPEX, hardware cost).
- Snapshot exports with watermark: model version + scenario + date.

### Presentation Modes
- **Executive Mode:** 1-page "Edge Summary" + 3 headline metrics.
- **Analyst Mode:** Full metrics + confidence tags + scenario controls.

---

## 12) Rollout Plan (Phased)

### Phase 1: Direct Benchmark MVP
- Onocoy vs Geodnet head-to-head.
- Scenario-locked + assumptions banner.
- Core metrics only.

### Phase 2: Peer Set Benchmark
- Peer group table + rank + legend.
- Edge summary card.

### Phase 3: Calibration + Live Anchors
- Data freshness panel using CoinGecko.
- On-chain metrics when Dune endpoints exist.

### Phase 4: Advanced Insights
- Sensitivity panel.
- Confidence tagging on metrics (95% CI).
- Sensitivity methods: add Sobol' indices in backend for defensible parameter ranking.

---

## 13) Acceptance Criteria
- Benchmark tab visible and distinct from Comparison tab.
- Head-to-head shows consistent deltas for same scenario.
- Peer set table ranks Onocoy with clear legend and baseline.
- Assumptions banner clearly states what is simulated vs real.
- Export includes assumptions and seed.

---

## 14) Open Questions to Resolve
- Geodnet token ID and profile parameters (supply, emissions, OPEX, hardware cost).
- Retention definition to standardize (weekly vs final/peak).
- Official peer list for GNSS cohort (which protocols qualify).
- Should “edge score” weights be fixed or user-configurable?

---

## 15) Research Questions (To Validate Before Build)
Use external research tools to answer these, then feed results back into this plan.

### 15.1 Protocol Calibration (Onocoy + Geodnet)
1. What are Geodnet’s current circulating/total supply, emissions schedule, and burn mechanics?
2. What is Geodnet’s real-world hardware cost and average weekly OPEX per node?
3. What is Onocoy’s latest verified active node count and coverage growth rate?
4. What are Onocoy’s actual burn and revenue metrics (weekly/monthly)?
5. Which assumptions in the current Onocoy profile conflict with their public docs?

### 15.1.1 Research Answers (Provided)
- Onocoy uses Data Credits (DC) pegged to USD; DC burn triggers ONO buyback + burn.
- ONO max supply is 810M; emissions decay at 16% annually (smooth vs halving).
- Sustainability risk framed as "Subsidy Trap" if deflationary crossover is not reached in time.
- Onocoy sustainable network size suggested at 5,000-10,000 stations for value density.
- Geodnet allows dual-mining and has a structured hardware standard (triple-band focus).

### 15.2 Comparable Peer Set (GNSS / Location-Based)
6. Which GNSS or RTK networks are closest operational peers to Onocoy?
7. Which non-GNSS DePINs are fair comparators (mapping, wireless), and why?
8. What peer inclusion criteria should be used (tokenized incentives, open hardware, coverage type)?

### 15.2.1 Research Answers (Provided)
- GNSS/location cohort: Onocoy, Geodnet, Hivemapper, Helium.
- Inclusion criteria: tokenized incentives, open or semi-open hardware, and location-based utility.

### 15.3 Metric Definitions and Trust
9. What retention definition best reflects operator behavior in GNSS networks?
10. Which metrics should be normalized (per node, per coverage unit, per $ of rewards)?
11. What confidence bounds are acceptable to show in external views (VC/client)?

### 15.3.1 Research Answers (Provided)
- Retention should reflect operator behavior via churn probability (logistic ROI threshold + streak effects).
- Normalized metrics prioritized: coverage per provider, revenue per provider, cost per coverage unit.
- 95% confidence intervals should be displayed to avoid false precision.

### 15.4 Scenario Design
12. What scenarios mirror real GNSS market risks (regulatory, enterprise contract loss, price crash)?
13. What historical shocks should be replayed for Onocoy or peers?

### 15.4.1 Research Answers (Provided)
- GNSS stress vectors: Subsidy Cliff, Crypto Winter (-90% price), Density Trap, Adversarial Flood.

### 15.5 Data Sources and Freshness
14. Which live data sources are credible (CoinGecko, Dune, protocol dashboards)?
15. How frequently should calibration be updated and how will stale data be flagged?

### 15.5.1 Research Answers (Provided)
- Price data via CoinGecko; on-chain metrics from Solana and Dune (when available).
- Real-time price, periodic on-chain pulls; stale data flagged in assumptions banner.

---

## 16) Competitive Landscape Anchors (Provided Intelligence)
- **Onocoy**: open hardware GNSS RTK network; DC burn model; Swiss association governance.
- **Geodnet**: structured hardware standard; triple-band focus; aggressive revenue burn (80%).
- **Relative scale**: Geodnet materially larger in revenue and stations; Onocoy faster relative growth.
- **Strategic wedge**: Onocoy's lower entry cost and open hardware can drive coverage in emerging markets.

## 17) Research-Driven Benchmark Tables (Inputs to UI)
- **Supply-Side**: active nodes, geographic reach, hardware entry cost, receiver standards, growth velocity.
- **Demand-Side**: annualized revenue, burn rate, partnerships, pricing model.
- **Tokenomics**: supply cap, emission schedule, burn policy, chain ecosystem.

---

## 17.1 Benchmark Table Schemas (Explicit Data Models)

### 17.1.1 SupplySideBenchmarkSchema
Fields (per protocol, per snapshot):
- `protocolId` (string) – matches `src/data/protocols.ts` id
- `snapshotDate` (YYYY-MM-DD)
- `activeNodes` (number, unit: nodes) – source: live or simulated
- `geoReachCountries` (number, unit: countries)
- `hardwareEntryCostMin` (number, unit: USD)
- `hardwareEntryCostMax` (number, unit: USD)
- `receiverStandard` (string) – e.g., "Agnostic", "Triple-Band Standard"
- `growthYoY` (number, unit: %) – if live; else simulated growth rate
- `dataSource` (enum: live|simulated|mixed)
- `sourceRefs` (array of citations)

Example:
```json
{
  "protocolId": "ono_v3_calibrated",
  "snapshotDate": "2026-01-15",
  "activeNodes": 7550,
  "geoReachCountries": 168,
  "hardwareEntryCostMin": 200,
  "hardwareEntryCostMax": 800,
  "receiverStandard": "Agnostic",
  "growthYoY": 100,
  "dataSource": "mixed",
  "sourceRefs": ["Onocoy 2025 Year in Review", "Onocoy Docs"]
}
```

### 17.1.2 DemandSideBenchmarkSchema
Fields (per protocol, per snapshot):
- `protocolId` (string)
- `snapshotDate` (YYYY-MM-DD)
- `annualizedRevenueUsd` (number, unit: USD)
- `burnRateTokensPeriod` (number, unit: tokens / period)
- `burnRatePeriod` (enum: daily|weekly|monthly|annual)
- `pricingModel` (string) – e.g., "DC burn", "subscription"
- `keyPartnerships` (array of strings)
- `dataSource` (enum: live|simulated|mixed)
- `sourceRefs` (array of citations)

Example:
```json
{
  "protocolId": "geodnet_v1",
  "snapshotDate": "2026-01-15",
  "annualizedRevenueUsd": 7300000,
  "burnRateTokensPeriod": 900000,
  "burnRatePeriod": "weekly",
  "pricingModel": "enterprise contracts",
  "keyPartnerships": ["Quectel", "DroneDeploy"],
  "dataSource": "live",
  "sourceRefs": ["Geodnet Docs", "Depinport Report"]
}
```

### 17.1.3 TokenomicsBenchmarkSchema
Fields (per protocol, per snapshot):
- `protocolId` (string)
- `snapshotDate` (YYYY-MM-DD)
- `maxSupply` (number, unit: tokens)
- `emissionSchedule` (string) – e.g., "16% annual decay", "annual halving"
- `burnPolicy` (string) – e.g., "80% revenue buyback"
- `chainEcosystem` (string) – e.g., "Solana"
- `dataSource` (enum: live|simulated|mixed)
- `sourceRefs` (array of citations)

Example:
```json
{
  "protocolId": "ono_v3_calibrated",
  "snapshotDate": "2026-01-15",
  "maxSupply": 810000000,
  "emissionSchedule": "16% annual decay",
  "burnPolicy": "DC burn -> ONO buyback",
  "chainEcosystem": "Solana",
  "dataSource": "live",
  "sourceRefs": ["Onocoy Tokenomics"]
}
```

### 17.1.4 DerivedFields (Computed)
- `coveragePerProvider` = `coverageScore / activeNodes`
- `revenuePerProvider` = `annualizedRevenueUsd / activeNodes`
- `costPerCoverageUnit` = `opexWeekly / coverageScore` (if both available)
- `burnToEmissionRatio` = `burnValueUsd / emissionValueUsd`

### 17.1.5 Provenance and Trust Rules
- Every row must include `dataSource` and at least one `sourceRef`.
- If `dataSource = simulated`, show assumptions banner with scenario + seed.
- If `dataSource = live`, show freshness timestamp and last refresh interval.

## 18) Research Streams (Ongoing Validation)
- **On-chain forensic layer**: burn addresses, reward distributions, token velocity.
- **Physical layer**: reseller inventory and secondary market pricing.
- **Social layer**: Discord sentiment and governance participation rates.

---

## 19) Why This Helps Onocoy
- Delivers *decision support* without over-claiming.
- Makes Onocoy’s competitive position explicit and traceable.
- Encourages evidence-backed action: scenario, assumption, and delta clarity.

---

## 20) Reference Catalog (Provided Sources for Citation)
Use these as the canonical citations for benchmark inputs and narrative claims.

- GEODNET ($GEOD) In-Depth Research Report: The Real Yield King of the DePIN Sector? (Depinport, Medium). Accessed 2026-01-16. https://medium.com/@done_71651/geodnet-geod-in-depth-research-report-the-real-yield-king-of-the-depin-sector-35d3e4a6733f
- Geodnet. Accessed 2026-01-16. https://geodnet.com/
- Onocoy 2025 Year in Review: From TGE to Global GNSS Leadership. Accessed 2026-01-16. https://onocoy.com/blog/onocoy-2025-year-in-review-from-tge-to-global-gnss-leadership
- Onocoy Documentation: What is Onocoy? Accessed 2026-01-16. https://docs.onocoy.com/documentation
- GNSS RTK Positioning - An Overview (Onocoy). Accessed 2026-01-16. https://onocoy.com/blog/gnss-rtk-positioning-an-overview
- How Onocoy Is Reshaping the GNSS Industry With Its Blockchain-Powered, Open Ecosystem. Accessed 2026-01-16. https://onocoy.com/blog/reshaping-the-gnss-industry
- World's Largest Blockchain-Powered Navigation Network for Robotics and Token Rewards - GEODNET. Accessed 2026-01-16. https://geodnet.com/network
- DIY Onocoy NTRIP Server and Reference Station Setup (Instructables). Accessed 2026-01-16. https://www.instructables.com/DIY-Onocoy-Ntrip-Server-and-Reference-Station-Setu/
- Geodnet Hyfix Crypto Miner Triple-Band Pre-owned - eBay. Accessed 2026-01-16. https://www.ebay.com/itm/226854052326
- Your Guide to Understanding the ONO Token (Onocoy). Accessed 2026-01-16. https://onocoy.com/blog/your-guide-to-understanding-the-ono-token
- Tokenomics (Onocoy Docs). Accessed 2026-01-16. https://docs.onocoy.com/documentation/tokenomics
- Swapping BONO to ONO (Onocoy Docs). Accessed 2026-01-16. https://docs.onocoy.com/documentation/swapping-bono-to-ono
- MobileCM Triple-Band GNSS Base-Station (GEODNET Compatible) - HYFIX.AI. Accessed 2026-01-16. https://hyfix.ai/products/mobilecm-triple-band-gnss-base-station
- SuperHex (GEODNET Docs). Accessed 2026-01-16. https://docs.geodnet.com/geod-console-advanced/superhex
- Latest GEODNET (GEOD) Price Analysis (CoinMarketCap). Accessed 2026-01-16. https://coinmarketcap.com/cmc-ai/geodnet/price-analysis/
- GEODNET Improvement Proposal 7 (Medium). Accessed 2026-01-16. https://medium.com/geodnet/geodnet-improvement-proposal-7-c2313f643b9b
- GEODNET Migration Bonus Program from Polygon to Solana. Accessed 2026-01-16. https://www.geodnet.com/detail/GEOD-Migration-PtoS-488861757471261105
- Onocoy (home). Accessed 2026-01-16. https://onocoy.com/
- Deep Dive: Solana DePIN (Syndica). Accessed 2026-01-16. https://blog.syndica.io/content/files/2025/02/Deep-Dive---Solana-DePIN-January-2025-1.pdf
- Retention Rate Definition (ProductPlan). Accessed 2026-01-16. https://www.productplan.com/glossary/retention-rate/
- Retention Rate Definition (Airfocus). Accessed 2026-01-16. https://airfocus.com/glossary/what-is-retention-rate/
- Helium Financials (Blockworks). Accessed 2026-01-16. https://blockworks.com/analytics/helium/helium-financials
- Solana Burn Address Explained (Backpack Learn). Accessed 2026-01-16. https://learn.backpack.exchange/articles/solana-burn-address-explained
- Onocoy Dune Dashboard. Accessed 2026-01-16. https://dune.com/onocoy/dashboard
- Onocoy Miners (GNSS Store). Accessed 2026-01-16. https://gnss.store/collections/onocoy-miners
- NTRIP-X Base Station Bundle (EUGEO). Accessed 2026-01-16. https://eugeo.io/product/ntrip-x-basestation-bundle/
- GEODNET Weather Station (FreshMiners). Accessed 2026-01-16. https://freshminers.com/shop/hardware/geodnet-weather-station/
- GEODNET: Why We're Bullish (VanEck). Accessed 2026-01-16. https://www.vaneck.com/li/en/blog/digital-assets/matthew-sigel-geodnet-why-were-bullish/
