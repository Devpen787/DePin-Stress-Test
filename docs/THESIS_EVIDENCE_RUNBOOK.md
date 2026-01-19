# Thesis Evidence Runbook

Purpose: a step-by-step, external-research workflow to gather evidence, populate missing thesis sections, and attach reproducible citations aligned with the dashboard model.

This is designed for a separate program or researcher with internet access. It assumes we will only consume the resulting artifacts locally.

---

## 0) Gemini-Specific Workflow (Use This)

### How to run this with Gemini
1. Open Gemini with browsing enabled.
2. Use the prompts in Section 0.2 in order.
3. For every claim, Gemini must produce a citation entry that includes URL + access date.
4. Deliver outputs as:
   - `evidence_log.md` (or `.csv`)
   - `references.bib` (preferred)
   - `thesis_patch.md` (paste-ready sections)

### Gemini output requirements
- Use the Evidence Schema format in Section 4 for each source.
- Add a `confidence` field to each entry (high/medium/low).
- Put all cite keys in `references.bib` that match `id` values.
- Provide a short "claim -> source id" map at the end.

---

## 0.1 Gemini Prompt Templates (Copy/Paste)

### Prompt A: Evidence log + citations (general)
```
You are assisting with a DePIN thesis. Use browsing to collect sources.
Output:
1) evidence_log.md with entries in this JSON schema:
{ "id": "...", "title": "...", "url": "...", "accessed": "YYYY-MM-DD",
  "publisher": "...", "type": "documentation|report|blog|paper|press",
  "claims": ["...", "..."], "confidence": "high|medium|low" }
2) references.bib with cite keys that match each id.
3) A claim-to-source map.
Rules: every quantitative claim must be cited. No uncited facts.
```

### Prompt B: Comparative ecosystem table
```
Collect evidence for: Helium, Grass, GEODNET, io.net, Hivemapper, Nosana,
Aleph.im, XNET.
For each: market cap (date-stamped), sector category, token model,
revenue source, burn/sink mechanism.
Output:
1) evidence_log.md entries with exact URLs + access dates.
2) references.bib with matching IDs.
3) A table-ready CSV with columns:
protocol, market_cap_usd, market_cap_date, sector, token_model,
revenue_source, burn_sink, source_id
```

### Prompt C: Onocoy empirical case
```
Find Onocoy hardware entry costs, active node counts, and burn mechanics.
Provide:
1) evidence_log.md entries with URLs + access dates.
2) references.bib with matching IDs.
3) A short narrative (300-500 words) with in-text citations [@id].
```

### Prompt D: GNSS/RTK basics (DePIN fundamentals)
```
Provide citations for GNSS/RTK accuracy requirements and why RTK networks
need density (e.g., baseline distance). Output evidence_log.md and
references.bib plus a 200-300 word section with citations.
```

---

## 1) Inputs and Target Outputs

### Inputs (local files)
- Thesis draft: `/Users/devinsonpena/Desktop/Files/cas-depin-tokenomics/thesis.md`
- Dashboard exports (examples):
  - `thesis_results/baseline/baseline_summary.csv`
  - `thesis_results/baseline/baseline_tidy.csv`
- Dashboard plan and sources:
  - `docs/BENCHMARK_VIEW_PLAN.md`
  - `src/data/sources.ts`

### Outputs (to deliver back)
- Updated thesis sections filled with evidence and citations.
- A new evidence log (CSV or Markdown) with source URLs + dates.
- A citations file (BibTeX or CSL JSON) that includes all new references.
- If needed, updated `src/data/sources.ts` entries mirroring the citations list.

---

## 2) Evidence Capture Rules (Non-Negotiable)

- Any quantitative claim must have a citation.
- Any chart or table must list:
  - data source,
  - extraction date,
  - method (API, doc, PDF, etc.).
- All estimates must be labeled as estimates.
- Do not infer missing numbers without a source.

---

## 3) Section-by-Section Evidence Checklist

