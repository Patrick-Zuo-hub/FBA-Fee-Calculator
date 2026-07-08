const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");

function createElement(id, name) {
  return {
    id,
    name,
    value: "",
    checked: false,
    required: false,
    hidden: false,
    innerHTML: "",
    textContent: "",
    className: "",
    placeholder: "",
    listeners: {},
    style: {},
    options: [],
    appendChild(child) {
      this.options.push(child);
      return child;
    },
    addEventListener(type, handler) {
      this.listeners[type] = handler;
    }
  };
}

function createNaDom() {
  const ids = [
    ["us-fee-form", ""],
    ["result-root", ""],
    ["market", "market"],
    ["market-badge", ""],
    ["market-range", ""],
    ["category-label", ""],
    ["category", "category"],
    ["price-label", ""],
    ["price-hint", ""],
    ["size-tier-guide-title", ""],
    ["size-tier-guide-intro", ""],
    ["size-tier-guide-grid", ""],
    ["dimensionUnit", "dimensionUnit"],
    ["weightUnit", "weightUnit"],
    ["length", "length"],
    ["width", "width"],
    ["height", "height"],
    ["weight", "weight"],
    ["price", "price"],
    ["fuelLogisticsSurcharge", "fuelLogisticsSurcharge"],
    ["peakFulfillmentFees", "peakFulfillmentFees"],
    ["largeStandardDimMinimum", "largeStandardDimMinimum"],
    ["sippCertified", "sippCertified"],
    ["longTermDos", "longTermDos"],
    ["shortTermDos", "shortTermDos"],
    ["groceryExempt", "groceryExempt"],
    ["newSellerExempt", "newSellerExempt"],
    ["newToFbaExempt", "newToFbaExempt"],
    ["awdExempt", "awdExempt"],
    ["slowMoverExempt", "slowMoverExempt"],
    ["us-only-section", ""],
    ["result-intro", ""],
    ["historyNote", ""],
    ["sample-small", ""],
    ["sample-overmax", ""]
  ];

  const elements = {};
  ids.forEach(([id, name]) => {
    elements[id] = createElement(id, name);
  });

  const document = {
    getElementById(id) {
      return elements[id];
    },
    createElement(tag) {
      return createElement(tag, "");
    },
    addEventListener(type, handler) {
      if (type === "DOMContentLoaded") handler();
    }
  };

  elements["us-fee-form"].__elements = elements;
  elements.market.value = "US";
  elements.category.value = "non_apparel";
  elements.dimensionUnit.value = "in";
  elements.weightUnit.value = "lb";
  return { document, elements };
}

class FakeFormData {
  constructor(form) {
    this.form = form;
  }

  get(name) {
    const element = Object.values(this.form.__elements).find((candidate) => candidate.name === name);
    if (!element) return null;
    if (element.checked === true) return "on";
    return element.value === "" ? "" : String(element.value);
  }
}

function loadCalculator() {
  const { document, elements } = createNaDom();
  const context = {
    console,
    document,
    window: {},
    globalThis: {},
    FormData: FakeFormData
  };
  context.globalThis = context;
  context.window = context;
  context.FBA_SURCHARGE_RULES = require("../History/fba-surcharge-rules.js");

  const script = fs.readFileSync(path.join(root, "History", "fba-us-local-fee-calculator.js"), "utf8");
  vm.runInNewContext(script, context);
  return { elements };
}

function submit(elements) {
  elements["us-fee-form"].listeners.submit({ preventDefault() {} });
  return elements["result-root"].innerHTML;
}

function total(markup, currency) {
  const match = markup.match(new RegExp(`${currency} ([0-9]+\\.[0-9]{2})`));
  assert.ok(match, `Expected ${currency} total in markup`);
  return Number(match[1]);
}

test("US non-apparel uses peak fulfilment base fee only when enabled", () => {
  const { elements } = loadCalculator();
  elements.market.value = "US";
  elements.category.value = "non_apparel";
  elements.dimensionUnit.value = "in";
  elements.weightUnit.value = "oz";
  elements.length.value = "13.8";
  elements.width.value = "9";
  elements.height.value = "0.7";
  elements.weight.value = "2.88";
  elements.price.value = "8.99";
  elements.fuelLogisticsSurcharge.checked = false;
  elements.sippCertified.checked = false;
  elements.peakFulfillmentFees.checked = false;

  const standardMarkup = submit(elements);
  assert.equal(total(standardMarkup, "USD"), 2.49);

  elements.peakFulfillmentFees.checked = true;
  const peakMarkup = submit(elements);

  assert.equal(total(peakMarkup, "USD"), 2.68);
  assert.match(peakMarkup, /Peak fulfilment fee/);
  assert.match(peakMarkup, /October 15, 2026/);
});

test("CA uses peak fulfilment column only when enabled", () => {
  const { elements } = loadCalculator();
  elements.market.value = "CA";
  elements.market.listeners.change();
  elements.category.value = "general";
  elements.dimensionUnit.value = "cm";
  elements.weightUnit.value = "kg";
  elements.length.value = "20.6";
  elements.width.value = "19.9";
  elements.height.value = "2.4";
  elements.weight.value = "0.222";
  elements.price.value = "";
  elements.fuelLogisticsSurcharge.checked = false;
  elements.sippCertified.checked = false;
  elements.peakFulfillmentFees.checked = false;

  const standardMarkup = submit(elements);
  assert.equal(total(standardMarkup, "CAD"), 6.36);

  elements.peakFulfillmentFees.checked = true;
  const peakMarkup = submit(elements);

  assert.equal(total(peakMarkup, "CAD"), 6.74);
  assert.match(peakMarkup, /Peak fulfilment fee/);
  assert.match(peakMarkup, /October 15, 2026/);
});

test("US apparel keeps current base fee because provided peak table excludes apparel", () => {
  const { elements } = loadCalculator();
  elements.market.value = "US";
  elements.category.value = "apparel";
  elements.dimensionUnit.value = "in";
  elements.weightUnit.value = "oz";
  elements.length.value = "13.8";
  elements.width.value = "9";
  elements.height.value = "0.7";
  elements.weight.value = "2.88";
  elements.price.value = "8.99";
  elements.fuelLogisticsSurcharge.checked = false;
  elements.sippCertified.checked = false;
  elements.peakFulfillmentFees.checked = true;

  const markup = submit(elements);

  assert.equal(total(markup, "USD"), 2.64);
  assert.match(markup, /US peak table is excluding apparel/);
});
