# US Large Standard Dim Weight And Input Precision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adjust US Large standard-size dimensional-weight behavior and allow 0.001 precision for dimensions and weight across all calculators.

**Architecture:** Keep the existing US size-tier classifier structure intact, but split dimensional-weight calculation into a Large standard-size path and a bulky/XL path. Add one US-only checkbox that is always visible but only changes the Large standard-size dim-weight formula. Separately, update form input `step` values across NA, EU/UK, and Walmart without changing display precision.

**Tech Stack:** Static HTML, vanilla browser JavaScript, Node.js built-in test runner

---

### Task 1: Lock the new US dimensional-weight behavior with failing tests

**Files:**
- Modify: `/Users/patrick/Documents/FBA Fee Calculate/tests/fba-surcharge-smoke.test.js`
- Create: `/Users/patrick/Documents/FBA Fee Calculate/tests/us-large-standard-dim-weight.test.js`

- [ ] **Step 1: Write failing tests**

Add tests that prove:
- a US Large standard-size item uses actual median/shortest dimensions by default
- the same item uses a 2-inch minimum when the new checkbox is enabled
- bulky / XL dimensional weight still uses the 2-inch minimum regardless of the checkbox

- [ ] **Step 2: Run the targeted tests and verify they fail**

Run: `node --test ./tests/us-large-standard-dim-weight.test.js ./tests/fba-surcharge-smoke.test.js`

- [ ] **Step 3: Implement the minimal code in the NA calculator**

Update the NA calculator HTML and JS so the new checkbox is collected from the form and only changes the US Large standard-size dim-weight path.

- [ ] **Step 4: Re-run the targeted tests**

Run: `node --test ./tests/us-large-standard-dim-weight.test.js ./tests/fba-surcharge-smoke.test.js`

### Task 2: Allow 0.001 precision for dimensions and weight across all calculators

**Files:**
- Modify: `/Users/patrick/Documents/FBA Fee Calculate/History/fba-us-local-fee-calculator.html`
- Modify: `/Users/patrick/Documents/FBA Fee Calculate/History/fba-eu-uk-fee-calculator.html`
- Modify: `/Users/patrick/Documents/FBA Fee Calculate/History/walmart-wfs-fee-calculator.html`
- Create: `/Users/patrick/Documents/FBA Fee Calculate/tests/input-precision.test.js`

- [ ] **Step 1: Write the failing precision test**

Add a test that asserts all `length / width / height / weight` inputs across NA, EU/UK, and Walmart use `step="0.001"`.

- [ ] **Step 2: Run the targeted test and verify it fails**

Run: `node --test ./tests/input-precision.test.js`

- [ ] **Step 3: Implement the minimal HTML changes**

Change only the relevant `step` attributes. Keep display precision and unrelated fields untouched.

- [ ] **Step 4: Re-run the targeted test**

Run: `node --test ./tests/input-precision.test.js`

### Task 3: Verify full regression coverage

**Files:**
- Verify only

- [ ] **Step 1: Run the full test suite**

Run: `npm test`

- [ ] **Step 2: Run the deploy build**

Run: `npm run build`

- [ ] **Step 3: Confirm no changelog data was modified**

Check that `/Users/patrick/Documents/FBA Fee Calculate/data/versions.json` remains unchanged.