### 3.1 DePIN Fundamentals (fill missing placeholders)
Evidence needed:
- Definition of DePIN and differentiation from DeFi.
- Physical infrastructure constraints (CapEx, Opex, deployment friction).
Expected sources:
- Research reports, whitepapers, or reputable industry analyses.

### 3.2 Comparative Scope: Solana DePIN Ecosystem
Required protocols:
- Helium, Grass, GEODNET, io.net, Hivemapper, Nosana, Aleph.im, XNET.
Required fields:
- Market cap (date-stamped).
- Sector category (Compute, Sensor, Wireless, Mapping, etc.).
- Token model (BME, capped supply, burn model).
- Revenue source (B2B/B2C) and token sink mechanism.
Output:
- A single table with consistent columns + citations per row.

### 3.3 Onocoy Empirical Case
Required:
- Hardware entry costs (min/max, typical).
- Current active node counts (date-stamped).
- Burn mechanics (Data Credits, buyback/burn).
- Any publicly stated demand or usage metrics.
Output:
- A one-page narrative + a small numeric table.

### 3.4 Methodology and Model Alignment
Required:
- Engine version used in dashboard.
- Simulation horizon (T), nSims, seed policy.
- Stress scenario definitions (macro regimes, demand regimes, liquidity shocks).
Output:
- An explicit “Model Configuration” box in the thesis.

### 3.5 Results (Baseline + Stress)
Required:
- Baseline metrics and at least 2 stress scenarios with time-series charts.
- A compact summary table of 4–6 core metrics.
Output:
- Figures and captions tied to exported CSVs.
- A figure list with data file paths.

---

## 4) Evidence Schema (for external program)

Use this schema when collecting evidence so it drops cleanly into thesis + sources.

```json
{
  "id": "geodnet_docs_2026_01_16",
  "title": "GEODNET Docs — Tokenomics",
  "url": "https://docs.geodnet.com/...",
  "accessed": "2026-01-16",
  "publisher": "GEODNET",
  "type": "documentation",
  "claims": [
    "GEOD token supply cap is 1B",
    "80% revenue used for buyback and burn"
  ]
}
```

---

## 5) Citation Format

The thesis uses Pandoc-style citations (`[@CiteKey]`). Deliver one of:

### Option A: BibTeX (preferred)
- Provide a `references.bib` file.
- Use cite keys that match the evidence log `id` values.

### Option B: CSL JSON
- Provide `references.json` with matching IDs.

---

## 6) Data Extraction (local CSVs)

### Baseline summary
- Input: `thesis_results/baseline/baseline_summary.csv`
- Extract:
  - mean/p10/p90 for: price, supply, providers, burn, mint, utilization.

### Time series
- Input: `thesis_results/baseline/baseline_tidy.csv`
- Extract:
  - per-week mean series for key charts.

Notes:
- Include the extraction script or command in the evidence log.
- Label outputs with scenario name and engine version.

---

## 7) Required Deliverables (Checklist)

- [ ] Replace all placeholder instruction blocks in thesis.
- [ ] Comparative ecosystem table fully populated with citations.
- [ ] Onocoy empirical case section backed by citations.
- [ ] Model configuration box added (engine + params).
- [ ] Results section includes at least:
  - 1 baseline figure,
  - 2 stress scenario figures,
  - 1 summary table.
- [ ] Evidence log delivered with URLs + access dates.
- [ ] Citation file delivered and referenced in thesis.

---

## 8) Integration Notes (for Codex)

When evidence is returned:
- Add new sources to `src/data/sources.ts` using the evidence log IDs.
- Update thesis with citations using `[@CiteKey]`.
- Ensure all tables and figures are explicitly tied to sources or local CSVs.

---

## 9) Scope Reminder

This thesis is evaluative, not predictive. Evidence should support:
- comparative robustness,
- stress sensitivity,
- observed failure modes,
without claims of real-world prediction.
