/* Production card and permission-aware Manager/store; no physical HA devices. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {execFileSync}=require('node:child_process');
const {serveFamilyUI,frontend}=require('./frontend.cjs');
(async()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'shutter-failures-')),store=path.join(directory,'store.json');
 let now='2026-11-15T08:00',restricted=false,failRequest=false;
 const call=message=>{
  if(failRequest)throw new Error('Verbindung fehlgeschlagen');
  const reply=JSON.parse(execFileSync('python3',[path.join(__dirname,'save_host.py'),store,JSON.stringify({...message,fixture_now:now,fixture_read_only:restricted,fixture_denied_entities:restricted?['cover.private']:[]})],{encoding:'utf8',env:process.env}));
  assert.equal(reply.motor_calls,0,'reading the dashboard never operates an actuator');return reply;
 };
 call({type:'rollladenplaner/get'});
 const seed=JSON.parse(fs.readFileSync(store,'utf8'));
 seed.config.windows[0].name='Jalousie EG West mit sehr langem Namen <img src=x>';
 seed.config.windows.push({...structuredClone(seed.config.windows[0]),id:'private',cover:'cover.private',name:'Privater Rollladen'});
 const failure=(id,time,message='Zeitüberschreitung: Zielwert für Höhe nicht bestätigt.',window='w')=>({id,time,window,kind:'error',command:'Wochenende',position:100,tilt:100,message,program:'p',source:'time'});
 seed.runtime.command_results=[
  {...failure('success','2026-11-15T05:00:00+00:00'),kind:'done',message:''},
  failure('first','2026-11-14T23:05:00+00:00','Fehler kurz nach Mitternacht'),
  failure('later','2026-11-15T06:47:00+00:00'),
  failure('private','2026-11-15T06:45:00+00:00','Nur für berechtigte Benutzer','private'),
  failure('yesterday','2026-11-14T22:59:00+00:00','Fehler von gestern'),
  failure('tomorrow','2026-11-15T23:01:00+00:00','Fehler von morgen')
 ];
 seed.runtime.history=[{time:'2026-11-15T06:00:00+00:00',kind:'error',window:'w',message:'Reiner Diagnosefehler'}];
 const writeSeed=()=>fs.writeFileSync(store,JSON.stringify(seed));writeSeed();
 assert.equal(call({type:'rollladenplaner/get'}).ok,true,'the seeded production configuration is valid');
 const browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 try{
  const page=await browser.newPage({viewport:{width:1100,height:1000},timezoneId:'America/Los_Angeles',locale:'de-DE'}),errors=[];page.setDefaultTimeout(10000);page.on('pageerror',error=>errors.push(error.message));
  await page.exposeFunction('backend',message=>{assert.equal(message.type,'rollladenplaner/get','the view only reads');const reply=call(message);if(!reply.ok)throw new Error(reply.error);return reply.snapshot;});
  await page.route('http://failures.test/**',async route=>{
   if(await serveFamilyUI(route))return;
   if(new URL(route.request().url()).pathname==='/card.js')return route.fulfill({contentType:'application/javascript',body:fs.readFileSync(path.join(frontend,'shutter-manager-card.js'))});
   return route.fulfill({contentType:'text/html',body:'<html lang="de"><meta charset="utf-8"><style>body{margin:8px;--primary-color:#81d2eb;--primary-text-color:#212121;--secondary-text-color:#727272;--text-primary-color:#18333e;--card-background-color:#fff;--divider-color:#ddd;--ha-font-family-body:Arial,sans-serif}shutter-manager-card{display:block;max-width:920px;margin:auto}</style><script type="module" src="/card.js"></script><shutter-manager-card></shutter-manager-card></html>'});
  });
  const card=page.locator('shutter-manager-card'),rows=card.locator('.daily-history-row');
  const results=path.resolve(__dirname,'../.ci/ui-kit-results');fs.mkdirSync(results,{recursive:true});
  async function open(config={view:'failed-history'}){
   await page.goto('http://failures.test');await page.waitForFunction(()=>customElements.get('shutter-manager-card'));
   await page.evaluate(config=>{localStorage.clear();window.requests=[];window.card=document.querySelector('shutter-manager-card');card.setConfig(config);},config);
   assert.match(await card.getByRole('status').innerText(),/geladen/);
   await page.evaluate(()=>{card.hass={user:{id:'failures-tests'},states:{},config:{time_zone:'Europe/Berlin'},callWS:async message=>{window.requests.push(message);return window.backend(message);}};clearInterval(card.timer);});
   await page.waitForFunction(()=>card.loaded || card.error);
  }
  for(const theme of ['light','dark'])for(const width of [320,390,1100])for(const reader of [false,true]){
   restricted=reader;now='2026-11-15T08:00';failRequest=false;writeSeed();await page.setViewportSize({width,height:1000});await open();
   await page.evaluate(theme=>{const dark=theme==='dark';for(const [key,value] of Object.entries({'--primary-color':dark?'#90caf9':'#81d2eb','--primary-text-color':dark?'#eee':'#212121','--secondary-text-color':dark?'#aaa':'#727272','--text-primary-color':dark?'#102030':'#18333e','--card-background-color':dark?'#202124':'#fff','--secondary-background-color':dark?'#303134':'#f5f5f5','--divider-color':dark?'#444':'#ddd','--error-color':dark?'#ef5350':'#db4437'}))document.body.style.setProperty(key,value);document.body.style.background=dark?'#121212':'#f5f7fa';document.documentElement.style.colorScheme=theme;},theme);
   assert.equal(await rows.count(),reader?2:3);
   assert.deepEqual(await rows.locator('time').allTextContents(),reader?['00:05','07:47']:['00:05','07:45','07:47']);
   assert.equal(await card.getByRole('heading',{name:'Fehlgeschlagene Fahrten heute',exact:true}).count(),1);
   assert.equal(await card.locator('nav,button,input,dialog,.overview,.completed').count(),0,'the view contains no editing or movement controls');
   assert.equal(await card.locator('img,script').count(),0,'names are escaped');
   assert.equal(await rows.locator('.command-result svg[data-icon="failure"]').count(),reader?2:3);
   const text=await card.innerText();assert.match(text,/Höhe 100% · Lamellen 100%/);assert.match(text,/Zielwert/);assert.doesNotMatch(text,/Fehler von gestern|Fehler von morgen|Reiner Diagnosefehler|Erfolgreich/);if(reader)assert.doesNotMatch(text,/Privater Rollladen/);
   const matches=await page.evaluate(async()=>{const kit=await import('/family-ui/1.5.2/family-ui.js');return card.shadowRoot.querySelector('style').textContent===kit.UI_CSS;});assert.equal(matches,true,'the complete view uses the unmodified shared UI Kit stylesheet');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await page.screenshot({path:path.join(results,`failures-${theme}-${width}-${reader?'read':'admin'}.png`),fullPage:true});
  }
  restricted=true;await open({view:'failed-history',title:'Meine Fehler <img src=x>'});assert.equal(await card.getByRole('heading',{name:'Meine Fehler <img src=x>',exact:true}).count(),1);assert.equal(await card.locator('img').count(),0);
  failRequest=true;await page.evaluate(()=>card.refresh());await card.getByRole('alert').waitFor();assert.match(await card.getByRole('alert').innerText(),/Verbindung fehlgeschlagen/);assert.equal(await rows.count(),2,'previous results remain visible on refresh failure');
  failRequest=false;await card.getByRole('button',{name:'Neu laden',exact:true}).click();await card.getByRole('alert').waitFor({state:'hidden'});
  now='2026-11-16T00:00';await page.evaluate(()=>card.refresh());assert.equal(await rows.count(),1);assert.match(await card.innerText(),/Fehler von morgen/);assert.doesNotMatch(await card.innerText(),/Zielwert|kurz nach Mitternacht/);
  now='2026-11-17T00:00';await page.evaluate(()=>card.refresh());assert.equal(await rows.count(),0);assert.equal(await card.getByRole('status').innerText(),'Heute keine fehlgeschlagenen Fahrten.');
  failRequest=true;await open();assert.equal(await card.getByRole('status').count(),0,'failed initial loads must not claim no failures');assert.match(await card.getByRole('alert').innerText(),/Verbindung fehlgeschlagen/);
  failRequest=false;now='2026-11-15T08:00';writeSeed();await open();
  await page.evaluate(()=>{card.setLanguage('en');card.render();});assert.equal(await card.getByRole('heading',{name:'Failed movements today',exact:true}).count(),1);assert.equal(await card.locator('.command-result').first().innerText(),'Failed');
  const many=structuredClone(seed);many.runtime.command_results=Array.from({length:35},(_,n)=>failure('many-'+n,`2026-11-15T06:${String(n).padStart(2,'0')}:00+00:00`));fs.writeFileSync(store,JSON.stringify(many));await page.evaluate(()=>card.refresh());assert.equal(await rows.count(),35,'the complete daily history is not truncated to diagnostics');
  many.runtime.command_results.push(failure('escaped','2026-11-15T06:59:00+00:00','<script>alert(1)</script>'));fs.writeFileSync(store,JSON.stringify(many));await page.evaluate(()=>card.refresh());assert.equal(await card.locator('script').count(),0);assert.match(await card.innerText(),/<script>alert\(1\)<\/script>/);
  // Reconnect the real interval and wait for an actual changed backend snapshot.
  await page.evaluate(()=>{card.remove();document.body.append(card);});
  many.runtime.command_results.push(failure('live','2026-11-15T06:59:30+00:00','Live-Update'));fs.writeFileSync(store,JSON.stringify(many));await card.getByText('Live-Update',{exact:true}).waitFor({timeout:9000});
  await page.evaluate(()=>{clearInterval(card.timer);const forged=document.createElement('button');forged.dataset.action='vacation';card.shadowRoot.querySelector('main').append(forged);forged.click();forged.remove();});
  assert.equal(await page.evaluate(()=>requests.every(message=>message.type==='rollladenplaner/get')),true);assert.deepEqual(errors,[]);
  console.log('PASS: failed-history YAML view with real permission-aware Manager/store, HA-local date and clocks, complete history, loading/empty/error/retry, live refresh, escaped content, no mutation controls and unchanged UI Kit CSS at 320/390/1100 px in light/dark themes.');
 }finally{await browser.close();fs.rmSync(directory,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exitCode=1;});
