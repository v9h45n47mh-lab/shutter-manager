/* Compare the production card with the real UI Kit in desktop/mobile themes. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {serveFamilyUI,frontend}=require('./frontend.cjs');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 const directory=path.join(__dirname,'../.ci/ui-kit-results');fs.mkdirSync(directory,{recursive:true});
 try{
  const page=await browser.newPage({viewport:{width:1100,height:1000}}),errors=[],requests=[];
  page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
  await page.route('http://uikit.test/**',async route=>{
   if(await serveFamilyUI(route))return;
   if(route.request().url().endsWith('/card.js'))return route.fulfill({contentType:'application/javascript',body:fs.readFileSync(path.join(frontend,'shutter-manager-card.js'),'utf8')});
   await route.fulfill({contentType:'text/html',body:'<html lang="de"><meta charset="utf-8"><style>body{margin:0;padding:8px;background:#f5f7fa;font-family:Arial;--primary-color:#03a9f4;--primary-text-color:#212121;--secondary-text-color:#727272;--text-primary-color:#fff;--card-background-color:#fff;--divider-color:#e0e0e0}rollladenplaner-card{display:block;max-width:920px;margin:auto}ha-card{display:block}</style><script type="module" src="/card.js"></script><rollladenplaner-card></rollladenplaner-card></html>'});
  });
  await page.goto('http://uikit.test');await page.waitForFunction(()=>customElements.get('rollladenplaner-card'));
  await page.evaluate(async()=>{
   window.UI=await import('/family-ui/1.2.1/family-ui.js');
   const makeProgram=(id,name,time)=>({id,name,kind:'time',enabled:true,days:[0,1,2,3,4],pause_in_vacation:false,rides:[{id:'ride-'+id,name:'Morgens',targets:['w'],enabled:true,event:'fixed',time,offset:0,earliest:'00:00',latest:'23:59',position:0,tilt:50}]});
   const model={backend_version:'1.5.2',config_schema:7,admin:true,controls:{p:true,q:true},revision:1,time_zone:'Europe/Berlin',config:{enabled:true,vacation:false,sensors:['sensor.lux'],sensor_names:{},windows:[{id:'w',name:'Jalousie Wohnen mit längerem Namen',cover:'cover.wohnen',cover_type:'blind',enabled:true,contacts:[],sensor_rules:[]}],programs:[makeProgram('p','Wochentag','07:00'),makeProgram('q','Wochenende','08:00')]},pending:{},moving:[],planned:[],planned_date:'2026-11-10',sun_times:{date:'2026-11-10'},daily_history:[],cover_states:[{window:'w',position:50,tilt:25}]};
   const host={user:{id:'ui-kit-admin'},states:{'cover.wohnen':{state:'open',attributes:{supported_features:140,device_class:'blind',friendly_name:'Wohnen'}},'sensor.lux':{state:'20300',attributes:{friendly_name:'Helligkeit',device_class:'illuminance',unit_of_measurement:'lx'}}},callWS:async()=>structuredClone(model)};
   const card=document.querySelector('rollladenplaner-card');window.card=card;card.setConfig({});card.hass=host;await card.refresh();
   const reference=document.createElement('div');reference.id='isolated-common-reference';reference.style.cssText='position:absolute;left:-10000px;width:800px';document.body.append(reference);window.commonReference=reference.attachShadow({mode:'open'});
   window.commonReference.innerHTML='<style>'+window.UI.UI_CSS+'</style>'+window.UI.field({id:'kit-input',label:'Name'})+window.UI.selectField({id:'kit-select',label:'Typ',options:[{value:'time',label:'Zeitprogramm'}]})+window.UI.row({title:'Name',description:'Description'})+window.UI.multiSelect({id:'kit-list',label:'',search:false,all:false,items:[{value:'sensor',label:'Helligkeit',description:'sensor.lux'}]})+window.UI.dialog({id:'kit-dialog',title:'Edit program',content:'Content',actions:window.UI.button({label:'Save',action:'save',variant:'primary'})});
   window.compareCommon=(pairs)=>pairs.map(([actual,expected])=>{const properties=['fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','color','backgroundColor','paddingTop','paddingRight','paddingBottom','paddingLeft','borderTopWidth','borderRightWidth','borderBottomWidth','borderLeftWidth','borderColor','borderRadius','rowGap','columnGap'];const values=element=>Object.fromEntries(properties.map(key=>[key,getComputedStyle(element)[key]]));const a=window.card.shadowRoot.querySelector(actual),b=window.commonReference.querySelector(expected);if(!a||!b)throw new Error('Missing parity control '+actual+' / '+expected);return {selector:actual,actual:values(a),expected:values(b)};});
  });
  const card=page.locator('rollladenplaner-card');
  const attributes=['color','backgroundColor','borderColor','paddingTop','paddingRight','paddingBottom','paddingLeft','fontSize','fontWeight','borderRadius','width','height'];
  const measurements=[];
  for(const theme of ['light','dark'])for(const width of [320,375,390,430,1100]){
   await page.setViewportSize({width,height:1100});
   await page.evaluate(theme=>{
    const variables=theme==='dark'?{'--primary-color':'#90caf9','--primary-text-color':'#eee','--secondary-text-color':'#aaa','--text-primary-color':'#102030','--card-background-color':'#202124','--divider-color':'#444','--secondary-background-color':'#2b2c2e','--input-fill-color':'#2b2c2e'}:{'--primary-color':'#03a9f4','--primary-text-color':'#212121','--secondary-text-color':'#727272','--text-primary-color':'#fff','--card-background-color':'#fff','--divider-color':'#e0e0e0','--secondary-background-color':'#f5f5f5','--input-fill-color':'#f5f5f5'};
    for(const [key,value] of Object.entries(variables))document.body.style.setProperty(key,value);
    document.body.style.background=theme==='dark'?'#121212':'#f5f7fa';window.card.tab=0;window.card.render();
    window.card.shadowRoot.getElementById('ui-reference')?.remove();
    const reference=document.createElement('div');reference.id='ui-reference';reference.style.cssText='position:absolute;left:-10000px;width:300px';
    reference.innerHTML=window.UI.programAddButton()+window.UI.programOrderButtons({programId:'reference',index:0,count:2});window.card.shadowRoot.append(reference);
   },theme);
   const values=await page.evaluate(attributes=>{
    const root=window.card.shadowRoot,pick=el=>Object.fromEntries(attributes.map(key=>[key,getComputedStyle(el)[key]]));
    const pairs=[['.page-actions .program-add','#ui-reference .program-add'],['.program-head .program-order button[data-direction="down"]','#ui-reference .program-order button[data-direction="down"]']];
    return pairs.map(([actual,reference])=>({actual:pick(root.querySelector(actual)),reference:pick(root.querySelector(reference))}));
   },attributes);
   for(const pair of values)assert.deepEqual(pair.actual,pair.reference,'program controls match the actual shared component');
   await page.evaluate(()=>window.card.shadowRoot.getElementById('ui-reference')?.remove());
   assert.equal(await card.locator('[data-action="toggle-vacation-filter"]').count(),0);
   assert.equal(await card.locator('.program-order').first().isVisible(),width>600);
   assert.equal(await card.locator('[data-action="copy-program"]').first().isVisible(),width>600);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'programs fit the viewport');
   await page.screenshot({path:path.join(directory,`${theme}-${width}-programs.png`),fullPage:true});
   await card.locator('[data-action="tab"][data-tab="3"]').click();
   for(const section of ['covers','sensors','status','daily-history']){
    const fold=card.locator(`.settings-fold[data-section="${section}"]`);
    if(await fold.getAttribute('aria-expanded')!=='true')await fold.click();
    const actual=await fold.evaluate(el=>({font:getComputedStyle(el.querySelector('span')).fontSize,gap:getComputedStyle(el).gap,arrow:getComputedStyle(el.querySelector('svg')).width}));
    assert.deepEqual(actual,{font:'14px',gap:'6px',arrow:'20px'});
   }
   assert.match(await card.locator('.settings-version-info').textContent(),/UI 1\.2\.1/);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'settings fit the viewport');
   await page.screenshot({path:path.join(directory,`${theme}-${width}-settings.png`),fullPage:true});
   const common=await page.evaluate(()=>window.compareCommon([['[data-settings="covers"] .row-text strong','.setting-row .row-text strong'],['[data-settings="sensors"] .row-text small','.setting-row .row-text small']]));for(const pair of common)assert.deepEqual(pair.actual,pair.expected,'isolated UI Kit list: '+pair.selector);
   measurements.push({theme,width,program_controls:values});
  }
  await card.locator('[data-action="set-language"][data-language="en"]').click();
  assert.equal(await card.getByRole('button',{name:'Select sensors',exact:true}).count(),1);
  await card.locator('[data-action="tab"][data-tab="0"]').click();
  await card.locator('[data-action="new-program"]').click();
  assert.equal(await card.locator('dialog.modal').evaluate(el=>el.open&&el.matches(':modal')),true,'native modal is active');
  assert.equal(await card.getByRole('button',{name:'Close',exact:true}).count(),1);
  await page.screenshot({path:path.join(directory,'desktop-native-dialog.png'),fullPage:true});
  const contrast=({foreground,background})=>{
   const luminance=color=>color.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>v/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[0.2126,0.7152,0.0722][i],0);
   const values=[luminance(foreground),luminance(background)].sort((a,b)=>b-a);return (values[0]+0.05)/(values[1]+0.05);
  };
  const inputColors=()=>card.locator('dialog.modal input:not([type=checkbox])').first().evaluate(el=>({foreground:getComputedStyle(el).color,background:getComputedStyle(el).backgroundColor}));
  const compareModal=async()=>{const pairs=await page.evaluate(()=>window.compareCommon([['dialog.modal input[data-key="name"]','#kit-input'],['dialog.modal select[data-key="kind"]','#kit-select'],['dialog.modal .modal-head','#kit-dialog .modal-head'],['dialog.modal .modal-body','#kit-dialog .modal-body'],['dialog.modal footer','#kit-dialog footer']]));for(const pair of pairs)assert.deepEqual(pair.actual,pair.expected,'isolated UI Kit fields/dialog: '+pair.selector);};
  await compareModal();
  assert.ok(contrast(await inputColors())>=4.5,'dark HA input tokens keep text readable');
  await page.setViewportSize({width:390,height:1100});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:path.join(directory,'dark-mobile-native-dialog.png'),fullPage:true});
  await page.evaluate(()=>{for(const [key,value] of Object.entries({'--primary-color':'#03a9f4','--primary-text-color':'#212121','--secondary-text-color':'#727272','--text-primary-color':'#fff','--card-background-color':'#fff','--divider-color':'#e0e0e0','--secondary-background-color':'#f5f5f5','--input-fill-color':'#f5f5f5'}))document.body.style.setProperty(key,value);document.body.style.background='#f5f7fa';});
  assert.ok(contrast(await inputColors())>=4.5,'light HA input tokens keep text readable');
  await compareModal();
  await page.screenshot({path:path.join(directory,'light-mobile-native-dialog.png'),fullPage:true});
  await page.setViewportSize({width:1100,height:1100});
  await page.screenshot({path:path.join(directory,'light-desktop-native-dialog.png'),fullPage:true});

  await card.locator('dialog.modal button').last().focus();await page.keyboard.press('Tab');
  assert.equal(await card.locator('dialog.modal button').first().evaluate(el=>el===el.getRootNode().activeElement),true,'Tab stays inside the modal');
  await page.keyboard.press('Escape');assert.equal(await card.locator('dialog.modal').count(),0);
  assert.equal(await card.locator('[data-action="new-program"]').evaluate(el=>el===el.getRootNode().activeElement),true,'focus returns to the opener');
  await card.locator('[data-action="tab"][data-tab="3"]').click();
  for(const theme of ['light','dark']){
   await page.setViewportSize({width:theme==='light'?1100:390,height:1100});
   await page.evaluate(theme=>{const dark=theme==='dark';for(const [key,value] of Object.entries({'--primary-color':dark?'#90caf9':'#03a9f4','--primary-text-color':dark?'#eee':'#212121','--secondary-text-color':dark?'#aaa':'#727272','--text-primary-color':dark?'#102030':'#fff','--card-background-color':dark?'#202124':'#fff','--divider-color':dark?'#444':'#e0e0e0','--secondary-background-color':dark?'#2b2c2e':'#f5f5f5','--input-fill-color':dark?'#2b2c2e':'#f5f5f5'}))document.body.style.setProperty(key,value);},theme);
   await card.getByRole('button',{name:'Select sensors',exact:true}).click();
   const list=await page.evaluate(()=>window.compareCommon([['dialog.modal .cover-option','.fui-multi .cover-option'],['dialog.modal .cover-option strong','.fui-multi .cover-option strong'],['dialog.modal .cover-option small','.fui-multi .cover-option small']]));for(const pair of list)assert.deepEqual(pair.actual,pair.expected,'isolated UI Kit selection list: '+pair.selector);
   await page.screenshot({path:path.join(directory,theme+'-sensor-selection.png'),fullPage:true});
   await card.getByRole('button',{name:'Cancel',exact:true}).click();
  }
  assert.deepEqual(errors,[]);assert.ok(requests.every(url=>url.startsWith('http://uikit.test/')),'no runtime CDN requests');
  fs.writeFileSync(path.join(directory,'measurements.json'),JSON.stringify(measurements,null,2));
  console.log('PASS: real UI Kit parity, isolated list/field/dialog styles, accent arrows, add button, fixed local modules, native dialog/focus, DE/EN, light/dark and 320/375/390/430/1100px.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
