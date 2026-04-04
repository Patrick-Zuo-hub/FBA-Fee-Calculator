window.FBA_FEE_DATA = (() => {
  const COUNTRIES = {
    UK: { label: "英国", currency: "GBP", symbol: "£", isEU: false },
    DE: { label: "德国", currency: "EUR", symbol: "€", isEU: true },
    FR: { label: "法国", currency: "EUR", symbol: "€", isEU: true },
    IT: { label: "意大利", currency: "EUR", symbol: "€", isEU: true },
    ES: { label: "西班牙", currency: "EUR", symbol: "€", isEU: true },
    NL: { label: "荷兰", currency: "EUR", symbol: "€", isEU: true },
    SE: { label: "瑞典", currency: "SEK", symbol: "SEK ", isEU: true },
    PL: { label: "波兰", currency: "PLN", symbol: "PLN ", isEU: true },
    BE: { label: "比利时", currency: "EUR", symbol: "€", isEU: true },
    IE: { label: "爱尔兰", currency: "EUR", symbol: "€", isEU: true }
  };

  const LOW_PRICE_THRESHOLDS = {
    general: { UK: 20, DE: 20, FR: 20, IT: 20, ES: 20, NL: 20, BE: 20, IE: 20, SE: 230, PL: 85 },
    special: { UK: 10, DE: 11, FR: 12, IT: 12, ES: 12, NL: 12, BE: 12, IE: 12, SE: 140, PL: 55 }
  };

  const HAZMAT_SURCHARGE = {
    GBP: 0.1,
    EUR: 0.1,
    SEK: 1,
    PLN: 0.4
  };

  const CEP_SURCHARGE = {
    UK: 0.26,
    DE: 0.26,
    FR: 0.26,
    IT: 0.26,
    ES: 0.26,
    NL: 0.26,
    BE: 0.26,
    IE: 0.26,
    SE: 2.5,
    PL: 1.15
  };

  const LOCAL_LOW_PRICE = [
    {
      key: "light-envelope",
      label: "Light envelope",
      maxDims: [33, 23, 2.5],
      maxUnitWeightKg: 0.1,
      bands: [
        { maxWeightKg: 0.02, fees: { UK: 1.46, CEP: 1.61, DE: 1.87, FR: 2.24, IT: 2.64, ES: 2.15, NL: 1.96, SE: 28.71, PL: 1.68, BE: 1.74 } },
        { maxWeightKg: 0.04, fees: { UK: 1.5, CEP: 1.64, DE: 1.9, FR: 2.26, IT: 2.65, ES: 2.21, NL: 2, SE: 28.91, PL: 1.7, BE: 1.77 } },
        { maxWeightKg: 0.06, fees: { UK: 1.52, CEP: 1.66, DE: 1.92, FR: 2.27, IT: 2.67, ES: 2.23, NL: 2, SE: 29.07, PL: 1.7, BE: 1.78 } },
        { maxWeightKg: 0.08, fees: { UK: 1.67, CEP: 1.8, DE: 2.06, FR: 2.79, IT: 2.79, ES: 2.55, NL: 2.08, SE: 30.56, PL: 1.72, BE: 1.83 } },
        { maxWeightKg: 0.1, fees: { UK: 1.7, CEP: 1.83, DE: 2.09, FR: 2.81, IT: 2.81, ES: 2.59, NL: 2.11, SE: 30.74, PL: 1.73, BE: 1.86 } }
      ]
    },
    {
      key: "standard-envelope",
      label: "Standard envelope",
      maxDims: [33, 23, 2.5],
      maxUnitWeightKg: 0.46,
      bands: [
        { maxWeightKg: 0.21, fees: { UK: 1.73, CEP: 1.86, DE: 2.12, FR: 2.81, IT: 2.81, ES: 2.61, NL: 2.16, SE: 31.56, PL: 1.74, BE: 1.98 } },
        { maxWeightKg: 0.46, fees: { UK: 1.87, CEP: 2.02, DE: 2.28, FR: 3.31, IT: 3.04, ES: 2.85, NL: 2.25, SE: 36.61, PL: 1.83, BE: 2.12 } }
      ]
    },
    {
      key: "large-envelope",
      label: "Large envelope",
      maxDims: [33, 23, 4],
      maxUnitWeightKg: 0.96,
      bands: [
        { maxWeightKg: 0.96, fees: { UK: 2.42, CEP: 2.39, DE: 2.65, FR: 3.96, IT: 3.35, ES: 3, NL: 2.91, SE: 37.79, PL: 1.89, BE: 2.66 } }
      ]
    },
    {
      key: "extra-large-envelope",
      label: "Extra-large envelope",
      maxDims: [33, 23, 6],
      maxUnitWeightKg: 0.96,
      bands: [
        { maxWeightKg: 0.96, fees: { UK: 2.65, CEP: 2.78, DE: 3.04, FR: 4.31, IT: 3.59, ES: 3.23, NL: 3.26, SE: 40.84, PL: 1.91, BE: 2.96 } }
      ]
    },
    {
      key: "small-parcel",
      label: "Small parcel",
      maxDims: [35, 25, 12],
      maxUnitWeightKg: 0.4,
      bands: [
        { maxWeightKg: 0.15, fees: { UK: 2.67, CEP: 2.78, DE: 3.04, FR: 4.31, IT: 3.59, ES: 3.23, NL: 3.13, SE: 41.23, PL: 1.81, BE: 2.64 } },
        { maxWeightKg: 0.4, fees: { UK: 2.7, CEP: 2.99, DE: 3.25, FR: 4.71, IT: 3.91, ES: 3.46, NL: 3.17, SE: 43.31, PL: 1.86, BE: 2.96 } }
      ]
    }
  ];

  const LOCAL_STANDARD = [
    {
      key: "light-envelope",
      label: "Light envelope",
      maxDims: [33, 23, 2.5],
      maxUnitWeightKg: 0.1,
      shippingWeight: "unit",
      bands: [
        { maxWeightKg: 0.02, fees: { UK: 1.83, CEP: 2.07, DE: 2.33, FR: 2.75, IT: 3.23, ES: 2.77, NL: 2.31, SE: 33.35, PL: 3.04, BE: 2.26 } },
        { maxWeightKg: 0.04, fees: { UK: 1.87, CEP: 2.11, DE: 2.37, FR: 2.76, IT: 3.26, ES: 2.84, NL: 2.35, SE: 33.52, PL: 3.05, BE: 2.31 } },
        { maxWeightKg: 0.06, fees: { UK: 1.89, CEP: 2.13, DE: 2.39, FR: 2.78, IT: 3.28, ES: 2.87, NL: 2.35, SE: 33.7, PL: 3.06, BE: 2.31 } },
        { maxWeightKg: 0.08, fees: { UK: 2.07, CEP: 2.26, DE: 2.52, FR: 3.3, IT: 3.39, ES: 3.21, NL: 2.45, SE: 35.08, PL: 3.13, BE: 2.41 } },
        { maxWeightKg: 0.1, fees: { UK: 2.08, CEP: 2.28, DE: 2.54, FR: 3.32, IT: 3.41, ES: 3.23, NL: 2.47, SE: 35.2, PL: 3.14, BE: 2.43 } }
      ]
    },
    {
      key: "standard-envelope",
      label: "Standard envelope",
      maxDims: [33, 23, 2.5],
      maxUnitWeightKg: 0.46,
      shippingWeight: "unit",
      bands: [
        { maxWeightKg: 0.21, fees: { UK: 2.1, CEP: 2.31, DE: 2.57, FR: 3.33, IT: 3.45, ES: 3.26, NL: 2.51, SE: 35.47, PL: 3.16, BE: 2.47 } },
        { maxWeightKg: 0.46, fees: { UK: 2.16, CEP: 2.42, DE: 2.68, FR: 3.77, IT: 3.64, ES: 3.45, NL: 2.6, SE: 41.09, PL: 3.36, BE: 2.56 } }
      ]
    },
    {
      key: "large-envelope",
      label: "Large envelope",
      maxDims: [33, 23, 4],
      maxUnitWeightKg: 0.96,
      shippingWeight: "unit",
      bands: [
        { maxWeightKg: 0.96, fees: { UK: 2.72, CEP: 2.78, DE: 3.04, FR: 4.39, IT: 3.94, ES: 3.6, NL: 3.26, SE: 42.35, PL: 3.49, BE: 3.21 } }
      ]
    },
    {
      key: "extra-large-envelope",
      label: "Extra-large envelope",
      maxDims: [33, 23, 6],
      maxUnitWeightKg: 0.96,
      shippingWeight: "unit",
      bands: [
        { maxWeightKg: 0.96, fees: { UK: 2.94, CEP: 3.16, DE: 3.42, FR: 4.72, IT: 4.17, ES: 3.85, NL: 3.61, SE: 45.62, PL: 3.58, BE: 3.53 } }
      ]
    },
    {
      key: "small-parcel",
      label: "Small parcel",
      maxDims: [35, 25, 12],
      maxUnitWeightKg: 3.9,
      maxDimWeightKg: 2.1,
      shippingWeight: "max",
      bands: [
        { maxWeightKg: 0.15, fees: { UK: 2.91, CEP: 3.12, DE: 3.38, FR: 4.56, IT: 4.13, ES: 3.52, NL: 3.47, SE: 45.41, PL: 3.61, BE: 3.39 } },
        { maxWeightKg: 0.4, fees: { UK: 3, CEP: 3.13, DE: 3.39, FR: 5.07, IT: 4.54, ES: 3.74, NL: 3.51, SE: 47.29, PL: 3.67, BE: 3.67 } },
        { maxWeightKg: 0.9, fees: { UK: 3.04, CEP: 3.14, DE: 3.4, FR: 5.79, IT: 4.95, ES: 3.95, NL: 4.03, SE: 48.19, PL: 3.71, BE: 4.15 } },
        { maxWeightKg: 1.4, fees: { UK: 3.05, CEP: 3.15, DE: 3.41, FR: 5.87, IT: 5.11, ES: 4.21, NL: 4.5, SE: 52.68, PL: 3.76, BE: 4.63 } },
        { maxWeightKg: 1.9, fees: { UK: 3.25, CEP: 3.17, DE: 3.43, FR: 6.1, IT: 5.14, ES: 4.27, NL: 4.82, SE: 54.49, PL: 3.81, BE: 4.95 } },
        { maxWeightKg: 3.9, fees: { UK: 3.27, CEP: 4.28, DE: 4.54, FR: 7.8, IT: 5.16, ES: 5.5, NL: 5.9, SE: 64.1, PL: 3.93, BE: 6.38 } }
      ]
    },
    {
      key: "standard-parcel",
      label: "Standard parcel",
      maxDims: [45, 34, 26],
      maxUnitWeightKg: 11.9,
      maxDimWeightKg: 7.96,
      shippingWeight: "max",
      bands: [
        { maxWeightKg: 0.15, fees: { UK: 2.94, CEP: 3.13, DE: 3.39, FR: 4.58, IT: 4.29, ES: 3.55, NL: 3.69, SE: 48.58, PL: 3.67, BE: 3.46 } },
        { maxWeightKg: 0.4, fees: { UK: 3.01, CEP: 3.16, DE: 3.42, FR: 5.22, IT: 4.7, ES: 3.77, NL: 4.04, SE: 51.7, PL: 3.73, BE: 3.85 } },
        { maxWeightKg: 0.9, fees: { UK: 3.06, CEP: 3.18, DE: 3.44, FR: 6.01, IT: 5.15, ES: 3.99, NL: 4.39, SE: 52.04, PL: 3.8, BE: 4.39 } },
        { maxWeightKg: 1.4, fees: { UK: 3.26, CEP: 3.67, DE: 3.93, FR: 6.41, IT: 5.26, ES: 4.85, NL: 4.72, SE: 58.46, PL: 3.89, BE: 4.99 } },
        { maxWeightKg: 1.9, fees: { UK: 3.48, CEP: 3.69, DE: 3.95, FR: 6.44, IT: 5.29, ES: 4.94, NL: 4.76, SE: 61.53, PL: 3.97, BE: 5.41 } },
        { maxWeightKg: 2.9, fees: { UK: 3.49, CEP: 4.29, DE: 4.55, FR: 7.08, IT: 5.3, ES: 4.98, NL: 4.82, SE: 65.36, PL: 4.1, BE: 6.27 } },
        { maxWeightKg: 3.9, fees: { UK: 3.54, CEP: 4.83, DE: 5.09, FR: 7.81, IT: 5.35, ES: 5.53, NL: 5.15, SE: 65.71, PL: 4.15, BE: 6.3 } },
        { maxWeightKg: 5.9, fees: { UK: 3.56, CEP: 4.96, DE: 5.22, FR: 8.22, IT: 5.38, ES: 5.96, NL: 5.3, SE: 70.2, PL: 4.19, BE: 6.54 } },
        { maxWeightKg: 8.9, fees: { UK: 3.57, CEP: 5.77, DE: 6.03, FR: 8.84, IT: 5.41, ES: 7.24, NL: 5.74, SE: 72.2, PL: 4.24, BE: 6.9 } },
        { maxWeightKg: 11.9, fees: { UK: 3.58, CEP: 6.39, DE: 6.65, FR: 9.38, IT: 6.25, ES: 7.85, NL: 6.31, SE: 87.92, PL: 4.37, BE: 7.36 } }
      ]
    },
    {
      key: "small-oversize",
      label: "Small oversize",
      maxDims: [61, 46, 46],
      maxUnitWeightKg: 1.76,
      maxDimWeightKg: 25.82,
      shippingWeight: "max",
      baseBandMaxKg: 0.76,
      baseFees: { UK: 3.49, CEP: 4.3, DE: 4.56, FR: 7.05, IT: 7.21, ES: 5.68, NL: 7.02, SE: 82.32, PL: 4.13, BE: 6.63 },
      incrementFees: { UK: 0.25, CEP: 0.18, DE: 0.18, FR: 0.2, IT: 0.08, ES: 0.04, NL: 0.07, SE: 0.73, PL: 0.03, BE: 0.04 }
    },
    {
      key: "standard-oversize-light",
      label: "Standard oversize light",
      maxDims: [101, 60, 60],
      maxUnitWeightKg: 15,
      maxDimWeightKg: 72.72,
      shippingWeight: "max",
      baseBandMaxKg: 0.76,
      baseFees: { UK: 4.35, CEP: 4.33, DE: 4.59, FR: 7.29, IT: 7.45, ES: 6.55, NL: 7.12, SE: 82.59, PL: 4.15, BE: 6.66 },
      incrementFees: { UK: 0.15, CEP: 0.18, DE: 0.18, FR: 0.21, IT: 0.22, ES: 0.34, NL: 0.22, SE: 3.1, PL: 0.14, BE: 0.23 }
    },
    {
      key: "standard-oversize-heavy",
      label: "Standard oversize heavy",
      maxDims: [101, 60, 60],
      minUnitWeightKg: 15.000001,
      maxUnitWeightKg: 23,
      maxDimWeightKg: 72.72,
      shippingWeight: "max",
      baseBandMaxKg: 15.76,
      baseFees: { UK: 6.58, CEP: 6.99, DE: 7.25, FR: 10.42, IT: 10.63, ES: 11.72, NL: 10.24, SE: 129.09, PL: 6.15, BE: 10.15 },
      incrementFees: { UK: 0.08, CEP: 0.07, DE: 0.07, FR: 0.11, IT: 0.08, ES: 0.27, NL: 0.22, SE: 4, PL: 0.15, BE: 0.24 }
    },
    {
      key: "standard-oversize-large",
      label: "Standard oversize large",
      maxDims: [120, 60, 60],
      maxUnitWeightKg: 23,
      maxDimWeightKg: 86.4,
      shippingWeight: "max",
      baseBandMaxKg: 0.76,
      baseFees: { UK: 5.67, CEP: 5.8, DE: 6.06, FR: 8.47, IT: 9.13, ES: 6.76, NL: 7.22, SE: 83.09, PL: 4.18, BE: 6.69 },
      incrementFees: { UK: 0.07, CEP: 0.08, DE: 0.08, FR: 0.13, IT: 0.09, ES: 0.33, NL: 0.23, SE: 4, PL: 0.16, BE: 0.29 }
    },
    {
      key: "bulky-oversize",
      label: "Bulky oversize",
      maxUnitWeightKg: 23,
      maxDimWeightKg: 126,
      shippingWeight: "max",
      baseBandMaxKg: 0.76,
      baseFees: { UK: 10.2, CEP: 7.98, DE: 8.24, FR: 15.38, IT: 9.59, ES: 9.95, NL: 9.96, SE: 118.02, PL: 6.27, BE: 9.5 },
      incrementFees: { UK: 0.24, CEP: 0.27, DE: 0.27, FR: 0.45, IT: 0.3, ES: 0.43, NL: 0.32, SE: 4.9, PL: 0.16, BE: 0.35 }
    },
    {
      key: "heavy-oversize",
      label: "Heavy oversize",
      minUnitWeightKg: 23.000001,
      maxUnitWeightKg: 31.5,
      maxDimWeightKg: 126,
      shippingWeight: "max",
      baseBandMaxKg: 31.5,
      baseFees: { UK: 13.04, CEP: 12.74, DE: 13, FR: 15.59, IT: 16.85, ES: 14, NL: 16.22, SE: 192.14, PL: 10.21, BE: 15.47 },
      incrementFees: { UK: 0.09, CEP: 0.15, DE: 0.15, FR: 0.18, IT: 0.15, ES: 0.12, NL: 0.62, SE: 9.49, PL: 0.39, BE: 0.68 }
    },
    {
      key: "special-oversize",
      label: "Special oversize",
      shippingWeight: "unit",
      bands: [
        { maxWeightKg: 30, fees: { UK: 16.22, DE: 21.3, FR: 24.88, IT: 21.7, ES: 19.93 } },
        { maxWeightKg: 40, fees: { UK: 17.24, DE: 24.19, FR: 28.77, IT: 24.1, ES: 20.8 } },
        { maxWeightKg: 50, fees: { UK: 34.38, DE: 47.98, FR: 46.66, IT: 32.19, ES: 34.32 } },
        { maxWeightKg: 60, fees: { UK: 42.04, DE: 51.99, FR: 50.54, IT: 32.82, ES: 36.93 } }
      ],
      incrementFees: { UK: 0.35, DE: 0.36, FR: 0.49, IT: 0.65, ES: 0.45 }
    }
  ];

  const SELECTED_LOCAL_PARCEL = [
    { key: "small-parcel-1", label: "Small Parcel 1", maxDims: [35, 25, 7], maxUnitWeightKg: 3.9, baseFees: { UK: 2.83, CEP: 3.04, DE: 3.3, FR: 4.97, IT: 4.54, ES: 3.55, NL: 3.43, PL: 3.25, BE: 3.48, SE: 40.91 }, incrementFees: { UK: 0.02, CEP: 0.05, DE: 0.05, FR: 0.03, IT: 0.02, ES: 0.04, NL: 0.07, PL: 0.01, BE: 0.07, SE: 0.77 } },
    { key: "small-parcel-2", label: "Small Parcel 2", maxDims: [35, 25, 9], maxUnitWeightKg: 3.9, baseFees: { UK: 2.87, CEP: 3.08, DE: 3.34, FR: 5.01, IT: 4.58, ES: 3.59, NL: 3.52, PL: 3.29, BE: 3.52, SE: 41.23 }, incrementFees: { UK: 0.02, CEP: 0.06, DE: 0.06, FR: 0.05, IT: 0.03, ES: 0.04, NL: 0.07, PL: 0.01, BE: 0.07, SE: 0.77 } },
    { key: "small-parcel-3", label: "Small Parcel 3", maxDims: [35, 25, 12], maxUnitWeightKg: 3.9, baseFees: { UK: 2.91, CEP: 3.12, DE: 3.38, FR: 5.05, IT: 4.62, ES: 3.62, NL: 3.62, PL: 3.33, BE: 3.67, SE: 41.76 }, incrementFees: { UK: 0.02, CEP: 0.07, DE: 0.07, FR: 0.08, IT: 0.06, ES: 0.05, NL: 0.08, PL: 0.01, BE: 0.07, SE: 0.77 } },
    { key: "medium-parcel-1", label: "Medium Parcel 1", maxDims: [40, 30, 6], maxUnitWeightKg: 11.9, baseFees: { UK: 2.97, CEP: 3.24, DE: 3.5, FR: 5.45, IT: 4.83, ES: 3.85, NL: 3.77, PL: 3.37, BE: 3.84, SE: 45.06 }, incrementFees: { UK: 0.02, CEP: 0.07, DE: 0.07, FR: 0.08, IT: 0.06, ES: 0.07, NL: 0.08, PL: 0.01, BE: 0.08, SE: 0.89 } },
    { key: "medium-parcel-2", label: "Medium Parcel 2", maxDims: [40, 30, 20], maxUnitWeightKg: 11.9, baseFees: { UK: 3.1, CEP: 3.47, DE: 3.73, FR: 5.69, IT: 5.05, ES: 3.91, NL: 4.01, PL: 3.41, BE: 4.15, SE: 46.44 }, incrementFees: { UK: 0.03, CEP: 0.07, DE: 0.07, FR: 0.08, IT: 0.07, ES: 0.08, NL: 0.08, PL: 0.01, BE: 0.08, SE: 0.89 } },
    { key: "large-parcel-1", label: "Large Parcel 1", maxDims: [45, 34, 10], maxUnitWeightKg: 11.9, baseFees: { UK: 3.34, CEP: 3.71, DE: 3.97, FR: 6.16, IT: 5.3, ES: 4.08, NL: 4.06, PL: 3.45, BE: 4.2, SE: 46.76 }, incrementFees: { UK: 0.03, CEP: 0.07, DE: 0.07, FR: 0.08, IT: 0.08, ES: 0.11, NL: 0.08, PL: 0.01, BE: 0.08, SE: 0.89 } },
    { key: "large-parcel-2", label: "Large Parcel 2", maxDims: [45, 34, 26], maxUnitWeightKg: 11.9, baseFees: { UK: 3.97, CEP: 4.12, DE: 4.38, FR: 6.25, IT: 5.44, ES: 4.53, NL: 4.15, PL: 3.57, BE: 4.34, SE: 47.18 }, incrementFees: { UK: 0.03, CEP: 0.08, DE: 0.08, FR: 0.08, IT: 0.08, ES: 0.11, NL: 0.08, PL: 0.02, BE: 0.08, SE: 0.89 } }
  ];

  const EFN_STANDARD = [
    { key: "light-envelope", label: "Light envelope", maxDims: [33, 23, 2.5], maxUnitWeightKg: 0.1, shippingWeight: "unit", bands: [
      { maxWeightKg: 0.02, fees: { EU4: 5.08, DE_NON_CEE: 5.34, NLBE: 5.15, SE: 53.13, PL: 20.82, UK_TO_EU4: 4.86, UK_TO_NL: 5.59, UK_TO_SE: 59.4, EU4_TO_UK: 3.33 } },
      { maxWeightKg: 0.04, fees: { EU4: 5.11, DE_NON_CEE: 5.37, NLBE: 5.18, SE: 53.67, PL: 20.98, UK_TO_EU4: 4.89, UK_TO_NL: 5.62, UK_TO_SE: 60.01, EU4_TO_UK: 3.35 } },
      { maxWeightKg: 0.06, fees: { EU4: 5.16, DE_NON_CEE: 5.42, NLBE: 5.2, SE: 53.77, PL: 21.07, UK_TO_EU4: 4.94, UK_TO_NL: 5.65, UK_TO_SE: 60.11, EU4_TO_UK: 3.39 } },
      { maxWeightKg: 0.08, fees: { EU4: 5.47, DE_NON_CEE: 5.73, NLBE: 5.53, SE: 57.31, PL: 22.49, UK_TO_EU4: 5.21, UK_TO_NL: 6.01, UK_TO_SE: 64.08, EU4_TO_UK: 3.43 } },
      { maxWeightKg: 0.1, fees: { EU4: 5.5, DE_NON_CEE: 5.76, NLBE: 5.54, SE: 57.42, PL: 22.53, UK_TO_EU4: 5.24, UK_TO_NL: 6.02, UK_TO_SE: 64.16, EU4_TO_UK: 3.47 } }
    ]},
    { key: "standard-envelope", label: "Standard envelope", maxDims: [33, 23, 2.5], maxUnitWeightKg: 0.46, shippingWeight: "unit", bands: [
      { maxWeightKg: 0.21, fees: { EU4: 5.5, DE_NON_CEE: 5.76, NLBE: 5.56, SE: 57.57, PL: 22.61, UK_TO_EU4: 5.25, UK_TO_NL: 6.03, UK_TO_SE: 64.27, EU4_TO_UK: 3.47 } },
      { maxWeightKg: 0.46, fees: { EU4: 5.53, DE_NON_CEE: 5.79, NLBE: 5.6, SE: 57.91, PL: 22.95, UK_TO_EU4: 5.28, UK_TO_NL: 6.08, UK_TO_SE: 64.64, EU4_TO_UK: 3.56 } }
    ]},
    { key: "large-envelope", label: "Large envelope", maxDims: [33, 23, 4], maxUnitWeightKg: 0.96, shippingWeight: "unit", bands: [
      { maxWeightKg: 0.96, fees: { EU4: 6.09, DE_NON_CEE: 6.35, NLBE: 5.97, SE: 62.44, PL: 24.57, UK_TO_EU4: 5.81, UK_TO_NL: 6.48, UK_TO_SE: 69.7, EU4_TO_UK: 3.73 } }
    ]},
    { key: "extra-large-envelope", label: "Extra-large envelope", maxDims: [33, 23, 6], maxUnitWeightKg: 0.96, shippingWeight: "unit", bands: [
      { maxWeightKg: 0.96, fees: { EU4: 6.72, DE_NON_CEE: 6.98, NLBE: 6.59, SE: 67.57, PL: 29.68, UK_TO_EU4: 6.41, UK_TO_NL: 7.16, UK_TO_SE: 75.43, EU4_TO_UK: 3.8 } }
    ]},
    { key: "small-parcel", label: "Small parcel", maxDims: [35, 25, 12], maxUnitWeightKg: 3.9, maxDimWeightKg: 2.1, shippingWeight: "max", bands: [
      { maxWeightKg: 0.15, fees: { EU4: 6.61, DE_NON_CEE: 6.87, NLBE: 6.59, SE: 67.83, PL: 29.68, UK_TO_EU4: 6.2, UK_TO_NL: 7.03, UK_TO_SE: 74.41, EU4_TO_UK: 4.34 } },
      { maxWeightKg: 0.4, fees: { EU4: 7.05, DE_NON_CEE: 7.31, NLBE: 7.21, SE: 73.94, PL: 32.33, UK_TO_EU4: 6.62, UK_TO_NL: 7.69, UK_TO_SE: 81.11, EU4_TO_UK: 4.44 } },
      { maxWeightKg: 0.9, fees: { EU4: 8.45, DE_NON_CEE: 8.71, NLBE: 8.64, SE: 88.56, PL: 38.43, UK_TO_EU4: 7.93, UK_TO_NL: 9.22, UK_TO_SE: 97.15, EU4_TO_UK: 4.62 } },
      { maxWeightKg: 1.4, fees: { EU4: 9.28, DE_NON_CEE: 9.54, NLBE: 9.49, SE: 97.37, PL: 42.11, UK_TO_EU4: 8.72, UK_TO_NL: 10.13, UK_TO_SE: 106.82, EU4_TO_UK: 4.86 } },
      { maxWeightKg: 1.9, fees: { EU4: 10.58, DE_NON_CEE: 10.84, NLBE: 10.82, SE: 110.88, PL: 47.74, UK_TO_EU4: 9.93, UK_TO_NL: 11.54, UK_TO_SE: 121.63, EU4_TO_UK: 5.33 } },
      { maxWeightKg: 3.9, fees: { EU4: 13.42, DE_NON_CEE: 13.68, NLBE: 13.73, SE: 140.71, PL: 60.18, UK_TO_EU4: 12.6, UK_TO_NL: 14.65, UK_TO_SE: 154.36, EU4_TO_UK: 5.44 } }
    ]},
    { key: "standard-parcel", label: "Standard parcel", maxDims: [45, 34, 26], maxUnitWeightKg: 11.9, maxDimWeightKg: 7.96, shippingWeight: "max", bands: [
      { maxWeightKg: 0.15, fees: { EU4: 6.63, DE_NON_CEE: 6.89, NLBE: 6.73, SE: 68.32, PL: 29.85, UK_TO_EU4: 6.22, UK_TO_NL: 7.18, UK_TO_SE: 74.95, EU4_TO_UK: 4.74 } },
      { maxWeightKg: 0.4, fees: { EU4: 7.73, DE_NON_CEE: 7.99, NLBE: 7.9, SE: 81.01, PL: 33.08, UK_TO_EU4: 7.26, UK_TO_NL: 8.43, UK_TO_SE: 88.87, EU4_TO_UK: 4.98 } },
      { maxWeightKg: 0.9, fees: { EU4: 9.19, DE_NON_CEE: 9.45, NLBE: 9.4, SE: 96.36, PL: 38.98, UK_TO_EU4: 8.63, UK_TO_NL: 10.03, UK_TO_SE: 105.71, EU4_TO_UK: 5.19 } },
      { maxWeightKg: 1.4, fees: { EU4: 10.43, DE_NON_CEE: 10.69, NLBE: 10.67, SE: 109.35, PL: 42.8, UK_TO_EU4: 9.79, UK_TO_NL: 11.38, UK_TO_SE: 119.96, EU4_TO_UK: 5.27 } },
      { maxWeightKg: 1.9, fees: { EU4: 11.97, DE_NON_CEE: 12.23, NLBE: 12.25, SE: 125.51, PL: 49.14, UK_TO_EU4: 11.24, UK_TO_NL: 13.06, UK_TO_SE: 137.69, EU4_TO_UK: 5.74 } },
      { maxWeightKg: 2.9, fees: { EU4: 13.42, DE_NON_CEE: 13.68, NLBE: 13.73, SE: 140.71, PL: 60.43, UK_TO_EU4: 12.6, UK_TO_NL: 14.65, UK_TO_SE: 154.36, EU4_TO_UK: 6.93 } },
      { maxWeightKg: 3.9, fees: { EU4: 15.8, DE_NON_CEE: 16.06, NLBE: 16.16, SE: 165.71, PL: 64.6, UK_TO_EU4: 14.84, UK_TO_NL: 17.24, UK_TO_SE: 181.78, EU4_TO_UK: 8.74 } },
      { maxWeightKg: 5.9, fees: { EU4: 16.67, DE_NON_CEE: 16.93, NLBE: 17.05, SE: 174.75, PL: 67.88, UK_TO_EU4: 15.65, UK_TO_NL: 18.19, UK_TO_SE: 191.7, EU4_TO_UK: 9.64 } },
      { maxWeightKg: 8.9, fees: { EU4: 18.06, DE_NON_CEE: 18.32, NLBE: 18.48, SE: 189.36, PL: 73.47, UK_TO_EU4: 16.96, UK_TO_NL: 19.71, UK_TO_SE: 207.73, EU4_TO_UK: 9.82 } },
      { maxWeightKg: 11.9, fees: { EU4: 21.24, DE_NON_CEE: 21.5, NLBE: 21.72, SE: 222.6, PL: 88.03, UK_TO_EU4: 19.94, UK_TO_NL: 23.17, UK_TO_SE: 244.2, EU4_TO_UK: 10.33 } }
    ]},
    { key: "small-oversize", label: "Small oversize", maxDims: [61, 46, 46], maxUnitWeightKg: 1.76, maxDimWeightKg: 25.82, shippingWeight: "max", baseBandMaxKg: 0.76, baseFees: { EU4: 17.68, DE_NON_CEE: 17.94, NLBE: 15.63, SE: 161.58, PL: 71.6, UK_TO_EU4: 13.63, UK_TO_NL: 15.99, UK_TO_SE: 173.42, EU4_TO_UK: 12.3 }, incrementFees: { EU4: 0.36, DE_NON_CEE: 0.36, NLBE: 0.16, SE: 1.86, PL: 0.81, UK_TO_EU4: 0.21, UK_TO_NL: 0.17, UK_TO_SE: 1.99, EU4_TO_UK: 0.5 } },
    { key: "standard-oversize-light", label: "Standard oversize light", maxDims: [101, 60, 60], maxUnitWeightKg: 15, maxDimWeightKg: 72.72, shippingWeight: "max", baseBandMaxKg: 0.76, baseFees: { EU4: 21.55, DE_NON_CEE: 21.81, NLBE: 19.34, SE: 191.97, PL: 85.98, UK_TO_EU4: 16.47, UK_TO_NL: 19.79, UK_TO_SE: 196.44, EU4_TO_UK: 12.53 }, incrementFees: { EU4: 0.78, DE_NON_CEE: 0.78, NLBE: 0.59, SE: 6.38, PL: 2.44, UK_TO_EU4: 0.57, UK_TO_NL: 0.61, UK_TO_SE: 6.53, EU4_TO_UK: 0.54 } },
    { key: "standard-oversize-heavy", label: "Standard oversize heavy", maxDims: [101, 60, 60], minUnitWeightKg: 15.000001, maxUnitWeightKg: 23, maxDimWeightKg: 72.72, shippingWeight: "max", baseBandMaxKg: 15.76, baseFees: { EU4: 32.87, DE_NON_CEE: 33.13, NLBE: 27.78, SE: 280.13, PL: 121.48, UK_TO_EU4: 24.54, UK_TO_NL: 28.43, UK_TO_SE: 286.65, EU4_TO_UK: 20.49 }, incrementFees: { EU4: 0.38, DE_NON_CEE: 0.38, NLBE: 0.58, SE: 5.8, PL: 2.32, UK_TO_EU4: 0.62, UK_TO_NL: 0.59, UK_TO_SE: 6.22, EU4_TO_UK: 0.57 } },
    { key: "standard-oversize-large", label: "Standard oversize large", maxDims: [120, 60, 60], maxUnitWeightKg: 23, maxDimWeightKg: 86.4, shippingWeight: "max", baseBandMaxKg: 0.76, baseFees: { EU4: 22.13, DE_NON_CEE: 22.39, NLBE: 19.57, SE: 194.75, PL: 86.68, UK_TO_EU4: 17.06, UK_TO_NL: 20.02, UK_TO_SE: 199.29, EU4_TO_UK: 13.03 }, incrementFees: { EU4: 0.78, DE_NON_CEE: 0.78, NLBE: 0.64, SE: 6.38, PL: 2.67, UK_TO_EU4: 0.62, UK_TO_NL: 0.65, UK_TO_SE: 6.85, EU4_TO_UK: 0.56 } },
    { key: "bulky-oversize", label: "Bulky oversize", maxUnitWeightKg: 23, maxDimWeightKg: 126, shippingWeight: "max", baseBandMaxKg: 0.76, baseFees: { EU4: 32.95, DE_NON_CEE: 33.21, NLBE: 29.12, SE: 294.7, PL: 130.19, UK_TO_EU4: 25.4, UK_TO_NL: 29.79, UK_TO_SE: 301.56, EU4_TO_UK: 15.53 }, incrementFees: { EU4: 1.15, DE_NON_CEE: 1.15, NLBE: 0.67, SE: 6.6, PL: 3.02, UK_TO_EU4: 0.99, UK_TO_NL: 0.69, UK_TO_SE: 7.09, EU4_TO_UK: 0.6 } },
    { key: "heavy-oversize", label: "Heavy oversize", minUnitWeightKg: 23.000001, maxUnitWeightKg: 31.5, maxDimWeightKg: 126, shippingWeight: "max", baseBandMaxKg: 31.5, baseFees: { EU4: 37.67, DE_NON_CEE: 37.93, NLBE: 35.52, SE: 366.6, PL: 148.84, UK_TO_EU4: 29.58, UK_TO_NL: 39.51, UK_TO_SE: 456.44, EU4_TO_UK: 22.32 }, incrementFees: { EU4: 1.24, DE_NON_CEE: 1.24, NLBE: 0.78, SE: 7.75, PL: 3.26, UK_TO_EU4: 1.19, UK_TO_NL: 0.87, UK_TO_SE: 8.88, EU4_TO_UK: 0.62 } }
  ];

  const SELECTED_EFN_PARCEL = [
    { key: "small-parcel-1", label: "Small Parcel 1", maxDims: [35, 25, 7], maxUnitWeightKg: 3.9, baseFees: { CEP: 6.8, DE: 7.06, FR: 6.8, IT: 6.8, ES: 6.8, NL: 7.15, PL: 30.56, BE: 7.15, SE: 73.57, EU4_TO_UK: 3.24, UK_TO_EU4: 5.61, UK_TO_NLBE: 6.7, UK_TO_SE: 70.92 }, incrementFees: { CEP: 0.01, DE: 0.01, FR: 0.01, IT: 0.01, ES: 0.01, NL: 0.05, PL: 0.21, BE: 0.05, SE: 0.05, EU4_TO_UK: 0.01, UK_TO_EU4: 0.01, UK_TO_NLBE: 0.05, UK_TO_SE: 0.48 } },
    { key: "small-parcel-2", label: "Small Parcel 2", maxDims: [35, 25, 9], maxUnitWeightKg: 3.9, baseFees: { CEP: 7.25, DE: 7.51, FR: 7.25, IT: 7.25, ES: 7.25, NL: 7.58, PL: 32.42, BE: 7.58, SE: 78.04, EU4_TO_UK: 3.46, UK_TO_EU4: 5.98, UK_TO_NLBE: 7.11, UK_TO_SE: 75.24 }, incrementFees: { CEP: 0.02, DE: 0.02, FR: 0.02, IT: 0.02, ES: 0.02, NL: 0.05, PL: 0.21, BE: 0.05, SE: 0.05, EU4_TO_UK: 0.01, UK_TO_EU4: 0.01, UK_TO_NLBE: 0.05, UK_TO_SE: 0.48 } },
    { key: "small-parcel-3", label: "Small Parcel 3", maxDims: [35, 25, 12], maxUnitWeightKg: 3.9, baseFees: { CEP: 8.15, DE: 8.41, FR: 8.15, IT: 8.15, ES: 8.15, NL: 8.5, PL: 36.35, BE: 8.5, SE: 87.49, EU4_TO_UK: 3.89, UK_TO_EU4: 6.73, UK_TO_NLBE: 7.97, UK_TO_SE: 84.34 }, incrementFees: { CEP: 0.04, DE: 0.04, FR: 0.04, IT: 0.04, ES: 0.04, NL: 0.05, PL: 0.21, BE: 0.05, SE: 0.05, EU4_TO_UK: 0.01, UK_TO_EU4: 0.03, UK_TO_NLBE: 0.05, UK_TO_SE: 0.48 } },
    { key: "medium-parcel-1", label: "Medium Parcel 1", maxDims: [40, 30, 6], maxUnitWeightKg: 11.9, baseFees: { CEP: 8.61, DE: 8.87, FR: 8.61, IT: 8.61, ES: 8.61, NL: 8.69, PL: 37.17, BE: 8.69, SE: 89.48, EU4_TO_UK: 4.1, UK_TO_EU4: 7.1, UK_TO_NLBE: 8.15, UK_TO_SE: 86.26 }, incrementFees: { CEP: 0.05, DE: 0.05, FR: 0.05, IT: 0.05, ES: 0.05, NL: 0.05, PL: 0.21, BE: 0.05, SE: 0.05, EU4_TO_UK: 0.01, UK_TO_EU4: 0.04, UK_TO_NLBE: 0.05, UK_TO_SE: 0.48 } },
    { key: "medium-parcel-2", label: "Medium Parcel 2", maxDims: [40, 30, 20], maxUnitWeightKg: 11.9, baseFees: { CEP: 10.42, DE: 10.68, FR: 10.42, IT: 10.42, ES: 10.42, NL: 10.53, PL: 45.02, BE: 10.53, SE: 108.36, EU4_TO_UK: 4.97, UK_TO_EU4: 8.6, UK_TO_NLBE: 9.87, UK_TO_SE: 104.47 }, incrementFees: { CEP: 0.09, DE: 0.09, FR: 0.09, IT: 0.09, ES: 0.09, NL: 0.05, PL: 0.21, BE: 0.05, SE: 0.05, EU4_TO_UK: 0.01, UK_TO_EU4: 0.07, UK_TO_NLBE: 0.05, UK_TO_SE: 0.48 } },
    { key: "large-parcel-1", label: "Large Parcel 1", maxDims: [45, 34, 10], maxUnitWeightKg: 11.9, baseFees: { CEP: 10.87, DE: 11.13, FR: 10.87, IT: 10.87, ES: 10.87, NL: 10.62, PL: 45.43, BE: 10.62, SE: 109.36, EU4_TO_UK: 5.18, UK_TO_EU4: 8.97, UK_TO_NLBE: 9.96, UK_TO_SE: 105.43 }, incrementFees: { CEP: 0.09, DE: 0.09, FR: 0.09, IT: 0.09, ES: 0.09, NL: 0.05, PL: 0.21, BE: 0.05, SE: 0.05, EU4_TO_UK: 0.01, UK_TO_EU4: 0.07, UK_TO_NLBE: 0.05, UK_TO_SE: 0.48 } },
    { key: "large-parcel-2", label: "Large Parcel 2", maxDims: [45, 34, 26], maxUnitWeightKg: 11.9, baseFees: { CEP: 11.78, DE: 12.04, FR: 11.78, IT: 11.78, ES: 11.78, NL: 13.52, PL: 57.82, BE: 13.52, SE: 139.18, EU4_TO_UK: 5.62, UK_TO_EU4: 9.72, UK_TO_NLBE: 12.68, UK_TO_SE: 134.18 }, incrementFees: { CEP: 0.09, DE: 0.09, FR: 0.09, IT: 0.09, ES: 0.09, NL: 0.07, PL: 0.29, BE: 0.07, SE: 0.07, EU4_TO_UK: 0.01, UK_TO_EU4: 0.07, UK_TO_NLBE: 0.06, UK_TO_SE: 0.67 } }
  ];

  const PAN_EU_OVERSIZE_SURCHARGE = {
    "small-oversize": { baseBandMaxKg: 0.76, baseFees: { DE: 1.64, FR: 1.4, IT: 0.63, ES: 0.77 }, incrementFees: { DE: 0.03, FR: 0.07, IT: 0.08, ES: 0.12 } },
    "standard-oversize-light": { baseBandMaxKg: 0.76, baseFees: { DE: 1.76, FR: 1.41, IT: 1.05, ES: 1.59 }, incrementFees: { DE: 0.06, FR: 0.14, IT: 0.19, ES: 0.12 } },
    "standard-oversize-heavy": { baseBandMaxKg: 15.76, baseFees: { DE: 2.53, FR: 3.02, IT: 3.57, ES: 2.96 }, incrementFees: { DE: 0.27, FR: 0.05, IT: 0.34, ES: 0.12 } },
    "standard-oversize-large": { baseBandMaxKg: 0.76, baseFees: { DE: 2.98, FR: 2.38, IT: 1.84, ES: 2.71 }, incrementFees: { DE: 0.27, FR: 0.25, IT: 0.44, ES: 0.25 } },
    "bulky-oversize": { baseBandMaxKg: 0.76, baseFees: { DE: 2.99, FR: 3.23, IT: 3.23, ES: 2.74 }, incrementFees: { DE: 0.69, FR: 0.53, IT: 0.61, ES: 0.61 } },
    "heavy-oversize": { baseBandMaxKg: 31.5, baseFees: { DE: 5.5, FR: 3.7, IT: 4.2, ES: 3.2 }, incrementFees: { DE: 0.7, FR: 0.6, IT: 0.5, ES: 0.45 } }
  };

  const LOW_INVENTORY_STANDARD = {
    "light-envelope": { lt14: 0.27, lt21: 0.18, lt28: 0.16 },
    "standard-envelope": { lt14: 0.41, lt21: 0.25, lt28: 0.18 },
    "large-envelope": { lt14: 0.46, lt21: 0.27, lt28: 0.18 },
    "extra-large-envelope": { lt14: 0.46, lt21: 0.27, lt28: 0.18 },
    "small-parcel": { lt14: 0.46, lt21: 0.27, lt28: 0.18 },
    "standard-parcel": { lt14: 0.67, lt21: 0.35, lt28: 0.21 }
  };

  const LOW_INVENTORY_SELECTED = {
    "small-parcel-1": { lt14: 0.46, lt21: 0.27, lt28: 0.18 },
    "small-parcel-2": { lt14: 0.46, lt21: 0.27, lt28: 0.18 },
    "small-parcel-3": { lt14: 0.46, lt21: 0.27, lt28: 0.18 },
    "medium-parcel-1": { lt14: 0.67, lt21: 0.35, lt28: 0.21 },
    "medium-parcel-2": { lt14: 0.67, lt21: 0.35, lt28: 0.21 },
    "large-parcel-1": { lt14: 0.67, lt21: 0.35, lt28: 0.21 },
    "large-parcel-2": { lt14: 0.67, lt21: 0.35, lt28: 0.21 }
  };

  const SIPP_LOW_PRICE = {
    "light-envelope": [
      { maxWeightKg: 0.02, fees: { UK: 0.01, DE: 0.01, FR: 0.01, IT: 0.01, ES: 0.01 } },
      { maxWeightKg: 0.04, fees: { UK: 0.01, DE: 0.01, FR: 0.01, IT: 0.01, ES: 0.01 } },
      { maxWeightKg: 0.06, fees: { UK: 0.01, DE: 0.01, FR: 0.01, IT: 0.01, ES: 0.01 } },
      { maxWeightKg: 0.08, fees: { UK: 0.01, DE: 0.01, FR: 0.01, IT: 0.01, ES: 0.01 } },
      { maxWeightKg: 0.1, fees: { UK: 0.01, DE: 0.01, FR: 0.01, IT: 0.01, ES: 0.01 } }
    ],
    "standard-envelope": [
      { maxWeightKg: 0.21, fees: { UK: 0.01, DE: 0.02, FR: 0.02, IT: 0.03, ES: 0.02 } },
      { maxWeightKg: 0.46, fees: { UK: 0.01, DE: 0.02, FR: 0.02, IT: 0.03, ES: 0.03 } }
    ],
    "large-envelope": [
      { maxWeightKg: 0.96, fees: { UK: 0.02, DE: 0.03, FR: 0.03, IT: 0.04, ES: 0.04 } }
    ],
    "extra-large-envelope": [
      { maxWeightKg: 0.96, fees: { UK: 0.04, DE: 0.05, FR: 0.05, IT: 0.06, ES: 0.06 } }
    ],
    "small-parcel": [
      { maxWeightKg: 0.15, fees: { UK: 0.06, DE: 0.07, FR: 0.07, IT: 0.08, ES: 0.08 } },
      { maxWeightKg: 0.4, fees: { UK: 0.06, DE: 0.07, FR: 0.08, IT: 0.08, ES: 0.08 } }
    ]
  };

  const SIPP_STANDARD = {
    "light-envelope": [
      { maxWeightKg: 0.02, fees: { UK: 0.01, DE: 0.01, FR: 0.01, IT: 0.01, ES: 0.01 } },
      { maxWeightKg: 0.04, fees: { UK: 0.01, DE: 0.01, FR: 0.01, IT: 0.01, ES: 0.01 } },
      { maxWeightKg: 0.06, fees: { UK: 0.01, DE: 0.01, FR: 0.01, IT: 0.01, ES: 0.01 } },
      { maxWeightKg: 0.08, fees: { UK: 0.01, DE: 0.01, FR: 0.01, IT: 0.01, ES: 0.01 } },
      { maxWeightKg: 0.1, fees: { UK: 0.01, DE: 0.01, FR: 0.01, IT: 0.01, ES: 0.01 } }
    ],
    "standard-envelope": [
      { maxWeightKg: 0.21, fees: { UK: 0.01, DE: 0.02, FR: 0.02, IT: 0.03, ES: 0.02 } },
      { maxWeightKg: 0.46, fees: { UK: 0.01, DE: 0.02, FR: 0.02, IT: 0.03, ES: 0.03 } }
    ],
    "large-envelope": [
      { maxWeightKg: 0.96, fees: { UK: 0.02, DE: 0.03, FR: 0.03, IT: 0.04, ES: 0.04 } }
    ],
    "extra-large-envelope": [
      { maxWeightKg: 0.96, fees: { UK: 0.04, DE: 0.05, FR: 0.05, IT: 0.06, ES: 0.06 } }
    ],
    "small-parcel": [
      { maxWeightKg: 0.15, fees: { UK: 0.06, DE: 0.07, FR: 0.07, IT: 0.08, ES: 0.08 } },
      { maxWeightKg: 0.4, fees: { UK: 0.06, DE: 0.07, FR: 0.08, IT: 0.08, ES: 0.08 } },
      { maxWeightKg: 0.9, fees: { UK: 0.07, DE: 0.08, FR: 0.08, IT: 0.09, ES: 0.09 } },
      { maxWeightKg: 1.4, fees: { UK: 0.07, DE: 0.08, FR: 0.08, IT: 0.09, ES: 0.1 } },
      { maxWeightKg: 1.9, fees: { UK: 0.08, DE: 0.09, FR: 0.09, IT: 0.1, ES: 0.1 } },
      { maxWeightKg: 3.9, fees: { UK: 0.09, DE: 0.1, FR: 0.1, IT: 0.12, ES: 0.11 } }
    ],
    "standard-parcel": [
      { maxWeightKg: 0.15, fees: { UK: 0.08, DE: 0.09, FR: 0.1, IT: 0.12, ES: 0.11 } },
      { maxWeightKg: 0.4, fees: { UK: 0.09, DE: 0.1, FR: 0.11, IT: 0.12, ES: 0.12 } },
      { maxWeightKg: 0.9, fees: { UK: 0.1, DE: 0.11, FR: 0.12, IT: 0.13, ES: 0.13 } },
      { maxWeightKg: 1.4, fees: { UK: 0.11, DE: 0.13, FR: 0.14, IT: 0.15, ES: 0.15 } },
      { maxWeightKg: 1.9, fees: { UK: 0.13, DE: 0.15, FR: 0.15, IT: 0.17, ES: 0.17 } },
      { maxWeightKg: 2.9, fees: { UK: 0.15, DE: 0.18, FR: 0.18, IT: 0.2, ES: 0.2 } },
      { maxWeightKg: 3.9, fees: { UK: 0.17, DE: 0.19, FR: 0.21, IT: 0.23, ES: 0.23 } },
      { maxWeightKg: 5.9, fees: { UK: 0.18, DE: 0.21, FR: 0.23, IT: 0.25, ES: 0.25 } },
      { maxWeightKg: 8.9, fees: { UK: 0.24, DE: 0.28, FR: 0.29, IT: 0.31, ES: 0.32 } },
      { maxWeightKg: 11.9, fees: { UK: 0.27, DE: 0.31, FR: 0.33, IT: 0.35, ES: 0.35 } }
    ]
  };

  const SIPP_SELECTED = {
    "small-parcel-1": { UK: 0.07, DE: 0.07, FR: 0.08, IT: 0.08, ES: 0.09 },
    "small-parcel-2": { UK: 0.08, DE: 0.07, FR: 0.08, IT: 0.08, ES: 0.09 },
    "small-parcel-3": { UK: 0.08, DE: 0.08, FR: 0.09, IT: 0.09, ES: 0.1 },
    "medium-parcel-1": { UK: 0.12, DE: 0.12, FR: 0.13, IT: 0.14, ES: 0.15 },
    "medium-parcel-2": { UK: 0.13, DE: 0.13, FR: 0.14, IT: 0.15, ES: 0.17 },
    "large-parcel-1": { UK: 0.14, DE: 0.14, FR: 0.15, IT: 0.16, ES: 0.18 },
    "large-parcel-2": { UK: 0.18, DE: 0.18, FR: 0.18, IT: 0.19, ES: 0.25 }
  };

  const OVERSIZE_PACKAGING_FEES = {
    "small-oversize": { baseBandMaxKg: 0.76, baseFees: { UK: 0.59, DE: 0.67, FR: 0.67, IT: 0.67, ES: 0.67 }, incrementFees: { UK: 0.01, DE: 0.01, FR: 0.01, IT: 0.01, ES: 0.01 } },
    "standard-oversize-light": { baseBandMaxKg: 0.76, baseFees: { UK: 0.8, DE: 0.92, FR: 0.92, IT: 0.92, ES: 0.92 }, incrementFees: { UK: 0.1, DE: 0.11, FR: 0.11, IT: 0.11, ES: 0.11 } },
    "standard-oversize-heavy": { baseBandMaxKg: 15.76, baseFees: { UK: 2.25, DE: 2.58, FR: 2.58, IT: 2.58, ES: 2.58 }, incrementFees: { UK: 0.42, DE: 0.49, FR: 0.49, IT: 0.49, ES: 0.49 } },
    "standard-oversize-large": { baseBandMaxKg: 0.76, baseFees: { UK: 0.87, DE: 1, FR: 1, IT: 1, ES: 1 }, incrementFees: { UK: 0.21, DE: 0.24, FR: 0.24, IT: 0.24, ES: 0.24 } },
    "bulky-oversize": { baseBandMaxKg: 0.76, baseFees: { UK: 1.76, DE: 2.01, FR: 2.01, IT: 2.01, ES: 2.01 }, incrementFees: { UK: 0.22, DE: 0.25, FR: 0.25, IT: 0.25, ES: 0.25 } }
  };

  const IE_LOW_PRICE = [
    { key: "small-envelope", label: "Small envelope", maxDims: [20, 15, 1], maxUnitWeightKg: 0.08, local: 0.46, efn: 1.61, remote: 1.46 },
    { key: "standard-envelope-60", label: "Standard envelope", maxDims: [33, 23, 2.5], maxUnitWeightKg: 0.06, local: 0.62, efn: 2, remote: 1.67 },
    { key: "standard-envelope-210", label: "Standard envelope", maxDims: [33, 23, 2.5], maxUnitWeightKg: 0.21, local: 0.77, efn: 2.33, remote: 1.88 },
    { key: "standard-envelope-460", label: "Standard envelope", maxDims: [33, 23, 2.5], maxUnitWeightKg: 0.46, local: 0.92, efn: 2.72, remote: 2.05 },
    { key: "large-envelope", label: "Large envelope", maxDims: [33, 23, 4], maxUnitWeightKg: 0.96, local: 1.18, efn: 3.59, remote: 2.67 },
    { key: "extra-large-envelope", label: "Extra-large envelope", maxDims: [33, 23, 6], maxUnitWeightKg: 0.96, local: 1.36, efn: 3.81, remote: 2.95 },
    { key: "small-parcel-150", label: "Small parcel", maxDims: [35, 25, 12], maxUnitWeightKg: 0.15, local: 1.36, efn: 3.81, remote: 2.97 },
    { key: "small-parcel-400", label: "Small parcel", maxDims: [35, 25, 12], maxUnitWeightKg: 0.4, local: 1.51, efn: 4.03, remote: 3 }
  ];

  const IE_STANDARD = [
    { key: "small-envelope", label: "Small envelope", maxDims: [20, 15, 1], maxUnitWeightKg: 0.08, shippingWeight: "unit", bands: [{ maxWeightKg: 0.08, local: 0.63, efn: 1.61, remote: 1.89 }] },
    { key: "standard-envelope", label: "Standard envelope", maxDims: [33, 23, 2.5], maxUnitWeightKg: 0.46, shippingWeight: "unit", bands: [
      { maxWeightKg: 0.06, local: 0.79, efn: 2, remote: 2.1 },
      { maxWeightKg: 0.21, local: 0.94, efn: 2.33, remote: 2.3 },
      { maxWeightKg: 0.46, local: 1.09, efn: 2.72, remote: 2.37 }
    ]},
    { key: "large-envelope", label: "Large envelope", maxDims: [33, 23, 4], maxUnitWeightKg: 0.96, shippingWeight: "unit", bands: [{ maxWeightKg: 0.96, local: 1.35, efn: 3.59, remote: 3.02 }] },
    { key: "extra-large-envelope", label: "Extra-large envelope", maxDims: [33, 23, 6], maxUnitWeightKg: 0.96, shippingWeight: "unit", bands: [{ maxWeightKg: 0.96, local: 1.53, efn: 3.81, remote: 3.28 }] },
    { key: "small-parcel", label: "Small parcel", maxDims: [35, 25, 12], maxUnitWeightKg: 3.9, maxDimWeightKg: 2.1, shippingWeight: "max", bands: [
      { maxWeightKg: 0.15, local: 1.53, efn: 3.81, remote: 3.24 },
      { maxWeightKg: 0.4, local: 1.68, efn: 4.03, remote: 3.35 },
      { maxWeightKg: 0.9, local: 2.02, efn: 4.88, remote: 3.39 },
      { maxWeightKg: 1.4, local: 2.33, efn: 5.21, remote: 3.4 },
      { maxWeightKg: 1.9, local: 2.54, efn: 5.55, remote: 3.63 },
      { maxWeightKg: 3.9, local: 3.26, efn: 7.05, remote: 5.76 }
    ]},
    { key: "standard-parcel", label: "Standard parcel", maxDims: [45, 34, 26], maxUnitWeightKg: 11.9, maxDimWeightKg: 7.96, shippingWeight: "max", bands: [
      { maxWeightKg: 0.15, local: 1.87, efn: 4.59, remote: 3.28 },
      { maxWeightKg: 0.4, local: 2.08, efn: 5.17, remote: 3.35 },
      { maxWeightKg: 0.9, local: 2.37, efn: 5.94, remote: 3.41 },
      { maxWeightKg: 1.4, local: 2.75, efn: 6.59, remote: 3.65 },
      { maxWeightKg: 1.9, local: 3.02, efn: 6.84, remote: 3.9 },
      { maxWeightKg: 2.9, local: 3.5, efn: 7.6, remote: 5.34 },
      { maxWeightKg: 3.9, local: 3.52, efn: 8.85, remote: 5.84 },
      { maxWeightKg: 5.9, local: 3.67, efn: 9.31, remote: 5.87 },
      { maxWeightKg: 8.9, local: 3.88, efn: 10.04, remote: 6.31 },
      { maxWeightKg: 11.9, local: 4.13, efn: 12.26, remote: 6.54 }
    ]},
    { key: "small-oversize", label: "Small oversize", maxDims: [61, 46, 46], maxUnitWeightKg: 1.76, maxDimWeightKg: 25.82, shippingWeight: "max", bands: [
      { maxWeightKg: 0.76, local: 3.5, efn: 7.31, remote: 3.83 },
      { maxWeightKg: 1.26, local: 3.73, efn: 7.55, remote: 4.73 },
      { maxWeightKg: 1.76, local: 4.25, efn: 7.61, remote: 4.94 }
    ], increment: { local: 0.01, efn: 0.01, remote: 0.01 }, incrementFromKg: 1.76 },
    { key: "standard-oversize", label: "Standard oversize", maxDims: [120, 60, 60], maxUnitWeightKg: 29.76, maxDimWeightKg: 86.4, shippingWeight: "max", bands: [
      { maxWeightKg: 0.76, local: 4.18, efn: 9.15, remote: 5.69 },
      { maxWeightKg: 1.76, local: 4.33, efn: 9.41, remote: 6.02 },
      { maxWeightKg: 2.76, local: 4.53, efn: 10.05, remote: 6.15 },
      { maxWeightKg: 3.76, local: 4.55, efn: 10.1, remote: 6.19 },
      { maxWeightKg: 4.76, local: 4.58, efn: 10.18, remote: 6.22 },
      { maxWeightKg: 9.76, local: 4.73, efn: 11.62, remote: 7.46 },
      { maxWeightKg: 14.76, local: 5.08, efn: 12.21, remote: 7.99 },
      { maxWeightKg: 19.76, local: 5.13, efn: 13.29, remote: 10.05 },
      { maxWeightKg: 24.76, local: 5.2, efn: 14.25, remote: 11.15 },
      { maxWeightKg: 29.76, local: 5.25, efn: 14.46, remote: 11.16 }
    ], increment: { local: 0.01, efn: 0.01, remote: 0.01 }, incrementFromKg: 29.76 },
    { key: "large-oversize", label: "Large oversize", maxUnitWeightKg: 31.5, shippingWeight: "max", bands: [
      { maxWeightKg: 4.76, local: 5.1, efn: 13.62, remote: 12.63 },
      { maxWeightKg: 9.76, local: 5.5, efn: 16.3, remote: 13.82 },
      { maxWeightKg: 14.76, local: 5.75, efn: 17.33, remote: 14.6 },
      { maxWeightKg: 19.76, local: 6.13, efn: 19.11, remote: 15.31 },
      { maxWeightKg: 24.76, local: 6.75, efn: 20.74, remote: 20.95 },
      { maxWeightKg: 31.5, local: 6.8, efn: 20.74, remote: 21.01 }
    ], increment: { local: 0.01, efn: 0.01, remote: 0.01 }, incrementFromKg: 31.5 }
  ];

  const IE_SELECTED = [
    { key: "small-parcel-1", label: "Small Parcel 1", maxDims: [35, 25, 7], maxUnitWeightKg: 3.9, local: 1.65, efn: 3.74, remote: 3.19, increments: { local: 0.03, efn: 0.02, remote: 0.02 } },
    { key: "small-parcel-2", label: "Small Parcel 2", maxDims: [35, 25, 9], maxUnitWeightKg: 3.9, local: 1.76, efn: 4.19, remote: 3.57, increments: { local: 0.03, efn: 0.02, remote: 0.02 } },
    { key: "small-parcel-3", label: "Small Parcel 3", maxDims: [35, 25, 12], maxUnitWeightKg: 3.9, local: 1.89, efn: 4.81, remote: 4.1, increments: { local: 0.03, efn: 0.02, remote: 0.02 } },
    { key: "medium-parcel-1", label: "Medium Parcel 1", maxDims: [40, 30, 6], maxUnitWeightKg: 11.9, local: 2.14, efn: 5.32, remote: 4.54, increments: { local: 0.04, efn: 0.02, remote: 0.02 } },
    { key: "medium-parcel-2", label: "Medium Parcel 2", maxDims: [40, 30, 20], maxUnitWeightKg: 11.9, local: 2.29, efn: 6.42, remote: 5.48, increments: { local: 0.04, efn: 0.02, remote: 0.02 } },
    { key: "large-parcel-1", label: "Large Parcel 1", maxDims: [45, 34, 10], maxUnitWeightKg: 11.9, local: 2.33, efn: 6.48, remote: 5.53, increments: { local: 0.04, efn: 0.02, remote: 0.02 } },
    { key: "large-parcel-2", label: "Large Parcel 2", maxDims: [45, 34, 26], maxUnitWeightKg: 11.9, local: 2.43, efn: 8.32, remote: 7.1, increments: { local: 0.04, efn: 0.04, remote: 0.03 } }
  ];

  return {
    COUNTRIES,
    LOW_PRICE_THRESHOLDS,
    HAZMAT_SURCHARGE,
    CEP_SURCHARGE,
    LOCAL_LOW_PRICE,
    LOCAL_STANDARD,
    SELECTED_LOCAL_PARCEL,
    EFN_STANDARD,
    SELECTED_EFN_PARCEL,
    PAN_EU_OVERSIZE_SURCHARGE,
    LOW_INVENTORY_STANDARD,
    LOW_INVENTORY_SELECTED,
    SIPP_LOW_PRICE,
    SIPP_STANDARD,
    SIPP_SELECTED,
    OVERSIZE_PACKAGING_FEES,
    IE_LOW_PRICE,
    IE_STANDARD,
    IE_SELECTED
  };
})();
