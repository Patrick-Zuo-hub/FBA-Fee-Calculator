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
