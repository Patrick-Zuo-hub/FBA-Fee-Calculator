# EU/UK Festive Season Peak Fees Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an optional EU/UK festive-season peak fee mode for 15 October 2026 through 14 January 2027 while preserving all existing non-peak calculations.

**Architecture:** Keep the current non-peak fee tables as the canonical base data. Add narrowly scoped peak overrides keyed by table, size tier, weight band, and fee column; select them only when the new form toggle is enabled. The calculator will present the chosen rate period separately from the existing fuel surcharge and will persist the toggle in local history.

**Tech Stack:** Static HTML, browser JavaScript, Node.js `node:test`, existing VM-based calculator smoke tests.

---

### Task 1: Add failing behavioural coverage for peak mode

**Files:**
- Create: `tests/eu-peak-fulfillment-fees.test.js`
- Modify: `tests/fba-surcharge-ui.test.js`

- [ ] **Step 1: Write the failing calculator test fixture and local-fee test**

```js
test("EU local parcel uses the published festive peak fee only when enabled", () => {
  const { elements } = loadCalculator();
  setLocalUkSmallParcelInput(elements);
  elements.fuelLogisticsSurcharge.checked = false;
  elements.festiveSeasonPeak.checked = false;

  assert.equal(total(submit(elements), "£"), 3.04);

  elements.festiveSeasonPeak.checked = true;
  const peakMarkup = submit(elements);
  assert.equal(total(peakMarkup, "£"), 3.15);
  assert.match(peakMarkup, /Festive season peak/);
  assert.match(peakMarkup, /October 15, 2026/);
  assert.match(peakMarkup, /excluding apparel/i);
});
```

- [ ] **Step 2: Run the new test to verify it fails**

Run: `node --test tests/eu-peak-fulfillment-fees.test.js`

Expected: FAIL because `festiveSeasonPeak` is not present in the fixture and peak mode is not implemented.

- [ ] **Step 3: Add failing EFN, unchanged oversize, selected-category, and UI assertions**

```js
test("EU EFN parcel uses its published festive peak fee", () => {
  const { elements } = loadCalculator();
  setEfnSmallParcelInput(elements);
  elements.fuelLogisticsSurcharge.checked = false;
  elements.festiveSeasonPeak.checked = true;
  assert.equal(total(submit(elements), "€"), 7.53);
});

test("EU oversize fee remains unchanged when festive peak is enabled", () => {
  const { elements } = loadCalculator();
  setLocalUkOversizeInput(elements);
  elements.fuelLogisticsSurcharge.checked = false;
  elements.festiveSeasonPeak.checked = false;
  const nonPeak = total(submit(elements), "£");
  elements.festiveSeasonPeak.checked = true;
  assert.equal(total(submit(elements), "£"), nonPeak);
});

test("EU calculator exposes an unchecked festive peak toggle", () => {
  assert.match(euHtml, /id="festive-season-peak"[^>]*type="checkbox"/);
  assert.doesNotMatch(euHtml, /id="festive-season-peak"[^>]*checked/);
});
```

- [ ] **Step 4: Run the focused tests to verify they fail for the intended missing feature**

Run: `node --test tests/eu-peak-fulfillment-fees.test.js tests/fba-surcharge-ui.test.js`

Expected: FAIL only on assertions concerning the absent peak toggle, peak fee values, and warning.

- [ ] **Step 5: Commit the failing tests**

```bash
git add tests/eu-peak-fulfillment-fees.test.js tests/fba-surcharge-ui.test.js
git commit -m "test: cover EU festive season peak fees"
```

### Task 2: Add source-backed peak overrides to the EU fee data

**Files:**
- Modify: `History/fba-fee-data.js:94-333`
- Modify: `History/fba-fee-data.test-wrapper.cjs`

- [ ] **Step 1: Add a clone-and-override helper after the static fee tables**

