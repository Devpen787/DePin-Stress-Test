# Validation Rigor Plan for DePIN Stress Test Dashboard

This document consolidates the full discussion on math, statistics, calculations, plotting, formulas, and validation so the dashboard can be defended under academic and data-scientific scrutiny.

## 1. Goal

Build an auditable, reproducible, and statistically defensible validation stack for every number produced by the dashboard.

## 2. Current State (What Exists)

- Python formula checks:
  - `src/audit/python/verify_solvency.py`
  - `src/audit/python/verify_thesis_logic.py`
  - `src/audit/python/verify_all_formulas.py`
- These checks are narrow (hardcoded inputs and isolated formulas). They do not provide end-to-end verification, statistical significance, or TS-to-Python parity.

## 3. Gaps to Close

- No formal registry tying every displayed metric to a formula, unit, and source.
- No deterministic parity checks between TypeScript simulation and Python validation.
- No scenario-based audits with expected outcomes.
- No Monte Carlo convergence or power analysis.
- No statistical significance reporting (confidence intervals, effect sizes, hypothesis tests).
- No versioned audit trail or reproducibility metadata in outputs.
- No formal plotting validation (labels/units/axes).

## 4. Validation Stack (End-to-End)

### 4.1 Metric Registry (Single Source of Truth)

- Each metric must define:
  - Name, formula, units, source citation
  - Implementation pointer (TS file/line)
  - Whether it is direct or derived
- Build gating: missing registry entry fails CI.

### 4.2 Deterministic Formula Tests

- Unit tests per formula with fixed inputs and expected outputs.
- Invariant tests:
  - Non-negativity and bounded ratios
  - Monotonicity under constrained changes (e.g., burn up -> solvency up)
- Dimensional checks to prevent unit mismatches.

### 4.3 TS-to-Python Parity Harness

- A Python runner that mirrors the TS simulation core for a minimal subset.
- Seeded RNG for deterministic comparison.
- Tolerance bands by metric (price, supply, providers, solvency, retention, coverage).

### 4.4 Scenario Audits (Qualitative Expectations)

Standard scenarios with explicit expected directions:
- Baseline
- Crypto Winter
- Liquidity Shock
- Vampire Attack

Each scenario must have pass/fail assertions for key metrics.

### 4.5 Monte Carlo Diagnostics

- Convergence tests: how mean/p10/p90 stabilize as `nSims` increases.
- Variance tracking vs `nSims`.
- Seed sweep summary to detect instability or outliers.

### 4.6 Statistical Significance Layer

For key deltas (scenario vs baseline):
- Confidence intervals (bootstrap or parametric)
- Hypothesis tests (non-parametric if distributions are unknown)
- Effect size reporting (not just p-values)
- Power analysis (minimum detectable effect)
- Multiple-comparison correction if many metrics are tested

### 4.7 Benchmarking and Calibration

- Benchmarks (e.g., Helium historical overlay) with explicit normalization rules.
- Calibration log: which parameters are fitted vs assumed.
- Error bands vs real data where applicable.

### 4.8 Reproducibility and Audit Trail

- Metadata in every export:
  - seed, params, model version, commit hash
- Exportable audit report (JSON/CSV):
  - raw outputs + derived metrics + metadata
- Versioned model card:
  - assumptions, limits, known failure modes

### 4.9 Plot Integrity Validation

- Visual test harness with known data snapshots:
  - axis labels, units, legends, titles
  - direct vs derived metric labeling
- Source tags displayed for each chart.

## 5. Roadmap (Suggested Phases)

### Phase 1: Registry + Formula Tests
- Implement metric registry.
- Add deterministic unit tests and invariants.

### Phase 2: Parity and Scenario Audits
- Build TS-to-Python parity harness.
- Create scenario tests with expected outcomes.

### Phase 3: Statistical Backing
- Add CI/bootstraps and hypothesis testing.
- Add effect sizes and power analysis summaries.

### Phase 4: Benchmarking + Governance
- Add calibration log and benchmark overlays.
- Publish model card and audit trail.

## 6. Acceptance Criteria (Defense-Ready)

- Every dashboard metric has a registry entry with formula, unit, and source.
- Core formulas pass deterministic tests.
- TS/Python parity within tolerance for baseline scenarios.
- Scenario audits pass with expected directional outcomes.
- Confidence intervals and effect sizes available for key metrics.
- Plots show consistent labels and units.
- Exported runs include metadata for reproducibility.

## 7. Skills Gemini Should Build (Implementation-Ready)

- Metric registry authoring and enforcement
- Formula test design (unit + invariant tests)
- TS-to-Python parity harness development
- Scenario audit specification
- Monte Carlo convergence analysis
- Statistical significance tooling (CI, tests, power)
- Benchmark calibration methods
- Reproducibility metadata + audit reporting
- Plot validation workflows
- Documentation discipline (ADR alignment with code)

## 8. References

- `docs/ADR-001-Tiered-Resilience-Framework.md`
- `src/audit/python/verify_solvency.py`
- `src/audit/python/verify_thesis_logic.py`
- `src/audit/python/verify_all_formulas.py`
- `src/data/sources.ts`

---

This plan is intentionally rigorous so the dashboard can be defended under academic and statistical scrutiny.
