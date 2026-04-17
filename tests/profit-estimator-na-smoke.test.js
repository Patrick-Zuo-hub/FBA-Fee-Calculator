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

function setupNaCalculator() {
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
    { id: "sample-overmax", name: "" },
    { id: "profitGrossSellingPrice", name: "" },
    { id: "profitVat", name: "" },
    { id: "profitReferralRate", name: "" },
    { id: "profitFbaFee", name: "" },
    { id: "profitChargeableWeightKg", name: "" },
    { id: "profitFirstLegPriceRmbPerKg", name: "" },
    { id: "profitProductCostRmb", name: "" },
    { id: "profitExchangeRate", name: "" },
    { id: "profitSyncButton", name: "" },
    { id: "profitCalculateButton", name: "" }
  ], true);

  elements["us-fee-form"].__elements = elements;
  elements.market.value = "US";
  elements.category.value = "non_apparel";
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
  context.PROFIT_ESTIMATOR = require("../History/profit-estimator.js");

  const script = fs.readFileSync(path.join(root, "History", "fba-us-local-fee-calculator.js"), "utf8");
  vm.runInNewContext(script, context);

  return { elements };
}

function extractInputValue(markup, inputId) {
  const match = markup.match(new RegExp(`id="${inputId}"[^>]*value="([^"]*)"`));
  assert.ok(match, `Expected ${inputId} value in markup`);
  return match[1];
}

test("manual profit calculation works without sync", () => {
  const { elements } = setupNaCalculator();

  elements.profitGrossSellingPrice.value = "100";
  elements.profitVat.value = "0";
  elements.profitReferralRate.value = "15";
  elements.profitFbaFee.value = "10";
  elements.profitChargeableWeightKg.value = "1";
  elements.profitFirstLegPriceRmbPerKg.value = "0";
  elements.profitProductCostRmb.value = "0";
  elements.profitExchangeRate.value = "7";

  elements.profitCalculateButton.listeners.click();

  assert.match(elements["result-root"].innerHTML, /75\.00%/);
});

test("sync pulls a valid FBA fee after fee calculation", () => {
  const { elements } = setupNaCalculator();

  elements["sample-small"].listeners.click();
  elements.profitFbaFee.value = "";

  elements.profitSyncButton.listeners.click();

  assert.equal(extractInputValue(elements["result-root"].innerHTML, "profitFbaFee"), "3.17");
});

test("sync can derive chargeable weight before any fee result exists", () => {
  const { elements } = setupNaCalculator();

  elements.length.value = "13.8";
  elements.width.value = "9";
  elements.height.value = "0.7";
  elements.weight.value = "2.88";
  elements.profitChargeableWeightKg.value = "";

  elements.profitSyncButton.listeners.click();

  const syncedWeight = Number(extractInputValue(elements["result-root"].innerHTML, "profitChargeableWeightKg"));
  assert.ok(syncedWeight > 0);
});

test("manual estimator edits survive profit calculation after sync", () => {
  const { elements } = setupNaCalculator();

  elements["sample-small"].listeners.click();
  elements.profitSyncButton.listeners.click();

  elements.profitGrossSellingPrice.value = "100";
  elements.profitVat.value = "0";
  elements.profitReferralRate.value = "15";
  elements.profitFbaFee.value = "9.99";
  elements.profitChargeableWeightKg.value = "1";
  elements.profitFirstLegPriceRmbPerKg.value = "0";
  elements.profitProductCostRmb.value = "0";
  elements.profitExchangeRate.value = "7";

  elements.profitCalculateButton.listeners.click();

  assert.equal(extractInputValue(elements["result-root"].innerHTML, "profitFbaFee"), "9.99");
});
