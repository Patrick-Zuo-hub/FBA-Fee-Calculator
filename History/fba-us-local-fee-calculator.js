(function () {
  const surchargeRules = globalThis.FBA_SURCHARGE_RULES || {};
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
          upTo50Increment: { lt150: 2.80, lt299: 2.80, lt499: 2.80, gte499: 3.50 },
          base50kg: { lt150: 306.40, lt299: 312.60, lt499: 335.40, gte499: 418.40 },
          over50Increment: { lt150: 1.50, lt299: 1.50, lt499: 1.50, gte499: 2.00 }
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

  const dom = {};

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
      largeStandardDimMinimum: fd.get("largeStandardDimMinimum") === "on",
      sippCertified: fd.get("sippCertified") === "on",
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

  function classifyUs(input) {
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

  function classifyCa(input) {
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

  function smallStandardFeeUs(category, price, shippingWeightLb) {
    const weightOz = shippingWeightLb * 16;
    const band = bandByLimit(DATA.us.smallStandard[category], weightOz, "maxOz");
    return {
      amount: band[priceBandUs(price)],
      bandLabel: `up to ${band.maxOz} oz`
    };
  }

  function largeStandardFeeUs(category, price, shippingWeightLb) {
    const fixedBand = DATA.us.largeStandardBands[category].find((row) => shippingWeightLb <= row.maxLb + 1e-9);
    if (fixedBand) {
      return {
        amount: fixedBand[priceBandUs(price)],
        bandLabel: fixedBand.label
      };
    }

    const formula = DATA.us.largeStandardFormula[category];
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

  function baseFeeUs(input, tier) {
    const band = priceBandUs(input.price);

    if (tier.key === "small_standard") {
      const result = smallStandardFeeUs(input.category, input.price, tier.feeShippingWeight);
      return {
        amount: result.amount,
        bandLabel: result.bandLabel,
        explanation: "Small standard-size fees use unit weight only.",
        supported: true
      };
    }

    if (tier.key === "large_standard") {
      const result = largeStandardFeeUs(input.category, input.price, tier.feeShippingWeight);
      return {
        amount: result.amount,
        bandLabel: result.bandLabel,
        explanation: "Large standard-size fees use the greater of unit weight or dimensional weight.",
        supported: true
      };
    }

    if (tier.key === "small_bulky") {
      return {
        amount: intervalFee(DATA.us.smallBulkyFormula[input.category], band, tier.feeShippingWeight, 1, 1),
        bandLabel: "0 to 50 lb; billed by 1 lb interval above first lb",
        explanation: "Small Bulky fees use the greater of unit weight or dimensional weight.",
        supported: true
      };
    }

    if (tier.key === "large_bulky") {
      return {
        amount: intervalFee(DATA.us.largeBulkyFormula[input.category], band, tier.feeShippingWeight, 1, 1),
        bandLabel: "0 to 50 lb; billed by 1 lb interval above first lb",
        explanation: "Large Bulky fees use the greater of unit weight or dimensional weight.",
        supported: true
      };
    }

    if (tier.key === "xl_0_50") {
      return {
        amount: intervalFee(DATA.us.xl0to50Formula[input.category], band, tier.feeShippingWeight, 1, 1),
        bandLabel: "0 to 50 lb; billed by 1 lb interval above first lb",
        explanation: "Extra-Large 0 to 50 lb fees use the greater of unit weight or dimensional weight.",
        supported: true
      };
    }

    if (tier.key === "xl_50_70") {
      return {
        amount: intervalFee(DATA.us.xl50to70Formula[input.category], band, tier.feeShippingWeight, 51, 1),
        bandLabel: "50+ to 70 lb; billed by 1 lb interval above 51 lb",
        explanation: "Extra-Large 50+ to 70 lb fees use the greater of unit weight or dimensional weight.",
        supported: true
      };
    }

    if (tier.key === "xl_70_150") {
      return {
        amount: intervalFee(DATA.us.xl70to150Formula[input.category], band, tier.feeShippingWeight, 71, 1),
        bandLabel: "70+ to 150 lb; billed by 1 lb interval above 71 lb",
        explanation: "Extra-Large 70+ to 150 lb fees use the greater of unit weight or dimensional weight.",
        supported: true
      };
    }

    return {
      amount: intervalFee(DATA.us.xl150PlusFormula[input.category], band, tier.feeShippingWeight, 151, 1),
      bandLabel: "150+ lb; billed by 1 lb interval above 151 lb",
      explanation: "Extra-Large 150+ lb fees use unit weight only.",
      supported: true
    };
  }

  function baseFeeCa(tier) {
    if (tier.key === "envelope") {
      const band = bandByLimit(DATA.ca.envelopeFees, tier.feeShippingWeight, "maxKg");
      return {
        amount: band.amount,
        bandLabel: band.label,
        explanation: "CA envelope fulfilment fees use shipping weight rounded up to the nearest 100 g.",
        supported: true
      };
    }

    if (tier.key === "standard") {
      const fixedBand = DATA.ca.standardFees.find((row) => tier.feeShippingWeight <= row.maxKg + 1e-9);
      if (fixedBand) {
        return {
          amount: fixedBand.amount,
          bandLabel: fixedBand.label,
          explanation: "CA standard fulfilment fees use shipping weight rounded up to the nearest 100 g.",
          supported: true
        };
      }

      const intervals = Math.max(0, Math.round((tier.feeShippingWeight - 1.5) / 0.1));
      return {
        amount: DATA.ca.standardOver.base + (intervals * DATA.ca.standardOver.increment),
        bandLabel: `${DATA.ca.standardOver.label} (${intervals} interval${intervals === 1 ? "" : "s"} above first 1,500 g)`,
        explanation: "CA standard fulfilment fees above 1,500 g add CAD 0.09 per additional 100 g interval.",
        supported: true
      };
    }

    const formula = DATA.ca.oversize[tier.key];
    const intervals = Math.max(0, Math.round((tier.feeShippingWeight - 0.5) / 0.5));
    return {
      amount: formula.base + (intervals * formula.increment),
      bandLabel: `${formula.label}${intervals > 0 ? ` (${intervals} interval${intervals === 1 ? "" : "s"} above first 500 g)` : ""}`,
      explanation: "CA oversize fulfilment fees use shipping weight rounded up to the nearest 500 g.",
      supported: true
    };
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
    if (input.market === "CA") return baseFeeCa(tier);
    return baseFeeMx(input, tier);
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
    if (input.market !== "US") {
      return { amount: 0, applied: false, reason: "当前提供的 CA / MX 文件中没有 low-inventory-level fee 费率，因此这里不计入。" };
    }

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

    if (tier.key === "small_bulky" || tier.key === "large_bulky") {
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

    const notes = [
      view.baseExplanation,
      view.fuelLogistics.detail,
      view.sipp.reason,
      view.lowInventory.reason,
      view.overmax.reason,
      ...view.warnings
    ];

    if (view.market === "US") {
      notes.push("本页的 US 部分只实现你提供文件里覆盖的 2026-01-15 之后美国本地规则。SIPP 已计入总额；returns processing / storage / aged inventory / referral fee 仍未计入。");
    } else if (view.market === "CA") {
      notes.push("本页的 CA 部分只实现你提供文件里覆盖的 2026-01-15 之后加拿大非旺季 fulfilment fee 与 SIPP discount。GST / HST 及 Special Handling surcharge 未计入。");
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

      <div class="detail-grid">
        <section class="card">
          <h3>核心结果</h3>
          <div class="facts">
            <div class="fact"><span>站点</span><strong>${view.marketLabel}</strong></div>
            <div class="fact"><span>费率类别</span><strong>${view.categoryLabel}</strong></div>
            <div class="fact"><span>价格带</span><strong>${view.priceBandLabel}</strong></div>
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
  }

  function calculate() {
    const input = collectInput();
    if (!validateInput(input)) {
      dom.result.innerHTML = `<div class="empty-state">请先输入合法的尺寸、重量${DATA.markets[input.market].priceRequired ? "、售价" : ""}和站点信息。</div>`;
      return;
    }

    const tier = classifySizeTier(input);
    const base = baseFee(input, tier);
    const fuelLogistics = fuelLogisticsSurchargeNa(input, base);
    const sipp = sippAdjustment(input, tier);
    const lowInventory = lowInventoryFee(input, tier);
    const overmax = overmaxFee(tier);

    let total = null;
    if (base.supported) {
      total = round2(
        base.amount
        + fuelLogistics.amount
        + (sipp.type === "fee" ? sipp.amount : 0)
        - (sipp.type === "discount" ? sipp.amount : 0)
        + lowInventory.amount
        + overmax.amount
      );
    }

    renderResult({
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
      fuelLogistics,
      sipp,
      sippCertified: input.sippCertified,
      lowInventory,
      overmax,
      total,
      totalLabel: total == null ? "当前组合在提供的费率表中缺少完整价格，请人工复核" : "基础费 + fuel surcharge ± SIPP 调整 + 可能的 market-specific surcharge",
      priceBandLabel: priceBandLabel(input),
      categoryLabel: DATA.categories[input.market][input.category].short,
      warnings: tier.warnings
    });
  }

  function populateCategoryOptions(market) {
    const options = Object.entries(DATA.categories[market]).map(([value, meta]) => (
      `<option value="${value}">${meta.label} / ${meta.short}</option>`
    ));
    dom.category.innerHTML = options.join("");
  }

  function renderSizeTierGuide(market) {
    const guide = DATA.sizeTierGuides[market];
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
    renderSizeTierGuide(market);

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

    const showUsOnly = market === "US";
    dom.usOnlySection.hidden = !showUsOnly;

    dom.resultIntro.textContent = market === "US"
      ? "结果会显示 US 基础履约费、SIPP 调整、low inventory 附加费和 overmax handling fee。"
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
        dom.largeStandardDimMinimum.checked = false;
        dom.sippCertified.checked = true;
      } else {
        dom.length.value = "152.4";
        dom.width.value = "97.8";
        dom.height.value = "12.1";
        dom.weight.value = "44.23";
        dom.category.value = "general";
        dom.fuelLogisticsSurcharge.checked = true;
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
        dom.largeStandardDimMinimum.checked = false;
        dom.sippCertified.checked = false;
      }
    }

    dom.groceryExempt.checked = false;
    dom.newSellerExempt.checked = false;
    dom.newToFbaExempt.checked = false;
    dom.awdExempt.checked = false;
    dom.slowMoverExempt.checked = false;
    calculate();
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
    dom.largeStandardDimMinimum = document.getElementById("largeStandardDimMinimum");
    dom.sippCertified = document.getElementById("sippCertified");
    dom.longTermDos = document.getElementById("longTermDos");
    dom.shortTermDos = document.getElementById("shortTermDos");
    dom.groceryExempt = document.getElementById("groceryExempt");
    dom.newSellerExempt = document.getElementById("newSellerExempt");
    dom.newToFbaExempt = document.getElementById("newToFbaExempt");
    dom.awdExempt = document.getElementById("awdExempt");
    dom.slowMoverExempt = document.getElementById("slowMoverExempt");
    dom.usOnlySection = document.getElementById("us-only-section");
    dom.resultIntro = document.getElementById("result-intro");

    syncMarketUi();

    dom.market.addEventListener("change", () => {
      syncMarketUi();
      calculate();
    });

    dom.form.addEventListener("submit", (event) => {
      event.preventDefault();
      calculate();
    });

    document.getElementById("sample-small").addEventListener("click", () => loadExample("light"));
    document.getElementById("sample-overmax").addEventListener("click", () => loadExample("heavy"));
  }

  document.addEventListener("DOMContentLoaded", bindDom);
})();
