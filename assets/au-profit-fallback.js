(function(){
  'use strict';
  const feeForm=document.getElementById('au-form');if(!feeForm||!window.AU_PROFIT)return;
  const section=document.createElement('section');section.className='page-panel';
  section.innerHTML='<h2>AU 利润测算</h2><p class="muted">售价和配送费自动同步。采购、头程以人民币输入；汇率为 1 AUD 对应人民币，默认仅为假设。</p><form id="au-profit-form"><div class="au-fields"></div><button class="primary-btn" type="submit">计算利润</button></form><div id="au-profit-result" aria-live="polite"></div><p class="muted">毛利以售价扣除售价税额、配送费、佣金、采购、头程、广告、单件仓储与其他成本计算。毛利率以含税售价为分母。未计进项税抵扣及超龄库存费。</p>';
  feeForm.closest('.page-panel').insertAdjacentElement('afterend',section);
  const labels={gst:'售价含税税率（%）',referralRate:'销售佣金（%）',exchangeRate:'汇率（RMB/AUD）',productCostRmb:'采购成本（RMB）',firstLegRmbPerKg:'头程单价（RMB/kg）',firstLegDivisor:'头程体积重除数（cm³/kg）',advertisingRate:'广告费用（%）',otherCost:'其他单件成本（AUD）',storageMonths:'单件仓储月数'};
  const form=section.querySelector('form'),fields=section.querySelector('.au-fields'),result=section.querySelector('#au-profit-result');
  for(const [name,value] of Object.entries(AU_PROFIT.defaults)){
    const label=document.createElement('label');label.textContent=labels[name];
    const input=document.createElement('input');input.type='number';input.name=name;input.value=value;input.required=true;input.step='any';input.min=['exchangeRate','firstLegDivisor'].includes(name)?'.000001':'0';
    if(['gst','referralRate','advertisingRate'].includes(name))input.max='100';label.append(input);fields.append(label);
  }
  function render(){
    result.replaceChildren();
    try{
      const values={...Object.fromEntries(new FormData(feeForm)),...Object.fromEntries(new FormData(form))};
      const fee=AU_FEES.calculate(values),profit=AU_PROFIT.calculate(values,fee);
      for(const [label,value] of [['单件毛利','A$ '+profit.profit.toFixed(2)],['毛利率',profit.margin.toFixed(2)+'%'],['销售佣金','A$ '+profit.commission.toFixed(2)],['采购成本','A$ '+profit.procurement.toFixed(2)],['头程运费','A$ '+profit.freight.toFixed(2)],['头程计费重量',profit.freightWeight.toFixed(3)+' kg'],['单件仓储','A$ '+profit.storage.toFixed(2)]]){
        const row=document.createElement('div');row.className='au-result-item';const title=document.createElement('span');title.textContent=label;const detail=document.createElement('strong');detail.textContent=value;row.append(title,detail);result.append(row);
      }
    }catch(e){result.textContent=e.message;}
  }
  form.addEventListener('submit',e=>{e.preventDefault();render();});form.addEventListener('input',render);feeForm.addEventListener('input',render);feeForm.addEventListener('change',render);render();
})();
