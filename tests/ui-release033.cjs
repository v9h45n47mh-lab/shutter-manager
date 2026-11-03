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
   'scene.relax':{state:'unknown',attributes:{friendly_name:'Entspannen',is_hue:true,entity_id:['light.completely_different']}},
   'scene.focus':{state:'unknown',attributes:{friendly_name:'Farbe',is_hue:true}},
   'scene.sunset':{state:'unknown',attributes:{friendly_name:'Sonnenuntergang',is_hue:true}},
   'scene.foreign':{state:'unknown',attributes:{friendly_name:'Foreign HA scene'}}
  };
  const config={schema:4,vacation:false,lamps:[lamp('l1','light.one','Büro Manuel Spots','r1'),lamp('l2','light.two','Ankleide','r2')],rooms:[{id:'r1',name:'Büro Manuel'},{id:'r2',name:'Schlafzimmer'}],zones:[{id:'z1',name:'Erdgeschoss'},{id:'z2',name:'Garten'}],sensors:[{entity:'binary_sensor.motion',name:'Bewegungsmelder Carport'}],programs:[]};
  window.host={config,states,revision:0,calls:[]};window.fakeHass={user:{id:'qa030'},states,callWS:async m=>{host.calls.push(m);if(m.type==='light_manager/save'){if(m.revision!==host.revision)throw Error('Stale revision');host.config=await window.validateConfig(m.config);host.revision++;}
   const planned=host.config.programs.filter(p=>p.kind==='time').flatMap(p=>p.actions.map(a=>({program:p.id,action:a.id,name:p.name,due:'2026-11-02T17:00:00Z',mode:a.mode,skipped:a.skips.includes('2026-11-02')}))),rules=host.config.programs.filter(p=>p.kind!=='time').flatMap(p=>p.actions.map(a=>({program:p.id,action:a.id,name:p.name,kind:p.kind,active:true,effective:true,eligible:true,deadline:null})));
   return {version,schema:4,revision:host.revision,config:JSON.parse(JSON.stringify(host.config)),catalog:Object.entries(states).filter(([e,s])=>!e.startsWith('scene.')||s.attributes.is_hue).map(([entity,s])=>({entity,name:s.attributes.friendly_name,state:s.state,attributes:s.attributes})),status:{},rules,warnings:[],history:[],planned,sun:{sunrise:'2026-11-02T06:16:00Z',sunset:'2026-11-02T16:03:00Z'},today:'2026-11-02',timezone:'Europe/Berlin'};}};
  document.querySelector('light-manager-card').hass=fakeHass;
 },version);

 const b=op=>page.locator(`[data-op="${op}"]`),f=p=>page.locator(`[data-path="${p}"]`);
 const edit=async(section,id)=>{const fold=page.locator(`[data-op="fold-settings"][data-section="${section}"]`);if(await fold.getAttribute('aria-expanded')==='false')await fold.click();await page.locator(`[data-op="edit"][data-section="${section}"][data-id="${id}"]`).click();};
 const light=id=>page.locator(`[data-array="entities"][value="${id}"]`),assignment=id=>page.locator(`[data-assign-light][value="${id}"]`);
 const grouped=async()=>page.locator('[data-light-list]').evaluate(e=>{const children=[...e.children],divider=e.querySelector('hr');return {before:children.slice(0,children.indexOf(divider)).map(x=>x.querySelector('input').value),after:children.slice(children.indexOf(divider)+1).filter(x=>x.matches('label')).map(x=>x.querySelector('input').value),visible:!divider.hidden};});

 const columns=async()=>{const rows=await page.locator('.lamp-table>label').evaluateAll(es=>es.filter(e=>!e.hidden).map(e=>{const r=e.getBoundingClientRect(),n=e.querySelector('strong').getBoundingClientRect(),id=e.querySelector('small').getBoundingClientRect();return {top:r.top,bottom:r.bottom,nameX:n.x,idX:id.x,nameTop:n.y,idTop:id.y,nameBottom:n.bottom,idBottom:id.bottom,font:getComputedStyle(e.querySelector('strong')).fontSize,padding:getComputedStyle(e).paddingTop};}));assert.ok(rows.length>1);for(let i=0;i<rows.length;i++){const r=rows[i];assert.equal(r.font,'13px');assert.equal(r.padding,'6px');assert.ok(r.nameX<r.idX);assert.ok(Math.abs(r.nameTop-r.idTop)<1);assert.ok(r.idBottom<=r.bottom&&r.nameBottom<=r.bottom);if(i){assert.equal(r.nameX,rows[i-1].nameX);assert.equal(r.idX,rows[i-1].idX);assert.ok(rows[i-1].bottom<=r.top);}}assert.equal(await page.locator('.lamp-table').evaluate(e=>e.scrollWidth>e.clientWidth),false);};
 await b('settings').click();
 assert.deepEqual(await page.locator('.content>.settings-group').evaluateAll(es=>es.slice(0,3).map(e=>e.innerText.split('\n')[0])),['Sprache','Urlaubsmodus','Zonen\n+ Hinzufügen'.split('\n')[0]]);
 await page.locator('[data-vacation]').check();assert.equal(await page.evaluate(()=>host.config.vacation),true);await page.locator('[data-vacation]').uncheck();
 // All light choices remain clickable while moving between the independently sorted partitions.
 await b('select-lamps').click();await columns();assert.deepEqual(await grouped(),{before:['light.two','light.one'],after:[],visible:false});
 await light('light.two').uncheck();assert.deepEqual(await grouped(),{before:['light.one'],after:['light.two'],visible:true});
 await light('light.two').locator('..').click();assert.equal(await light('light.two').isChecked(),true);
 await light('light.one').focus();await page.keyboard.press('Space');assert.equal(await light('light.one').isChecked(),false);await page.keyboard.press('Space');assert.equal(await light('light.one').isChecked(),true);
 await page.locator('[data-lamp-search]').fill('Büro');await light('light.one').uncheck();assert.equal(await light('light.one').isVisible(),true);assert.equal(await light('light.two').isVisible(),false);assert.equal(await page.locator('[data-light-divider]').isVisible(),false);
 await light('light.one').check();await b('commit').click();assert.equal(await page.evaluate(()=>host.config.lamps.length),2);
 // Room/zone editors now expose the selected lights and save both directions of the relationship.
 await edit('rooms','r1');assert.equal(await page.locator('[data-lamp-section="assignment"]').getAttribute('open'),null);await page.locator('[data-lamp-section="assignment"] summary').click();
 assert.equal(await assignment('l1').isChecked(),true);await assignment('l2').check();await b('commit').click();
 assert.deepEqual(await page.evaluate(()=>host.config.lamps[1].rooms),['r2','r1']);assert.deepEqual(await page.evaluate(()=>host.config.lamps[1].zones),['z1']);
 await edit('lamps','l2');await page.locator('[data-lamp-section="rooms"] summary').click();assert.equal(await page.locator('[data-array="rooms"][value="r1"]').isChecked(),true);await b('cancel').last().click();
 await edit('zones','z1');await page.locator('[data-lamp-section="assignment"] summary').click();await assignment('l2').uncheck();await b('commit').click();
 assert.deepEqual(await page.evaluate(()=>host.config.lamps[1].zones),[]);assert.deepEqual(await page.evaluate(()=>host.config.lamps[1].rooms),['r2','r1']);
 // Creating a room can assign lights in the same save. Cancel and conflict never leak membership drafts.
 await page.locator('[data-op="add"][data-section="rooms"]').click();await f('name').fill('Neu');await page.locator('[data-lamp-section="assignment"] summary').click();await assignment('l1').check();await b('commit').click();
 const newId=await page.evaluate(()=>host.config.rooms.at(-1).id);assert.ok(await page.evaluate(id=>host.config.lamps[0].rooms.includes(id),newId));
 await edit('rooms',newId);await page.locator('[data-lamp-section="assignment"] summary').click();await assignment('l1').uncheck();await b('cancel').last().click();assert.ok(await page.evaluate(id=>host.config.lamps[0].rooms.includes(id),newId));
 await edit('rooms',newId);await page.locator('[data-lamp-section="assignment"] summary').click();await assignment('l1').uncheck();await page.evaluate(()=>host.revision++);await b('commit').click();await page.getByRole('alert').waitFor();assert.equal(await assignment('l1').isChecked(),false);assert.ok(await page.evaluate(id=>host.config.lamps[0].rooms.includes(id),newId));await b('cancel').last().click();
 for(const section of ['zones','rooms','lamps','sensors']){const fold=page.locator(`[data-op="fold-settings"][data-section="${section}"]`);if(await fold.getAttribute('aria-expanded')==='false')await fold.click();const row=page.locator(`[data-settings="${section}"] .row`).first();assert.equal(await row.locator('strong').first().evaluate(e=>getComputedStyle(e).fontSize),'13px');assert.ok(await row.evaluate(e=>e.getBoundingClientRect().height<=49));}
 await page.screenshot({path:path.join(root,'../qa-settings-032.png'),fullPage:true});
 await page.setViewportSize({width:390,height:844});assert.equal(await page.locator('ha-card').evaluate(e=>e.scrollWidth>e.clientWidth),false);
 await b('select-lamps').click();await light('light.two').uncheck();await light('light.two').check();assert.equal(await page.locator('[data-light-list]').evaluate(e=>e.scrollWidth>e.clientWidth),false);await b('cancel').last().click();

 // Infer only full technical-ID prefixes, retain existing manual links and preserve explicit deselections.
 await page.evaluate(async()=>{const card=document.querySelector('light-manager-card');host.config.lamps[0].entity='light.ambiente_mitte';host.config.lamps[0].name='Ein ganz anderer Anzeigename';host.config.lamps[0].scenes=['scene.relax'];delete host.config.lamps[0].scene_prefix_applied;
  host.states['light.ambiente_mitte']=host.states['light.one'];
  for(const id of ['scene.ambiente_mitte_ruhepause','scene.ambiente_mitte_hell','scene.ambiente_mittex_wrong','scene.ambiente_mitte','scene.anderer_name_wrong'])host.states[id]={state:'unknown',attributes:{friendly_name:id,is_hue:true,entity_id:['light.unrelated']}};
  host.states['light.new_group']={state:'off',attributes:{friendly_name:'Neue Gruppe',is_hue_group:true}};host.states['scene.new_group_ruhen']={state:'unknown',attributes:{friendly_name:'Ruhen',is_hue:true}};
  await card.refresh();});
 await edit('lamps','l1');await page.locator('[data-lamp-section="scenes"] summary').click();
 assert.equal(await page.locator('[data-array="scenes"][value="scene.ambiente_mitte_ruhepause"]').isChecked(),true);assert.equal(await page.locator('[data-array="scenes"][value="scene.ambiente_mitte_hell"]').isChecked(),true);assert.equal(await page.locator('[data-array="scenes"][value="scene.relax"]').count(),0);
 for(const id of ['scene.ambiente_mittex_wrong','scene.ambiente_mitte','scene.anderer_name_wrong'])assert.equal(await page.locator(`[data-array="scenes"][value="${id}"]`).count(),0);
 await b('cancel').last().click();assert.deepEqual(await page.evaluate(()=>host.config.lamps[0].scenes),['scene.relax']);
 await b('select-lamps').click();await light('light.new_group').check();await b('commit').click();
 assert.deepEqual((await page.evaluate(()=>host.config.lamps[0].scenes)).sort(),['scene.ambiente_mitte_ruhepause','scene.ambiente_mitte_hell'].sort());assert.deepEqual(await page.evaluate(()=>host.config.lamps.find(l=>l.entity==='light.new_group').scenes),['scene.new_group_ruhen']);
 await edit('lamps','l1');await page.locator('[data-lamp-section="scenes"] summary').click();await page.locator('[data-array="scenes"][value="scene.ambiente_mitte_hell"]').uncheck();await b('commit').click();
 await edit('lamps','l1');await page.locator('[data-lamp-section="scenes"] summary').click();assert.equal(await page.locator('[data-array="scenes"][value="scene.ambiente_mitte_hell"]').isChecked(),false);await b('cancel').last().click();
 await b('select-lamps').click();await b('commit').click();assert.ok(!(await page.evaluate(()=>host.config.lamps[0].scenes)).includes('scene.ambiente_mitte_hell'));
 await edit('lamps','l1');await page.locator('[data-lamp-section="scenes"] summary').click();await b('scene-prefix').click();await b('scene-prefix').click();await b('commit').click();assert.equal((await page.evaluate(()=>host.config.lamps[0].scenes)).filter(s=>s==='scene.ambiente_mitte_hell').length,1);
 // Prefix-derived links are available from room targets through the normal program action.
 await page.locator('[data-tab="programs"]').click();await b('add').click();await f('name').fill('Automatische Szenen');await b('add-action').click();await page.locator('.action-fold').click();await page.locator('[data-target-group$=":rooms"] summary').click();await page.locator('[data-array="actions.0.targets"][value="r1"]').check();await f('actions.0.mode').selectOption('scene');
 assert.ok((await f('actions.0.scene').locator('option').evaluateAll(es=>es.map(e=>e.value))).includes('scene.ambiente_mitte_ruhepause'));assert.equal(await f('actions.0.scene').locator('option[value="scene.ambiente_mitte_ruhepause"]').innerText(),'Ruhepause');await f('actions.0.scene').selectOption('scene.ambiente_mitte_ruhepause');await b('commit').click();assert.equal(await page.evaluate(()=>host.config.programs[0].actions[0].scene),'scene.ambiente_mitte_ruhepause');
 await b('settings').click();await page.locator('[data-language="en"]').click();await edit('lamps','l1');await page.locator('[data-lamp-section="scenes"] summary').click();assert.equal(await b('scene-prefix').innerText(),'Assign scenes by name');await b('cancel').last().click();

 // Short labels preserve Hue capitalization/umlauts, independent of manually assigned lamp aliases.
 const shortNames=await page.evaluate(()=>{const card=document.querySelector('light-manager-card'),cases=[
  ['light.badezimmer_badezimmer','scene.badezimmer_badezimmer_nachtlicht','Badezimmer Nachtlicht','Nachtlicht'],
  ['light.buro_manuel_buro_manuel','scene.buro_manuel_buro_manuel_konzentrieren','Büro Manuel Konzentrieren','Konzentrieren'],
  ['light.baume','scene.baume_pandamonium','Bäume Pandämonium','Pandämonium'],
  ['light.baume','scene.baume_pumpkin_spice','Bäume Pumpkin spice','Pumpkin spice'],
  ['light.bett','scene.bett_hell','Bett Hell','Hell']
 ];return cases.map(([light,scene,name,expected])=>{card.data.catalog.push({entity:scene,name});return [card.sceneName(scene,{entity:light,name:'Abweichender Alias'}),expected];});});for(const [actual,expected] of shortNames)assert.equal(actual,expected);
 await page.evaluate(async()=>{for(let i=0;i<12;i++)host.states['light.eine_sehr_lange_technische_entitaet_fuer_die_spaltendarstellung_'+i]={state:'off',attributes:{friendly_name:'Eine sehr lange Leuchte mit vielen Wörtern im Namen '+i}};await document.querySelector('light-manager-card').refresh();});
 await page.setViewportSize({width:1100,height:950});await b('select-lamps').click();await columns();await page.screenshot({path:path.join(root,'../qa-light-columns-033.png'),fullPage:true});
 await page.setViewportSize({width:390,height:844});await columns();await page.screenshot({path:path.join(root,'../qa-light-columns-mobile-033.png'),fullPage:true});await b('cancel').last().click();
 assert.deepEqual(errors,[]);console.log('0.3.3 settings UI OK: clickable light sorting, search, keyboard/mobile, bidirectional room/zone assignments, cancel/conflict protection, compact aligned columns, short scene labels, strict scene selection and vacation position.');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
