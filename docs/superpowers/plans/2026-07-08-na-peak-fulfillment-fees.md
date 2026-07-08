# NA Peak Fulfillment Fees Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an optional US/CA 2026 peak-period base fulfilment fee mode to the North America FBA calculator.

**Architecture:** Keep the change local to the existing NA calculator. Store peak fee tables beside the existing US/CA fee data, switch the base-fee lookup only when the new checkbox is enabled and supported, and surface the chosen fee basis in the existing result breakdown.

**Tech Stack:** Static HTML, browser JavaScript, Node.js `node:test`.

---

### Task 1: Tests

**Files:**
- Modify: `tests/fba-surcharge-smoke.test.js`

- [ ] Add NA test DOM coverage for `peakFulfillmentFees`.
- [ ] Assert US non-apparel peak mode increases the sample total and renders the peak-period note.
- [ ] Assert CA peak mode uses the CA peak column and renders the peak-period note.
- [ ] Assert US apparel peak mode keeps the current base fee and renders the unsupported note.
- [ ] Run `node --test tests/fba-surcharge-smoke.test.js` and verify the new tests fail before implementation.

### Task 2: Implementation

**Files:**
- Modify: `History/fba-us-local-fee-calculator.html`
- Modify: `History/fba-us-local-fee-calculator.js`

- [ ] Add the checkbox under optional conditions, default unchecked.
- [ ] Add US non-apparel peak rows and formulas from the Word document.
- [ ] Add CA peak rows and formulas from the Word document.
- [ ] Read, save, and restore `peakFulfillmentFees` with form state and history.
- [ ] Switch `baseFeeUs` and `baseFeeCa` to use peak tables only when enabled and supported.
- [ ] Add result breakdown/notes showing whether peak mode was applied, unavailable, or off.

### Task 3: Verification

**Files:**
- Verify all changed files.

- [ ] Run `node --test tests/fba-surcharge-smoke.test.js`.
- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Review `git diff` to confirm no unrelated changes were introduced.
