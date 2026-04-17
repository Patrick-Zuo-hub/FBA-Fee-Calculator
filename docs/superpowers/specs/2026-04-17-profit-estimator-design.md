# Profit Estimator Design

## Goal

Add a lightweight profit estimator to each calculator page so users can quickly estimate gross margin immediately after running an FBA/WFS fee calculation, while still allowing the estimator to be used independently from the fee calculator.

## Placement

The estimator will be inserted inside each calculator page between the existing summary cards section and the detailed result sections.

That means:
- below the `Total / Size Tier / Shipping Weight` summary cards
- above the `核心结果` and `费用拆解` sections

The estimator should feel like part of the result workspace, not a separate tool page.

## Scope

Pages in scope:
- `/Users/patrick/Documents/FBA Fee Calculate/History/fba-us-local-fee-calculator.html`
- `/Users/patrick/Documents/FBA Fee Calculate/History/fba-eu-uk-fee-calculator.html`
- `/Users/patrick/Documents/FBA Fee Calculate/History/walmart-wfs-fee-calculator.html`

Behavior in scope:
- shared profit-estimation UI block on all three calculator pages
- one shared calculator script for default values, synchronization, and margin math
- manual use without requiring a completed FBA/WFS calculation
- explicit synchronization from the fee calculator via button

Out of scope for this version:
- changelog entry updates
- persistence or saved presets
- detailed profit breakdown display
- exports
- multi-product comparison
- storage of historical profit calculations

## UX Model

The estimator supports two usage modes:

1. Linked mode
- user completes or partially completes the fee calculator
- user clicks `同步自 FBA`
- estimator pulls whatever fee/dimension/weight information is available
- user clicks `计算毛利`

2. Standalone mode
- user ignores the upper fee-calculation result
- user directly types `FBA费用` and `头程计费重`
- user clicks `计算毛利`

The two modes must not interfere with each other.

`计算毛利` must never trigger implicit synchronization.

Only `同步自 FBA` is allowed to refresh estimator values from the calculator above.

## Layout

Desktop layout:
- one dedicated `简易利润测算` panel
- left side: inputs
- right side: one large gross-margin result card
- bottom area or right-side footer: the two buttons

Mobile layout:
- stacked layout
- inputs first
- buttons next
- result card last

The visual language should match the existing Apple-inspired glass-card direction already used in the project.

## Fields

### User-editable fields

- `产品目标售价（含税）`
  - unit: local marketplace currency
- `VAT (%)`
  - percentage-style input
  - `20` means `20%`
- `销售佣金比例 (%)`
  - percentage-style input
  - `15` means `15%`
- `FBA费用`
  - unit: local marketplace currency
  - editable even after sync
- `头程计费重 (kg)`
  - editable even after sync
- `头程运费单价 (RMB / kg)`
- `产品成本 (RMB)`
- `汇率`
  - meaning: `1 unit local currency = ? RMB`

### Computed but not separately displayed

- `头程运费 (RMB)`
- `未税售价`

### Final displayed result

- `毛利率`
  - shown as a percentage
  - fixed to two decimals, for example `23.47%`

## Default Values

### VAT defaults

- `US`: `0`
- `CA`: `0`
- `MX`: `0`
- `Walmart`: `0`
- `EU & UK`: `20`

### Referral rate default

- all pages default to `15`

### First-leg price default

- all pages default to `8`

### Exchange-rate defaults

- `US`: `7`
- `CA`: `5`
- `MX`: `0.4`
- `GBP`: `9`
- `EUR`: `7.8`
- `Walmart`: same default as US, `7`

## Currency Model

All profitability math is normalized to the local marketplace currency.

RMB-denominated fields are converted to local currency before being combined with selling price and FBA fee.

Conversions:
- `头程运费(当地币种) = 头程运费(RMB) / 汇率`
- `产品成本(当地币种) = 产品成本(RMB) / 汇率`

## Gross Margin Formula

Inputs:
- `grossSellingPrice = 含税售价`
- `vatRate = VAT / 100`
- `referralRate = 销售佣金比例 / 100`

Intermediate values:
- `netSellingPrice = grossSellingPrice / (1 + vatRate)`
- `firstLegCostRmb = chargeableWeightKg * firstLegPricePerKgRmb`
- `firstLegCostLocal = firstLegCostRmb / exchangeRate`
- `productCostLocal = productCostRmb / exchangeRate`

