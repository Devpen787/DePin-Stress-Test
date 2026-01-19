# Baseline Simulation Summary (Section 6.2)

**Timestamp:** 2026-01-16T11:40:54.016Z

## Configuration
| Parameter | Value |
|-----------|-------|
| Time Horizon (T) | 10 weeks |
| Timestep | Weekly (Index 0-9) |
| Simulations (N) | 2 |
| Master Seed | 42 |
| Protocol Profiles | ONOCOY, Helium, Render, Filecoin, Akash, Hivemapper, DIMO, Grass, io.net, Nosana, Geodnet |

## Baseline Integrity Checklist
- [x] **Scenario Disabled**: `scenario` explicitly set to `undefined`.
- [x] **Unlock Shock Disabled**: `investorUnlockWeek` undefined, `investorSellPct` = 0.
- [x] **Growth/Competitor Shocks Disabled**: Explicit nullification.
- [x] **Demand Volatility**: Set to 0.0 (Strict Neutrality).

## Observations
*(Generated via script logic)*
- No warnings or irregularities detected during initialization.

## Output Files
- **Raw Data**: `baseline_tidy.csv` (Tidy format: week, profile, sim, metric, value)
- **Summary Stats**: `baseline_summary.csv` (Median, p25, p75)