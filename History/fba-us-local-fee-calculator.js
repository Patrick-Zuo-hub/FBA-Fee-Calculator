(function () {
  const surchargeRules = globalThis.FBA_SURCHARGE_RULES || {};
  const profitEstimator = globalThis.PROFIT_ESTIMATOR || {};
  const DATA = {
    markets: {
      US: {
        label: "Amazon.com",
        short: "美国站",
        currency: "USD",
        priceLabel: "售价（USD）",
        priceHint: "美国站按售价带 `< $10` / `$10 - $50` / `> $50` 计费。",
        priceRequired: true,
        categoryLabel: "产品类型",
        nativeDimensionUnit: "in",
        nativeWeightUnit: "lb"
      },
      CA: {
        label: "Amazon.ca",
        short: "加拿大站",
        currency: "CAD",
        priceLabel: "售价（CAD）",
        priceHint: "加拿大站提供的 PDF 费率不按售价带区分，这个字段不会参与计算。",
        priceRequired: false,
        categoryLabel: "费率类别",
        nativeDimensionUnit: "cm",
        nativeWeightUnit: "kg"
      },
      MX: {
        label: "Amazon.com.mx",
        short: "墨西哥站",
        currency: "MXN",
        priceLabel: "售价（MXN，含 VAT）",
        priceHint: "墨西哥站按含 VAT 售价带计算。",
        priceRequired: true,
        categoryLabel: "费率类别",
        nativeDimensionUnit: "cm",
        nativeWeightUnit: "kg"
      }
    },
    sizeTierGuides: {
      US: {
        intro: "美国站按英寸和磅判断 size tier，并会在部分层级用 dimensional weight 参与计费。",
        items: [
          { title: "Small standard-size", detail: "<= 15 x 12 x 0.75 in，且 unit weight <= 16 oz" },
          { title: "Large standard-size", detail: "<= 18 x 14 x 8 in，且 shipping weight <= 20 lb" },
          { title: "Small Bulky", detail: "<= 37 x 28 x 20 in，shipping weight <= 50 lb，length + girth <= 130 in" },
          { title: "Large Bulky", detail: "<= 59 x 33 x 33 in，shipping weight <= 50 lb，length + girth <= 130 in" },
          { title: "Extra-Large", detail: "超过 bulky 后进入 XL；分 0-50 / 50-70 / 70-150 / 150+ lb" },
          { title: "Overmax", detail: "仅 US：XL 且 longest side > 96 in 或 length + girth > 130 in" }
        ]
      },
      CA: {
        intro: "加拿大站按厘米和公斤判断，Envelope / Standard 以 100 g 进位，Oversize 以 500 g 进位。",
        items: [
          { title: "Envelope", detail: "<= 38 x 27 x 2 cm，shipping weight <= 0.5 kg" },
          { title: "Standard", detail: "<= 45 x 35 x 20 cm，shipping weight <= 9 kg" },
          { title: "Small oversize", detail: "<= 152 cm longest side，<= 76 cm median side，<= 32 kg，length + girth <= 330 cm" },
          { title: "Medium oversize", detail: "<= 270 cm longest side，<= 68 kg，length + girth <= 330 cm" },
          { title: "Large oversize", detail: "<= 270 cm longest side，<= 68 kg，length + girth <= 419 cm" },
          { title: "Special oversize", detail: "超过上述 oversize 条件的商品" }
        ]
      },
      MX: {
        intro: "墨西哥站按厘米和公斤判断，含 VAT 售价带参与计费；SIPP 折扣适用于 22.6 kg 及以下商品。",
        items: [
          { title: "Envelope", detail: "<= 38 x 27 x 2 cm，shipping weight <= 0.5 kg" },
          { title: "Standard", detail: "<= 45 x 35 x 20 cm" },
          { title: "Oversize", detail: "超过 Standard 后进入 Oversize；当前费率卡给到 550 x 270 x 270 cm 范围" },
          { title: "Shipping weight rule", detail: "<= 0.5 kg 的 Envelope / Standard 用 actual weight；更重商品取 unit 与 dimensional 的较大值" },
          { title: "Price bands", detail: "< MXN 150 / 150-299 / 299-499 / >= 499" },
          { title: "SIPP", detail: "Envelope / Standard / Oversize 均有固定折扣额" }
        ]
      }
    },
    categories: {
      US: {
        non_apparel: { label: "Non-apparel", short: "普通货" },
        apparel: { label: "Apparel", short: "服饰" },
        dangerous_goods: { label: "Dangerous goods", short: "危险品 / Hazmat" }
      },
      CA: {
        general: { label: "All eligible categories", short: "通用费率" }
      },
      MX: {
        general: {
          label: "General categories",
          short: "常规类目组"
        },
        health_grocery: {
          label: "Health & Personal Care / Grocery & Gourmet",
          short: "健康与食品组"
        },
        special: {
          label: "Special category group",
          short: "特殊类目组"
        }
      }
    },
    us: {
      smallStandard: {
        non_apparel: [
          { maxOz: 2, under10: 2.43, band10to50: 3.32, over50: 3.58 },
          { maxOz: 4, under10: 2.49, band10to50: 3.42, over50: 3.68 },
          { maxOz: 6, under10: 2.56, band10to50: 3.45, over50: 3.71 },
          { maxOz: 8, under10: 2.66, band10to50: 3.54, over50: 3.80 },
          { maxOz: 10, under10: 2.77, band10to50: 3.68, over50: 3.94 },
          { maxOz: 12, under10: 2.82, band10to50: 3.78, over50: 4.04 },
          { maxOz: 14, under10: 2.92, band10to50: 3.91, over50: 4.17 },
          { maxOz: 16, under10: 2.95, band10to50: 3.96, over50: 4.22 }
        ],
        apparel: [
          { maxOz: 2, under10: 2.62, band10to50: 3.51, over50: 3.77 },
          { maxOz: 4, under10: 2.64, band10to50: 3.54, over50: 3.80 },
          { maxOz: 6, under10: 2.68, band10to50: 3.59, over50: 3.85 },
          { maxOz: 8, under10: 2.81, band10to50: 3.69, over50: 3.95 },
          { maxOz: 10, under10: 3.00, band10to50: 3.91, over50: 4.17 },
          { maxOz: 12, under10: 3.10, band10to50: 4.09, over50: 4.35 },
          { maxOz: 14, under10: 3.20, band10to50: 4.20, over50: 4.46 },
          { maxOz: 16, under10: 3.30, band10to50: 4.25, over50: 4.51 }
        ],
        dangerous_goods: [
          { maxOz: 2, under10: 3.40, band10to50: 4.29, over50: 4.55 },
          { maxOz: 4, under10: 3.43, band10to50: 4.36, over50: 4.62 },
          { maxOz: 6, under10: 3.48, band10to50: 4.37, over50: 4.63 },
          { maxOz: 8, under10: 3.55, band10to50: 4.43, over50: 4.69 },
          { maxOz: 10, under10: 3.64, band10to50: 4.55, over50: 4.81 },
          { maxOz: 12, under10: 3.65, band10to50: 4.61, over50: 4.87 },
          { maxOz: 14, under10: 3.73, band10to50: 4.72, over50: 4.98 },
          { maxOz: 16, under10: 3.77, band10to50: 4.78, over50: 5.04 }
        ]
      },
      largeStandardBands: {
        non_apparel: [
          { maxLb: 0.25, label: "4 oz or less", under10: 2.91, band10to50: 3.73, over50: 3.99 },
          { maxLb: 0.5, label: "4+ to 8 oz", under10: 3.13, band10to50: 3.95, over50: 4.21 },
          { maxLb: 0.75, label: "8+ to 12 oz", under10: 3.38, band10to50: 4.20, over50: 4.46 },
          { maxLb: 1, label: "12+ to 16 oz", under10: 3.78, band10to50: 4.60, over50: 4.86 },
          { maxLb: 1.25, label: "1+ to 1.25 lb", under10: 4.22, band10to50: 5.04, over50: 5.30 },
          { maxLb: 1.5, label: "1.25+ to 1.5 lb", under10: 4.60, band10to50: 5.42, over50: 5.68 },
          { maxLb: 1.75, label: "1.5+ to 1.75 lb", under10: 4.75, band10to50: 5.57, over50: 5.83 },
          { maxLb: 2, label: "1.75+ to 2 lb", under10: 5.00, band10to50: 5.82, over50: 6.08 },
          { maxLb: 2.25, label: "2+ to 2.25 lb", under10: 5.10, band10to50: 5.92, over50: 6.18 },
          { maxLb: 2.5, label: "2.25+ to 2.5 lb", under10: 5.28, band10to50: 6.10, over50: 6.36 },
          { maxLb: 2.75, label: "2.5+ to 2.75 lb", under10: 5.44, band10to50: 6.26, over50: 6.52 },
          { maxLb: 3, label: "2.75+ to 3 lb", under10: 5.85, band10to50: 6.67, over50: 6.93 }
        ],
        apparel: [
          { maxLb: 0.25, label: "4 oz or less", under10: 3.48, band10to50: 4.30, over50: 4.56 },
          { maxLb: 0.5, label: "4+ to 8 oz", under10: 3.68, band10to50: 4.50, over50: 4.76 },
          { maxLb: 0.75, label: "8+ to 12 oz", under10: 3.90, band10to50: 4.72, over50: 4.98 },
          { maxLb: 1, label: "12+ to 16 oz", under10: 4.35, band10to50: 5.17, over50: 5.43 },
          { maxLb: 1.25, label: "1+ to 1.25 lb", under10: 5.05, band10to50: 5.87, over50: 6.13 },
          { maxLb: 1.5, label: "1.25+ to 1.5 lb", under10: 5.22, band10to50: 6.04, over50: 6.30 },
          { maxLb: 1.75, label: "1.5+ to 1.75 lb", under10: 5.32, band10to50: 6.14, over50: 6.40 },
          { maxLb: 2, label: "1.75+ to 2 lb", under10: 5.43, band10to50: 6.25, over50: 6.51 },
          { maxLb: 2.25, label: "2+ to 2.25 lb", under10: 5.78, band10to50: 6.60, over50: 6.86 },
          { maxLb: 2.5, label: "2.25+ to 2.5 lb", under10: 5.90, band10to50: 6.72, over50: 6.98 },
          { maxLb: 2.75, label: "2.5+ to 2.75 lb", under10: 5.95, band10to50: 6.77, over50: 7.03 },
          { maxLb: 3, label: "2.75+ to 3 lb", under10: 6.08, band10to50: 6.90, over50: 7.16 }
        ],
        dangerous_goods: [
          { maxLb: 0.25, label: "4 oz or less", under10: 3.73, band10to50: 4.55, over50: 4.81 },
          { maxLb: 0.5, label: "4+ to 8 oz", under10: 3.94, band10to50: 4.76, over50: 5.02 },
          { maxLb: 0.75, label: "8+ to 12 oz", under10: 4.17, band10to50: 4.99, over50: 5.25 },
          { maxLb: 1, label: "12+ to 16 oz", under10: 4.37, band10to50: 5.19, over50: 5.45 },
          { maxLb: 1.25, label: "1+ to 1.25 lb", under10: 4.82, band10to50: 5.64, over50: 5.90 },
          { maxLb: 1.5, label: "1.25+ to 1.5 lb", under10: 5.20, band10to50: 6.02, over50: 6.28 },
          { maxLb: 1.75, label: "1.5+ to 1.75 lb", under10: 5.35, band10to50: 6.17, over50: 6.43 },
          { maxLb: 2, label: "1.75+ to 2 lb", under10: 5.49, band10to50: 6.31, over50: 6.57 },
          { maxLb: 2.25, label: "2+ to 2.25 lb", under10: 5.56, band10to50: 6.38, over50: 6.64 },
          { maxLb: 2.5, label: "2.25+ to 2.5 lb", under10: 5.74, band10to50: 6.56, over50: 6.82 },
          { maxLb: 2.75, label: "2.5+ to 2.75 lb", under10: 5.90, band10to50: 6.72, over50: 6.98 },
          { maxLb: 3, label: "2.75+ to 3 lb", under10: 6.31, band10to50: 7.13, over50: 7.39 }
        ]
      },
      largeStandardFormula: {
        non_apparel: { under10: 6.15, band10to50: 6.97, over50: 7.23, increment: 0.08, stepLb: 0.25 },
        apparel: { under10: 6.15, band10to50: 6.97, over50: 7.23, increment: 0.16, stepLb: 0.5 },
        dangerous_goods: { under10: 6.61, band10to50: 7.43, over50: 7.69, increment: 0.08, stepLb: 0.25 }
      },
      smallBulkyFormula: {
        non_apparel: { under10: 6.78, band10to50: 7.55, over50: 7.55, increment: 0.38, thresholdLb: 1 },
        apparel: { under10: 6.78, band10to50: 7.55, over50: 7.55, increment: 0.38, thresholdLb: 1 },
        dangerous_goods: { under10: 7.50, band10to50: 8.27, over50: 8.27, increment: 0.38, thresholdLb: 1 }
      },
      largeBulkyFormula: {
        non_apparel: { under10: 8.58, band10to50: 9.35, over50: 9.35, increment: 0.38, thresholdLb: 1 },
        apparel: { under10: 8.58, band10to50: 9.35, over50: 9.35, increment: 0.38, thresholdLb: 1 },
        dangerous_goods: { under10: 9.30, band10to50: 10.07, over50: 10.07, increment: 0.38, thresholdLb: 1 }
      },
      xl0to50Formula: {
        non_apparel: { under10: 25.56, band10to50: 26.33, over50: 26.33, increment: 0.38, thresholdLb: 1 },
        apparel: { under10: 25.56, band10to50: 26.33, over50: 26.33, increment: 0.38, thresholdLb: 1 },
        dangerous_goods: { under10: 27.67, band10to50: 28.44, over50: 28.44, increment: 0.38, thresholdLb: 1 }
      },
      xl50to70Formula: {
        non_apparel: { under10: 36.55, band10to50: 37.32, over50: 37.32, increment: 0.75, thresholdLb: 51 },
        apparel: { under10: 36.55, band10to50: 37.32, over50: 37.32, increment: 0.75, thresholdLb: 51 },
        dangerous_goods: { under10: 39.76, band10to50: 40.53, over50: 40.53, increment: 0.75, thresholdLb: 51 }
      },
      xl70to150Formula: {
        non_apparel: { under10: 50.55, band10to50: 51.32, over50: 51.32, increment: 0.75, thresholdLb: 71 },
        apparel: { under10: 50.55, band10to50: 51.32, over50: 51.32, increment: 0.75, thresholdLb: 71 },
        dangerous_goods: { under10: 57.68, band10to50: 58.45, over50: 58.45, increment: 0.75, thresholdLb: 71 }
      },
      xl150PlusFormula: {
        non_apparel: { under10: 194.18, band10to50: 194.95, over50: 194.95, increment: 0.19, thresholdLb: 151 },
        apparel: { under10: 194.18, band10to50: 194.95, over50: 194.95, increment: 0.19, thresholdLb: 151 },
        dangerous_goods: { under10: 218.76, band10to50: 219.53, over50: 219.53, increment: 0.19, thresholdLb: 151 }
      },
      lowInventory: {
        small_standard: { lt14: 0.89, lt21: 0.63, lt28: 0.32 },
        large_standard_3_or_less: { lt14: 0.97, lt21: 0.70, lt28: 0.36 },
        large_standard_over_3: { lt14: 1.11, lt21: 0.87, lt28: 0.47 },
        small_bulky: { lt14: 1.85, lt21: 1.02, lt28: 0.51 },
        large_bulky: { lt14: 2.09, lt21: 1.15, lt28: 0.57 }
      },
      sippDiscount: {
        non_apparel: {
          small_standard: [
            { maxLb: 0.125, label: "2 oz or less", amount: 0.04 },
            { maxLb: 0.25, label: "2+ to 4 oz", amount: 0.04 },
            { maxLb: 0.375, label: "4+ to 6 oz", amount: 0.05 },
            { maxLb: 0.5, label: "6+ to 8 oz", amount: 0.05 },
            { maxLb: 0.625, label: "8+ to 10 oz", amount: 0.06 },
            { maxLb: 0.75, label: "10+ to 12 oz", amount: 0.06 },
            { maxLb: 0.875, label: "12+ to 14 oz", amount: 0.07 },
            { maxLb: 1, label: "14+ to 16 oz", amount: 0.07 }
          ],
          large_standard: [
            { maxLb: 0.25, label: "4 oz or less", amount: 0.04 },
            { maxLb: 0.5, label: "4+ to 8 oz", amount: 0.04 },
            { maxLb: 0.75, label: "8+ to 12 oz", amount: 0.07 },
            { maxLb: 1, label: "12+ to 16 oz", amount: 0.08 },
            { maxLb: 1.25, label: "1+ to 1.25 lb", amount: 0.09 },
            { maxLb: 1.5, label: "1.25+ to 1.5 lb", amount: 0.09 },
            { maxLb: 1.75, label: "1.5+ to 1.75 lb", amount: 0.10 },
            { maxLb: 2, label: "1.75+ to 2 lb", amount: 0.11 },
            { maxLb: 2.25, label: "2+ to 2.25 lb", amount: 0.12 },
            { maxLb: 2.5, label: "2.25+ to 2.5 lb", amount: 0.13 },
            { maxLb: 2.75, label: "2.5+ to 2.75 lb", amount: 0.14 },
            { maxLb: 3, label: "2.75+ to 3 lb", amount: 0.14 },
            { maxLb: 20, label: "3+ to 20 lb", amount: 0.23 }
          ]
        },
        apparel: {
          small_standard: [
            { maxLb: 0.125, label: "2 oz or less", amount: 0.06 },
            { maxLb: 0.25, label: "2+ to 4 oz", amount: 0.06 },
            { maxLb: 0.375, label: "4+ to 6 oz", amount: 0.07 },
            { maxLb: 0.5, label: "6+ to 8 oz", amount: 0.07 },
            { maxLb: 0.625, label: "8+ to 10 oz", amount: 0.07 },
            { maxLb: 0.75, label: "10+ to 12 oz", amount: 0.07 },
            { maxLb: 0.875, label: "12+ to 14 oz", amount: 0.07 },
            { maxLb: 1, label: "14+ to 16 oz", amount: 0.07 }
          ],
          large_standard: [
            { maxLb: 0.25, label: "4 oz or less", amount: 0.06 },
            { maxLb: 0.5, label: "4+ to 8 oz", amount: 0.06 },
            { maxLb: 0.75, label: "8+ to 12 oz", amount: 0.06 },
            { maxLb: 1, label: "12+ to 16 oz", amount: 0.07 },
            { maxLb: 1.25, label: "1+ to 1.25 lb", amount: 0.08 },
            { maxLb: 1.5, label: "1.25+ to 1.5 lb", amount: 0.08 },
            { maxLb: 1.75, label: "1.5+ to 1.75 lb", amount: 0.09 },
            { maxLb: 2, label: "1.75+ to 2 lb", amount: 0.09 },
            { maxLb: 2.25, label: "2+ to 2.25 lb", amount: 0.12 },
            { maxLb: 2.5, label: "2.25+ to 2.5 lb", amount: 0.12 },
            { maxLb: 2.75, label: "2.5+ to 2.75 lb", amount: 0.14 },
            { maxLb: 3, label: "2.75+ to 3 lb", amount: 0.14 },
            { maxLb: 20, label: "3+ to 20 lb", amount: 0.22 }
          ]
        }
      },
      packagingFeeBulky: [
        { maxDimWeightLb: 5, label: "0 to 5 lb", amount: 1.51 },
        { maxDimWeightLb: 10, label: "5 to 10 lb", amount: 1.68 },
        { maxDimWeightLb: 15, label: "10 to 15 lb", amount: 1.97 },
        { maxDimWeightLb: 20, label: "15 to 20 lb", amount: 2.60 },
        { maxDimWeightLb: 25, label: "20 to 25 lb", amount: 2.92 },
        { maxDimWeightLb: 30, label: "25 to 30 lb", amount: 3.47 },
        { maxDimWeightLb: 35, label: "30 to 35 lb", amount: 3.60 },
        { maxDimWeightLb: 40, label: "35 to 40 lb", amount: 3.78 },
        { maxDimWeightLb: 45, label: "40 to 45 lb", amount: 3.80 },
        { maxDimWeightLb: Infinity, label: "45 lb or more", amount: 4.04 }
      ],
      overmaxFees: {
        xl_0_50: 17,
        xl_50_70: 21,
        xl_70_150: 25
      }
    },
    ca: {
      envelopeFees: [
        { maxKg: 0.1, label: "First 100 g", amount: 4.46 },
        { maxKg: 0.2, label: "100+ to 200 g", amount: 4.71 },
        { maxKg: 0.3, label: "200+ to 300 g", amount: 5.01 },
        { maxKg: 0.4, label: "300+ to 400 g", amount: 5.28 },
        { maxKg: 0.5, label: "400+ to 500 g", amount: 5.62 }
      ],
      standardFees: [
        { maxKg: 0.1, label: "First 100 g", amount: 5.92 },
        { maxKg: 0.2, label: "100+ to 200 g", amount: 6.12 },
        { maxKg: 0.3, label: "200+ to 300 g", amount: 6.36 },
        { maxKg: 0.4, label: "300+ to 400 g", amount: 6.73 },
        { maxKg: 0.5, label: "400+ to 500 g", amount: 7.23 },
        { maxKg: 0.6, label: "500+ to 600 g", amount: 7.40 },
        { maxKg: 0.7, label: "600+ to 700 g", amount: 7.71 },
        { maxKg: 0.8, label: "700+ to 800 g", amount: 7.95 },
        { maxKg: 0.9, label: "800+ to 900 g", amount: 8.25 },
        { maxKg: 1.0, label: "900+ to 1,000 g", amount: 8.49 },
        { maxKg: 1.1, label: "1,000+ to 1,100 g", amount: 8.58 },
        { maxKg: 1.2, label: "1,100+ to 1,200 g", amount: 8.84 },
        { maxKg: 1.3, label: "1,200+ to 1,300 g", amount: 9.04 },
        { maxKg: 1.4, label: "1,300+ to 1,400 g", amount: 9.29 },
        { maxKg: 1.5, label: "1,400+ to 1,500 g", amount: 9.60 }
      ],
      standardOver: { base: 10.32, label: "1,500+ to 9,000 g", increment: 0.09, stepKg: 0.1 },
      oversize: {
        small_oversize: { base: 15.43, increment: 0.46, label: "First 500 g (32 kg or less)" },
        medium_oversize: { base: 37.78, increment: 0.52, label: "First 500 g (68 kg or less)" },
        large_oversize: { base: 82.20, increment: 0.58, label: "First 500 g (68 kg or less)" },
        special_oversize: { base: 150.78, increment: 0.58, label: "First 500 g (over 68 kg)" }
      },
      sippEnvelope: [
        { maxKg: 0.1, label: "First 100 g", amount: 0.05 },
        { maxKg: 0.2, label: "100+ to 200 g", amount: 0.06 },
        { maxKg: 0.3, label: "200+ to 300 g", amount: 0.07 },
        { maxKg: 0.4, label: "300+ to 400 g", amount: 0.08 },
        { maxKg: 0.5, label: "400+ to 500 g", amount: 0.08 }
      ],
      sippStandard: [
        { maxKg: 0.1, label: "First 100 g", amount: 0.05 },
        { maxKg: 0.2, label: "100+ to 200 g", amount: 0.05 },
        { maxKg: 0.3, label: "200+ to 300 g", amount: 0.09 },
        { maxKg: 0.4, label: "300+ to 400 g", amount: 0.10 },
        { maxKg: 0.5, label: "400+ to 500 g", amount: 0.11 },
        { maxKg: 0.6, label: "500+ to 600 g", amount: 0.12 },
        { maxKg: 0.7, label: "600+ to 700 g", amount: 0.12 },
        { maxKg: 0.8, label: "700+ to 800 g", amount: 0.13 },
        { maxKg: 0.9, label: "800+ to 900 g", amount: 0.14 },
        { maxKg: 1.0, label: "900+ to 1,000 g", amount: 0.15 },
        { maxKg: 1.1, label: "1,000+ to 1,100 g", amount: 0.16 },
        { maxKg: 1.2, label: "1,100+ to 1,200 g", amount: 0.18 },
        { maxKg: 1.3, label: "1,200+ to 1,300 g", amount: 0.19 },
        { maxKg: 1.4, label: "1,300+ to 1,400 g", amount: 0.20 },
        { maxKg: 1.5, label: "1,400+ to 1,500 g", amount: 0.21 },
        { maxKg: 9.0, label: "1,500+ to 9,000 g", amount: 0.33 }
      ],
      sippSmallOversize: 1.68
    },
    mx: {
      envelopeBands: [
        { maxKg: 0.1, label: "0 to 0.10 kg" },
        { maxKg: 0.2, label: "0.10 to 0.20 kg" },
        { maxKg: 0.3, label: "0.20 to 0.30 kg" },
        { maxKg: 0.4, label: "0.30 to 0.40 kg" },
        { maxKg: 0.5, label: "Over 0.40 kg" }
      ],
      standardBands: [
        { maxKg: 0.1, label: "0 to 0.10 kg" },
        { maxKg: 0.2, label: "0.10 to 0.20 kg" },
        { maxKg: 0.3, label: "0.20 to 0.30 kg" },
        { maxKg: 0.4, label: "0.30 to 0.40 kg" },
        { maxKg: 0.5, label: "0.40 to 0.50 kg" },
        { maxKg: 0.6, label: "0.50 to 0.60 kg" },
        { maxKg: 0.7, label: "0.60 to 0.70 kg" },
        { maxKg: 0.8, label: "0.70 to 0.80 kg" },
        { maxKg: 0.9, label: "0.80 to 0.90 kg" },
        { maxKg: 1.0, label: "0.90 to 1.00 kg" }
      ],
      general: {
        envelope: [
          { maxKg: 0.1, lt150: 27.00, lt299: 36.20, lt499: 49.00, gte499: 60.00 },
          { maxKg: 0.2, lt150: 27.20, lt299: 36.40, lt499: 50.00, gte499: 60.40 },
          { maxKg: 0.3, lt150: 27.40, lt299: 36.60, lt499: 51.00, gte499: 60.80 },
          { maxKg: 0.4, lt150: 27.60, lt299: 36.80, lt499: 52.00, gte499: 61.20 },
          { maxKg: 0.5, lt150: 27.80, lt299: 37.00, lt499: 53.00, gte499: 61.50 }
        ],
        standard: [
          { maxKg: 0.1, lt150: 28.00, lt299: 38.00, lt499: 50.00, gte499: 61.80 },
          { maxKg: 0.2, lt150: 28.05, lt299: 38.20, lt499: 51.00, gte499: 63.00 },
          { maxKg: 0.3, lt150: 28.10, lt299: 38.40, lt499: 52.00, gte499: 64.00 },
          { maxKg: 0.4, lt150: 28.15, lt299: 38.60, lt499: 53.00, gte499: 66.00 },
          { maxKg: 0.5, lt150: 28.20, lt299: 38.80, lt499: 54.00, gte499: 67.00 },
          { maxKg: 0.6, lt150: 28.25, lt299: 39.00, lt499: 55.00, gte499: 68.30 },
          { maxKg: 0.7, lt150: 28.30, lt299: 39.20, lt499: 56.00, gte499: 69.60 },
          { maxKg: 0.8, lt150: 28.35, lt299: 39.40, lt499: 57.00, gte499: 71.00 },
          { maxKg: 0.9, lt150: 28.40, lt299: 39.60, lt499: 58.00, gte499: 72.00 },
          { maxKg: 1.0, lt150: 28.45, lt299: 39.80, lt499: 59.00, gte499: 72.70 }
        ],
        standardOver1: { lt150: 28.50, lt299: 40.00, lt499: 60.00, gte499: 72.80, increment: { lt150: 1.74, lt299: 1.74, lt499: 1.50, gte499: 1.15 } },
        oversize: {
          first1kg: { lt150: 32.00, lt299: 38.20, lt499: 61.00, gte499: 75.40 },
          upTo50Increment: { lt150: 2.80, lt299: 2.80, lt499: 2.80, gte499: 3.75 },
          base50kg: { lt150: 306.40, lt299: 312.60, lt499: 335.40, gte499: 442.90 },
          over50Increment: { lt150: 1.50, lt299: 1.50, lt499: 1.50, gte499: 2.10 },
          over100Increment: { gte499: 3.60 }
        }
      },
      health_grocery: {
        envelope: [
          { maxKg: 0.1, lt150: 4.50, lt299: 5.50, lt499: 49.00, gte499: 60.00 },
          { maxKg: 0.2, lt150: 4.60, lt299: 5.60, lt499: 50.00, gte499: 60.40 },
          { maxKg: 0.3, lt150: 4.70, lt299: 5.70, lt499: 51.00, gte499: 60.80 },
          { maxKg: 0.4, lt150: 4.80, lt299: 5.80, lt499: 52.00, gte499: 61.20 },
          { maxKg: 0.5, lt150: 4.90, lt299: 5.90, lt499: 53.00, gte499: 61.50 }
        ],
        standard: [
          { maxKg: 0.1, lt150: 5.00, lt299: 6.00, lt499: 50.00, gte499: 61.80 },
          { maxKg: 0.2, lt150: 5.10, lt299: 6.10, lt499: 51.00, gte499: 63.00 },
          { maxKg: 0.3, lt150: 5.20, lt299: 6.20, lt499: 52.00, gte499: 64.00 },
          { maxKg: 0.4, lt150: 5.30, lt299: 6.30, lt499: 53.00, gte499: 66.00 },
          { maxKg: 0.5, lt150: 5.40, lt299: 6.40, lt499: 54.00, gte499: 67.00 },
          { maxKg: 0.6, lt150: 5.50, lt299: 6.50, lt499: 55.00, gte499: 68.30 },
          { maxKg: 0.7, lt150: 5.60, lt299: 6.60, lt499: 56.00, gte499: 69.60 },
          { maxKg: 0.8, lt150: 5.70, lt299: 6.70, lt499: 57.00, gte499: 71.00 },
          { maxKg: 0.9, lt150: 5.80, lt299: 6.80, lt499: 58.00, gte499: 72.00 },
          { maxKg: 1.0, lt150: 5.90, lt299: 6.90, lt499: 59.00, gte499: 72.70 }
        ],
        standardOver1: { lt150: 6.00, lt299: 7.00, lt499: 60.00, gte499: 72.80, increment: { lt150: 0.15, lt299: 0.30, lt499: 1.50, gte499: 1.15 } },
        oversize: {
          first1kg: { lt150: 5.20, lt299: 6.20, lt499: 61.00, gte499: 75.40 },
          upTo50Increment: { lt150: 0.25, lt299: 0.50, lt499: 2.80, gte499: 3.50 },
          base50kg: { lt150: 29.70, lt299: 55.20, lt499: 335.40, gte499: 418.40 },
          over50Increment: { lt150: 0.25, lt299: 0.50, lt499: 1.50, gte499: 2.00 }
        }
      },
      special: {
        envelope: [
          { maxKg: 0.1, lt150: 50.02, lt299: 60.02, lt499: 49.00, gte499: 60.00 },
          { maxKg: 0.2, lt150: 50.41, lt299: 60.41, lt499: 50.00, gte499: 60.40 },
          { maxKg: 0.3, lt150: 50.80, lt299: 60.80, lt499: 51.00, gte499: 60.80 },
          { maxKg: 0.4, lt150: 51.19, lt299: 61.19, lt499: 52.00, gte499: 61.20 },
          { maxKg: 0.5, lt150: 51.58, lt299: 61.58, lt499: 53.00, gte499: 61.50 }
        ],
        standard: [
          { maxKg: 0.1, lt150: 51.79, lt299: 61.79, lt499: 50.00, gte499: 61.80 },
          { maxKg: 0.2, lt150: 53.21, lt299: 63.21, lt499: 51.00, gte499: 63.00 },
          { maxKg: 0.3, lt150: 54.62, lt299: 64.62, lt499: 52.00, gte499: 64.00 },
          { maxKg: 0.4, lt150: 56.04, lt299: 66.04, lt499: 53.00, gte499: 66.00 },
          { maxKg: 0.5, lt150: 57.45, lt299: 67.45, lt499: 54.00, gte499: 67.00 },
          { maxKg: 0.6, lt150: 58.86, lt299: 68.86, lt499: 55.00, gte499: 68.30 },
          { maxKg: 0.7, lt150: 59.87, lt299: 69.87, lt499: 56.00, gte499: 69.60 },
          { maxKg: 0.8, lt150: 60.88, lt299: 70.88, lt499: 57.00, gte499: 71.00 },
          { maxKg: 0.9, lt150: 61.89, lt299: 71.89, lt499: 58.00, gte499: 72.00 },
          { maxKg: 1.0, lt150: 62.89, lt299: 72.89, lt499: 59.00, gte499: 72.70 }
        ],
        standardOver1: { lt150: 64.21, lt299: 74.21, lt499: 60.00, gte499: 72.80, increment: { lt150: 1.74, lt299: 1.74, lt499: 1.50, gte499: 1.15 } },
        oversize: {
          first1kg: { lt150: 65.38, lt299: 75.38, lt499: 61.00, gte499: 75.40 },
          upTo50Increment: { lt150: 3.83, lt299: 3.83, lt499: 1.50, gte499: 3.50 },
          base50kg: { lt150: null, lt299: null, lt499: 335.40, gte499: 418.40 },
          over50Increment: { lt150: 3.83, lt299: 3.83, lt499: 1.50, gte499: 2.00 }
        }
      },
      sippDiscount: {
        envelope: 0.83,
        standard: 1.46,
        oversize: 2.92
      }
    }
  };

  const PEAK_FULFILLMENT = {
    periodLabel: "October 15, 2026 - January 14, 2027",
    us: {
      smallStandard: [
        { maxOz: 2, under10: 2.62, band10to50: 3.51, over50: 3.77 },
        { maxOz: 4, under10: 2.68, band10to50: 3.61, over50: 3.87 },
        { maxOz: 6, under10: 2.76, band10to50: 3.65, over50: 3.91 },
        { maxOz: 8, under10: 2.86, band10to50: 3.74, over50: 4.00 },
        { maxOz: 10, under10: 2.98, band10to50: 3.89, over50: 4.15 },
        { maxOz: 12, under10: 3.03, band10to50: 3.99, over50: 4.25 },
        { maxOz: 14, under10: 3.14, band10to50: 4.13, over50: 4.39 },
        { maxOz: 16, under10: 3.17, band10to50: 4.18, over50: 4.44 }
      ],
      largeStandardBands: [
        { maxLb: 0.25, label: "4 oz or less", under10: 3.15, band10to50: 3.97, over50: 4.23 },
        { maxLb: 0.5, label: "4+ to 8 oz", under10: 3.39, band10to50: 4.21, over50: 4.47 },
        { maxLb: 0.75, label: "8+ to 12 oz", under10: 3.66, band10to50: 4.48, over50: 4.74 },
        { maxLb: 1, label: "12+ to 16 oz", under10: 4.07, band10to50: 4.89, over50: 5.15 },
        { maxLb: 1.25, label: "1+ to 1.25 lb", under10: 4.52, band10to50: 5.34, over50: 5.60 },
        { maxLb: 1.5, label: "1.25+ to 1.5 lb", under10: 4.91, band10to50: 5.73, over50: 5.99 },
        { maxLb: 1.75, label: "1.5+ to 1.75 lb", under10: 5.07, band10to50: 5.89, over50: 6.15 },
        { maxLb: 2, label: "1.75+ to 2 lb", under10: 5.33, band10to50: 6.15, over50: 6.41 },
        { maxLb: 2.25, label: "2+ to 2.25 lb", under10: 5.47, band10to50: 6.29, over50: 6.55 },
        { maxLb: 2.5, label: "2.25+ to 2.5 lb", under10: 5.67, band10to50: 6.49, over50: 6.75 },
        { maxLb: 2.75, label: "2.5+ to 2.75 lb", under10: 5.84, band10to50: 6.66, over50: 6.92 },
        { maxLb: 3, label: "2.75+ to 3 lb", under10: 6.26, band10to50: 7.08, over50: 7.34 }
      ],
      largeStandardFormula: { under10: 6.69, band10to50: 7.51, over50: 7.77, increment: 0.08, stepLb: 0.25 },
      smallBulkyFormula: { under10: 7.82, band10to50: 8.59, over50: 8.59, increment: 0.38, thresholdLb: 1 },
      largeBulkyFormula: { under10: 9.62, band10to50: 10.39, over50: 10.39, increment: 0.38, thresholdLb: 1 },
      xl0to50Formula: { under10: 28.29, band10to50: 29.06, over50: 29.06, increment: 0.38, thresholdLb: 1 },
      xl50to70Formula: { under10: 39.36, band10to50: 40.13, over50: 40.13, increment: 0.75, thresholdLb: 51 },
      xl70to150Formula: { under10: 54.97, band10to50: 55.74, over50: 55.74, increment: 0.75, thresholdLb: 71 },
      xl150PlusFormula: { under10: 202.69, band10to50: 203.46, over50: 203.46, increment: 0.19, thresholdLb: 151 }
    },
    ca: {
      envelopeFees: [
        { maxKg: 0.1, label: "First 100 g", amount: 4.73 },
        { maxKg: 0.2, label: "100+ to 200 g", amount: 4.99 },
        { maxKg: 0.3, label: "200+ to 300 g", amount: 5.31 },
        { maxKg: 0.4, label: "300+ to 400 g", amount: 5.60 },
        { maxKg: 0.5, label: "400+ to 500 g", amount: 5.95 }
      ],
      standardFees: [
        { maxKg: 0.1, label: "First 100 g", amount: 6.28 },
        { maxKg: 0.2, label: "100+ to 200 g", amount: 6.49 },
        { maxKg: 0.3, label: "200+ to 300 g", amount: 6.74 },
        { maxKg: 0.4, label: "300+ to 400 g", amount: 7.13 },
        { maxKg: 0.5, label: "400+ to 500 g", amount: 7.65 },
        { maxKg: 0.6, label: "500+ to 600 g", amount: 7.84 },
        { maxKg: 0.7, label: "600+ to 700 g", amount: 8.17 },
        { maxKg: 0.8, label: "700+ to 800 g", amount: 8.43 },
        { maxKg: 0.9, label: "800+ to 900 g", amount: 8.74 },
        { maxKg: 1.0, label: "900+ to 1,000 g", amount: 8.99 },
        { maxKg: 1.1, label: "1,000+ to 1,100 g", amount: 9.10 },
        { maxKg: 1.2, label: "1,100+ to 1,200 g", amount: 9.37 },
        { maxKg: 1.3, label: "1,200+ to 1,300 g", amount: 9.58 },
        { maxKg: 1.4, label: "1,300+ to 1,400 g", amount: 9.85 },
        { maxKg: 1.5, label: "1,400+ to 1,500 g", amount: 10.17 }
      ],
      standardOver: { base: 11.00, label: "1,500+ to 9,000 g", increment: 0.09, stepKg: 0.1 },
      oversize: {
        small_oversize: { base: 16.77, increment: 0.46, label: "First 500 g (32 kg or less)" },
        medium_oversize: { base: 41.64, increment: 0.52, label: "First 500 g (68 kg or less)" },
        large_oversize: { base: 89.59, increment: 0.58, label: "First 500 g (68 kg or less)" },
        special_oversize: { base: 166.85, increment: 0.58, label: "First 500 g (over 68 kg)" }
      }
    }
  };

  // Seller Central GABBX6GZPA8MSZGW, verified 2026-11-06; table rates exclude fuel surcharge.
  const US_FEE_CARDS = {
  "regular2027": {
    "non_apparel": {
      "smallStandard": [
        { "maxOz": 2, "under10": 2.64, "band10to50": 3.75, "over50": 4.31 },
        { "maxOz": 4, "under10": 2.72, "band10to50": 3.78, "over50": 4.34 },
        { "maxOz": 6, "under10": 2.8, "band10to50": 3.92, "over50": 4.47 },
        { "maxOz": 8, "under10": 2.83, "band10to50": 3.97, "over50": 4.53 },
        { "maxOz": 10, "under10": 2.87, "band10to50": 4.06, "over50": 4.62 },
        { "maxOz": 12, "under10": 2.92, "band10to50": 4.16, "over50": 4.73 },
        { "maxOz": 14, "under10": 2.96, "band10to50": 4.3, "over50": 4.85 },
        { "maxOz": 16, "under10": 2.99, "band10to50": 4.32, "over50": 4.88 }
      ],
      "largeStandardBands": [
        { "maxLb": 0.25, "label": "4 oz or less", "under10": 2.91, "band10to50": 3.79, "over50": 4.35 },
        { "maxLb": 0.5, "label": "4+ to 8 oz", "under10": 3.13, "band10to50": 4.01, "over50": 4.57 },
        { "maxLb": 0.75, "label": "8+ to 12 oz", "under10": 3.38, "band10to50": 4.26, "over50": 4.83 },
        { "maxLb": 1.0, "label": "12+ to 16 oz", "under10": 3.78, "band10to50": 4.67, "over50": 5.23 },
        { "maxLb": 1.25, "label": "1+ to 1.25 lb", "under10": 4.22, "band10to50": 5.19, "over50": 5.75 },
        { "maxLb": 1.5, "label": "1.25+ to 1.5 lb", "under10": 4.6, "band10to50": 5.57, "over50": 6.14 },
        { "maxLb": 1.75, "label": "1.5+ to 1.75 lb", "under10": 4.75, "band10to50": 5.72, "over50": 6.29 },
        { "maxLb": 2.0, "label": "1.75+ to 2 lb", "under10": 5.0, "band10to50": 5.98, "over50": 6.54 },
        { "maxLb": 2.25, "label": "2+ to 2.25 lb", "under10": 5.1, "band10to50": 6.08, "over50": 6.64 },
        { "maxLb": 2.5, "label": "2.25+ to 2.5 lb", "under10": 5.28, "band10to50": 6.26, "over50": 6.83 },
        { "maxLb": 2.75, "label": "2.5+ to 2.75 lb", "under10": 5.44, "band10to50": 6.42, "over50": 6.99 },
        { "maxLb": 3.0, "label": "2.75+ to 3 lb", "under10": 5.85, "band10to50": 6.85, "over50": 7.41 }
      ],
      "largeStandardFormula": {
        "under10": 6.15,
        "band10to50": 7.16,
        "over50": 7.73,
        "increment": 0.08,
        "thresholdLb": 3,
        "stepLb": 0.25
      },
      "formulas": {
        "small_bulky": {
          "under10": 6.73,
          "band10to50": 7.51,
          "over50": 7.51,
          "increment": 0.39,
          "thresholdLb": 1,
          "stepLb": 1
        },
        "medium_bulky": {
          "under10": 6.88,
          "band10to50": 7.66,
          "over50": 7.66,
          "increment": 0.39,
          "thresholdLb": 1,
          "stepLb": 1
        },
        "large_bulky": {
          "under10": 9.09,
          "band10to50": 9.88,
          "over50": 9.88,
          "increment": 0.39,
          "thresholdLb": 1,
          "stepLb": 1
        },
        "extra_large_bulky": {
          "under10": 9.31,
          "band10to50": 10.09,
          "over50": 10.09,
          "increment": 0.39,
          "thresholdLb": 1,
          "stepLb": 1
        },
        "small_oversize": {
          "under10": 13.44,
          "band10to50": 14.22,
          "over50": 14.22,
          "increment": 0.28,
          "thresholdLb": 1,
          "stepLb": 1
        },
        "medium_oversize": {
          "under10": 27.36,
          "band10to50": 28.15,
          "over50": 28.15,
          "increment": 0.56,
          "thresholdLb": 51,
          "stepLb": 1
        },
        "large_oversize": {
          "under10": 37.97,
          "band10to50": 38.75,
          "over50": 38.75,
          "increment": 0.68,
          "thresholdLb": 51,
          "stepLb": 1
        },
        "long_oversize": {
          "under10": 62.97,
          "band10to50": 63.75,
          "over50": 63.75,
          "increment": 0.3,
          "thresholdLb": 1,
          "stepLb": 1
        },
        "special_oversize_light": {
          "under10": 71.09,
          "band10to50": 71.87,
          "over50": 71.87,
          "increment": 0.3,
          "thresholdLb": 1,
          "stepLb": 1
        },
        "special_oversize_heavy": {
          "under10": 190.5,
          "band10to50": 191.28,
          "over50": 191.28,
          "increment": 0.19,
          "thresholdLb": 151,
          "stepLb": 1
        }
      }
    },
    "apparel": {
      "smallStandard": [
        { "maxOz": 2, "under10": 2.83, "band10to50": 3.92, "over50": 4.54 },
        { "maxOz": 4, "under10": 2.85, "band10to50": 3.95, "over50": 4.57 },
        { "maxOz": 6, "under10": 2.9, "band10to50": 4.01, "over50": 4.62 },
        { "maxOz": 8, "under10": 3.03, "band10to50": 4.11, "over50": 4.72 },
        { "maxOz": 10, "under10": 3.17, "band10to50": 4.25, "over50": 4.74 },
        { "maxOz": 12, "under10": 3.27, "band10to50": 4.43, "over50": 4.92 },
        { "maxOz": 14, "under10": 3.38, "band10to50": 4.55, "over50": 5.03 },
        { "maxOz": 16, "under10": 3.48, "band10to50": 4.6, "over50": 5.08 }
      ],
      "largeStandardBands": [
        { "maxLb": 0.25, "label": "4 oz or less", "under10": 3.53, "band10to50": 4.36, "over50": 4.93 },
        { "maxLb": 0.5, "label": "4+ to 8 oz", "under10": 3.74, "band10to50": 4.57, "over50": 5.13 },
        { "maxLb": 0.75, "label": "8+ to 12 oz", "under10": 3.96, "band10to50": 4.79, "over50": 5.35 },
        { "maxLb": 1.0, "label": "12+ to 16 oz", "under10": 4.42, "band10to50": 5.25, "over50": 5.81 },
        { "maxLb": 1.25, "label": "1+ to 1.25 lb", "under10": 5.13, "band10to50": 5.96, "over50": 6.52 },
        { "maxLb": 1.5, "label": "1.25+ to 1.5 lb", "under10": 5.3, "band10to50": 6.13, "over50": 6.69 },
        { "maxLb": 1.75, "label": "1.5+ to 1.75 lb", "under10": 5.4, "band10to50": 6.23, "over50": 6.8 },
        { "maxLb": 2.0, "label": "1.75+ to 2 lb", "under10": 5.51, "band10to50": 6.34, "over50": 6.91 },
        { "maxLb": 2.25, "label": "2+ to 2.25 lb", "under10": 5.87, "band10to50": 6.7, "over50": 7.26 },
        { "maxLb": 2.5, "label": "2.25+ to 2.5 lb", "under10": 5.99, "band10to50": 6.82, "over50": 7.38 },
        { "maxLb": 2.75, "label": "2.5+ to 2.75 lb", "under10": 6.04, "band10to50": 6.87, "over50": 7.44 },
        { "maxLb": 3.0, "label": "2.75+ to 3 lb", "under10": 6.17, "band10to50": 7.0, "over50": 7.57 }
      ],
      "largeStandardFormula": {
        "under10": 6.24,
        "band10to50": 7.07,
        "over50": 7.64,
        "increment": 0.16,
        "thresholdLb": 3,
        "stepLb": 0.5
      },
      "formulas": {
        "small_bulky": {
          "under10": 6.73,
          "band10to50": 7.51,
          "over50": 7.51,
          "increment": 0.39,
          "thresholdLb": 1,
          "stepLb": 1
        },
        "medium_bulky": {
          "under10": 6.88,
          "band10to50": 7.66,
          "over50": 7.66,
          "increment": 0.39,
          "thresholdLb": 1,
          "stepLb": 1
        },
        "large_bulky": {
          "under10": 9.09,
          "band10to50": 9.88,
          "over50": 9.88,
          "increment": 0.39,
          "thresholdLb": 1,
          "stepLb": 1
        },
        "extra_large_bulky": {
          "under10": 9.31,
          "band10to50": 10.09,
          "over50": 10.09,
          "increment": 0.39,
          "thresholdLb": 1,
          "stepLb": 1
        },
        "small_oversize": {
          "under10": 13.44,
          "band10to50": 14.22,
          "over50": 14.22,
          "increment": 0.28,
          "thresholdLb": 1,
          "stepLb": 1
        },
        "medium_oversize": {
          "under10": 27.36,
          "band10to50": 28.15,
          "over50": 28.15,
          "increment": 0.56,
          "thresholdLb": 51,
          "stepLb": 1
        },
        "large_oversize": {
          "under10": 37.97,
          "band10to50": 38.75,
          "over50": 38.75,
          "increment": 0.68,
          "thresholdLb": 51,
          "stepLb": 1
        },
        "long_oversize": {
          "under10": 62.97,
          "band10to50": 63.75,
          "over50": 63.75,
          "increment": 0.3,
          "thresholdLb": 1,
          "stepLb": 1
        },
        "special_oversize_light": {
          "under10": 71.09,
          "band10to50": 71.87,
          "over50": 71.87,
          "increment": 0.3,
          "thresholdLb": 1,
          "stepLb": 1
        },
        "special_oversize_heavy": {
          "under10": 190.5,
          "band10to50": 191.28,
          "over50": 191.28,
          "increment": 0.19,
          "thresholdLb": 151,
          "stepLb": 1
        }
      }
    },
    "dangerous_goods": {
      "smallStandard": [
        { "maxOz": 2, "under10": 3.57, "band10to50": 4.59, "over50": 5.15 },
        { "maxOz": 4, "under10": 3.62, "band10to50": 4.61, "over50": 5.17 },
        { "maxOz": 6, "under10": 3.69, "band10to50": 4.75, "over50": 5.32 },
        { "maxOz": 8, "under10": 3.71, "band10to50": 4.8, "over50": 5.37 },
        { "maxOz": 10, "under10": 3.74, "band10to50": 4.88, "over50": 5.45 },
        { "maxOz": 12, "under10": 3.75, "band10to50": 4.97, "over50": 5.54 },
        { "maxOz": 14, "under10": 3.79, "band10to50": 5.01, "over50": 5.57 },
        { "maxOz": 16, "under10": 3.83, "band10to50": 5.04, "over50": 5.6 }
      ],
      "largeStandardBands": [
        { "maxLb": 0.25, "label": "4 oz or less", "under10": 3.73, "band10to50": 4.62, "over50": 5.18 },
        { "maxLb": 0.5, "label": "4+ to 8 oz", "under10": 3.94, "band10to50": 4.83, "over50": 5.4 },
        { "maxLb": 0.75, "label": "8+ to 12 oz", "under10": 4.17, "band10to50": 5.06, "over50": 5.63 },
        { "maxLb": 1.0, "label": "12+ to 16 oz", "under10": 4.37, "band10to50": 5.27, "over50": 5.83 },
        { "maxLb": 1.25, "label": "1+ to 1.25 lb", "under10": 4.82, "band10to50": 5.79, "over50": 6.36 },
        { "maxLb": 1.5, "label": "1.25+ to 1.5 lb", "under10": 5.2, "band10to50": 6.18, "over50": 6.74 },
        { "maxLb": 1.75, "label": "1.5+ to 1.75 lb", "under10": 5.35, "band10to50": 6.33, "over50": 6.9 },
        { "maxLb": 2.0, "label": "1.75+ to 2 lb", "under10": 5.49, "band10to50": 6.47, "over50": 7.04 },
        { "maxLb": 2.25, "label": "2+ to 2.25 lb", "under10": 5.56, "band10to50": 6.55, "over50": 7.11 },
        { "maxLb": 2.5, "label": "2.25+ to 2.5 lb", "under10": 5.74, "band10to50": 6.73, "over50": 7.29 },
        { "maxLb": 2.75, "label": "2.5+ to 2.75 lb", "under10": 5.9, "band10to50": 6.89, "over50": 7.45 },
        { "maxLb": 3.0, "label": "2.75+ to 3 lb", "under10": 6.31, "band10to50": 7.32, "over50": 7.88 }
      ],
      "largeStandardFormula": {
        "under10": 6.61,
        "band10to50": 7.63,
        "over50": 8.2,
        "increment": 0.08,
        "thresholdLb": 3,
        "stepLb": 0.25
      },
      "formulas": {
        "small_bulky": {
          "under10": 7.46,
          "band10to50": 8.24,
          "over50": 8.24,
          "increment": 0.39,
          "thresholdLb": 1,
          "stepLb": 1
        },
        "medium_bulky": {
          "under10": 7.61,
          "band10to50": 8.39,
          "over50": 8.39,
          "increment": 0.39,
          "thresholdLb": 1,
          "stepLb": 1
        },
        "large_bulky": {
          "under10": 9.83,
          "band10to50": 10.61,
          "over50": 10.61,
          "increment": 0.39,
          "thresholdLb": 1,
          "stepLb": 1
        },
        "extra_large_bulky": {
          "under10": 10.04,
          "band10to50": 10.82,
          "over50": 10.82,
          "increment": 0.39,
          "thresholdLb": 1,
          "stepLb": 1
        },
        "small_oversize": {
          "under10": 15.58,
          "band10to50": 16.36,
          "over50": 16.36,
          "increment": 0.28,
          "thresholdLb": 1,
          "stepLb": 1
        },
        "medium_oversize": {
          "under10": 30.62,
          "band10to50": 31.4,
          "over50": 31.4,
          "increment": 0.56,
          "thresholdLb": 51,
          "stepLb": 1
        },
        "large_oversize": {
          "under10": 45.21,
          "band10to50": 45.99,
          "over50": 45.99,
          "increment": 0.68,
          "thresholdLb": 51,
          "stepLb": 1
        },
        "long_oversize": {
          "under10": 70.21,
          "band10to50": 70.99,
          "over50": 70.99,
          "increment": 0.3,
          "thresholdLb": 1,
          "stepLb": 1
        },
        "special_oversize_light": {
          "under10": 78.33,
          "band10to50": 79.11,
          "over50": 79.11,
          "increment": 0.3,
          "thresholdLb": 1,
          "stepLb": 1
        },
        "special_oversize_heavy": {
          "under10": 215.44,
          "band10to50": 216.23,
          "over50": 216.23,
          "increment": 0.19,
          "thresholdLb": 151,
          "stepLb": 1
        }
      }
    }
  },
  "peak2026": {
    "non_apparel": {
      "smallStandard": [
        { "maxOz": 2, "under10": 2.62, "band10to50": 3.51, "over50": 3.77 },
        { "maxOz": 4, "under10": 2.68, "band10to50": 3.61, "over50": 3.87 },
        { "maxOz": 6, "under10": 2.76, "band10to50": 3.65, "over50": 3.91 },
        { "maxOz": 8, "under10": 2.86, "band10to50": 3.74, "over50": 4.0 },
        { "maxOz": 10, "under10": 2.98, "band10to50": 3.89, "over50": 4.15 },
        { "maxOz": 12, "under10": 3.03, "band10to50": 3.99, "over50": 4.25 },
        { "maxOz": 14, "under10": 3.14, "band10to50": 4.13, "over50": 4.39 },
        { "maxOz": 16, "under10": 3.17, "band10to50": 4.18, "over50": 4.44 }
      ],
      "largeStandardBands": [
        { "maxLb": 0.25, "label": "4 oz or less", "under10": 3.15, "band10to50": 3.97, "over50": 4.23 },
        { "maxLb": 0.5, "label": "4+ to 8 oz", "under10": 3.39, "band10to50": 4.21, "over50": 4.47 },
        { "maxLb": 0.75, "label": "8+ to 12 oz", "under10": 3.66, "band10to50": 4.48, "over50": 4.74 },
        { "maxLb": 1.0, "label": "12+ to 16 oz", "under10": 4.07, "band10to50": 4.89, "over50": 5.15 },
        { "maxLb": 1.25, "label": "1+ to 1.25 lb", "under10": 4.52, "band10to50": 5.34, "over50": 5.6 },
        { "maxLb": 1.5, "label": "1.25+ to 1.5 lb", "under10": 4.91, "band10to50": 5.73, "over50": 5.99 },
        { "maxLb": 1.75, "label": "1.5+ to 1.75 lb", "under10": 5.07, "band10to50": 5.89, "over50": 6.15 },
        { "maxLb": 2.0, "label": "1.75+ to 2 lb", "under10": 5.33, "band10to50": 6.15, "over50": 6.41 },
        { "maxLb": 2.25, "label": "2+ to 2.25 lb", "under10": 5.47, "band10to50": 6.29, "over50": 6.55 },
        { "maxLb": 2.5, "label": "2.25+ to 2.5 lb", "under10": 5.67, "band10to50": 6.49, "over50": 6.75 },
        { "maxLb": 2.75, "label": "2.5+ to 2.75 lb", "under10": 5.84, "band10to50": 6.66, "over50": 6.92 },
        { "maxLb": 3.0, "label": "2.75+ to 3 lb", "under10": 6.26, "band10to50": 7.08, "over50": 7.34 }
      ],
      "largeStandardFormula": {
        "under10": 6.69,
        "band10to50": 7.51,
        "over50": 7.77,
        "increment": 0.08,
        "thresholdLb": 3,
        "stepLb": 0.25
      },
      "formulas": {
        "small_bulky": {
          "under10": 7.82,
          "band10to50": 8.59,
          "over50": 8.59,
          "increment": 0.38,
          "thresholdLb": 1,
          "stepLb": 1
        },
        "large_bulky": {
          "under10": 9.62,
          "band10to50": 10.39,
          "over50": 10.39,
          "increment": 0.38,
          "thresholdLb": 1,
          "stepLb": 1
        },
        "xl_0_50": {
          "under10": 28.29,
          "band10to50": 29.06,
          "over50": 29.06,
          "increment": 0.38,
          "thresholdLb": 1,
          "stepLb": 1
        },
        "xl_50_70": {
          "under10": 39.36,
          "band10to50": 40.13,
          "over50": 40.13,
          "increment": 0.75,
          "thresholdLb": 51,
          "stepLb": 1
        },
        "xl_70_150": {
          "under10": 54.97,
          "band10to50": 55.74,
          "over50": 55.74,
          "increment": 0.75,
          "thresholdLb": 71,
          "stepLb": 1
        },
        "xl_150_plus": {
          "under10": 202.69,
          "band10to50": 203.46,
          "over50": 203.46,
          "increment": 0.19,
          "thresholdLb": 151,
          "stepLb": 1
        }
      }
    },
    "apparel": {
      "smallStandard": [
        { "maxOz": 2, "under10": 2.85, "band10to50": 3.74, "over50": 4.0 },
        { "maxOz": 4, "under10": 2.87, "band10to50": 3.77, "over50": 4.03 },
        { "maxOz": 6, "under10": 2.93, "band10to50": 3.84, "over50": 4.1 },
        { "maxOz": 8, "under10": 3.06, "band10to50": 3.94, "over50": 4.2 },
        { "maxOz": 10, "under10": 3.27, "band10to50": 4.18, "over50": 4.44 },
        { "maxOz": 12, "under10": 3.37, "band10to50": 4.36, "over50": 4.62 },
        { "maxOz": 14, "under10": 3.49, "band10to50": 4.49, "over50": 4.75 },
        { "maxOz": 16, "under10": 3.59, "band10to50": 4.54, "over50": 4.8 }
      ],
      "largeStandardBands": [
        { "maxLb": 0.25, "label": "4 oz or less", "under10": 3.79, "band10to50": 4.61, "over50": 4.87 },
        { "maxLb": 0.5, "label": "4+ to 8 oz", "under10": 4.0, "band10to50": 4.82, "over50": 5.08 },
        { "maxLb": 0.75, "label": "8+ to 12 oz", "under10": 4.23, "band10to50": 5.05, "over50": 5.31 },
        { "maxLb": 1.0, "label": "12+ to 16 oz", "under10": 4.69, "band10to50": 5.51, "over50": 5.77 },
        { "maxLb": 1.25, "label": "1+ to 1.25 lb", "under10": 5.42, "band10to50": 6.24, "over50": 6.5 },
        { "maxLb": 1.5, "label": "1.25+ to 1.5 lb", "under10": 5.59, "band10to50": 6.41, "over50": 6.67 },
        { "maxLb": 1.75, "label": "1.5+ to 1.75 lb", "under10": 5.71, "band10to50": 6.53, "over50": 6.79 },
        { "maxLb": 2.0, "label": "1.75+ to 2 lb", "under10": 5.82, "band10to50": 6.64, "over50": 6.9 },
        { "maxLb": 2.25, "label": "2+ to 2.25 lb", "under10": 6.22, "band10to50": 7.04, "over50": 7.3 },
        { "maxLb": 2.5, "label": "2.25+ to 2.5 lb", "under10": 6.34, "band10to50": 7.16, "over50": 7.42 },
        { "maxLb": 2.75, "label": "2.5+ to 2.75 lb", "under10": 6.41, "band10to50": 7.23, "over50": 7.49 },
        { "maxLb": 3.0, "label": "2.75+ to 3 lb", "under10": 6.54, "band10to50": 7.36, "over50": 7.62 }
      ],
      "largeStandardFormula": {
        "under10": 6.82,
        "band10to50": 7.64,
        "over50": 7.9,
        "increment": 0.16,
        "thresholdLb": 3,
        "stepLb": 0.5
      },
      "formulas": {
        "small_bulky": {
          "under10": 7.82,
          "band10to50": 8.59,
          "over50": 8.59,
          "increment": 0.38,
          "thresholdLb": 1,
          "stepLb": 1
        },
        "large_bulky": {
          "under10": 9.62,
          "band10to50": 10.39,
          "over50": 10.39,
          "increment": 0.38,
          "thresholdLb": 1,
          "stepLb": 1
        },
        "xl_0_50": {
          "under10": 28.29,
          "band10to50": 29.06,
          "over50": 29.06,
          "increment": 0.38,
          "thresholdLb": 1,
          "stepLb": 1
        },
        "xl_50_70": {
          "under10": 39.36,
          "band10to50": 40.13,
          "over50": 40.13,
          "increment": 0.75,
          "thresholdLb": 51,
          "stepLb": 1
        },
        "xl_70_150": {
          "under10": 54.97,
          "band10to50": 55.74,
          "over50": 55.74,
          "increment": 0.75,
          "thresholdLb": 71,
          "stepLb": 1
        },
        "xl_150_plus": {
          "under10": 202.69,
          "band10to50": 203.46,
          "over50": 203.46,
          "increment": 0.19,
          "thresholdLb": 151,
          "stepLb": 1
        }
      }
    },
    "dangerous_goods": {
      "smallStandard": [
        { "maxOz": 2, "under10": 3.74, "band10to50": 4.63, "over50": 4.89 },
        { "maxOz": 4, "under10": 3.8, "band10to50": 4.73, "over50": 4.99 },
        { "maxOz": 6, "under10": 3.88, "band10to50": 4.77, "over50": 5.03 },
        { "maxOz": 8, "under10": 3.98, "band10to50": 4.86, "over50": 5.12 },
        { "maxOz": 10, "under10": 4.1, "band10to50": 5.01, "over50": 5.27 },
        { "maxOz": 12, "under10": 4.14, "band10to50": 5.1, "over50": 5.36 },
        { "maxOz": 14, "under10": 4.25, "band10to50": 5.24, "over50": 5.5 },
        { "maxOz": 16, "under10": 4.32, "band10to50": 5.33, "over50": 5.59 }
      ],
      "largeStandardBands": [
        { "maxLb": 0.25, "label": "4 oz or less", "under10": 4.32, "band10to50": 5.14, "over50": 5.4 },
        { "maxLb": 0.5, "label": "4+ to 8 oz", "under10": 4.56, "band10to50": 5.38, "over50": 5.64 },
        { "maxLb": 0.75, "label": "8+ to 12 oz", "under10": 4.82, "band10to50": 5.64, "over50": 5.9 },
        { "maxLb": 1.0, "label": "12+ to 16 oz", "under10": 5.04, "band10to50": 5.86, "over50": 6.12 },
        { "maxLb": 1.25, "label": "1+ to 1.25 lb", "under10": 5.51, "band10to50": 6.33, "over50": 6.59 },
        { "maxLb": 1.5, "label": "1.25+ to 1.5 lb", "under10": 5.91, "band10to50": 6.73, "over50": 6.99 },
        { "maxLb": 1.75, "label": "1.5+ to 1.75 lb", "under10": 6.08, "band10to50": 6.9, "over50": 7.16 },
        { "maxLb": 2.0, "label": "1.75+ to 2 lb", "under10": 6.24, "band10to50": 7.06, "over50": 7.32 },
        { "maxLb": 2.25, "label": "2+ to 2.25 lb", "under10": 6.33, "band10to50": 7.15, "over50": 7.41 },
        { "maxLb": 2.5, "label": "2.25+ to 2.5 lb", "under10": 6.53, "band10to50": 7.35, "over50": 7.61 },
        { "maxLb": 2.75, "label": "2.5+ to 2.75 lb", "under10": 6.7, "band10to50": 7.52, "over50": 7.78 },
        { "maxLb": 3.0, "label": "2.75+ to 3 lb", "under10": 7.12, "band10to50": 7.94, "over50": 8.2 }
      ],
      "largeStandardFormula": {
        "under10": 7.51,
        "band10to50": 8.33,
        "over50": 8.59,
        "increment": 0.08,
        "thresholdLb": 3,
        "stepLb": 0.25
      },
      "formulas": {
        "small_bulky": {
          "under10": 9.06,
          "band10to50": 9.83,
          "over50": 9.83,
          "increment": 0.38,
          "thresholdLb": 1,
          "stepLb": 1
        },
        "large_bulky": {
          "under10": 10.86,
          "band10to50": 11.63,
          "over50": 11.63,
          "increment": 0.38,
          "thresholdLb": 1,
          "stepLb": 1
        },
        "xl_0_50": {
          "under10": 31.71,
          "band10to50": 32.48,
          "over50": 32.48,
          "increment": 0.38,
          "thresholdLb": 1,
          "stepLb": 1
        },
        "xl_50_70": {
          "under10": 43.86,
          "band10to50": 44.63,
          "over50": 44.63,
          "increment": 0.75,
          "thresholdLb": 51,
          "stepLb": 1
        },
        "xl_70_150": {
          "under10": 64.04,
          "band10to50": 64.81,
          "over50": 64.81,
          "increment": 0.75,
          "thresholdLb": 71,
          "stepLb": 1
        },
        "xl_150_plus": {
          "under10": 230.84,
          "band10to50": 231.61,
          "over50": 231.61,
          "increment": 0.19,
          "thresholdLb": 151,
          "stepLb": 1
        }
      }
    }
  }
};

  // Canada Seller Central GABBX6GZPA8MSZGW / G201105770; checked 2026-11-09.
  const CA_2027 = {
    envelopeFees: [4.53,4.78,5.09,5.36,5.70].map((amount,i)=>({maxKg:(i+1)/10,label:`Up to ${(i+1)*100} g`,amount})),
    standardFees: [6.01,6.21,6.46,6.83,7.34,7.51,7.83,8.07,8.37,8.62,8.71,8.97,9.18,9.43,9.74].map((amount,i)=>({maxKg:(i+1)/10,label:`Up to ${(i+1)*100} g`,amount})),
    standardOver: {base:10.47,increment:0.09,label:"Above first 1,500 g"},
    oversize: {
      small_bulky:{base:15.66,increment:0.48}, large_bulky:{base:19.60,increment:0.48},
      xl_0_30:{base:38.35,increment:0.60}, xl_30_68:{base:83.43,increment:0.60}, xl_68_plus:{base:153.04,increment:0.60}
    }
  };

  const dom = {};
  const historyApi = globalThis.FBA_HISTORY || {};

  function round2(value) {
    return Math.round(value * 100) / 100;
  }

  function money(value, marketCode) {
    return `${DATA.markets[marketCode].currency} ${round2(value).toFixed(2)}`;
  }

  function formatEffectiveDate(dateString) {
    if (dateString === "2026-04-17") return "April 17, 2026";
    return dateString;
  }

  function fuelLogisticsRuleNa(market) {
    if (typeof surchargeRules.getNaFuelLogisticsRule === "function") {
      return surchargeRules.getNaFuelLogisticsRule(market);
    }
    return {
      applicable: false,
      rate: 0,
      effectiveDate: "2026-04-17",
      scopeLabel: market
    };
  }

  function fuelLogisticsSurchargeNa(input, base) {
    const rule = fuelLogisticsRuleNa(input.market);
    const enabled = input.fuelLogisticsSurcharge && base.supported;
    const surcharge = typeof surchargeRules.buildFuelLogisticsSurcharge === "function"
      ? surchargeRules.buildFuelLogisticsSurcharge(rule, base.amount, enabled)
      : {
          label: "Fuel & logistics surcharge",
          applicable: rule.applicable,
          enabled,
          applied: enabled && rule.applicable,
          rate: rule.rate,
          effectiveDate: rule.effectiveDate,
          scopeLabel: rule.scopeLabel,
          amount: enabled && rule.applicable ? round2(base.amount * rule.rate) : 0
        };

    let detail;
    if (!rule.applicable) {
      detail = "Current temporary surcharge is only configured for US and CA. MX is not applicable.";
    } else if (input.fuelLogisticsSurcharge) {
      detail = `Applies ${(rule.rate * 100).toFixed(1)}% to base fulfilment fee from ${formatEffectiveDate(rule.effectiveDate)}.`;
    } else {
      detail = `Available from ${formatEffectiveDate(rule.effectiveDate)} at ${(rule.rate * 100).toFixed(1)}% of base fulfilment fee; toggle currently off.`;
    }

    return {
      ...surcharge,
      detail
    };
  }

  function toInches(value, unit) {
    if (unit === "cm") return value / 2.54;
    return value;
  }

  function toCentimeters(value, unit) {
    if (unit === "in") return value * 2.54;
    return value;
  }

  function toPounds(value, unit) {
    if (unit === "kg") return value / 0.45359237;
    if (unit === "oz") return value / 16;
    return value;
  }

  function toKilograms(value, unit) {
    if (unit === "lb") return value * 0.45359237;
    if (unit === "oz") return value * 0.028349523125;
    return value;
  }

  function sortedDims(length, width, height) {
    return [length, width, height].sort((a, b) => b - a);
  }

  function lengthPlusGirth(dims) {
    return dims[0] + (2 * (dims[1] + dims[2]));
  }

  function ceilTo(value, step) {
    return Math.ceil((value - 1e-9) / step) * step;
  }

  function bandByLimit(rows, value, key) {
    return rows.find((row) => value <= row[key] + 1e-9) || rows[rows.length - 1];
  }

  function priceBandUs(price) {
    if (price < 10) return "under10";
    if (price <= 50) return "band10to50";
    return "over50";
  }

  function priceBandLabelUs(price) {
    if (price < 10) return "< $10";
    if (price <= 50) return "$10 - $50";
    return "> $50";
  }

  function priceBandMx(price) {
    if (price < 150) return "lt150";
    if (price < 299) return "lt299";
    if (price < 499) return "lt499";
    return "gte499";
  }

  function priceBandLabelMx(price) {
    if (price < 150) return "< MXN 150";
    if (price < 299) return "MXN 150 - 299";
    if (price < 499) return "MXN 299 - 499";
    return ">= MXN 499";
  }

  function priceBandKey(input) {
    if (input.market === "US") return priceBandUs(input.price);
    if (input.market === "MX") return priceBandMx(input.price);
    return null;
  }

  function priceBandLabel(input) {
    if (input.market === "US") return priceBandLabelUs(input.price);
    if (input.market === "MX") return priceBandLabelMx(input.price);
    return "不适用";
  }

  function peakFulfillmentInfo(input, applied, detail) {
    return {
      label: "Peak fulfilment fee",
      enabled: input.peakFulfillmentFees,
      applied,
      detail
    };
  }

  function withPeakFulfillment(base, input, applied, detail) {
    return {
      ...base,
      peakFulfillment: peakFulfillmentInfo(input, applied, detail)
    };
  }

  function collectInput() {
    const fd = new FormData(dom.form);
    const length = Number(fd.get("length"));
    const width = Number(fd.get("width"));
    const height = Number(fd.get("height"));
    const weight = Number(fd.get("weight"));
    const priceValue = fd.get("price");
    const price = priceValue === "" ? null : Number(priceValue);
    const dimensionUnit = fd.get("dimensionUnit");
    const weightUnit = fd.get("weightUnit");

    return {
      market: fd.get("market"),
      category: fd.get("category"),
      lengthRaw: length,
      widthRaw: width,
      heightRaw: height,
      weightRaw: weight,
      price,
      dimensionUnit,
      weightUnit,
      lengthIn: toInches(length, dimensionUnit),
      widthIn: toInches(width, dimensionUnit),
      heightIn: toInches(height, dimensionUnit),
      lengthCm: toCentimeters(length, dimensionUnit),
      widthCm: toCentimeters(width, dimensionUnit),
      heightCm: toCentimeters(height, dimensionUnit),
      unitWeightLb: toPounds(weight, weightUnit),
      unitWeightKg: toKilograms(weight, weightUnit),
      fuelLogisticsSurcharge: fd.get("fuelLogisticsSurcharge") === "on",
      peakFulfillmentFees: fd.get("peakFulfillmentFees") === "on",
      lowPriceExcluded: fd.get("lowPriceExcluded") === "on",
      noTrailingShipments: fd.get("noTrailingShipments") === "on",
      largeStandardDimMinimum: fd.get("largeStandardDimMinimum") === "on",
      sippCertified: fd.get("sippCertified") === "on",
      caSippDiscount: fd.get("caSippDiscount") == null || fd.get("caSippDiscount") === "" ? null : Number(fd.get("caSippDiscount")),
      longTermDos: fd.get("longTermDos") ? Number(fd.get("longTermDos")) : null,
      shortTermDos: fd.get("shortTermDos") ? Number(fd.get("shortTermDos")) : null,
      groceryExempt: fd.get("groceryExempt") === "on",
      newSellerExempt: fd.get("newSellerExempt") === "on",
      newToFbaExempt: fd.get("newToFbaExempt") === "on",
      awdExempt: fd.get("awdExempt") === "on",
      slowMoverExempt: fd.get("slowMoverExempt") === "on"
    };
  }

  function validateInput(input) {
    const nums = [input.lengthRaw, input.widthRaw, input.heightRaw, input.weightRaw];
    if (!nums.every((value) => Number.isFinite(value) && value > 0)) return false;
    if (DATA.markets[input.market].priceRequired) {
      return Number.isFinite(input.price) && input.price > 0;
    }
    return input.price == null || (Number.isFinite(input.price) && input.price > 0);
  }

  function dimensionalWeightUs(dimsIn) {
    return (dimsIn[0] * Math.max(dimsIn[1], 2) * Math.max(dimsIn[2], 2)) / 139;
  }

  function dimensionalWeightUsActual(dimsIn) {
    return (dimsIn[0] * dimsIn[1] * dimsIn[2]) / 139;
  }

  function dimensionalWeightMetric(dimsCm) {
    return (dimsCm[0] * dimsCm[1] * dimsCm[2]) / 5000;
  }

  function classifyUs2026(input) {
    const dims = sortedDims(input.lengthIn, input.widthIn, input.heightIn);
    const dimWeightLargeStandardLb = input.largeStandardDimMinimum
      ? dimensionalWeightUs(dims)
      : dimensionalWeightUsActual(dims);
    const dimWeightLb = dimensionalWeightUs(dims);
    const smallStandardUnitOz = input.unitWeightLb * 16;
    const lpg = lengthPlusGirth(dims);

    if (smallStandardUnitOz <= 16 && dims[0] <= 15 && dims[1] <= 12 && dims[2] <= 0.75) {
      return {
        market: "US",
        key: "small_standard",
        label: "Small standard-size",
        dims,
        dimensionUnit: "in",
        rawShippingWeight: input.unitWeightLb,
        feeShippingWeight: input.unitWeightLb,
        weightUnit: "lb",
        shippingWeightBasis: "unit weight",
        dimWeight: dimWeightLargeStandardLb,
        dimWeightUnit: "lb",
        lengthPlusGirth: lpg,
        overmax: false,
        warnings: []
      };
    }

    const largeStandardShippingWeightLb = Math.max(input.unitWeightLb, dimWeightLargeStandardLb);

    if (largeStandardShippingWeightLb <= 20 && dims[0] <= 18 && dims[1] <= 14 && dims[2] <= 8) {
      return {
        market: "US",
        key: "large_standard",
        label: "Large standard-size",
        dims,
        dimensionUnit: "in",
        rawShippingWeight: largeStandardShippingWeightLb,
        feeShippingWeight: largeStandardShippingWeightLb,
        weightUnit: "lb",
        shippingWeightBasis: dimWeightLargeStandardLb > input.unitWeightLb ? "dimensional weight" : "unit weight",
        dimWeight: dimWeightLargeStandardLb,
        dimWeightUnit: "lb",
        lengthPlusGirth: lpg,
        overmax: false,
        warnings: []
      };
    }

    const shippingWeightLb = Math.max(input.unitWeightLb, dimWeightLb);

    if (shippingWeightLb <= 50 && dims[0] <= 37 && dims[1] <= 28 && dims[2] <= 20 && lpg <= 130) {
      return {
        market: "US",
        key: "small_bulky",
        label: "Small Bulky",
        dims,
        dimensionUnit: "in",
        rawShippingWeight: shippingWeightLb,
        feeShippingWeight: shippingWeightLb,
        weightUnit: "lb",
        shippingWeightBasis: dimWeightLb > input.unitWeightLb ? "dimensional weight" : "unit weight",
        dimWeight: dimWeightLb,
        dimWeightUnit: "lb",
        lengthPlusGirth: lpg,
        overmax: false,
        warnings: []
      };
    }

    if (shippingWeightLb <= 50 && dims[0] <= 59 && dims[1] <= 33 && dims[2] <= 33 && lpg <= 130) {
      return {
        market: "US",
        key: "large_bulky",
        label: "Large Bulky",
        dims,
        dimensionUnit: "in",
        rawShippingWeight: shippingWeightLb,
        feeShippingWeight: shippingWeightLb,
        weightUnit: "lb",
        shippingWeightBasis: dimWeightLb > input.unitWeightLb ? "dimensional weight" : "unit weight",
        dimWeight: dimWeightLb,
        dimWeightUnit: "lb",
        lengthPlusGirth: lpg,
        overmax: false,
        warnings: []
      };
    }

    if (shippingWeightLb <= 50) {
      const isOvermax = dims[0] > 96 || lpg > 130;
      return {
        market: "US",
        key: "xl_0_50",
        label: isOvermax ? "Overmax / Extra-Large 0 to 50 lb" : "Extra-Large 0 to 50 lb",
        dims,
        dimensionUnit: "in",
        rawShippingWeight: shippingWeightLb,
        feeShippingWeight: shippingWeightLb,
        weightUnit: "lb",
        shippingWeightBasis: dimWeightLb > input.unitWeightLb ? "dimensional weight" : "unit weight",
        dimWeight: dimWeightLb,
        dimWeightUnit: "lb",
        lengthPlusGirth: lpg,
        overmax: isOvermax,
        warnings: []
      };
    }

    if (shippingWeightLb <= 70) {
      const isOvermax = dims[0] > 96 || lpg > 130;
      return {
        market: "US",
        key: "xl_50_70",
        label: isOvermax ? "Overmax / Extra-Large 50+ to 70 lb" : "Extra-Large 50+ to 70 lb",
        dims,
        dimensionUnit: "in",
        rawShippingWeight: shippingWeightLb,
        feeShippingWeight: shippingWeightLb,
        weightUnit: "lb",
        shippingWeightBasis: dimWeightLb > input.unitWeightLb ? "dimensional weight" : "unit weight",
        dimWeight: dimWeightLb,
        dimWeightUnit: "lb",
        lengthPlusGirth: lpg,
        overmax: isOvermax,
        warnings: []
      };
    }

    if (shippingWeightLb <= 150) {
      const isOvermax = dims[0] > 96 || lpg > 130;
      return {
        market: "US",
        key: "xl_70_150",
        label: isOvermax ? "Overmax / Extra-Large 70+ to 150 lb" : "Extra-Large 70+ to 150 lb",
        dims,
        dimensionUnit: "in",
        rawShippingWeight: shippingWeightLb,
        feeShippingWeight: shippingWeightLb,
        weightUnit: "lb",
        shippingWeightBasis: dimWeightLb > input.unitWeightLb ? "dimensional weight" : "unit weight",
        dimWeight: dimWeightLb,
        dimWeightUnit: "lb",
        lengthPlusGirth: lpg,
        overmax: isOvermax,
        warnings: []
      };
    }

    return {
      market: "US",
      key: "xl_150_plus",
      label: "Extra-Large 150+ lb",
      dims,
      dimensionUnit: "in",
      rawShippingWeight: input.unitWeightLb,
      feeShippingWeight: input.unitWeightLb,
      weightUnit: "lb",
      shippingWeightBasis: "unit weight",
      dimWeight: dimWeightLb,
      dimWeightUnit: "lb",
      lengthPlusGirth: lpg,
      overmax: false,
      warnings: []
    };
  }

  function classifyUs(input) {
    // Large standard uses actual dimensions; the 2-inch minimum is only for bulky/oversize.
    const legacy = classifyUs2026({ ...input, largeStandardDimMinimum: false });
    if (input.peakFulfillmentFees || ["small_standard", "large_standard"].includes(legacy.key)) return legacy;
    const dims = sortedDims(input.lengthIn, input.widthIn, input.heightIn);
    const lpg = lengthPlusGirth(dims);
    const dimWeight = dimensionalWeightUs(dims);
    const shippingWeight = Math.max(input.unitWeightLb, dimWeight);
    const tiers = [
      ["small_bulky", "Small bulky", 50, 28, 24, 20, 130],
      ["medium_bulky", "Medium bulky", 50, 37, 28, 20, 130],
      ["large_bulky", "Large bulky", 50, 52, 28, 28, 130],
      ["extra_large_bulky", "Extra-large bulky", 50, 59, 33, 33, 130],
      ["small_oversize", "Small oversize", 50, 72, Infinity, Infinity, 130],
      ["medium_oversize", "Medium oversize", 70, 78, Infinity, Infinity, 130],
      ["large_oversize", "Large oversize", 150, 96, Infinity, Infinity, 130]
    ];
    let selected = tiers.find(([, , weight, length, width, height, girth]) => shippingWeight <= weight && dims[0] <= length && dims[1] <= width && dims[2] <= height && lpg <= girth);
    if (!selected) {
      // Official Revenue Calculator probes: 108 in OR length+girth 165 in is special light.
      selected = shippingWeight > 150 ? ["special_oversize_heavy", "Special oversize heavy"]
        : dims[0] >= 108 - 1e-9 || lpg >= 165 - 1e-9 ? ["special_oversize_light", "Special oversize light"]
        : ["long_oversize", "Long oversize"];
    }
    const heavy = selected[0] === "special_oversize_heavy";
    return { market: "US", key: selected[0], label: selected[1], dims, dimensionUnit: "in",
      rawShippingWeight: heavy ? input.unitWeightLb : shippingWeight,
      feeShippingWeight: heavy ? input.unitWeightLb : shippingWeight, weightUnit: "lb",
      shippingWeightBasis: heavy || input.unitWeightLb >= dimWeight ? "unit weight" : "dimensional weight",
      dimWeight, dimWeightUnit: "lb", lengthPlusGirth: lpg, overmax: false, warnings: [] };
  }

  function classifyCa2026(input) {
    const dims = sortedDims(input.lengthCm, input.widthCm, input.heightCm);
    const dimWeightKg = dimensionalWeightMetric(dims);
    const shippingWeightKg = Math.max(input.unitWeightKg, dimWeightKg);
    const lpg = lengthPlusGirth(dims);

    if (shippingWeightKg <= 0.5 && dims[0] <= 38 && dims[1] <= 27 && dims[2] <= 2) {
      return {
        market: "CA",
        key: "envelope",
        label: "Envelope",
        dims,
        dimensionUnit: "cm",
        rawShippingWeight: shippingWeightKg,
        feeShippingWeight: ceilTo(shippingWeightKg, 0.1),
        weightUnit: "kg",
        shippingWeightBasis: dimWeightKg > input.unitWeightKg ? "dimensional weight" : "unit weight",
        dimWeight: dimWeightKg,
        dimWeightUnit: "kg",
        lengthPlusGirth: lpg,
        overmax: false,
        warnings: []
      };
    }

    if (shippingWeightKg <= 9 && dims[0] <= 45 && dims[1] <= 35 && dims[2] <= 20) {
      return {
        market: "CA",
        key: "standard",
        label: "Standard",
        dims,
        dimensionUnit: "cm",
        rawShippingWeight: shippingWeightKg,
        feeShippingWeight: ceilTo(shippingWeightKg, 0.1),
        weightUnit: "kg",
        shippingWeightBasis: dimWeightKg > input.unitWeightKg ? "dimensional weight" : "unit weight",
        dimWeight: dimWeightKg,
        dimWeightUnit: "kg",
        lengthPlusGirth: lpg,
        overmax: false,
        warnings: []
      };
    }

    let key = "special_oversize";
    let label = "Special oversize";
    if (shippingWeightKg <= 32 && dims[0] <= 152 && dims[1] <= 76 && lpg <= 330) {
      key = "small_oversize";
      label = "Small oversize";
    } else if (shippingWeightKg <= 68 && dims[0] <= 270 && lpg <= 330) {
      key = "medium_oversize";
      label = "Medium oversize";
    } else if (shippingWeightKg <= 68 && dims[0] <= 270 && lpg <= 419) {
      key = "large_oversize";
      label = "Large oversize";
    }

    const warnings = [];
    if (key === "special_oversize") {
      warnings.push("CA 的 Oversize Special Handling surcharge 在当前 PDF 中未给出单独费率，因此这里只计算基础 fulfilment fee。");
    }

    return {
      market: "CA",
      key,
      label,
      dims,
      dimensionUnit: "cm",
      rawShippingWeight: shippingWeightKg,
      feeShippingWeight: ceilTo(shippingWeightKg, 0.5),
      weightUnit: "kg",
      shippingWeightBasis: dimWeightKg > input.unitWeightKg ? "dimensional weight" : "unit weight",
      dimWeight: dimWeightKg,
      dimWeightUnit: "kg",
      lengthPlusGirth: lpg,
      overmax: false,
      warnings
    };
  }

  function classifyCa(input) {
    if (input.peakFulfillmentFees) return classifyCa2026(input);
    const dims = sortedDims(input.lengthCm,input.widthCm,input.heightCm);
    const dimWeight = dimensionalWeightMetric(dims), unit = input.unitWeightKg, lpg = lengthPlusGirth(dims);
    const tiers = [
      ["small_standard","Small standard-size",0.5,38,27,2,Infinity],
      ["large_standard","Large standard-size",9,45,35,20,Infinity],
      ["small_bulky","Small bulky",23,95,70,50,330],
      ["large_bulky","Large bulky",23,150,85,85,330]
    ];
    // CA defines tiers using unit weight, not dimensional weight.
    let selected = tiers.find(([, ,kg,l,w,h,g])=>unit<=kg+1e-9 && dims[0]<=l+1e-9 && dims[1]<=w+1e-9 && dims[2]<=h+1e-9 && lpg<=g+1e-9);
    if (!selected) selected = unit>68+1e-9 || dims[0]>245+1e-9 ? ["xl_68_plus","Extra-large 68+ kg"]
      : unit>30+1e-9 ? ["xl_30_68","Extra-large 30+ to 68 kg"] : ["xl_0_30","Extra-large 0 to 30 kg"];
    const raw = Math.max(unit,dimWeight), standard = selected[0].endsWith("standard");
    const warnings = [];
    if(dims[0]>270 || lpg>419 || raw>68) warnings.push("CA 商品可能另收特殊处理费，本结果未包含该费用，需人工核实；大屏电视也可能适用。");
    return {market:"CA",key:selected[0],label:selected[1],dims,dimensionUnit:"cm",rawShippingWeight:raw,
      feeShippingWeight:ceilTo(raw,standard?0.1:0.5),weightUnit:"kg",shippingWeightBasis:dimWeight>unit?"dimensional weight":"unit weight",
      dimWeight,dimWeightUnit:"kg",lengthPlusGirth:lpg,overmax:false,warnings};
  }

  function classifyMx(input) {
    const dims = sortedDims(input.lengthCm, input.widthCm, input.heightCm);
    const dimWeightKg = dimensionalWeightMetric(dims);
    const shippingWeightKg = Math.max(input.unitWeightKg, dimWeightKg);
    const warnings = [];

    if (dims[0] <= 38 && dims[1] <= 27 && dims[2] <= 2 && shippingWeightKg <= 0.5) {
      return {
        market: "MX",
        key: "envelope",
        label: "Envelope",
        dims,
        dimensionUnit: "cm",
        rawShippingWeight: shippingWeightKg,
        feeShippingWeight: ceilTo(shippingWeightKg, 0.1),
        weightUnit: "kg",
        shippingWeightBasis: dimWeightKg > input.unitWeightKg ? "dimensional weight" : "unit weight",
        dimWeight: dimWeightKg,
        dimWeightUnit: "kg",
        lengthPlusGirth: lengthPlusGirth(dims),
        overmax: false,
        warnings
      };
    }

    if (dims[0] <= 45 && dims[1] <= 35 && dims[2] <= 20) {
      return {
        market: "MX",
        key: "standard",
        label: "Standard",
        dims,
        dimensionUnit: "cm",
        rawShippingWeight: shippingWeightKg,
        feeShippingWeight: shippingWeightKg,
        weightUnit: "kg",
        shippingWeightBasis: dimWeightKg > input.unitWeightKg ? "dimensional weight" : "unit weight",
        dimWeight: dimWeightKg,
        dimWeightUnit: "kg",
        lengthPlusGirth: lengthPlusGirth(dims),
        overmax: false,
        warnings
      };
    }

    if (dims[0] > 550 || dims[1] > 270 || dims[2] > 270) {
      warnings.push("当前 MX 费率卡只明确给到 550 x 270 x 270 cm 以内的 Oversize。超过该范围时建议人工复核。");
    }

    return {
      market: "MX",
      key: "oversize",
      label: "Oversize",
      dims,
      dimensionUnit: "cm",
      rawShippingWeight: shippingWeightKg,
      feeShippingWeight: shippingWeightKg,
      weightUnit: "kg",
      shippingWeightBasis: dimWeightKg > input.unitWeightKg ? "dimensional weight" : "unit weight",
      dimWeight: dimWeightKg,
      dimWeightUnit: "kg",
      lengthPlusGirth: lengthPlusGirth(dims),
      overmax: false,
      warnings
    };
  }

  function classifySizeTier(input) {
    if (input.market === "US") return classifyUs(input);
    if (input.market === "CA") return classifyCa(input);
    return classifyMx(input);
  }

  function smallStandardFeeUs(category, price, shippingWeightLb, feeSource = DATA.us.smallStandard[category]) {
    const weightOz = shippingWeightLb * 16;
    const band = bandByLimit(feeSource, weightOz, "maxOz");
    return {
      amount: band[priceBandUs(price)],
      bandLabel: `up to ${band.maxOz} oz`
    };
  }

  function largeStandardFeeUs(category, price, shippingWeightLb, bands = DATA.us.largeStandardBands[category], formulaSource = DATA.us.largeStandardFormula[category]) {
    const fixedBand = bands.find((row) => shippingWeightLb <= row.maxLb + 1e-9);
    if (fixedBand) {
      return {
        amount: fixedBand[priceBandUs(price)],
        bandLabel: fixedBand.label
      };
    }

    const formula = formulaSource;
    const intervals = Math.max(0, Math.ceil(((shippingWeightLb - 3) / formula.stepLb) - 1e-9));
    return {
      amount: formula[priceBandUs(price)] + (intervals * formula.increment),
      bandLabel: `3+ lb to 20 lb (${intervals} interval${intervals === 1 ? "" : "s"} above first 3 lb)`
    };
  }

  function intervalFee(formula, priceBand, shippingWeight, threshold, step) {
    const intervals = Math.max(0, Math.ceil(((shippingWeight - threshold) / step) - 1e-9));
    return formula[priceBand] + (intervals * formula.increment);
  }

  function usFeeVersion(input) { return input.peakFulfillmentFees ? "peak2026" : "regular2027"; }

  function baseFeeUs(input, tier) {
    const card = US_FEE_CARDS[usFeeVersion(input)][input.category];
    const excluded = !input.peakFulfillmentFees && input.lowPriceExcluded && input.price < 10;
    const price = excluded ? 10 : input.price;
    let result;
    if (tier.key === "small_standard") result = smallStandardFeeUs(input.category, price, tier.feeShippingWeight, card.smallStandard);
    else if (tier.key === "large_standard") result = largeStandardFeeUs(input.category, price, tier.feeShippingWeight, card.largeStandardBands, card.largeStandardFormula);
    else {
      const formula = card.formulas[tier.key];
      result = { amount: intervalFee(formula, priceBandUs(price), tier.feeShippingWeight, formula.thresholdLb, formula.stepLb),
        bandLabel: `First ${formula.thresholdLb} lb + $${formula.increment.toFixed(2)} per ${formula.stepLb} lb interval` };
    }
    return withPeakFulfillment({ amount: round2(result.amount), bandLabel: result.bandLabel,
      explanation: `${tier.label}: ${tier.shippingWeightBasis}.${excluded ? " 该收费品类不符合低价资格，按 $10–$50 费率计算。" : ""}`,
      supported: true }, input, Boolean(input.peakFulfillmentFees), input.peakFulfillmentFees
        ? `Using 2026 Peak fulfilment fee table for ${PEAK_FULFILLMENT.periodLabel}.`
        : "2027 非旺季配送费：January 15, 2027 - October 14, 2027。");
  }

  function baseFeeCa(input, tier) {
    const source = input.peakFulfillmentFees ? PEAK_FULFILLMENT.ca : CA_2027;
    const peakDetail = input.peakFulfillmentFees
      ? `Using 2026 Peak fulfilment fee table for ${PEAK_FULFILLMENT.periodLabel}.`
      : "Peak fulfilment fee is not selected; using 2027 非旺季配送费（2027-01-15起）.";

    if (["envelope", "small_standard"].includes(tier.key)) {
      const band = bandByLimit(source.envelopeFees, tier.feeShippingWeight, "maxKg");
      return withPeakFulfillment({
        amount: band.amount,
        bandLabel: band.label,
        explanation: "CA envelope fulfilment fees use shipping weight rounded up to the nearest 100 g.",
        supported: true
      }, input, input.peakFulfillmentFees, peakDetail);
    }

    if (["standard", "large_standard"].includes(tier.key)) {
      const fixedBand = source.standardFees.find((row) => tier.feeShippingWeight <= row.maxKg + 1e-9);
      if (fixedBand) {
        return withPeakFulfillment({
          amount: fixedBand.amount,
          bandLabel: fixedBand.label,
          explanation: "CA standard fulfilment fees use shipping weight rounded up to the nearest 100 g.",
          supported: true
        }, input, input.peakFulfillmentFees, peakDetail);
      }

      const intervals = Math.max(0, Math.round((tier.feeShippingWeight - 1.5) / 0.1));
      return withPeakFulfillment({
        amount: round2(source.standardOver.base + (intervals * source.standardOver.increment)),
        bandLabel: `${source.standardOver.label} (${intervals} interval${intervals === 1 ? "" : "s"} above first 1,500 g)`,
        explanation: "CA standard fulfilment fees above 1,500 g add CAD 0.09 per additional 100 g interval.",
        supported: true
      }, input, input.peakFulfillmentFees, peakDetail);
    }

    const formula = source.oversize[tier.key];
    const intervals = Math.max(0, Math.round((tier.feeShippingWeight - 0.5) / 0.5));
    return withPeakFulfillment({
      amount: round2(formula.base + (intervals * formula.increment)),
      bandLabel: `${formula.label || "First 500 g"}${intervals > 0 ? ` (${intervals} interval${intervals === 1 ? "" : "s"} above first 500 g)` : ""}`,
      explanation: "CA oversize fulfilment fees use shipping weight rounded up to the nearest 500 g.",
      supported: true
    }, input, input.peakFulfillmentFees, peakDetail);
  }

  function baseFeeMx(input, tier) {
    const category = DATA.mx[input.category];
    const band = priceBandMx(input.price);

    if (tier.key === "envelope") {
      const row = bandByLimit(category.envelope, ceilTo(tier.rawShippingWeight, 0.1), "maxKg");
      return {
        amount: row[band],
        bandLabel: bandByLimit(DATA.mx.envelopeBands, ceilTo(tier.rawShippingWeight, 0.1), "maxKg").label,
        explanation: "MX envelope fees use the provided shipping-weight bands in kilograms.",
        supported: true
      };
    }

    if (tier.key === "standard") {
      const roundedUpToTenth = ceilTo(tier.rawShippingWeight, 0.1);
      const fixedRow = category.standard.find((row) => roundedUpToTenth <= row.maxKg + 1e-9);
      if (fixedRow) {
        return {
          amount: fixedRow[band],
          bandLabel: bandByLimit(DATA.mx.standardBands, roundedUpToTenth, "maxKg").label,
          explanation: "MX standard fees use the weight band table up to 1.00 kg.",
          supported: true
        };
      }

      const intervals = Math.max(0, Math.ceil(((tier.rawShippingWeight - 1) / 0.25) - 1e-9));
      return {
        amount: category.standardOver1[band] + (intervals * category.standardOver1.increment[band]),
        bandLabel: `Over 1.00 kg (${intervals} interval${intervals === 1 ? "" : "s"} above first 1.00 kg)`,
        explanation: "MX standard fees above 1.00 kg add a per-0.25 kg increment based on price band.",
        supported: true
      };
    }

    if (tier.rawShippingWeight <= 1) {
      return {
        amount: category.oversize.first1kg[band],
        bandLabel: "0 to 1.00 kg",
        explanation: "MX oversize fees use a flat first-1 kg fee, then per-0.5 kg increments.",
        supported: true
      };
    }

    if (tier.rawShippingWeight <= 50) {
      const intervals = Math.max(0, Math.ceil(((tier.rawShippingWeight - 1) / 0.5) - 1e-9));
      return {
        amount: category.oversize.first1kg[band] + (intervals * category.oversize.upTo50Increment[band]),
        bandLabel: `Over 1.00 kg to 50 kg (${intervals} interval${intervals === 1 ? "" : "s"} above first 1.00 kg)`,
        explanation: "MX oversize fees up to 50 kg add a per-0.5 kg increment above the first kilogram.",
        supported: true
      };
    }

    const base50 = category.oversize.base50kg[band];
    if (base50 == null) {
      return {
        amount: null,
        bandLabel: "50 kg and above",
        explanation: "当前 MX 费率卡中，该类目组在此售价带的 50 kg 以上 oversize 费率显示为 N/A。",
        supported: false
      };
    }

    const over100Rate = category.oversize.over100Increment?.[band];
    if (tier.rawShippingWeight > 100 && over100Rate != null) {
      const base100 = base50 + 100 * category.oversize.over50Increment[band];
      const intervals = Math.ceil((tier.rawShippingWeight - 100) / 0.5 - 1e-9);
      return {
        amount: base100 + intervals * over100Rate,
        bandLabel: "Over 100 kg",
        explanation: "MX oversize fees above 100 kg add a per-0.5 kg increment to the 100 kg fee.",
        supported: true
      };
    }
    const intervals = Math.max(0, Math.ceil(((tier.rawShippingWeight - 50) / 0.5) - 1e-9));
    return {
      amount: base50 + (intervals * category.oversize.over50Increment[band]),
      bandLabel: `50 kg and above (${intervals} interval${intervals === 1 ? "" : "s"} above 50 kg)`,
      explanation: "MX oversize fees above 50 kg use the 50 kg base fee plus a per-0.5 kg increment.",
      supported: true
    };
  }

  function baseFee(input, tier) {
    if (input.market === "US") return baseFeeUs(input, tier);
    if (input.market === "CA") return baseFeeCa(input, tier);
    return withPeakFulfillment(
      baseFeeMx(input, tier),
      input,
      false,
      input.peakFulfillmentFees
        ? "No MX peak fulfilment fee table was provided; current base fulfilment fee is kept."
        : "Peak fulfilment fee is not selected; using the regular base fulfilment fee."
    );
  }

  function lowInventoryExemptionReasons(input) {
    const reasons = [];
    if (input.groceryExempt) reasons.push("Grocery category");
    if (input.newSellerExempt) reasons.push("new Professional seller first 365 days");
    if (input.newToFbaExempt) reasons.push("new-to-FBA parent product first 180 days with FBA New Selection");
    if (input.awdExempt) reasons.push("70%+ replenished via AWD in prior 90 days");
    if (input.slowMoverExempt) reasons.push("sold fewer than 20 units in past 7 days");
    return reasons;
  }

  function lowInventoryBand(longTermDos, shortTermDos) {
    if (longTermDos == null || shortTermDos == null) return null;
    if (longTermDos >= 28 || shortTermDos >= 28) return null;
    const effectiveDos = Math.max(longTermDos, shortTermDos);
    if (effectiveDos < 14) return { key: "lt14", label: "0 ≤ days of supply < 14", effectiveDos };
    if (effectiveDos < 21) return { key: "lt21", label: "14 ≤ days of supply < 21", effectiveDos };
    return { key: "lt28", label: "21 ≤ days of supply < 28", effectiveDos };
  }

  function lowInventoryFee(input, tier) {
    if (input.market === "CA") return lowInventoryFeeCa(input,tier);
    if (input.market !== "US") {
      return { amount: 0, applied: false, reason: "MX 低库存费未估算。" };
    }

    if (!input.peakFulfillmentFees) return lowInventoryFee2027(input, tier);
    const exemptReasons = lowInventoryExemptionReasons(input);
    if (exemptReasons.length) {
      return { amount: 0, applied: false, reason: `已勾选豁免条件：${exemptReasons.join(" / ")}。` };
    }

    const band = lowInventoryBand(input.longTermDos, input.shortTermDos);
    if (!band) {
      if (input.longTermDos == null || input.shortTermDos == null) {
        return { amount: 0, applied: false, reason: "未输入 30 天和 90 天 days of supply，因此未计算 low-inventory-level fee。" };
      }
      return { amount: 0, applied: false, reason: "只有当 long-term 与 short-term historical days of supply 都低于 28 天时才会收费。" };
    }

    let key = null;
    if (tier.key === "small_standard") key = "small_standard";
    if (tier.key === "large_standard") key = tier.feeShippingWeight <= 3 ? "large_standard_3_or_less" : "large_standard_over_3";
    if (tier.key === "small_bulky") key = "small_bulky";
    if (tier.key === "large_bulky") key = "large_bulky";

    if (!key) {
      return { amount: 0, applied: false, reason: "Low-inventory-level fee 仅适用于 US 的 standard-size、Small Bulky、Large Bulky。" };
    }

    return {
      amount: DATA.us.lowInventory[key][band.key],
      applied: true,
      band,
      reason: `两组 DOS 都低于 28 天，且按较大的 DOS = ${round2(band.effectiveDos)} 归档到 ${band.label}。`
    };
  }

  function lowInventoryFeeCa(input,tier) {
    if(input.peakFulfillmentFees) return {amount:0,applied:false,reason:"2026旺季模式未估算加拿大旧版低库存费。"};
    const prefix="CA低库存费：2027-02-01起，FNSKU前后各28天DOS，四周后独立收费。";
    if(!["small_standard","large_standard"].includes(tier.key)) return {amount:0,applied:false,reason:prefix+"只适用于标准尺寸，不适用于Bulky或Extra-large。"};
    if(input.newSellerExempt||input.newToFbaExempt||input.slowMoverExempt||input.groceryExempt||input.noTrailingShipments) return {amount:0,applied:false,reason:prefix+"已选择适用豁免（CA慢销为过去7天出货少于10件；新品前120天、最多200件且符合New Selection）。"};
    if(input.longTermDos==null||input.shortTermDos==null) return {amount:0,applied:false,reason:prefix+"未估算：请填写前后28天DOS，预测值仅供情景估算。"};
    const band=lowInventoryBand(input.longTermDos,input.shortTermDos);
    if(!band)return {amount:0,applied:false,reason:prefix+"至少一组DOS≥28，不收费。"};
    const weight=tier.key==="small_standard"?input.unitWeightKg:tier.feeShippingWeight;
    const rates=tier.key==="small_standard"?[1.21,.72,.43]:weight<=.3?[1.42,.83,.47]:weight<=1?[1.57,.89,.49]:weight<=1.5?[1.73,1.10,.56]:[2.09,1.41,.73];
    return {amount:rates[{lt14:0,lt21:1,lt28:2}[band.key]],applied:true,band,reason:prefix+`情景估算，按较大DOS ${band.effectiveDos} 天归档。`};
  }

  function lowInventoryFee2027(input, tier) {
    const prefix = "2027-02-01 起，FNSKU 按评估日前后各28天出货计算；四周后独立收费。";
    const exempt = lowInventoryExemptionReasons(input).map(reason => reason.replace("first 180 days", "first 120 days / first 200 units"));
    if (input.noTrailingShipments) exempt.push("任一28天窗口无出货");
    if (exempt.length) return { amount: 0, applied: false, reason: `${prefix} 豁免：${exempt.join(" / ")}。` };
    if (input.longTermDos == null || input.shortTermDos == null) return { amount: 0, applied: false, reason: `${prefix} 未估算：请填写前28天与后28天 DOS；预测值仅用于情景估算。` };
    const band = lowInventoryBand(input.longTermDos, input.shortTermDos);
    if (!band) return { amount: 0, applied: false, reason: `${prefix} 至少一组 DOS ≥ 28 天，不收费。` };
    let rates;
    if (tier.key === "small_standard") rates = [0.89, 0.63, 0.32];
    else if (tier.key === "large_standard") rates = tier.feeShippingWeight <= 3 ? [0.97, 0.70, 0.36] : [1.11, 0.87, 0.47];
    else if (["small_bulky", "medium_bulky"].includes(tier.key)) rates = [1.85, 1.02, 0.51];
    else if (["large_bulky", "extra_large_bulky"].includes(tier.key)) rates = [2.09, 1.15, 0.57];
    else if (["small_oversize", "medium_oversize", "large_oversize"].includes(tier.key)) rates = [2.90, 1.30, 0.81];
    else rates = [3.50, 1.57, 0.97];
    return { amount: rates[{lt14:0, lt21:1, lt28:2}[band.key]], applied: true, band,
      reason: `${prefix} 情景估算：两组 DOS 均不足28天，按较大值 ${band.effectiveDos} 天计费。` };
  }

  function oversizeHandlingFee(input, tier) {
    const flatRates = { small_oversize:8.40, medium_oversize:8.65, large_oversize:9.42, long_oversize:10.48, special_oversize_light:21.67, special_oversize_heavy:29.53 };
    const overhangRates = { long_oversize:3.45, special_oversize_light:5.23, special_oversize_heavy:10.45 };
    if (input.market !== "US" || input.peakFulfillmentFees || flatRates[tier.key] == null) return {flat:0, overhang:0, amount:0};
    const flat = tier.dims[2] < 4 - 1e-9 && tier.dims[1] >= 25 - 1e-9 ? flatRates[tier.key] : 0;
    const overhang = tier.dims[1] > 43 + 1e-9 ? overhangRates[tier.key] || 0 : 0;
    return {flat, overhang, amount:round2(flat+overhang)};
  }

  function sippAdjustmentUs(input, tier) {
    if (tier.key === "small_standard" || tier.key === "large_standard") {
      if (!input.sippCertified) {
        return {
          amount: 0,
          applied: false,
          type: "none",
          reason: "当前未勾选 SIPP，因此 standard-size 不享受 SIPP 折扣。"
        };
      }

      if (input.category === "dangerous_goods") {
        return {
          amount: 0,
          applied: false,
          type: "none",
          reason: "你提供的 US SIPP 表只给了 non-apparel 与 apparel；dangerous goods 暂未单独计入 SIPP 折扣。"
        };
      }

      const band = bandByLimit(DATA.us.sippDiscount[input.category][tier.key], tier.feeShippingWeight, "maxLb");
      return {
        amount: band.amount,
        applied: true,
        type: "discount",
        label: "SIPP discount",
        reason: `${tier.label} 已参加 SIPP，按 ${band.label} 的 shipping weight 折减。`
      };
    }

    if (["small_bulky", "medium_bulky", "large_bulky", "extra_large_bulky"].includes(tier.key)) {
      if (input.sippCertified) {
        return {
          amount: 0,
          applied: false,
          type: "none",
          reason: `${tier.label} 在 2026-01-15 之后不再有单独 SIPP 折扣；已参加 SIPP 时这里也不追加 packaging fee。`
        };
      }

      const band = bandByLimit(DATA.us.packagingFeeBulky, tier.dimWeight, "maxDimWeightLb");
      return {
        amount: band.amount,
        applied: true,
        type: "fee",
        label: "Packaging fee",
        reason: `${tier.label} 未参加 SIPP，按 dimensional weight ${tier.dimWeight.toFixed(2)} lb 落入 ${band.label} 包装费档位。`
      };
    }

    return {
      amount: 0,
      applied: false,
      type: "none",
      reason: "当前 US size tier 不适用 SIPP 折扣或 bulky packaging fee。"
    };
  }

  function sippAdjustmentCa(input, tier) {
    if(!input.peakFulfillmentFees && input.sippCertified) {
      const amount=input.caSippDiscount;
      const valid=Number.isFinite(amount)&&amount>=0&&amount<=baseFeeCa(input,tier).amount;
      return {amount:valid?amount:0,applied:valid,pending:!valid,type:valid?"discount":"none",label:"SIPP discount（已确认金额）",
        reason:valid?"按手工填写的已确认CA 2027 SIPP折扣减费。":"CA 2027新档位的SIPP折扣尚未核实，请填写已确认的每件CAD折扣；完整总额暂不计算。"};
    }
    if (!input.sippCertified) {
      return {
        amount: 0,
        applied: false,
        type: "none",
        reason: "当前未勾选 SIPP，因此 CA 站点不享受 SIPP 折扣。"
      };
    }

    if (tier.key === "envelope") {
      const band = bandByLimit(DATA.ca.sippEnvelope, tier.feeShippingWeight, "maxKg");
      return {
        amount: band.amount,
        applied: true,
        type: "discount",
        label: "SIPP discount",
        reason: `CA Envelope 已参加 SIPP，按 ${band.label} 折减。`
      };
    }

    if (tier.key === "standard") {
      const band = bandByLimit(DATA.ca.sippStandard, tier.feeShippingWeight, "maxKg");
      return {
        amount: band.amount,
        applied: true,
        type: "discount",
        label: "SIPP discount",
        reason: `CA Standard 已参加 SIPP，按 ${band.label} 折减。`
      };
    }

    if (tier.key === "small_oversize") {
      return {
        amount: DATA.ca.sippSmallOversize,
        applied: true,
        type: "discount",
        label: "SIPP discount",
        reason: "CA Small oversize SIPP 给予固定 CAD 1.68 折扣。"
      };
    }

    return {
      amount: 0,
      applied: false,
      type: "none",
      reason: "当前提供的 CA SIPP 表只覆盖 Envelope、Standard 和 Small oversize。"
    };
  }

  function sippAdjustmentMx(input, tier) {
    if (!input.sippCertified) {
      return {
        amount: 0,
        applied: false,
        type: "none",
        reason: "当前未勾选 SIPP，因此 MX 站点不享受 SIPP 折扣。"
      };
    }

    if (tier.rawShippingWeight > 22.6) {
      return {
        amount: 0,
        applied: false,
        type: "none",
        reason: "你提供的 MX SIPP 文件说明折扣仅适用于 22.6 kg 或以下的 SIPP-certified 商品。"
      };
    }

    if (tier.key === "envelope") {
      return {
        amount: DATA.mx.sippDiscount.envelope,
        applied: true,
        type: "discount",
        label: "SIPP discount",
        reason: "MX Envelope 已参加 SIPP，按固定 MXN 0.83 折减。"
      };
    }

    if (tier.key === "standard") {
      return {
        amount: DATA.mx.sippDiscount.standard,
        applied: true,
        type: "discount",
        label: "SIPP discount",
        reason: "MX Standard 已参加 SIPP，按固定 MXN 1.46 折减。"
      };
    }

    return {
      amount: DATA.mx.sippDiscount.oversize,
      applied: true,
      type: "discount",
      label: "SIPP discount",
      reason: "MX Oversize 已参加 SIPP，按固定 MXN 2.92 折减。"
    };
  }

  function sippAdjustment(input, tier) {
    if (input.market === "US") return sippAdjustmentUs(input, tier);
    if (input.market === "CA") return sippAdjustmentCa(input, tier);
    return sippAdjustmentMx(input, tier);
  }

  function overmaxFee(tier) {
    if (tier.market !== "US") {
      return { amount: 0, applied: false, reason: "Overmax handling fee 当前只按 US 规则计算。" };
    }
    if (!tier.overmax) {
      return { amount: 0, applied: false, reason: "未命中 Overmax 条件。" };
    }
    return {
      amount: DATA.us.overmaxFees[tier.key],
      applied: true,
      reason: "Extra-Large (up to 150 lb) 且 longest side > 96 in 或 length + girth > 130 in。"
    };
  }

  function secondarySummaryLabel(view) {
    if (view.market === "CA") return `${view.marketLabel} · ${view.categoryLabel}`;
    return `${view.marketLabel} · ${view.categoryLabel} · ${view.priceBandLabel}`;
  }

  function createProfitState(market) {
    const previous = dom.profitState;
    const switchingMexico = previous && previous.market !== market && (previous.market === "MX" || market === "MX");
    if (switchingMexico) dom.profitResult = null;
    if (typeof profitEstimator.createProfitState === "function") {
      return profitEstimator.createProfitState({ market }, switchingMexico ? { ...previous, vat: undefined, exchangeRate: undefined } : previous);
    }

    return {
      market,
      grossSellingPrice: "",
      vat: market === "MX" ? 16 : 0,
      referralRate: 15,
      fbaFee: "",
      chargeableWeightKg: "",
      firstLegPriceRmbPerKg: 8,
      productCostRmb: "",
      exchangeRate: market === "CA" ? 5 : market === "MX" ? 0.4 : 7
    };
  }

  function ensureProfitState(market) {
    dom.profitState = createProfitState(market);
    return dom.profitState;
  }

  function readProfitStateFromDom(market) {
    const nextState = ensureProfitState(market);
    const fieldMap = {
      grossSellingPrice: "profitGrossSellingPrice",
      vat: "profitVat",
      referralRate: "profitReferralRate",
      fbaFee: "profitFbaFee",
      volumeCbm: "profitVolumeCbm",
      actualWeightKg: "profitActualWeightKg",
      firstLegPriceRmbPerCbm: "profitFirstLegPriceRmbPerCbm",
      chargeableWeightKg: "profitChargeableWeightKg",
      firstLegPriceRmbPerKg: "profitFirstLegPriceRmbPerKg",
      productCostRmb: "profitProductCostRmb",
      exchangeRate: "profitExchangeRate"
    };

    Object.entries(fieldMap).forEach(([key, id]) => {
      const element = document.getElementById(id);
      if (!element) return;
      nextState[key] = element.value.trim() === "" ? "" : element.value.trim();
    });

    dom.profitState = nextState;
    return nextState;
  }

  function buildProfitSyncSource() {
    const input = collectInput();
    const dimsReady = [input.lengthCm, input.widthCm, input.heightCm, input.unitWeightKg]
      .every((value) => Number.isFinite(value) && value > 0);

    return {
      market: input.market,
      fbaFee: dom.lastResultView && Number.isFinite(dom.lastResultView.total) ? dom.lastResultView.total : null,
      lengthCm: dimsReady ? input.lengthCm : null,
      widthCm: dimsReady ? input.widthCm : null,
      heightCm: dimsReady ? input.heightCm : null,
      actualWeightKg: dimsReady ? input.unitWeightKg : null
    };
  }

  function renderProfitEstimatorSection(market) {
    ensureProfitState(market);

    if (typeof profitEstimator.renderEstimatorPanel !== "function") {
      return "";
    }

    return profitEstimator.renderEstimatorPanel({
      market,
      marketLabel: DATA.markets[market].short,
      currency: DATA.markets[market].currency,
      state: dom.profitState,
      result: dom.profitResult
    });
  }

  function bindProfitEstimator(market) {
    window.layoutFeeWorkspace?.();
    const syncButton = document.getElementById("profitSyncButton");
    const calculateButton = document.getElementById("profitCalculateButton");
    if (!syncButton || !calculateButton) return;

    [
      "profitGrossSellingPrice",
      "profitVat",
      "profitReferralRate",
      "profitFbaFee",
      "profitVolumeCbm",
      "profitActualWeightKg",
      "profitFirstLegPriceRmbPerCbm",
      "profitChargeableWeightKg",
      "profitFirstLegPriceRmbPerKg",
      "profitProductCostRmb",
      "profitExchangeRate"
    ].forEach((id) => {
      const element = document.getElementById(id);
      if (!element) return;
      element.addEventListener("input", () => {
        readProfitStateFromDom(market);
      });
      element.addEventListener("change", () => {
        readProfitStateFromDom(market);
      });
    });

    syncButton.addEventListener("click", () => {
      const currentState = readProfitStateFromDom(market);
      dom.profitState = typeof profitEstimator.syncEstimatorFields === "function"
        ? profitEstimator.syncEstimatorFields(currentState, buildProfitSyncSource())
        : currentState;
      dom.profitResult = null;
      refreshResultView();
    });

    calculateButton.addEventListener("click", () => {
      const currentState = readProfitStateFromDom(market);
      dom.profitResult = typeof profitEstimator.calculateGrossMargin === "function"
        ? profitEstimator.calculateGrossMargin(currentState)
        : null;
      refreshResultView();
    });
  }

  function renderEmptyState(message) {
    const market = dom.market ? dom.market.value : "US";
    ensureProfitState(market);
    dom.result.innerHTML = `
      <div class="empty-state">${message}</div>
      ${renderProfitEstimatorSection(market)}
    `;
    bindProfitEstimator(market);
  }

  function refreshResultView() {
    if (dom.lastResultView) {
      renderResult(dom.lastResultView);
      return;
    }
    renderEmptyState(`先选择站点，再输入尺寸、重量、售价和费率类别，然后点击“计算北美 FBA 费用”。`);
  }

  function renderResult(view) {
    const breakdown = [];

    breakdown.push(`
      <div class="line-item">
        <div>
          <strong>基础 FBA fulfilment fee</strong>
          <span>${view.baseDetail}</span>
        </div>
        <div class="amount">${view.baseSupported ? money(view.baseAmount, view.market) : "N/A"}</div>
      </div>
    `);

    if (view.peakFulfillment && view.peakFulfillment.enabled) {
      breakdown.push(`
        <div class="line-item">
          <div>
            <strong>${view.peakFulfillment.label}</strong>
            <span>${view.peakFulfillment.detail}</span>
          </div>
          <div class="amount ${view.peakFulfillment.applied ? "plus" : ""}">${view.peakFulfillment.applied ? "Applied" : "Not applied"}</div>
        </div>
      `);
    }

    breakdown.push(`
      <div class="line-item">
        <div>
          <strong>${view.fuelLogistics.label}</strong>
          <span>${view.fuelLogistics.detail}</span>
        </div>
        <div class="amount ${view.fuelLogistics.applicable && view.fuelLogistics.enabled ? "plus" : ""}">${!view.fuelLogistics.applicable ? "Not applicable" : view.fuelLogistics.enabled ? `+${money(view.fuelLogistics.amount, view.market)}` : "Not applied"}</div>
      </div>
    `);

    if (view.sipp.applied) {
      breakdown.push(`
        <div class="line-item">
          <div>
            <strong>${view.sipp.label}</strong>
            <span>${view.sipp.reason}</span>
          </div>
          <div class="amount ${view.sipp.type === "discount" ? "minus" : "plus"}">${view.sipp.type === "discount" ? "-" : "+"}${money(view.sipp.amount, view.market)}</div>
        </div>
      `);
    }

    if (view.lowInventory.applied) {
      breakdown.push(`
        <div class="line-item">
          <div>
            <strong>Low-inventory-level fee</strong>
            <span>${view.lowInventory.reason}</span>
          </div>
          <div class="amount plus">+${money(view.lowInventory.amount, view.market)}</div>
        </div>
      `);
    }

    if (view.overmax.applied) {
      breakdown.push(`
        <div class="line-item">
          <div>
            <strong>Overmax handling fee</strong>
            <span>${view.overmax.reason}</span>
          </div>
          <div class="amount plus">+${money(view.overmax.amount, view.market)}</div>
        </div>
      `);
    }

    for (const [amount, label, reason] of [[view.handling?.flat, "Flat product handling fee", "Oversize 最短边 < 4 in，且中间边 ≥ 25 in"], [view.handling?.overhang, "Overhang handling fee", "Oversize 中间边 > 43 in"]]) {
      if (amount) breakdown.push(`<div class="line-item"><div><strong>${label}</strong><span>${reason}</span></div><div class="amount plus">+${money(amount, view.market)}</div></div>`);
    }
    const notes = [
      view.baseExplanation,
      ...(view.peakFulfillment && view.peakFulfillment.enabled ? [view.peakFulfillment.detail] : []),
      view.fuelLogistics.detail,
      view.sipp.reason,
      view.lowInventory.reason,
      view.overmax.reason,
      ...view.warnings
    ];

    if (view.market === "US") {
      notes.push("美国站默认2027非旺季，勾选切换2026旺季；燃油附加费仅按基础配送费计算。低库存费可选估算独立列示。仓储、退货及远程配送未计入。");
    } else if (view.market === "CA") {
      notes.push("加拿大默认2027非旺季，勾选切换2026旺季；按实重判2027档位，按实重／体积重较大值计配送费。低库存估算仅适用于2027标准尺寸。税费、特殊处理费、仓储和退货未计入；2027 SIPP需填已确认折扣。");
    } else {
      notes.push("本页的 MX 部分按你提供的 Amazon.com.mx 费率卡计算；售价使用含 VAT 金额。若遇到 PDF 中标记为 N/A 的组合，将提示人工复核。");
    }

    dom.result.innerHTML = `
      <div class="summary-grid">
        <div class="summary-card total-card">
          <div class="eyebrow">Total</div>
          <div class="hero-value">${view.total == null ? "需人工复核" : money(view.total, view.market)}</div>
          <p>${view.totalLabel}</p>
        </div>
        <div class="summary-card">
          <div class="eyebrow">Size Tier</div>
          <div class="metric-value">${view.tier.label}</div>
          <p>${secondarySummaryLabel(view)}</p>
        </div>
        <div class="summary-card">
          <div class="eyebrow">Shipping Weight</div>
          <div class="metric-value">${view.rawShippingWeight.toFixed(2)} ${view.weightUnit}</div>
          <p>${view.shippingWeightBasis}; dimensional weight ${view.dimWeight.toFixed(2)} ${view.weightUnit}</p>
        </div>
      </div>

      ${renderProfitEstimatorSection(view.market)}

      <div class="detail-grid">
        <section class="card">
          <h3>核心结果</h3>
          <div class="facts">
            <div class="fact"><span>站点</span><strong>${view.marketLabel}</strong></div>
            <div class="fact"><span>费率类别</span><strong>${view.categoryLabel}</strong></div>
            <div class="fact"><span>价格带</span><strong>${view.lowPriceExcluded ? "$10–$50（低价资格排除）" : view.priceBandLabel}</strong></div>
            ${view.feeVersion ? `<div class="fact"><span>费率版本</span><strong>${view.feeVersion === "peak2026" ? "2026 旺季 · 2026/10/15–2027/1/14" : view.market === "CA" ? "2027 非旺季 · 2027/1/15起" : "2027 非旺季 · 2027/1/15–10/14"}</strong></div>` : ""}
            <div class="fact"><span>SIPP</span><strong>${view.sippCertified ? "已参加" : "未参加"}</strong></div>
            <div class="fact"><span>最长边</span><strong>${view.dims[0].toFixed(2)} ${view.dimensionUnit}</strong></div>
            <div class="fact"><span>中间边</span><strong>${view.dims[1].toFixed(2)} ${view.dimensionUnit}</strong></div>
            <div class="fact"><span>最短边</span><strong>${view.dims[2].toFixed(2)} ${view.dimensionUnit}</strong></div>
            <div class="fact"><span>Length + Girth</span><strong>${view.lengthPlusGirth.toFixed(2)} ${view.dimensionUnit}</strong></div>
            <div class="fact"><span>基础费段</span><strong>${view.baseBandLabel}</strong></div>
            <div class="fact"><span>计费重量</span><strong>${view.feeShippingWeight.toFixed(2)} ${view.weightUnit}</strong></div>
          </div>
        </section>

        <section class="card">
          <h3>费用拆解</h3>
          <div class="line-list">
            ${breakdown.join("")}
          </div>
        </section>
      </div>

      <section class="card notes-card">
        <h3>说明</h3>
        <div class="notes">
          ${notes.map((note, index) => `<div class="note${index === notes.length - 1 ? " warn" : ""}">${note}</div>`).join("")}
        </div>
      </section>
    `;
    bindProfitEstimator(view.market);
  }

  function buildHistoryRecord(input, view) {
    if (typeof historyApi.createHistoryRecord !== "function") return null;
    return historyApi.createHistoryRecord({
      note: dom.historyNote ? dom.historyNote.value.trim() : "",
      inputs: {
        market: input.market,
        usFeeVersion: input.market === "US" ? usFeeVersion(input) : null,
        caFeeVersion: input.market === "CA" ? usFeeVersion(input) : null,
        caSippDiscount: input.caSippDiscount,
        lowPriceExcluded: input.lowPriceExcluded,
        noTrailingShipments: input.noTrailingShipments,
        category: input.category,
        length: String(input.lengthRaw),
        width: String(input.widthRaw),
        height: String(input.heightRaw),
        weight: String(input.weightRaw),
        price: input.price == null ? "" : String(input.price),
        dimensionUnit: input.dimensionUnit,
        weightUnit: input.weightUnit,
        fuelLogisticsSurcharge: input.fuelLogisticsSurcharge,
        peakFulfillmentFees: input.peakFulfillmentFees,
        largeStandardDimMinimum: input.largeStandardDimMinimum,
        sippCertified: input.sippCertified,
        longTermDos: input.longTermDos == null ? "" : String(input.longTermDos),
        shortTermDos: input.shortTermDos == null ? "" : String(input.shortTermDos),
        groceryExempt: input.groceryExempt,
        newSellerExempt: input.newSellerExempt,
        newToFbaExempt: input.newToFbaExempt,
        awdExempt: input.awdExempt,
        slowMoverExempt: input.slowMoverExempt
      },
      resultSummary: {
        totalFee: view.total,
        totalFeeLabel: money(view.total, view.market),
        dimensionsLabel: `${input.lengthRaw} × ${input.widthRaw} × ${input.heightRaw} ${input.dimensionUnit}`
      }
    });
  }

  function applyHistoryRecord(record) {
    const input = record.inputs || {};
    dom.market.value = input.market || "US";
    syncMarketUi();
    dom.category.value = input.category || dom.category.value;
    dom.length.value = input.length || "";
    dom.width.value = input.width || "";
    dom.height.value = input.height || "";
    dom.weight.value = input.weight || "";
    dom.price.value = input.price == null ? "" : input.price;
    dom.dimensionUnit.value = input.dimensionUnit || "in";
    dom.weightUnit.value = input.weightUnit || "lb";
    dom.fuelLogisticsSurcharge.checked = Boolean(input.fuelLogisticsSurcharge);
    dom.peakFulfillmentFees.checked = Boolean(input.peakFulfillmentFees);
    dom.largeStandardDimMinimum.checked = Boolean(input.largeStandardDimMinimum);
    dom.sippCertified.checked = Boolean(input.sippCertified);
    dom.longTermDos.value = input.longTermDos || "";
    dom.shortTermDos.value = input.shortTermDos || "";
    dom.groceryExempt.checked = Boolean(input.groceryExempt);
    dom.newSellerExempt.checked = Boolean(input.newSellerExempt);
    dom.newToFbaExempt.checked = Boolean(input.newToFbaExempt);
    dom.awdExempt.checked = Boolean(input.awdExempt);
    dom.slowMoverExempt.checked = Boolean(input.slowMoverExempt);
    if (dom.historyNote) dom.historyNote.value = record.note || "";
    if (dom.lowPriceExcluded) dom.lowPriceExcluded.checked = Boolean(input.lowPriceExcluded);
    if (dom.noTrailingShipments) dom.noTrailingShipments.checked = Boolean(input.noTrailingShipments);
    const caSipp = document.getElementById("caSippDiscount");
    if(caSipp) caSipp.value = input.caSippDiscount == null ? "" : String(input.caSippDiscount);
    syncUsVersionUi();
    if ((input.market === "US" && !input.usFeeVersion || input.market === "CA" && !input.caFeeVersion) && !input.peakFulfillmentFees) {
      dom.longTermDos.value = "";
      dom.shortTermDos.value = "";
      dom.newToFbaExempt.checked = false;
      dom.lastResultView = null;
      dom.profitResult = null;
      renderEmptyState(`这是一条旧版2026非旺季历史记录，原结果 ${money(Number(record.resultSummary?.totalFee || 0), input.market)}。已恢复基础输入；点击计算会按2027非旺季重新估算，旧DOS和新品豁免不沿用。`);
      return;
    }
    calculate();
  }

  function calculate({ saveHistory = false } = {}) {
    const input = collectInput();
    syncUsVersionUi();
    updateTierHighlight();
    if (!validateInput(input)) {
      dom.lastResultView = null;
      dom.profitResult = null;
      renderEmptyState(`请先输入合法的尺寸、重量${DATA.markets[input.market].priceRequired ? "、售价" : ""}和站点信息。`);
      return;
    }

    const tier = classifySizeTier(input);
    const base = baseFee(input, tier);
    const fuelLogistics = fuelLogisticsSurchargeNa(input, base);
    const sipp = sippAdjustment(input, tier);
    const lowInventory = lowInventoryFee(input, tier);
    const overmax = overmaxFee(tier);
    const handling = oversizeHandlingFee(input, tier);

    let total = null;
    if (base.supported && !sipp.pending) {
      total = round2(
        base.amount
        + fuelLogistics.amount
        + (sipp.type === "fee" ? sipp.amount : 0)
        - (sipp.type === "discount" ? sipp.amount : 0)
        + lowInventory.amount
        + overmax.amount
        + handling.amount
      );
    }

    dom.lastResultView = {
      market: input.market,
      marketLabel: DATA.markets[input.market].short,
      tier,
      dims: tier.dims,
      dimensionUnit: tier.dimensionUnit,
      lengthPlusGirth: tier.lengthPlusGirth,
      rawShippingWeight: tier.rawShippingWeight,
      feeShippingWeight: tier.feeShippingWeight,
      shippingWeightBasis: tier.shippingWeightBasis,
      weightUnit: tier.weightUnit,
      dimWeight: tier.dimWeight,
      baseAmount: base.amount,
      baseBandLabel: base.bandLabel,
      baseDetail: `${base.bandLabel}${input.market === "CA" ? "" : ` · ${priceBandLabel(input)}`} · ${DATA.categories[input.market][input.category].label}`,
      baseExplanation: base.explanation,
      baseSupported: base.supported,
      peakFulfillment: base.peakFulfillment,
      fuelLogistics,
      sipp,
      sippCertified: input.sippCertified,
      lowInventory,
      overmax,
      handling,
      feeVersion: ["US","CA"].includes(input.market) ? usFeeVersion(input) : null,
      lowPriceExcluded: input.market === "US" && !input.peakFulfillmentFees && input.lowPriceExcluded && input.price < 10,
      total,
      totalLabel: total == null ? (sipp.pending ? "CA 2027 SIPP折扣待核实，请填写已确认金额后计算完整总额" : "当前组合在提供的费率表中缺少完整价格，请人工复核") : "基础费 + fuel surcharge ± SIPP 调整 + 可能的 market-specific surcharge",
      priceBandLabel: priceBandLabel(input),
      categoryLabel: DATA.categories[input.market][input.category].short,
      warnings: tier.warnings
    };
    renderResult(dom.lastResultView);
    if (saveHistory && total != null && dom.historyManager) {
      const record = buildHistoryRecord(input, dom.lastResultView);
      if (record) {
        dom.historyManager.saveRecord(record);
        if (dom.historyDrawer) dom.historyDrawer.refresh();
      }
    }
  }

  function populateCategoryOptions(market) {
    const options = Object.entries(DATA.categories[market]).map(([value, meta]) => (
      `<option value="${value}">${meta.label} / ${meta.short}</option>`
    ));
    dom.category.innerHTML = options.join("");
  }

  function syncUsVersionUi() {
    if (!dom.market) return;
    const us = dom.market.value === "US";
    const ca = dom.market.value === "CA";
    const peak = dom.peakFulfillmentFees.checked;
    const setText = (id, text) => { const e = document.getElementById(id); if (e) e.textContent = text; };
    setText("peak-mode-hint", ca ? "不勾选：2027/1/15起加拿大非旺季。勾选：2026/10/15–2027/1/14旺季；判档和费率同步切换。" : us ? "不勾选：2027/1/15–10/14 非旺季。勾选：2026/10/15–2027/1/14 旺季；尺寸档位和附加费同步切换。" : "MX 保持原费率。");
    setText("long-dos-label", peak ? "Long-term historical DOS（90天）" : "评估日前28天 DOS（2027/2/1起）");
    setText("short-dos-label", peak ? "Short-term historical DOS（30天）" : "评估日后28天 DOS（实际或预测）");
    setText("new-fba-label", peak ? "New-to-FBA 前180天且符合 New Selection" : "New-to-FBA 前120天／首200件且符合 New Selection");
    const lowPrice = document.getElementById("low-price-condition");
    if (lowPrice) lowPrice.hidden = !us || peak || !(Number(dom.price.value) < 10);
    const noShip = document.getElementById("no-shipments-condition");
    if (noShip) noShip.hidden = !(us || ca) || peak;
    setText("slow-mover-label",ca?"过去7天出货少于10件":"过去7天出货少于20件");
    const awd=document.getElementById("awdExempt")?.closest?.("label");if(awd)awd.hidden=!us;
    const manual=document.getElementById("ca-sipp-manual");if(manual)manual.hidden=!(ca&&!peak&&dom.sippCertified.checked);
    if(dom.usOnlySection)dom.usOnlySection.hidden=!(us || ca&&!peak);
    setText("low-inventory-hint", peak ? "2026旺季使用历史30／90天DOS。未填写时不估算。" : "独立可选情景估算：2027/2/1起，按FNSKU前后28天出货计算，四周后独立收费；不代表1/15–1/31的低库存规则。未填写时未估算。");
    renderSizeTierGuide(dom.market.value);
  }

  function renderSizeTierGuide(market) {
    const caGuide = {intro:"2027/1/15起：按实重和实际尺寸判档；体积重=cm长×宽×高÷5000。标准尺寸按100g、大件按500g进位计配送费。",items:[
      {title:"Small standard-size",detail:"≤38×27×2cm，实重≤0.5kg"},{title:"Large standard-size",detail:"≤45×35×20cm，实重≤9kg"},
      {title:"Small bulky",detail:"≤95×70×50cm，实重≤23kg，长＋围长≤330cm"},{title:"Large bulky",detail:"≤150×85×85cm，实重≤23kg，长＋围长≤330cm"},
      {title:"Extra-large 0 to 30 kg",detail:"超出Bulky；实重≤30kg，最长边≤245cm"},{title:"Extra-large 30+ to 68 kg",detail:"实重>30至68kg，最长边≤245cm"},
      {title:"Extra-large 68+ kg",detail:"实重>68kg，或最长边>245cm；特殊处理费需另核"}]};
    const guide = market === "CA" && !dom.peakFulfillmentFees.checked ? caGuide : market === "US" && !dom.peakFulfillmentFees.checked ? {
      intro: "2027/1/15起。尺寸按长／中／短边排序；Bulky及Oversize体积重宽高最低2英寸，Large standard使用实际尺寸。",
      items: [
        {title:"Small standard-size",detail:"≤15×12×0.75 in，实重≤16 oz"},
        {title:"Large standard-size",detail:"≤18×14×8 in，运输重量≤20 lb"},
        ...[["Small bulky",28,24,20],["Medium bulky",37,28,20],["Large bulky",52,28,28],["Extra-large bulky",59,33,33]].map(([title,l,w,h])=>({title,detail:`≤${l}×${w}×${h} in，运输重量≤50 lb，长＋围长≤130 in`})),
        {title:"Small oversize",detail:"运输重量≤50 lb，最长边≤72 in，长＋围长≤130 in"},
        {title:"Medium oversize",detail:"运输重量≤70 lb，最长边≤78 in，长＋围长≤130 in"},
        {title:"Large oversize",detail:"运输重量≤150 lb，最长边≤96 in，长＋围长≤130 in"},
        {title:"Long oversize",detail:"运输重量≤150 lb，最长边<108 in，长＋围长<165 in；超出更小档位"},
        {title:"Special oversize light",detail:"运输重量≤150 lb，最长边≥108 in 或长＋围长≥165 in"},
        {title:"Special oversize heavy",detail:"运输重量>150 lb；基础配送费按实重"}
      ]
    } : DATA.sizeTierGuides[market];
    dom.sizeTierGuideTitle.textContent = `${DATA.markets[market].short} Size Tier`;
    dom.sizeTierGuideIntro.textContent = guide.intro;
    dom.sizeTierGuideGrid.innerHTML = guide.items.map((item) => (
      `<div class="guide-item"><strong>${item.title}</strong><span>${item.detail}</span></div>`
    )).join("");
  }

  function syncMarketUi() {
    const market = dom.market.value;
    const meta = DATA.markets[market];

    populateCategoryOptions(market);
    dom.marketBadge.textContent = `NA FBA · ${meta.label}`;
    dom.marketRange.textContent = market === "US" ? "US Local" : market === "CA" ? "CA Local" : "MX Local";
    dom.priceLabel.textContent = meta.priceLabel;
    dom.priceHint.textContent = meta.priceHint;
    dom.categoryLabel.textContent = meta.categoryLabel;
    syncUsVersionUi();
    updateTierHighlight();

    if (meta.priceRequired) {
      dom.price.required = true;
      dom.price.placeholder = "";
      if (!dom.price.value) {
        dom.price.value = market === "MX" ? "499" : "19.99";
      }
    } else {
      dom.price.required = false;
      dom.price.placeholder = "加拿大站不使用售价";
    }

    const showUsOnly = market === "US" || market === "CA" && !dom.peakFulfillmentFees.checked;
    dom.usOnlySection.hidden = !showUsOnly;

    dom.resultIntro.textContent = market === "US"
      ? "美国站默认2027非旺季；可切换2026旺季。显示基础配送费、燃油、SIPP／包装费、尺寸附加费及可选低库存估算。"
      : market === "CA"
        ? "结果会显示 CA 的基础 fulfilment fee、SIPP discount，以及已知边界说明。"
        : "结果会显示 MX 的基础 fulfilment fee、SIPP discount，以及当前费率表未覆盖组合的提示。";
  }

  function loadExample(type) {
    const market = dom.market.value;

    if (market === "US") {
      if (type === "light") {
        dom.dimensionUnit.value = "in";
        dom.weightUnit.value = "oz";
        dom.length.value = "13.8";
        dom.width.value = "9";
        dom.height.value = "0.7";
        dom.weight.value = "2.88";
        dom.price.value = "8.99";
        dom.category.value = "non_apparel";
        dom.fuelLogisticsSurcharge.checked = true;
        dom.peakFulfillmentFees.checked = false;
        dom.largeStandardDimMinimum.checked = false;
        dom.sippCertified.checked = true;
        dom.longTermDos.value = "12";
        dom.shortTermDos.value = "18";
      } else {
        dom.dimensionUnit.value = "in";
        dom.weightUnit.value = "lb";
        dom.length.value = "97";
        dom.width.value = "8";
        dom.height.value = "8";
        dom.weight.value = "35";
        dom.price.value = "79";
        dom.category.value = "non_apparel";
        dom.fuelLogisticsSurcharge.checked = true;
        dom.peakFulfillmentFees.checked = false;
        dom.largeStandardDimMinimum.checked = false;
        dom.sippCertified.checked = false;
        dom.longTermDos.value = "";
        dom.shortTermDos.value = "";
      }
    } else if (market === "CA") {
      dom.dimensionUnit.value = "cm";
      dom.weightUnit.value = "kg";
      dom.price.value = "";
      dom.longTermDos.value = "";
      dom.shortTermDos.value = "";
      if (type === "light") {
        dom.length.value = "20.6";
        dom.width.value = "19.9";
        dom.height.value = "2.4";
        dom.weight.value = "0.222";
        dom.category.value = "general";
        dom.fuelLogisticsSurcharge.checked = true;
        dom.peakFulfillmentFees.checked = false;
        dom.largeStandardDimMinimum.checked = false;
        dom.sippCertified.checked = false;
      } else {
        dom.length.value = "109.220";
        dom.width.value = "81.280";
        dom.height.value = "5.080";
        dom.weight.value = "8.573";
        dom.category.value = "general";
        dom.fuelLogisticsSurcharge.checked = true;
        dom.peakFulfillmentFees.checked = false;
        dom.largeStandardDimMinimum.checked = false;
        dom.sippCertified.checked = false;
      }
    } else {
      dom.dimensionUnit.value = "cm";
      dom.weightUnit.value = "kg";
      dom.longTermDos.value = "";
      dom.shortTermDos.value = "";
      if (type === "light") {
        dom.length.value = "20.6";
        dom.width.value = "19.9";
        dom.height.value = "2.4";
        dom.weight.value = "0.222";
        dom.price.value = "499";
        dom.category.value = "general";
        dom.fuelLogisticsSurcharge.checked = true;
        dom.peakFulfillmentFees.checked = false;
        dom.largeStandardDimMinimum.checked = false;
        dom.sippCertified.checked = true;
      } else {
        dom.length.value = "152.4";
        dom.width.value = "97.8";
        dom.height.value = "12.1";
        dom.weight.value = "44.23";
        dom.price.value = "13900";
        dom.category.value = "general";
        dom.fuelLogisticsSurcharge.checked = true;
        dom.peakFulfillmentFees.checked = false;
        dom.largeStandardDimMinimum.checked = false;
        dom.sippCertified.checked = false;
      }
    }

    if(dom.noTrailingShipments)dom.noTrailingShipments.checked=false;
    const caDiscount=document.getElementById("caSippDiscount");if(caDiscount)caDiscount.value="";
    dom.groceryExempt.checked = false;
    dom.newSellerExempt.checked = false;
    dom.newToFbaExempt.checked = false;
    dom.awdExempt.checked = false;
    dom.slowMoverExempt.checked = false;
    calculate();
  }

  function updateTierHighlight() {
    if(typeof document.querySelectorAll!=="function")return;
    const cards=Array.from(document.querySelectorAll('#size-tier-guide-grid .guide-item'));
    let tier=null;
    try { const input=collectInput(); if([input.lengthIn,input.widthIn,input.heightIn,input.unitWeightLb].every(n=>Number.isFinite(n)&&n>0))tier=classifySizeTier(input); } catch(e) {}
    const normalize=value=>String(value).toLowerCase().replace(/[^a-z0-9]/g,'');
    const label=tier?normalize((tier.overmax ? 'Overmax' : tier.label)):'';
    for(const card of cards){
      const name=normalize(card.querySelector('strong')?.textContent||'');
      const selected=!!label&&(label===name||name==='extralarge'&&label.startsWith('extralarge'));
      card.classList.toggle('is-current-tier',selected);
      card.querySelector('.current-tier-label')?.remove();
      if(selected){const marker=document.createElement('div');marker.className='current-tier-label';marker.textContent='当前输入所在层级';card.querySelector('strong')?.after(marker);}
    }
  }

  function bindDom() {
    dom.form = document.getElementById("us-fee-form");
    dom.result = document.getElementById("result-root");
    dom.market = document.getElementById("market");
    dom.marketBadge = document.getElementById("market-badge");
    dom.marketRange = document.getElementById("market-range");
    dom.categoryLabel = document.getElementById("category-label");
    dom.category = document.getElementById("category");
    dom.priceLabel = document.getElementById("price-label");
    dom.priceHint = document.getElementById("price-hint");
    dom.sizeTierGuideTitle = document.getElementById("size-tier-guide-title");
    dom.sizeTierGuideIntro = document.getElementById("size-tier-guide-intro");
    dom.sizeTierGuideGrid = document.getElementById("size-tier-guide-grid");
    dom.dimensionUnit = document.getElementById("dimensionUnit");
    dom.weightUnit = document.getElementById("weightUnit");
    dom.length = document.getElementById("length");
    dom.width = document.getElementById("width");
    dom.height = document.getElementById("height");
    dom.weight = document.getElementById("weight");
    dom.price = document.getElementById("price");
    dom.fuelLogisticsSurcharge = document.getElementById("fuelLogisticsSurcharge");
    dom.peakFulfillmentFees = document.getElementById("peakFulfillmentFees");
    dom.largeStandardDimMinimum = document.getElementById("largeStandardDimMinimum");
    dom.sippCertified = document.getElementById("sippCertified");
    dom.lowPriceExcluded = document.getElementById("lowPriceExcluded");
    dom.noTrailingShipments = document.getElementById("noTrailingShipments");
    dom.longTermDos = document.getElementById("longTermDos");
    dom.shortTermDos = document.getElementById("shortTermDos");
    dom.groceryExempt = document.getElementById("groceryExempt");
    dom.newSellerExempt = document.getElementById("newSellerExempt");
    dom.newToFbaExempt = document.getElementById("newToFbaExempt");
    dom.awdExempt = document.getElementById("awdExempt");
    dom.slowMoverExempt = document.getElementById("slowMoverExempt");
    dom.usOnlySection = document.getElementById("us-only-section");
    dom.resultIntro = document.getElementById("result-intro");
    dom.historyNote = document.getElementById("historyNote");

    if (typeof historyApi.createHistoryManager === "function") {
      dom.historyManager = historyApi.createHistoryManager({
        storageKey: "fba-history-na",
        storage: globalThis.localStorage
      });
    }

    if (typeof window.location?.search === "string") {
      const market = new URLSearchParams(window.location.search).get("market");
      if (["US", "CA", "MX"].includes(market)) dom.market.value = market;
    }
    syncMarketUi();
    renderEmptyState(`先选择站点，再输入尺寸、重量、售价和费率类别，然后点击“计算北美 FBA 费用”。`);

    dom.market.addEventListener("change", () => {
      dom.longTermDos.value="";dom.shortTermDos.value="";dom.slowMoverExempt.checked=false;dom.newToFbaExempt.checked=false;
      if(dom.noTrailingShipments)dom.noTrailingShipments.checked=false;
      syncMarketUi();
      calculate();
    });

    dom.peakFulfillmentFees.addEventListener("change", () => {
      if (["US","CA"].includes(dom.market.value)) { dom.longTermDos.value = ""; dom.shortTermDos.value = ""; dom.newToFbaExempt.checked = false; if (dom.noTrailingShipments) dom.noTrailingShipments.checked = false; }
      syncUsVersionUi();
      calculate();
    });
    dom.form.addEventListener("input", () => { syncUsVersionUi(); updateTierHighlight(); });
    dom.form.addEventListener("change", updateTierHighlight);
    updateTierHighlight();
    dom.form.addEventListener("submit", (event) => {
      event.preventDefault();
      calculate({ saveHistory: true });
    });

    document.getElementById("sample-small").addEventListener("click", () => loadExample("light"));
    document.getElementById("sample-overmax").addEventListener("click", () => loadExample("heavy"));

    if (dom.historyManager && typeof historyApi.mountHistoryDrawer === "function") {
      dom.historyDrawer = historyApi.mountHistoryDrawer({
        manager: dom.historyManager,
        onRestore: applyHistoryRecord
      });
    }
  }

  document.addEventListener("DOMContentLoaded", bindDom);
})();
