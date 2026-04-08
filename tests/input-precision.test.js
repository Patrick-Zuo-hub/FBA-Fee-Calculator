const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function expectInputStep(html, id, step) {
  const pattern = new RegExp(`<input[^>]*id="${id}"[^>]*step="${step}"`);
  assert.match(html, pattern);
}

test("all calculator dimension and weight inputs allow 0.001 precision", () => {
  const na = read("History/fba-us-local-fee-calculator.html");
  const eu = read("History/fba-eu-uk-fee-calculator.html");
  const walmart = read("History/walmart-wfs-fee-calculator.html");

  ["length", "width", "height", "weight"].forEach((id) => {
    expectInputStep(na, id, "0.001");
    expectInputStep(eu, id, "0.001");
    expectInputStep(walmart, id, "0.001");
  });
});
