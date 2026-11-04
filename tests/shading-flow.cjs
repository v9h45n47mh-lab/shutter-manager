/* Actual 1.3 editor and Python persistence; HA services and devices are simulated. */
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
(async()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'shutter-shading-')),store=path.join(directory,'store.json');
 const extras={'cover.east':{state:'open',attributes:{friendly_name:'Rollladen Ost',device_class:'shutter',supported_features:12,current_position:75}},
  'sensor.east':{state:'15000',attributes:{friendly_name:'Helligkeit Ost',device_class:'illuminance',unit_of_measurement:'lx'}},
  'sensor.east_temp':{state:'27',attributes:{friendly_name:'Temperatur Ost',device_class:'temperature',unit_of_measurement:'°C'}}};
 const call=message=>JSON.parse(execFileSync('python3',[path.join(__dirname,'save_host.py'),store,JSON.stringify({...message,fixture_states:extras})],{env:process.env,encoding:'utf8'}));
 const setup=call({type:'rollladenplaner/get'}).snapshot;
 for(const program of setup.config.programs)if(program.kind==='sensor')program.enabled=false;
 setup.config.windows.push({id:'east',name:'Rollladen Ost',cover:'cover.east',cover_type:'shutter',contacts:[],sensor_rules:[{id:'east_sensors',name:'Ostseite',lux_entity:'sensor.east',temp_entity:'sensor.east_temp'}]});
 assert.equal(call({type:'rollladenplaner/save',revision:setup.revision,config:setup.config}).ok,true);
 const browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 try{
  const page=await browser.newPage({viewport:{width:1100,height:1100}}),errors=[];page.setDefaultTimeout(10000);page.on('pageerror',error=>errors.push(error.message));
  await page.exposeFunction('backend',message=>{const result=call(message);assert.equal(result.motor_calls,0,'editing never drives motors');return result;});
  await page.route('http://shading.test/**',async route=>{
   if(route.request().url().endsWith('/card.js'))await route.fulfill({contentType:'application/javascript',body:fs.readFileSync(path.join(__dirname,'../custom_components/rollladenplaner/frontend/shutter-manager-card.js'),'utf8')});
   else await route.fulfill({contentType:'text/html',body:'<html lang="de"><meta charset="utf-8"><style>body{margin:8px;--primary-color:#81d2eb;--text-primary-color:#18333e;--primary-text-color:#212121;--secondary-text-color:#727272;--divider-color:#e4e4e4}shutter-manager-card{display:block;max-width:800px;margin:auto}</style><script type="module" src="/card.js"></script><shutter-manager-card></shutter-manager-card></html>'});
  });
  async function open(){
   await page.goto('http://shading.test');await page.waitForFunction(()=>customElements.get('shutter-manager-card'));
   await page.evaluate(async()=>{const result=await backend({type:'rollladenplaner/get'});window.saves=0;window.host={user:{id:'shading-test'},states:result.states,callWS:async message=>{
    if(message.type.endsWith('/save')){saves++;if(window.failNext){window.failNext=false;throw new Error('Temporary save failure');}}
    const response=await backend(message);if(!response.ok)throw new Error(response.error);
    if(window.dropConditions && message.type.endsWith('/save')){window.dropConditions=false;delete response.snapshot.config.programs.find(p=>p.name==='Fassadenbeschattung').conditions;}
    return response.snapshot;
   }};const card=document.querySelector('shutter-manager-card');card.setConfig({type:'custom:shutter-manager-card'});card.hass=host;});
  }
  const card=page.locator('shutter-manager-card'),dialog=card.getByRole('dialog');await open();
  await card.getByRole('button',{name:'+ Programm',exact:true}).click();
  await dialog.locator('[data-key="name"]').fill('Fassadenbeschattung');
  await dialog.locator('[data-key="kind"]').selectOption('sensor');
  await dialog.locator('[data-key="conditions.mode"]').selectOption('both');
  await dialog.locator('[data-key="start"]').fill('08:00');await dialog.locator('[data-key="end"]').fill('18:00');
  await dialog.locator('[data-key="conditions.lux_on"]').fill('35000');await dialog.locator('[data-key="conditions.temp_on"]').fill('28');
  await dialog.locator('[data-key="conditions.on_delay_seconds"]').fill('15');await dialog.locator('[data-key="conditions.release_delay_seconds"]').fill('60');
  await dialog.locator('[data-key="start_on_high"]').check();
  await dialog.locator('[data-program-target="w"]').check();await dialog.locator('[data-program-target="east"]').check();
  assert.equal(await dialog.locator('.ride-editor').count(),4,'shared targets create activation and return actions per cover');
  assert.equal(await dialog.locator('[data-key="rides.0.sensor_rule"]').inputValue(),'legacy');
  assert.equal(await dialog.locator('[data-key="rides.2.sensor_rule"]').inputValue(),'east_sensors','each target retains its own assignment');
  assert.equal(await dialog.locator('[data-key="rides.2.tilt"]').count(),0,'shutters have no tilt field');
  const slider=async(index,value)=>dialog.locator(`[data-key="rides.${index}.position"]`).evaluate((el,value)=>{el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true,composed:true}));el.dispatchEvent(new Event('change',{bubbles:true,composed:true}));},value);
  await slider(0,40);await slider(2,30);
  await dialog.locator('[data-key="end_action"]').selectOption('fixed');
  await slider(1,90);await slider(3,75);
  await dialog.locator('[data-key="end_action"]').selectOption('restore');
  assert.equal(await dialog.locator('[data-key="rides.1.position"]').count(),0,'dynamic return has no fixed target slider');
  await dialog.getByRole('button',{name:'Alle zuklappen',exact:true}).click();
  assert.equal(await dialog.locator('.ride-editor-body:visible').count(),0);
  for(const width of [1100,390]){
   await page.setViewportSize({width,height:1000});
   await dialog.locator('[data-key="conditions.lux_on"]').scrollIntoViewIfNeeded();
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   assert.equal(await dialog.evaluate(el=>el.scrollWidth>el.clientWidth),false,'editor fits viewport');
   await page.screenshot({path:path.join(directory,`shading-${width}.png`),fullPage:true});
  }
  await dialog.getByRole('button',{name:'Speichern',exact:true}).click();await dialog.waitFor({state:'detached'});
  let saved=JSON.parse(fs.readFileSync(store)).config,program=saved.programs.find(p=>p.name==='Fassadenbeschattung'),pid=program.id;
  assert.deepEqual(program.targets,['w','east']);assert.equal(program.conditions.lux_on,35000);assert.equal(program.conditions.on_delay_seconds,15);
  assert.equal(program.rides[0].position,40);assert.equal(program.rides[2].position,30);assert.equal(program.rides[1].restore_before,true);
  assert.equal(saved.windows[0].sensor_rules[0].lux_on,undefined,'device contains no threshold fields');
  await open();await card.locator(`[data-action="edit-program"][data-program="${pid}"]`).click();
  assert.equal(await dialog.locator('[data-key="conditions.lux_on"]').inputValue(),'35000','programme survives backend and page restart');
  assert.equal(await dialog.locator('[data-program-target="east"]').isChecked(),true);
  await dialog.locator('[data-key="conditions.lux_off"]').fill('40000');
  await dialog.getByRole('button',{name:'Speichern',exact:true}).click();
  assert.match(await dialog.getByRole('alert').innerText(),/Freigabeschwellen/);
  assert.equal(await dialog.locator('[data-key="conditions.lux_off"]').inputValue(),'40000');
  await dialog.locator('[data-key="conditions.lux_off"]').fill('19000');await page.evaluate(()=>window.failNext=true);
  await dialog.getByRole('button',{name:'Speichern',exact:true}).click();assert.match(await dialog.getByRole('alert').innerText(),/Temporary save failure/);
  await page.evaluate(()=>window.dropConditions=true);
  await dialog.getByRole('button',{name:'Speichern',exact:true}).click();assert.match(await dialog.getByRole('alert').innerText(),/Speichern nicht bestätigt/);
  assert.equal(await dialog.locator('[data-key="conditions.lux_off"]').inputValue(),'19000','missing save confirmation retains full draft');
  await dialog.getByRole('button',{name:'Speichern',exact:true}).click();await dialog.waitFor({state:'detached'});
  await card.getByRole('button',{name:'Einstellungen',exact:true}).click();await card.getByRole('button',{name:'🇬🇧 EN',exact:false}).click();
  await card.getByRole('button',{name:'Programs',exact:true}).click();await card.locator(`[data-action="edit-program"][data-program="${pid}"]`).click();
  assert.equal(await dialog.getByRole('heading',{name:'Shared target covers',exact:true}).isVisible(),true);
  assert.equal(await dialog.getByRole('heading',{name:'Shading conditions',exact:true}).isVisible(),true);
  assert.equal(await dialog.getByRole('heading',{name:'End action',exact:true}).isVisible(),true);
  await dialog.getByRole('button',{name:'Cancel',exact:true}).click();
  await card.getByRole('button',{name:'Guide',exact:true}).click();
  assert.match(await card.locator('.howto').innerText(),/independently against its own assigned sensors/);
  assert.deepEqual(errors,[]);
  console.log('PASS: shared program conditions, per-cover assignments, target generation, all end actions, desktop/mobile layout, durable save/reload, validation, retry, save acknowledgement and English editor/guide.');
  console.log('Internal screenshots: '+directory);
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
