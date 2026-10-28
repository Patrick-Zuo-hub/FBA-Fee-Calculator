const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {calculate} = require('../assets/au-calculator');
const base = {length:31.5,width:6.7,height:7.2,weight:.56,price:10.99,category:'home',dimensionUnit:'cm',weightUnit:'kg',season:'regular',quantity:1,age:0};
const calc = overrides => calculate({...base,...overrides});
test('AU published examples and price/category boundaries', () => {
  assert.equal(calc({}).fulfillment,4.36);
  assert.equal(calc({category:'other'}).fulfillment,6.33);
  assert.equal(calc({price:13}).fulfillment,5.48);
  assert.equal(calc({price:19.99,category:'sports'}).fulfillment,5.48);
  assert.equal(calc({price:20}).fulfillment,7.24);
  assert.equal(calc({length:28,width:8,height:8,weight:.447,price:15.5,category:'sports'}).fulfillment,5.48);
  assert.equal(calc({length:15,width:15,height:13,weight:.754,price:19.99,category:'other'}).fulfillment,7.24);
});
test('AU dimensional weight, gram rounding, envelope and oversize limits', () => {
  assert.equal(calc({length:32,width:17,height:14,weight:1.36,price:25}).shippingWeight,1.904);
  assert.equal(calc({length:32,width:17,height:14,weight:1.36,price:25}).fulfillment,9.81);
  assert.equal(calc({length:20,width:15,height:1,weight:.075}).tier,'Small envelope');
  assert.equal(calc({length:20,width:15,height:1,weight:.075001}).tier,'Standard envelope');
  const cot = calc({length:60,width:20,height:18,weight:1.5,price:25});
  assert.equal(cot.tier,'Small oversize'); assert.equal(cot.shippingWeight,5.4); assert.equal(cot.fulfillment,11.47);
  assert.equal(calc({length:60,width:20,height:18,weight:2.001}).tier,'Standard oversize');
  assert.equal(calc({length:120}).restricted,true);
  assert.throws(()=>calc({weight:250}));
});
test('AU storage, aged inventory boundaries, units and invalid inputs', () => {
  const r = calc({quantity:100,season:'peak'});
  assert.equal(r.storageRate,51.8); assert.ok(Math.abs(r.storage-r.volume*100*51.8)<1e-10);
  for(const [age,rate] of [[270,0],[271,155],[300,155],[301,175],[330,175],[331,185],[365,185]]) assert.equal(calc({age}).aged, r.volume*rate);
  assert.equal(calc({length:1,width:1,height:1,age:366,quantity:10}).aged,1.2);
  assert.equal(calc({length:31.5/2.54,width:6.7/2.54,height:7.2/2.54,dimensionUnit:'in',weight:560,weightUnit:'g'}).fulfillment,4.36);
  for(const bad of [{length:0},{weight:-1},{price:''},{quantity:1.5},{weight:Infinity},{category:'unknown'}]) assert.throws(()=>calc(bad));
});
test('AU route is connected to navigation and deploy build', () => {
  const root = path.resolve(__dirname,'..');
  for(const file of ['index.html','na/index.html','eu-uk/index.html','walmart/index.html','changelog/index.html','au/index.html']) assert.match(fs.readFileSync(path.join(root,file),'utf8'),/href="\/au\/"/);
  assert.match(fs.readFileSync(path.join(root,'scripts/build-deploy-site.js'),'utf8'),/"au"/);
  assert.match(fs.readFileSync(path.join(root,'au/index.html'),'utf8'),/\/assets\/au-calculator.js/);
});
