const test=require('node:test');
const assert=require('node:assert/strict');
const {calculate:fee}=require('../assets/au-calculator');
const {calculate,defaults}=require('../assets/au-profit');
const input={length:30,width:20,height:10,weight:.8,price:55,dimensionUnit:'cm',weightUnit:'kg',category:'home',season:'regular',quantity:100,age:366};
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
test('AU profit reconciles taxes and costs with independent first-leg dimensional weight',()=>{
 const f=fee(input);
 const p=calculate({...defaults,price:55,productCostRmb:47,exchangeRate:4.7,firstLegRmbPerKg:9.4,referralRate:13,advertisingRate:5,otherCost:2,storageMonths:2},f);
 close(f.shippingWeight,1.5);close(p.freightWeight,1);close(p.freight,2);close(p.procurement,10);close(p.netRevenue,50);close(p.commission,7.15);close(p.advertising,2.75);close(p.storage,.006*37*2);
 close(p.profit,50-f.fulfillment-10-2-7.15-2.75-2-p.storage);close(p.margin,p.profit/55*100);
 close(p.gst,5);
});
test('AU profit updates from selling price and FBA fee; quantity and aged fees do not multiply per-unit costs',()=>{
 const p=calculate({...defaults,price:55},fee(input));
 const other=calculate({...defaults,price:55},fee({...input,quantity:1,age:0}));
 close(p.profit,other.profit);
 const changed=calculate({...defaults,price:70},fee({...input,price:70}));
 assert.ok(changed.profit>p.profit);
 const loss=calculate({...defaults,price:1,productCostRmb:1000},fee(input));assert.ok(loss.profit<0);assert.ok(loss.margin<0);
});
test('AU profit rejects incomplete, negative, nonfinite and out-of-range assumptions',()=>{
 for(const change of [{exchangeRate:0},{productCostRmb:-1},{gst:101},{referralRate:101},{advertisingRate:101},{price:0},{firstLegDivisor:0},{otherCost:''},{storageMonths:Infinity}])assert.throws(()=>calculate({...defaults,price:55,...change},fee(input)));
 const zero=calculate({...defaults,gst:0,price:55},fee(input));close(zero.netRevenue,55);
});
