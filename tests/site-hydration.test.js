const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "assets", "site.js"), "utf8");

function loadSiteScript(overrides = {}) {
  const notice = {
    hidden: true,
    textContent: ""
  };
  const document = {
    readyState: "loading",
    body: {
      dataset: {}
    },
    querySelector(selector) {
      if (selector === "[data-site-notice]") return notice;
      return null;
    },
    querySelectorAll() {
      return [];
    },
    addEventListener() {}
  };
  const consoleCalls = [];
  const context = {
    document,
    window: {},
    globalThis: {},
    fetch: async () => {
      throw new Error("network offline");
    },
    console: {
      error: (...args) => consoleCalls.push(args)
    },
    ...overrides
  };

  context.globalThis = context;
  context.window = context;

  vm.runInNewContext(source, context);

  return { context, document, notice, consoleCalls };
}

test("site hydration reports fallback mode when live version data fails to load", async () => {
  const { context, document, notice, consoleCalls } = loadSiteScript();

  await context.hydrateSite();

  assert.equal(document.body.dataset.siteHydration, "fallback");
  assert.equal(notice.hidden, false);
  assert.match(notice.textContent, /Static content is still available/i);
  assert.equal(consoleCalls.length, 1);
  assert.match(String(consoleCalls[0][0]), /Failed to hydrate site from \/data\/versions\.json/i);
  assert.match(String(consoleCalls[0][1]), /network offline/i);
});
