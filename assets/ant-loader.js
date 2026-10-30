(function(){
  'use strict';
  const base=new URL('.',document.currentScript.src);
  const packages=[['React','react@18.3.1/umd/react.production.min.js'],['ReactDOM','react-dom@18.3.1/umd/react-dom.production.min.js'],['dayjs','dayjs@1.11.13/dayjs.min.js'],['antd','antd@5.27.6/dist/antd.min.js']];
  function script(src,globalName){return new Promise((resolve,reject)=>{
    const el=document.createElement('script');el.src=src;el.async=false;el.crossOrigin='anonymous';
    const timer=setTimeout(()=>{el.remove();reject(new Error('资源加载超时'));},8000);
    el.onload=()=>{clearTimeout(timer);globalName&&!window[globalName]?reject(new Error('资源不可用')):resolve();};
    el.onerror=()=>{clearTimeout(timer);el.remove();reject(new Error('资源加载失败'));};document.head.append(el);
  });}
  async function boot(){
    try{
      for(const [name,file] of packages){
        if(window[name])continue;
        try{await script('https://cdn.jsdelivr.net/npm/'+file,name);}catch(e){await script('https://unpkg.com/'+file,name);}
      }
      const embedded=document.body.dataset.antEmbedded==='true';
      await script(new URL(embedded?'ant-legacy.js?v=20261030profit':'ant-app.js?v=20261030profit',base).href);
    }catch(error){
      const notice=document.createElement('p');notice.className='site-notice';notice.setAttribute('role','status');
      notice.textContent='Ant Design 组件暂未加载成功，已显示基础计算页面。请检查网络后刷新。';document.body.prepend(notice);
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
