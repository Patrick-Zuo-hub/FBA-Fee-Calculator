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
    { id: "peakFulfillmentFees", name: "peakFulfillmentFees" },
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
    { id: "profitVolumeCbm", name: "" },
    { id: "profitActualWeightKg", name: "" },
    { id: "profitFirstLegPriceRmbPerCbm", name: "" },
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

test("Mexico uses its VAT default when switching markets and accepts manual edits", () => {
  const { elements } = setupNaCalculator();
  elements.market.value = "MX";
  elements.market.listeners.change();
  const result = elements["result-root"];
  assert.equal(extractInputValue(result.innerHTML, "profitVat"), "16");
  elements.profitVat.value = "0";
  elements.profitCalculateButton.listeners.click();
  assert.equal(extractInputValue(result.innerHTML, "profitVat"), "0");
  elements.market.value = "CA";
  elements.market.listeners.change();
  assert.equal(extractInputValue(result.innerHTML, "profitVat"), "0");
});

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

  assert.equal(extractInputValue(elements["result-root"].innerHTML, "profitFbaFee"), "3.41");
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

test("Mexico syncs box volume and actual weight and bills the larger volume", () => {
  const { elements } = setupNaCalculator();
  elements.market.value = "MX";
  elements.market.listeners.change();
  const markup = () => elements["result-root"].innerHTML;
  assert.equal(extractInputValue(markup(), "profitFirstLegPriceRmbPerCbm"), "2900");
  assert.equal(extractInputValue(markup(), "profitExchangeRate"), "0.4");
  elements.dimensionUnit.value = "cm";
  elements.weightUnit.value = "kg";
  elements.length.value = "66.4";
  elements.width.value = "6";
  elements.height.value = "88";
  elements.weight.value = "7.2";
  elements.price.value = "1342.93";
  elements.category.value = "general";
  elements["us-fee-form"].listeners.submit({ preventDefault() {} });
  elements.profitSyncButton.listeners.click();
  const volume = extractInputValue(markup(), "profitVolumeCbm");
  assert.ok(Math.abs(Number(volume) - 0.0350592) < 1e-12);
  assert.equal(extractInputValue(markup(), "profitActualWeightKg"), "7.2");

  elements.profitGrossSellingPrice.value = "1342.93";
  elements.profitVat.value = "16";
  elements.profitReferralRate.value = "15";
  elements.profitFbaFee.value = extractInputValue(markup(), "profitFbaFee");
  assert.equal(elements.profitFbaFee.value, "124.15");
  elements.profitProductCostRmb.value = "74";
  elements.profitExchangeRate.value = "0.4";
  elements.profitFirstLegPriceRmbPerCbm.value = "2900";
  elements.profitVolumeCbm.value = volume;
  elements.profitActualWeightKg.value = "7.2";
  elements.profitCalculateButton.listeners.click();
  assert.match(markup(), /29\.26%/);
  elements.profitActualWeightKg.value = "35";
  elements.profitCalculateButton.listeners.click();
  assert.match(markup(), /0\.100000 m³/);
  assert.match(markup(), /MXN 725\.00/);
});
