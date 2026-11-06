# 美国站2027费用更新核验

核验日期：2026-11-06。通过紫鸟 Waymerce 美国站读取官方帮助页，并在官方 Revenue Calculator 手动定义商品、选择 `FBA fulfillment fee rate (Jan 15, 2027)` 复核。未提交商品或更改店铺业务数据。

## 三个规则结论

1. Special oversize light 使用最长边 **≥108英寸，或长＋围长≥165英寸**。仅触发其中一个条件即可进入；按官方计算器边界行为处理帮助页的重叠和 `and` 表述。
2. Large standard 体积重使用实际尺寸；Bulky／Oversize 的中间边、最短边最低按2英寸计算。体积重除数139。Small standard、Special oversize heavy计费使用实重。
3. 燃油及物流附加费仅按基础配送费的3.5%计算，Flat／Overhang不进入燃油基数。

## 官方计算器观测样例

所有样例为 Furniture、USD100，最后一条为USD20；运输重量由实重与体积重按档位决定。表中总额仅为官方的Fulfillment cost，未包含佣金、仓储或入库费用。

| 英寸尺寸 | 实重lb | 2027基础费USD | 燃油USD | Fulfillment cost USD | 结论 |
|---|---:|---:|---:|---:|---|
|70×44×3|50|83.55|2.92|100.40|加Flat10.48及Overhang3.45，燃油不包含这两项|
|109×1×1|1|72.77|2.55|75.32|仅最长边超限即为Special light|
|108×1×1|1|72.77|2.55|75.32|108边界进入Special light|
|107.99×1×1|1|64.65|2.26|66.91|边界以下进入Long oversize|
|100×31×3|1|91.67|3.21|116.55|仅长＋围长168超限即为Special light；Flat21.67|
|99×30×3|1|91.07|3.19|115.93|长＋围长165边界进入Special light；Flat21.67|
|13×9×0.85|0.338|4.26|0.15|4.41|Large standard按实际体积重约0.715lb，未使用2英寸最低高度|

官方来源：
- [2027配送费完整表](https://sellercentral.amazon.com/help/hub/reference/GABBX6GZPA8MSZGW)
- [尺寸分档](https://sellercentral.amazon.com/help/hub/reference/GG5KW835AHDJCH8W)
- [体积重专页](https://sellercentral.amazon.com/help/hub/reference/G53Z9EKF8VVZVH29)
- [Oversize处理费](https://sellercentral.amazon.com/help/hub/reference/G7BWWPF848CW9DGH)
- [SIPP与包装费](https://sellercentral.amazon.com/help/hub/reference/GFGVB6C7ZF38285W)
- [低库存费2027](https://sellercentral.amazon.com/help/hub/reference/GFU8NTVGHP2JQLCR)
- [低价资格](https://sellercentral.amazon.com/help/hub/reference/GMUTB89XM7AATPR3)
- [官方计算器](https://sellercentral.amazon.com/revcal)

## 本期范围

仅修改美国本地FBA：默认2027非旺季，勾选切换2026旺季，随版本切换判档、基础费及附加费。2027低库存费作为2027-02-01起的独立选填情景估算，切换版本清空语义不同的DOS与新品豁免。旧版2026非旺季历史记录保留原总额，恢复基础输入后提示重新按2027估算，不静默改写旧结果。CA/MX计算逻辑与费率保留。仓储、退货、远程配送不加入。
