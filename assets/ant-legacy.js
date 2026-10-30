/* Adapt original form controls without changing calculator contracts or IDs. */
(function(){
  'use strict';
  if(!window.antd||!window.React||!window.ReactDOM)return;
  const h=React.createElement;
  const {ConfigProvider,InputNumber,Input,Select,Checkbox}=antd;
  const controls=new Map();
  function sync(entry){
    const {native,root}=entry;
    if(!native.isConnected)return;
    const select=native.tagName==='SELECT',check=native.type==='checkbox';
    const props={disabled:native.disabled,'aria-label':native.getAttribute('aria-label')||native.labels?.[0]?.textContent.trim()||native.name||native.id,
      onChange:value=>{
        if(check)native.checked=value.target.checked;
        else native.value=select||native.type==='number'?value??'':value.target.value;
        native.dispatchEvent(new Event('input',{bubbles:true}));
        native.dispatchEvent(new Event('change',{bubbles:true}));
        sync(entry);
      }};
    let component;
    if(select){component=Select;props.value=native.value;props.options=Array.from(native.options).map(o=>({value:o.value,label:o.textContent,disabled:o.disabled}));props.style={width:'100%'};}
    else if(check){component=Checkbox;props.checked=native.checked;}
    else if(native.type==='number'){
      component=InputNumber;props.value=native.value===''?null:Number(native.value);props.style={width:'100%'};props.readOnly=native.readOnly;
      if(native.min!=='')props.min=Number(native.min);if(native.max!=='')props.max=Number(native.max);if(native.step&&native.step!=='any')props.step=Number(native.step);
    }else{component=Input;props.value=native.value;props.placeholder=native.placeholder;props.readOnly=native.readOnly;props.maxLength=native.maxLength>0?native.maxLength:undefined;}
    root.render(h(ConfigProvider,{theme:{token:{colorPrimary:'#d92d27',borderRadius:6,fontFamily:'-apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif'}}},h(component,props)));
  }
  let activeTab='fees', profitSource=null;
  function layoutCalculator(){
    const workspace=document.querySelector('.workspace');
    const result=document.getElementById('result-root');
    if(!workspace||!result)return;
    const left=workspace.firstElementChild;
    const inputPanel=left.classList.contains('panel')?left:left.querySelector('.panel');
    if(!inputPanel)return;
    let tabs=inputPanel.querySelector('.workspace-tabs');
    if(!tabs){
      const heading=inputPanel.querySelector('h2');
      if(heading)heading.textContent='费用与利润';
      tabs=document.createElement('div');tabs.className='workspace-tabs';tabs.setAttribute('role','tablist');
      for(const [key,label] of [['fees','配送费用'],['profit','利润测算']]){
        const button=document.createElement('button');button.type='button';button.textContent=label;button.dataset.tab=key;button.setAttribute('role','tab');
        button.onclick=()=>{activeTab=key;layoutCalculator();};tabs.append(button);
      }
      inputPanel.insertBefore(tabs,heading?.nextSibling||inputPanel.firstChild);
      const pane=document.createElement('div');pane.className='workspace-profit-input';inputPanel.append(pane);
      const right=workspace.lastElementChild;right.classList.add('workspace-results');
      const title=right.querySelector('h2');if(title)title.textContent='单件费用';
    }
    let leftColumn=inputPanel.parentElement;
    if(leftColumn===workspace){
      leftColumn=document.createElement('div');leftColumn.className='stack workspace-input-column';
      workspace.insertBefore(leftColumn,inputPanel);leftColumn.append(inputPanel);
    }
    let profitSlot=leftColumn.querySelector('.workspace-profit-slot');
    if(!profitSlot){
      profitSlot=document.createElement('div');profitSlot.className='workspace-profit-slot';
      inputPanel.insertAdjacentElement('afterend',profitSlot);
    }
    const pane=inputPanel.querySelector('.workspace-profit-input');
    const fresh=result.querySelector('.profit-estimator');
    if(fresh&&fresh!==profitSource){
      pane.replaceChildren();profitSource=fresh;
      const output=fresh.querySelector('.profit-result-card');
      if(output){output.classList.add('workspace-profit-output');profitSlot.replaceChildren(output);}else{profitSlot.replaceChildren();}
      pane.append(fresh);
    }
    for(const child of inputPanel.children){
      if(child===tabs||child.tagName==='H2')continue;
      child.hidden=child===pane?activeTab!=='profit':activeTab!=='fees';
    }
    for(const button of tabs.children){const selected=button.dataset.tab===activeTab;button.setAttribute('aria-selected',String(selected));}
    if(!pane.firstElementChild){const message=document.createElement('p');message.textContent='请先计算配送费用，再填写利润参数。';pane.append(message);}
    const intro=document.getElementById('result-intro');if(intro)intro.hidden=true;
  }
  window.layoutFeeWorkspace=layoutCalculator;
  let scheduled=false;
  function refresh(){
    scheduled=false;
    layoutCalculator();
    for(const [native,entry] of controls){if(!native.isConnected){entry.root.unmount();entry.host.remove();controls.delete(native);}}
    document.querySelectorAll('input[id]:not(.ant-native-source),select[id]:not(.ant-native-source)').forEach(native=>{
      if(native.closest('.ant-control-host')||!['text','number','checkbox','search'].includes(native.type)&&native.tagName!=='SELECT')return;
      const host=document.createElement('span');host.className='ant-control-host';
      native.classList.add('ant-native-source');native.insertAdjacentElement('afterend',host);
      const entry={native,host,root:ReactDOM.createRoot(host)};controls.set(native,entry);
      native.addEventListener('change',()=>sync(entry));native.addEventListener('input',()=>sync(entry));
      native.addEventListener('invalid',()=>host.querySelector('input,button')?.focus());
      sync(entry);
    });
  }
  new MutationObserver(records=>{
    if(scheduled||!records.some(record=>!record.target.closest?.('.ant-control-host')))return;
    scheduled=true;requestAnimationFrame(refresh);
  }).observe(document.body,{childList:true,subtree:true});
  refresh();
  setInterval(()=>{for(const entry of controls.values())if(entry.native.isConnected)sync(entry);},500);
})();