Final formula:

`grossMarginRate = (netSellingPrice - fbaFee - firstLegCostLocal - productCostLocal) / grossSellingPrice - referralRate`

The result is rendered as a percent with two decimal places.

## Synchronization Rules

The estimator includes two buttons:

- `同步自 FBA`
- `计算毛利`

### `同步自 FBA`

This button may update:
- local market / currency context
- `FBA费用`
- dimensions
- weight
- derived `头程计费重`

It must not overwrite:
- target selling price
- VAT
- referral rate
- first-leg price per kg
- product cost
- exchange rate

Synchronization policy:
- if a valid fee result exists, sync `FBA费用`
- if no valid fee result exists, keep the current `FBA费用` value unchanged
- if dimensions and weight are available, calculate and sync `头程计费重`
- if dimensions or weight are incomplete, keep the current `头程计费重` unchanged

This is intentionally partial sync:
- sync what is available
- preserve user-entered estimator values where source data is missing

### `计算毛利`

This button:
- reads only the current estimator fields
- performs no auto-sync
- updates only the displayed `毛利率`

## Chargeable Weight Rule

The synchronized first-leg chargeable weight is:

`max(volumetricWeightKg, actualWeightKg)`

Where:
- `volumetricWeightKg = lengthCm * widthCm * heightCm / 6000`
- `actualWeightKg = product weight converted to kg`

For linked mode:
- dimensions and weight are pulled from the current page inputs
- unit conversion must respect each page's current dimension and weight units

For standalone mode:
- user can manually override `头程计费重`

## Validation

The estimator should use lightweight inline validation, not modal errors.

### Required to calculate margin

- target selling price > 0
- FBA fee is present
- chargeable weight > 0
- first-leg price per kg >= 0
- product cost >= 0
- exchange rate > 0
- VAT >= 0
- referral rate >= 0

### Invalid state behavior

If required inputs are missing or invalid:
- do not show `0%`
- show a waiting / incomplete state instead
- render a short message such as `补全字段后计算`

## Result Presentation

Only one output metric is shown:
- `毛利率`

No separate display for:
- net selling price
- first-leg shipping cost
- converted local costs

The result card should still communicate that the estimate is based on:
- VAT-adjusted selling price
- FBA fee
- first-leg freight
- product cost
- referral rate

## Labeling

Use simple labels to reduce operator confusion:

- `VAT (%)`
- `销售佣金比例 (%)`
- `FBA费用`
- `头程计费重 (kg)`
- `头程运费单价 (RMB / kg)`
- `产品成本 (RMB)`
- `汇率（1 当地币种 = ? RMB）`

Optional helper copy near the module:

`可独立使用，也可通过“同步自 FBA”带入当前页面的费用、尺寸和重量。`

## Technical Approach

Use one shared browser-side script for the estimator logic.

Recommended new shared file:
- `/Users/patrick/Documents/FBA Fee Calculate/History/profit-estimator.js`

Responsibilities of the shared script:
- default-value selection by market/currency
- synchronization from the active calculator state
- unit conversion for synced dimensions and weight
- chargeable-weight calculation
- gross-margin calculation
- rendering result state

Each calculator page will:
- include the shared estimator script
- provide the estimator container markup
- expose enough local result/input context for sync

The profit-estimator logic must not re-implement fee-calculation logic.
It only consumes:
- current inputs
- current computed fee result when available

## Integration Constraints

- do not change the existing fee changelog data in `/Users/patrick/Documents/FBA Fee Calculate/data/versions.json`
- do not change fee formulas outside the already approved fee-calculation tasks
- do not make the estimator dependent on a completed fee result
- do not auto-sync on submit, market switch, or result render

## Testing Strategy

Add tests that cover:

1. default values by market
- US / CA / MX / EU / UK / Walmart defaults

2. partial synchronization
- dimensions and weight sync when fee result is absent
- fee stays unchanged if no valid fee result exists

3. standalone operation
- manual `FBA费用` and manual `头程计费重` can produce a margin result without sync

4. formula correctness
- VAT percentage input uses `20 => 20%`
- RMB costs convert through exchange rate
- result displays with two decimal places

5. non-destructive behavior
- `计算毛利` does not overwrite fields
- `同步自 FBA` does not overwrite operating assumptions
