/* Multiple real cards and their editor against production WS/storage fixtures. */
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {serveFamilyUI,frontend}=require('./frontend.cjs');
(async()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'shutter-instances-')),store=path.join(directory,'store.json');let role='admin';
 const call=message=>JSON.parse(execFileSync('python3',[path.join(__dirname,'manual_host.py'),store,JSON.stringify({...message,fixture_role:role})],{encoding:'utf8',env:process.env}));
 const request=message=>{const reply=call(message);if(!reply.ok)throw new Error(reply.error);assert.equal(reply.calls.length,0,'settings and reads never move a device');return reply.snapshot;};
 const browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 try{
  const page=await browser.newPage({viewport:{width:1100,height:1000},locale:'de-DE'}),errors=[];page.setDefaultTimeout(15000);page.on('pageerror',error=>errors.push(error.message));
  await page.exposeFunction('backend',message=>request(message));
  await page.route('http://instances.test/**',async route=>{
   if(await serveFamilyUI(route))return;
   if(new URL(route.request().url()).pathname==='/manual.js')return route.fulfill({contentType:'application/javascript',body:fs.readFileSync(path.join(frontend,'shutter-manual-card.js'))});
   return route.fulfill({contentType:'text/html',body:'<html lang="de"><meta charset="utf-8"><style>body{margin:8px;--primary-color:#81d2eb;--primary-text-color:#212121;--secondary-text-color:#727272;--text-primary-color:#18333e;--card-background-color:#fff;--ha-card-background:#fff;--divider-color:#ddd;--secondary-background-color:#f5f5f5;--ha-font-family-body:Arial,sans-serif}shutter-manual-card{display:block;max-width:1000px;margin:auto}</style><script type="module" src="/manual.js"></script><shutter-manual-card id="first"></shutter-manual-card><shutter-manual-card id="second"></shutter-manual-card></html>'});
  });
  await page.goto('http://instances.test');await page.waitForFunction(()=>customElements.get('shutter-manual-card'));
  const configs=await page.evaluate(()=>[customElements.get('shutter-manual-card').getStubConfig(),customElements.get('shutter-manual-card').getStubConfig()]);
  assert.notEqual(configs[0].card_id,configs[1].card_id);assert.ok(configs.every(config=>/^manual_[a-f0-9]{32}$/.test(config.card_id)));
  const a={selected:['w'],mode:'presets',columns:'1',height_values:[0,25,50,100],tilt_values:[0,50,100],names:{},show_controls:true},b={selected:['bad','max'],mode:'sliders',columns:'2',height_values:[10,90],tilt_values:[25,75],names:{},show_controls:false};
  for(const [index,settings] of [[0,a],[1,b]])request({type:'rollladenplaner/manual/save',card_id:configs[index].card_id,card_revision:0,settings});
  const seed=fs.readFileSync(store,'utf8'),first=page.locator('#first'),second=page.locator('#second'),results=path.resolve(__dirname,'../.ci/ui-kit-results');fs.mkdirSync(results,{recursive:true});
  async function open(){
   await page.goto('http://instances.test');await page.waitForFunction(()=>customElements.get('shutter-manual-card'));
   await page.evaluate(({configs,role})=>{window.cards=[document.querySelector('#first'),document.querySelector('#second')];for(let index=0;index<cards.length;index++){const card=cards[index];card.setConfig(configs[index]);card.hass={user:{id:'instances',is_admin:role==='admin'},locale:{language:'de'},states:{},callWS:message=>window.backend(message)};clearInterval(card.timer);}}, {configs,role});
   await page.waitForFunction(()=>cards.every(card=>card.loaded));
  }
  const selected=card=>card.locator('[data-manual-device]').evaluateAll(elements=>elements.map(element=>element.dataset.manualDevice));
  async function rename(card,id,value){await card.locator(`#manual-selected-order [data-action="edit-name"][data-device="${id}"]`).click();await card.locator('#manual-cover-name').fill(value);await card.locator('#manual-name-dialog footer').getByRole('button',{name:'Übernehmen',exact:true}).click();await card.locator('#manual-name-dialog').waitFor({state:'detached'});}
  const applyTheme=appearance=>page.evaluate(appearance=>{const dark=appearance==='dark';for(const [key,value] of Object.entries({'--primary-color':dark?'#90caf9':'#81d2eb','--primary-text-color':dark?'#eee':'#212121','--secondary-text-color':dark?'#aaa':'#727272','--text-primary-color':dark?'#102030':'#18333e','--card-background-color':dark?'#202124':'#fff','--ha-card-background':dark?'#202124':'#fff','--secondary-background-color':dark?'#303134':'#f5f5f5','--divider-color':dark?'#444':'#ddd'}))document.body.style.setProperty(key,value);document.body.style.background=dark?'#121212':'#f5f7fa';document.documentElement.style.colorScheme=appearance;},appearance);
  for(const appearance of ['light','dark'])for(const width of [320,390,1100]){
   role='admin';fs.writeFileSync(store,seed);await page.setViewportSize({width,height:1000});await open();
   await applyTheme(appearance);
   assert.deepEqual(await selected(first),['w']);assert.deepEqual(await selected(second),['bad','max']);
   assert.equal(await first.locator('input[type="range"]').count(),0);assert.equal(await second.locator('input[type="range"]').count(),2);
   assert.equal(await first.locator('.manual-transport').count(),1);assert.equal(await second.locator('.manual-transport').count(),0,'arrow visibility is configured per card');
   await first.getByRole('button',{name:'Einstellungen',exact:true}).click();await first.locator('#manual-devices input[value="bad"]').check();
   await rename(first,'bad','Bad unten');assert.deepEqual(request({type:'rollladenplaner/manual/get',card_id:configs[0].card_id}).settings.names,{},'name editing remains a draft until the main Apply');
   if(appearance==='light'&&width===320){await rename(first,'bad','');assert.equal(await first.locator('[data-manual-selected="bad"] .row-text strong').innerText(),'Rollladen Bad');await rename(first,'bad','Bad unten');}
   await first.locator('#manual-columns').selectOption('2');await first.locator('#manual-selected-order [data-program="bad"]').focus();await page.keyboard.press('Home');
   await first.locator('#manual-dialog footer').getByRole('button',{name:'Übernehmen',exact:true}).click();await first.locator('#manual-dialog').waitFor({state:'detached'});
   assert.deepEqual(await selected(first),['bad','w']);assert.deepEqual(await selected(second),['bad','max']);assert.equal(await second.locator('input[type="range"]').count(),2);
   assert.deepEqual(request({type:'rollladenplaner/manual/get',card_id:configs[1].card_id}).settings,b,'saving the first card never changes the second profile');
   await second.getByRole('button',{name:'Einstellungen',exact:true}).click();await rename(second,'bad','Bad oben');await second.locator('#manual-mode').selectOption('presets');await second.locator('#manual-selected-order [data-program="max"]').focus();await page.keyboard.press('Home');await second.locator('#manual-dialog footer').getByRole('button',{name:'Übernehmen',exact:true}).click();await second.locator('#manual-dialog').waitFor({state:'detached'});
   await first.evaluate(card=>card.refresh());assert.deepEqual(await selected(first),['bad','w']);assert.deepEqual(await selected(second),['max','bad']);
   const storedA=request({type:'rollladenplaner/manual/get',card_id:configs[0].card_id}).settings;assert.deepEqual(storedA.selected,['bad','w']);assert.deepEqual(storedA.tilt_values,a.tilt_values);
   await open();await applyTheme(appearance);assert.deepEqual(await selected(first),['bad','w']);assert.deepEqual(await selected(second),['max','bad']);
   assert.equal(await first.locator('.manual-transport').count(),2);assert.equal(await second.locator('.manual-transport').count(),0);
   await second.getByRole('button',{name:'Einstellungen',exact:true}).click();await second.getByRole('switch',{name:'Fahrpfeile und Stopp anzeigen',exact:true}).click();await second.locator('#manual-dialog footer').getByRole('button',{name:'Übernehmen',exact:true}).click();await second.locator('#manual-dialog').waitFor({state:'detached'});assert.equal(await second.locator('.manual-transport').count(),2);assert.equal(await first.locator('.manual-transport').count(),2);
   await second.getByRole('button',{name:'Einstellungen',exact:true}).click();await second.getByRole('switch',{name:'Fahrpfeile und Stopp anzeigen',exact:true}).click();await second.locator('#manual-dialog footer').getByRole('button',{name:'Übernehmen',exact:true}).click();await second.locator('#manual-dialog').waitFor({state:'detached'});assert.equal(await second.locator('.manual-transport').count(),0);
   assert.equal(await first.locator('[data-manual-device="bad"] .row-text strong').first().innerText(),'Bad unten');assert.equal(await second.locator('[data-manual-device="bad"] .row-text strong').first().innerText(),'Bad oben');
   assert.equal(request({type:'rollladenplaner/get'}).config.windows.find(window=>window.id==='bad').name,'Rollladen Bad','per-card display names do not rename the integration cover');
   await first.locator('[data-manual-device="bad"] [data-action="plan"]').click();assert.equal(await first.locator('#manual-plan-form .row-text strong').first().innerText(),'Bad unten');await first.locator('#manual-dialog footer').getByRole('button',{name:'Abbrechen',exact:true}).click();await first.locator('#manual-dialog').waitFor({state:'detached'});
   assert.deepEqual(await first.locator('#height-bad-control .manual-values button').allTextContents(),['Oben','50 %','25 %','Unten']);assert.deepEqual(await second.locator('#height-bad-control .manual-values button').allTextContents(),['90 %','10 %']);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await page.screenshot({path:path.join(results,`manual-instances-${appearance}-${width}.png`),fullPage:true});
  }
  // A late reply from the old profile must not populate a retargeted element.
  role='admin';fs.writeFileSync(store,seed);await open();
  await page.evaluate(async configs=>{
   const first=cards[0],old=first._hass.callWS,snapshot=await old({type:'rollladenplaner/manual/get',card_id:configs[0].card_id});
   let hold=true;first._hass={...first._hass,callWS:message=>hold&&message.card_id===configs[0].card_id?new Promise(resolve=>window.finishLate=()=>{hold=false;resolve(snapshot);}):old(message)};
   first.refresh();first.openSetup(null);first.setConfig(configs[1]);window.finishLate();
  },configs);
  await page.waitForFunction(expected=>cards[0].loaded&&cards[0].data.card_id===expected,configs[1].card_id);assert.deepEqual(await selected(first),['bad','max']);assert.equal(await first.locator('dialog').count(),0);
  // The visual editor can detach a copied card without altering either source.
  await page.evaluate(config=>{window.changes=[];window.editor=document.createElement('shutter-manual-card-editor');editor.setConfig(config);editor.hass={user:{is_admin:true},locale:{language:'de'}};editor.addEventListener('config-changed',event=>changes.push(event.detail.config));document.body.append(editor);},configs[0]);
  const editor=page.locator('shutter-manual-card-editor');await editor.getByRole('button',{name:'Neue Konfiguration',exact:true}).click();
  const changed=await page.evaluate(()=>changes[0]);assert.ok(changed.card_id!==configs[0].card_id&&changed.card_id!==configs[1].card_id);assert.deepEqual(request({type:'rollladenplaner/manual/get',card_id:configs[0].card_id}).settings,a);assert.deepEqual(request({type:'rollladenplaner/manual/get',card_id:changed.card_id}).settings.selected,[]);
  await page.evaluate(()=>{window.oldButton=editor.shadowRoot.querySelector('button');editor.hass={user:{is_admin:false},locale:{language:'de'}};oldButton.click();});assert.equal(await page.evaluate(()=>changes.length),1);assert.equal(await editor.locator('button,input').count(),0);
  role='reader';await open();assert.equal(await page.locator('shutter-manual-card [data-action="navigate"]').count(),0);
  assert.equal(call({type:'rollladenplaner/manual/save',card_id:configs[0].card_id,card_revision:1,settings:a}).ok,false);
  assert.deepEqual(errors,[]);
  console.log('PASS: two simultaneous cards with independent selections, order, modes, descending presets and display names; aliases persist per card, stay draft until Apply, reset when empty and do not rename the integration cover; stale-reply/copy guards and 320/390/1100px light/dark views.');
 }finally{await browser.close();fs.rmSync(directory,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exitCode=1;});
