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

function createDocument() {
  const ids = [
    ["fee-form", ""],
    ["result-root", ""],
    ["result-caption", ""],
    ["route-pill", ""],
    ["origin", "origin"],
    ["destination", "destination"],
    ["example-btn", ""],
    ["length", "length"],
    ["width", "width"],
    ["height", "height"],
    ["weight", "weight"],
    ["price", "price"],
    ["dos30", "dos30"],
    ["dos90", "dos90"],
    ["fuel-logistics-surcharge", "fuelLogisticsSurcharge"],
    ["festive-season-peak", "festiveSeasonPeak"],
    ["pan-eu", "panEu"],
    ["selected-category", "selectedCategory"],
    ["low-price-special", "lowPriceSpecial"],
    ["use-low-price", "useLowPrice"],
    ["cep-enrolled", "cepEnrolled"],
    ["hazmat", "hazmat"],
    ["sipp", "sipp"]
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
    addEventListener() {}
  };

  elements["fee-form"].__elements = elements;
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

function loadCalculator() {
  const { document, elements } = createDocument();
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

  const html = fs.readFileSync(path.join(root, "History", "fba-eu-uk-fee-calculator.html"), "utf8");
  vm.runInNewContext(extractInlineScript(html), context);
  return { elements, context };
}

function submit(elements) {
  elements["fee-form"].listeners.submit({ preventDefault() {} });
  return elements["result-root"].innerHTML;
}

function setCommonInput(elements, { origin, destination, weight }) {
  elements.length.value = "20";
  elements.width.value = "10";
  elements.height.value = "7";
  elements.weight.value = String(weight);
  elements.origin.value = origin;
  elements.destination.value = destination;
  elements.price.value = "";
  elements.dos30.value = "";
  elements.dos90.value = "";
  elements["fuel-logistics-surcharge"].checked = false;
  elements["festive-season-peak"].checked = false;
  elements["pan-eu"].checked = false;
  elements["selected-category"].checked = false;
  elements["low-price-special"].checked = false;
  elements["use-low-price"].checked = false;
  elements["cep-enrolled"].checked = true;
  elements.hazmat.checked = false;
  elements.sipp.checked = false;
}

function setLocalUkSmallParcelInput(elements) {
  setCommonInput(elements, { origin: "UK", destination: "UK", weight: 0.9 });
}

function setEfnSmallParcelInput(elements) {
  setCommonInput(elements, { origin: "DE", destination: "FR", weight: 0.4 });
}

function setLocalUkOversizeInput(elements) {
  setCommonInput(elements, { origin: "UK", destination: "UK", weight: 1 });
  elements.length.value = "61";
  elements.width.value = "46";
  elements.height.value = "46";
  elements.sipp.checked = false;
}

test("EU local parcel uses the published festive peak fee only when enabled", () => {
  const { elements, context } = loadCalculator();
  setLocalUkSmallParcelInput(elements);

  const nonPeakMarkup = submit(elements);
  assert.equal(context.window.__lastResultView.primaryTotal, 3.04);
  assert.match(nonPeakMarkup, /Not applied/);

  elements["festive-season-peak"].checked = true;
  const peakMarkup = submit(elements);
  assert.equal(context.window.__lastResultView.primaryTotal, 3.15);
  assert.match(peakMarkup, /Applied/);
  assert.match(peakMarkup, /October 15, 2026 to January 14, 2027/);
  assert.match(
    peakMarkup,
    /Amazon's festive peak table excludes apparel\. This calculator does not collect an apparel flag, so apparel results require manual review\./
  );
});

test("EU EFN parcel uses its published festive peak fee", () => {
  const { elements, context } = loadCalculator();
  setEfnSmallParcelInput(elements);
  elements["festive-season-peak"].checked = true;

  submit(elements);
  assert.equal(context.window.__lastResultView.primaryTotal, 7.53);
});

test("EU oversize fee remains unchanged when festive peak is enabled", () => {
  const { elements, context } = loadCalculator();
  setLocalUkOversizeInput(elements);

  submit(elements);
  const nonPeak = context.window.__lastResultView.primaryTotal;
  elements["festive-season-peak"].checked = true;

  const peakMarkup = submit(elements);
  assert.equal(context.window.__lastResultView.primaryTotal, nonPeak);
  assert.match(peakMarkup, /Festive season peak/);
  assert.match(peakMarkup, /No published peak fee for this tier/);
  assert.match(peakMarkup, /non-peak fee used/);
});

test("EU low-price selection stays outside festive peak fees", () => {
  const { elements, context } = loadCalculator();
  setLocalUkSmallParcelInput(elements);
  elements.weight.value = "0.4";
  elements.price.value = "15";
  elements["use-low-price"].checked = true;
  elements["festive-season-peak"].checked = false;

  submit(elements);
  const nonPeakTotal = context.window.__lastResultView.primaryTotal;

  elements["festive-season-peak"].checked = true;
  const markup = submit(elements);

  assert.equal(context.window.__lastResultView.primaryTotal, nonPeakTotal);
  assert.equal(context.window.__lastResultView.festiveSeasonPeak.applied, false);
  assert.match(markup, /Low-price/);
  assert.match(markup, /Festive season peak/);
  assert.match(markup, /Low-price fee table is outside the published festive peak table/);
});

test("EU published peak metadata marks unchanged CEP large-envelope as applied", () => {
  const { elements, context } = loadCalculator();
  setCommonInput(elements, { origin: "DE", destination: "DE", weight: 0.9 });
  elements.length.value = "33";
  elements.width.value = "23";
  elements.height.value = "4";
  elements["cep-enrolled"].checked = true;
  elements["festive-season-peak"].checked = true;

  const markup = submit(elements);

  assert.equal(context.window.__lastResultView.primaryTotal, 2.78);
  assert.match(markup, /Applied/);
  assert.match(markup, /using published peak fee values for this tier/);
  assert.doesNotMatch(markup, /No published peak fee for this tier/);
});
