/* Real Ant Design components. Libraries are pinned in ant-loader.js. */
(function () {
  'use strict';
  if (!window.React || !window.ReactDOM || !window.antd) return;
  const h=React.createElement;
  const {useState,useEffect}=React;
  const {ConfigProvider,Layout,Menu,Card,Button,Typography,Tag,Space,Row,Col,Statistic,Form,InputNumber,Select,Alert,Descriptions,Table,Collapse,Empty,Drawer,Grid,Divider}=antd;
  const {Title,Text,Paragraph,Link}=Typography;
  const routes=[['home','工作台','/'],['na','Amazon 北美','/na/'],['eu-uk','Amazon 欧洲 / 英国','/eu-uk/'],['au','Amazon 澳大利亚','/au/'],['walmart','Walmart WFS','/walmart/'],['changelog','更新日志','/changelog/']];
  const current=document.body.dataset.route||'home';
  const originalEmbed=document.querySelector('iframe.tool-embed');
  const embedSrc=originalEmbed?.getAttribute('src');
  const money=n=>'A$ '+Number(n).toFixed(2);
  function NumberField({name,label,min=0,max,step=.01,help}) {
    return h(Col,{xs:24,sm:12,lg:8},h(Form.Item,{name,label,extra:help,rules:[{required:true,message:'请填写此项'}]},h(InputNumber,{min,max,step,style:{width:'100%'}})));
  }
  function Choice({name,label,options}) {
    return h(Col,{xs:24,sm:12,lg:8},h(Form.Item,{name,label,rules:[{required:true}]},h(Select,{options:options.map(([value,label])=>({value,label}))})));
  }
  const initial={length:31.5,width:6.7,height:7.2,weight:.56,price:10.99,category:'home',dimensionUnit:'cm',weightUnit:'kg',season:'regular',quantity:1,age:0,...window.AU_PROFIT?.defaults};
  function Australia() {
    const [form]=Form.useForm();
    const [result,setResult]=useState(null),[profit,setProfit]=useState(null),[error,setError]=useState(''),[profitError,setProfitError]=useState('');
    const [tab,setTab]=useState('fees');
    const [history,setHistory]=useState(()=>{try{const records=JSON.parse(localStorage.getItem('fee-studio-au-history')||'[]');return Array.isArray(records)?records.filter(r=>r&&r.values&&Number.isFinite(r.fee)).slice(0,20):[];}catch(e){return [];}});
    const [historyOpen,setHistoryOpen]=useState(false),[historyError,setHistoryError]=useState('');
    function persistHistory(next){try{localStorage.setItem('fee-studio-au-history',JSON.stringify(next));setHistory(next);setHistoryError('');}catch(e){setHistoryError('浏览器无法保存历史记录，请检查存储设置。');}}
    function saveHistory(){form.validateFields().then(values=>{try{const fee=AU_FEES.calculate(values);persistHistory([{id:Date.now(),date:new Date().toLocaleString('zh-CN'),values,fee:fee.fulfillment},...history].slice(0,20));}catch(e){setHistoryError(e.message);}}).catch(()=>setHistoryError('请先补全有效参数。'));}

    function calculate(values) {
      try { const fee=AU_FEES.calculate(values); setResult(fee); setError('');
        try {setProfit(AU_PROFIT.calculate(values,fee));setProfitError('');} catch(e){setProfit(null);setProfitError(e.message);}
      } catch(e){setResult(null);setProfit(null);setError(e.message);}
    }
    useEffect(()=>calculate(initial),[]);
    const number=(name,label,props={})=>h(NumberField,{key:name,name,label,...props});
    const choice=(name,label,options)=>h(Choice,{key:name,name,label,options});
    const feeFields=h(React.Fragment,null,
      h(Divider,{orientation:'left'},'商品包装'),
      h(Row,{gutter:20},choice('dimensionUnit','尺寸单位',[['cm','厘米 cm'],['in','英寸 inch']]),choice('weightUnit','重量单位',[['kg','千克 kg'],['g','克 g'],['lb','磅 lb']]),number('weight','实际重量',{min:.000001,step:.001}),number('length','包装长',{min:.000001,step:.001}),number('width','包装宽',{min:.000001,step:.001}),number('height','包装高',{min:.000001,step:.001})),
      h(Divider,{orientation:'left'},'售价与收费类目'),
      h(Row,{gutter:20},number('price','售价 · AUD'),choice('category','收费类目',[['home','Home and Kitchen'],['pet','Pet Products'],['grocery','Grocery and Gourmet'],['sports','Sports and Outdoors'],['other','其他类目']]),choice('season','仓储月份',[['regular','1–9 月'],['peak','10–12 月']])),
      h(Row,{gutter:20},number('quantity','日均库存 · 件',{step:1}),number('age','库存库龄 · 天',{step:1})),
      h(Alert,{type:'info',showIcon:true,message:'信封按实际重量；Parcel / Oversize 按实际重量与体积重取较大值。体积重除数为 4,000。'}),
      h(Divider,{orientation:'left'},'AU Size Tier'),
      h(Paragraph,{type:'secondary'},'包装尺寸按最长边排序 · 当前尺寸层级：'+(result?.tier||'请填写有效参数')),
      h(Row,{gutter:[16,16]},AU_FEES.tiers.map(tier=>h(Col,{xs:24,sm:12,key:tier.name},h(Card,{size:'small',className:'au-tier-card'+(result?.tier===tier.name?' is-current':''),title:tier.name},
        result?.tier===tier.name&&h(Tag,{color:'red',style:{marginBottom:12}},'当前输入所在层级'),
        h('div',null,Number.isFinite(tier.dims[0])?'尺寸 ≤ '+tier.dims.join(' × ')+' cm':'超出前述尺寸档，按重量继续分档'),
        h('div',null,tier.name==='Extra large'?'实际重量 > 35 kg 且 < 250 kg':'实际重量 ≤ '+tier.max+' kg'),
        tier.name==='Parcel'&&h('div',null,'计费重量 ≤ 12 kg'),
        h('div',null,tier.envelope?'按实际重量计费':'按实际重量与体积重较大值计费'))))),
      h(Paragraph,{type:'secondary',style:{marginTop:16}},'依次匹配第一个满足条件的层级。超大件费率仅供参考；超出常规 116 × 116 × 102 cm 或 23 kg 限制需特殊批准。'));

    const profitFields=h(React.Fragment,null,
      h(Alert,{type:'info',showIcon:true,message:'售价与配送费自动同步',description:'采购与头程以人民币输入，汇率为 1 AUD 对应人民币。默认汇率仅为测算假设，可自行修改。'}),
      h(Divider,{orientation:'left'},'成本与经营假设'),
      h(Row,{gutter:20},number('productCostRmb','采购成本 · RMB'),number('firstLegRmbPerKg','头程单价 · RMB/kg'),number('exchangeRate','汇率 · RMB/AUD',{min:.000001,step:.001}),number('firstLegDivisor','头程体积重除数',{min:1,step:100,help:'头程独立计费，默认 cm³ ÷ 6,000'}),number('referralRate','销售佣金 · %',{max:100}),number('gst','售价含税税率 · %',{max:100}),number('advertisingRate','广告费用 · %',{max:100}),number('otherCost','其他单件成本 · AUD'),number('storageMonths','单件仓储月数',{help:'按单件体积计入毛利，不乘整批库存'})),
      h(Paragraph,{type:'secondary'},'毛利 = 售价 ÷ (1 + 税率) − 配送费 − 佣金 − 采购 − 头程 − 广告 − 单件仓储 − 其他成本。毛利率以含税售价为分母。未计进项税抵扣及超龄库存附加费。'));
    const breakdown=profit&&result?[
      ['含税售价',form.getFieldValue('price')],['售价税额（估算）',profit.gst],['配送费',result.fulfillment],['销售佣金',profit.commission],['采购成本',profit.procurement],['头程运费',profit.freight],['广告费用',profit.advertising],['单件仓储',profit.storage],['其他成本',form.getFieldValue('otherCost')]
    ].map(([label,value],i)=>({key:i,label,value})):[];
    return h(React.Fragment,null,
      h(Space,{style:{marginBottom:20}},h(Button,{onClick:saveHistory},'保存本次测算'),h(Button,{onClick:()=>setHistoryOpen(true)},'历史记录 ('+history.length+')')),
      historyError&&h(Alert,{type:'warning',message:historyError,style:{marginBottom:16}}),
      h(Drawer,{title:'AU 历史记录 · 最近 20 条',open:historyOpen,onClose:()=>setHistoryOpen(false),width:420},history.length?history.map(record=>h(Card,{key:record.id,size:'small',style:{marginBottom:12},title:record.date},h(Paragraph,null,'配送费 '+money(record.fee)+' · 售价 '+money(record.values.price)),h(Space,null,h(Button,{onClick:()=>{form.setFieldsValue(record.values);calculate(record.values);setHistoryOpen(false);}},'回填参数'),h(Button,{danger:true,onClick:()=>persistHistory(history.filter(item=>item.id!==record.id))},'删除')))):h(Empty,{description:'尚未保存测算记录'})),
      error&&h(Alert,{type:'error',showIcon:true,message:error,style:{marginBottom:20}}),
      result?.restricted&&h(Alert,{type:'warning',showIcon:true,message:'超出常规 FBA 入仓限制',description:'需要亚马逊特殊批准或受邀计划。配送费仅供参考，不代表商品可入仓。',style:{marginBottom:20}}),
      h(Row,{gutter:[24,24]},
        h(Col,{xs:24,xl:16},h(Card,{title:'AU 费用与利润',tabList:[{key:'fees',label:'配送与仓储'},{key:'profit',label:'利润测算'}],activeTabKey:tab,onTabChange:setTab},
          h(Form,{form,layout:'vertical',initialValues:initial,onValuesChange:(_,values)=>calculate(values),onFinish:calculate},
            h('div',{hidden:tab!=='fees'},feeFields),h('div',{hidden:tab!=='profit'},profitFields),
            h(Space,{wrap:true,style:{marginTop:24}},h(Button,{type:'primary',htmlType:'submit'},'重新计算'),h(Button,{onClick:()=>{form.resetFields();calculate(initial);}},'重置示例'))))),
        h(Col,{xs:24,xl:8},h('div',{className:'results-stack'},
          h(Card,{title:'单件费用',extra:h(Tag,{color:'blue'},'AUD · 未含费用 GST')},result?h(React.Fragment,null,
            h(Statistic,{title:'FBA 配送费',value:result.fulfillment,precision:2,prefix:'A$',valueStyle:{color:'#d92d27'}}),h(Divider),
            h(Descriptions,{column:1,size:'small',items:[{key:'tier',label:'尺寸分档',children:result.tier},{key:'weight',label:'FBA 计费重量',children:result.shippingWeight.toFixed(3)+' kg'},{key:'volume',label:'单件体积',children:result.volume.toFixed(6)+' m³'},{key:'storage',label:'整批月仓储估算',children:money(result.storage)},{key:'aged',label:'整批超龄单次估算',children:money(result.aged)}]})):h(Empty,{description:'请填写有效商品信息'})),
          h(Card,{title:'单件利润',extra:h(Tag,{color:profit&&profit.profit>=0?'green':'red'},profit?profit.profit>=0?'盈利':'亏损':'待计算')},
            profit?h(React.Fragment,null,h(Row,{gutter:12},h(Col,{span:12},h(Statistic,{title:'毛利',value:profit.profit,precision:2,prefix:'A$',valueStyle:{color:profit.profit>=0?'#389e0d':'#cf1322'}})),h(Col,{span:12},h(Statistic,{title:'毛利率',value:profit.margin,precision:2,suffix:'%'}))),h(Paragraph,{type:'secondary',style:{marginTop:16}},'按当前售价与成本实时测算'),h(Table,{size:'small',pagination:false,showHeader:false,dataSource:breakdown,columns:[{dataIndex:'label'},{dataIndex:'value',align:'right',render:money}]}),h(Text,{type:'secondary'},'头程计费重：'+profit.freightWeight.toFixed(3)+' kg')):h(Empty,{description:profitError||'请填写利润参数'}))))),
      h(Collapse,{style:{marginTop:24},items:[{key:'rules',label:'AU 计费规则与官方来源',children:h(React.Fragment,null,
        h(Paragraph,null,'尺寸以单件包装后数据为准，最长边排序。FBA 计费重量向上取整至 1 g。售价分为 <A$13、A$13–<A$20、≥A$20，并按收费类目匹配费率。'),
        h(Paragraph,null,'仓储按日均体积估算；超龄费为每月 15 日的独立评估项。常规入仓限制为 116 × 116 × 102 cm、23 kg。'),
        h(Space,{wrap:true},h(Link,{href:'https://sellercentral.amazon.com.au/help/hub/reference/external/201112670',target:'_blank',rel:'noopener'},'Seller Central 配送费表'),h(Link,{href:'https://sell.amazon.com.au/pricing',target:'_blank',rel:'noopener'},'AU 仓储与超龄费')),h(Paragraph,{type:'secondary'},'费率核对：2026-10-28。部分招商页配送费存在差异，采用 Seller Central。税率、佣金和汇率为用户可调整的测算参数。'))}]}));
  }
  function Dashboard({versions}) {
    const modules=[['na','北美','US / CA / MX','跨站点配送费、附加费与利润测算'],['eu-uk','欧洲与英国','UK / EU','本地配送、跨境配送与旺季费率'],['au','澳大利亚','AU · AUD','售价类目优惠、仓储费与单件利润'],['walmart','Walmart WFS','US · USD','WFS 配送、仓储及利润测算']];
    return h(React.Fragment,null,
      h(Row,{gutter:[20,20],style:{marginBottom:24}},[['平台工具',4],['Amazon 区域',3],['利润测算','已接入']].map(([title,value])=>h(Col,{xs:24,md:8,key:title},h(Card,null,h(Statistic,{title,value}))))),
      h(Title,{level:4},'选择测算工具'),h(Row,{gutter:[20,20]},modules.map(([key,title,coverage,description])=>h(Col,{xs:24,lg:12,key},h(Card,{className:'workspace-card',title,extra:h(Tag,{color:key==='au'?'blue':'default'},key==='au'?'AU 新增利润':'可用')},h(Paragraph,{type:'secondary'},description),h(Space,{wrap:true},h(Tag,null,coverage),h(Text,{type:'secondary'},versions?.[key]?.updatedAt||'')),h('div',{style:{marginTop:24}},h(Button,{type:'primary',href:'/'+key+'/'},'进入计算器 →')))))),
      h(Card,{title:'最近更新',style:{marginTop:24}},h(UpdateList,{versions,compact:true})));
  }
  function UpdateList({versions,compact=false}) {
    const updates=versions?.updates||[];
    if(!updates.length)return h(Empty,{description:'暂时无法加载更新记录'});
    return h('div',{className:'update-rows'},updates.slice(0,compact?3:undefined).map((u,i)=>h('div',{key:i,className:'update-row'},h(Tag,null,u.date),h('div',null,h(Text,{strong:true},u.title),h(Paragraph,{type:'secondary',style:{marginBottom:0}},u.summary)))));
  }
  function EmbeddedCalculator({label}) {
    const [frame,setFrame]=useState(null),[count,setCount]=useState(0);
    const key='fba-history-'+current;
    function refreshCount(){try{const records=JSON.parse(localStorage.getItem(key)||'[]');setCount(Array.isArray(records)?records.length:0);}catch(e){setCount(0);}}
    useEffect(()=>{refreshCount();const timer=setInterval(refreshCount,500);return()=>clearInterval(timer);},[]);
    return h(React.Fragment,null,
      h(Space,{style:{marginBottom:20}},
        h(Button,{onClick:()=>{frame?.contentDocument.querySelector('form')?.requestSubmit();refreshCount();}},'保存本次测算'),
        h(Button,{onClick:()=>frame?.contentDocument.querySelector('.fba-history-trigger')?.click()},'历史记录 ('+count+')')),
      h('div',{className:'calculator-container'},h('iframe',{src:embedSrc+'?ui=20261030profit',title:label+' 费用与利润计算器',className:'ant-calculator-frame',onLoad:event=>{
        const iframe=event.currentTarget;setFrame(iframe);refreshCount();
        try{iframe.contentDocument.body.classList.add('workspace-history-external');const resize=()=>{iframe.style.height=iframe.contentDocument.documentElement.scrollHeight+'px';};new iframe.contentWindow.ResizeObserver(resize).observe(iframe.contentDocument.body);resize();}catch(e){}
      }})));
  }
  function Application() {
    const [versions,setVersions]=useState(null),[loadError,setLoadError]=useState(false),[open,setOpen]=useState(false);
    const screens=Grid.useBreakpoint();
    useEffect(()=>{fetch('/data/versions.json').then(r=>{if(!r.ok)throw Error();return r.json();}).then(setVersions).catch(()=>setLoadError(true));},[]);
    const menu=h(Menu,{mode:'inline',selectedKeys:[current],items:routes.map(([key,label,href])=>({key,label:h('a',{href},label)})),onClick:()=>setOpen(false)});
    const label=routes.find(([key])=>key===current)?.[1]||'工作台';
    return h(ConfigProvider,{theme:{token:{colorPrimary:'#d92d27',borderRadius:8,fontFamily:'-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif',colorBgLayout:'#f5f5f5'},components:{Layout:{siderBg:'#fff',headerBg:'#fff'},Menu:{itemBorderRadius:6}}}},
      h(Layout,{className:'ant-workspace'},
        screens.lg&&h(Layout.Sider,{width:240,className:'app-sidebar'},h('a',{className:'app-brand',href:'/'},h('span',{className:'app-mark'},'F'),h('span',null,'Fee Studio',h('small',null,'Marketplace workspace'))),menu,h('div',{className:'sidebar-footer'},h(Tag,{color:'blue'},'内部测算工具'),h(Paragraph,{type:'secondary'},'Amazon · Walmart'))),
        h(Drawer,{open,onClose:()=>setOpen(false),placement:'left',width:280,title:'Fee Studio'},menu),
        h(Layout,null,h(Layout.Header,{className:'app-header'},h(Space,null,!screens.lg&&h(Button,{'aria-label':'打开导航',onClick:()=>setOpen(true)},'☰'),h(Text,{type:'secondary'},'费用测算 /'),h(Text,{strong:true},label)),h(Text,{type:'secondary'},'本机工作台')),
          h(Layout.Content,{className:'app-content'},h('div',{className:'page-title'},h('div',null,h(Title,{level:2},current==='home'?'费用与利润工作台':label),h(Paragraph,{type:'secondary'},current==='home'?'集中测算配送成本，比较各站点利润。':current==='au'?'从包装信息到单件毛利，一次完成澳洲站测算。':current==='changelog'?'查看费率更新与工具变更。':'配送费、附加费与利润测算。'))),
            loadError&&h(Alert,{message:'更新记录暂不可用，计算器仍可正常使用。',type:'warning',showIcon:true,style:{marginBottom:20}}),
            current==='home'?h(Dashboard,{versions}):current==='au'?h(Australia):current==='changelog'?h(Card,null,h(UpdateList,{versions})):h(EmbeddedCalculator,{label}),
            h('footer',{className:'app-footer'},'Fee Studio · 费用以平台实际账单为准 · 汇率及成本由用户输入')))));
  }
  const mount=document.createElement('div');mount.id='ant-root';document.body.append(mount);
  ReactDOM.createRoot(mount).render(h(Application));
  document.body.classList.add('ant-ready');
})();