```js
function cloneRows(rows) {
  return rows.map((row) => ({
    ...row,
    bands: row.bands && row.bands.map((band) => ({
      ...band,
      fees: band.fees && { ...band.fees }
    })),
    baseFees: row.baseFees && { ...row.baseFees },
    incrementFees: row.incrementFees && { ...row.incrementFees }
  }));
}

function applyPeakOverrides(rows, overrides) {
  const peakRows = cloneRows(rows);
  Object.entries(overrides).forEach(([tierKey, tierOverrides]) => {
    const tier = peakRows.find((row) => row.key === tierKey);
    if (!tier) return;
    (tierOverrides.bands || []).forEach(({ maxWeightKg, fees }) => {
      const band = tier.bands && tier.bands.find((item) => item.maxWeightKg === maxWeightKg);
      if (band) Object.assign(band.fees, fees);
    });
    if (tierOverrides.baseFees) Object.assign(tier.baseFees, tierOverrides.baseFees);
    if (tierOverrides.incrementFees) Object.assign(tier.incrementFees, tierOverrides.incrementFees);
  });
  return peakRows;
}
```

- [ ] **Step 2: Encode the four peak override maps from the source rate-card pages**

Add the following exported tables, where every override is copied directly from the 2026 peak columns:

```js
const PEAK_LOCAL_STANDARD = applyPeakOverrides(LOCAL_STANDARD, LOCAL_STANDARD_PEAK_OVERRIDES);
const PEAK_SELECTED_LOCAL_PARCEL = applyPeakOverrides(SELECTED_LOCAL_PARCEL, SELECTED_LOCAL_PARCEL_PEAK_OVERRIDES);
const PEAK_EFN_STANDARD = applyPeakOverrides(EFN_STANDARD, EFN_STANDARD_PEAK_OVERRIDES);
const PEAK_SELECTED_EFN_PARCEL = applyPeakOverrides(SELECTED_EFN_PARCEL, SELECTED_EFN_PARCEL_PEAK_OVERRIDES);
```

Populate the maps from the rate-card pages as follows:

- `LOCAL_STANDARD_PEAK_OVERRIDES`: page 7, UK/CEP/DE columns only; large envelope, extra-large envelope, small parcel, and standard parcel. Leave light/standard envelope and every oversize tier absent.
- `SELECTED_LOCAL_PARCEL_PEAK_OVERRIDES`: page 9, all seven parcel tiers, UK/CEP/DE base and per-100g values.
- `EFN_STANDARD_PEAK_OVERRIDES`: page 13, published columns `EU4`, `DE_NON_CEE`, `UK_TO_EU4`, and `EU4_TO_UK`; update extra-large-envelope only where published and both parcel tiers; leave oversize and non-published `NLBE`, `SE`, `PL`, `UK_TO_NL`, and `UK_TO_SE` columns absent.
- `SELECTED_EFN_PARCEL_PEAK_OVERRIDES`: page 15, all seven selected parcel tiers and the published `EU4`, `DE_NON_CEE`, `UK_TO_EU4`, and `EU4_TO_UK` base and per-100g values.

- [ ] **Step 3: Export the peak tables and load them in the CommonJS test wrapper**

```js
return {
  // existing exports
  PEAK_LOCAL_STANDARD,
  PEAK_SELECTED_LOCAL_PARCEL,
  PEAK_EFN_STANDARD,
  PEAK_SELECTED_EFN_PARCEL
};
```

- [ ] **Step 4: Run the focused peak tests to verify the data path now passes after calculator selection is implemented**

Run: `node --test tests/eu-peak-fulfillment-fees.test.js`

Expected: still FAIL until Task 3 selects the peak tables, then PASS with published UK and EFN fee totals.

- [ ] **Step 5: Commit the peak data**

```bash
git add History/fba-fee-data.js History/fba-fee-data.test-wrapper.cjs
git commit -m "feat: add EU festive peak fee tables"
```

### Task 3: Wire the peak toggle through the calculator and history

**Files:**
- Modify: `History/fba-eu-uk-fee-calculator.html:755-790`
- Modify: `History/fba-eu-uk-fee-calculator.html:1090-1125`
- Modify: `History/fba-eu-uk-fee-calculator.html:1309-1520`
- Modify: `History/fba-eu-uk-fee-calculator.html:1800-1975`

- [ ] **Step 1: Add the unchecked form control**

