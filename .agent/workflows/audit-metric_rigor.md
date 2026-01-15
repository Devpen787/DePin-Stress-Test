---
description: A rigorous protocol to audit metrics, verify formulas, and prevent confirmation bias before implementation.
---

# Traceability Protocol (Metric Audit)

Use this workflow whenever you are renaming metrics, interpreting formulas, or refactoring data visualizations.

## 1. Variable Trace 🕵️‍♀️
**Goal**: Locate the absolute source of truth.
1.  Search for the variable name in the codebase (e.g., `solvencyScore`).
2.  Follow the data flow upstream until you find the **assignment** or **calculation**.
    *   *Example*: `const solvencyScore = ...` in `simulation.ts`.

## 2. Formula Extraction 🧮
**Goal**: Verify the math matches the label.
1.  Copy the exact code formula.
2.  Translate variables to business terms.
    *   *Code*: `((burnedMacro/7) * price) / ((mintedMacro/7) * price)`
    *   *Translation*: `(Daily Burn USD) / (Daily Mint USD)`
3.  **Check**: Does this matching the proposed label?
    *   *Label*: "Revenue-to-Emission"? -> **FAIL** (Revenue != Burn).
    *   *Label*: "Sustainability Ratio"? -> **PASS**.

## 3. Negative Testing 🧪
**Goal**: Check for edge cases and failures.
1.  **Zero Check**: What if the denominator is 0?
2.  **Strategy Check**: Does this metric depend on a switch (e.g., `revenueStrategy`)?
    *   *Test*: If `strategy = 'burn'`, does `treasuryBalance` show 0? Yes. Is that confusing? Yes. -> **Add Fallback UI**.

## 4. Semantic Audit 📖
**Goal**: Ensure language honesty.
1.  Does the name imply more than the math?
    *   *Name*: `Concentration` (Implies Gini/HHI).
    *   *Math*: `Sum(LocationScale)`.
    *   *Verdict*: **FAIL**. Rename to `Coverage Score`.

## Output
When finished, update your implementation plan with:
- [ ] Confirmed Formulas
- [ ] Necessary Renames
- [ ] UI Safeguards for edge cases
