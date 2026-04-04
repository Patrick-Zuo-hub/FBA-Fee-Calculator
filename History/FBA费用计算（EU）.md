# FBA费用计算（EU）

已完成一个独立网页版 Amazon 欧洲 + 英国站点 FBA 费用计算器。

## 文件位置

- 页面主文件：[fba-eu-uk-fee-calculator.html](/Users/patrick/Documents/New%20project/fba-eu-uk-fee-calculator.html)
- 费率数据文件：[fba-fee-data.js](/Users/patrick/Documents/New%20project/fba-fee-data.js)

## 当前实现内容

页面可根据以下输入自动判断并计算：

- 产品包装尺寸：长、宽、高
- 产品包装重量
- 库存所在国家
- 目的地国家 / 销售站点

并输出以下结果：

- 产品属于哪个 `size tier`
- 基础 FBA 运费
- 计费重量使用的是 `unit weight` 还是 `dimensional weight`
- 路径判断：`Local / Pan-EU / EFN / UK-EU Remote / Ireland promotional rate`
- 可能叠加或扣减的费用 / 调整项

## 已支持的费用判断

- `Local / Pan-EU / EFN / UK-EU Remote / Ireland promotional rate`
- `Low-Price FBA`
- `Pan-EU oversize surcharge`
- `Pan-EU Low-Inventory Cost Coverage Fee`
- `CEP 未参加附加费`
- `Hazmat / lithium surcharge`
- `SIPP discount`
- `Oversize packaging fee`

## 页面特性

- 不影响现有首页工具
- 是一个独立静态页面
- 可直接通过静态服务访问 `/fba-eu-uk-fee-calculator.html`
- 已做本地校验

## 已验证场景

- 普通 EFN
- Pan-EU oversize
- Low-Price
- 本地 low-inventory fee
- UK -> IE

## 当前边界说明

以下情况页面会提示人工复核：

- PDF 本身没有完整报价的路径
- 部分 `Special oversize`
- `IE -> UK remote` 等未在当前费率卡中给出明确价格的组合

