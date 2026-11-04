/* Actual settings DOM and durable Python backend; no real HA devices are called. */
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
(async()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'shutter-settings-')),store=path.join(directory,'store.json');
 const extras={'sensor.new_temperature':{state:'21',attributes:{friendly_name:'Neue Temperatur'}},'binary_sensor.new_contact':{state:'off',attributes:{friendly_name:'Neuer Kontakt'}}};
 const call=message=>JSON.parse(execFileSync('python3',[path.join(__dirname,'save_host.py'),store,JSON.stringify({...message,fixture_states:extras})],{env:process.env,encoding:'utf8'}));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 try{
  const page=await browser.newPage({viewport:{width:1100,height:1100}}),errors=[];page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));
  await page.exposeFunction('backend',msg=>{const r=call(msg);assert.equal(r.motor_calls,0);return r;});
  await page.route('http://settings.test/**',async route=>{
   if(route.request().url().endsWith('/card.js'))await route.fulfill({contentType:'application/javascript',body:fs.readFileSync(path.join(__dirname,'../custom_components/rollladenplaner/frontend/shutter-manager-card.js'),'utf8')});
   else await route.fulfill({contentType:'text/html',body:'<html lang="de"><meta charset="utf-8"><style>body{margin:8px;background:#fff;--primary-color:#81d2eb;--text-primary-color:#18333e;--primary-text-color:#212121;--secondary-text-color:#727272;--divider-color:#e4e4e4}shutter-manager-card{display:block;max-width:490px;margin:auto}</style><script type="module" src="/card.js"></script><shutter-manager-card></shutter-manager-card></html>'});
  });
  async function open(){
   await page.goto('http://settings.test');await page.waitForFunction(()=>customElements.get('shutter-manager-card'));
   await page.evaluate(async()=>{const r=await backend({type:'rollladenplaner/get'});window.host={user:{id:'settings-test'},states:r.states,callWS:async msg=>{const result=await backend(msg);if(!result.ok)throw new Error(result.error);return result.snapshot;}};const c=document.querySelector('shutter-manager-card');c.setConfig({type:'custom:shutter-manager-card'});c.hass=host;});
   await page.locator('shutter-manager-card').getByRole('button',{name:'Einstellungen',exact:true}).click();
  }
  const card=page.locator('shutter-manager-card'),dialog=card.getByRole('dialog');await open();
  for(const width of [1100,390]){
   await page.setViewportSize({width,height:1100});
   assert.equal(await card.getByRole('button',{name:'Rollläden auswählen',exact:true}).isVisible(),true);
   assert.equal(await card.getByRole('button',{name:'Sensoren auswählen',exact:true}).isVisible(),true);
   assert.equal(await card.locator('#settings-sensors-content').isVisible(),false);
   const language=await card.locator('.language-group h3').boundingBox(),picker=await card.locator('.language-picker').boundingBox();
   assert.ok(Math.abs((language.y+language.height/2)-(picker.y+picker.height/2))<3,'language controls align on one horizontal row');
   for(const section of ['covers','sensors']){
    const row=card.locator(`button.settings-fold[data-section="${section}"]`).locator('..');
    const title=await row.locator('.settings-fold').boundingBox(),action=await row.locator('.settings-select').boundingBox();
    assert.ok(action.x>title.x && Math.abs((title.y+title.height/2)-(action.y+action.height/2))<3,'selection button is on the right in the same row');
   }
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await page.screenshot({path:path.join(directory,`settings-${width}.png`),fullPage:true});
  }
  await card.getByRole('button',{name:'Sensoren auswählen',exact:true}).click();
  await dialog.locator('[data-sensor-search]').fill('Neue Temperatur');
  await dialog.locator('[data-sensor-choice="sensor.new_temperature"]').check();
  await dialog.locator('[data-sensor-search]').fill('');
  assert.equal(await dialog.locator('[data-sensor-choice="sensor.temp"]').isDisabled(),true,'referenced sensors cannot be removed');
  await dialog.locator('[data-sensor-choice="binary_sensor.new_contact"]').check();
  await dialog.getByRole('button',{name:'Speichern',exact:true}).click();await dialog.waitFor({state:'detached'});
  assert.ok(JSON.parse(fs.readFileSync(store)).config.sensors.includes('sensor.new_temperature'));
  await open();await card.locator('.settings-fold[data-section="sensors"]').click();
  assert.equal(await card.locator('#settings-sensors-content').getByText('Neue Temperatur',{exact:true}).isVisible(),true,'selection survives complete page and backend reload');
  await card.getByRole('button',{name:'Sensoren auswählen',exact:true}).click();
  await dialog.locator('[data-sensor-choice="sensor.new_temperature"]').uncheck();
  await dialog.getByRole('button',{name:'Abbrechen',exact:true}).click();
  assert.ok(JSON.parse(fs.readFileSync(store)).config.sensors.includes('sensor.new_temperature'),'cancel discards draft');
  await card.getByRole('button',{name:'Sensoren auswählen',exact:true}).click();
  await dialog.locator('[data-sensor-choice="sensor.new_temperature"]').uncheck();
  await dialog.getByRole('button',{name:'Speichern',exact:true}).click();await dialog.waitFor({state:'detached'});
  assert.ok(!JSON.parse(fs.readFileSync(store)).config.sensors.includes('sensor.new_temperature'),'unused selected sensor can be removed');
  await card.getByRole('button',{name:'🇬🇧 EN',exact:false}).click();
  assert.equal(await card.getByRole('button',{name:'Select sensors',exact:true}).isVisible(),true);
  await card.getByRole('button',{name:'🇩🇪 DE',exact:false}).click();
  await card.getByRole('button',{name:'Sensoren auswählen',exact:true}).click();
  await dialog.locator('[data-sensor-choice="sensor.new_temperature"]').check();
  await dialog.getByRole('button',{name:'Speichern',exact:true}).click();await dialog.waitFor({state:'detached'});
  await card.locator('.settings-fold[data-section="covers"]').click();
  await card.locator('.window').filter({hasText:'cover.wohnen'}).getByRole('button',{name:'Bearbeiten',exact:true}).click();
  await dialog.getByRole('button',{name:'+ Sensorzuordnung',exact:true}).click();
  await dialog.locator('[data-key="sensor_rules.1.name"]').fill('Neue Temperaturregel');
  await dialog.locator('[data-key="sensor_rules.1.temp_entity"]').selectOption('sensor.new_temperature');
  await dialog.getByRole('button',{name:'Speichern',exact:true}).click();await dialog.waitFor({state:'detached'});
  assert.equal(JSON.parse(fs.readFileSync(store)).config.windows[0].sensor_rules[1].temp_entity,'sensor.new_temperature','centrally selected sensor can be assigned and saved in a cover rule');
  await open();await card.getByRole('button',{name:'Sensoren auswählen',exact:true}).click();
  assert.equal(await dialog.locator('[data-sensor-choice="sensor.new_temperature"]').isDisabled(),true,'a sensor used in a persisted rule is protected from removal');
  await dialog.getByRole('button',{name:'Abbrechen',exact:true}).click();
  assert.deepEqual(errors,[]);
  console.log('PASS: desktop/mobile settings match the reference row layout; central sensor selection, search, save, reload, cancel, removal and English controls work with the actual Python backend.');
  console.log('Internal screenshots: '+directory);
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
