const test = require("node:test");
const assert = require("node:assert/strict");

const {
  HISTORY_LIMIT,
  createHistoryManager,
  createHistoryRecord
} = require("../History/fba-history.js");

function createStorage(initialValueByKey = {}) {
  const bucket = new Map(Object.entries(initialValueByKey));

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
    storage: createStorage({ "fba-history-na": "{not-json" })
  });

  assert.deepEqual(manager.loadRecords(), []);
});
