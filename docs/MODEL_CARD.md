# Model Card: DePIN Stress Test Simulator

## Model Overview
An agent-based Monte Carlo simulation for stress-testing Decentralized Physical Infrastructure Network (DePIN) tokenomics. It models provider (miner) economics, token supply/demand dynamics, and network resilience under various market conditions.

## Intended Use
- **Decision Support**: Evaluate tokenomic designs before deployment
- **Stress Testing**: Identify failure modes (death spirals, vampire attacks, liquidity shocks)
- **Sensitivity Analysis**: Understand which parameters most impact network health

## Model Assumptions

| Assumption | Justification |
|------------|---------------|
| **Rational Providers** | Providers join/leave based on profitability thresholds |
| **AMM Pricing** | Token price follows constant-product AMM model (x*y=k) |
| **Weekly Time Steps** | Captures medium-term dynamics; ignores intraday volatility |
| **No Regulatory Events** | Assumes stable legal environment |
| **Homogeneous Demand** | Demand is aggregate; no individual user modeling |

## Limitations / Not Modeled

> [!CAUTION]
> The following real-world phenomena are **explicitly excluded** from this model.

| Exclusion | Impact |
|-----------|--------|
| **Governance Attacks** | No modeling of malicious voting or protocol capture |
| **Smart Contract Bugs** | Assumes contracts work as intended |
| **Hardware Failures** | Providers don't experience equipment breakdowns |
| **Network Effects** | Demand doesn't increase with provider count (Metcalfe) |
| **Geographic Constraints** | Location is probabilistic, not geospatial |
| **Multi-Token Ecosystems** | Only single-token economics modeled |

## Calibration Status

| Parameter | Status | Source |
|-----------|--------|--------|
| `initialLiquidity` | **Fitted** | Derived from Helium historical data |
| `churnThreshold` | **Assumed** | Expert judgment (10% loss tolerance) |
| `baseCapacityPerProvider` | **Assumed** | Placeholder value |
| `competitorYield` | **Assumed** | Hypothetical competitor APY |

## Validation Summary

| Test | Status | Evidence |
|------|--------|----------|
| Unit Tests (Sanity Gates) | ✅ Pass | `simulation.test.ts` |
| Metric Registry Integrity | ✅ Pass | All charts use registry |
| 95% Confidence Intervals | ✅ Pass | CI fields populated |
| Stability Indicator | ✅ Pass | Badge shows nSims-based confidence |
| TS↔Python Parity | ✅ Pass | `scripts/verify_parity.py` |

## Architecture (Phase 6)
| Component | Description |
|-----------|-------------|
| **ViewModel** | `src/viewmodels/SandboxViewModel.ts` - All data transformations extracted from view |
| **Registry** | `src/data/MetricRegistry.ts` - Metrics with `compute` functions for executable formulas |
| **Lookups** | ID-based lookups with `getInterpretationByLabel()` helper for compatibility |
| **Engine Adapter** | `src/model/SimulationAdapter.ts` - Unified interface to simulation engines |

## Version
- **Model Version**: 2.0 (Tiered Resilience + Quality Scale + Statistical Rigor)
- **Last Updated**: 2026-01-15

## Contact
For questions about this model, contact the development team.
