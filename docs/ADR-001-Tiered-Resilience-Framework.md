# ADR-001: Tiered Resilience Framework

## Status
**Accepted & Implemented** (2026-01-15)

## Context
We are transitioning the dashboard from a generic "Module-based" layout (Solvency, Capitulation, etc.) to a rigorous **Tiered Resilience Framework** aligned with academic research. This involves both **structural reorganization** of charts and **terminology alignment** to bridge the gap between crypto-native metrics and traditional financial analysis.

To ensure long-term maintainability and academic defensibility, we must also enforce ample **validation rigor** on the data presented.

## Architectural Decision
**We will restructure the application into three layers:**

1.  **Visual Layer**: Tiered Layout (Survival, Viability, Utility).
2.  **Logic Layer**: Centralized `MetricRegistry` (Source of Truth).
3.  **Knowledge Layer**: Integrated Citations & Interpretations.

### Component: `SandboxView` (Structural & Terminology)

We will restructure the main visualization into three prioritized tiers.

#### Tier 1: Survival (Critical — "Can it exist?")
*Focus: Existential risks that cause immediate protocol death.*

- **Relocations**:
    - Move `Solvency Score` (Sustainability Ratio) to top.
    - Move `Provider Retention` (Retention Rate) here.
    - Move `Capitulation Stack` (Urban vs Rural Composition) here.
    - Move `Liquidity Shock` (Token Price) here.
    - Move `Treasury Balance` (Reserve Status) here.
- **Terminology Updates** (Academic Alignment):
    - Rename `Solvency Score` → **"Sustainability Ratio (Burn-to-Emission)"** [Source 6]
    - Label Urban nodes as **"High Sunk Cost (Urban)"** [Source 11]
    - Label Rural nodes as **"Low Sunk Cost (Rural)"**
    - **Metric Addition**: Calculate `Weekly Retention Rate` = `1 - (Weekly_Churn / Start_Active_Week)` (clamped 0-1, where `Weekly_Churn = churnCount_t` and `Start_Active_Week = providers_{t-1}`).
    - **UI Logic Update**: For `Treasury Balance`, display "N/A (Burn Strategy)" if `revenueStrategy !== 'reserve'`.

#### Tier 2: Viability (High — "Is it sustainable?")
*Focus: Long-term economic health and growth.*

- **Relocations**:
    - Group `Miner Payback Period` here.
    - Group `Net Daily Loss` here.
    - Group `Vampire Churn` (Competitor Pressure) here.
- **Terminology Updates**:
    - Rename `weightedCoverage` → **"Network Coverage Score"** (Sum of Location Scores, non-normalized) [Source 15]
    - **Optional (Comparison)**: `Normalized Coverage Score` = `Network Coverage Score / providers`.

#### Tier 3: Utility (Medium — "Is it useful?")
*Focus: Network efficacy and coverage quality.*

- **Relocations**:
    - Group `Network Utilization` here.
    - Group `Effective Capacity (Serviceable Supply)` here.
    - Group `Rural Coverage` (Location Scale) here.
- **Terminology Updates**:
    - Explicitly link Rural Coverage to **"Location Scale Algorithm"** [Source 15]
    - **Renaming**: `Effective Service Capacity` → **"Effective Capacity (Serviceable Supply)"**.
    - **Metric Clarification**: `Rural Coverage` = `ruralCount` (count of rural providers).

### Decisions (Locked for This Iteration)

- **Retention Rate**: Use `1 - (churnCount_t / providers_{t-1})`, clamped to `0..1`.
- **Coverage Metric**: Keep `Network Coverage Score` as the non-normalized sum of `locationScale`, and add a normalized variant only for comparison views.

### Metric Definitions (Derived)

- **Weekly Retention Rate**: `1 - (churnCount_t / providers_{t-1})`, clamped to `0..1`.
- **Network Coverage Score**: `sum(locationScale)` across active providers (non-normalized).
- **Normalized Coverage Score (optional)**: `Network Coverage Score / providers_t` for cross-protocol comparison.
- **Effective Capacity (Serviceable Supply)**: `capacity` (aggregate serviceable capacity).

### Component: `ChartInterpretations` (Metadata)

- Update metadata for all relocated charts to include their new **Tier** and **Academic Source**.
- **Schema Update**: Add `tier` (string) and `sourceId` (number) fields to `ChartInterpretation` interface.
- Add "Interpretation Notes" citing specific research findings.
- **UI Location**: Show Tier/Source metadata in the Chart Header tooltip.

### Component: `Wiki` (Knowledge Layer)

    - `Solvency Score` ↔ `Sustainability Ratio (Burn-to-Emission)`
    - `Urban/Rural` ↔ `Sunk Cost Heterogeneity`

### Standard: Metric Registry (`src/data/MetricRegistry.ts`)
**Decision**: All metrics displayed in the dashboard MUST be defined in the `MetricRegistry`.
- **Constraint**: No hardcoded labels or formulas in UI components.
- **Benefit**: Ensures that the "Sustainability Ratio" displayed in the UI is mathematically identical to the "Sustainability Ratio" checked in unit tests.

## References (Source Map)

The `[Source X]` citations in this document correspond to the `RESEARCH_SOURCES` array in `src/data/sources.ts`.

| Citation | Title/Context | ID in Code |
| :--- | :--- | :--- |
| **[Source 1]** | DePIN Tokenomics Under Stress | ID: `1` |
| **[Source 6]** | Burn-and-Mint Tokenomics: Deflation and Strategic Incentives | ID: `6` |
| **[Source 11]** | DCW Daily Brief: Global Digital Assets & Web3 Market Intelligence | ID: `11` |
| **[Source 13]** | Onyx: DAO Treasury Contract | ID: `13` |
| **[Source 15]** | Location Scale (Onocoy Documentation) | ID: `15` |

## Verification Plan

### Automated Verification
- Verify that `SandboxView` renders without crashing.
- Verify that all charts (Solvency, Retention, etc.) are present and rendering data.

### Data Integrity Verification
> [!NOTE]
> Math verified against `src/model/simulation.ts` lines 754-760.

1. **Solvency Formula Check**: Confirm `solvencyScore` = `(DailyBurnUSD / DailyMintUSD)`.
   - *Current Code*: `((burnedMacro / 7) * tokenPrice) / ((mintedMacro / 7) * tokenPrice)` -> **Verified as Burn/Mint (Sustainability)**.
   - *Correction*: Label changed from "Revenue-to-Emission" to "Sustainability Ratio" to be precise.
2. **Urban Definition Check**: Confirm "High Sunk Cost" label matches `urban` provider behavior.
   - *Current Code*: Urban providers have explicitly lower churn probability in `simulation.ts` -> **Verified**.
3. **Retention Formula Check**: Confirm `Weekly Retention Rate` derives from `churnCount_t` and `providers_{t-1}`, clamped to `0..1`.
4. **Coverage Metric Check**: Confirm `Network Coverage Score` uses `weightedCoverage` (sum of `locationScale`).

### Manual Verification (The Presentation Walkthrough)
1. **Tier 1 Check**: Does the dashboard immediately show the "Survival" metrics at the top?
2. **Terminology Check**: Hover over "Sustainability Ratio" — does the tooltip mention "Burn-to-Emission" and cite [Source 6]?
3. **Scenario Check**: Run "Crypto Winter". Does the "High Sunk Cost" (Urban) stack persist longer than "Low Sunk Cost" (Rural)?
