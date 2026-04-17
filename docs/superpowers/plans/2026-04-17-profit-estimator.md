# Profit Estimator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a lightweight profit estimator to all three calculator pages with explicit FBA sync, standalone manual use, and a two-decimal gross margin result.

**Architecture:** Add one shared browser-side profit-estimator helper that owns defaults, sync behavior, unit conversion, chargeable-weight math, and gross-margin calculation. Each calculator page will render the same estimator panel in the result area and provide page-specific context such as currency, units, dimensions, weight, and fee result when available.

**Tech Stack:** Static HTML, vanilla browser JavaScript, shared helper script, Node.js built-in test runner

---

### Task 1: Lock the estimator defaults and formula in failing tests

**Files:**
- Create: `/Users/patrick/Documents/FBA Fee Calculate/tests/profit-estimator-core.test.js`
- Create: `/Users/patrick/Documents/FBA Fee Calculate/History/profit-estimator.js`

- [ ] **Step 1: Write the failing test**

Create `/Users/patrick/Documents/FBA Fee Calculate/tests/profit-estimator-core.test.js` with tests that require `/Users/patrick/Documents/FBA Fee Calculate/History/profit-estimator.js` and assert:
- US defaults to `vat = 0`, `referralRate = 15`, `firstLegPriceRmbPerKg = 8`, `exchangeRate = 7`
- CA defaults to `exchangeRate = 5`
- MX defaults to `exchangeRate = 0.4`
- EU defaults to `vat = 20`, `exchangeRate = 7.8`
- UK defaults to `vat = 20`, `exchangeRate = 9`
- Walmart defaults to `vat = 0`, `exchangeRate = 7`
- `20` VAT is interpreted as `20%`
- `15` referral rate is interpreted as `15%`
- chargeable weight uses `max(volumetric, actual)`
- gross margin returns a percentage rounded to two decimals

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
node --test ./tests/profit-estimator-core.test.js
```

Expected: FAIL because `/Users/patrick/Documents/FBA Fee Calculate/History/profit-estimator.js` does not exist yet.

- [ ] **Step 3: Write the minimal shared implementation**

Create `/Users/patrick/Documents/FBA Fee Calculate/History/profit-estimator.js` as a browser-friendly shared helper exposing:
- `getProfitDefaults(context)`
- `calculateChargeableWeightKg({ lengthCm, widthCm, heightCm, actualWeightKg })`
- `calculateGrossMargin(input)`

Implementation requirements:
- normalize RMB costs into local currency using exchange rate
- do not calculate if required numeric inputs are missing or invalid
- return a structured result object with success state, message, and `grossMarginPercent`

- [ ] **Step 4: Re-run the test to verify it passes**

Run:

```bash
node --test ./tests/profit-estimator-core.test.js
```

Expected: PASS.

### Task 2: Lock partial sync behavior in failing tests

**Files:**
- Create: `/Users/patrick/Documents/FBA Fee Calculate/tests/profit-estimator-sync.test.js`
- Modify: `/Users/patrick/Documents/FBA Fee Calculate/History/profit-estimator.js`

- [ ] **Step 1: Write the failing sync test**

Create `/Users/patrick/Documents/FBA Fee Calculate/tests/profit-estimator-sync.test.js` with tests that assert:
- sync updates `fbaFee` when a valid fee result exists
- sync leaves existing `fbaFee` untouched when fee result is absent
- sync computes chargeable weight when dimensions and weight are available
- sync leaves existing chargeable weight untouched when dimensions or weight are incomplete
- sync never overwrites target selling price, VAT, referral rate, first-leg unit price, product cost, or exchange rate

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
node --test ./tests/profit-estimator-sync.test.js
```

Expected: FAIL because the sync helper does not exist yet.

- [ ] **Step 3: Extend the shared implementation**

Add a sync helper to `/Users/patrick/Documents/FBA Fee Calculate/History/profit-estimator.js`, for example:
- `syncEstimatorFields(currentEstimatorState, sourceContext)`

Implementation requirements:
- support partial sync
- preserve existing manual values when source data is missing
- return the next estimator state without mutating unrelated inputs

- [ ] **Step 4: Re-run the test to verify it passes**

Run:

```bash
node --test ./tests/profit-estimator-sync.test.js
```

Expected: PASS.

### Task 3: Add the estimator panel shell to the NA calculator

**Files:**
- Modify: `/Users/patrick/Documents/FBA Fee Calculate/History/fba-us-local-fee-calculator.html`
- Modify: `/Users/patrick/Documents/FBA Fee Calculate/History/fba-us-local-fee-calculator.js`
- Test: `/Users/patrick/Documents/FBA Fee Calculate/tests/profit-estimator-ui.test.js`

- [ ] **Step 1: Write the failing NA UI test**

Create `/Users/patrick/Documents/FBA Fee Calculate/tests/profit-estimator-ui.test.js` with assertions that the NA page:
- loads `profit-estimator.js`
- renders a `简易利润测算` section between the summary result block and detailed cards
- includes both `同步自 FBA` and `计算毛利` buttons
- includes the required fields:
  - target selling price
  - VAT
  - referral rate
  - FBA fee
  - chargeable weight
  - first-leg price per kg
  - product cost
  - exchange rate
