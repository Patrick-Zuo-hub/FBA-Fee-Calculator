(function (globalScope) {
  "use strict";

  const MARKET_DEFAULTS = {
    US: { vat: 0, referralRate: 15, firstLegPriceRmbPerKg: 8, exchangeRate: 7 },
    CA: { vat: 0, referralRate: 15, firstLegPriceRmbPerKg: 8, exchangeRate: 5 },
    MX: { vat: 0, referralRate: 15, firstLegPriceRmbPerKg: 8, exchangeRate: 0.4 },
    EU: { vat: 20, referralRate: 15, firstLegPriceRmbPerKg: 8, exchangeRate: 7.8 },
    UK: { vat: 20, referralRate: 15, firstLegPriceRmbPerKg: 8, exchangeRate: 9 },
    Walmart: { vat: 0, referralRate: 15, firstLegPriceRmbPerKg: 8, exchangeRate: 7 }
  };

  function round2(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  function toFiniteNumber(value) {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : null;
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return null;
      const numeric = Number(trimmed);
      return Number.isFinite(numeric) ? numeric : null;
    }
    return null;
  }

  function normalizePercent(value) {
    const numeric = toFiniteNumber(value);
    if (numeric == null) return null;
    return numeric > 1 ? numeric / 100 : numeric;
  }

  function getProfitDefaults(context) {
    const market = context && context.market ? String(context.market) : "US";
    const defaults = MARKET_DEFAULTS[market] || MARKET_DEFAULTS.US;
    return {
      market,
      vat: defaults.vat,
      referralRate: defaults.referralRate,
      firstLegPriceRmbPerKg: defaults.firstLegPriceRmbPerKg,
      exchangeRate: defaults.exchangeRate
    };
  }

  function createProfitState(context, currentState) {
    const defaults = getProfitDefaults(context);
    const existing = currentState || {};

    return {
      market: defaults.market,
      grossSellingPrice: existing.grossSellingPrice ?? "",
      vat: existing.vat ?? defaults.vat,
      referralRate: existing.referralRate ?? defaults.referralRate,
      fbaFee: existing.fbaFee ?? "",
      chargeableWeightKg: existing.chargeableWeightKg ?? "",
      firstLegPriceRmbPerKg: existing.firstLegPriceRmbPerKg ?? defaults.firstLegPriceRmbPerKg,
      productCostRmb: existing.productCostRmb ?? "",
      exchangeRate: existing.exchangeRate ?? defaults.exchangeRate
    };
  }

  function calculateChargeableWeightKg(input) {
    const lengthCm = toFiniteNumber(input && input.lengthCm);
    const widthCm = toFiniteNumber(input && input.widthCm);
    const heightCm = toFiniteNumber(input && input.heightCm);
    const actualWeightKg = toFiniteNumber(input && input.actualWeightKg);

    if (
      lengthCm == null || lengthCm <= 0
      || widthCm == null || widthCm <= 0
      || heightCm == null || heightCm <= 0
      || actualWeightKg == null || actualWeightKg <= 0
    ) {
      return null;
    }

    const volumetricWeightKg = (lengthCm * widthCm * heightCm) / 6000;
    return round2(Math.max(volumetricWeightKg, actualWeightKg));
  }

  function calculateGrossMargin(input) {
    const grossSellingPrice = toFiniteNumber(input && input.grossSellingPrice);
    const vatRate = normalizePercent(input && input.vat);
    const referralRate = normalizePercent(input && input.referralRate);
    const fbaFee = toFiniteNumber(input && input.fbaFee);
    const chargeableWeightKg = toFiniteNumber(input && input.chargeableWeightKg);
    const firstLegPriceRmbPerKg = toFiniteNumber(input && input.firstLegPriceRmbPerKg);
    const productCostRmb = toFiniteNumber(input && input.productCostRmb);
    const exchangeRate = toFiniteNumber(input && input.exchangeRate);

    if (grossSellingPrice == null || grossSellingPrice <= 0) {
      return { success: false, message: "补全字段后计算", grossMarginPercent: null };
    }
    if (
      vatRate == null || vatRate < 0
      || referralRate == null || referralRate < 0
      || fbaFee == null
      || chargeableWeightKg == null || chargeableWeightKg <= 0
      || firstLegPriceRmbPerKg == null || firstLegPriceRmbPerKg < 0
      || productCostRmb == null || productCostRmb < 0
      || exchangeRate == null || exchangeRate <= 0
    ) {
      return { success: false, message: "补全字段后计算", grossMarginPercent: null };
    }

    const netSellingPrice = grossSellingPrice / (1 + vatRate);
    const firstLegCostRmb = chargeableWeightKg * firstLegPriceRmbPerKg;
    const firstLegCostLocal = firstLegCostRmb / exchangeRate;
    const productCostLocal = productCostRmb / exchangeRate;
    const grossMarginRate = ((netSellingPrice - fbaFee - firstLegCostLocal - productCostLocal) / grossSellingPrice) - referralRate;

    return {
      success: true,
      message: "计算成功",
      grossMarginPercent: round2(grossMarginRate * 100),
      grossMarginRate,
      netSellingPrice: round2(netSellingPrice),
      firstLegCostRmb: round2(firstLegCostRmb),
      firstLegCostLocal: round2(firstLegCostLocal),
      productCostLocal: round2(productCostLocal)
    };
  }

  function syncEstimatorFields(currentState, sourceContext) {
    const nextState = Object.assign({}, currentState || {});
    const source = sourceContext || {};

    if (toFiniteNumber(source.fbaFee) != null) {
      nextState.fbaFee = round2(toFiniteNumber(source.fbaFee));
    }

    const chargeableWeightKg = calculateChargeableWeightKg({
      lengthCm: source.lengthCm,
      widthCm: source.widthCm,
      heightCm: source.heightCm,
      actualWeightKg: source.actualWeightKg
    });

    if (chargeableWeightKg != null) {
      nextState.chargeableWeightKg = chargeableWeightKg;
    }

    if (source.market && MARKET_DEFAULTS[source.market]) {
      nextState.market = source.market;
    }

    return nextState;
  }

  function formatInputValue(value) {
    if (value == null) return "";
    return String(value);
  }

  function renderEstimatorPanel(options) {
    const state = createProfitState({ market: options && options.market }, options && options.state);
    const result = options && options.result ? options.result : null;
    const marketLabel = options && options.marketLabel ? options.marketLabel : state.market;
    const currency = options && options.currency ? options.currency : "";
    const resultValue = result && result.success && result.grossMarginPercent != null
      ? `${Number(result.grossMarginPercent).toFixed(2)}%`
      : "--";
    const resultMessage = result && result.message
      ? result.message
      : "补全字段后计算";

    return `
      <section class="card profit-estimator">
        <div class="profit-estimator__header">
          <div>
            <div class="eyebrow">Quick Profit Check</div>
            <h3>简易利润测算</h3>
            <p>适合联动上方费用结果，也支持独立手填使用。百分比输入遵循直觉：20 = 20%，15 = 15%。</p>
          </div>
          <div class="profit-estimator__meta">
            <span>当前站点</span>
            <strong>${marketLabel}</strong>
            <em>${currency}</em>
          </div>
        </div>

        <div class="profit-estimator__layout">
          <div class="profit-estimator__fields">
            <label class="profit-field">
              <span>产品目标售价（含税）</span>
              <input id="profitGrossSellingPrice" type="number" min="0" step="0.01" inputmode="decimal" value="${formatInputValue(state.grossSellingPrice)}" />
            </label>
            <label class="profit-field">
              <span>VAT (%)</span>
              <input id="profitVat" type="number" min="0" step="0.01" inputmode="decimal" value="${formatInputValue(state.vat)}" />
            </label>
            <label class="profit-field">
              <span>销售佣金比例 (%)</span>
              <input id="profitReferralRate" type="number" min="0" step="0.01" inputmode="decimal" value="${formatInputValue(state.referralRate)}" />
            </label>
            <label class="profit-field">
              <span>FBA费用</span>
              <input id="profitFbaFee" type="number" min="0" step="0.01" inputmode="decimal" value="${formatInputValue(state.fbaFee)}" />
            </label>
            <label class="profit-field">
              <span>头程计费重 (kg)</span>
              <input id="profitChargeableWeightKg" type="number" min="0" step="0.001" inputmode="decimal" value="${formatInputValue(state.chargeableWeightKg)}" />
            </label>
            <label class="profit-field">
              <span>头程运费单价 (RMB / kg)</span>
              <input id="profitFirstLegPriceRmbPerKg" type="number" min="0" step="0.01" inputmode="decimal" value="${formatInputValue(state.firstLegPriceRmbPerKg)}" />
            </label>
            <label class="profit-field">
              <span>产品成本 (RMB)</span>
              <input id="profitProductCostRmb" type="number" min="0" step="0.01" inputmode="decimal" value="${formatInputValue(state.productCostRmb)}" />
            </label>
            <label class="profit-field">
              <span>汇率</span>
              <input id="profitExchangeRate" type="number" min="0" step="0.001" inputmode="decimal" value="${formatInputValue(state.exchangeRate)}" />
            </label>
          </div>

          <div class="profit-estimator__side">
            <div class="profit-result-card">
              <span class="profit-result-card__label">毛利率</span>
              <strong class="profit-result-card__value">${resultValue}</strong>
              <p class="profit-result-card__hint">基于 VAT 后售价、FBA费用、头程运费、产品成本和销售佣金比例测算。</p>
              <div class="profit-result-card__message">${resultMessage}</div>
            </div>

            <div class="profit-estimator__actions">
              <button type="button" id="profitSyncButton" class="secondary">同步自 FBA</button>
              <button type="button" id="profitCalculateButton" class="primary">计算毛利</button>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  const api = {
    getProfitDefaults,
    createProfitState,
    calculateChargeableWeightKg,
    calculateGrossMargin,
    syncEstimatorFields,
    renderEstimatorPanel
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  globalScope.PROFIT_ESTIMATOR = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
