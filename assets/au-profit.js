(function(scope) {
  'use strict';
  // Rates are user assumptions; no live FX or tax-accounting treatment is implied.
  const defaults = { gst:10, referralRate:13, exchangeRate:4.7, productCostRmb:20, firstLegRmbPerKg:8, firstLegDivisor:6000, advertisingRate:0, otherCost:0, storageMonths:0 };
  function calculate(input, fee) {
    const values={};
    for (const key of Object.keys(defaults)) {
      const value=input[key];
      if (value === '' || value == null || !Number.isFinite(Number(value)) || Number(value)<0) throw new Error('请补全有效的利润参数。');
      values[key]=Number(value);
    }
    const price=Number(input.price);
    if (!Number.isFinite(price) || price<=0 || values.exchangeRate<=0 || values.firstLegDivisor<=0 || values.gst>100 || values.referralRate>100 || values.advertisingRate>100) throw new Error('售价、汇率及体积重除数须大于 0，百分比须介于 0–100。');
    if (!fee || !Number.isFinite(fee.fulfillment) || !fee.dims.every(Number.isFinite)) throw new Error('请先完成有效的配送费计算。');
    const netRevenue=price/(1+values.gst/100);
    const freightWeight=Math.max(fee.unitWeight, fee.dims.reduce((a,b)=>a*b,1)/values.firstLegDivisor);
    const procurement=values.productCostRmb/values.exchangeRate;
    const freight=freightWeight*values.firstLegRmbPerKg/values.exchangeRate;
    const commission=price*values.referralRate/100;
    const advertising=price*values.advertisingRate/100;
    const storage=fee.volume*fee.storageRate*values.storageMonths;
    const costs=procurement+freight+commission+advertising+storage+values.otherCost+fee.fulfillment;
    const profit=netRevenue-costs;
    return {netRevenue,freightWeight,procurement,freight,commission,advertising,storage,costs,profit,margin:profit/price*100,gst:price-netRevenue};
  }
  scope.AU_PROFIT={defaults,calculate};
  if(typeof module!=='undefined'&&module.exports) module.exports=scope.AU_PROFIT;
})(typeof globalThis!=='undefined'?globalThis:window);