- includes one result slot for `毛利率`

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
node --test ./tests/profit-estimator-ui.test.js
```

Expected: FAIL because the estimator UI does not exist in the NA page yet.

- [ ] **Step 3: Add the estimator shell and NA wiring**

Update `/Users/patrick/Documents/FBA Fee Calculate/History/fba-us-local-fee-calculator.html` to:
- load `/Users/patrick/Documents/FBA Fee Calculate/History/profit-estimator.js`
- add the estimator panel in the approved location

Update `/Users/patrick/Documents/FBA Fee Calculate/History/fba-us-local-fee-calculator.js` to:
- initialize estimator defaults for the active NA market
- store the latest fee result context after each fee calculation
- wire `同步自 FBA`
- wire `计算毛利`
- render one two-decimal gross margin result

- [ ] **Step 4: Re-run the test to verify it passes**

Run:

```bash
node --test ./tests/profit-estimator-ui.test.js
```

Expected: PASS.

### Task 4: Add estimator behavior coverage for the NA page

**Files:**
- Create: `/Users/patrick/Documents/FBA Fee Calculate/tests/profit-estimator-na-smoke.test.js`
- Modify: `/Users/patrick/Documents/FBA Fee Calculate/History/fba-us-local-fee-calculator.js`

- [ ] **Step 1: Write the failing NA smoke test**

Create `/Users/patrick/Documents/FBA Fee Calculate/tests/profit-estimator-na-smoke.test.js` that evaluates the NA script in a fake DOM and proves:
- `计算毛利` can work with manual `FBA费用` and manual `头程计费重` without sync
- `同步自 FBA` pulls a valid `FBA费用` after fee calculation
- `同步自 FBA` still updates chargeable weight when fee result is absent but dimensions and weight exist
- `计算毛利` does not overwrite manually edited estimator inputs

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
node --test ./tests/profit-estimator-na-smoke.test.js
```

Expected: FAIL because the estimator behavior is not wired yet.

- [ ] **Step 3: Implement the minimal NA behavior**

Adjust `/Users/patrick/Documents/FBA Fee Calculate/History/fba-us-local-fee-calculator.js` until the smoke test passes.

- [ ] **Step 4: Re-run the test to verify it passes**

Run:

```bash
node --test ./tests/profit-estimator-na-smoke.test.js
```

Expected: PASS.

### Task 5: Add the estimator panel to the EU & UK calculator

**Files:**
- Modify: `/Users/patrick/Documents/FBA Fee Calculate/History/fba-eu-uk-fee-calculator.html`
- Test: `/Users/patrick/Documents/FBA Fee Calculate/tests/profit-estimator-ui.test.js`

- [ ] **Step 1: Extend the failing UI test for EU & UK**

Update `/Users/patrick/Documents/FBA Fee Calculate/tests/profit-estimator-ui.test.js` so it also asserts the EU & UK page includes:
- the shared estimator script
- the estimator section
- the two buttons
- the required fields
- one `毛利率` output slot

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
node --test ./tests/profit-estimator-ui.test.js
```

Expected: FAIL on the EU & UK page until the estimator shell is added.

- [ ] **Step 3: Add the EU & UK estimator shell and wiring**

Update `/Users/patrick/Documents/FBA Fee Calculate/History/fba-eu-uk-fee-calculator.html` to:
- load the shared estimator script
- add the estimator panel in the same relative location
- wire the EU / UK defaults and fee-result sync through the shared helper

- [ ] **Step 4: Re-run the test to verify it passes**

Run:

```bash
node --test ./tests/profit-estimator-ui.test.js
```

Expected: PASS for both NA and EU & UK.

### Task 6: Add the estimator panel to the Walmart calculator

**Files:**
- Modify: `/Users/patrick/Documents/FBA Fee Calculate/History/walmart-wfs-fee-calculator.html`
- Modify: `/Users/patrick/Documents/FBA Fee Calculate/History/walmart-wfs-fee-calculator.js`
- Test: `/Users/patrick/Documents/FBA Fee Calculate/tests/profit-estimator-ui.test.js`

- [ ] **Step 1: Extend the failing UI test for Walmart**

Update `/Users/patrick/Documents/FBA Fee Calculate/tests/profit-estimator-ui.test.js` so it also asserts the Walmart page includes the shared estimator shell and the same field set.

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
node --test ./tests/profit-estimator-ui.test.js
```

Expected: FAIL on Walmart until the estimator UI is added there.

- [ ] **Step 3: Add the Walmart estimator shell and wiring**

Update `/Users/patrick/Documents/FBA Fee Calculate/History/walmart-wfs-fee-calculator.html` and `/Users/patrick/Documents/FBA Fee Calculate/History/walmart-wfs-fee-calculator.js` to:
- load the shared estimator script
- place the estimator in the approved location
- use Walmart defaults (`VAT = 0`, `exchangeRate = 7`)
- support sync and standalone calculation

- [ ] **Step 4: Re-run the test to verify it passes**

Run:

```bash
node --test ./tests/profit-estimator-ui.test.js
```

Expected: PASS for all three calculators.

### Task 7: Run full verification and confirm changelog data remains untouched

**Files:**
- Verify only

- [ ] **Step 1: Run the full test suite**

Run:

```bash
npm test
```

Expected: PASS with zero failures.

- [ ] **Step 2: Run the deploy build**

Run:

```bash
npm run build
```

Expected: PASS and produce the deployable `dist` output.

- [ ] **Step 3: Run syntax verification on edited calculator scripts**

Run:

```bash
node --check ./History/fba-us-local-fee-calculator.js
node --check ./History/walmart-wfs-fee-calculator.js
```

Expected: PASS with no syntax errors.

- [ ] **Step 4: Confirm changelog data was not modified**

Run:

```bash
git diff -- ./data/versions.json
```

Expected: no diff output.
