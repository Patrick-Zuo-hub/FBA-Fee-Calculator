const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "assets", "site.js"), "utf8");

function readPage(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function loadSiteScript(documentOverrides = {}) {
  const nav = {
    dataset: {},
    setAttribute(name, value) {
      this[name] = value;
    }
  };
  const menuButton = {
    attributes: {
      "aria-expanded": "false"
    },
    listeners: {},
    addEventListener(type, handler) {
      this.listeners[type] = handler;
    },
    getAttribute(name) {
      return this.attributes[name];
    },
    setAttribute(name, value) {
      this.attributes[name] = value;
    }
  };
  const navLinks = {
    listeners: {},
    addEventListener(type, handler) {
      this.listeners[type] = handler;
    }
  };

  const document = {
    readyState: "loading",
    body: { dataset: {} },
    querySelector(selector) {
      if (selector === "[data-nav-shell]") return nav;
      if (selector === "[data-nav-toggle]") return menuButton;
      if (selector === "[data-nav-links]") return navLinks;
      if (selector === "[data-site-notice]") return null;
      return null;
    },
    querySelectorAll() {
      return [];
    },
    addEventListener() {},
    ...documentOverrides
  };

  const context = {
    document,
    window: {},
    globalThis: {},
    fetch: async () => ({ ok: true, json: async () => ({}) }),
    console
  };

  context.globalThis = context;
  context.window = context;

  vm.runInNewContext(source, context);

  return { context, nav, menuButton, navLinks };
}

test("shared pages include a mobile menu button and collapsible nav links", () => {
  [
    "index.html",
    "na/index.html",
    "eu-uk/index.html",
    "walmart/index.html",
    "changelog/index.html"
  ].forEach((file) => {
    const html = readPage(file);
    assert.match(html, /<nav class="site-nav" data-nav-shell>/);
    assert.match(html, /<button[^>]*class="nav-toggle"[^>]*data-nav-toggle/);
    assert.match(html, /aria-expanded="false"/);
    assert.match(html, /aria-controls="site-nav-links"/);
    assert.match(html, /<div class="nav-links" id="site-nav-links" data-nav-links>/);
  });
});

test("site nav toggle opens and closes the mobile navigation state", () => {
  const { context, nav, menuButton, navLinks } = loadSiteScript();

  context.initSiteNav();
  assert.equal(menuButton.getAttribute("aria-expanded"), "false");
  assert.equal(nav.dataset.navOpen, "false");

  menuButton.listeners.click();
  assert.equal(menuButton.getAttribute("aria-expanded"), "true");
  assert.equal(nav.dataset.navOpen, "true");

  navLinks.listeners.click({ target: { closest: () => ({}) } });
  assert.equal(menuButton.getAttribute("aria-expanded"), "false");
  assert.equal(nav.dataset.navOpen, "false");
});
