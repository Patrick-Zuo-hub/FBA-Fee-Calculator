const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function assertEstimatorShell(source, label) {
  assert.match(source, /简易利润测算/, `${label} should render the estimator section`);
  assert.match(source, /同步自 FBA/, `${label} should include the sync button`);
  assert.match(source, /计算毛利/, `${label} should include the calculate button`);
  assert.match(source, /产品目标售价（含税）/, `${label} should include gross selling price`);
  assert.match(source, /VAT \(%\)/, `${label} should include VAT input`);
  assert.match(source, /销售佣金比例 \(%\)/, `${label} should include referral rate input`);
  assert.match(source, /FBA费用/, `${label} should include FBA fee input`);
  assert.match(source, /头程计费重/, `${label} should include chargeable weight input`);
  assert.match(source, /头程运费单价/, `${label} should include first-leg unit price input`);
  assert.match(source, /产品成本/, `${label} should include product cost input`);
  assert.match(source, /汇率/, `${label} should include exchange rate input`);
  assert.match(source, /毛利率/, `${label} should include gross margin output`);
}

test("shared helper defines the estimator shell fields and actions", () => {
  const helper = read("History/profit-estimator.js");
  assertEstimatorShell(helper, "Shared helper");
});

test("US page loads the shared estimator and places it between summary and detail sections", () => {
  const html = read("History/fba-us-local-fee-calculator.html");
  const script = read("History/fba-us-local-fee-calculator.js");

  assert.match(html, /profit-estimator\.js/);
  assert.match(script, /renderProfitEstimatorSection/);

  const summaryIndex = script.indexOf('<div class="summary-grid">');
  const estimatorIndex = script.indexOf("${renderProfitEstimatorSection(view.market)}");
  const detailIndex = script.indexOf('<div class="detail-grid">');
  assert.ok(summaryIndex !== -1 && estimatorIndex !== -1 && detailIndex !== -1);
  assert.ok(summaryIndex < estimatorIndex && estimatorIndex < detailIndex);
});

test("EU & UK page loads the shared estimator shell", () => {
  const html = read("History/fba-eu-uk-fee-calculator.html");

  assert.match(html, /profit-estimator\.js/);
  assert.match(html, /renderProfitEstimatorSection/);

  const summaryIndex = html.indexOf('<div class="summary-grid">');
  const estimatorIndex = html.indexOf("${renderProfitEstimatorSection(view.profitMarket, view.currency, view.profitMarketLabel)}");
  const detailIndex = html.indexOf('<div class="section">');
  assert.ok(summaryIndex !== -1 && estimatorIndex !== -1 && detailIndex !== -1);
  assert.ok(summaryIndex < estimatorIndex && estimatorIndex < detailIndex);
});

test("Walmart page loads the shared estimator and places it before detail cards", () => {
  const html = read("History/walmart-wfs-fee-calculator.html");
  const script = read("History/walmart-wfs-fee-calculator.js");

  assert.match(html, /profit-estimator\.js/);
  assert.match(script, /renderProfitEstimatorSection/);

  const summaryIndex = script.indexOf('<div class="summary-grid">');
  const estimatorIndex = script.indexOf("${renderProfitEstimatorSection()}", summaryIndex);
  const detailIndex = script.indexOf('<div class="detail-grid">');
  assert.ok(summaryIndex !== -1 && estimatorIndex !== -1 && detailIndex !== -1);
  assert.ok(summaryIndex < estimatorIndex && estimatorIndex < detailIndex);
});
