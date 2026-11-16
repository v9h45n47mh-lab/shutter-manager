/* Actual manual-card UI, original Kit and production WebSocket/store fixtures. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {execFileSync}=require('node:child_process');
const {serveFamilyUI,frontend}=require('./frontend.cjs');
(async()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'shutter-manual-')),store=path.join(directory,'store.json');
 let role='admin',denied=[],now='2026-11-16T12:00';
 const call=message=>JSON.parse(execFileSync('python3',[path.join(__dirname,'manual_host.py'),store,JSON.stringify({...message,fixture_role:role,fixture_now:now,fixture_denied:denied})],{encoding:'utf8',env:process.env}));
 const request=message=>{const result=call(message);if(!result.ok)throw new Error(result.error);return result;};
 request({type:'rollladenplaner/manual/get',card_id:'default'});
 const settings={selected:['w','bad'],mode:'presets',height_values:[0,25,50,100],tilt_values:[0,50,100],columns:'auto'};
 request({type:'rollladenplaner/manual/save',card_id:'default',card_revision:0,settings});
 const seed=fs.readFileSync(store,'utf8');
 const browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 try{
  const page=await browser.newPage({viewport:{width:1100,height:1000},timezoneId:'America/Los_Angeles',locale:'de-DE'}),errors=[];
  page.setDefaultTimeout(12000);page.on('pageerror',error=>errors.push(error.message));
  await page.exposeFunction('backend',message=>request(message).snapshot);
  await page.route('http://manual.test/**',async route=>{
   if(await serveFamilyUI(route))return;
   if(new URL(route.request().url()).pathname==='/manual.js')return route.fulfill({contentType:'application/javascript',body:fs.readFileSync(path.join(frontend,'shutter-manual-card.js'))});
   return route.fulfill({contentType:'text/html',body:'<html lang="de"><meta charset="utf-8"><style>body{margin:8px;--primary-color:#81d2eb;--primary-text-color:#212121;--secondary-text-color:#727272;--text-primary-color:#18333e;--card-background-color:#fff;--ha-card-background:#fff;--divider-color:#ddd;--ha-font-family-body:Arial,sans-serif}shutter-manual-card{display:block;max-width:1000px;margin:auto}</style><script type="module" src="/manual.js"></script><shutter-manual-card></shutter-manual-card></html>'});
  });
  const card=page.locator('shutter-manual-card'),results=path.resolve(__dirname,'../.ci/ui-kit-results');fs.mkdirSync(results,{recursive:true});
  async function open(config={}){
   await page.goto('http://manual.test');await page.waitForFunction(()=>customElements.get('shutter-manual-card'));
   await page.evaluate(({config,role})=>{window.requests=[];window.card=document.querySelector('shutter-manual-card');card.setConfig({type:'custom:shutter-manual-card',card_id:'default',...config});card.hass={user:{id:'test',is_admin:role==='admin'},locale:{language:'de'},states:{},config:{time_zone:'Europe/Berlin'},callWS:async message=>{requests.push(message);return window.backend(message);}};clearInterval(card.timer);},{config,role});
   await page.waitForFunction(()=>card.loaded||card.error);
  }
  async function theme(name){await page.evaluate(name=>{const dark=name==='dark';for(const [key,value] of Object.entries({'--primary-color':dark?'#90caf9':'#81d2eb','--primary-text-color':dark?'#eee':'#212121','--secondary-text-color':dark?'#aaa':'#727272','--text-primary-color':dark?'#102030':'#18333e','--card-background-color':dark?'#202124':'#fff','--ha-card-background':dark?'#202124':'#fff','--secondary-background-color':dark?'#303134':'#f5f5f5','--divider-color':dark?'#444':'#ddd','--error-color':dark?'#ef5350':'#db4437'}))document.body.style.setProperty(key,value);document.body.style.background=dark?'#121212':'#f5f7fa';document.documentElement.style.colorScheme=name;},name);}
  async function setup(){await card.getByRole('button',{name:'Einstellungen',exact:true}).click();await card.locator('#manual-dialog[open]').waitFor();}
  async function apply(){await card.locator('#manual-dialog footer').getByRole('button',{name:'Übernehmen',exact:true}).click();await card.locator('#manual-dialog').waitFor({state:'detached'});}
  for(const appearance of ['light','dark'])for(const width of [320,390,1100]){
   role='admin';denied=[];fs.writeFileSync(store,seed);await page.setViewportSize({width,height:1000});await open();await theme(appearance);
   assert.equal(await card.locator('[data-manual-device]').count(),2);assert.equal(await card.locator('h1,h2,h3').count(),0);
   assert.equal(await card.locator('[data-manual-device="bad"]').getByText('Lamellen',{exact:true}).count(),0);
   const reference=await page.evaluate(async()=>{
    const kit=await import('/family-ui/1.7.0/family-ui.js'),host=document.createElement('div');document.body.append(host);const shadow=host.attachShadow({mode:'open'});
    shadow.innerHTML=`<style>${kit.UI_CSS}</style>${kit.button({label:'25 %',action:'reference',compact:true})}`;
    const read=element=>{const s=getComputedStyle(element);return {font:s.fontFamily,size:s.fontSize,weight:s.fontWeight,color:s.color,padding:s.padding,border:s.borderRadius,height:s.minHeight};};
    const actual=card.shadowRoot.querySelector('#height-w-control .manual-values button[data-value="25"]');
    const metrics={css:card.shadowRoot.querySelector('[data-ui-kit]').textContent===kit.UI_CSS,actual:read(actual),reference:read(shadow.querySelector('button')),line:getComputedStyle(card.shadowRoot.querySelector('#height-w-control .setting-row')).borderBottomWidth,columns:getComputedStyle(card.shadowRoot.querySelector('.manual-devices')).gridTemplateColumns.split(' ').length,widths:[...actual.parentElement.children].map(button=>button.getBoundingClientRect().width),overflow:document.documentElement.scrollWidth>innerWidth};host.remove();return metrics;
   });
   assert.equal(reference.css,true);assert.deepEqual(reference.actual,reference.reference);assert.equal(reference.line,'0px');assert.equal(reference.columns,width<600?1:2);assert.equal(reference.overflow,false);assert.ok(Math.max(...reference.widths)-Math.min(...reference.widths)<1);
   await page.screenshot({path:path.join(results,`manual-${appearance}-${width}.png`),fullPage:true});await setup();
   const height=card.locator('#manual-height-values'),tilt=card.locator('#manual-tilt-values');
   assert.equal(await height.locator('.manual-preset-entry').count(),4);assert.equal(await height.getByRole('button',{name:'Wert hinzufügen',exact:true}).isDisabled(),true);assert.equal(await height.locator('[data-action="remove-value"]').count(),4);
   await tilt.getByRole('button',{name:'Wert hinzufügen',exact:true}).click();await card.locator('#manual-preset-value').fill('75');await card.locator('#manual-value-dialog footer').getByRole('button',{name:'Hinzufügen',exact:true}).click();await card.locator('#manual-value-dialog').waitFor({state:'detached'});
   assert.equal(await tilt.locator('.manual-preset-entry').count(),4);assert.equal(await tilt.getByRole('button',{name:'Wert hinzufügen',exact:true}).isDisabled(),true);
   await height.getByRole('button',{name:'25 %',exact:true}).click();await card.locator('#manual-preset-value').fill('50');await card.locator('#manual-value-dialog footer').getByRole('button',{name:'Übernehmen',exact:true}).click();assert.equal(await card.locator('#manual-value-dialog').getByRole('alert').count(),1);
   await card.locator('#manual-preset-value').fill('30');await card.locator('#manual-value-dialog footer').getByRole('button',{name:'Übernehmen',exact:true}).click();await card.locator('#manual-value-dialog').waitFor({state:'detached'});
   await height.getByRole('button',{name:'Entfernen · 100 %',exact:true}).click();await height.getByRole('button',{name:'Wert hinzufügen',exact:true}).click();await card.locator('#manual-preset-value').fill('90');await card.locator('#manual-value-dialog footer').getByRole('button',{name:'Hinzufügen',exact:true}).click();await card.locator('#manual-value-dialog').waitFor({state:'detached'});
   assert.deepEqual(JSON.parse(fs.readFileSync(store)).manual_cards.default.settings.height_values,[0,25,50,100]);await page.screenshot({path:path.join(results,`manual-settings-${appearance}-${width}.png`),fullPage:true});await apply();assert.deepEqual(JSON.parse(fs.readFileSync(store)).manual_cards.default.settings.height_values,[0,30,50,90]);
   await card.locator('#height-w-control').getByRole('button',{name:'30 %',exact:true}).click();await page.waitForFunction(()=>card.data.available.find(device=>device.id==='w').position===30);assert.equal(await card.locator('#height-w-control button[data-value="30"]').getAttribute('aria-pressed'),'true');
   await card.locator('[data-manual-device="w"] [data-action="plan"]').click();await card.locator('#manual-dialog[open]').waitFor();if(width===1100)assert.ok((await card.locator('#manual-dialog').boundingBox()).width<=420);
   await card.locator('#manual-minutes').fill('15');await card.locator('#plan-position-control').getByRole('button',{name:'90 %',exact:true}).click();assert.match(await card.locator('[data-manual-start]').innerText(),/12:15/,'planning uses the HA clock and timezone even if the browser clock differs');await page.screenshot({path:path.join(results,`manual-plan-${appearance}-${width}.png`),fullPage:true});
   await card.locator('#manual-dialog footer').getByRole('button',{name:'Einplanen',exact:true}).click();await card.locator('#manual-dialog').waitFor({state:'detached'});
   const schedule=request({type:'rollladenplaner/get'}).snapshot;assert.equal(schedule.planned.filter(row=>row.one_time&&row.position===90).length,1);assert.equal(schedule.config.programs.length,0);
   await setup();await card.locator('#manual-mode').selectOption('sliders');assert.equal(await card.locator('#manual-presets').isHidden(),true);await apply();assert.equal(await card.locator('input[type="range"]').count(),3);
   await card.locator('[data-manual-device="bad"] input[type="range"]').evaluate(input=>{input.value='45';input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));});await page.waitForFunction(()=>card.data.available.find(device=>device.id==='bad').position===45);
   await card.getByRole('button',{name:'Stopp · Jalousie Essen',exact:true}).click();assert.equal(await page.evaluate(()=>requests.filter(message=>message.action==='stop').length),1);
  }
  for(const currentRole of ['reader','operator','manager']){
   role=currentRole;fs.writeFileSync(store,seed);await open();assert.equal(await card.getByRole('button',{name:'Einstellungen',exact:true}).count(),0);assert.equal(await card.getByRole('button',{name:'Hoch · Rollladen Bad',exact:true}).isDisabled(),role==='reader');
   const saved=JSON.parse(fs.readFileSync(store)).manual_cards;await page.evaluate(()=>card.onAction({action:'save-settings'}));assert.deepEqual(JSON.parse(fs.readFileSync(store)).manual_cards,saved);
   assert.equal(call({type:'rollladenplaner/manual/save',card_id:'default',card_revision:1,settings}).ok,false);
   if(role!=='reader'){await card.getByRole('button',{name:'Runter · Rollladen Bad',exact:true}).click();await page.waitForFunction(()=>card.data.available.find(device=>device.id==='bad').position===0);}
  }
  role='operator';denied=['cover.bad'];fs.writeFileSync(store,seed);await open();assert.equal(await card.locator('[data-manual-device="bad"]').count(),0);assert.equal(call({type:'rollladenplaner/manual/action',card_id:'default',target:'bad',action:'up'}).ok,false);
  role='admin';denied=[];fs.writeFileSync(store,seed);await open({language:'en'});await card.locator('[data-manual-device="w"] [data-action="plan"]').click();assert.equal(await card.getByRole('heading',{name:'Plan one-time movement',exact:true}).count(),1);await card.getByRole('button',{name:'Time',exact:true}).click();await card.locator('#manual-clock').fill('13:15');await card.locator('#manual-dialog footer').getByRole('button',{name:'Schedule',exact:true}).click();await card.locator('#manual-dialog').waitFor({state:'detached'});assert.match(request({type:'rollladenplaner/get'}).snapshot.planned.find(row=>row.one_time).time,/12:15:00/);
  const saved=JSON.parse(fs.readFileSync(store));saved.config.windows[0].name='<img src=x onerror=alert(1)>';fs.writeFileSync(store,JSON.stringify(saved));await page.evaluate(()=>card.refresh());assert.equal(await card.locator('img,script').count(),0);
  const source=fs.readFileSync(path.join(frontend,'shutter-manual-card.js'),'utf8'),css=source.match(/const layout = `([\s\S]*?)`;/)[1];assert.ok(!/(?:font-(?:family|size|weight|style)|line-height|letter-spacing|text-indent|color|background|fill|stroke)\s*:/.test(css));assert.deepEqual(errors,[]);
  console.log('PASS: real manual WS/store, admin-only setup, add/edit/delete four presets, equal-width border-free controls, movement/stop/timer/clock/sliders, main timetable, roles and device permissions, original Kit at 320/390/1100px light/dark.');
 }finally{await browser.close();fs.rmSync(directory,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exitCode=1;});
