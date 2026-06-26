# FBA History Local Cache Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-page recent FBA calculation history backed by `localStorage`, with a right-side history drawer, inline note editing, direct restore behavior, and a moved primary calculate button.

**Architecture:** Introduce one shared browser-side history helper that owns record shape, safe `localStorage` access, FIFO trimming, note updates, and drawer markup generation. Wire the helper into each calculator page so successful FBA calculations append a record, history rows restore the full FBA form/result state, and the profit estimator remains out of scope.

**Tech Stack:** Static HTML, vanilla browser JavaScript, shared helper script, Node.js built-in test runner

---

## File Structure

**New shared unit**
- Create: `/Users/patrick/Documents/FBA Fee Calculate/History/fba-history.js`
  - Responsibility: shared record model, safe storage wrapper, insert/trim/load/update/clear helpers, drawer/list-row markup, compact timestamp formatting

**Pages to integrate**
- Modify: `/Users/patrick/Documents/FBA Fee Calculate/History/fba-us-local-fee-calculator.html`
- Modify: `/Users/patrick/Documents/FBA Fee Calculate/History/fba-us-local-fee-calculator.js`
- Modify: `/Users/patrick/Documents/FBA Fee Calculate/History/fba-eu-uk-fee-calculator.html`
- Modify: `/Users/patrick/Documents/FBA Fee Calculate/History/walmart-wfs-fee-calculator.html`
- Modify: `/Users/patrick/Documents/FBA Fee Calculate/History/walmart-wfs-fee-calculator.js`

**Build pipeline**
- Modify: `/Users/patrick/Documents/FBA Fee Calculate/scripts/build-deploy-site.js`
- Modify: `/Users/patrick/Documents/FBA Fee Calculate/tests/deploy-build.test.js`

**Tests**
- Create: `/Users/patrick/Documents/FBA Fee Calculate/tests/fba-history-core.test.js`
- Create: `/Users/patrick/Documents/FBA Fee Calculate/tests/fba-history-ui.test.js`
- Create: `/Users/patrick/Documents/FBA Fee Calculate/tests/fba-history-na-smoke.test.js`
- Create: `/Users/patrick/Documents/FBA Fee Calculate/tests/fba-history-storage-failure.test.js`

This decomposition keeps storage and rendering rules in one shared file, then uses the NA page as the integration proving ground before touching EU/UK and Walmart.

### Task 1: Build the shared history helper with TDD

**Files:**
- Create: `/Users/patrick/Documents/FBA Fee Calculate/tests/fba-history-core.test.js`
- Create: `/Users/patrick/Documents/FBA Fee Calculate/History/fba-history.js`

- [ ] **Step 1: Write the failing core history test**

Create `/Users/patrick/Documents/FBA Fee Calculate/tests/fba-history-core.test.js` with exact expectations for record insertion, FIFO trimming, note updates, and malformed-storage fallback:

```js
const test = require("node:test");
const assert = require("node:assert/strict");

const {
  HISTORY_LIMIT,
  createHistoryManager,
  createHistoryRecord
} = require("../History/fba-history.js");

function createStorage(initialValue) {
  const bucket = new Map();
  if (initialValue !== undefined) {
    bucket.set("fba-history-na", initialValue);
  }
  return {
    getItem(key) {
      return bucket.has(key) ? bucket.get(key) : null;
    },
    setItem(key, value) {
      bucket.set(key, value);
    },
    removeItem(key) {
      bucket.delete(key);
    }
  };
}

test("history manager prepends records and trims to the newest 20", () => {
  const manager = createHistoryManager({
    storageKey: "fba-history-na",
    storage: createStorage()
  });

  for (let index = 0; index < 21; index += 1) {
    manager.saveRecord(createHistoryRecord({
      note: `record-${index}`,
      inputs: { length: index + 1 },
      resultSummary: { totalFee: index + 0.5, dimensionsLabel: `${index} x ${index} x ${index}` }
    }));
  }

  const records = manager.loadRecords();
  assert.equal(HISTORY_LIMIT, 20);
  assert.equal(records.length, 20);
  assert.equal(records[0].note, "record-20");
  assert.equal(records.at(-1).note, "record-1");
});

test("history manager updates note by record id", () => {
  const manager = createHistoryManager({
    storageKey: "fba-history-na",
    storage: createStorage()
  });
  const created = createHistoryRecord({
    note: "",
    inputs: { length: 13.8 },
    resultSummary: { totalFee: 3.17, dimensionsLabel: "13.8 x 9 x 0.7 in" }
  });

  manager.saveRecord(created);
  manager.updateNote(created.id, "轻小件测试");

  const records = manager.loadRecords();
  assert.equal(records[0].note, "轻小件测试");
});

test("history manager ignores malformed storage payloads", () => {
  const manager = createHistoryManager({
    storageKey: "fba-history-na",
    storage: createStorage("{not-json")
  });

  assert.deepEqual(manager.loadRecords(), []);
});
```

