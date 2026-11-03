/* Actual card and validator; Home Assistant storage and I/O are simulated. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),version=JSON.parse(fs.readFileSync(path.join(root,'custom_components/light_manager/manifest.json'))).version;
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 const page=await browser.newPage({viewport:{width:1160,height:950},locale:'de-DE'});page.setDefaultTimeout(10000);const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 await page.setContent('<html lang="de"><style>body{background:#f5f5f5;font-family:Roboto,Arial,sans-serif;margin:28px;--primary-color:#81d4fa}light-manager-card{display:block;max-width:980px;margin:auto}</style><light-manager-card></light-manager-card></html>');
 await page.addScriptTag({path:path.join(root,'custom_components/light_manager/frontend/light-manager-card.js')});
 await page.exposeFunction('validateConfig',c=>{const r=JSON.parse(execFileSync('python3',[path.join(__dirname,'validate_ui.py')],{input:JSON.stringify(c),encoding:'utf8'}));if(!r.ok)throw Error(r.error);});
 await page.evaluate(version=>{
  const config={schema:4,vacation:false,sensors:[],lamps:[],rooms:[],zones:[],programs:[]};
  const catalog=[{entity:'light.flur',name:'Friendly Flur',state:'off',attributes:{supported_color_modes:['color_temp'],min_color_temp_kelvin:2000,max_color_temp_kelvin:6500}},
   {entity:'light.hue_eg',name:'Hue Erdgeschoss',state:'off',attributes:{is_hue_group:true,entity_id:['light.flur']}},
   {entity:'light.other',name:'DO NOT OFFER THIS',state:'off',attributes:{supported_color_modes:['xy']}},
   {entity:'binary_sensor.tuer',name:'Haustür',state:'off',attributes:{device_class:'door'}},
   {entity:'binary_sensor.bewegung',name:'Bewegung Flur',state:'off',attributes:{device_class:'motion'}},
   {entity:'binary_sensor.unselected',name:'Not selected sensor',state:'off',attributes:{device_class:'motion'}},
   {entity:'sensor.unselected',name:'Not selected lux',state:'100',attributes:{device_class:'illuminance'}},
   {entity:'sensor.lux',name:'Helligkeit Flur',state:'50',attributes:{device_class:'illuminance',unit_of_measurement:'lx'}}];
  window.host={config,revision:0,calls:[]};const states=Object.fromEntries(catalog.map(x=>[x.entity,{state:x.state,attributes:{friendly_name:x.name,...x.attributes}}]));
  document.querySelector('light-manager-card').hass={states,callWS:async m=>{host.calls.push(m);if(m.type==='light_manager/save'){if(m.revision!==host.revision)throw Error('Veraltete Ansicht');await window.validateConfig(m.config);host.config=JSON.parse(JSON.stringify(m.config));host.revision++;}
   return {version,schema:4,revision:host.revision,config:JSON.parse(JSON.stringify(host.config)),catalog,status:{},rules:[],warnings:[],history:[],planned:host.planned||[],sun:{sunrise:'2026-11-02T06:16:00Z',sunset:'2026-11-02T16:03:00Z'},today:'2026-11-02',timezone:'Europe/Berlin'};}};
 },version);
 const openActions=async()=>page.locator('.action-fold[aria-expanded="false"]').evaluateAll(es=>es.forEach(e=>e.click()));
 const openSettings=async(section)=>{const button=page.locator(`[data-op="fold-settings"][data-section="${section}"]`);if(await button.getAttribute('aria-expanded')==='false')await button.click();};
 const openLampSections=async()=>page.locator('[data-lamp-section] summary').evaluateAll(es=>es.forEach(e=>{if(!e.parentElement.open)e.click();}));
 const b=op=>page.locator(`[data-op="${op}"]`),f=key=>page.locator(`[data-path="${key}"]`);
 const slider=async value=>page.locator('[data-brightness="0"]').evaluate((e,v)=>{e.value=v;e.dispatchEvent(new Event('input',{bubbles:true,composed:true}));},String(value));
 await b('settings').click();assert.deepEqual(await page.locator('[data-settings]').evaluateAll(es=>es.map(e=>e.dataset.settings)),['zones','rooms','lamps','sensors']);
 assert.equal(await page.getByText('Hue-Szenen',{exact:true}).count(),0);assert.equal(await page.getByText('Lampengruppen',{exact:true}).count(),0);
 for(const [section,name] of [['zones','Erdgeschoss'],['rooms','Flur']]){await page.locator(`[data-op="add"][data-section="${section}"]`).click();await f('name').fill(name);await b('commit').click();}
 await b('select-lamps').click();const list=await page.locator('.lamp-selection').innerText();assert.ok(list.includes('light.flur')&&list.includes('light.hue_eg'));assert.ok(list.includes('Friendly Flur'));
 await page.locator('[data-lamp-search]').fill('flur');assert.equal(await page.locator('[data-lamp-row^="light.other "]').isVisible(),false);
 await page.locator('[data-array="entities"][value="light.flur"]').check();await b('commit').click();
 assert.equal(await page.evaluate(()=>host.config.lamps.length),1);
 await openSettings('lamps');await page.locator('[data-op="edit"][data-section="lamps"]').click();await openLampSections();assert.equal(await page.locator('.technical-id').innerText(),'light.flur');
 await f('name').fill('Flur Deckenlicht');await page.locator('[data-array="zones"]').check();await page.locator('[data-array="rooms"]').check();await b('commit').click();
 await b('select-sensors').click();for(const e of ['binary_sensor.tuer','binary_sensor.bewegung'])await page.locator(`[data-array="entities"][value="${e}"]`).check();await page.locator('[data-array="entities"][value="sensor.lux"]').check();await b('commit').click();
 await page.locator('[data-tab="programs"]').click();await b('add').click();
 assert.equal(await page.locator('[data-path="order"]').count(),0);assert.equal(await page.locator('[data-season]').count(),0);assert.equal(await page.locator('.editor-action').count(),0);assert.equal(await page.locator('[data-path="season_enabled"]').isChecked(),false);
 const aligned=await page.evaluate(()=>{const r=document.querySelector('light-manager-card').shadowRoot;return Math.abs(r.querySelector('[data-path="name"]').getBoundingClientRect().top-r.querySelector('[data-path="kind"]').getBoundingClientRect().top)<2;});assert.ok(aligned);
 await page.screenshot({path:path.join(root,'../qa-new-program-022.png'),fullPage:true});
 await f('name').fill('Abendbeleuchtung');await b('add-action').click();await openActions();await page.locator('[data-target-group] summary').evaluateAll(es=>es.forEach(e=>e.click()));
 const choices=await page.locator('[data-array="actions.0.targets"]').evaluateAll(es=>es.map(e=>e.parentElement.innerText));assert.ok(choices.some(x=>x.includes('Flur Deckenlicht'))&&choices.some(x=>x.includes('Erdgeschoss'))&&choices.some(x=>x.includes('Flur')));assert.ok(!choices.join(' ').includes('DO NOT OFFER THIS'));
 const lampId=await page.evaluate(()=>host.config.lamps[0].id);await page.locator(`[data-array="actions.0.targets"][value="${lampId}"]`).check();await f('actions.0.event').selectOption('sunset');await slider(30);assert.equal(await page.locator('[data-brightness-value="0"]').innerText(),'30 %');
 await page.locator('[data-path="season_enabled"]').check();await page.locator('[data-season="season_from"]').fill('31.02');await page.locator('[data-season="season_to"]').fill('31.03');await b('commit').click();
 await page.getByRole('alert').filter({hasText:'Ungültiges Saisondatum'}).waitFor();await page.locator('[data-season="season_from"]').fill('01.10');
 await b('copy-action').click();await openActions();await f('actions.1.mode').selectOption('off');await f('actions.1.event').selectOption('fixed');await f('actions.1.time').fill('22:30');await b('commit').click();
 assert.equal(await page.evaluate(()=>host.config.programs[0].actions[0].brightness),30);assert.equal(await page.evaluate(()=>host.config.programs[0].season_from),'10-01');assert.equal(await page.evaluate(()=>host.config.programs[0].season_to),'03-31');
 await b('expand').click();await page.screenshot({path:path.join(root,'../qa-programs-022.png'),fullPage:true});
 assert.equal(await page.locator('[data-icon="sunrise"]').evaluate(e=>getComputedStyle(e).color),'rgb(129, 212, 250)');
 // Disable the season without discarding the previous dates.
 await b('edit').first().click();await openActions();assert.equal(await page.locator('[data-season="season_from"]').inputValue(),'01.10');await page.locator('[data-path="season_enabled"]').uncheck();assert.equal(await page.locator('[data-season]').count(),0);
 await page.locator('[data-brightness-keep="0"]').check();await b('commit').click();assert.equal(await page.evaluate(()=>host.config.programs[0].actions[0].brightness),null);
 assert.equal(await page.evaluate(()=>host.config.programs[0].season_enabled),false);assert.equal(await page.evaluate(()=>host.config.programs[0].season_from),'10-01');
 for(const kind of ['contact','motion','lux']){await b('add').click();await f('name').fill('Test '+kind);await f('kind').selectOption(kind);await b('add-action').click();await openActions();await page.locator('[data-target-group] summary').evaluateAll(es=>es.forEach(e=>e.click()));await page.locator('[data-array="actions.0.targets"]').first().check();if(kind!=='lux')await page.locator('[data-array="actions.0.sensors"]').first().check();if(kind!=='contact'){assert.equal(await f('actions.0.lux_entity').locator('option[value="sensor.unselected"]').count(),0);await f('actions.0.lux_entity').selectOption('sensor.lux');}assert.equal(await page.locator('[data-array="actions.0.sensors"][value="binary_sensor.unselected"]').count(),0);if(kind==='contact'){assert.equal(await f('actions.0.delay').inputValue(),'0');assert.equal(await f('actions.0.end_action').inputValue(),'restore');}if(kind==='lux'){await f('actions.0.lux_end').selectOption('below');await f('actions.0.lux_off').fill('20');await f('actions.0.delay').fill('30');assert.equal(await f('actions.0.end_action').inputValue(),'off');}await b('commit').click();}
 // New sensor controls and whitelist labels are translated too.
 await b('settings').click();await page.locator('[data-language="en"]').click();assert.equal(await b('select-sensors').innerText(),'Select sensors');await page.locator('[data-tab="programs"]').click();const luxId=await page.evaluate(()=>host.config.programs.find(p=>p.kind==='lux').id);await page.locator(`[data-op="edit"][data-id="${luxId}"]`).click();await openActions();assert.equal(await f('actions.0.lux_end').inputValue(),'below');assert.equal(await f('actions.0.lux_off').inputValue(),'20');assert.equal(await f('actions.0.delay').inputValue(),'30');assert.deepEqual(await f('actions.0.end_action').locator('option').allTextContents(),['Restore original state','Turn off','Keep current state','Use light setting']);await page.screenshot({path:path.join(root,'../qa-sensor-end-022.png'),fullPage:true});await b('cancel').last().click();await b('settings').click();await page.locator('[data-language="de"]').click();await page.locator('[data-tab="programs"]').click();
 // Invalid end dates do not partially change stored season dates; opt-out remains possible.
 await b('add').click();await f('name').fill('Ohne Saison');await page.locator('[data-path="season_enabled"]').check();await page.locator('[data-season="season_from"]').fill('01.10');await page.locator('[data-season="season_to"]').fill('31.02');await b('commit').click();await page.getByRole('alert').filter({hasText:'Ungültiges Saisondatum'}).waitFor();await page.locator('[data-path="season_enabled"]').uncheck();await b('commit').click();assert.equal(await page.evaluate(()=>host.config.programs.at(-1).season_from),'');
 // Used sensors cannot silently disappear from programs.
 await b('settings').click();await b('select-sensors').click();await page.locator('[data-array="entities"][value="binary_sensor.tuer"]').uncheck();await b('commit').click();await page.getByRole('alert').filter({hasText:'Einstellungen auswählen'}).waitFor();await b('cancel').last().click();
 // Removing a directly used light is rejected without losing aliases/assignments.
 await b('settings').click();await b('select-lamps').click();await page.locator('[data-array="entities"][value="light.flur"]').uncheck();await b('commit').click();await page.getByRole('alert').filter({hasText:'ausgewählte Lampen'}).waitFor();assert.equal(await page.evaluate(()=>host.config.lamps[0].name),'Flur Deckenlicht');await b('cancel').last().click();
 await page.locator('[data-tab="programs"]').click();await b('edit').first().click();await openActions();await f('name').fill('Nicht verlieren');await page.evaluate(()=>host.revision++);await b('commit').click();await page.getByRole('alert').filter({hasText:'Veraltete Ansicht'}).waitFor();assert.equal(await f('name').inputValue(),'Nicht verlieren');await b('cancel').last().click();
 await page.setViewportSize({width:390,height:844});await b('edit').first().click();await openActions();await page.locator('[data-brightness-keep="0"]').uncheck();await page.locator('[data-brightness="0"]').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(root,'../qa-mobile-022.png'),fullPage:true});
 assert.equal(await page.evaluate(()=>{const m=document.querySelector('light-manager-card').shadowRoot.querySelector('.modal');return m.scrollWidth>m.clientWidth}),false);
 assert.deepEqual(errors,[]);console.log('0.2.2 UI OK: ordered settings; technical selection whitelist; assignments; program layout; brightness slider/keep; opt-in DD.MM. season; invalid dates; all sensor editors; protected deselection; stale revisions; blue sun icons; 390px layout.');
 fs.writeFileSync(path.join(root,'../ui-config.json'),JSON.stringify(await page.evaluate(()=>host.config),null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
