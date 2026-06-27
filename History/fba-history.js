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
        try {
          targetStorage.removeItem(storageKey);
        } catch {
          return;
        }
      }
    };
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatHistoryTimestamp(isoString) {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return "";
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${month}-${day} ${hours}:${minutes}`;
  }

  function renderHistoryDrawer({ records = [] } = {}) {
    const rows = records.length
      ? records.map((record) => `
        <article class="fba-history-row" data-history-id="${escapeHtml(record.id)}">
          <button type="button" class="fba-history-row__restore" data-history-restore="${escapeHtml(record.id)}">
            <span class="fba-history-row__top">
              <strong>${escapeHtml(record.note || "未命名记录")}</strong>
              <em>${escapeHtml(record.resultSummary && record.resultSummary.totalFeeLabel)}</em>
            </span>
            <span class="fba-history-row__bottom">${escapeHtml(formatHistoryTimestamp(record.createdAt))} · ${escapeHtml(record.resultSummary && record.resultSummary.dimensionsLabel)}</span>
          </button>
          <label class="fba-history-row__note">
            <span>备注</span>
            <input type="text" maxlength="60" value="${escapeHtml(record.note)}" data-history-note="${escapeHtml(record.id)}" placeholder="添加简易备注" />
          </label>
        </article>
      `).join("")
      : `<div class="fba-history-empty">还没有历史记录。成功计算一次 FBA 费用后会自动保存在这里。</div>`;

    return `
      <div class="fba-history-backdrop" data-history-close hidden></div>
      <aside class="fba-history-drawer" data-history-drawer aria-hidden="true">
        <header class="fba-history-drawer__header">
          <div>
            <h2>历史记录</h2>
            <p>最近 20 条，仅保存成功的 FBA 测算</p>
          </div>
          <button type="button" class="fba-history-close" data-history-close aria-label="关闭历史记录">×</button>
        </header>
        <div class="fba-history-list">${rows}</div>
        ${records.length ? `<button type="button" class="fba-history-clear" data-history-clear>清空全部</button>` : ""}
      </aside>
    `;
  }

  function installHistoryStyles(doc) {
    if (!doc || !doc.head || doc.getElementById("fba-history-styles")) return;
    const style = doc.createElement("style");
    style.id = "fba-history-styles";
    style.textContent = `
      .fba-history-trigger{position:fixed;top:18px;right:18px;z-index:40;border:1px solid rgba(25,49,74,.12);border-radius:999px;padding:10px 16px;background:rgba(255,255,255,.86);color:#102134;font:700 14px "Avenir Next","PingFang SC",sans-serif;box-shadow:0 12px 28px rgba(14,42,69,.14);backdrop-filter:blur(18px);cursor:pointer}
      .fba-history-backdrop{position:fixed;inset:0;z-index:80;background:rgba(16,33,52,.28);backdrop-filter:blur(4px)}
      .fba-history-drawer{position:fixed;z-index:81;top:0;right:0;width:min(440px,100vw);height:100dvh;padding:24px;background:#f7f9fb;box-shadow:-24px 0 60px rgba(14,42,69,.2);transform:translateX(105%);transition:transform .25s ease;overflow:auto;color:#102134}
      .fba-history-drawer.is-open{transform:translateX(0)}
      .fba-history-drawer__header{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:18px}
      .fba-history-drawer__header h2{margin:0;font-size:28px;letter-spacing:-.04em}
      .fba-history-drawer__header p{margin:6px 0 0;color:#5a6b7d;font-size:13px}
      .fba-history-close{width:38px;height:38px;padding:0;border-radius:50%;background:#fff;color:#102134;font-size:24px;cursor:pointer}
      .fba-history-list{display:grid;gap:10px}
      .fba-history-row{overflow:hidden;border:1px solid rgba(25,49,74,.1);border-radius:18px;background:#fff}
      .fba-history-row__restore{display:grid;width:100%;gap:8px;padding:15px 16px;border:0;border-radius:0;background:transparent;color:inherit;text-align:left;cursor:pointer}
      .fba-history-row__top{display:flex;justify-content:space-between;gap:12px;align-items:center}
      .fba-history-row__top strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .fba-history-row__top em{flex:none;color:#0f6cbd;font-style:normal;font-weight:800}
      .fba-history-row__bottom{overflow:hidden;color:#5a6b7d;font-size:12px;text-overflow:ellipsis;white-space:nowrap}
      .fba-history-row__note{display:flex;align-items:center;gap:8px;padding:9px 16px;border-top:1px solid rgba(25,49,74,.08);color:#5a6b7d;font-size:12px}
      .fba-history-row__note input{min-width:0;flex:1;border:0;background:transparent;color:#102134;font:inherit;outline:none}
      .fba-history-empty{padding:24px;border:1px dashed rgba(15,108,189,.25);border-radius:18px;color:#5a6b7d;line-height:1.65}
      .fba-history-clear{width:100%;margin-top:18px;padding:12px;border:0;border-radius:999px;background:#fff;color:#b34836;font-weight:700;cursor:pointer}
      @media(max-width:640px){.fba-history-trigger{top:12px;right:12px;padding:9px 13px}.fba-history-drawer{width:100vw;padding:20px 16px}}
    `;
    doc.head.appendChild(style);
  }

  function mountHistoryDrawer({ manager, onRestore, document: doc = globalScope.document }) {
    if (!manager || !doc || !doc.body) return null;
    installHistoryStyles(doc);
    const trigger = doc.createElement("button");
    trigger.type = "button";
    trigger.className = "fba-history-trigger";
    trigger.textContent = "历史记录";
    const root = doc.createElement("div");
    root.className = "fba-history-root";
    doc.body.appendChild(trigger);
    doc.body.appendChild(root);

    function refresh() {
      root.innerHTML = renderHistoryDrawer({ records: manager.loadRecords() });
    }

    function open() {
      refresh();
      root.querySelector("[data-history-close]").hidden = false;
      const drawer = root.querySelector("[data-history-drawer]");
      drawer.classList.add("is-open");
      drawer.setAttribute("aria-hidden", "false");
    }

    function close() {
      const backdrop = root.querySelector(".fba-history-backdrop");
      const drawer = root.querySelector("[data-history-drawer]");
      if (backdrop) backdrop.hidden = true;
      if (drawer) {
        drawer.classList.remove("is-open");
        drawer.setAttribute("aria-hidden", "true");
      }
    }

    trigger.addEventListener("click", open);
    root.addEventListener("click", (event) => {
      const closeButton = event.target.closest("[data-history-close]");
      if (closeButton) {
        close();
        return;
      }
      const clearButton = event.target.closest("[data-history-clear]");
      if (clearButton && globalScope.confirm("确定清空全部 FBA 历史记录吗？")) {
        manager.clearRecords();
        refresh();
        return;
      }
      const restoreButton = event.target.closest("[data-history-restore]");
      if (!restoreButton) return;
      const record = manager.loadRecords().find((item) => item.id === restoreButton.dataset.historyRestore);
      if (record && typeof onRestore === "function") {
        onRestore(record);
        close();
      }
    });
    root.addEventListener("change", (event) => {
      if (!event.target.matches("[data-history-note]")) return;
      manager.updateNote(event.target.dataset.historyNote, event.target.value.trim());
      refresh();
    });
    refresh();
    return { open, close, refresh };
  }

  const api = {
    HISTORY_LIMIT,
    createHistoryManager,
    createHistoryRecord,
    formatHistoryTimestamp,
    mountHistoryDrawer,
    renderHistoryDrawer
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  globalScope.FBA_HISTORY = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
