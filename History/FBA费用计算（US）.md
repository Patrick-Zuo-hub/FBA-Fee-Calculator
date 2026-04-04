# FBA费用计算（US）

这份原本是美国站说明，现已在同一文件内更新为北美区 `NA` 版本说明。

## 文件位置

- 页面主文件：[fba-us-local-fee-calculator.html](/Users/patrick/Documents/New%20project/fba-us-local-fee-calculator.html)
- 计算逻辑文件：[fba-us-local-fee-calculator.js](/Users/patrick/Documents/New%20project/fba-us-local-fee-calculator.js)

## 当前状态

- 原美国本地 FBA 计算页已升级为北美区 `NA`
- 统一支持 `US / CA / MX`
- 与欧洲版页面完全独立
- 文件名仍沿用原来的 `US` 命名，但页面内容已经是北美版

## 规则范围

### US

- 采用你提供的 `2026-01-15` 之后规则
- 继续支持原来的美国本地 FBA 费用计算

### CA

- 采用你提供的加拿大站 `2026` 非旺季 fulfilment fee 与 SIPP 规则

### MX

- 采用你提供的 Amazon.com.mx 费率卡与 SIPP 文件
- 售价按 `含 VAT` 金额参与计算

## 当前实现内容

页面可根据以下输入自动判断并计算：

- 站点：`US` / `CA` / `MX`
- 费率类别 / 产品类型
- 产品包装尺寸：长、宽、高
- 产品包装重量
- 商品售价
- 是否参加 `SIPP`
- `30 天` 与 `90 天` historical days of supply
- US 的 low-inventory fee 相关豁免条件

并输出以下结果：

- 产品属于哪个 `size tier`
- 计费使用的是 `unit weight` 还是 `dimensional weight`
- `shipping weight`
- 基础 FBA fulfilment fee
- 可能叠加或扣减的费用 / 调整项

## 已支持的站点逻辑

### US

- `Small standard-size`
- `Large standard-size`
- `Small Bulky`
- `Large Bulky`
- `Extra-Large`
- `Overmax`
- `Low Price FBA` 对应的 `< $10` 价格带基础费
- `Low-inventory-level fee`
- `Overmax handling fee`
- `SIPP discount`
- `Bulky packaging fee`

### CA

- `Envelope`
- `Standard`
- `Small oversize`
- `Medium oversize`
- `Large oversize`
- `Special oversize`
- 加拿大站 `SIPP discount`

### MX

- `Envelope`
- `Standard`
- `Oversize`
- 3 套费率组
- 4 档含 VAT 售价带
- 墨西哥站 `SIPP discount`

## SIPP 逻辑

### US

- 标准件商品如果参加 `SIPP`，会按对应重量段减去折扣
- `Small Bulky` 与 `Large Bulky` 商品在 `2026-01-15` 之后不再享受单独的 SIPP 折扣
- `Small Bulky` 与 `Large Bulky` 如果未参加 `SIPP`，会按 `dimensional weight` 追加 `packaging fee`
- 你提供的 US SIPP 表只覆盖 `non-apparel` 与 `apparel`
- `dangerous goods` 当前不会额外减去 SIPP 折扣，而是保留提示说明

### CA

- `Envelope`、`Standard`、`Small oversize` 会按当前 PDF 的 SIPP 表减费
- `Medium / Large / Special oversize` 当前不额外减去 SIPP 折扣

### MX

- `Envelope`、`Standard`、`Oversize` 都支持固定 SIPP 折扣
- 当前按你提供文件中的 `22.6 kg 及以下` 条件处理

## 新增页面展示能力

- 切换 `US / CA / MX` 时，页面会同步切换站点规则
- 会同步切换：
  - 币种
  - 价格说明
  - 费率类别选项
  - US 专属 low-inventory 输入区
  - 当前站点的 `size tier` 展示卡

## 当前站点 Size Tier 展示

页面里已经新增一个跟随站点切换的 `Size Tier` 参考区域。

- 切换到 `US` 时，会显示美国站的 `Small standard / Large standard / Bulky / Extra-Large / Overmax`
- 切换到 `CA` 时，会显示加拿大站的 `Envelope / Standard / Small/Medium/Large/Special oversize`
- 切换到 `MX` 时，会显示墨西哥站的 `Envelope / Standard / Oversize` 与对应计费说明

## 页面特性

- 是一个独立静态页面
- 不依赖欧洲版数据文件
- 不影响欧洲计算页
- 结果页会展示总额、size tier、shipping weight 与费用拆解
- 对不适用的费项会明确提示而不是硬算

## 已验证场景

- US 标准件普通货 + `SIPP discount`
- US `Small Bulky` 未参加 SIPP 时追加 `packaging fee`
- US `dangerous goods` 勾选 SIPP 但不减费
- US `Overmax`
- US `Low-inventory-level fee`
- CA `Standard` + `SIPP discount`
- MX `Standard` + `SIPP discount`
- MX `Oversize`
- 站点切换时 `size tier` 展示内容同步变化

## 当前边界说明

### US

- 只实现你提供 PDF 中覆盖的美国本地规则
- `storage`、`aged inventory`、`returns processing fee`、`referral fee` 未计入总额

### CA

- 当前未计入 `GST / HST`
- `Special Handling surcharge` 当前材料里没有独立费率，因此未并入总额

### MX

- 若遇到 PDF 中标记为 `N/A` 的组合，会提示人工复核
- 若商品尺寸超过当前费率卡明确给出的 Oversize 范围，也建议人工复核
