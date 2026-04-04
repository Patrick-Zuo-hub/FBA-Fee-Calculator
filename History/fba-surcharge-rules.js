(function (root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.FBA_SURCHARGE_RULES = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const EFFECTIVE_DATE = "2026-04-17";
  const NA_FUEL_LOGISTICS_RATES = {
    US: 0.035,
    CA: 0.035
  };
  const EU_FUEL_LOGISTICS_RATES = {
    UK: 0.015,
    FR: 0.015,
    DE: 0.015,
    IT: 0.015,
    ES: 0.015,
    PL: 0.015,
    SE: 0.015,
    NL: 0.015,
    IE: 0.015,
    BE: 0.015
  };

  function round2(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  function buildRule(scopeLabel, rate) {
    return {
      applicable: Number.isFinite(rate),
      rate: Number.isFinite(rate) ? rate : 0,
      effectiveDate: EFFECTIVE_DATE,
      scopeLabel
    };
  }

  function getNaFuelLogisticsRule(market) {
    return buildRule(market, NA_FUEL_LOGISTICS_RATES[market]);
  }

  function getEuFuelLogisticsRule(countryCode) {
    return buildRule(countryCode, EU_FUEL_LOGISTICS_RATES[countryCode]);
  }

  function buildFuelLogisticsSurcharge(rule, baseFee, enabled) {
    const applicable = Boolean(rule && rule.applicable);
    const normalizedBaseFee = Number.isFinite(baseFee) ? baseFee : 0;
    const shouldApply = applicable && enabled;

    return {
      label: "Fuel & logistics surcharge",
      applicable,
      enabled: Boolean(enabled),
      applied: shouldApply,
      rate: applicable ? rule.rate : 0,
      effectiveDate: rule ? rule.effectiveDate : EFFECTIVE_DATE,
      scopeLabel: rule ? rule.scopeLabel : "",
      amount: shouldApply ? round2(normalizedBaseFee * rule.rate) : 0
    };
  }

  return {
    getNaFuelLogisticsRule,
    getEuFuelLogisticsRule,
    buildFuelLogisticsSurcharge
  };
});
