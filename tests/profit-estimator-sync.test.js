const test = require("node:test");
const assert = require("node:assert/strict");

const { syncEstimatorFields } = require("../History/profit-estimator.js");

test("sync updates FBA fee when a valid fee result exists", () => {
  const nextState = syncEstimatorFields(
    { fbaFee: 12.34, chargeableWeightKg: 1.11 },
    { fbaFee: 18.276 }
  );

  assert.equal(nextState.fbaFee, 18.28);
  assert.equal(nextState.chargeableWeightKg, 1.11);
});

test("sync leaves existing FBA fee untouched when fee result is absent", () => {
  const nextState = syncEstimatorFields(
    { fbaFee: 12.34, chargeableWeightKg: 1.11 },
    { lengthCm: 30, widthCm: 20, heightCm: 10, actualWeightKg: 0.8 }
  );

  assert.equal(nextState.fbaFee, 12.34);
  assert.equal(nextState.chargeableWeightKg, 1);
});

test("sync leaves existing chargeable weight untouched when dimensions are incomplete", () => {
  const nextState = syncEstimatorFields(
    { fbaFee: 12.34, chargeableWeightKg: 1.11 },
    { fbaFee: 14.56, lengthCm: 30, widthCm: 20, actualWeightKg: 0.8 }
  );

  assert.equal(nextState.fbaFee, 14.56);
  assert.equal(nextState.chargeableWeightKg, 1.11);
});

test("sync never overwrites manual estimator inputs unrelated to FBA sync", () => {
  const currentState = {
    market: "US",
    grossSellingPrice: 49.99,
    vat: 0,
    referralRate: 15,
    fbaFee: 12.34,
    chargeableWeightKg: 1.11,
    firstLegPriceRmbPerKg: 8,
    productCostRmb: 18,
    exchangeRate: 7
  };

  const nextState = syncEstimatorFields(currentState, {
    market: "CA",
    fbaFee: 14.56,
    lengthCm: 30,
    widthCm: 20,
    heightCm: 10,
    actualWeightKg: 0.8
  });

  assert.deepEqual(
    {
      grossSellingPrice: nextState.grossSellingPrice,
      vat: nextState.vat,
      referralRate: nextState.referralRate,
      firstLegPriceRmbPerKg: nextState.firstLegPriceRmbPerKg,
      productCostRmb: nextState.productCostRmb,
      exchangeRate: nextState.exchangeRate
    },
    {
      grossSellingPrice: 49.99,
      vat: 0,
      referralRate: 15,
      firstLegPriceRmbPerKg: 8,
      productCostRmb: 18,
      exchangeRate: 7
    }
  );
  assert.equal(nextState.market, "CA");
  assert.equal(nextState.fbaFee, 14.56);
  assert.equal(nextState.chargeableWeightKg, 1);
});
