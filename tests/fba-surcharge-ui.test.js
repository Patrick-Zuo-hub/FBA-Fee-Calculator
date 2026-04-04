const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

const naHtml = fs.readFileSync(path.join(root, "History", "fba-us-local-fee-calculator.html"), "utf8");
const euHtml = fs.readFileSync(path.join(root, "History", "fba-eu-uk-fee-calculator.html"), "utf8");

test("NA calculator loads the surcharge rules and shows a checked toggle", () => {
  assert.match(naHtml, /fba-surcharge-rules\.js/);
  assert.match(naHtml, /id="fuelLogisticsSurcharge"/);
  assert.match(naHtml, /type="checkbox" checked/);
});

test("EU calculator loads the surcharge rules and shows a checked toggle", () => {
  assert.match(euHtml, /fba-surcharge-rules\.js/);
  assert.match(euHtml, /id="fuel-logistics-surcharge"/);
  assert.match(euHtml, /type="checkbox" checked/);
});