- [ ] **Step 2: Run the new test to verify it fails**

Run:

```bash
node --test ./tests/fba-history-core.test.js
```

Expected: FAIL because `/Users/patrick/Documents/FBA Fee Calculate/History/fba-history.js` does not exist yet.

- [ ] **Step 3: Write the minimal shared implementation**

Create `/Users/patrick/Documents/FBA Fee Calculate/History/fba-history.js` with safe storage access and pure helpers:

```js
(function (globalScope) {
  "use strict";

  const HISTORY_LIMIT = 20;

  function nowIso() {
    return new Date().toISOString();
  }

  function randomId() {
    return `hist_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }

  function safeJsonParse(value) {
    if (!value) return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function createHistoryRecord({ id, createdAt, note, inputs, resultSummary }) {
    return {
      id: id || randomId(),
      createdAt: createdAt || nowIso(),
      note: note || "",
      inputs: inputs || {},
      resultSummary: resultSummary || {}
    };
  }

  function trimRecords(records) {
    return records.slice(0, HISTORY_LIMIT);
  }

  function createHistoryManager({ storageKey, storage }) {
    const targetStorage = storage || globalScope.localStorage;

    function loadRecords() {
      if (!targetStorage || typeof targetStorage.getItem !== "function") return [];
      return safeJsonParse(targetStorage.getItem(storageKey));
    }

    function persist(records) {
      if (!targetStorage || typeof targetStorage.setItem !== "function") return records;
      targetStorage.setItem(storageKey, JSON.stringify(records));
      return records;
    }

    return {
      loadRecords,
      saveRecord(record) {
        const nextRecords = trimRecords([record, ...loadRecords()]);
        return persist(nextRecords);
      },
      updateNote(recordId, note) {
        const nextRecords = loadRecords().map((record) => {
          return record.id === recordId ? { ...record, note } : record;
        });
        return persist(nextRecords);
      },
      clearRecords() {
        if (!targetStorage || typeof targetStorage.removeItem !== "function") return;
        targetStorage.removeItem(storageKey);
      }
    };
  }

  const api = {
    HISTORY_LIMIT,
    createHistoryManager,
    createHistoryRecord
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  globalScope.FBA_HISTORY = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
```

- [ ] **Step 4: Run the core test to verify it passes**

Run:

```bash
node --test ./tests/fba-history-core.test.js
```

Expected: PASS with 3 passing tests.

- [ ] **Step 5: Commit the shared helper**

```bash
git add History/fba-history.js tests/fba-history-core.test.js
git commit -m "feat: add shared FBA history helper"
```

### Task 2: Add shared drawer markup helpers and static UI coverage

**Files:**
- Modify: `/Users/patrick/Documents/FBA Fee Calculate/History/fba-history.js`
- Create: `/Users/patrick/Documents/FBA Fee Calculate/tests/fba-history-ui.test.js`
- Modify: `/Users/patrick/Documents/FBA Fee Calculate/History/fba-us-local-fee-calculator.html`
- Modify: `/Users/patrick/Documents/FBA Fee Calculate/History/fba-eu-uk-fee-calculator.html`
- Modify: `/Users/patrick/Documents/FBA Fee Calculate/History/walmart-wfs-fee-calculator.html`

- [ ] **Step 1: Write the failing UI coverage test**

Create `/Users/patrick/Documents/FBA Fee Calculate/tests/fba-history-ui.test.js` to lock the shared shell and button placement:

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("shared history helper renders the drawer shell", () => {
  const helper = read("History/fba-history.js");
  assert.match(helper, /历史记录/);
  assert.match(helper, /最近 20 条，仅保存成功的 FBA 测算/);
  assert.match(helper, /清空全部/);
  assert.match(helper, /未命名记录/);
});

test("all calculator pages load the shared history helper script", () => {
  [
    "History/fba-us-local-fee-calculator.html",
    "History/fba-eu-uk-fee-calculator.html",
    "History/walmart-wfs-fee-calculator.html"
  ].forEach((file) => {
    assert.match(read(file), /fba-history\\.js/);
  });
});

test("NA page moves the primary calculate button above advanced conditions", () => {
  const html = read("History/fba-us-local-fee-calculator.html");
  const buttonIndex = html.indexOf("计算北美 FBA 费用");
  const advancedIndex = html.indexOf("附加条件");
  assert.ok(buttonIndex !== -1 && advancedIndex !== -1 && buttonIndex < advancedIndex);
});
```

- [ ] **Step 2: Run the UI test to verify it fails**

Run:

```bash
node --test ./tests/fba-history-ui.test.js
```

Expected: FAIL because the helper does not yet render history UI strings and the pages do not load `fba-history.js`.

- [ ] **Step 3: Extend the shared helper and page shells**

Add compact drawer rendering to `/Users/patrick/Documents/FBA Fee Calculate/History/fba-history.js`:

```js
  function formatHistoryTimestamp(isoString) {
    const date = new Date(isoString);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${month}-${day} ${hours}:${minutes}`;
  }

  function renderHistoryDrawer({ title, helperText, records }) {
    return `
      <aside class="history-drawer" data-history-drawer hidden>
        <div class="history-drawer__header">
          <div>
            <h3>${title || "历史记录"}</h3>
            <p>${helperText || "最近 20 条，仅保存成功的 FBA 测算"}</p>
          </div>
          <button type="button" class="history-clear" data-history-clear>清空全部</button>
        </div>
        <div class="history-list" data-history-list>
          ${records.map((record) => `
            <button type="button" class="history-row" data-history-id="${record.id}">
              <span class="history-row__top">
                <strong>${record.note || "未命名记录"}</strong>
                <em>${record.resultSummary.totalFeeLabel}</em>
              </span>
              <span class="history-row__bottom">${formatHistoryTimestamp(record.createdAt)} · ${record.resultSummary.dimensionsLabel}</span>
            </button>
          `).join("")}
        </div>
      </aside>
    `;
  }
```

Load the script in each page head:

```html
<script defer src="./fba-history.js"></script>
```

Move the primary calculate button block in the NA page to directly follow the dimension / weight inputs and add an advanced section heading:

```html
<div class="actions actions--primary">
  <button type="submit" class="primary">计算北美 FBA 费用</button>
  <button type="button" id="sample-small" class="secondary">载入轻量示例</button>
  <button type="button" id="sample-overmax" class="secondary">载入大件示例</button>
</div>

<h3 class="subsection-heading">附加条件</h3>
```

- [ ] **Step 4: Run the UI test to verify it passes**

Run:

```bash
node --test ./tests/fba-history-ui.test.js
```

Expected: PASS with 3 passing tests.

- [ ] **Step 5: Commit the shared shell work**

```bash
git add History/fba-history.js History/fba-us-local-fee-calculator.html History/fba-eu-uk-fee-calculator.html History/walmart-wfs-fee-calculator.html tests/fba-history-ui.test.js
git commit -m "feat: add shared FBA history drawer shell"
```

### Task 3: Wire NA history save, restore, note edit, and clear behavior

**Files:**
- Modify: `/Users/patrick/Documents/FBA Fee Calculate/History/fba-us-local-fee-calculator.js`
- Create: `/Users/patrick/Documents/FBA Fee Calculate/tests/fba-history-na-smoke.test.js`

- [ ] **Step 1: Write the failing NA smoke test**

Create `/Users/patrick/Documents/FBA Fee Calculate/tests/fba-history-na-smoke.test.js` to prove the real workflow:

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");

// Reuse the same fake DOM style already used in profit-estimator-na-smoke.test.js.

test("successful NA calculations append history rows and invalid ones do not", () => {
  const setup = loadNaCalculatorWithHistory();
  setup.elements["sample-small"].listeners.click();
  assert.match(setup.elements["result-root"].innerHTML, /历史记录/);
  assert.match(setup.storage.getItem("fba-history-na"), /USD 3\\.17/);

  setup.elements.length.value = "";
  setup.elements["us-fee-form"].listeners.submit({ preventDefault() {} });
  const records = JSON.parse(setup.storage.getItem("fba-history-na"));
  assert.equal(records.length, 1);
});

test("clicking a saved NA history row restores the saved form and result", () => {
  const setup = loadNaCalculatorWithHistory();
  setup.elements["sample-small"].listeners.click();
  setup.elements.length.value = "99";
  setup.triggerHistoryRestore();
  assert.equal(setup.elements.length.value, "13.8");
  assert.match(setup.elements["result-root"].innerHTML, /USD 3\\.17/);
});

test("editing note and clearing history persist through the shared manager", () => {
  const setup = loadNaCalculatorWithHistory();
  setup.elements["sample-small"].listeners.click();
  setup.triggerNoteSave("轻小件测试");
  assert.match(setup.storage.getItem("fba-history-na"), /轻小件测试/);
  setup.triggerClearAll();
  assert.equal(setup.storage.getItem("fba-history-na"), null);
});
```

- [ ] **Step 2: Run the NA smoke test to verify it fails**

Run:

```bash
node --test ./tests/fba-history-na-smoke.test.js
```

Expected: FAIL because the NA calculator does not yet create or restore history.

- [ ] **Step 3: Implement minimal NA integration**

Extend `/Users/patrick/Documents/FBA Fee Calculate/History/fba-us-local-fee-calculator.js` with a page-local history manager, record builder, restore handler, and drawer toggles:

```js
  const historyApi = globalThis.FBA_HISTORY || {};

  function createNaHistoryManager() {
    if (typeof historyApi.createHistoryManager !== "function") return null;
    return historyApi.createHistoryManager({
      storageKey: "fba-history-na",
      storage: globalThis.localStorage
    });
  }

  function buildNaHistoryRecord(input, view) {
    return historyApi.createHistoryRecord({
      note: "",
      inputs: {
        market: input.market,
        category: input.category,
        length: String(input.lengthRaw),
        width: String(input.widthRaw),
        height: String(input.heightRaw),
        weight: String(input.weightRaw),
        price: input.price == null ? "" : String(input.price),
        dimensionUnit: input.dimensionUnit,
        weightUnit: input.weightUnit,
        fuelLogisticsSurcharge: input.fuelLogisticsSurcharge,
        largeStandardDimMinimum: input.largeStandardDimMinimum,
        sippCertified: input.sippCertified,
        longTermDos: input.longTermDos == null ? "" : String(input.longTermDos),
        shortTermDos: input.shortTermDos == null ? "" : String(input.shortTermDos)
      },
      resultSummary: {
        totalFee: view.total,
        totalFeeLabel: view.total == null ? "需人工复核" : money(view.total, view.market),
        dimensionsLabel: `${input.lengthRaw} × ${input.widthRaw} × ${input.heightRaw} ${input.dimensionUnit}`
      }
    });
  }

  function saveNaHistory(input, view) {
    if (!dom.historyManager || view.total == null) return;
    dom.historyManager.saveRecord(buildNaHistoryRecord(input, view));
  }
```

When restore is clicked:

```js
  function applyNaHistoryRecord(record) {
    dom.market.value = record.inputs.market;
    dom.category.value = record.inputs.category;
    dom.length.value = record.inputs.length;
    dom.width.value = record.inputs.width;
    dom.height.value = record.inputs.height;
    dom.weight.value = record.inputs.weight;
    dom.price.value = record.inputs.price;
    dom.dimensionUnit.value = record.inputs.dimensionUnit;
    dom.weightUnit.value = record.inputs.weightUnit;
    dom.fuelLogisticsSurcharge.checked = record.inputs.fuelLogisticsSurcharge;
    dom.largeStandardDimMinimum.checked = record.inputs.largeStandardDimMinimum;
    dom.sippCertified.checked = record.inputs.sippCertified;
    dom.longTermDos.value = record.inputs.longTermDos;
    dom.shortTermDos.value = record.inputs.shortTermDos;
    calculate();
  }
```

- [ ] **Step 4: Run the NA smoke test to verify it passes**

Run:

```bash
node --test ./tests/fba-history-na-smoke.test.js
```

Expected: PASS with 3 passing tests.

- [ ] **Step 5: Commit the NA integration**

```bash
git add History/fba-us-local-fee-calculator.js tests/fba-history-na-smoke.test.js
git commit -m "feat: add NA FBA history restore flow"
```

### Task 4: Lock graceful degradation when storage is unavailable

**Files:**
- Create: `/Users/patrick/Documents/FBA Fee Calculate/tests/fba-history-storage-failure.test.js`
- Modify: `/Users/patrick/Documents/FBA Fee Calculate/History/fba-history.js`
- Modify: `/Users/patrick/Documents/FBA Fee Calculate/History/fba-us-local-fee-calculator.js`

- [ ] **Step 1: Write the failing storage-failure test**

Create `/Users/patrick/Documents/FBA Fee Calculate/tests/fba-history-storage-failure.test.js`:

```js
const test = require("node:test");
const assert = require("node:assert/strict");

const { createHistoryManager, createHistoryRecord } = require("../History/fba-history.js");

test("history manager fails soft when storage throws", () => {
  const manager = createHistoryManager({
    storageKey: "fba-history-na",
    storage: {
      getItem() { throw new Error("blocked"); },
      setItem() { throw new Error("blocked"); },
      removeItem() { throw new Error("blocked"); }
    }
  });

  assert.deepEqual(manager.loadRecords(), []);
  assert.doesNotThrow(() => manager.saveRecord(createHistoryRecord({
    note: "",
    inputs: {},
    resultSummary: { totalFee: 3.17, dimensionsLabel: "13.8 x 9 x 0.7 in" }
  })));
  assert.doesNotThrow(() => manager.clearRecords());
});
```

- [ ] **Step 2: Run the storage-failure test to verify it fails**

Run:

```bash
node --test ./tests/fba-history-storage-failure.test.js
```

Expected: FAIL because the current shared helper does not catch storage exceptions.

- [ ] **Step 3: Add try/catch guards for storage access**

Update `/Users/patrick/Documents/FBA Fee Calculate/History/fba-history.js` to catch storage access failures:

```js
    function loadRecords() {
      if (!targetStorage || typeof targetStorage.getItem !== "function") return [];
      try {
        return safeJsonParse(targetStorage.getItem(storageKey));
      } catch {
        return [];
      }
    }

    function persist(records) {
      if (!targetStorage || typeof targetStorage.setItem !== "function") return records;
      try {
        targetStorage.setItem(storageKey, JSON.stringify(records));
      } catch {
        return records;
      }
      return records;
    }

    function clearRecords() {
      if (!targetStorage || typeof targetStorage.removeItem !== "function") return;
      try {
        targetStorage.removeItem(storageKey);
      } catch {}
    }
```

Ensure the NA page tolerates a null / empty manager and still renders normal calculation results.

- [ ] **Step 4: Run the storage-failure test to verify it passes**

Run:

```bash
node --test ./tests/fba-history-storage-failure.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit graceful-degradation handling**

```bash
git add History/fba-history.js History/fba-us-local-fee-calculator.js tests/fba-history-storage-failure.test.js
git commit -m "fix: degrade gracefully when FBA history storage fails"
```

### Task 5: Extend the shared history flow to EU & UK

**Files:**
- Modify: `/Users/patrick/Documents/FBA Fee Calculate/History/fba-eu-uk-fee-calculator.html`
- Modify: `/Users/patrick/Documents/FBA Fee Calculate/tests/fba-history-ui.test.js`

- [ ] **Step 1: Extend the UI test for EU & UK behavior markers**

Update `/Users/patrick/Documents/FBA Fee Calculate/tests/fba-history-ui.test.js` to assert the EU & UK page uses the dedicated storage key and renders the history button:

```js
test("EU & UK page wires the shared history drawer", () => {
  const html = read("History/fba-eu-uk-fee-calculator.html");
  assert.match(html, /fba-history\\.js/);
  assert.match(html, /fba-history-eu-uk/);
  assert.match(html, /History/);
});
```

- [ ] **Step 2: Run the UI test to verify the EU & UK assertion fails**

Run:

```bash
node --test ./tests/fba-history-ui.test.js
```

Expected: FAIL on the EU & UK history wiring assertion.

- [ ] **Step 3: Implement EU & UK history integration**

In `/Users/patrick/Documents/FBA Fee Calculate/History/fba-eu-uk-fee-calculator.html`, mirror the NA pattern with page-specific record building:

```js
    const historyApi = window.FBA_HISTORY || {};

    function createEuHistoryManager() {
      if (typeof historyApi.createHistoryManager !== "function") return null;
      return historyApi.createHistoryManager({
        storageKey: "fba-history-eu-uk",
        storage: window.localStorage
      });
    }

    function buildEuHistoryRecord(input, view) {
      return historyApi.createHistoryRecord({
        note: "",
        inputs: {
          origin: input.origin,
          destination: input.destination,
          length: String(input.length),
          width: String(input.width),
          height: String(input.height),
          weight: String(input.weightKg),
          price: input.price == null ? "" : String(input.price),
          panEu: input.panEu,
          useLowPrice: input.useLowPrice,
          cepEnrolled: input.cepEnrolled,
          hazmat: input.hazmat,
          sipp: input.sipp
        },
        resultSummary: {
          totalFee: view.primaryTotal,
          totalFeeLabel: `${view.currency} ${view.primaryTotal.toFixed(2)}`,
          dimensionsLabel: `${input.length} × ${input.width} × ${input.height} cm`
        }
      });
    }
```

Only save after successful result rendering.

- [ ] **Step 4: Re-run the UI test to verify it passes**

Run:

```bash
node --test ./tests/fba-history-ui.test.js
```

Expected: PASS with the new EU & UK assertion included.

- [ ] **Step 5: Commit the EU & UK integration**

```bash
git add History/fba-eu-uk-fee-calculator.html tests/fba-history-ui.test.js
git commit -m "feat: add EU and UK FBA history integration"
```

### Task 6: Extend the shared history flow to Walmart

**Files:**
- Modify: `/Users/patrick/Documents/FBA Fee Calculate/History/walmart-wfs-fee-calculator.js`
- Modify: `/Users/patrick/Documents/FBA Fee Calculate/tests/fba-history-ui.test.js`

- [ ] **Step 1: Extend the UI test for Walmart wiring**

Update `/Users/patrick/Documents/FBA Fee Calculate/tests/fba-history-ui.test.js`:

```js
test("Walmart page wires the shared history drawer", () => {
  const html = read("History/walmart-wfs-fee-calculator.html");
  const script = read("History/walmart-wfs-fee-calculator.js");
  assert.match(html, /fba-history\\.js/);
  assert.match(script, /fba-history-walmart/);
  assert.match(script, /renderHistory/);
});
```

- [ ] **Step 2: Run the UI test to verify the Walmart assertion fails**

Run:

```bash
node --test ./tests/fba-history-ui.test.js
```

Expected: FAIL on the Walmart history assertion.

- [ ] **Step 3: Implement Walmart history integration**

Add page-specific save/restore logic in `/Users/patrick/Documents/FBA Fee Calculate/History/walmart-wfs-fee-calculator.js`:

```js
  function createWalmartHistoryManager() {
    if (typeof historyApi.createHistoryManager !== "function") return null;
    return historyApi.createHistoryManager({
      storageKey: "fba-history-walmart",
      storage: globalThis.localStorage
    });
  }

  function buildWalmartHistoryRecord(input, view) {
    return historyApi.createHistoryRecord({
      note: "",
      inputs: {
        retailPrice: String(input.retailPrice),
        quantity: String(input.quantity),
        dimensionUnit: input.dimensionUnit,
        weightUnit: input.weightUnit,
        length: String(input.lengthRaw),
        width: String(input.widthRaw),
        height: String(input.heightRaw),
        weight: String(input.weightRaw),
        storageWindow: input.storageWindow,
        isApparel: input.isApparel,
        isHazmat: input.isHazmat,
        missingLabel: input.missingLabel,
        missingPolybag: input.missingPolybag
      },
      resultSummary: {
        totalFee: view.fulfillment.total,
        totalFeeLabel: money(view.fulfillment.total),
        dimensionsLabel: `${input.lengthRaw} × ${input.widthRaw} × ${input.heightRaw} ${input.dimensionUnit}`
      }
    });
  }
```

- [ ] **Step 4: Re-run the UI test to verify it passes**

Run:

```bash
node --test ./tests/fba-history-ui.test.js
```

Expected: PASS with all page-wiring assertions.

- [ ] **Step 5: Commit the Walmart integration**

```bash
git add History/walmart-wfs-fee-calculator.js tests/fba-history-ui.test.js
git commit -m "feat: add Walmart FBA history integration"
```

### Task 7: Publish the shared helper and run full verification

**Files:**
- Modify: `/Users/patrick/Documents/FBA Fee Calculate/scripts/build-deploy-site.js`
- Modify: `/Users/patrick/Documents/FBA Fee Calculate/tests/deploy-build.test.js`

- [ ] **Step 1: Add a failing deploy-build expectation for the new helper**

Extend `/Users/patrick/Documents/FBA Fee Calculate/tests/deploy-build.test.js`:

```js
  [
    "fba-us-local-fee-calculator.html",
    "fba-us-local-fee-calculator.js",
    "fba-eu-uk-fee-calculator.html",
    "fba-fee-data.js",
    "fba-surcharge-rules.js",
    "profit-estimator.js",
    "fba-history.js",
    "walmart-wfs-fee-calculator.html",
    "walmart-wfs-fee-calculator.js"
  ].forEach((filename) => {
    assert.ok(fs.existsSync(path.join(distRoot, "embedded", filename)), `${filename} should be published`);
  });
```

- [ ] **Step 2: Run the deploy-build test to verify it fails**

Run:

```bash
node --test ./tests/deploy-build.test.js
```

Expected: FAIL because `fba-history.js` is not yet copied into `dist/embedded`.

- [ ] **Step 3: Publish the helper in the deploy build**

Update `/Users/patrick/Documents/FBA Fee Calculate/scripts/build-deploy-site.js`:

```js
const embeddedFiles = [
  "fba-us-local-fee-calculator.html",
  "fba-us-local-fee-calculator.js",
  "fba-eu-uk-fee-calculator.html",
  "fba-fee-data.js",
  "fba-surcharge-rules.js",
  "profit-estimator.js",
  "fba-history.js",
  "walmart-wfs-fee-calculator.html",
  "walmart-wfs-fee-calculator.js"
];
```

- [ ] **Step 4: Run full verification**

Run:

```bash
node --test ./tests/fba-history-core.test.js
node --test ./tests/fba-history-ui.test.js
node --test ./tests/fba-history-na-smoke.test.js
node --test ./tests/fba-history-storage-failure.test.js
npm test
npm run build
```

Expected:
- all focused history tests PASS
- `npm test` PASS
- `npm run build` PASS

- [ ] **Step 5: Commit the published build and verification**

```bash
git add scripts/build-deploy-site.js tests/deploy-build.test.js
git commit -m "fix: publish FBA history helper in deploy build"
```

## Self-Review

**Spec coverage**
- page-local `localStorage` history: Task 1 and page integrations in Tasks 3, 5, 6
- right-side history drawer and compact rows: Task 2
- restore on click: Task 3 and mirrored in Tasks 5, 6
- note editing: Task 3 shared through Task 1 helper
- button relocation: Task 2
- `20`-record cap with FIFO trimming: Task 1
- graceful degradation when storage fails: Task 4
- deploy build publishing of shared helper: Task 7

**Placeholder scan**
- No `TBD`, `TODO`, or “similar to previous task” placeholders remain
- Every implementation step includes explicit code snippets
- Every verification step includes exact commands and expected outcomes

**Type consistency**
- Shared API names used consistently: `createHistoryManager`, `createHistoryRecord`
- Storage keys are fixed and page-specific: `fba-history-na`, `fba-history-eu-uk`, `fba-history-walmart`
- Result summary property names stay consistent: `totalFee`, `totalFeeLabel`, `dimensionsLabel`
