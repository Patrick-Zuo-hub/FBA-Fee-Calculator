/* Amazon AU Seller Central 201112670, checked 2026-10-28.
   Each rate row: shipping kg upper bound, <13 Home/Pet, <13 other,
   13–<20 Home/Pet/Grocery/Sports, regular. Amounts AUD excluding GST. */
(function () {
  'use strict';
  const tiers = [
    { name: 'Small envelope', dims: [20,15,1], max: .075, envelope: true, rows: [[.075,3.20,3.64,4.55,4.55]] },
    { name: 'Standard envelope', dims: [33,23,2.5], max: .475, envelope: true, rows: [[.075,3.30,3.67,4.58,4.58],[.225,3.44,4.35,4.60,5.26],[.475,3.72,4.70,5.06,5.61]] },
    { name: 'Large envelope', dims: [33,23,5], max: .975, envelope: true, rows: [[.225,3.72,5.87,5.06,6.78],[.475,3.98,6.11,5.06,7.02],[.975,3.98,6.33,5.06,7.24]] },
    { name: 'Parcel', dims: [45,34,20], max: 12, rows: [[.25,3.98,6.14,5.48,7.05],[.5,4.18,6.14,5.48,7.05],[1,4.36,6.33,5.48,7.24],[1.5,6.19,7.97,6.19,8.88],[2,6.64,8.90,6.64,9.81],[3,8.95,8.95,9.86,9.86],[4,9.27,9.27,10.18,10.18],[5,9.28,9.28,10.19,10.19],[6,10.19,10.19,11.10,11.10],[7,10.35,10.35,11.26,11.26],[8,10.35,10.35,11.26,11.26],[9,10.36,10.36,11.27,11.27],[10,10.36,10.36,11.27,11.27],[11,12.89,12.89,13.80,13.80],[12,13.02,13.02,13.93,13.93]] },
    { name: 'Small oversize', dims: [61,46,46], max: 2, rows: [[1,5.33,9.03,7.48,9.94],[1.25,6.27,9.50,8.41,10.41],[1.5,9.74,9.74,10.65,10.65],[1.75,9.75,9.75,10.66,10.66],[2,9.75,9.75,10.66,10.66]], extra: [2,10.52,10.52,11.43,11.43,.01] },
    { name: 'Standard oversize', dims: [105,60,60], max: 22, rows: [[1,11.39,11.39,12.30,12.30],[2,12.04,12.04,12.95,12.95],[3,12.13,12.13,13.04,13.04],[4,12.27,12.27,13.18,13.18],[5,12.50,12.50,13.41,13.41],[6,13.40,13.40,14.31,14.31],[7,13.55,13.55,14.46,14.46],[8,13.57,13.57,14.48,14.48],[9,13.61,13.61,14.52,14.52],[10,13.61,13.61,14.52,14.52],[15,14.95,14.95,15.86,15.86],[20,15.51,15.51,16.42,16.42],[22,15.51,15.51,16.42,16.42]], extra: [22,18.48,18.48,19.39,19.39,.01] },
    { name: 'Large oversize', dims: [Infinity,Infinity,Infinity], max: 35, rows: [[5,16.89,16.89,17.80,17.80],[10,18.44,18.44,19.35,19.35],[15,20.24,20.24,21.15,21.15],[20,20.57,20.57,21.48,21.48],[25,21.61,21.61,22.52,22.52],[30,25.97,25.97,26.88,26.88],[35,26,26,26.91,26.91]], extra: [35,37.68,37.68,38.59,38.59,.10] },
    { name: 'Extra large', dims: [Infinity,Infinity,Infinity], max: 250, rows: [[35,89.09,89.09,90,90]], extra: [35,89.09,89.09,90,90,.10] }
  ];
  const roundGram = kg => Math.ceil(kg * 1000 - 1e-9) / 1000;
  function calculate(input) {
    const required = ['length','width','height','weight','price','quantity','age'];
    if (required.some(k => input[k] === '' || input[k] == null || !Number.isFinite(Number(input[k])))) throw new Error('请填写完整、有效的数值。');
    const n = Object.fromEntries(required.map(k => [k, Number(input[k])]));
    if (['length','width','height','weight'].some(k => n[k] <= 0) || n.price < 0 || n.quantity < 0 || n.age < 0 || !Number.isInteger(n.quantity) || !Number.isInteger(n.age)) throw new Error('尺寸和重量必须大于 0；售价不得为负；库存与库龄须为非负整数。');
    if (!['cm','in'].includes(input.dimensionUnit) || !['kg','g','lb'].includes(input.weightUnit) || !['home','pet','grocery','sports','other'].includes(input.category) || !['regular','peak'].includes(input.season)) throw new Error('请选择有效的单位、类目和月份。');
    const dims = [n.length,n.width,n.height].map(x => x * (input.dimensionUnit === 'in' ? 2.54 : 1)).sort((a,b) => b-a);
    const unitWeight = n.weight * ({kg:1,g:.001,lb:.45359237}[input.weightUnit]);
    const dimensionalWeight = dims.reduce((a,b) => a*b,1) / 4000;
    if (![unitWeight,dimensionalWeight].every(Number.isFinite) || unitWeight >= 250) throw new Error('超出 AU 费表支持范围（实际重量须小于 250 kg）。');
    const tier = tiers.find(t => roundGram(unitWeight) <= t.max && dims.every((d,i) => d <= t.dims[i] + 1e-9) && (t.name !== 'Parcel' || roundGram(Math.max(unitWeight, dimensionalWeight)) <= 12));
    const shippingWeight = roundGram(tier.envelope ? unitWeight : Math.max(unitWeight, dimensionalWeight));
    const column = n.price < 13 ? (['home','pet'].includes(input.category) ? 1 : 2) : n.price < 20 && ['home','pet','grocery','sports'].includes(input.category) ? 3 : 4;
    const row = tier.rows.find(r => shippingWeight <= r[0]);
    const fulfillment = row ? row[column] : tier.extra[column] + Math.ceil(shippingWeight-tier.extra[0]-1e-9)*tier.extra[5];
    const volume = dimensionalWeight * 4000 / 1e6;
    const oversize = !tier.envelope && tier.name !== 'Parcel';
    const storageRate = input.season === 'peak' ? (oversize ? 48 : 51.8) : (oversize ? 34.2 : 37);
    const agedRate = n.age >= 366 ? 370 : n.age >= 331 ? 185 : n.age >= 301 ? 175 : n.age >= 271 ? 155 : 0;
    const aged = n.quantity * (n.age >= 366 ? Math.max(volume*agedRate,.12) : volume*agedRate);
    return { tier:tier.name, dims, unitWeight, dimensionalWeight, shippingWeight, fulfillment:Math.round(fulfillment*100)/100, volume, storageRate, storage:volume*storageRate*n.quantity, aged, column,
      restricted:unitWeight > 23 || dims.some((d,i) => d > [116,116,102][i]) };
  }
  if (typeof window !== 'undefined') window.AU_FEES = { calculate, tiers };
  if (typeof module !== 'undefined' && module.exports) module.exports = { calculate, tiers };
  if (typeof document === 'undefined') return;
  const form = document.getElementById('au-form');
  if (!form) return;
  const output = document.getElementById('au-result');
  const money = value => 'A$' + value.toFixed(2);
  function render() {
    output.replaceChildren();
    try {
      const result = calculate(Object.fromEntries(new FormData(form)));
      const entries = [
        ['单件配送费（未含 GST）',money(result.fulfillment)],
        ['尺寸分档',result.tier],
        ['计费重量',result.shippingWeight.toFixed(3)+' kg'],
        ['实际重量 / 体积重',result.unitWeight.toFixed(3)+' / '+result.dimensionalWeight.toFixed(3)+' kg'],
        ['售价与类目档',['','< A$13 · Home / Pet','< A$13 · 其他类目','A$13–<20 · Home / Pet / Grocery / Sports','常规费率'][result.column]],
        ['月仓储费（所填日均库存）',money(result.storage)+' · A$'+result.storageRate.toFixed(2)+'/m³/月'],
        ['超龄库存附加费（单次评估估算）',money(result.aged)],
        ['单件包装体积',result.volume.toFixed(6)+' m³']
      ];
      for (const [label,value] of entries) {
        const card = document.createElement('div'); card.className='au-result-item';
        const title=document.createElement('span'); title.className='muted'; title.textContent=label;
        const detail=document.createElement('strong'); detail.textContent=value; card.append(title,detail); output.append(card);
      }
      if (result.restricted) { const warning=document.createElement('p'); warning.className='site-notice'; warning.textContent='超出常规 FBA 入仓限制：需亚马逊特殊批准或受邀计划。以上配送费仅供参考，请先确认商品可入仓。'; output.prepend(warning); }
    } catch (error) { const p=document.createElement('p'); p.setAttribute('role','alert'); p.textContent=error.message; output.append(p); }
  }
  form.addEventListener('submit', event => { event.preventDefault(); if (form.reportValidity()) render(); });
  form.addEventListener('input', () => { if (form.checkValidity()) render(); else output.replaceChildren(); });
  render();
})();
