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

function extractInlineScript(html) {
  const matches = [...html.matchAll(/<script(?:[^>]*)>([\s\S]*?)<\/script>/g)];
  return matches[matches.length - 1][1];
}

function parseCurrencyValue(markup, currencyLabel) {
  const regex = new RegExp(`${currencyLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*([0-9]+\\.[0-9]{2})`);
  const match = markup.match(regex);
  assert.ok(match, `Expected to find ${currencyLabel} amount in markup`);
  return Number(match[1]);
}

test("NA sample includes surcharge by default and removes it when unchecked", () => {
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
  elements.dimensionUnit.value = "in";
  elements.weightUnit.value = "oz";
  elements.fuelLogisticsSurcharge.checked = true;

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

  elements["sample-small"].listeners.click();
  const withSurchargeMarkup = elements["result-root"].innerHTML;
  const totalWithSurcharge = parseCurrencyValue(withSurchargeMarkup, "USD");

  assert.match(withSurchargeMarkup, /Fuel & logistics surcharge/);
  assert.match(withSurchargeMarkup, /\+USD 0\.09/);

  elements.fuelLogisticsSurcharge.checked = false;
  elements["us-fee-form"].listeners.submit({ preventDefault() {} });
  const withoutSurchargeMarkup = elements["result-root"].innerHTML;
  const totalWithoutSurcharge = parseCurrencyValue(withoutSurchargeMarkup, "USD");

  assert.match(withoutSurchargeMarkup, /Not applied/);
  assert.equal(Number((totalWithSurcharge - totalWithoutSurcharge).toFixed(2)), 0.09);
});

test("EU sample includes surcharge by default and removes it when unchecked", () => {
  const { document, elements } = createDocument([
    { id: "fee-form", name: "" },
    { id: "result-root", name: "" },
    { id: "result-caption", name: "" },
    { id: "route-pill", name: "" },
    { id: "origin", name: "origin" },
    { id: "destination", name: "destination" },
    { id: "example-btn", name: "" },
    { id: "length", name: "length" },
    { id: "width", name: "width" },
    { id: "height", name: "height" },
    { id: "weight", name: "weight" },
    { id: "price", name: "price" },
    { id: "dos30", name: "dos30" },
    { id: "dos90", name: "dos90" },
    { id: "fuel-logistics-surcharge", name: "fuelLogisticsSurcharge" },
    { id: "pan-eu", name: "panEu" },
    { id: "selected-category", name: "selectedCategory" },
    { id: "low-price-special", name: "lowPriceSpecial" },
    { id: "use-low-price", name: "useLowPrice" },
    { id: "cep-enrolled", name: "cepEnrolled" },
    { id: "hazmat", name: "hazmat" },
    { id: "sipp", name: "sipp" }
  ]);

  elements["fee-form"].__elements = elements;
  elements["fuel-logistics-surcharge"].checked = true;
  elements["use-low-price"].checked = true;
  elements["cep-enrolled"].checked = true;

  const html = fs.readFileSync(path.join(root, "History", "fba-eu-uk-fee-calculator.html"), "utf8");
  const context = {
    console,
    document,
    window: {},
    globalThis: {},
    FormData: FakeFormData
  };
  context.globalThis = context;
  context.window = context;
  context.FBA_FEE_DATA = require("../History/fba-fee-data.test-wrapper.cjs");
  context.FBA_SURCHARGE_RULES = require("../History/fba-surcharge-rules.js");

  vm.runInNewContext(extractInlineScript(html), context);

  elements["example-btn"].listeners.click();
  const withSurchargeMarkup = elements["result-root"].innerHTML;
  const totalWithSurcharge = parseCurrencyValue(withSurchargeMarkup, "€");

  assert.match(withSurchargeMarkup, /Fuel & logistics surcharge/);
  assert.match(withSurchargeMarkup, /\+€0\.15/);

  elements["fuel-logistics-surcharge"].checked = false;
  elements["fee-form"].listeners.submit({ preventDefault() {} });
  const withoutSurchargeMarkup = elements["result-root"].innerHTML;
  const totalWithoutSurcharge = parseCurrencyValue(withoutSurchargeMarkup, "€");

  assert.match(withoutSurchargeMarkup, /Not applied/);
  assert.equal(Number((totalWithSurcharge - totalWithoutSurcharge).toFixed(2)), 0.15);
});
