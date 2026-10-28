const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('every workspace and original calculator loads Ant Design integration',()=>{
 for(const file of ['index.html','na/index.html','eu-uk/index.html','au/index.html','walmart/index.html','changelog/index.html']){
  assert.match(read(file),/ant-loader.js/);assert.match(read(file),/ant-workspace.css/);
 }
 for(const file of ['fba-us-local-fee-calculator.html','fba-eu-uk-fee-calculator.html','walmart-wfs-fee-calculator.html']){
  assert.match(read('History/'+file),/data-ant-embedded="true"/);assert.match(read('History/'+file),/ant-legacy.css/);
 }
});
test('Ant loader loads pinned libraries in order before application',async()=>{
 const scripts=[];
 const window={};let mounted=false;
 const document={currentScript:{src:'https://example.test/assets/ant-loader.js'},readyState:'complete',body:{dataset:{},append(){},prepend(){}},createElement(){return {remove(){}};},head:{append(el){scripts.push(el.src);if(el.src.includes('/react@'))window.React={};if(el.src.includes('/react-dom@'))window.ReactDOM={};if(el.src.includes('/dayjs@'))window.dayjs={};if(el.src.includes('/antd@'))window.antd={};if(el.src.includes('ant-app.js'))mounted=true;queueMicrotask(()=>el.onload());}}};
 vm.runInNewContext(read('assets/ant-loader.js'),{window,document,URL,Promise,setTimeout,clearTimeout,Error});
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(scripts.length,5);assert.match(scripts[0],/react@18.3.1/);assert.match(scripts[3],/antd@5.27.6/);assert.equal(mounted,true);
});
test('Ant loader reports network failures and preserves fallback',async()=>{
 let notice;const scripts=[];
 const document={currentScript:{src:'https://example.test/assets/ant-loader.js'},readyState:'complete',body:{dataset:{},prepend(el){notice=el;}},createElement(){return {remove(){},setAttribute(){}};},head:{append(el){scripts.push(el.src);queueMicrotask(()=>el.onerror());}}};
 vm.runInNewContext(read('assets/ant-loader.js'),{window:{},document,URL,Promise,setTimeout,clearTimeout,Error});
 await new Promise(resolve=>setImmediate(resolve));assert.equal(scripts.length,2);assert.match(notice.textContent,/基础计算页面/);
});
test('profit summary presents monetary profit and a cost breakdown',()=>{
 const estimator=require('../History/profit-estimator.js');
 const state={grossSellingPrice:20,vat:0,referralRate:15,fbaFee:4,chargeableWeightKg:1,firstLegPriceRmbPerKg:7,productCostRmb:14,exchangeRate:7};
 const result=estimator.calculateGrossMargin(state);
 const html=estimator.renderEstimatorPanel({state,result,currency:'USD',marketLabel:'美国站'});
 assert.match(html,/单件利润/);assert.match(html,/USD 10.00/);assert.match(html,/采购成本/);assert.match(html,/头程运费/);
});
