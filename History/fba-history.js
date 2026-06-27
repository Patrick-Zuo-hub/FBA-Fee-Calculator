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
        const nextRecords = loadRecords().map((record) => (
          record.id === recordId ? { ...record, note } : record
        ));
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
