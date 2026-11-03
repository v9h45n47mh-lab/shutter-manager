/* Real browser + shipped config validator, with explicitly simulated HA I/O. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),version=JSON.parse(fs.readFileSync(path.join(root,'custom_components/light_manager/manifest.json'))).version;
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 const page=await browser.newPage({viewport:{width:1050,height:950},locale:'de-DE',hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(10000);
 await page.route('http://light-manager.test/**',r=>r.fulfill({contentType:'text/html',body:'<html lang="de"><style>body{margin:24px;background:#f1f5f9}light-manager-card{display:block;max-width:950px;margin:auto}</style><light-manager-card></light-manager-card></html>'}));
 await page.goto('http://light-manager.test');await page.addScriptTag({path:path.join(root,'custom_components/light_manager/frontend/light-manager-card.js')});
 await page.exposeFunction('validateConfig',c=>{const r=JSON.parse(execFileSync('python3',[path.join(__dirname,'validate_ui.py')],{input:JSON.stringify(c),encoding:'utf8'}));if(!r.ok)throw Error(r.error);});
 await page.evaluate(version=>{
  const lamp=(id,entity,name,extra={})=>({id,entity,name,rooms:[],zones:[],fallback:'off',members:[],is_group:false,...extra});
  const config={schema:4,vacation:false,sensors:[],lamps:[lamp('l1','light.one','Farbe',{rooms:['room']}),lamp('l2','light.two','Kitchen 2',{rooms:['room']}),lamp('lg','light.group','Sonnenuntergang',{is_group:true,members:['light.one','light.two']}),lamp('l3','light.three','Warm only')],rooms:[{id:'room',name:'Farbtemperatur'}],zones:[],programs:[{
   id:'p',name:'Sonnenaufgang',kind:'time',enabled:false,pause_in_vacation:false,days:[0,1,2,3,4,5,6],start:'00:00',end:'00:00',season_enabled:false,season_from:'',season_to:'',actions:[{id:'a',enabled:true,mode:'on',targets:['lg'],brightness:30,kelvin:null,rgb:null,event:'sunset',time:'18:00',offset:0,earliest:'17:00',latest:'20:00',sensors:[],delay:120,lux_entity:'',lux_on:80,lux_off:150,on_delay:120,skips:[]}]}]};
  const states={'light.one':{state:'off',attributes:{friendly_name:'Farbe',supported_color_modes:['color_temp','xy'],min_color_temp_kelvin:2000,max_color_temp_kelvin:6500}},
   'light.two':{state:'off',attributes:{friendly_name:'Kitchen 2',supported_color_modes:['color_temp','xy'],min_color_temp_kelvin:3000,max_color_temp_kelvin:5000}},
   'light.group':{state:'off',attributes:{friendly_name:'Sonnenuntergang',is_hue_group:true}},
   'light.three':{state:'off',attributes:{friendly_name:'Warm only',supported_color_modes:['color_temp'],min_color_temp_kelvin:2200,max_color_temp_kelvin:2700}}};
  window.host={config,states,revision:0,calls:[],version};
  window.fakeHass={user:{id:'alpha'},states,callWS:async m=>{host.calls.push(m);if(m.type==='light_manager/save'){await window.validateConfig(m.config);host.config=JSON.parse(JSON.stringify(m.config));host.revision++;}
   return {config:JSON.parse(JSON.stringify(host.config)),version:host.version,schema:4,revision:host.revision,catalog:Object.entries(states).map(([entity,s])=>({entity,name:s.attributes.friendly_name,state:s.state,attributes:s.attributes})),status:{},rules:[],warnings:[],history:[],planned:[],sun:{sunrise:'2026-11-02T06:20:00Z',sunset:'2026-11-02T16:08:00Z'},today:'2026-11-02',timezone:'Europe/Berlin'};}};
  document.querySelector('light-manager-card').hass=fakeHass;
 },version);
 const openTargets=async()=>{await openActions();return page.locator('[data-target-group] summary').evaluateAll(es=>es.forEach(e=>{if(!e.parentElement.open)e.click();}));}
 const openActions=async()=>page.locator('.action-fold[aria-expanded="false"]').evaluateAll(es=>es.forEach(e=>e.click()));
 const openSettings=async(section)=>{const button=page.locator(`[data-op="fold-settings"][data-section="${section}"]`);if(await button.getAttribute('aria-expanded')==='false')await button.click();};
 const openLampSections=async()=>page.locator('[data-lamp-section] summary').evaluateAll(es=>es.forEach(e=>{if(!e.parentElement.open)e.click();}));
 const b=op=>page.locator(`[data-op="${op}"]`),f=p=>page.locator(`[data-path="${p}"]`),target=id=>page.locator(`[data-array="actions.0.targets"][value="${id}"]`);
 await b('settings').click();await page.locator('[data-language="en"]').click();
 assert.deepEqual(await page.locator('.tabs button').allTextContents(),['Programs','Schedule','Sensor programs']);
 await b('guide').click();await page.getByRole('heading',{name:'Programs'}).waitFor();assert.ok(!(await page.locator('article.guide').innerText()).includes('Übergang'));
 await page.locator('[data-tab="programs"]').click();assert.equal(await page.locator('.program-title [data-user-content]').innerText(),'Sonnenaufgang');
 await b('expand').click();assert.equal(await page.locator('.action-info strong').innerText(),'Sonnenuntergang');
 const sunrise=await page.locator('[data-icon="sunrise"] path').getAttribute('d'),sunset=await page.locator('[data-icon="sunset"] path').getAttribute('d');
 assert.equal(sunrise,'M2 17h20M5 21h14M7 17a5 5 0 0 1 10 0M4 12l-2-2m18 2 2-2M12 9V2m-3 3 3-3 3 3');assert.equal(sunset,'M2 17h20M5 21h14M7 17a5 5 0 0 1 10 0M4 12l-2-2m18 2 2-2M12 2v7m-3-3 3 3 3-3');
 assert.equal(await page.locator('[data-icon="sunrise"]').evaluate(e=>getComputedStyle(e).strokeWidth),'1.7px');
 await b('edit').first().click();await openActions();await openTargets();assert.equal(await f('name').inputValue(),'Sonnenaufgang');
 assert.equal(await page.locator('[data-path$="transition"]').count(),0);
 assert.deepEqual(await page.locator('[data-colormode="0"] option').allTextContents(),['Last setting','White tones','Color']);
 await page.locator('[data-colormode="0"]').selectOption('white');let slider=page.locator('[data-white="0"]');
 assert.equal(await slider.getAttribute('data-min-kelvin'),'3000');assert.equal(await slider.getAttribute('data-max-kelvin'),'5000');
 const move=async value=>{await page.locator('[data-white="0"]').evaluate((e,v)=>{e.value=v;e.dispatchEvent(new Event('input',{bubbles:true,composed:true}));},String(value));};
 await slider.scrollIntoViewIfNeeded();await slider.focus();await slider.press('Home');assert.equal(await page.locator('[data-white-value="0"]').innerText(),'5000 K');await slider.press('End');assert.equal(await page.locator('[data-white-value="0"]').innerText(),'3000 K');
 await move(0);assert.equal(await page.locator('[data-white-value="0"]').innerText(),'5000 K');
 await move(2000);assert.equal(await page.locator('[data-white-value="0"]').innerText(),'3000 K');
 await page.screenshot({path:path.join(root,'../qa-white-en.png'),fullPage:true});
 await b('commit').click();assert.equal(await page.evaluate(()=>host.config.programs[0].actions[0].kelvin),3000);
 // A room resolves the same two members; the shared range remains correct.
 await b('edit').first().click();await openActions();await openTargets();await target('lg').uncheck();await target('room').check();assert.equal(await page.locator('[data-white="0"]').getAttribute('data-min-kelvin'),'3000');
 await target('l3').check();assert.equal(await page.locator('[data-white="0"]').isDisabled(),true);await b('commit').click();
 await page.getByRole('alert').filter({hasText:'no shared white-tone range'}).waitFor();await target('l3').uncheck();
 await page.locator('[data-colormode="0"]').selectOption('color');const wheel=page.locator('[data-wheel="0"]');await wheel.scrollIntoViewIfNeeded();await wheel.focus();await wheel.press('Home');assert.equal(await page.locator('[data-colour-value="0"]').innerText(),'#FFFFFF');const box=await wheel.boundingBox();await page.mouse.click(box.x+box.width/2,box.y+1);assert.ok((await page.locator('[data-colour-value="0"]').innerText()).startsWith('#FF'));await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width+60,box.y+box.height/2,{steps:8});await page.mouse.up();assert.equal(await wheel.locator('.colour-marker').evaluate(e=>e.style.left),'100%');await page.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);assert.equal(await page.locator('[data-colour-value="0"]').innerText(),'#FFFFFF');await wheel.press('ArrowLeft');await wheel.press('ArrowDown');const selectedRgb=await page.evaluate(()=>document.querySelector('light-manager-card').editor.value.actions[0].rgb);await b('commit').click();
 assert.deepEqual(await page.evaluate(()=>host.config.programs[0].actions[0].rgb),selectedRgb);assert.equal(await page.evaluate(()=>host.config.programs[0].actions[0].kelvin),null);
 await b('edit').first().click();await openActions();await openTargets();await page.locator('[data-wheel="0"]').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(root,'../qa-wheel-en-022.png'),fullPage:true});await page.setViewportSize({width:390,height:844});await page.locator('[data-wheel="0"]').scrollIntoViewIfNeeded();assert.equal(await page.evaluate(()=>{const m=document.querySelector('light-manager-card').shadowRoot.querySelector('.modal');return m.scrollWidth>m.clientWidth;}),false);await page.screenshot({path:path.join(root,'../qa-wheel-mobile-022.png'),fullPage:true});await page.evaluate(()=>{document.body.style.setProperty('--ha-card-background','#1c1c1c');document.body.style.setProperty('--primary-text-color','#eee');document.body.style.setProperty('--secondary-text-color','#aaa');document.body.style.setProperty('--divider-color','#444');document.body.style.setProperty('--secondary-background-color','#282828');});await page.screenshot({path:path.join(root,'../qa-wheel-dark-022.png'),fullPage:true});await page.evaluate(()=>document.body.removeAttribute('style'));await page.setViewportSize({width:1050,height:950});await page.locator('[data-colormode="0"]').selectOption('last');await b('commit').click();
 assert.equal(await page.evaluate(()=>host.config.programs[0].actions[0].rgb),null);assert.equal(await page.evaluate(()=>host.config.programs[0].actions[0].kelvin),null);
 // Server-side validation errors are translated while retaining the draft.
 await b('edit').first().click();await openActions();await openTargets();await target('room').uncheck();await b('commit').click();await page.getByRole('alert').filter({hasText:'Select managed lights, rooms or zones.'}).waitFor();assert.equal(await f('name').inputValue(),'Sonnenaufgang');await b('cancel').last().click();
 // New card, same user: EN is restored. Another HA user gets the default DE.
 await page.evaluate(async()=>{const card=document.createElement('light-manager-card');document.querySelector('light-manager-card').replaceWith(card);card.hass=fakeHass;await card.refresh();});
 await page.getByRole('button',{name:'Programs',exact:true}).waitFor();await b('settings').click();assert.equal(await page.locator('[data-language="en"]').getAttribute('aria-pressed'),'true');
 await page.evaluate(async()=>{const card=document.querySelector('light-manager-card');card.hass={...fakeHass,user:{id:'beta'}};await card.refresh();});
 await page.getByRole('button',{name:'Programme',exact:true}).waitFor();assert.equal(await page.locator('[data-language="de"]').getAttribute('aria-pressed'),'true');
 await page.locator('[data-language="en"]').click();await page.locator('[data-tab="programs"]').click();await b('edit').first().click();await openActions();await openTargets();await page.locator('[data-colormode="0"]').selectOption('white');
 await page.setViewportSize({width:390,height:844});await page.locator('[data-white="0"]').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(root,'../qa-white-mobile.png'),fullPage:true});
 assert.equal(await page.evaluate(()=>{const m=document.querySelector('light-manager-card').shadowRoot.querySelector('.modal');return m.scrollWidth>m.clientWidth;}),false);
 assert.deepEqual(errors,[]);console.log('Color/language UI OK: exact sun SVGs; shared Kelvin ranges for Hue groups and rooms; cool→warm; RGB; last setting; English guide/errors; user-specific language persistence; names preserved; 390px layout.');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
