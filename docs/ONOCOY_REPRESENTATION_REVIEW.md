# Onocoy Representation Review

Purpose: capture an Onocoy-lens assessment of how Onocoy is represented across the dashboard, so it can be referenced later.

## Onocoy Footprint (Where It Appears)
- Protocol profile defaults in `src/data/protocols.ts` (supply, emissions, burn, price, provider economics).
- Alternate preset set in `src/model/params.ts` (different numbers and naming).
- Case study narrative and charts in `src/data/caseStudies.ts`, rendered by `src/components/CaseStudy/TokenomicsStudy.tsx`.
- Research framing referencing Onocoy BME and scale mechanisms in `src/data/research.ts`.
- Source citations for Onocoy docs (location scale, quality scale, tokenomics) in `src/data/sources.ts`.
- Live price token mapping in `src/services/coingecko.ts`.
- Placeholder on-chain metrics and endpoints in `src/services/dune.ts`.

## Strengths (Credibility and Clarity)
- Onocoy is a first-class protocol profile with explicit metadata and notes in `src/data/protocols.ts`.
- Onocoy docs are cited (location scale, quality scale, tokenomics) in `src/data/sources.ts`.
- The tiered resilience framework maps well to a GNSS network story (survival, viability, utility).
- Live price mapping for ONO exists via CoinGecko in `src/services/coingecko.ts`.

## Gaps and Risks (Onocoy Lens)
- Parameter divergence: Onocoy values differ between `src/data/protocols.ts` and `src/model/params.ts`, plus a hardcoded hardware cost in `src/components/Simulator/ComparisonView.tsx`. This undermines calibration clarity.
- Onocoy-specific mechanisms are implied, not explicit: Location Scale and Quality Scale are referenced but not surfaced as first-class metrics or charts.
- Case study content is static and assertive; the charts appear illustrative rather than simulation-derived, which may weaken trust.
- Data credits and usage-to-burn linkage are not visible as a first-class concept in the UI.
- On-chain anchors are placeholders in `src/services/dune.ts`, so live verification is not yet available.

## Recommended Improvements (Highest Impact First)
1. Single source of truth for Onocoy parameters; surface a "calibrated to Onocoy" badge with date and sources.
2. Add explicit Location Scale and Quality Scale metrics to the UI and registry.
3. Add a small "Onocoy Model Card" panel listing calibrated vs assumed fields and data freshness.
4. Label case study charts as illustrative or generate them from simulation outputs.
5. Wire at least one real-world anchor (active stations or burn) once Dune endpoints are ready.

## Notes
- This review reflects an Onocoy stakeholder perspective focused on credibility, accuracy, and brand alignment.
- It intentionally separates "good redundancy" from "misleading inconsistency."