```html
<label class="toggle">
  <input id="festive-season-peak" name="festiveSeasonPeak" type="checkbox" />
  <div>
    <strong>Festive season peak</strong>
    <span>按 2026-10-15 至 2027-01-14 的公开旺季 fulfilment fee 估算；未列出旺季费率的路线和尺寸档位仍按非旺季费率。</span>
  </div>
</label>
```

- [ ] **Step 2: Read the toggle with existing form input state**

```js
festiveSeasonPeak: payload.get("festiveSeasonPeak") === "on",
```

The generic `historyInputs()` function already serializes named checkbox fields, so no separate persistence branch is necessary.

- [ ] **Step 3: Select peak or non-peak tables at the start of `computeStandardBase`**

```js
const localStandard = input.festiveSeasonPeak ? data.PEAK_LOCAL_STANDARD : data.LOCAL_STANDARD;
const selectedLocalParcel = input.festiveSeasonPeak ? data.PEAK_SELECTED_LOCAL_PARCEL : data.SELECTED_LOCAL_PARCEL;
const efnStandard = input.festiveSeasonPeak ? data.PEAK_EFN_STANDARD : data.EFN_STANDARD;
const selectedEfnParcel = input.festiveSeasonPeak ? data.PEAK_SELECTED_EFN_PARCEL : data.SELECTED_EFN_PARCEL;
```

Replace the four direct data-table lookups in that function with these selected variables. Keep `LOW_PRICE_*` and Ireland rate paths unchanged.

- [ ] **Step 4: Add peak status to the result view and warning notes**

```js
const festiveSeasonPeak = {
  enabled: input.festiveSeasonPeak,
  effectivePeriod: "October 15, 2026 to January 14, 2027",
  detail: input.festiveSeasonPeak
    ? "Using festive-season peak fulfilment fee values where Amazon published a peak column."
    : "Using 2026 non-peak fulfilment fee values."
};
```

When enabled, append this note:

```js
{
  type: "warn",
  text: "Amazon's festive peak table excludes apparel. This calculator does not collect an apparel flag, so apparel results require manual review."
}
```

Render a dedicated row above the fuel-surcharge row. It must show `Festive season peak`, the effective period, and `Applied` or `Not applied`; it must not add a separate amount because the selected base fee already includes the peak rate.

- [ ] **Step 5: Run the focused tests and confirm green**

Run: `node --test tests/eu-peak-fulfillment-fees.test.js tests/fba-surcharge-smoke.test.js tests/fba-surcharge-ui.test.js`

Expected: PASS. The existing fuel test must continue to calculate the same surcharge difference with peak mode off.

- [ ] **Step 6: Commit the calculator integration**

```bash
git add History/fba-eu-uk-fee-calculator.html tests/eu-peak-fulfillment-fees.test.js tests/fba-surcharge-ui.test.js
git commit -m "feat: add EU festive season peak option"
```

### Task 4: Publish the release metadata and verify the full site

**Files:**
- Modify: `data/versions.json`
- Modify: `index.html`
- Modify: `changelog/index.html`
- Modify: `tests/unified-site-shell.test.js` only if the entry-count or required-text assertion changes

- [ ] **Step 1: Add the EU/UK changelog entry**

Use date `2026-07-15`, title `EU/UK festive season peak fees`, and summary: `The EU/UK calculator now supports optional festive-season peak fulfilment fees for October 15, 2026 through January 14, 2027, based on the published rate card.`

Update the EU/UK card's `updatedAt` value to `2026-07-15` and status to `Festive season peak toggle available for published EU/UK routes.`

- [ ] **Step 2: Run focused release-page tests**

Run: `node --test tests/unified-site-shell.test.js tests/site-hydration.test.js`

Expected: PASS.

- [ ] **Step 3: Run the complete automated test suite**

Run: `node --test tests/*.test.js`

Expected: all tests PASS.

- [ ] **Step 4: Build the deployable static site**

Run: `npm run build`

Expected: build completes successfully and copies the updated EU calculator and fee-data files into `dist/embedded`.

- [ ] **Step 5: Commit release metadata**

```bash
git add data/versions.json index.html changelog/index.html tests/unified-site-shell.test.js
git commit -m "docs: record EU festive season peak fees"
```
