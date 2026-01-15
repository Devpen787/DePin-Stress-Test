# Dashboard Redundancy Review

> **Last Updated:** January 15, 2026  
> **Status:** Partially Remediated (see checkmarks below)

## Purpose
Summarize redundancy findings across the dashboard UI and recommend steps to reduce noise while preserving signal clarity for beginner-to-expert users.

## UI/UX Onboarding Findings (New)

### Key UX Gaps (Onboarding)
- No explicit "start here" entry point; the hero is descriptive but does not guide first-time users into a recommended flow.
- Scenario selection is hidden behind a dropdown and lacks a "recommended first run" path.
- Advanced tools appear before basic setup and are not clearly separated from beginner actions.
- Parameter controls use domain language without context (no in-line "why it matters" or staged reveal).
- Comparison heatmap and deltas have no legend or baseline explanation, which obscures meaning.
- The flywheel widget uses strong labels (e.g., "BROKEN") without thresholds or next-step guidance.

### Concrete Onboarding Plan (Beginner-to-Expert)
1. **Entry Modal (First Run Only)**
   - Choose user type: Beginner or Expert.
   - Choose intent: Diagnose, Compare, or Stress-Test.
   - Auto-load a recommended scenario preset based on selection.

2. **Beginner Mode (Guided Flow)**
   - Step 1: Select protocol (highlight and explain impact).
   - Step 2: Apply baseline scenario (preloaded via ScenarioManager).
   - Step 3: Show only 3 core controls (Demand, Macro, Burn).
   - Step 4: Auto-scroll to Tier 1 with tooltips on the 3 survival metrics.
   - Step 5: Run a single stress preset and show a short "what changed vs baseline" summary.
   - Step 6: Offer Save Scenario + Generate Memo as the end of flow.

3. **Expert Mode (Full Control)**
   - Show advanced tools (Analyst Suite, comparison, benchmark, export) with compact labels.
   - Keep optional quick tips (dismissible) instead of forced guidance.

4. **Persistent Guidance Layer**
   - Always show current scenario + baseline selector in the top bar.
   - Add a small "Reset to Baseline" control.
   - Provide inline glossary tooltips for domain terms (driven by MetricRegistry + ChartInterpretations).

5. **Comparison Mode Clarity**
   - Add a heatmap legend and "baseline" selector.
   - Explain deltas in one line directly above the grid.

## Scope Reviewed
- `index.tsx` (global header controls, tabs, data refresh)
- `src/components/Simulator/SandboxView.tsx` (module charts, small charts, focus modal)
- `src/components/Simulator/SimulatorSidebar.tsx` (protocol selection, quick presets)
- `src/components/ThesisDashboard.tsx` (protocol selection, scenario selector, metrics)
- `src/components/explorer/ExplorerTab.tsx` and `src/components/explorer/ExplorerTable.tsx`
- `src/components/Simulator/ComparisonView.tsx` (live data panel, scorecard)
- `src/components/CaseStudy/TokenomicsStudy.tsx` (narrative charts)
- `src/components/ui/ScenarioManager.tsx` (scenario library)

---

## Redundancy Findings & Status

### 1. Scenario Selection (3 Places) 
| Location | Status |
|----------|--------|
| Quick Presets in `SimulatorSidebar.tsx` | ⬜ Still exists |
| ScenarioManager in `SandboxView.tsx` | ⬜ Still exists |
| Scenario selector in `ThesisDashboard.tsx` | ⬜ Still exists |

**Recommendation:** Consolidate to ScenarioManager as single source of truth.

---

### 2. Protocol Selection (3 Places)
| Location | Status |
|----------|--------|
| Explorer table actions | ⬜ Still exists |
| Simulator sidebar list | ⬜ Still exists |
| Thesis sidebar | ⬜ Still exists |

**Recommendation:** Make Explorer the primary entry point; others reflect selection.

---

### 3. Live Data Refresh (3 Places)
| Location | Status |
|----------|--------|
| Data dropdown in `index.tsx` | ⬜ Still exists |
| Explorer refresh | ⬜ Still exists |
| Comparison live data panel | ⬜ Still exists |

**Recommendation:** Keep in one place (header or Explorer), show status elsewhere.

---

### 4. Metric Label Consistency ✅ FIXED
| Issue | Status |
|-------|--------|
| Inconsistent labels across tabs | ✅ **FIXED** |

**Resolution:** 
- Phase 7-8 created `MetricRegistry.ts` with canonical labels
- All components now use `METRICS.solvency_ratio.label`, `METRICS.payback_period.label`, etc.
- `chartInterpretations.ts` now keyed by metric ID, not label

---

### 5. Intra-Sandbox Duplication (Module + Small Grid + Focus Modal)
| Component | Status |
|-----------|--------|
| Module charts (primary) | ⬜ Still exists |
| Small chart grid | ⬜ Still exists |
| Focus modal (deep-dive) | ⬜ Still exists |

**Note:** This is intentional progressive disclosure, but could be collapsed.

---

## Architectural Improvements Completed (Today)

| Improvement | Impact on Redundancy |
|-------------|---------------------|
| **MetricRegistry** | Single source for all metric labels/formulas |
| **MetricsPipeline** | Centralized computation, no inline formulas |
| **ID-Based Lookups** | Stable keys prevent drift between tabs |
| **SimulationAdapter** | One engine interface, no scattered imports |
| **Architecture Tests** | 8 invariant tests prevent regression |

---

## Remaining Redundancy Debt

| Area | Priority | Effort | Risk |
|------|----------|--------|------|
| Scenario selection (3 places) | High | Medium | Low |
| Protocol selection (3 places) | High | Medium | Medium |
| Refresh controls (3 places) | Medium | Low | Low |
| Sandbox chart layers | Low | Medium | Medium |

---

## Recommended Next Steps

### Quick Wins
1. ~~Rename metrics consistently~~ ✅ Done via MetricRegistry
2. Hide duplicate quick presets in sidebar (add toggle)
3. Replace multiple refresh buttons with read-only status

### Deeper Work
1. **Scenario Hub:** Deprecate Quick Presets, link to ScenarioManager
2. **Protocol Flow:** Explorer → Simulator/Thesis (reflect, don't re-select)
3. **Progressive Disclosure:** Toggle to hide small chart grid for beginners

---

## Summary

**Before Today:** 5 redundancy categories identified  
**After Today:** 1 fully fixed (label consistency), 4 remaining

The architectural remediation (Phases 7-12) laid the foundation for addressing remaining redundancies by establishing single sources of truth for metrics. The next phase should focus on UX consolidation.
