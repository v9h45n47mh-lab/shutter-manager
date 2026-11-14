/* Compare production components with a separate, unmodified UI Kit ShadowRoot. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {serveFamilyUI,frontend}=require('./frontend.cjs');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 const directory=path.join(__dirname,'../.ci/ui-kit-results');fs.mkdirSync(directory,{recursive:true});
 try{
  const page=await browser.newPage({viewport:{width:1100,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('http://program-layout.test/**',async route=>{
   if(await serveFamilyUI(route))return;
   if(new URL(route.request().url()).pathname==='/card.js')return route.fulfill({contentType:'application/javascript',body:fs.readFileSync(path.join(frontend,'shutter-manager-card.js'))});
   await route.fulfill({contentType:'text/html',body:'<html lang="de"><meta charset="utf-8"><style>body{margin:0;padding:8px;--ha-font-family-body:"Noto Sans",Arial,sans-serif;--primary-color:#03a9f4;--primary-text-color:#212121;--secondary-text-color:#727272;--divider-color:#ddd;--card-background-color:#fff;--text-primary-color:#fff}.pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.pair>div{min-width:0}h2{font:14px Arial;margin:0 0 8px}@media(max-width:600px){.pair{grid-template-columns:1fr}}</style><script type="module" src="/card.js"></script><div class="pair"><div><h2>Shutter Manager</h2><rollladenplaner-card></rollladenplaner-card></div><div><h2>HA UI Kit 1.5.0 reference</h2><ui-kit-reference></ui-kit-reference></div></div></html>'});
  });
  await page.goto('http://program-layout.test');await page.waitForFunction(()=>customElements.get('rollladenplaner-card'));
  await page.evaluate(async()=>{
   const UI=await import('/family-ui/1.5.0/family-ui.js');window.UI=UI;
   customElements.define('ui-kit-reference',class extends HTMLElement{constructor(){super();this.attachShadow({mode:'open'});}});
   const card=document.querySelector('rollladenplaner-card');window.card=card;
   const make=(id,name,time)=>({id,name,kind:'time',enabled:id!=='q',days:[0,1,2,3,4],pause_in_vacation:id!=='p',rides:[{id:'r'+id,name:'Wohnen',targets:['w'],enabled:id!=='q',event:'fixed',time,offset:0,earliest:'00:00',latest:'23:59',position:0,tilt:50}]});
   const programs=[make('p','Wochentag','07:00'),make('q','Wochenende und Feiertage','08:00')];
   window.model={backend_version:'1.7.0',config_schema:7,admin:true,controls:{p:true,q:false},revision:1,time_zone:'Europe/Berlin',config:{enabled:true,vacation:false,sensors:[],sensor_names:{},windows:[{id:'w',name:'Wohnen',cover:'cover.reference',cover_type:'blind',enabled:true,contacts:[],sensor_rules:[]}],programs},pending:{},moving:[],planned:[],sun_times:{},daily_history:[]};
   card.loaded=true;card.data=window.model;card._hass={states:{'cover.reference':{state:'open',attributes:{device_class:'blind',supported_features:140}}},user:{id:'isolated-ui-parity'},callWS:async()=>structuredClone(window.model)};card.setConfig({});card.showOverview=false;
   clearInterval(card.timer);
   window.renderReference=({expanded,admin})=>{
    const content=programs.map((p,index)=>{
     const allowed=admin||window.model.controls[p.id];
     const action=expanded?UI.actionRow({title:'Wohnen',description:p.rides[0].time+' Uhr',detail:'Höhe 0% · Lamellen 50%',enabled:p.rides[0].enabled,actions:UI.toggle({label:'Fahrt aktiv',action:'ride',checked:p.rides[0].enabled,disabled:!allowed,iconOnly:true})}):'';
     let row=UI.programRow({id:'reference-'+p.id,title:p.name,meta:['Mo · Di · Mi · Do · Fr'],enabled:p.enabled,expanded,index,count:programs.length,editable:admin,content:expanded?'<div class="actions">'+action+'</div>':''});
     row=row.replace(`aria-label="${UI.escapeHtml(p.name+' aktiv')}"`,'aria-label="Programm aktiv"');
     if(!allowed){const template=document.createElement('template');template.innerHTML=row;template.content.querySelector('.program-head .toggle').disabled=true;row=template.innerHTML;}
     return row;
    }).join('');
    const reference=document.querySelector('ui-kit-reference').shadowRoot;
    reference.innerHTML='<style>'+UI.UI_CSS+'</style><ha-card>'+UI.navigation({label:'Rollladensteuerung',active:'0',helpLabel:'Howto',items:[{id:'0',label:'Programme'},{id:'1',label:'Zeitprogramm',icon:'schedule'},{id:'2',label:'Sensorprogramme',icon:'sensors'}]})+UI.sensorOverview({id:'reference-readings',expanded:false})+'<main>'+(admin?'<div class="page-actions"><span></span>'+UI.programAddButton()+'</div>':'')+UI.programGroup({id:'reference-time',title:'Zeitprogramme',count:programs.length,expanded:true,content})+'</main></ha-card>';
   };
  });
  const selectors=['.card-top','nav','nav button','.settings-button','.overview-toggle','.program-group','.program-group-head','.program-group-head strong','.program-group-head>span:last-child','.program-group-head .chevron','.program','.program-head','.program-heading','.program-title','.program-title>span','.tags','.tags>span','.program-head>.toolbar','.program-head .toggle','.program-head .switch-track','.program-head .switch-thumb','.program-order','.program-order button','[data-action="copy-program"]','[data-action="edit-program"]','.program-add','.ride','.ride-info','.ride-info strong','.ride-info>span','.ride-info small','.ride-actions','.ride .toggle'];
  const properties=['display','fontFamily','fontSize','fontWeight','fontStyle','lineHeight','letterSpacing','color','backgroundColor','paddingTop','paddingRight','paddingBottom','paddingLeft','marginTop','marginRight','marginBottom','marginLeft','rowGap','columnGap','borderTopWidth','borderBottomWidth','borderColor','borderRadius','alignItems','justifyContent','flexWrap','gridTemplateColumns','width','height','opacity'];
  const metrics=[];
  for(const theme of ['light','dark'])for(const width of [320,390,1100])for(const expanded of [false,true])for(const admin of [true,false]){
   await page.setViewportSize({width,height:1100});
   await page.evaluate(({theme,expanded,admin})=>{
    const values=theme==='dark'?{'--primary-color':'#90caf9','--primary-text-color':'#eee','--secondary-text-color':'#aaa','--divider-color':'#444','--card-background-color':'#202124','--text-primary-color':'#102030'}:{'--primary-color':'#03a9f4','--primary-text-color':'#212121','--secondary-text-color':'#727272','--divider-color':'#ddd','--card-background-color':'#fff','--text-primary-color':'#fff'};
    for(const [key,value] of Object.entries(values))document.body.style.setProperty(key,value);
    document.body.style.background=theme==='dark'?'#121212':'#f5f7fa';document.body.style.color=values['--primary-text-color'];
    window.model.admin=admin;window.card.data=window.model;
    for(const id of ['p','q'])expanded?window.card.expanded().add(id):window.card.expanded().delete(id);
    window.card.render();window.renderReference({expanded,admin});
   },{theme,expanded,admin});
   const result=await page.evaluate(({selectors,properties})=>{
    const production=window.card.shadowRoot,reference=document.querySelector('ui-kit-reference').shadowRoot;
    const snapshot=(root,selector)=>[...root.querySelectorAll(selector)].map(el=>{
     const style=getComputedStyle(el),parent=el.closest('.program')||el.closest('.program-group')||root.querySelector('main'),box=el.getBoundingClientRect(),base=parent.getBoundingClientRect(),round=n=>Math.round(n*100)/100;
     return {styles:Object.fromEntries(properties.map(p=>[p,style[p]])),box:!el.getClientRects().length?null:{left:round(box.left-base.left),top:round(box.top-base.top),width:round(box.width),height:round(box.height)}};
    });
    return selectors.map(selector=>({selector,production:snapshot(production,selector),reference:snapshot(reference,selector)}));
   },{selectors,properties});
   const state=expanded?'expanded':'collapsed',role=admin?'admin':'user';
   await page.screenshot({path:path.join(directory,`program-kit-${theme}-${width}-${state}-${role}.png`),fullPage:true});
   metrics.push({theme,width,expanded,admin,components:result});fs.writeFileSync(path.join(directory,'program-kit-metrics.json'),JSON.stringify(metrics,null,2));
   for(const entry of result)assert.deepEqual(entry.production,entry.reference,`${entry.selector}: ${theme}/${width}/${state}/${role}`);
   const alignment=await page.evaluate(()=>[...window.card.shadowRoot.querySelectorAll('.program')].map(row=>{
    const left=row.getBoundingClientRect().left,offset=element=>Math.round((element.getBoundingClientRect().left-left)*100)/100;
    return {title:offset(row.querySelector('.program-title>span')),metadata:offset(row.querySelector('.tags>span')),actions:[...row.querySelectorAll('.ride-info strong')].map(offset)};
   }));
   for(const row of alignment){assert.equal(row.title,28,'program title has the shared 28 px indent');assert.equal(row.metadata,row.title,'metadata aligns with the program title');for(const action of row.actions)assert.equal(action,row.title,'action text aligns with the program title');}
   const card=page.locator('rollladenplaner-card');
   assert.equal(await card.locator('[data-action="toggle-vacation-filter"]').count(),0);
   assert.equal(await card.locator('[data-action="edit-program"]').count(),admin?2:0,'administrative controls retain their permission boundary');
   assert.equal(await card.locator('[data-action="program"][data-program="q"]').isDisabled(),!admin,'unpermitted program switches remain disabled');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'both layouts fit the viewport');
  }
  assert.deepEqual(errors,[]);
  console.log('PASS: isolated HA UI Kit 1.5.0 parity for program groups, rows, actions, typography, indentation, spacing, controls, geometry and 28 px text alignment; 24 desktop/mobile, light/dark, collapsed/expanded and admin/user variants.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
