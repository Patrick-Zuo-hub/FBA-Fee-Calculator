(function () {
  const DATA = {
    currency: "USD",
    storageRates: {
      jan_sep: {
        label: "January - September",
        rate: 0.75,
        reason: "$0.75 per cubic foot per month"
      },
      oct_dec_30: {
        label: "October - December (30 days or less)",
        rate: 0.75,
        reason: "$0.75 per cubic foot per month for items stored up to 30 days"
      },
      oct_dec_over_30: {
        label: "October - December (more than 30 days)",
        rate: 2.25,
        reason: "$0.75 base + $1.50 additional per cubic foot per month after 30 days"
      },
      over_365: {
        label: "Stored more than 365 days",
        rate: 2.25,
        reason: "$2.25 per cubic foot per month"
      }
    }
  };

  const dom = {};

  function round2(value) {
    return Math.round(value * 100) / 100;
  }

  function money(value) {
    return `${DATA.currency} ${round2(value).toFixed(2)}`;
  }

  function toInches(value, unit) {
    if (unit === "cm") return value / 2.54;
    return value;
  }

  function toPounds(value, unit) {
    if (unit === "kg") return value / 0.45359237;
    if (unit === "oz") return value / 16;
    return value;
  }

  function sortedDims(lengthIn, widthIn, heightIn) {
    return [lengthIn, widthIn, heightIn].sort((a, b) => b - a);
  }

  function lengthPlusGirth(dims) {
    return dims[0] + (2 * (dims[1] + dims[2]));
  }

  function dimensionalWeight(dims) {
    return (dims[0] * dims[1] * dims[2]) / 139;
  }

  function cubicFeet(dims) {
    return (dims[0] * dims[1] * dims[2]) / 1728;
  }

  function collectInput() {
    const fd = new FormData(dom.form);
    const length = Number(fd.get("length"));
    const width = Number(fd.get("width"));
    const height = Number(fd.get("height"));
    const weight = Number(fd.get("weight"));
    const retailPrice = Number(fd.get("retailPrice"));
    const quantity = Number(fd.get("quantity"));
    const dimensionUnit = fd.get("dimensionUnit");
    const weightUnit = fd.get("weightUnit");

    return {
      lengthRaw: length,
      widthRaw: width,
      heightRaw: height,
      weightRaw: weight,
      retailPrice,
      quantity,
      dimensionUnit,
      weightUnit,
      storageWindow: fd.get("storageWindow"),
      isApparel: fd.get("isApparel") === "on",
      isHazmat: fd.get("isHazmat") === "on",
      missingLabel: fd.get("missingLabel") === "on",
      missingPolybag: fd.get("missingPolybag") === "on",
      lengthIn: toInches(length, dimensionUnit),
      widthIn: toInches(width, dimensionUnit),
      heightIn: toInches(height, dimensionUnit),
      unitWeightLb: toPounds(weight, weightUnit)
    };
  }

  function validateInput(input) {
    const nums = [
      input.lengthIn,
      input.widthIn,
      input.heightIn,
      input.unitWeightLb,
      input.retailPrice,
      input.quantity
    ];
    return nums.every((value) => Number.isFinite(value) && value > 0);
  }

  function classifyItem(input) {
    const dims = sortedDims(input.lengthIn, input.widthIn, input.heightIn);
    const lpg = lengthPlusGirth(dims);
    const dimWeightLb = dimensionalWeight(dims);
    const cubicFoot = cubicFeet(dims);

    const isBigBulky = input.unitWeightLb > 150 || dims[0] > 108 || lpg > 165;
    const warnings = [];

    if (dims[0] > 120 || input.unitWeightLb > 500) {
      warnings.push("当前 PDF 的 big & bulky 说明只明确覆盖到 120 in longest side / 500 lb；超出后建议人工复核。");
    }

    let oversizeTier = "none";
    if (!isBigBulky) {
      if ((dims[0] > 96 && dims[0] <= 108) || (lpg > 130 && lpg <= 165)) {
        oversizeTier = "oversize_2";
      } else if ((dims[0] > 48 && dims[0] <= 96) || dims[1] > 30 || (lpg > 105 && lpg <= 130)) {
        oversizeTier = "oversize_1";
      }
    }

    let shippingWeightRaw;
    let shippingWeightBilled;
    let shippingBasis;

    if (isBigBulky) {
      shippingWeightRaw = input.unitWeightLb;
      shippingWeightBilled = Math.ceil(input.unitWeightLb - 1e-9);
      shippingBasis = "unit weight rounded up to nearest pound";
    } else if (input.unitWeightLb < 1) {
      shippingWeightRaw = input.unitWeightLb + 0.25;
      shippingWeightBilled = Math.ceil(shippingWeightRaw - 1e-9);
      shippingBasis = "unit weight + 0.25 lb packaging, rounded up";
    } else {
      shippingWeightRaw = Math.max(input.unitWeightLb, dimWeightLb);
      shippingWeightBilled = Math.ceil(shippingWeightRaw - 1e-9);
      shippingBasis = dimWeightLb > input.unitWeightLb ? "dimensional weight rounded up" : "unit weight rounded up";
    }

    const fulfillmentPricingWeight = (!isBigBulky && oversizeTier === "oversize_2")
      ? Math.max(90, shippingWeightBilled)
      : shippingWeightBilled;

    const returnPricingWeight = (!isBigBulky && oversizeTier === "oversize_2")
      ? Math.max(90, shippingWeightBilled)
      : shippingWeightBilled;

    return {
      dims,
      lengthPlusGirthIn: lpg,
      dimWeightLb,
      cubicFoot,
      isBigBulky,
      sizeLabel: isBigBulky ? "Big & Bulky" : "Standard",
      oversizeTier,
      shippingWeightRaw,
      shippingWeightBilled,
      shippingBasis,
      fulfillmentPricingWeight,
      returnPricingWeight,
      warnings
    };
  }

  function standardBaseFee(weightLb) {
    if (weightLb <= 1) return { amount: 3.45, bandLabel: "<= 1 lb" };
    if (weightLb <= 2) return { amount: 4.95, bandLabel: "2 lb" };
    if (weightLb <= 3) return { amount: 5.45, bandLabel: "3 lb" };
    if (weightLb <= 20) return { amount: 5.75 + (0.40 * (weightLb - 4)), bandLabel: "4 - 20 lb" };
    if (weightLb <= 30) return { amount: 15.55 + (0.40 * (weightLb - 21)), bandLabel: "21 - 30 lb" };
    if (weightLb <= 50) return { amount: 14.55 + (0.40 * (weightLb - 31)), bandLabel: "31 - 50 lb" };
    return { amount: 17.55 + (0.40 * (weightLb - 51)), bandLabel: ">= 51 lb" };
  }

  function standardReturnBaseFee(weightLb) {
    if (weightLb <= 1) return { amount: 4.70, bandLabel: "<= 1 lb" };
    if (weightLb <= 2) return { amount: 6.20, bandLabel: "2 lb" };
    if (weightLb <= 3) return { amount: 6.70, bandLabel: "3 lb" };
    if (weightLb <= 20) return { amount: 7.00 + (0.40 * (weightLb - 4)), bandLabel: "4 - 20 lb" };
    if (weightLb <= 30) return { amount: 15.55 + (0.40 * (weightLb - 21)), bandLabel: "21 - 30 lb" };
    if (weightLb <= 50) return { amount: 14.55 + (0.40 * (weightLb - 31)), bandLabel: "31 - 50 lb" };
    return { amount: 17.55 + (0.40 * (weightLb - 51)), bandLabel: ">= 51 lb" };
  }

  function bulkyBaseFee(weightLb) {
    return {
      amount: 155 + (Math.max(0, weightLb - 90) * 0.80),
      bandLabel: "Up to 500 lb"
    };
  }

  function surchargeLines(input, classification, forReturn) {
    const lines = [];

    if (classification.isBigBulky) {
      return lines;
    }

    if (input.isApparel) {
      lines.push({
        label: "Apparel surcharge",
        amount: 0.50,
        reason: "Article of clothing"
      });
    }

    if (input.isHazmat) {
      lines.push({
        label: "Hazmat surcharge",
        amount: 0.50,
        reason: "Chemical, aerosol, pesticide or battery"
      });
    }

    if (!forReturn && input.retailPrice < 10) {
      lines.push({
        label: "Low retail price surcharge",
        amount: 1.00,
        reason: "Retail price less than $10"
      });
    }

    if (classification.oversizeTier === "oversize_1") {
      lines.push({
        label: "Oversize 1 surcharge",
        amount: 3.00,
        reason: "Longest side > 48 in / median side > 30 in / length + girth > 105 in"
      });
    }

    if (classification.oversizeTier === "oversize_2") {
      lines.push({
        label: "Oversize 2 surcharge",
        amount: 20.00,
        reason: "Longest side > 96 in or length + girth > 130 in"
      });
    }

    return lines;
  }

  function calculateFulfillment(input, classification) {
    const base = classification.isBigBulky
      ? bulkyBaseFee(classification.fulfillmentPricingWeight)
      : standardBaseFee(classification.fulfillmentPricingWeight);

    const surcharges = surchargeLines(input, classification, false);
    const total = round2(base.amount + surcharges.reduce((sum, item) => sum + item.amount, 0));

    return {
      baseAmount: base.amount,
      bandLabel: base.bandLabel,
      surcharges,
      total,
      pricingWeight: classification.fulfillmentPricingWeight,
      explanation: classification.isBigBulky
        ? "Big & bulky uses unit weight rounded up to the nearest pound, with no additional fulfillment surcharges."
        : "Standard fulfillment uses the WFS shipping-weight rules, then applies category / size surcharges when relevant."
    };
  }

  function calculateReturn(input, classification) {
    const base = classification.isBigBulky
      ? bulkyBaseFee(classification.returnPricingWeight)
      : standardReturnBaseFee(classification.returnPricingWeight);

    const surcharges = surchargeLines(input, classification, true);
    const total = round2(base.amount + surcharges.reduce((sum, item) => sum + item.amount, 0));

    return {
      baseAmount: base.amount,
      bandLabel: base.bandLabel,
      surcharges,
      total,
      pricingWeight: classification.returnPricingWeight,
      explanation: classification.isBigBulky
        ? "Big & bulky return fee follows the same freight formula as fulfillment."
        : "Return processing fee uses the standard return table. I reused the apparel / hazmat / oversize surcharges because the PDF says those extra fees also apply to returns, but it does not restate a separate surcharge table."
    };
  }

  function calculateStorage(input, classification) {
    const rate = DATA.storageRates[input.storageWindow];
    const perUnitMonthly = round2(classification.cubicFoot * rate.rate);
    const totalMonthly = round2(perUnitMonthly * input.quantity);

    return {
      rate,
      cubicFoot: classification.cubicFoot,
      perUnitMonthly,
      totalMonthly
    };
  }

  function calculatePrep(input) {
    const lines = [];
    if (input.missingLabel) {
      lines.push({
        label: "Missing or incorrect label",
        amount: 0.65,
        reason: "Unplanned prep service"
      });
    }
    if (input.missingPolybag) {
      lines.push({
        label: "Missing or incorrect poly bag",
        amount: 0.80,
        reason: "Unplanned prep service"
      });
    }

    const perUnit = round2(lines.reduce((sum, item) => sum + item.amount, 0));
    return {
      lines,
      perUnit,
      total: round2(perUnit * input.quantity)
    };
  }

  function calculateDisposalRemoval(input) {
    const billedUnitWeight = Math.max(1, Math.ceil(input.unitWeightLb - 1e-9));
    const disposal = billedUnitWeight <= 2
      ? 0.35
      : 0.35 + (0.20 * (billedUnitWeight - 2));
    const removal = disposal + (0.40 * billedUnitWeight);

    return {
      billedUnitWeight,
      disposal: round2(disposal),
      removal: round2(removal),
      explanation: "PDF uses unit-weight bands for disposal / removal. I bill this part by rounding unit weight up to the nearest pound for a conservative estimate."
    };
  }

  function oversizeLabel(classification) {
    if (classification.isBigBulky) return "Big & Bulky";
    if (classification.oversizeTier === "oversize_1") return "Oversize 1";
    if (classification.oversizeTier === "oversize_2") return "Oversize 2";
    return "Standard / Not oversize";
  }

  function renderLineItems(lines) {
    if (!lines.length) {
      return `
        <div class="line-item">
          <div>
            <strong>无额外费用</strong>
            <span>当前场景没有命中这类附加费。</span>
          </div>
          <div class="amount">${money(0)}</div>
        </div>
      `;
    }

    return lines.map((item) => `
      <div class="line-item">
        <div>
          <strong>${item.label}</strong>
          <span>${item.reason}</span>
        </div>
        <div class="amount plus">+${money(item.amount)}</div>
      </div>
    `).join("");
  }

  function renderResult(view) {
    dom.result.innerHTML = `
      <div class="summary-grid">
        <div class="summary-card total-card">
          <div class="eyebrow">Fulfillment</div>
          <div class="hero-value">${money(view.fulfillment.total)}</div>
          <p>${view.classification.sizeLabel} · ${oversizeLabel(view.classification)}</p>
        </div>
        <div class="summary-card">
          <div class="eyebrow">Return Fee</div>
          <div class="metric-value">${money(view.returns.total)}</div>
          <p>Seller-paid return scenario</p>
        </div>
        <div class="summary-card">
          <div class="eyebrow">Storage / Month</div>
          <div class="metric-value">${money(view.storage.totalMonthly)}</div>
          <p>${view.input.quantity} unit${view.input.quantity === 1 ? "" : "s"} · ${view.storage.rate.label}</p>
        </div>
      </div>

      <div class="detail-grid">
        <section class="card">
          <h3>核心结果</h3>
          <div class="facts">
            <div class="fact"><span>Size Class</span><strong>${view.classification.sizeLabel}</strong></div>
            <div class="fact"><span>Oversize Tier</span><strong>${oversizeLabel(view.classification)}</strong></div>
            <div class="fact"><span>Longest Side</span><strong>${view.classification.dims[0].toFixed(2)} in</strong></div>
            <div class="fact"><span>Median Side</span><strong>${view.classification.dims[1].toFixed(2)} in</strong></div>
            <div class="fact"><span>Shortest Side</span><strong>${view.classification.dims[2].toFixed(2)} in</strong></div>
            <div class="fact"><span>Length + Girth</span><strong>${view.classification.lengthPlusGirthIn.toFixed(2)} in</strong></div>
            <div class="fact"><span>Dimensional Weight</span><strong>${view.classification.dimWeightLb.toFixed(2)} lb</strong></div>
            <div class="fact"><span>Shipping Weight</span><strong>${view.classification.shippingWeightBilled} lb</strong></div>
            <div class="fact"><span>Cubic Feet</span><strong>${view.classification.cubicFoot.toFixed(3)} cu ft</strong></div>
            <div class="fact"><span>Retail Price</span><strong>${money(view.input.retailPrice)}</strong></div>
          </div>
        </section>

        <section class="card">
          <h3>Fulfillment Fee</h3>
          <div class="line-list">
            <div class="line-item">
              <div>
                <strong>Base fulfillment fee</strong>
                <span>${view.fulfillment.bandLabel} · priced at ${view.fulfillment.pricingWeight} lb</span>
              </div>
              <div class="amount">${money(view.fulfillment.baseAmount)}</div>
            </div>
            ${renderLineItems(view.fulfillment.surcharges)}
          </div>
        </section>
      </div>

      <div class="detail-grid">
        <section class="card">
          <h3>Return / Storage</h3>
          <div class="line-list">
            <div class="line-item">
              <div>
                <strong>Return processing fee</strong>
                <span>${view.returns.bandLabel} · priced at ${view.returns.pricingWeight} lb</span>
              </div>
              <div class="amount">${money(view.returns.baseAmount)}</div>
            </div>
            ${renderLineItems(view.returns.surcharges)}
            <div class="line-item">
              <div>
                <strong>Storage fee per unit / month</strong>
                <span>${view.storage.rate.reason} · ${view.storage.cubicFoot.toFixed(3)} cu ft</span>
              </div>
              <div class="amount">${money(view.storage.perUnitMonthly)}</div>
            </div>
            <div class="line-item">
              <div>
                <strong>Storage fee total / month</strong>
                <span>${view.input.quantity} unit${view.input.quantity === 1 ? "" : "s"}</span>
              </div>
              <div class="amount">${money(view.storage.totalMonthly)}</div>
            </div>
          </div>
        </section>

        <section class="card">
          <h3>Other WFS Fees</h3>
          <div class="line-list">
            <div class="line-item">
              <div>
                <strong>Prep service fee per unit</strong>
                <span>Unplanned prep only</span>
              </div>
              <div class="amount">${money(view.prep.perUnit)}</div>
            </div>
            ${renderLineItems(view.prep.lines)}
            <div class="line-item">
              <div>
                <strong>Disposal fee per unit</strong>
                <span>Billed unit weight ${view.disposal.billedUnitWeight} lb</span>
              </div>
              <div class="amount">${money(view.disposal.disposal)}</div>
            </div>
            <div class="line-item">
              <div>
                <strong>Removal fee per unit</strong>
                <span>Disposal fee + $0.40 per lb shipping cost</span>
              </div>
              <div class="amount">${money(view.disposal.removal)}</div>
            </div>
          </div>
        </section>
      </div>

      <section class="card notes-card">
        <h3>说明</h3>
        <div class="notes">
          <div class="note">${view.classification.shippingBasis}</div>
          <div class="note">${view.fulfillment.explanation}</div>
          <div class="note">${view.returns.explanation}</div>
          <div class="note">${view.disposal.explanation}</div>
          ${view.classification.fulfillmentPricingWeight === 90 && view.classification.oversizeTier === "oversize_2" ? `<div class="note">Oversize 2 命中时，我按 PDF 中“priced starting at the 90 lb. rate”处理，因此 fulfilment / return 的计费重量至少按 90 lb 起算。</div>` : ""}
          ${view.classification.warnings.map((warning) => `<div class="note">${warning}</div>`).join("")}
          <div class="note warn">本页只实现你提供 PDF 中写明的 Walmart WFS 规则。Planned prep services、Inventory Transfer Services、Walmart at fault 退货豁免、推荐费等未计入主总额。</div>
        </div>
      </section>
    `;
  }

  function calculate() {
    const input = collectInput();
    if (!validateInput(input)) {
      dom.result.innerHTML = `<div class="empty-state">请先输入合法的尺寸、重量、售价和数量。</div>`;
      return;
    }

    const classification = classifyItem(input);
    const fulfillment = calculateFulfillment(input, classification);
    const returns = calculateReturn(input, classification);
    const storage = calculateStorage(input, classification);
    const prep = calculatePrep(input);
    const disposal = calculateDisposalRemoval(input);

    renderResult({
      input,
      classification,
      fulfillment,
      returns,
      storage,
      prep,
      disposal
    });
  }

  function loadExample(type) {
    if (type === "standard") {
      dom.retailPrice.value = "8.99";
      dom.quantity.value = "12";
      dom.dimensionUnit.value = "in";
      dom.weightUnit.value = "lb";
      dom.length.value = "13";
      dom.width.value = "9";
      dom.height.value = "1.2";
      dom.weight.value = "1.6";
      dom.storageWindow.value = "jan_sep";
      dom.isApparel.checked = false;
      dom.isHazmat.checked = false;
      dom.missingLabel.checked = false;
      dom.missingPolybag.checked = false;
      calculate();
      return;
    }

    dom.retailPrice.value = "249";
    dom.quantity.value = "2";
    dom.dimensionUnit.value = "in";
    dom.weightUnit.value = "lb";
    dom.length.value = "112";
    dom.width.value = "18";
    dom.height.value = "14";
    dom.weight.value = "165";
    dom.storageWindow.value = "oct_dec_over_30";
    dom.isApparel.checked = false;
    dom.isHazmat.checked = false;
    dom.missingLabel.checked = true;
    dom.missingPolybag.checked = false;
    calculate();
  }

  function bindDom() {
    dom.form = document.getElementById("wfs-fee-form");
    dom.result = document.getElementById("result-root");
    dom.retailPrice = document.getElementById("retailPrice");
    dom.quantity = document.getElementById("quantity");
    dom.dimensionUnit = document.getElementById("dimensionUnit");
    dom.weightUnit = document.getElementById("weightUnit");
    dom.length = document.getElementById("length");
    dom.width = document.getElementById("width");
    dom.height = document.getElementById("height");
    dom.weight = document.getElementById("weight");
    dom.storageWindow = document.getElementById("storageWindow");
    dom.isApparel = document.getElementById("isApparel");
    dom.isHazmat = document.getElementById("isHazmat");
    dom.missingLabel = document.getElementById("missingLabel");
    dom.missingPolybag = document.getElementById("missingPolybag");

    dom.form.addEventListener("submit", (event) => {
      event.preventDefault();
      calculate();
    });

    document.getElementById("sample-standard").addEventListener("click", () => loadExample("standard"));
    document.getElementById("sample-bulky").addEventListener("click", () => loadExample("bulky"));
  }

  document.addEventListener("DOMContentLoaded", bindDom);
})();
