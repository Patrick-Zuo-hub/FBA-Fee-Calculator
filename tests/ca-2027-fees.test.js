const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const c={document:{addEventListener(){}},console};c.globalThis=c;c.FBA_SURCHARGE_RULES=require('../History/fba-surcharge-rules.js');
let src=fs.readFileSync(require.resolve('../History/fba-us-local-fee-calculator.js'),'utf8').replace(/\}\)\(\);\s*$/,'globalThis.r={classifyCa,baseFeeCa,sippAdjustmentCa,lowInventoryFee,fuelLogisticsSurchargeNa};})();');vm.runInNewContext(src,c);const r=c.r;
function calc(x={}){const i={market:'CA',category:'general',lengthCm:109.220,widthCm:81.280,heightCm:5.080,unitWeightKg:8.573,peakFulfillmentFees:false,fuelLogisticsSurcharge:true,sippCertified:false,...x};const t=r.classifyCa(i),b=r.baseFeeCa(i,t),fuel=r.fuelLogisticsSurchargeNa(i,b);return {i,t,b,fuel,total:Math.round((b.amount+fuel.amount)*100)/100};}
test('user product: 2027 CAD29.23 vs 2026 peak CAD52.79',()=>{const a=calc(),b=calc({peakFulfillmentFees:true});assert.equal(a.t.key,'large_bulky');assert.equal(a.t.feeShippingWeight,9.5);assert.equal(a.b.amount,28.24);assert.equal(a.total,29.23);assert.equal(b.t.key,'medium_oversize');assert.equal(b.total,52.79);});
test('2027 CA thresholds use unit weight and independent 245cm override',()=>{
 for(const [l,w,h,kg,key]of [[95,25,10,23,'small_bulky'],[95.01,25,10,23,'large_bulky'],[150,25,10,23,'large_bulky'],[150.01,25,10,23,'xl_0_30'],[100,25,10,23.01,'xl_0_30'],[100,25,10,30,'xl_0_30'],[100,25,10,30.01,'xl_30_68'],[100,25,10,68,'xl_30_68'],[100,25,10,68.01,'xl_68_plus'],[245,10,10,10,'xl_0_30'],[245.01,10,10,10,'xl_68_plus']])assert.equal(calc({lengthCm:l,widthCm:w,heightCm:h,unitWeightKg:kg}).t.key,key);
 assert.equal(calc({lengthCm:90,widthCm:60,heightCm:30,unitWeightKg:10}).t.key,'small_bulky');
});
test('published 2027 CA standard examples',()=>{
 assert.equal(calc({lengthCm:19.4,widthCm:13.8,heightCm:1.6,unitWeightKg:.081}).b.amount,4.53);
 assert.equal(calc({lengthCm:30,widthCm:30,heightCm:6,unitWeightKg:.9}).b.amount,8.71);
 assert.equal(calc({lengthCm:35,widthCm:25,heightCm:15,unitWeightKg:2}).b.amount,11.55);
});
test('new bulky formula and 30kg step use 500g increments',()=>{
 assert.equal(calc({lengthCm:80,widthCm:25,heightCm:25,unitWeightKg:1.5}).b.amount,24.78);
 assert.equal(calc({lengthCm:100,widthCm:25,heightCm:20,unitWeightKg:25}).b.amount,67.75);
 assert.equal(calc({lengthCm:100,widthCm:25,heightCm:20,unitWeightKg:31}).b.amount,120.03);
});
test('CA low inventory only covers standard tiers and uses its own exemptions',()=>{
 const a=calc({lengthCm:30,widthCm:30,heightCm:6,unitWeightKg:.9,longTermDos:12,shortTermDos:24});
 assert.equal(r.lowInventoryFee(a.i,a.t).amount,.56);
 assert.equal(r.lowInventoryFee({...a.i,shortTermDos:28},a.t).amount,0);
 assert.equal(r.lowInventoryFee({...a.i,awdExempt:true},a.t).amount,.56);
 assert.equal(r.lowInventoryFee({...a.i,slowMoverExempt:true},a.t).amount,0);
 assert.equal(r.lowInventoryFee(calc().i,calc().t).amount,0);
});
test('unconfirmed 2027 SIPP never silently reuses old oversize discount',()=>{
 const a=calc({sippCertified:true});assert.equal(r.sippAdjustmentCa(a.i,a.t).pending,true);
 const s=r.sippAdjustmentCa({...a.i,caSippDiscount:1.68},a.t);assert.equal(s.amount,1.68);assert.equal(s.applied,true);
});
