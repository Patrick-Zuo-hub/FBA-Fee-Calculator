const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = { document: { addEventListener() {} }, console };
context.globalThis = context;
context.FBA_SURCHARGE_RULES = require('../History/fba-surcharge-rules.js');
let source = fs.readFileSync(require.resolve('../History/fba-us-local-fee-calculator.js'), 'utf8');
source = source.replace(/\}\)\(\);\s*$/, 'globalThis.rules = { classifyUs, baseFeeUs, sippAdjustmentUs, lowInventoryFee, oversizeHandlingFee: typeof oversizeHandlingFee === "function" ? oversizeHandlingFee : null, fuelLogisticsSurchargeNa };})();');
vm.runInNewContext(source, context);
const r = context.rules;
function input(overrides = {}) { return {market:'US',category:'non_apparel',lengthIn:13.8,widthIn:9,heightIn:0.7,unitWeightLb:0.18,price:8.99,peakFulfillmentFees:false,fuelLogisticsSurcharge:true,sippCertified:true,...overrides}; }
function calc(overrides) {const i=input(overrides); const t=r.classifyUs(i);return {i,t,b:r.baseFeeUs(i,t),s:r.sippAdjustmentUs(i,t)};}
test('default US uses 2027 rates; peak uses 2026 table across all categories',()=>{
  for(const [category,normal,peak] of [['non_apparel',2.72,2.68],['apparel',2.85,2.87],['dangerous_goods',3.62,3.80]]) {
    assert.equal(calc({category}).b.amount,normal);
    assert.equal(calc({category,peakFulfillmentFees:true}).b.amount,peak);
  }
});
test('2027 bulky boundaries and complete season switch',()=>{
  for(const [lengthIn,widthIn,heightIn,key] of [[28,24,2,'small_bulky'],[28.01,24,2,'medium_bulky'],[37.01,20,2,'large_bulky'],[52.01,10,2,'extra_large_bulky'],[59.01,10,2,'small_oversize']]) assert.equal(calc({lengthIn,widthIn,heightIn,unitWeightLb:1}).t.key,key);
  assert.equal(calc({lengthIn:30,widthIn:10,heightIn:2,unitWeightLb:10}).t.key,'medium_bulky');
  assert.equal(calc({lengthIn:30,widthIn:10,heightIn:2,unitWeightLb:10,peakFulfillmentFees:true}).t.key,'small_bulky');
});
test('official revcal probes settle special oversize OR and inclusive boundaries',()=>{
  for(const [lengthIn,widthIn,heightIn,key,amount] of [[109,1,1,'special_oversize_light',72.77],[108,1,1,'special_oversize_light',72.77],[107.99,1,1,'long_oversize',64.65],[99,30,3,'special_oversize_light',91.07],[100,31,3,'special_oversize_light',91.67]]) {
    const c=calc({lengthIn,widthIn,heightIn,unitWeightLb:1,price:100});assert.equal(c.t.key,key);assert.equal(Math.round(c.b.amount*100)/100,amount);
  }
});
test('large standard uses actual dimensions while bulky uses 2-inch minimum',()=>{
  const c=calc({lengthIn:13,widthIn:9,heightIn:0.85,unitWeightLb:0.338,price:20,largeStandardDimMinimum:true});
  assert.equal(c.t.key,'large_standard');assert.equal(c.b.amount,4.26);assert.ok(Math.abs(c.t.dimWeight-13*9*.85/139)<1e-9);
  const bulky=calc({lengthIn:40,widthIn:25,heightIn:1,unitWeightLb:4.5});assert.ok(Math.abs(bulky.t.dimWeight-40*25*2/139)<1e-9);
});
test('flat and overhang stack, and fuel only applies to base fee',()=>{
  const c=calc({lengthIn:70,widthIn:44,heightIn:3,unitWeightLb:50,price:100});
  const h=r.oversizeHandlingFee(c.i,c.t);assert.equal(c.b.amount,83.55);assert.equal(h.flat,10.48);assert.equal(h.overhang,3.45);assert.equal(r.fuelLogisticsSurchargeNa(c.i,c.b).amount,2.92);
  assert.equal(Math.round((c.b.amount+h.amount+2.92)*100)/100,100.40);
  assert.equal(r.oversizeHandlingFee({...c.i,peakFulfillmentFees:true},r.classifyUs({...c.i,peakFulfillmentFees:true})).amount,0);
  assert.equal(r.oversizeHandlingFee(input(),calc({lengthIn:40,widthIn:25,heightIn:1}).t).amount,0);
});
test('low-price exclusion uses middle band only in 2027',()=>{
  assert.equal(calc({lowPriceExcluded:true}).b.amount,3.78);assert.equal(calc({lowPriceExcluded:true,peakFulfillmentFees:true}).b.amount,2.68);
  assert.equal(calc({price:10}).b.amount,3.78);assert.equal(calc({price:50}).b.amount,3.78);assert.equal(calc({price:50.01}).b.amount,4.34);
});
test('2027 low inventory extends to oversize and requires both 28-day values',()=>{
  const c=calc({lengthIn:100,widthIn:31,heightIn:3,unitWeightLb:1,longTermDos:12,shortTermDos:20});
  assert.equal(r.lowInventoryFee(c.i,c.t).amount,1.57);
  assert.equal(r.lowInventoryFee({...c.i,shortTermDos:28},c.t).amount,0);
  assert.equal(r.lowInventoryFee({...c.i,shortTermDos:null},c.t).applied,false);
  assert.equal(r.lowInventoryFee({...c.i,noTrailingShipments:true},c.t).amount,0);
});
test('all four bulky tiers apply packaging by dimensional weight',()=>{
  const c=calc({lengthIn:30,widthIn:10,heightIn:2,unitWeightLb:10,sippCertified:false});assert.equal(c.t.key,'medium_bulky');assert.equal(c.s.amount,1.51);
  assert.equal(r.sippAdjustmentUs({...c.i,sippCertified:true},c.t).amount,0);
});

test('published examples verify weight increments and category formulas',()=>{
  assert.equal(calc({lengthIn:12.6,widthIn:6.6,heightIn:5.5,unitWeightLb:3.35,price:20}).b.amount,7.32);
  assert.equal(calc({lengthIn:12.6,widthIn:6.6,heightIn:5.5,unitWeightLb:3.35,price:20,category:'apparel'}).b.amount,7.23);
  const tv=calc({lengthIn:65,widthIn:20,heightIn:7,unitWeightLb:62,price:100});assert.equal(tv.t.key,'medium_oversize');assert.equal(tv.b.amount,36.55);
  const heavy=calc({lengthIn:30,widthIn:10,heightIn:5,unitWeightLb:151,price:100});assert.equal(heavy.t.key,'special_oversize_heavy');assert.equal(heavy.b.amount,191.28);
});
test('handling boundaries distinguish exact 4, 25 and 43 inches',()=>{
  for(const [dims,flat,overhang] of [[[60,25,3.99],8.4,0],[[60,25,4],0,0],[[70,43,3],10.48,0],[[70,43.01,3],10.48,3.45]]) {
    const c=calc({lengthIn:dims[0],widthIn:dims[1],heightIn:dims[2],unitWeightLb:1,price:100});const h=r.oversizeHandlingFee(c.i,c.t);assert.equal(h.flat,flat);assert.equal(h.overhang,overhang);
  }
});
