/* The production timetable displays external wakes with only the shared alarm icon. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {serveFamilyUI,frontend}=require('./frontend.cjs');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 const directory=path.join(__dirname,'../.ci/ui-kit-results');fs.mkdirSync(directory,{recursive:true});
 try{
  const page=await browser.newPage({viewport:{width:1100,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('http://wecker-view.test/**',async route=>{
   if(await serveFamilyUI(route))return;
   if(new URL(route.request().url()).pathname==='/card.js')return route.fulfill({contentType:'application/javascript',body:fs.readFileSync(path.join(frontend,'shutter-manager-card.js'))});
   await route.fulfill({contentType:'text/html',body:'<html lang="de"><meta charset="utf-8"><style>body{margin:0;padding:8px;--primary-color:#03a9f4;--primary-text-color:#212121;--secondary-text-color:#727272;--text-primary-color:#fff;--card-background-color:#fff;--divider-color:#ddd;--ha-font-family-body:Arial,sans-serif}rollladenplaner-card{display:block;max-width:920px;margin:auto}</style><script type="module" src="/card.js"></script><rollladenplaner-card></rollladenplaner-card></html>'});
  });
  await page.goto('http://wecker-view.test');await page.waitForFunction(()=>customElements.get('rollladenplaner-card'));
  await page.evaluate(()=>{
   const row=(occurrence,time,extra={})=>({occurrence,time,targets:['w'],position:100,tilt:null,name:'Wochentag',kind:'time',program:'p',ride:'r',status:'planned',can_control:true,can_undo:true,skip:false,...extra});
   window.model={backend_version:'1.6.0',config_schema:7,admin:true,controls:{p:true},revision:1,time_zone:'Europe/Berlin',planned_date:'2026-11-13',config:{enabled:true,vacation:false,sensors:[],sensor_names:{},windows:[{id:'w',name:'Rollladen Maximilian mit langem Namen',cover:'cover.one',enabled:true,contacts:[],sensor_rules:[],cover_type:'shutter'}],programs:[{id:'p',name:'Wochentag',kind:'time',enabled:true,days:[0,1,2,3,4],pause_in_vacation:false,rides:[{id:'r',targets:['w'],enabled:true,event:'fixed',time:'08:00',offset:0,earliest:'00:00',latest:'23:59',position:100,tilt:null}]}]},moving:[],pending:{},sun_times:{},daily_history:[],planned:[row('native','2026-11-13T07:00:00Z'),row('once','2026-11-13T08:00:00Z',{one_time:true}),row('tomorrow-native','2026-11-14T04:45:00Z')],external_planned:[row('wecker:read-only','2026-11-13T06:15:00Z',{source:'wecker',source_name:'Maximilian · Schultag',position:75,one_time:true}),row('wecker:tomorrow','2026-11-14T05:30:00Z',{source:'wecker',source_name:'Maximilian · Wochenende',position:75})]};
   window.requests=[];const card=document.querySelector('rollladenplaner-card');window.card=card;card.setConfig({});card.hass={user:{id:'wecker-preview-user'},states:{'cover.one':{state:'open',attributes:{device_class:'shutter',supported_features:4}}},callWS:async message=>{window.requests.push(message);return structuredClone(window.model);}};
  });
  const card=page.locator('rollladenplaner-card');await card.locator('[data-action="tab"][data-tab="1"]').click();
  const measurements=[];
  for(const theme of ['light','dark'])for(const width of [320,390,1100])for(const admin of [true,false]){
   await page.setViewportSize({width,height:1000});
   await page.evaluate(({theme,admin})=>{
    const dark=theme==='dark';for(const [key,value] of Object.entries({'--primary-color':dark?'#90caf9':'#03a9f4','--primary-text-color':dark?'#eee':'#212121','--secondary-text-color':dark?'#aaa':'#727272','--text-primary-color':dark?'#102030':'#fff','--card-background-color':dark?'#202124':'#fff','--divider-color':dark?'#444':'#ddd'}))document.body.style.setProperty(key,value);
    document.body.style.background=dark?'#121212':'#f5f7fa';window.model.admin=admin;window.card.data=structuredClone(window.model);window.card.render();
   },{theme,admin});
   assert.deepEqual(await card.locator('.planned-time').allTextContents(),['07:15','08:00','09:00','05:45','06:30'],'native and Wecker rows share chronological order');
   assert.equal(await card.locator('.planned-heading h3').innerText(),'Nächste 24 Stunden');
   const wakes=card.locator('.planned-row[data-source="wecker"]');assert.equal(await wakes.count(),2);
   const wake=wakes.first();
   assert.equal(await wake.locator('button').count(),0,'Wecker rows never offer skip, remove or edit even if incoming control flags are true');
   const marker=wake.getByRole('img',{name:'Wecker',exact:true});assert.equal(await marker.count(),1);
   assert.equal(await marker.locator('svg[data-icon="media-alarm"]').count(),1,'the alarm icon is rendered by the pinned UI Kit');
   assert.match(await marker.getAttribute('title'),/Maximilian · Schultag/);
   assert.equal((await wake.innerText()).includes('Wecker'),false,'the source is marked by an icon without an additional visible label');
   assert.equal(await card.locator('.planned-row[data-source="shutter"] button').count(),3,'native controls remain available');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'the timetable fits the viewport');
   const box=await marker.locator('svg').boundingBox();assert.equal(box.width,21);assert.equal(box.height,21);
   measurements.push({theme,width,admin,icon:{width:box.width,height:box.height}});
   await page.screenshot({path:path.join(directory,`wecker-${theme}-${width}-${admin?'admin':'user'}.png`),fullPage:true});
  }
  await card.locator('[data-action="skip-today"]').first().click();
  const actions=await page.evaluate(()=>window.requests.filter(m=>m.type.endsWith('/action')));
  assert.equal(actions.length,1);assert.equal(actions[0].occurrence,'native','only the native program receives the skip request');
  await card.locator('[data-action="tab"][data-tab="0"]').click();assert.equal(await card.locator('.program').count(),1,'no stored program is created for external wakes');
  await card.locator('[data-action="tab"][data-tab="3"]').click();await card.locator('[data-action="set-language"][data-language="en"]').click();
  await card.locator('[data-action="tab"][data-tab="1"]').click();
  assert.equal(await card.getByRole('img',{name:'Alarm',exact:true}).count(),2);assert.equal(await card.locator('.planned-row[data-source="wecker"] button').count(),0);
  assert.equal(await card.locator('.planned-heading h3').innerText(),'Next 24 hours');
  await page.evaluate(async()=>{window.model.external_planned=[];await window.card.refresh();});assert.equal(await card.locator('[data-source="wecker"]').count(),0,'completed/removed external wakes disappear on refresh');
  await page.evaluate(async()=>{delete window.model.external_planned;await window.card.refresh();});assert.equal(await card.locator('.planned-row').count(),3,'older/no-Wecker snapshots retain the normal timetable');
  await page.evaluate(async()=>{window.model.external_planned=[{source:'wecker',time:'2026-11-13T06:15:00Z',targets:['w'],position:75,tilt:null,status:'planned',source_name:'<img src=x onerror="window.injected=true">'}];await window.card.refresh();});
  assert.equal(await card.locator('img').count(),0);assert.equal(await page.evaluate(()=>window.injected),undefined);
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(directory,'wecker-measurements.json'),JSON.stringify(measurements,null,2));
  console.log('PASS: read-only Wecker timetable with the actual shared alarm icon; 24-hour chronological merge across midnight without day headings, native actions, no skip/remove/edit, DE/EN, permissions, refresh/removal and XSS; 320/390/1100px in both themes.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
