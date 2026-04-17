const test = require("node:test");
const assert = require("node:assert/strict");

const {
  getProfitDefaults,
  calculateChargeableWeightKg,
  calculateGrossMargin
} = require("../History/profit-estimator.js");

test("defaults cover US, CA, MX, EU, UK, and Walmart", () => {
  assert.deepEqual(getProfitDefaults({ market: "US" }), {
    market: "US",
    vat: 0,
    referralRate: 15,
    firstLegPriceRmbPerKg: 8,
    exchangeRate: 7
  });

  assert.deepEqual(getProfitDefaults({ market: "CA" }), {
    market: "CA",
    vat: 0,
    referralRate: 15,
    firstLegPriceRmbPerKg: 8,
    exchangeRate: 5
  });

  assert.deepEqual(getProfitDefaults({ market: "MX" }), {
    market: "MX",
    vat: 0,
    referralRate: 15,
    firstLegPriceRmbPerKg: 8,
    exchangeRate: 0.4
  });

  assert.deepEqual(getProfitDefaults({ market: "EU" }), {
    market: "EU",
    vat: 20,
    referralRate: 15,
    firstLegPriceRmbPerKg: 8,
    exchangeRate: 7.8
  });

  assert.deepEqual(getProfitDefaults({ market: "UK" }), {
    market: "UK",
    vat: 20,
    referralRate: 15,
    firstLegPriceRmbPerKg: 8,
    exchangeRate: 9
  });

  assert.deepEqual(getProfitDefaults({ market: "Walmart" }), {
    market: "Walmart",
    vat: 0,
    referralRate: 15,
    firstLegPriceRmbPerKg: 8,
    exchangeRate: 7
  });
});

test("VAT 20 means 20% and referral rate 15 means 15%", () => {
  const result = calculateGrossMargin({
    grossSellingPrice: 120,
    vat: 20,
    referralRate: 15,
    fbaFee: 10,
    chargeableWeightKg: 1,
    firstLegPriceRmbPerKg: 0,
    productCostRmb: 0,
    exchangeRate: 7
  });

  assert.equal(result.success, true);
  assert.equal(result.message, "计算成功");
  assert.equal(result.grossMarginPercent, 60);
});

test("chargeable weight uses the larger of volumetric and actual weight", () => {
  assert.equal(
    calculateChargeableWeightKg({
      lengthCm: 30,
      widthCm: 20,
      heightCm: 10,
      actualWeightKg: 0.8
    }),
    1
  );
});

test("gross margin returns a two-decimal percentage", () => {
  const result = calculateGrossMargin({
    grossSellingPrice: 199.99,
    vat: 0,
    referralRate: 15,
    fbaFee: 17.33,
    chargeableWeightKg: 1.2,
    firstLegPriceRmbPerKg: 8,
    productCostRmb: 33.33,
    exchangeRate: 7
  });

  assert.equal(result.success, true);
  assert.equal(result.grossMarginPercent, 73.27);
  assert.equal(typeof result.message, "string");
});
