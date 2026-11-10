/* Read-only comparison against the real pinned Light Manager card. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {serveFamilyUI,frontend}=require('./frontend.cjs');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 const directory=path.join(__dirname,'../.ci/ui-kit-results');fs.mkdirSync(directory,{recursive:true});
 const reference=path.join(__dirname,'../.ci/light-reference','custom_components','light_manager','frontend','light-manager-card.js');
 try{
  const page=await browser.newPage({viewport:{width:1100,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('http://program-layout.test/**',async route=>{
   if(await serveFamilyUI(route))return;
   const url=new URL(route.request().url());
   if(url.pathname==='/card.js')return route.fulfill({contentType:'application/javascript',body:fs.readFileSync(path.join(frontend,'shutter-manager-card.js'))});
   if(url.pathname==='/reference/light-manager-card.js')return route.fulfill({contentType:'application/javascript',body:fs.readFileSync(reference)});
   await route.fulfill({contentType:'text/html',body:'<html lang="de"><meta charset="utf-8"><style>body{margin:0;padding:8px;--ha-font-family-body:Arial,sans-serif;--primary-color:#03a9f4;--primary-text-color:#212121;--secondary-text-color:#727272;--divider-color:#ddd;--card-background-color:#fff;--text-primary-color:#fff}.pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.pair>div{min-width:0}ha-card{display:block}h2{font:14px Arial;margin:0 0 8px}@media(max-width:600px){.pair{grid-template-columns:1fr}}</style><script type="module" src="/card.js"></script><script type="module" src="/reference/light-manager-card.js"></script><div class="pair"><div><h2>Shutter Manager</h2><rollladenplaner-card></rollladenplaner-card></div><div><h2>Light Manager reference</h2><light-manager-card></light-manager-card></div></div></html>'});
  });
  await page.goto('http://program-layout.test');await page.waitForFunction(()=>customElements.get('rollladenplaner-card')&&customElements.get('light-manager-card'));
  await page.evaluate(()=>{
   const shutter=document.querySelector('rollladenplaner-card'),light=document.querySelector('light-manager-card');
   const make=(id,name,time)=>({id,name,kind:'time',enabled:true,days:[0,1,2,3,4],pause_in_vacation:id!=='p',rides:[{id:'r'+id,name:'Wohnen',targets:['w'],enabled:true,event:'fixed',time,offset:0,earliest:'00:00',latest:'23:59',position:0,tilt:50}]});
   const programs=[make('p','Wochentag','07:00'),make('q','Wochenende und Feiertage','08:00')];
   const model={backend_version:'1.5.1',config_schema:7,admin:true,controls:{p:true,q:true},revision:1,time_zone:'Europe/Berlin',config:{enabled:true,vacation:false,sensors:[],sensor_names:{},windows:[{id:'w',name:'Wohnen',cover:'cover.reference',cover_type:'blind',enabled:true,contacts:[],sensor_rules:[]}],programs},pending:{},moving:[],planned:[],sun_times:{},daily_history:[]};
   const referenceModel={version:'1.2.2',today:'2026-11-10',timezone:'Europe/Berlin',sun:{sunrise:null,sunset:null},planned:[],rules:[],warnings:[],history:[],catalog:[],calculated:{},config:{enabled:true,vacation:false,lamps:[{id:'lamp',name:'Wohnen',entity:'light.reference',fallback:'keep'}],rooms:[],zones:[],sensors:[],programs:programs.map(p=>({...p,actions:p.rides.map(r=>({...r,event:'fixed',targets:['lamp'],brightness:80,mode:'on',sensors:[],lux_entity:''}))}))}};
   const states={'cover.reference':{state:'open',attributes:{device_class:'blind',supported_features:140}},'light.reference':{state:'off',attributes:{friendly_name:'Wohnen'}}};
   window.shutter=shutter;window.lightReference=light;
   shutter.loaded=true;shutter.data=model;shutter._hass={states,user:{id:'layout-shutter'},callWS:async()=>structuredClone(model)};shutter.setConfig({});
   light.data=referenceModel;light._hass={states,user:{id:'layout-reference'},callWS:async()=>structuredClone(referenceModel)};light.setConfig({});light.render();
   clearInterval(shutter.timer);clearInterval(light.timer);
  });
  const metrics=[];
  for(const theme of ['light','dark'])for(const width of [320,390,1100])for(const expanded of [false,true]){
   await page.setViewportSize({width,height:1100});
   await page.evaluate(({theme,expanded})=>{
    const values=theme==='dark'?{'--primary-color':'#90caf9','--primary-text-color':'#eee','--secondary-text-color':'#aaa','--divider-color':'#444','--card-background-color':'#202124'}:{'--primary-color':'#03a9f4','--primary-text-color':'#212121','--secondary-text-color':'#727272','--divider-color':'#ddd','--card-background-color':'#fff'};
    for(const [key,value] of Object.entries(values))document.body.style.setProperty(key,value);
    document.body.style.background=theme==='dark'?'#121212':'#f5f7fa';document.body.style.color=values['--primary-text-color'];
    for(const [card,set] of [[window.shutter,window.shutter.expanded()],[window.lightReference,window.lightReference.expanded]]){expanded?set.add('p'):set.delete('p');card.render();}
   },{theme,expanded});
   const result=await page.evaluate(expanded=>{
    const s=window.shutter.shadowRoot,l=window.lightReference.shadowRoot;
    const text=el=>Object.fromEntries(['fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','fontStyle','color'].map(key=>[key,getComputedStyle(el)[key]]));
    const names=[['title','.program-title span','.program-title span'],['group','.program-group-head strong','.program-group-head strong'],['days','.program .tags span','.program .tags span']];
    if(expanded)names.push(['action-title','.ride-info strong','.action-info strong'],['action-description','.ride-info>span','.action-info>span'],['action-detail','.ride-info small','.action-info small']);
    const type=names.map(([name,a,b])=>({name,shutter:text(s.querySelector(a)),light:text(l.querySelector(b))}));
    const spacing=root=>{const row=root.querySelector('.program'),title=root.querySelector('.program-title'),meta=root.querySelector('.tags'),style=getComputedStyle(row);return {top:style.paddingTop,bottom:style.paddingBottom,indent:Math.round((meta.getBoundingClientRect().left-title.getBoundingClientRect().left)*100)/100};};
    return {type,spacing:{shutter:spacing(s),light:spacing(l)}};
   },expanded);
   const state=expanded?'expanded':'collapsed';
   await page.screenshot({path:path.join(directory,`program-reference-${theme}-${width}-${state}.png`),fullPage:true});
   metrics.push({theme,width,expanded,...result});fs.writeFileSync(path.join(directory,'program-reference-metrics.json'),JSON.stringify(metrics,null,2));
   for(const entry of result.type)assert.deepEqual(entry.shutter,entry.light,`${entry.name}: ${theme}/${width}/${state}`);
   assert.deepEqual(result.spacing.shutter,result.spacing.light,'row spacing and metadata indentation match Light Manager');
   assert.equal(await page.locator('rollladenplaner-card [data-action="toggle-vacation-filter"]').count(),0);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'both layouts fit the viewport');
  }
  assert.deepEqual(errors,[]);
  console.log('PASS: real Light Manager program typography, font inheritance, headings, metadata, action text, indentation and row spacing; closed/open, 320/390/1100px and light/dark.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
