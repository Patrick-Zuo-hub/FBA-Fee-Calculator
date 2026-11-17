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

test("EU defaults to 2% from November 2, 2026 for all ten destinations", () => {
  for (const country of ["UK", "FR", "DE", "IT", "ES", "PL", "SE", "NL", "IE", "BE"]) {
    assert.deepEqual(getEuFuelLogisticsRule(country), {
      applicable: true, rate: 0.02, effectiveDate: "2026-11-02", scopeLabel: country
    });
  }
});

test("EU dated rules preserve 1.5% before November 2 and switch to 2% on that date", () => {
  for (const country of ["UK", "FR", "DE", "IT", "ES", "PL", "SE", "NL", "IE", "BE"]) {
    const before = getEuFuelLogisticsRule(country, "2026-11-01");
    const after = getEuFuelLogisticsRule(country, "2026-11-02");
    assert.equal(before.rate, 0.015);
    assert.equal(before.effectiveDate, "2026-04-17");
    assert.equal(after.rate, 0.02);
    assert.equal(after.effectiveDate, "2026-11-02");
    assert.equal(buildFuelLogisticsSurcharge(before, 10, true).amount, 0.15);
    assert.equal(buildFuelLogisticsSurcharge(after, 10, true).amount, 0.20);
  }
  assert.equal(getEuFuelLogisticsRule("US").applicable, false);
  assert.equal(buildFuelLogisticsSurcharge(getEuFuelLogisticsRule("FR"), 10, false).amount, 0);
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

  assert.equal(surcharge.amount, 0.05);
  assert.equal(surcharge.label, "Fuel & logistics surcharge");
});
