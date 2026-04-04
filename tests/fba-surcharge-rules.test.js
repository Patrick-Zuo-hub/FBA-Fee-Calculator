const test = require("node:test");
const assert = require("node:assert/strict");

const {
  getNaFuelLogisticsRule,
  getEuFuelLogisticsRule,
  buildFuelLogisticsSurcharge
} = require("../History/fba-surcharge-rules.js");

test("NA applies 3.5% to US and CA only", () => {
  assert.deepEqual(getNaFuelLogisticsRule("US"), {
    applicable: true,
    rate: 0.035,
    effectiveDate: "2026-04-17",
    scopeLabel: "US"
  });

  assert.deepEqual(getNaFuelLogisticsRule("CA"), {
    applicable: true,
    rate: 0.035,
    effectiveDate: "2026-04-17",
    scopeLabel: "CA"
  });

  assert.deepEqual(getNaFuelLogisticsRule("MX"), {
    applicable: false,
    rate: 0,
    effectiveDate: "2026-04-17",
    scopeLabel: "MX"
  });
});

test("EU applies 1.5% to eligible destinations", () => {
  assert.deepEqual(getEuFuelLogisticsRule("DE"), {
    applicable: true,
    rate: 0.015,
    effectiveDate: "2026-04-17",
    scopeLabel: "DE"
  });

  assert.deepEqual(getEuFuelLogisticsRule("UK"), {
    applicable: true,
    rate: 0.015,
    effectiveDate: "2026-04-17",
    scopeLabel: "UK"
  });
});

test("disabled or inapplicable surcharge returns zero amount", () => {
  const disabled = buildFuelLogisticsSurcharge(getNaFuelLogisticsRule("US"), 10, false);
  const inapplicable = buildFuelLogisticsSurcharge(getNaFuelLogisticsRule("MX"), 10, true);

  assert.equal(disabled.amount, 0);
  assert.equal(disabled.applied, false);
  assert.equal(inapplicable.amount, 0);
  assert.equal(inapplicable.applicable, false);
});

test("surcharge amount rounds to two decimals", () => {
  const surcharge = buildFuelLogisticsSurcharge(getEuFuelLogisticsRule("FR"), 2.33, true);

  assert.equal(surcharge.amount, 0.03);
  assert.equal(surcharge.label, "Fuel & logistics surcharge");
});
