const {serveFamilyUI}=require('./frontend.cjs');
/* Settings, navigation and history in Chromium with the real Manager/store and simulated HA data. */
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
(async()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'shutter-131-')),store=path.join(directory,'store.json');
 let now='2026-11-06T12:00';
 const extras={'sensor.lux':{state:'20300',attributes:{friendly_name:'Helligkeit',device_class:'illuminance',unit_of_measurement:'lx'}},
  'cover.shutter':{state:'closed',attributes:{friendly_name:'Rollladen Küche',device_class:'shutter',supported_features:12,current_position:35,current_tilt_position:99}}};
 const call=message=>JSON.parse(execFileSync('python3',[path.join(__dirname,'save_host.py'),store,JSON.stringify({...message,fixture_now:now,fixture_states:extras})],{env:process.env,encoding:'utf8'}));
 const initial=call({type:'rollladenplaner/get'}).snapshot;
 initial.config.windows.push({id:'shutter',name:'Rollladen Küche',cover:'cover.shutter',cover_type:'shutter',contacts:[],sensor_rules:[]});
 const results=[
  {id:'failed',time:'2026-11-06T08:05:00Z',kind:'error',window:'w',command:'Beschattung',position:20,tilt:50,message:'Zielposition nicht bestätigt'},
  {id:'older',time:'2026-11-05T20:00:00Z',kind:'done',window:'w',command:'Gestern',position:100,tilt:null,message:''},
  {id:'complete',time:'2026-11-06T08:00:00Z',kind:'done',window:'shutter',command:'Morgens',position:35,tilt:null,message:''},
  {id:'local-day',time:'2026-11-05T23:30:00Z',kind:'done',window:'w',command:'Nacht',position:0,tilt:null,message:''}
 ];
 fs.writeFileSync(store,JSON.stringify({config:initial.config,runtime:{command_results:results,history:results.map(r=>({...r,message:r.message||r.command+' ausgeführt'}))},revision:0}));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 try{
  const page=await browser.newPage({viewport:{width:1100,height:1100}}),errors=[];page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));
  await page.exposeFunction('backend',message=>{const result=call(message);assert.equal(result.motor_calls,0);return result;});
  await page.route('http://release131.test/**',async route=>{
   if(await serveFamilyUI(route))return;
   if(route.request().url().endsWith('/card.js'))await route.fulfill({contentType:'application/javascript',body:fs.readFileSync(path.join(__dirname,'../custom_components/rollladenplaner/frontend/shutter-manager-card.js'),'utf8')});
   else await route.fulfill({contentType:'text/html',body:'<html lang="de"><meta charset="utf-8"><style>body{margin:8px;--primary-color:#81d2eb;--text-primary-color:#18333e;--primary-text-color:#212121;--secondary-text-color:#727272;--divider-color:#e4e4e4}shutter-manager-card{display:block;max-width:500px;margin:auto}</style><script type="module" src="/card.js"></script><shutter-manager-card></shutter-manager-card></html>'});
  });
  async function open(){
   await page.goto('http://release131.test');await page.waitForFunction(()=>customElements.get('shutter-manager-card'));
   await page.evaluate(async()=>{const result=await backend({type:'rollladenplaner/get'});window.host={user:{id:'release131'},states:result.states,callWS:async message=>{const r=await backend(message);if(!r.ok)throw new Error(r.error);return r.snapshot;}};const card=document.querySelector('shutter-manager-card');card.setConfig({type:'custom:shutter-manager-card'});card.hass=host;});
  }
  const card=page.locator('shutter-manager-card');await open();
  assert.deepEqual(await card.locator('nav button').allTextContents(),['Programme','',''],'only Programs retains a text label');
  assert.deepEqual(await card.locator('nav [data-icon]').evaluateAll(elements=>elements.map(el=>el.dataset.icon)),['schedule','sensors']);
  assert.equal(await card.getByRole('button',{name:'Zeitprogramm',exact:true}).getAttribute('title'),'Zeitprogramm');
  await card.getByRole('button',{name:'Zeitprogramm',exact:true}).press('Enter');
  assert.equal(await card.getByRole('button',{name:'Zeitprogramm',exact:true}).getAttribute('aria-current'),'page');
  await card.getByRole('button',{name:'Sensorprogramme',exact:true}).press('Space');
  assert.equal(await card.getByRole('button',{name:'Sensorprogramme',exact:true}).getAttribute('aria-current'),'page');
  await card.getByRole('button',{name:'Programme',exact:true}).click();
  const reading=card.locator('.sensor-value[title="sensor.lux"] .sensor-state');
  const formatCases=[['0','lx','0 lx'],['999','lx','999 lx'],['1000','lx','1.000 lx'],['20300','lx','20.300 lx'],['123456','lx','123.456 lx'],['1234.7','lx','1.235 lx'],['20.3','klx','20.300 lx'],['20.3',' kLx ','20.300 lx']];
  for(const [value,unit,expected] of formatCases){
   await page.evaluate(({value,unit})=>{host.states['sensor.lux'].state=value;host.states['sensor.lux'].attributes.unit_of_measurement=unit;document.querySelector('shutter-manager-card').hass=host;},{value,unit});
   assert.equal(await reading.innerText(),expected);
   assert.equal(await page.evaluate(()=>host.states['sensor.lux'].state),value,'raw sensor reading is not changed by formatting');
  }
  await card.getByRole('button',{name:'Einstellungen',exact:true}).click();
  for(const section of ['covers','sensors','status','daily-history']){
   const fold=card.locator(`button.settings-fold[data-section="${section}"]`);
   assert.equal(await fold.count(),1,'each section has one heading toggle');
   assert.equal(await fold.locator('svg.chevron').count(),1,'each section uses a chevron');
   assert.equal(await fold.getAttribute('aria-expanded'),'false');
  }
  assert.equal(await card.getByRole('button',{name:/^(Anzeigen|Ausblenden)$/}).count(),0,'no separate Show/Hide controls');
  assert.equal(await card.locator('#settings-sensor-names-content,[data-section="sensor-names"]').count(),0,'sensor names have no separate Settings section');
  for(const width of [1100,390,320]){
   await page.setViewportSize({width,height:1100});
   const arrows=await card.locator('.settings-fold svg.chevron').evaluateAll(elements=>elements.map(el=>el.getBoundingClientRect().left));
   assert.ok(arrows.every(left=>Math.abs(left-arrows[0])<1),'all accordion arrows align');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await page.screenshot({path:path.join(directory,`settings-collapsed-${width}.png`),fullPage:true});
  }
  await page.setViewportSize({width:1100,height:1100});
  await card.locator('.settings-fold[data-section="status"]').press('Enter');
  assert.equal(await card.locator('.settings-fold[data-section="status"]').getAttribute('aria-expanded'),'true');
  assert.equal(await card.locator('.settings-fold[data-section="status"] .chevron.expanded').count(),1);
  const status=card.locator('#settings-status-content'),history=card.locator('#settings-daily-history-content');
  assert.equal(await card.getByRole('heading',{name:'Letzte Fahrbefehle',exact:true}).count(),0,'recent commands are removed entirely');
  assert.equal(await status.locator('.recent-commands,.command-history-row').count(),0);
  assert.equal(await card.locator('#settings-commands-content').count(),0,'recent commands have no separate top-level section');
  const blind=status.locator('.cover-status-row[data-window="w"]'),shutter=status.locator('.cover-status-row[data-window="shutter"]');
  assert.equal(await blind.locator('span').innerText(),'Höhe 100% · Lamellen 50%');
  assert.equal(await shutter.locator('span').innerText(),'Höhe 35%','shutters never display tilt');
  assert.equal(await status.locator('.cover-status-row small').count(),0,'no duplicate position line');
  assert.doesNotMatch(await status.locator('.cover-status-row').allTextContents().then(t=>t.join(' ')),/Geöffnet|Geschlossen|Öffnet|Schließt/);
  await card.locator('.settings-fold[data-section="daily-history"]').press('Space');
  assert.equal(await card.locator('.settings-fold[data-section="daily-history"]').getAttribute('aria-expanded'),'true');
  assert.equal(await status.locator('#settings-daily-history-content').count(),0,'daily history is outside Current status');
  assert.deepEqual(await history.locator('time').allTextContents(),['00:30','09:00','09:05'],'HA local day and chronological times');
  assert.equal(await history.locator('.daily-history-row').count(),3);
  assert.equal(await history.getByText('Gestern',{exact:true}).count(),0);
  assert.equal(await history.getByText('Fehlgeschlagen',{exact:true}).count(),1);
  assert.equal(await history.getByText('Erfolgreich',{exact:true}).count(),2);
  assert.match(await history.innerText(),/Morgens · Höhe 35%/);
  await card.locator('.settings-fold[data-section="status"]').click();
  assert.equal(await status.isVisible(),false);assert.equal(await history.isVisible(),true,'sections fold independently');
  await card.locator('.settings-fold[data-section="status"]').click();
  for(const width of [1100,390,320]){
   await page.setViewportSize({width,height:1100});
   const boxes=await card.locator('.card-top button').evaluateAll(elements=>elements.map(el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width};}));
   assert.ok(Math.abs(boxes[1].left-boxes[0].right)<2 && Math.abs(boxes[2].left-boxes[1].right)<2,'icon tabs directly follow Programs');
   assert.ok(boxes[3].left>=boxes[2].right && boxes[4].left>=boxes[3].right,'Help and Settings stay to the right');
   const right=await card.boundingBox();assert.ok(Math.abs(boxes[4].right-(right.x+right.width))<3,'Settings aligns to the right edge');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'no horizontal document overflow');
   for(const row of [blind,shutter]){
    const name=await row.locator('strong').boundingBox(),axes=await row.locator('span').boundingBox();
    assert.ok(axes.x>=name.x+name.width-1,'position and tilt occupy the right column');
   }
   await page.screenshot({path:path.join(directory,`settings-${width}.png`),fullPage:true});
  }
  await open();await card.getByRole('button',{name:'Einstellungen',exact:true}).click();
  assert.equal(await history.locator('.daily-history-row').count(),3,'results survive a complete page and Manager reload');
  assert.equal(await history.isVisible(),true,'fold state survives page reload');
  assert.equal(await status.isVisible(),true,'status fold state also survives page reload');
  await card.getByRole('button',{name:'🇬🇧 EN',exact:false}).click();
  assert.equal(await card.getByRole('button',{name:'Schedule',exact:true}).getAttribute('title'),'Schedule');
  assert.equal(await card.getByRole('button',{name:'Sensor programs',exact:true}).innerText(),'');
  assert.equal(await card.getByRole('button',{name:"Today's history",exact:true}).isVisible(),true);
  assert.equal(await card.getByRole('button',{name:/^(Show|Hide)$/}).count(),0,'English layout has no separate reveal buttons');
  assert.equal(await card.getByRole('button',{name:'Current status',exact:true}).locator('svg.chevron').count(),1);
  assert.equal(await card.getByRole('button',{name:"Today's history",exact:true}).locator('svg.chevron').count(),1);
  assert.equal(await card.getByRole('heading',{name:'Recent movement commands',exact:true}).count(),0,'English layout also omits recent commands');
  await card.getByRole('button',{name:'Programs',exact:true}).click();
  assert.equal(await reading.innerText(),'20.300 lx','dotted thousands format also applies in English');
  await card.getByRole('button',{name:'Guide',exact:true}).click();
  assert.match(await card.locator('.howto').innerText(),/Today's history/);
  assert.match(await card.locator('.howto').innerText(),/20.300 lx/);
  await card.getByRole('button',{name:'Settings',exact:true}).click();
  now='2026-11-07T00:01';await page.evaluate(()=>document.querySelector('shutter-manager-card').refresh());
  assert.equal(await history.locator('.daily-history-row').count(),0,'new HA local day shows no previous-day commands');
  assert.match(await history.innerText(),/No movements completed today/);
  assert.deepEqual(errors,[]);
  console.log('PASS: consistent chevron headings without Show/Hide buttons or a separate sensor-names section, keyboard expansion and saved fold states; icon navigation, full illuminance, compact status, daily history results, HA-local midnight and 320/390/1100px layouts.');
  console.log('Internal screenshots: '+directory);
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
