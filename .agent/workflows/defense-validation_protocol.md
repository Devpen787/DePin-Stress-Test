---
description: A rigorous 10-point protocol for validating simulation integrity using statistical methods and cross-language parity checks.
---

# Defense Validation Protocol

This skill defines the rigorous standards required to defend the DePIN Stress Test Simulator under academic scrutiny. It covers the complete 10-point validation stack.

## 1. Metric Registry Authoring
**Goal**: Ensure every number in the dashboard serves a single, auditable definition.
- **Source of Truth**: `src/data/MetricRegistry.ts`.
- **Required Schema**: id, label, formula, sourceId, tier, thresholds.
- **Rule**: UI components must consumethis registry, ensuring "Code Pointers" always exist.

## 2. Formula Test Design
**Goal**: Prevent "fat finger" regressions.
- **Pattern**: Unit tests in `src/model/simulation.test.ts`.
- **Invariants**:
  - Bound checks (e.g., `Retention <= 1.0`).
  - Monotonicity (e.g., `Burn++ -> Solvency++`).

## 3. TS↔Python Parity Harness (Future)
**Goal**: Cross-language verification.
- **Harness**: `src/audit/python/verify_all_formulas.py`.
- **Method**: Seeded JSON export from TS -> Python loader -> Diff Check.
- **Tolerance**: Fail if `abs(delta) > 1e-9`.

## 4. Scenario Audit Design
**Goal**: Qualitative expected outcomes.
- **Baseline**: "Boring" run.
- **Crypto Winter**: Assert `Urban_Churn > Rural_Churn`.
- **Liquidity Shock**: Assert `Price_Drop > Sell_Pressure` (Slippage).
- **Vampire Attack**: Assert `Network_Size` shrinks when `Competitor_Yield > Native_Yield`.

## 5. Monte Carlo Diagnostics
**Goal**: Signal stability.
- **Convergence**: Plot `Mean` vs `nSims`. Assert stabilization.
- **Variance**: Track `StandardDeviation` to ensure we aren't just averaging noise.

## 6. Statistical Significance Layer
**Goal**: Mathematical confidence.
- **Effect Size**: Report `Cohen's d` for scenario impacts.
- **Hypothesis Test**: Use Bootstrap Confidence Intervals (95%) to determine if a scenario change is "Real" or "RNG".

## 7. Benchmark Calibration
**Goal**: Reality check against history.
- **Normalization**: When overlaying Helium data, normalize `t=0` to "Network Launch" or "Token TGE".
- **Error Bands**: Display `Actual` vs `Simulated` delta on time-series charts.

## 8. Reproducibility & Audit Reporting
**Goal**: Every screenshot is traceable.
- **Metadata**: Embed `Seed`, `CommitHash`, and `ParamHash` in all JSON/CSV exports.
- **Model Card**: Maintain `docs/MODEL_CARD.md` listing known limitations and assumptions.

## 9. Plot Validation
**Goal**: Visual correctness.
- **Label Audit**: Axis labels must match Registry Units (e.g., "$" vs "Tokens").
- **Derived Labeling**: Titles must indicate if a metric is "Simulated" or "Historical".

## 10. Documentation Discipline
**Goal**: Sync between Code and Paper.
- **ADR Linkage**: `docs/ADR-001` must be updated if `MetricRegistry.ts` changes.
- **Source Mapping**: `src/data/sources.ts` is the bibliography for the code.
