/* Shipped card and real validator, with an explicit fake HA host. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),version=JSON.parse(fs.readFileSync(path.join(root,'custom_components/light_manager/manifest.json'))).version;
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 const page=await browser.newPage({viewport:{width:1100,height:950},locale:'de-DE'}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(10000);
 await page.route('http://light-manager.test/**',r=>r.fulfill({contentType:'text/html',body:'<html><style>body{font-family:Arial,sans-serif;background:#f5f5f5;margin:24px;--primary-color:#81d4fa}light-manager-card{display:block;max-width:980px;margin:auto}</style><light-manager-card></light-manager-card></html>'}));
 await page.goto('http://light-manager.test');await page.addScriptTag({path:path.join(root,'custom_components/light_manager/frontend/light-manager-card.js')});
 await page.exposeFunction('validateConfig',c=>{const r=JSON.parse(execFileSync('python3',[path.join(__dirname,'validate_ui.py')],{input:JSON.stringify(c),encoding:'utf8'}));if(!r.ok)throw Error(r.error);return r.config;});
 await page.evaluate(version=>{
  const lamp=(id,entity,name,room)=>({id,entity,name,rooms:[room],zones:['z1'],fallback:'off',members:[],is_group:false});
  const states={
   'light.one':{state:'off',attributes:{friendly_name:'Büro Manuel Spots',supported_color_modes:['xy','color_temp'],min_color_temp_kelvin:2000,max_color_temp_kelvin:6500}},
   'light.two':{state:'off',attributes:{friendly_name:'Ankleide',supported_color_modes:['xy']}},
   'binary_sensor.motion':{state:'on',attributes:{friendly_name:'Bewegungsmelder Carport',device_class:'motion'}},
   'scene.one_relax':{state:'unknown',attributes:{friendly_name:'Entspannen',is_hue:true,entity_id:['light.completely_different']}},
   'scene.one_focus':{state:'unknown',attributes:{friendly_name:'Farbe',is_hue:true}},
   'scene.two_sunset':{state:'unknown',attributes:{friendly_name:'Sonnenuntergang',is_hue:true}},
   'scene.foreign':{state:'unknown',attributes:{friendly_name:'Foreign HA scene'}}
  };
  const config={schema:4,vacation:false,lamps:[lamp('l1','light.one','Büro Manuel Spots','r1'),lamp('l2','light.two','Ankleide','r2')],rooms:[{id:'r1',name:'Büro Manuel'},{id:'r2',name:'Schlafzimmer'}],zones:[{id:'z1',name:'Erdgeschoss'},{id:'z2',name:'Garten'}],sensors:[{entity:'binary_sensor.motion',name:'Bewegungsmelder Carport'}],programs:[]};
  window.host={config,states,revision:0,calls:[]};window.fakeHass={user:{id:'qa030'},states,callWS:async m=>{host.calls.push(m);if(m.type==='light_manager/save'){if(m.revision!==host.revision)throw Error('Stale revision');host.config=await window.validateConfig(m.config);host.revision++;}
   const planned=host.config.programs.filter(p=>p.kind==='time'&&p.enabled).flatMap(p=>p.actions.map(a=>({program:p.id,action:a.id,name:p.name,due:'2026-11-02T17:00:00Z',mode:a.mode,skipped:a.skips.includes('2026-11-02')}))),rules=host.config.programs.filter(p=>p.kind!=='time').flatMap(p=>p.actions.map(a=>({program:p.id,action:a.id,name:p.name,kind:p.kind,active:true,effective:true,eligible:true,deadline:null})));
   return {version,schema:4,revision:host.revision,config:JSON.parse(JSON.stringify(host.config)),catalog:Object.entries(states).filter(([e,s])=>!e.startsWith('scene.')||s.attributes.is_hue).map(([entity,s])=>({entity,name:s.attributes.friendly_name,state:s.state,attributes:s.attributes})),status:{},rules,warnings:[],history:[],planned,sun:{sunrise:'2026-11-02T06:16:00Z',sunset:'2026-11-02T16:03:00Z'},today:'2026-11-02',timezone:'Europe/Berlin'};}};
  document.querySelector('light-manager-card').hass=fakeHass;
 },version);

 page.on('dialog',d=>d.accept());
 const b=op=>page.locator(`[data-op="${op}"]`),f=key=>page.locator(`[data-path="${key}"]`);
 const targets=async()=>page.locator('[data-target-group] summary').evaluateAll(es=>es.forEach(e=>{if(!e.parentElement.open)e.click();}));
 const target=id=>page.locator(`[data-array="actions.0.targets"][value="${id}"]`);
 await b('settings').click();await page.locator('[data-op="fold-settings"][data-section="lamps"]').click();await page.locator('[data-op="edit"][data-section="lamps"][data-id="l1"]').click();assert.equal(await page.locator('[data-lamp-section="scenes"]').count(),0);await b('cancel').last().click();
 await page.locator('[data-tab="programs"]').click();await b('add').click();await f('name').fill('Automatische Hue Szene');await b('add-action').click();await page.locator('.action-fold').click();await targets();await target('r1').check();
 const colour=page.locator('[data-colormode="0"]');assert.equal(await f('actions.0.mode').locator('option[value="scene"]').count(),0);assert.equal(await colour.locator('option[value="scene.one_relax"]').count(),1);
 await colour.selectOption('scene.one_relax');assert.equal(await page.locator('[data-brightness]').count(),0);await b('commit').click();assert.equal(await page.evaluate(()=>host.config.programs[0].actions[0].scene),'scene.one_relax');
 await b('edit').first().click();await page.locator('.action-fold').click();await targets();await target('l2').check();assert.equal(await colour.locator('option[value^="scene."]').count(),0);assert.equal(await page.evaluate(()=>document.querySelector('light-manager-card').editor.value.actions[0].mode),'on');await b('cancel').last().click();
 // A new Hue catalog entity appears without editing lamp settings.
 await page.evaluate(async()=>{host.states['scene.one_new']={state:'unknown',attributes:{friendly_name:'Büro Manuel Spots Neu',is_hue:true}};await document.querySelector('light-manager-card').refresh();});
 await b('edit').first().click();await page.locator('.action-fold').click();assert.equal(await colour.locator('option[value="scene.one_new"]').count(),1);await page.evaluate(async()=>{host.states['scene.one_live']={state:'unknown',attributes:{friendly_name:'Büro Manuel Spots Live',is_hue:true}};await document.querySelector('light-manager-card').refresh();});assert.equal(await colour.locator('option[value="scene.one_live"]').count(),1);
 await f('name').fill('Entwurf bleibt');await colour.selectOption('scene.one_live');await f('name').focus();await page.evaluate(async()=>{delete host.states['scene.one_new'];await document.querySelector('light-manager-card').refresh();});assert.equal(await colour.locator('option[value="scene.one_new"]').count(),0);assert.equal(await colour.inputValue(),'scene.one_live');assert.equal(await f('name').inputValue(),'Entwurf bleibt');assert.equal(await f('name').evaluate(e=>e===e.getRootNode().activeElement),true);
 await page.evaluate(async()=>{delete host.states['scene.one_live'];await document.querySelector('light-manager-card').refresh();});assert.equal(await colour.locator('[data-missing-scene]').count(),1);assert.equal(await page.evaluate(()=>document.querySelector('light-manager-card').editor.value.actions[0].scene),'scene.one_live');
 await colour.selectOption('white');assert.equal(await page.locator('[data-white]').count(),1);await b('cancel').last().click();
 await page.locator('[data-tab="time"]').click();await b('once').click();assert.equal(await f('kind').count(),0);assert.equal(await page.locator('[data-array="days"]').count(),0);assert.equal(await f('actions.0.event').count(),0);await targets();await target('l1').check();await f('actions.0.time').fill('23:58');await b('commit').click();
 assert.equal(await page.evaluate(()=>host.config.programs.at(-1).once_date),'2026-11-02');assert.equal(await page.evaluate(()=>host.config.programs.at(-1).enabled),true);assert.equal(await page.locator('[data-time-action]').count(),1);

 await page.locator('[data-tab="programs"]').click();assert.equal(await page.locator('.program').count(),1);assert.ok(!(await page.locator('.program-title').innerText()).includes('Einmalige'));
 await page.locator('[data-tab="time"]').click();const once=page.locator('[data-once-program]');await once.locator('[data-op="edit"]').click();await f('name').fill('Nur heute geändert');await b('commit').click();assert.ok((await once.innerText()).includes('Nur heute geändert'));
 await page.evaluate(async()=>{host.config.programs.at(-1).enabled=false;await document.querySelector('light-manager-card').refresh();});assert.equal(await once.count(),1);assert.equal(await once.locator('time').innerText(),'23:58');
 await once.locator('[data-op="delete"]').click();assert.equal(await once.count(),0);assert.equal(await page.evaluate(()=>host.config.programs.some(p=>p.once_date)),false);
 await page.setViewportSize({width:390,height:844});await b('once').click();await targets();await target('l1').check();assert.equal(await page.locator('.modal').evaluate(e=>e.scrollWidth>e.clientWidth),false);await page.screenshot({path:path.join(root,'../qa-once-040.png'),fullPage:true});await b('cancel').last().click();
 assert.deepEqual(errors,[]);console.log('0.4.1 UI OK: no scene settings; live catalog scenes in Color; all-target rule; target changes return to standard; once-today dialog and save; mobile.');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
