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
    appendChild(child) {
      if (!this.options) this.options = [];
      this.options.push(child);
      return child;
    },
    addEventListener(type, handler) {
      this.listeners[type] = handler;
    }
  };
}

function createDocument(ids, immediateDomReady = false) {
  const elements = {};
  ids.forEach(({ id, name }) => {
    elements[id] = createElement(id, name);
  });

  const document = {
    __elements: elements,
    getElementById(id) {
      return elements[id];
    },
    createElement(tag) {
      return createElement(tag, "");
    },
    addEventListener(type, handler) {
      if (type === "DOMContentLoaded" && immediateDomReady) {
        handler();
      }
    }
  };

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

function createUsHarness() {
  const { document, elements } = createDocument([
    { id: "us-fee-form", name: "" },
    { id: "result-root", name: "" },
    { id: "market", name: "market" },
    { id: "market-badge", name: "" },
    { id: "market-range", name: "" },
    { id: "category-label", name: "" },
    { id: "category", name: "category" },
    { id: "price-label", name: "" },
    { id: "price-hint", name: "" },
    { id: "size-tier-guide-title", name: "" },
    { id: "size-tier-guide-intro", name: "" },
    { id: "size-tier-guide-grid", name: "" },
    { id: "dimensionUnit", name: "dimensionUnit" },
    { id: "weightUnit", name: "weightUnit" },
    { id: "length", name: "length" },
    { id: "width", name: "width" },
    { id: "height", name: "height" },
    { id: "weight", name: "weight" },
    { id: "price", name: "price" },
    { id: "fuelLogisticsSurcharge", name: "fuelLogisticsSurcharge" },
    { id: "largeStandardDimMinimum", name: "largeStandardDimMinimum" },
    { id: "sippCertified", name: "sippCertified" },
    { id: "longTermDos", name: "longTermDos" },
    { id: "shortTermDos", name: "shortTermDos" },
    { id: "groceryExempt", name: "groceryExempt" },
    { id: "newSellerExempt", name: "newSellerExempt" },
    { id: "newToFbaExempt", name: "newToFbaExempt" },
    { id: "awdExempt", name: "awdExempt" },
    { id: "slowMoverExempt", name: "slowMoverExempt" },
    { id: "us-only-section", name: "" },
    { id: "result-intro", name: "" },
    { id: "sample-small", name: "" },
    { id: "sample-overmax", name: "" }
  ], true);

  elements["us-fee-form"].__elements = elements;
  elements.market.value = "US";
  elements.category.value = "non_apparel";
  elements.dimensionUnit.value = "in";
  elements.weightUnit.value = "lb";
  elements.price.value = "19.99";
  elements.fuelLogisticsSurcharge.checked = false;

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

test("US Large standard-size uses actual dimensions by default and 2-inch minimum when enabled", () => {
  const { elements } = createUsHarness();

  elements.length.value = "16";
  elements.width.value = "9";
  elements.height.value = "0.5";
  elements.weight.value = "1";
  elements.largeStandardDimMinimum.checked = false;

  elements["us-fee-form"].listeners.submit({ preventDefault() {} });
  const withoutMinimumMarkup = elements["result-root"].innerHTML;

  assert.match(withoutMinimumMarkup, /Large standard-size/);
  assert.match(withoutMinimumMarkup, /unit weight; dimensional weight 0\.52 lb/);

  elements.largeStandardDimMinimum.checked = true;
  elements["us-fee-form"].listeners.submit({ preventDefault() {} });
  const withMinimumMarkup = elements["result-root"].innerHTML;

  assert.match(withMinimumMarkup, /Large standard-size/);
  assert.match(withMinimumMarkup, /dimensional weight; dimensional weight 2\.07 lb/);
});

test("US bulky tiers keep the 2-inch minimum regardless of the Large standard toggle", () => {
  const { elements } = createUsHarness();

  elements.length.value = "20";
  elements.width.value = "15";
  elements.height.value = "1";
  elements.weight.value = "1";
  elements.largeStandardDimMinimum.checked = false;

  elements["us-fee-form"].listeners.submit({ preventDefault() {} });
  const withoutMinimumMarkup = elements["result-root"].innerHTML;

  elements.largeStandardDimMinimum.checked = true;
  elements["us-fee-form"].listeners.submit({ preventDefault() {} });
  const withMinimumMarkup = elements["result-root"].innerHTML;

  assert.match(withoutMinimumMarkup, /Small Bulky/);
  assert.match(withoutMinimumMarkup, /dimensional weight; dimensional weight 4\.32 lb/);
  assert.match(withMinimumMarkup, /Small Bulky/);
  assert.match(withMinimumMarkup, /dimensional weight; dimensional weight 4\.32 lb/);
});
