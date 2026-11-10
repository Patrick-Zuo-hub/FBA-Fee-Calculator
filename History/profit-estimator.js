(function (globalScope) {
  "use strict";

  const MARKET_DEFAULTS = {
    US: { vat: 0, referralRate: 15, firstLegPriceRmbPerKg: 8, exchangeRate: 7 },
    CA: { vat: 0, referralRate: 15, firstLegPriceRmbPerKg: 8, exchangeRate: 5 },
    MX: { vat: 16, referralRate: 15, firstLegPriceRmbPerCbm: 2900, exchangeRate: 0.4 },
    EU: { vat: 20, referralRate: 15, firstLegPriceRmbPerKg: 8, exchangeRate: 7.8 },
    UK: { vat: 20, referralRate: 15, firstLegPriceRmbPerKg: 8, exchangeRate: 9 },
    AU: { vat: 10, referralRate: 13, firstLegPriceRmbPerKg: 8, exchangeRate: 4.7 },
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
    return { market, ...defaults };
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
      ...(defaults.market === "MX" ? {
        volumeCbm: existing.volumeCbm ?? "",
        actualWeightKg: existing.actualWeightKg ?? "",
        firstLegPriceRmbPerCbm: existing.firstLegPriceRmbPerCbm ?? defaults.firstLegPriceRmbPerCbm
      } : {
        firstLegPriceRmbPerKg: existing.firstLegPriceRmbPerKg ?? defaults.firstLegPriceRmbPerKg
      }),
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

  function calculateFirstLeg(input = {}) {
    if (input.market === "MX") {
      const volume = toFiniteNumber(input.volumeCbm);
      const weight = toFiniteNumber(input.actualWeightKg);
      const rate = toFiniteNumber(input.firstLegPriceRmbPerCbm);
      if (!(volume > 0 && weight > 0) || rate == null || rate < 0) return null;
      const chargeableCbm = Math.max(volume, weight / 350);
      return { costRmb: chargeableCbm * rate, chargeableCbm };
    }
    const weight = toFiniteNumber(input.chargeableWeightKg);
    const rate = toFiniteNumber(input.firstLegPriceRmbPerKg);
    if (!(weight > 0) || rate == null || rate < 0) return null;
    return { costRmb: weight * rate };
  }

  function calculateGrossMargin(input) {
    const grossSellingPrice = toFiniteNumber(input && input.grossSellingPrice);
    const vatRate = normalizePercent(input && input.vat);
    const referralRate = normalizePercent(input && input.referralRate);
    const fbaFee = toFiniteNumber(input && input.fbaFee);
    const freight = calculateFirstLeg(input || {});
    const productCostRmb = toFiniteNumber(input && input.productCostRmb);
    const exchangeRate = toFiniteNumber(input && input.exchangeRate);

    if (grossSellingPrice == null || grossSellingPrice <= 0) {
      return { success: false, message: "补全字段后计算", grossMarginPercent: null };
    }
    if (
      vatRate == null || vatRate < 0
      || referralRate == null || referralRate < 0
      || fbaFee == null
      || freight == null
      || productCostRmb == null || productCostRmb < 0
      || exchangeRate == null || exchangeRate <= 0
    ) {
      return { success: false, message: "补全字段后计算", grossMarginPercent: null };
    }

    const netSellingPrice = grossSellingPrice / (1 + vatRate);
    const firstLegCostRmb = freight.costRmb;
    const firstLegCostLocal = firstLegCostRmb / exchangeRate;
    const productCostLocal = productCostRmb / exchangeRate;
    const grossMarginRate = ((netSellingPrice - fbaFee - firstLegCostLocal - productCostLocal) / grossSellingPrice) - referralRate;

    return {
      success: true,
      message: "计算成功",
      grossMarginPercent: round2(grossMarginRate * 100),
      grossMarginRate,
      netSellingPrice: round2(netSellingPrice),
      chargeableCbm: freight.chargeableCbm,
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

    if (source.market && MARKET_DEFAULTS[source.market]) {
      nextState.market = source.market;
    }
    if (nextState.market === "MX") {
      const dims = [source.lengthCm, source.widthCm, source.heightCm].map(toFiniteNumber);
      if (dims.every(value => value > 0)) {
        nextState.volumeCbm = Number((dims[0] * dims[1] * dims[2] / 1e6).toPrecision(15));
      }
      if (toFiniteNumber(source.actualWeightKg) > 0) nextState.actualWeightKg = source.actualWeightKg;
    } else {
      const weight = calculateChargeableWeightKg(source);
      if (weight != null) nextState.chargeableWeightKg = weight;
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

    const valid = result && result.success;
    const amount = value => `${currency} ${Number(value).toFixed(2)}`;
    const grossProfit = valid ? result.grossMarginRate * Number(state.grossSellingPrice) : null;
    const rows = valid ? [
      ["含税售价", Number(state.grossSellingPrice)],
      ["售价税额（估算）", Number(state.grossSellingPrice) - result.netSellingPrice],
      ["配送费", Number(state.fbaFee)],
      ["销售佣金", Number(state.grossSellingPrice) * normalizePercent(state.referralRate)],
      ["采购成本", result.productCostLocal], ["头程运费", result.firstLegCostLocal]
    ].map(([label,value]) => `<div class="profit-breakdown-row"><span>${label}</span><span>${amount(value)}</span></div>`).join("") : "";
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
            ${state.market === "MX" ? `
            <p class="mx-freight-help">墨西哥头程按方计费。可从配送费用同步外箱体积和实重，也可手动填写。每 350 kg 折算为 1 m³。</p>
            <label class="profit-field">
              <span>单件外箱体积 (m³)</span>
              <input id="profitVolumeCbm" type="number" min="0" step="any" value="${formatInputValue(state.volumeCbm)}" />
            </label>
            <label class="profit-field">
              <span>单件含包装实重 (kg)</span>
              <input id="profitActualWeightKg" type="number" min="0" step="any" value="${formatInputValue(state.actualWeightKg)}" />
            </label>
            <label class="profit-field">
              <span>头程单价 (元/m³)</span>
              <input id="profitFirstLegPriceRmbPerCbm" type="number" min="0" step="0.01" value="${formatInputValue(state.firstLegPriceRmbPerCbm)}" />
            </label>` : `
            <label class="profit-field">
              <span>头程计费重 (kg)</span>
              <input id="profitChargeableWeightKg" type="number" min="0" step="0.001" inputmode="decimal" value="${formatInputValue(state.chargeableWeightKg)}" />
            </label>
            <label class="profit-field">
              <span>头程运费单价 (RMB / kg)</span>
              <input id="profitFirstLegPriceRmbPerKg" type="number" min="0" step="0.01" inputmode="decimal" value="${formatInputValue(state.firstLegPriceRmbPerKg)}" />
            </label>`}
            <label class="profit-field">
              <span>产品成本 (RMB)</span>
              <input id="profitProductCostRmb" type="number" min="0" step="0.01" inputmode="decimal" value="${formatInputValue(state.productCostRmb)}" />
            </label>
            <label class="profit-field">
              <span>${state.market === "MX" ? "汇率（1 MXN 折合人民币）" : "汇率"}</span>
              <input id="profitExchangeRate" type="number" min="0" step="0.001" inputmode="decimal" value="${formatInputValue(state.exchangeRate)}" />
            </label>
          </div>

          <div class="profit-estimator__side">
            <div class="profit-result-card">
              <h3>单件利润</h3>
              <div class="profit-kpis"><div><span class="profit-result-card__label">毛利</span><strong class="profit-result-card__value" style="color:${grossProfit >= 0 ? '#389e0d' : '#cf1322'}">${valid ? amount(grossProfit) : '--'}</strong></div><div><span class="profit-result-card__label">毛利率</span>
              <strong class="profit-result-card__value">${resultValue}</strong></div></div>
              <p class="profit-result-card__hint">基于 VAT 后售价、FBA费用、头程运费、产品成本和销售佣金比例测算。</p>
              ${state.market === "MX" && valid ? `<p>实重折合 ${(Number(state.actualWeightKg) / 350).toFixed(6)} m³，本件计费 ${result.chargeableCbm.toFixed(6)} m³，头程 ¥${result.firstLegCostRmb.toFixed(2)}。毛利率按含税售价计算。</p>` : ""}
              <div class="profit-result-card__message">${resultMessage}</div>${rows}
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
