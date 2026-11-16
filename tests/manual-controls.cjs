/* Exercise the real component's control policy and order drafts without a browser. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
(async()=>{
 const base=path.resolve(__dirname,'../custom_components/rollladenplaner/frontend');
 const source=fs.readFileSync(path.join(base,'shutter-manual-card.js'),'utf8');
 const statement=source.match(/^import \{([^}]+)\} from '([^']+)';\n/);
 const kit=await import('data:text/javascript;base64,'+fs.readFileSync(path.join(base,statement[2])).toString('base64'));
 const registry=new Map(),context=vm.createContext({HTMLElement:class{},window:{},customElements:{get:key=>registry.get(key),define:(key,value)=>registry.set(key,value)},Intl,Date,Set,Number,Math,JSON,Array,__kit:kit});
 vm.runInContext('const {'+statement[1]+'}=__kit;\n'+source.slice(statement[0].length)+'\nglobalThis.Card=ShutterManualCard;',context);
 const card=new context.Card();card.config={language:'de'};card._hass={user:{is_admin:true}};
 card.data={can_configure:true,settings:{selected:['blind','shutter','third'],mode:'presets',height_values:[10,30,60,90],tilt_values:[0,50,100],columns:'auto'},available:[
  {id:'blind',name:'Jalousie',blind:true,position:35,tilt:50,can_control:true,enabled:true,state:'open',features:143},
  ...['shutter','third','fourth'].map(id=>({id,name:id,blind:false,position:60,can_control:true,enabled:true,state:'open',features:15}))]};
 const blind=card.find('blind'),shutter=card.find('shutter');
 for(const mode of ['presets','sliders']){
  card.settings.mode=mode;
  assert.deepEqual(Array.from(card.axisValues(blind,'height')),[0,100]);assert.ok(!card.axisMarkup(blind,'height').includes('type="range"'));
  assert.equal(card.axisMarkup(blind,'tilt').includes('type="range"'),mode==='sliders');
  assert.equal(card.axisMarkup(shutter,'height').includes('type="range"'),mode==='sliders');
  assert.ok(!card.deviceMarkup(shutter).includes('Lamellen'));
  card.editor={type:'plan',target:'blind',mode:'timer',minutes:15,position:null,tilt:null};
  const plan=card.planMarkup();assert.ok(plan.includes('id="plan-position-control"'));assert.ok(!plan.includes('id="plan-position" type="range"'));
 }
 card.render=()=>{};card.updatePlanControls=()=>{};card.updateSelectedDevices=()=>{};
 const calls=[];card.request=async(kind,message)=>{calls.push({kind,...message});return true;};
 card.settings.mode='sliders';card.editor=null;
 await card.onAction({action:'position-preset',data:{device:'blind',axis:'height',value:'30'}});assert.equal(calls.length,0);
 await card.onAction({action:'position-preset',data:{device:'blind',axis:'height',value:'100'}});assert.equal(calls.at(-1).position,100);
 const count=calls.length;
 await card.onAction({action:'position-range',data:{device:'blind',axis:'height'},value:35,phase:'change'});assert.equal(calls.length,count);
 await card.onAction({action:'position-range',data:{device:'blind',axis:'tilt'},value:35,phase:'change'});assert.equal(calls.at(-1).tilt,35);assert.equal(calls.at(-1).position,null);
 card.editor={type:'plan',target:'blind',position:null,tilt:null};
 await card.onAction({action:'plan-range',element:{id:'plan-position-control'},value:35});assert.equal(card.editor.position,null);
 await card.onAction({action:'plan-preset',data:{axis:'position',value:'100'}});assert.equal(card.editor.position,100);
 card.editor={type:'setup',settings:JSON.parse(JSON.stringify(card.settings))};
 await card.onAction({action:'reorder-devices',data:{program:'blind',offset:'2'}});
 assert.deepEqual(Array.from(card.editor.settings.selected),['shutter','third','blind']);
 assert.deepEqual(Array.from(card.settings.selected),['blind','shutter','third'],'reordering only changes the unsaved draft');
 await card.onAction({action:'select-devices',value:['blind','shutter','fourth']});
 assert.deepEqual(Array.from(card.editor.settings.selected),['shutter','blind','fourth'],'selection preserves existing relative order and appends new covers');
 const ordered=JSON.stringify(card.editor.settings.selected);
 for(const data of [{program:'missing',offset:'1'},{program:'blind',offset:'9'},{program:'blind',offset:'NaN'},{program:'blind',offset:'0'}]){await card.onAction({action:'reorder-devices',data});assert.equal(JSON.stringify(card.editor.settings.selected),ordered);}
 const orderMarkup=card.selectedOrderMarkup();assert.equal((orderMarkup.match(/data-ui="order"/g)||[]).length,3);assert.ok(orderMarkup.includes('data-icon="drag"'));assert.ok(!orderMarkup.includes('data-icon="up"'));
 card._hass.user.is_admin=false;await card.onAction({action:'reorder-devices',data:{program:'blind',offset:'1'}});assert.equal(JSON.stringify(card.editor.settings.selected),ordered);
 console.log('PASS: real component keeps blind height at 0/100 in both modes, tilt-only blind sliders, shutter sliders, guarded targets, shared order handles, draft-only sorting, stable selection and admin-only reordering.');
})().catch(error=>{console.error(error);process.exitCode=1;});
