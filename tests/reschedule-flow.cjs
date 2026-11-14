/* Production card and Manager/store, with explicit clocks and no physical devices. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {execFileSync}=require('node:child_process');
const {serveFamilyUI,frontend}=require('./frontend.cjs');
(async()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'shutter-shift-')),store=path.join(directory,'store.json');
 let fixtureNow='2026-11-14T06:10',readOnly=false;
 const call=message=>JSON.parse(execFileSync('python3',[path.join(__dirname,'save_host.py'),store,JSON.stringify({...message,fixture_now:fixtureNow,fixture_read_only:readOnly})],{encoding:'utf8',env:process.env}));
 let initial=call({type:'rollladenplaner/get'}),config=initial.snapshot.config;
 const program=config.programs.find(p=>p.kind==='time'),ride=program.rides.find(r=>r.targets.includes('w'));
 config.windows=config.windows.filter(w=>w.id==='w');config.windows[0].name='Jalousie Wohnen mit längerem Namen';config.windows[0].sensor_rules=[];config.windows[0].contacts=[];
 config.programs=[program];program.days=[0,1,2,3,4,5,6];program.enabled=true;program.rides=[ride,{...structuredClone(ride),id:'evening',time:'18:00',earliest:'00:00',latest:'23:59'}];ride.time='07:00';ride.earliest='06:00';ride.latest='08:00';
 initial=call({type:'rollladenplaner/save',config,revision:initial.snapshot.revision});assert.equal(initial.ok,true);
 initial=call({type:'rollladenplaner/action',action:'add_once',value:true,target:'w',time:'06:50',position:20,tilt:null,revision:initial.snapshot.revision});assert.equal(initial.ok,true);
 const seed=fs.readFileSync(store,'utf8'),occurrence='2026-11-14:'+ride.id,once=initial.snapshot.planned.find(row=>row.one_time).occurrence;
 const browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 try{
  const page=await browser.newPage({viewport:{width:1100,height:1000},timezoneId:'America/Los_Angeles',locale:'de-DE'}),errors=[];page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));
  await page.exposeFunction('backend',message=>{const reply=call(message);if(reply.ok)assert.equal(reply.motor_calls,0,'changing a future clock never drives a motor');return reply;});
  await page.route('http://reschedule.test/**',async route=>{
   if(await serveFamilyUI(route))return;
   if(new URL(route.request().url()).pathname==='/card.js')return route.fulfill({contentType:'application/javascript',body:fs.readFileSync(path.join(frontend,'shutter-manager-card.js'))});
   return route.fulfill({contentType:'text/html',body:'<html lang="de"><meta charset="utf-8"><style>body{margin:8px;--primary-color:#81d2eb;--primary-text-color:#212121;--secondary-text-color:#727272;--text-primary-color:#18333e;--card-background-color:#fff;--divider-color:#ddd;--ha-font-family-body:Arial,sans-serif}shutter-manager-card{display:block;max-width:920px;margin:auto}</style><script type="module" src="/card.js"></script><shutter-manager-card></shutter-manager-card></html>'});
  });
  const card=page.locator('shutter-manager-card'),dialog=card.getByRole('dialog'),field=dialog.locator('[data-key="time"]');
  async function open(reset=true){
   if(reset)fs.writeFileSync(store,seed);
   await page.goto('http://reschedule.test');await page.waitForFunction(()=>customElements.get('shutter-manager-card'));
   await page.evaluate(()=>{
    localStorage.clear();window.requests=[];const card=document.querySelector('shutter-manager-card');window.card=card;card.setConfig({});
    card.hass={user:{id:'shift-tests'},states:{},callWS:async message=>{window.requests.push(message);if(message.action==='reschedule'&&window.failNext){window.failNext=false;throw new Error('Speichern vorübergehend fehlgeschlagen');}const reply=await window.backend(message);if(!reply.ok)throw new Error(reply.error);return reply.snapshot;}};
    clearInterval(card.timer);
   });
   await card.getByRole('button',{name:'Zeitprogramm',exact:true}).click();
  }
  const row=id=>card.locator(`.planned-row:has([data-occurrence="${id}"])`),shift=id=>card.locator(`[data-action="open-reschedule"][data-occurrence="${id}"]`);
  const results=path.resolve(__dirname,'../.ci/ui-kit-results');fs.mkdirSync(results,{recursive:true});
  for(const theme of ['light','dark'])for(const width of [320,390,1100])for(const admin of [true,false]){
   fixtureNow='2026-11-14T06:10';readOnly=!admin;await page.setViewportSize({width,height:1000});await open();
   await page.evaluate(theme=>{const dark=theme==='dark';for(const [key,value] of Object.entries({'--primary-color':dark?'#90caf9':'#81d2eb','--primary-text-color':dark?'#eee':'#212121','--secondary-text-color':dark?'#aaa':'#727272','--text-primary-color':dark?'#102030':'#18333e','--card-background-color':dark?'#202124':'#fff','--secondary-background-color':dark?'#303134':'#f5f5f5','--divider-color':dark?'#444':'#ddd'}))document.body.style.setProperty(key,value);document.body.style.background=dark?'#121212':'#f5f7fa';document.documentElement.style.colorScheme=theme;},theme);
   assert.equal(await row(occurrence).getByRole('button',{name:'Skip',exact:true}).locator('svg[data-icon="skip-once"]').count(),1);
   assert.equal(await shift(occurrence).locator('svg[data-icon="reschedule"]').count(),1);
   assert.equal(await shift(occurrence).isDisabled(),!admin);
   const a=await row(occurrence).getByRole('button',{name:'Skip',exact:true}).boundingBox(),b=await shift(occurrence).boundingBox();
   assert.ok(Math.abs(a.y+a.height/2-b.y-b.height/2)<1,'Skip and the clock remain side by side on mobile');
   assert.equal(await row(occurrence).getByRole('button',{name:'Skip',exact:true}).isDisabled(),!admin);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await page.screenshot({path:path.join(results,`reschedule-${theme}-${width}-${admin?'admin':'read'}.png`),fullPage:true});
   if(!admin)continue;
   await shift(occurrence).click();assert.equal(await dialog.getByRole('heading',{name:'Einmalig verschieben'}).count(),1);assert.equal(await field.inputValue(),'07:00');
   assert.equal(await dialog.locator('input[type="date"]').count(),0,'the occurrence date is fixed');
   await field.fill('06:30');await page.screenshot({path:path.join(results,`reschedule-dialog-${theme}-${width}.png`),fullPage:true});
   await dialog.getByRole('button',{name:'Übernehmen',exact:true}).click();await dialog.waitFor({state:'hidden'});
   assert.match(await row(occurrence).innerText(),/Sa 06:30/);
   const saved=JSON.parse(fs.readFileSync(store,'utf8'));assert.equal(saved.config.programs[0].rides[0].time,'07:00');assert.equal(Object.keys(saved.runtime.time_overrides).length,1);
   await open(false);assert.match(await row(occurrence).innerText(),/Sa 06:30/,'the new clock survives a fresh Manager and browser');
  }
  readOnly=false;fixtureNow='2026-11-14T06:10';await open();
  await shift(occurrence).click();await field.fill('06:09');await dialog.getByRole('button',{name:'Übernehmen',exact:true}).click();await dialog.getByRole('alert').waitFor();assert.equal(await field.inputValue(),'06:09');assert.match(await dialog.getByRole('alert').innerText(),/Zukunft/);
  await field.fill('08:30');await page.evaluate(()=>window.failNext=true);await dialog.getByRole('button',{name:'Übernehmen',exact:true}).click();await dialog.getByRole('alert').waitFor();assert.equal(await field.inputValue(),'08:30');
  await dialog.getByRole('button',{name:'Übernehmen',exact:true}).click();await dialog.waitFor({state:'hidden'});assert.match(await row(occurrence).innerText(),/Sa 08:30/);
  await shift(occurrence).click();await field.fill('09:00');await field.press('Escape');await dialog.waitFor({state:'hidden'});assert.match(await row(occurrence).innerText(),/Sa 08:30/);
  await open();await shift(once).click();await field.fill('06:20');await dialog.getByRole('button',{name:'Übernehmen',exact:true}).click();await dialog.waitFor({state:'hidden'});assert.equal(JSON.parse(fs.readFileSync(store,'utf8')).runtime.one_time[0].scheduled,'2026-11-14T05:20:00+00:00');
  fixtureNow='2026-11-13T18:00';await open();await shift(occurrence).click();await field.fill('05:00');await dialog.getByRole('button',{name:'Übernehmen',exact:true}).click();await dialog.waitFor({state:'hidden'});assert.match(await row(occurrence).innerText(),/Sa 05:00/);
  fixtureNow='2026-11-14T06:10';await open();await shift(occurrence).click();fixtureNow='2026-11-14T07:01';await field.fill('08:00');await dialog.getByRole('button',{name:'Übernehmen',exact:true}).click();await dialog.getByRole('alert').waitFor();assert.match(await dialog.getByRole('alert').innerText(),/nicht mehr offen/);await dialog.getByRole('button',{name:'Abbrechen',exact:true}).click();
  fixtureNow='2026-11-14T06:10';await open();await card.getByRole('button',{name:'Einstellungen',exact:true}).click();await card.locator('[data-action="set-language"][data-language="en"]').click();await card.getByRole('button',{name:'Schedule',exact:true}).click();await card.locator(`[data-action="open-reschedule"][data-occurrence="${occurrence}"]`).click();assert.equal(await dialog.getByRole('heading',{name:'Reschedule once',exact:true}).count(),1);await dialog.getByRole('button',{name:'Cancel',exact:true}).click();
  assert.deepEqual(errors,[]);
  console.log('PASS: real Manager/store one-execution rescheduling before/after the original time, tomorrow, unchanged programs, persisted reload, native permissions, compact Kit icons, same-day validation, stale due events, cancel, failure/retry, DE/EN and 320/390/1100 px in both themes.');
 }finally{await browser.close();fs.rmSync(directory,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exitCode=1;});
