# FBA Fuel Surcharge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a default-enabled fuel and logistics surcharge toggle to the NA and EU/UK Amazon calculators without affecting Walmart or MX calculations.

**Architecture:** Introduce one shared browser-friendly surcharge rules file so both calculators use the same effective dates, applicability rules, and percentage math. Then wire each calculator UI to a new checkbox, add the surcharge as a separate breakdown line, and verify behavior with Node-based regression tests.

**Tech Stack:** Static HTML, vanilla browser JavaScript, Node.js built-in test runner

---

### Task 1: Add a failing regression test for surcharge rules

**Files:**
- Create: `/Users/patrick/Documents/FBA Fee Calculate/tests/fba-surcharge-rules.test.js`
- Create: `/Users/patrick/Documents/FBA Fee Calculate/History/fba-surcharge-rules.js`

- [ ] **Step 1: Write the failing test**

Write Node tests that require `/Users/patrick/Documents/FBA Fee Calculate/History/fba-surcharge-rules.js` and assert:
- `US` and `CA` return a `0.035` surcharge rule
- `MX` returns not applicable
- `DE` and `UK` return a `0.015` surcharge rule
- disabled toggles return zero amount
- surcharge amounts are rounded to 2 decimals

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test /Users/patrick/Documents/FBA Fee Calculate/tests/fba-surcharge-rules.test.js`
Expected: FAIL because `/Users/patrick/Documents/FBA Fee Calculate/History/fba-surcharge-rules.js` does not exist yet

- [ ] **Step 3: Write minimal implementation**

Create `/Users/patrick/Documents/FBA Fee Calculate/History/fba-surcharge-rules.js` as a UMD-style shared helper exposing:
- `getNaFuelLogisticsRule(market)`
- `getEuFuelLogisticsRule(countryCode)`
- `buildFuelLogisticsSurcharge(rule, baseFee, enabled)`

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test /Users/patrick/Documents/FBA Fee Calculate/tests/fba-surcharge-rules.test.js`
Expected: PASS

### Task 2: Wire the NA calculator to the new surcharge toggle

**Files:**
- Modify: `/Users/patrick/Documents/FBA Fee Calculate/History/fba-us-local-fee-calculator.html`
- Modify: `/Users/patrick/Documents/FBA Fee Calculate/History/fba-us-local-fee-calculator.js`

- [ ] **Step 1: Add the UI control**

Add a new checked checkbox for `Fuel & logistics surcharge` to the existing toggle list and load the shared surcharge rules file before `/Users/patrick/Documents/FBA Fee Calculate/History/fba-us-local-fee-calculator.js`.

- [ ] **Step 2: Add calculation support**

Update input collection, total calculation, result breakdown, and notes so:
- `US` / `CA` can add `3.5%` of the base fulfilment fee
- `MX` shows `Not applicable`
- the surcharge appears as its own breakdown row

- [ ] **Step 3: Verify the behavior**

Run a Node smoke check that evaluates the NA script with the shared rule helper and confirms the total formula includes the surcharge amount only when the rule applies.

### Task 3: Wire the EU & UK calculator to the new surcharge toggle

**Files:**
- Modify: `/Users/patrick/Documents/FBA Fee Calculate/History/fba-eu-uk-fee-calculator.html`

- [ ] **Step 1: Add the UI control**

Insert a checked checkbox for `Fuel & logistics surcharge` in the toggle list and load `/Users/patrick/Documents/FBA Fee Calculate/History/fba-surcharge-rules.js` before the inline calculator script.

- [ ] **Step 2: Add calculation support**

Update form parsing, total calculation, breakdown rendering, and notes so eligible destinations add `1.5%` of the base fulfilment fee only.

- [ ] **Step 3: Verify the behavior**

Run a Node smoke check that exercises an eligible destination and a non-eligible state path through the shared rule helper and confirms the surcharge line math.
