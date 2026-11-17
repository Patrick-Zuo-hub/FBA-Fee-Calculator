(function (root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.FBA_SURCHARGE_RULES = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const EFFECTIVE_DATE = "2026-04-17";
  const EU_UPDATED_EFFECTIVE_DATE = "2026-11-02";
  const NA_FUEL_LOGISTICS_RATES = {
    US: 0.035,
    CA: 0.035
  };
  const EU_FUEL_LOGISTICS_RATES = {
    UK: 0.02,
    FR: 0.02,
    DE: 0.02,
    IT: 0.02,
    ES: 0.02,
    PL: 0.02,
    SE: 0.02,
    NL: 0.02,
    IE: 0.02,
    BE: 0.02
  };

  function round2(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  function buildRule(scopeLabel, rate, effectiveDate = EFFECTIVE_DATE) {
    return {
      applicable: Number.isFinite(rate),
      rate: Number.isFinite(rate) ? rate : 0,
      effectiveDate,
      scopeLabel
    };
  }

  function getNaFuelLogisticsRule(market) {
    return buildRule(market, NA_FUEL_LOGISTICS_RATES[market]);
  }

  // Like the fee tables, the calculator defaults to the latest published rule.
  function getEuFuelLogisticsRule(countryCode, calculationDate = EU_UPDATED_EFFECTIVE_DATE) {
    const currentRate = EU_FUEL_LOGISTICS_RATES[countryCode];
    const usePreviousRate = calculationDate < EU_UPDATED_EFFECTIVE_DATE;
    return buildRule(
      countryCode,
      Number.isFinite(currentRate) && usePreviousRate ? 0.015 : currentRate,
      usePreviousRate ? EFFECTIVE_DATE : EU_UPDATED_EFFECTIVE_DATE
    );
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
