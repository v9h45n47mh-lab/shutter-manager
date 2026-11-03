/* Real card + Python validator; only the HA host and device I/O are simulated. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),version=JSON.parse(fs.readFileSync(path.join(root,'custom_components/light_manager/manifest.json'))).version;
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 const page=await browser.newPage({viewport:{width:1050,height:950},locale:'de-DE'}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(10000);
 await page.route('http://light-manager.test/**',r=>r.fulfill({contentType:'text/html',body:'<html><style>body{font-family:Arial,sans-serif;background:#f5f5f5;margin:24px;--primary-color:#81d4fa}light-manager-card{display:block;max-width:950px;margin:auto}</style><light-manager-card></light-manager-card></html>'}));
 await page.goto('http://light-manager.test');await page.addScriptTag({path:path.join(root,'custom_components/light_manager/frontend/light-manager-card.js')});
 await page.exposeFunction('validateConfig',c=>{const r=JSON.parse(execFileSync('python3',[path.join(__dirname,'validate_ui.py')],{input:JSON.stringify(c),encoding:'utf8'}));if(!r.ok)throw Error(r.error);});
 await page.evaluate(version=>{
  const lamp=(id,entity,name,extra={})=>({id,entity,name,rooms:[],zones:[],fallback:'off',members:[],is_group:false,...extra});
  const states={
   'light.one':{state:'off',attributes:{friendly_name:'Büro Manuel Spots',supported_color_modes:['color_temp'],min_color_temp_kelvin:2000,max_color_temp_kelvin:6500}},
   'light.two':{state:'off',attributes:{friendly_name:'Ankleide',supported_color_modes:['color_temp'],min_color_temp_kelvin:3000,max_color_temp_kelvin:5000}},
   'light.group':{state:'off',attributes:{friendly_name:'Büro Gruppe',entity_id:'light.one',is_hue_group:true}},
   'sensor.window':{state:'tilted',attributes:{friendly_name:'Büro Fenster',device_class:'enum',options:['open','tilted','closed']}},
   'binary_sensor.motion':{state:'off',attributes:{friendly_name:'Bewegungsmelder Carport Bewegung',device_class:'motion'}},
   'sensor.lux':{state:'40',attributes:{friendly_name:'Helligkeit Carport',device_class:'illuminance',unit_of_measurement:'lx'}}
  };
  for(let i=0;i<40;i++)states['sensor.very_long_technical_identifier_for_window_opening_contact_'+String(i).padStart(2,'0')]={state:'closed',attributes:{friendly_name:'Fenster mit einem sehr langen Anzeigenamen für die Prüfung der Darstellung '+i}};
  const config={schema:4,vacation:false,lamps:[lamp('l1','light.one','Büro Manuel Spots',{rooms:['r1']}),lamp('l2','light.two','Ankleide',{zones:['z1']}),lamp('lg','light.group','Büro Gruppe',{is_group:true})],
   rooms:[{id:'r1',name:'Büro Manuel'},{id:'emptyroom',name:'Leeres Zimmer'}],zones:[{id:'z1',name:'Obergeschoss'},{id:'emptyzone',name:'Leere Zone'}],
   sensors:[{entity:'binary_sensor.motion',name:'Bewegungsmelder Carport Bewegung'},{entity:'sensor.lux',name:'Helligkeit Carport'}],programs:[]};
  window.host={config,states,revision:0};window.fakeHass={user:{id:'qa022'},states,callWS:async m=>{if(m.type==='light_manager/save'){await window.validateConfig(m.config);host.config=JSON.parse(JSON.stringify(m.config));host.revision++;}return {version,schema:4,revision:host.revision,config:JSON.parse(JSON.stringify(host.config)),catalog:Object.entries(host.states).map(([entity,s])=>({entity,name:s.attributes.friendly_name,state:s.state,attributes:s.attributes})),status:{},rules:[],warnings:[],history:[],planned:[],sun:{sunrise:'2026-11-02T06:16:00Z',sunset:'2026-11-02T16:03:00Z'},today:'2026-11-02',timezone:'Europe/Berlin'};}};
  document.querySelector('light-manager-card').hass=fakeHass;
 },version);
 const openActions=async()=>page.locator('.action-fold[aria-expanded="false"]').evaluateAll(es=>es.forEach(e=>e.click()));
 const openSettings=async(section)=>{const button=page.locator(`[data-op="fold-settings"][data-section="${section}"]`);if(await button.getAttribute('aria-expanded')==='false')await button.click();};
 const openLampSections=async()=>page.locator('[data-lamp-section] summary').evaluateAll(es=>es.forEach(e=>{if(!e.parentElement.open)e.click();}));
 const b=op=>page.locator(`[data-op="${op}"]`),f=p=>page.locator(`[data-path="${p}"]`),target=id=>page.locator(`[data-array="actions.0.targets"][value="${id}"]`);
 const openTargets=async()=>{await openActions();return page.locator('[data-target-group] summary').evaluateAll(es=>es.forEach(e=>{if(!e.parentElement.open)e.click();}));}
 const checkRows=async()=>{
  const rows=await page.locator('.lamp-selection>label').evaluateAll(es=>es.map(e=>{const box=e.getBoundingClientRect(),name=e.querySelector('strong').getBoundingClientRect(),id=e.querySelector('small').getBoundingClientRect();return {top:box.top,bottom:box.bottom,nameBottom:name.bottom,idTop:id.top,idBottom:id.bottom};}));
  assert.ok(rows.length>30);for(let i=0;i<rows.length;i++){const r=rows[i];assert.ok(r.nameBottom+3<=r.idTop,JSON.stringify(r));assert.ok(r.idBottom<=r.bottom);if(i)assert.ok(rows[i-1].bottom<=r.top+.1);}
  assert.equal(await page.locator('.lamp-selection').evaluate(e=>e.scrollWidth>e.clientWidth),false);
 };
 await b('settings').click();await openSettings('lamps');await openSettings('sensors');let text=await page.locator('[data-settings="lamps"]').innerText();assert.ok(text.includes('Büro Manuel Spots')&&!text.includes('light.one'));
 text=await page.locator('[data-settings="sensors"]').innerText();assert.ok(text.includes('Bewegungsmelder Carport Bewegung')&&!text.includes('binary_sensor.'));
 await page.locator('[data-op="fold-settings"][data-section="lamps"]').click();assert.equal(await page.locator('#settings-lamps').isVisible(),false);assert.equal(await b('select-lamps').isVisible(),true);
 await page.locator('[data-op="fold-settings"][data-section="sensors"]').click();await page.evaluate(async()=>document.querySelector('light-manager-card').refresh());assert.equal(await page.locator('#settings-sensors').isVisible(),false);
 await b('select-sensors').click();await checkRows();await page.screenshot({path:path.join(root,'../qa-picker-desktop-022.png'),fullPage:true});
 await page.setViewportSize({width:390,height:844});await checkRows();await page.screenshot({path:path.join(root,'../qa-picker-mobile-022.png'),fullPage:true});
 await page.locator('[data-lamp-search]').fill('Büro Fenster');await page.locator('[data-array="entities"][value="sensor.window"]').check();await b('commit').click();await page.setViewportSize({width:1050,height:950});
 await page.locator('[data-op="fold-settings"][data-section="sensors"]').click();await openSettings('sensors');await page.locator('[data-op="edit"][data-id="sensor.window"]').click();
 await page.locator('[data-contact-states="open_states"]').fill('open, tilted');await page.locator('[data-contact-states="closed_states"]').fill('closed');await f('name').fill('Küchenfenster');await b('commit').click();
 assert.deepEqual(await page.evaluate(()=>host.config.sensors.find(s=>s.entity==='sensor.window').open_states),['open','tilted']);
 assert.ok(!(await page.locator('#settings-sensors').innerText()).includes('sensor.'));
 await page.locator('[data-tab="programs"]').click();await b('add').click();await f('name').fill('Kontakt Büro');await f('kind').selectOption('contact');await b('add-action').click();await openActions();await openTargets();
 await target('r1').check();await page.locator('[data-colormode="0"]').selectOption('white');assert.equal(await page.locator('[data-white="0"]').isDisabled(),false);assert.equal(await page.locator('[data-white="0"]').getAttribute('data-min-kelvin'),'2000');
 const sensorChoice=page.locator('[data-array="actions.0.sensors"][value="sensor.window"]');assert.equal(await sensorChoice.locator('..').innerText(),'Küchenfenster');await sensorChoice.check();await b('commit').click();
 assert.deepEqual(await page.evaluate(()=>host.config.programs[0].actions[0].targets),['r1']);
 // Empty room, empty zone, zone alone and mixed targets share the same resolver.
 await b('edit').first().click();await openActions();await openTargets();await target('r1').uncheck();await target('emptyroom').check();await b('commit').click();await page.getByRole('alert').filter({hasText:'Dem ausgewählten Zimmer sind keine Lampen zugeordnet.'}).waitFor();
 await target('emptyroom').uncheck();await target('emptyzone').check();await b('commit').click();await page.getByRole('alert').filter({hasText:'Der ausgewählten Zone sind keine Lampen zugeordnet.'}).waitFor();
 await target('emptyzone').uncheck();await target('z1').check();assert.equal(await page.locator('[data-white="0"]').getAttribute('data-min-kelvin'),'3000');
 await target('r1').check();await target('lg').check();assert.deepEqual((await page.evaluate(()=>{const c=document.querySelector('light-manager-card');return c.actionEntities(c.editor.value.actions[0]);})).sort(),['light.one','light.two']);
 assert.equal(await page.locator('[data-white="0"]').getAttribute('data-max-kelvin'),'5000');await b('commit').click();
 // Include every used sensor category in the header, including disabled programs.
 await page.evaluate(async()=>{const card=document.querySelector('light-manager-card'),c=JSON.parse(JSON.stringify(host.config));for(const kind of ['motion','lux']){const p=JSON.parse(JSON.stringify(c.programs[0]));p.id='p_'+kind;p.name=kind;p.kind=kind;p.actions[0].id='a_'+kind;p.actions[0].sensors=kind==='motion'?['binary_sensor.motion']:[];p.actions[0].lux_entity='sensor.lux';c.programs.push(p);}await card.save(c);card.render();});
 assert.equal(await page.locator('.overview-group').count(),3);assert.ok((await page.locator('.overview').innerText()).includes('Keine Bewegung'));assert.ok((await page.locator('.overview').innerText()).includes('40 lx'));
 await b('overview').click();
 // Header follows Shutter: separate sun row, grouped readings and matching dimensions.
 assert.equal(await page.locator('.sun-value').first().evaluate(e=>getComputedStyle(e).fontSize),'14px');assert.equal(await page.locator('.sun-row').evaluate(e=>getComputedStyle(e).gap),'28px');
 assert.ok(await page.locator('.sun-row').evaluate(e=>e.getBoundingClientRect().bottom<=e.nextElementSibling.getBoundingClientRect().top));
 assert.equal(await page.locator('.sensor-state [data-icon="unlock"]').count(),1);assert.ok(!(await page.locator('.overview').innerText()).includes('sensor.window'));
 await b('overview').click();assert.equal(await page.locator('.overview').isVisible(),false);await page.evaluate(async()=>document.querySelector('light-manager-card').refresh());assert.equal(await page.locator('.overview').isVisible(),false);await b('overview').click();
 await page.screenshot({path:path.join(root,'../qa-header-022.png'),fullPage:true});
 // Live readings update without replacing a program draft or moving focus.
 await b('edit').first().click();await openActions();await f('name').fill('Nicht verlieren');await page.evaluate(async()=>{host.states['sensor.window'].state='closed';await document.querySelector('light-manager-card').refresh();});assert.equal(await f('name').inputValue(),'Nicht verlieren');assert.equal(await f('name').evaluate(e=>e===e.getRootNode().activeElement),true);assert.equal(await page.locator('.sensor-state [data-icon="lock"]').count(),1);await b('cancel').last().click();
 // Sensor names and mapping controls in English, including error translation.
 await b('settings').click();await page.locator('[data-language="en"]').click();await openSettings('sensors');await page.locator('[data-op="edit"][data-id="sensor.window"]').click();await page.getByText('Open states',{exact:true}).waitFor();
 await page.locator('[data-contact-states="closed_states"]').fill('open');await b('commit').click();await page.getByRole('alert').filter({hasText:'must not overlap'}).waitFor();await page.locator('[data-contact-states="closed_states"]').fill('closed');await b('commit').click();
 // Lux choices retain names without technical IDs.
 await page.locator('[data-tab="programs"]').click();await b('add').click();await f('kind').selectOption('motion');await b('add-action').click();await openActions();assert.equal(await f('actions.0.lux_entity').locator('option[value="sensor.lux"]').innerText(),'Helligkeit Carport');assert.equal(await f('actions.0.lux_entity').locator('option[value="sensor.window"]').count(),0);await b('cancel').last().click();
 await page.setViewportSize({width:390,height:844});await b('settings').click();await page.screenshot({path:path.join(root,'../qa-settings-mobile-022.png'),fullPage:true});
 assert.equal(await page.locator('ha-card').evaluate(e=>e.scrollWidth>e.clientWidth),false);assert.deepEqual(errors,[]);
 console.log('0.2.2 UI OK: 40 long picker rows; desktop/mobile; name-only lists; folds; enum mappings; room/zone/group union; precise empty-target messages; Shutter-style header; draft-safe live readings; English controls.');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
