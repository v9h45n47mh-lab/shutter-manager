import {UI_CSS, UI_VERSION, row, button, iconButton, orderHandle, toggle, rangeControl, dialog, field, numberControl, selectField, multiSelect, filterButton, formError, feedback, loadingState, emptyState, bindUI, escapeHtml, versionInfo} from './family-ui/1.7.0/family-ui.js';

/* Shutter Manager manual dashboard. All shared presentation belongs to HA UI Kit. */
const MANUAL_CARD_VERSION = '1.11.4';
const copy = value => JSON.parse(JSON.stringify(value));
const newCardId = () => 'manual_' + (crypto.randomUUID ? crypto.randomUUID().replaceAll('-','') : Array.from(crypto.getRandomValues(new Uint8Array(16)),value=>value.toString(16).padStart(2,'0')).join(''));
const layout = `
.manual-devices{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:var(--fui-section-padding);align-items:start}
.manual-devices.manual-one{grid-template-columns:minmax(0,1fr)}
.manual-devices.manual-three{grid-template-columns:repeat(3,minmax(0,1fr))}
.manual-device{min-width:0}
.manual-transport{justify-content:center}
.manual-card-tools{justify-content:flex-end}
.manual-values{display:grid;grid-template-columns:repeat(var(--manual-value-count),minmax(0,1fr));gap:var(--fui-row-padding)}
.manual-preset-entry{display:grid;grid-template-columns:minmax(0,1fr) var(--fui-touch);align-items:center}
#manual-dialog.manual-plan{width:420px}
#manual-value-dialog{width:360px}
@media(max-width:850px){.manual-devices.manual-three{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:600px){.manual-devices,.manual-devices.manual-three{grid-template-columns:minmax(0,1fr)}}
`;
const translations = {
  'Einstellungen':'Settings','Abbrechen':'Cancel','Übernehmen':'Apply','Entfernen':'Remove','Hinzufügen':'Add',
  'Höhe':'Height','Lamellen':'Tilt','Unverändert':'Unchanged','Bedienung':'Controls','Feste Positionen':'Fixed positions',
  'Schieberegler':'Sliders','Rollläden und Jalousien':'Shutters and blinds','Höhenpositionen (%)':'Height positions (%)',
  'Lamellenpositionen (%)':'Tilt positions (%)','Wert hinzufügen':'Add value','Wert ändern':'Edit value','Position (%)':'Position (%)',
  'Spalten auf breiten Ansichten':'Columns on wide screens','Automatisch':'Automatic','Eine Spalte':'One column',
  'Zwei Spalten':'Two columns','Drei Spalten':'Three columns','Einzelfahrt planen':'Plan one-time movement',
  'Timer':'Timer','Uhrzeit':'Time','Start in Minuten':'Start in minutes','Start um':'Start at','Einplanen':'Schedule',
  'Hoch':'Up','Stopp':'Stop','Runter':'Down','Zielhöhe':'Target height','Schließen':'Close',
  'Bitte einen noch nicht vergebenen ganzen Wert von 0 bis 100 wählen.':'Choose a unique integer from 0 to 100.',
  'Je Auswahl sind ein bis vier Werte erforderlich.':'Each selection needs one to four values.',
  'Bitte mindestens eine Zielposition auswählen.':'Choose at least one target position.',
  'Die Karteneinstellungen wurden geändert. Bitte neu laden.':'The card settings changed. Please reload.',
  'Keine Berechtigung zum Steuern.':'You do not have permission to control this.',
  'Der Rollladen ist nicht verfügbar.':'The cover is unavailable.',
  'Der Rollladen ist deaktiviert.':'The cover is disabled.',
  'Für diesen Rollladen ist bereits eine Einzelfahrt vorgemerkt.':'This cover already has a scheduled one-time movement.',
  'Einzelfahrt eingeplant.':'One-time movement scheduled.','Fahrbefehl übergeben.':'Movement command submitted.',
  'Gestoppt.':'Stopped.','Karteneinstellungen gespeichert.':'Card settings saved.',
  'Keine Geräte ausgewählt. Als Administrator unten rechts die Einstellungen öffnen.':'No covers selected. As an administrator, open Settings at the bottom right.',
  'Keine freigegebenen Geräte in dieser Karte.':'No permitted covers in this card.',
  'Bis zu vier Werte je Auswahl. Zum Ändern einen Wert antippen.':'Up to four values per selection. Tap a value to edit it.',
  'Name oder Entität suchen':'Search name or entity','Alle sichtbaren auswählen':'Select all visible','Auswahl aufheben':'Clear selection',
  'Keine Treffer für diese Auswahl.':'No matches for this selection.','Karten-ID':'Card ID',
  'Gleiche ID verwendet dieselben Einstellungen. Für eine weitere Karte eine andere ID wählen.':'The same ID shares its settings. Use a different ID for an independent card.',
  'Nur HA-Administratoren dürfen die Karte einrichten.':'Only HA administrators can configure the card.',
  'Oberfläche':'Interface','Neu laden':'Reload','Start:':'Start:'
};
Object.assign(translations,{
  'Reihenfolge':'Order',
  'Ausgewählte Rollläden und Jalousien':'Selected shutters and blinds',
  'Reihenfolge ändern':'Change order',
  'Höhenpositionen für Rollläden (%)':'Shutter height positions (%)',
  'Jalousien: Höhe über Unten und Oben steuern. Nur die Lamellen sind einstellbar.':'Blinds: use the Down and Up height buttons. Only tilt is configurable.'
});
Object.assign(translations,{
  'Anzeigename bearbeiten':'Edit display name','Anzeigename':'Display name',
  'Dieser Name gilt nur für diese Karte. Leer lassen verwendet den Namen aus Shutter Manager.':'This name applies only to this card. Leave it empty to use the Shutter Manager name.',
  'Der Anzeigename darf höchstens 100 Zeichen enthalten.':'The display name may contain at most 100 characters.'
});
Object.assign(translations,{'Unten':'Down','Oben':'Up','Fahrpfeile und Stopp':'Direction arrows and stop','Fahrpfeile und Stopp anzeigen':'Show direction arrows and stop'});

class ShutterManualCard extends HTMLElement {
  static getStubConfig() { return {type:'custom:shutter-manual-card',card_id:newCardId()}; }
  static getConfigElement() { return document.createElement('shutter-manual-card-editor'); }
  setConfig(config) {
    const key = config.card_id || 'default';
    if (typeof key!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(key)) throw new Error('Invalid card_id (letters, numbers, _ or -, up to 80 characters).');
    if (this.config?.card_id !== key) { this.closeDialog();this.data=null;this.loaded=false;this.error='';this.interacting=false; }
    this.config={...config,card_id:key};
    if (!this.shadowRoot) this.attachShadow({mode:'open'});
    this.render();
    if (this._hass && this.isConnected) this.refresh();
  }
  set hass(hass) { this._hass=hass;if(!this.loaded&&!this.loading&&this.isConnected&&this.config)this.refresh(); }
  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({mode:'open'});
    this.unbind ||= bindUI(this.shadowRoot,event=>this.onAction(event));
    this.inputHandler ||= event=>this.onInput(event);
    this.submitHandler ||= event=>{event.preventDefault();const action={'manual-preset-form':'save-value','manual-name-form':'save-name','manual-plan-form':'save-plan'}[event.target.id];if(action)this.onAction({action});};
    this.shadowRoot.addEventListener('change',this.inputHandler);
    this.shadowRoot.addEventListener('input',this.inputHandler);
    this.shadowRoot.addEventListener('submit',this.submitHandler);
    this.queueHeightLabels();
    clearInterval(this.timer);
    this.timer=setInterval(()=>{if(document.visibilityState==='visible'&&!this.editor&&!this.busy&&!this.interacting)this.refresh();},5000);
    if(this._hass&&this.config)this.refresh();
  }
  disconnectedCallback() {
    clearInterval(this.timer);this.unbind?.();this.unbind=null;
    this.shadowRoot?.removeEventListener('change',this.inputHandler);
    this.shadowRoot?.removeEventListener('input',this.inputHandler);
    this.shadowRoot?.removeEventListener('submit',this.submitHandler);
    this.closeDialog();
  }
  getCardSize() { return Math.max(2,Math.ceil((this.settings?.selected.length||0)/2)*4); }
  getGridOptions() { return {columns:12,min_columns:6,rows:'auto'}; }
  get settings() { return this.data?.settings; }
  get available() { return this.data?.available||[]; }
  get canConfigure() { return Boolean(this.data?.can_configure&&this._hass?.user?.is_admin); }
  get english() { return (this.config?.language||this._hass?.locale?.language||this._hass?.language||'de').startsWith('en'); }
  t(text) { return this.english?(translations[text]||text):text; }
  get(id) { return this.shadowRoot?.getElementById(id); }
  find(id) { return this.available.find(device=>device.id===id); }
  displayName(device,settings=this.settings) { const name=settings?.names?.[device.id];return typeof name==='string'&&name.trim()?name.trim():device.name; }
  safeNumber(value) { return typeof value==='number'&&Number.isFinite(value)?value:null; }
  clockNow() { const server=Date.parse(this.data?.now);return Number.isFinite(server)&&this.receivedAt?server+(Date.now()-this.receivedAt):Date.now(); }
  label(value,height=false) { const number=this.safeNumber(value);return number===null?'—':height&&number===100?this.t('Oben'):height&&number===0?this.t('Unten'):number+' %'; }
  rangeMarkup(options,height=false) {
    return rangeControl({reverse:true,keepLabel:options.allowKeep===false?'—':this.t('Unverändert'),...options}).replace('data-ui-range','data-ui-range'+(height?' data-manual-height':''));
  }
  updateHeightRanges() {
    for(const control of this.shadowRoot?.querySelectorAll('[data-manual-height]')||[]){
      const input=control.querySelector('input'),keep=control.dataset.keep==='true';
      const value=control.dataset.reverse==='true'?Number(input.max)+Number(input.min)-Number(input.value):Number(input.value);
      const text=keep?control.dataset.keepLabel:this.label(value,true),output=control.querySelector('output');
      if(output.textContent!==text)output.textContent=text;
      if(input.getAttribute('aria-valuetext')!==text)input.setAttribute('aria-valuetext',text);
    }
  }
  queueHeightLabels() { queueMicrotask(()=>this.updateHeightRanges()); }
  usable(device,feature,allowDisabled=false) { return Boolean(device.can_control&&(allowDisabled||device.enabled)&&!['unknown','unavailable',''].includes(device.state)&&(device.features&feature)); }
  usesPresets(device,axis) { return device.blind&&axis==='height'||this.settings.mode==='presets'; }
  axisValues(device,axis) { return device.blind&&axis==='height'?[0,100]:this.settings[axis==='tilt'?'tilt_values':'height_values']; }
  async refresh() {
    if(!this._hass||!this.config||this.loading||this.busy||this.editor)return;
    const cardId=this.config.card_id;
    this.loading=true;
    try { const result=await this._hass.callWS({type:'rollladenplaner/manual/get',card_id:cardId});if(!this.isConnected||this.config.card_id!==cardId)return;this.data=result;this.receivedAt=Date.now();this.loaded=true;this.error='';this.render(); }
    catch(error) { if(this.config.card_id===cardId){this.error=error.message||String(error);this.render();} }
    finally { this.loading=false;if(this.isConnected&&this.config.card_id!==cardId)this.refresh(); }
  }
  async request(kind,payload) {
    if(this.busy)return false;
    const cardId=this.config.card_id;
    this.busy=true;
    const buttons=[...this.shadowRoot.querySelectorAll('button')].map(element=>({element,disabled:element.disabled}));
    buttons.forEach(({element})=>element.disabled=true);
    try {
      const result=await this._hass.callWS({type:'rollladenplaner/manual/'+kind,card_id:cardId,...payload});
      if(this.config.card_id!==cardId)return false;
      this.data=result;this.receivedAt=Date.now();this.loaded=true;this.error='';return true;
    } catch(error) { if(this.config.card_id===cardId)this.error=error.message||String(error);return false; }
    finally { this.busy=false;buttons.forEach(({element,disabled})=>{if(element.isConnected)element.disabled=disabled;});this.updateError();if(this.isConnected&&this.config.card_id!==cardId)this.refresh(); }
  }
  updateError() {
    const node=this.shadowRoot.querySelector(this.editor?'[data-manual-dialog-error]':'[data-manual-error]');
    if(node)node.innerHTML=this.error?formError(this.t(this.error)):'';
  }
  presetMarkup({id,label,value,values,action,data={},disabled=false,allowKeep=false,heightLabels=false}) {
    const valueButton=(number,text)=>button({label:text,action,compact:true,data:{...data,value:number===null?'keep':String(number)},disabled,variant:number===value?'primary':'text'}).replace('<button ',`<button aria-pressed="${number===value}" `);
    return `<div id="${escapeHtml(id)}-control"><div>${row({title:label,trailing:`<output>${value===null?(allowKeep?this.t('Unverändert'):'—'):escapeHtml(this.label(value,heightLabels))}</output>`})}</div><div class="manual-values" role="group" aria-label="${escapeHtml(label)}" style="--manual-value-count:${values.length}">${[...values].sort((left,right)=>right-left).map(number=>valueButton(number,this.label(number,heightLabels))).join('')}</div>${allowKeep?`<div class="toolbar">${valueButton(null,this.t('Unverändert'))}</div>`:''}</div>`;
  }
  axisMarkup(device,axis) {
    const tilt=axis==='tilt',label=this.t(tilt?'Lamellen':'Höhe'),value=this.safeNumber(device[tilt?'tilt':'position']),disabled=!this.usable(device,tilt?128:4),id=axis+'-'+device.id;
    return this.usesPresets(device,axis)?this.presetMarkup({id,label,value,values:this.axisValues(device,axis),action:'position-preset',data:{device:device.id,axis},disabled,heightLabels:!tilt}):this.rangeMarkup({id,label,value,allowKeep:false,action:'position-range',disabled},!tilt).replace('data-ui-range','data-device="'+escapeHtml(device.id)+'" data-axis="'+axis+'" data-ui-range');
  }
  deviceMarkup(device) {
    const name=this.displayName(device);
    const transport=this.settings.show_controls!==false?`<div class="toolbar manual-transport" role="group" aria-label="${escapeHtml(name)}">${[['up','Hoch',5],['media-stop','Stopp',8],['down','Runter',6]].map(([icon,text,feature])=>iconButton({icon,label:this.t(text)+' · '+name,action:text==='Hoch'?'up':text==='Runter'?'down':'stop',data:{device:device.id},disabled:!this.usable(device,feature,text==='Stopp')})).join('')}</div>`:'';
    return `<article class="subpanel manual-device" data-manual-device="${escapeHtml(device.id)}">${row({title:name,trailing:iconButton({icon:'schedule',label:this.t('Einzelfahrt planen')+' · '+name,action:'plan',data:{device:device.id},disabled:!this.usable(device,4)})})}${transport}${this.axisMarkup(device,'height')}${device.blind?this.axisMarkup(device,'tilt'):''}</article>`;
  }
  render() {
    if(!this.shadowRoot||this.editor)return;
    const tools=this.canConfigure?`<div class="toolbar manual-card-tools">${iconButton({icon:'settings',label:this.t('Einstellungen'),action:'navigate',data:{page:'settings'}}).replace('class="edit-button"','class="settings-button"')}</div>`:'';
    const devices=this.settings?.selected.map(id=>this.find(id)).filter(Boolean)||[];
    const body=!this.loaded?loadingState():devices.length?`<div class="manual-devices ${this.settings.columns==='1'?'manual-one':this.settings.columns==='3'?'manual-three':''}">${devices.map(device=>this.deviceMarkup(device)).join('')}</div>`:emptyState(this.t(this.canConfigure?'Keine Geräte ausgewählt. Als Administrator unten rechts die Einstellungen öffnen.':'Keine freigegebenen Geräte in dieser Karte.'));
    this.shadowRoot.innerHTML=`<style data-ui-kit>${UI_CSS}</style><style data-manual-layout>${layout}</style><ha-card><main><div data-manual-error>${this.error?formError(this.t(this.error)):''}</div>${this.error?button({label:this.t('Neu laden'),action:'reload'}):''}${body}${tools}</main></ha-card>`;
    this.queueHeightLabels();
  }
  closeValueDialog() { const node=this.get('manual-value-dialog');if(node?.open)node.close();node?.remove();this.valueEditor=null; }
  closeNameDialog() { const node=this.get('manual-name-dialog');if(node?.open)node.close();node?.remove();this.nameEditor=null; }
  closeDialog() { this.closeNameDialog();this.closeValueDialog();const node=this.get('manual-dialog');if(node?.open)node.close();node?.remove();this.editor=null;if(this.opener?.isConnected)this.opener.focus(); }
  mountDialog(title,content,actions) {
    this.shadowRoot.querySelector('ha-card').insertAdjacentHTML('beforeend',dialog({id:'manual-dialog',title,content,actions,closeLabel:this.t('Schließen')}));
    const node=this.get('manual-dialog');if(this.editor.type==='plan')node.classList.add('manual-plan');
    node.addEventListener('close',()=>{if(this.get('manual-dialog')===node){this.closeNameDialog();this.closeValueDialog();this.editor=null;if(this.opener?.isConnected)this.opener.focus();}node.remove();});node.showModal();this.queueHeightLabels();
  }
  presetEditorMarkup(axis) {
    const values=this.editor.settings[axis==='height'?'height_values':'tilt_values'];
    return `<div>${row({title:this.t(axis==='height'?'Höhenpositionen für Rollläden (%)':'Lamellenpositionen (%)')})}</div>${values.map((value,index)=>`<div class="manual-preset-entry">${button({label:value+' %',action:'edit-value',data:{axis,index},compact:true})}${iconButton({icon:'trash',label:this.t('Entfernen')+' · '+value+' %',action:'remove-value',data:{axis,index}})}</div>`).join('')}${button({label:this.t('Wert hinzufügen'),icon:'add',action:'add-value',data:{axis},disabled:values.length>=4})}`;
  }
  selectedOrderMarkup() {
    const selected=this.editor.settings.selected;
    return `<div>${row({title:this.t('Reihenfolge')})}</div><div role="list" aria-label="${escapeHtml(this.t('Ausgewählte Rollläden und Jalousien'))}">${selected.map((id,index)=>{const device=this.find(id);if(!device)return '';const name=this.displayName(device,this.editor.settings);return `<div role="listitem" data-manual-selected="${escapeHtml(id)}">${row({title:name,description:name===device.name?'':device.name,trailing:iconButton({icon:'edit',label:this.t('Anzeigename bearbeiten')+' · '+name,action:'edit-name',data:{device:id}})+orderHandle({id,index,count:selected.length,action:'reorder-devices',group:'manual-selected',label:this.t('Reihenfolge ändern')+' · '+name})})}</div>`;}).join('')}</div>`;
  }
  updateSelectedDevices() {
    const selected=this.editor.settings.selected;
    this.get('manual-selected-order').innerHTML=this.selectedOrderMarkup();
    this.get('manual-height-values').hidden=!selected.some(id=>this.find(id)&&!this.find(id).blind);
    this.get('manual-tilt-values').hidden=!selected.some(id=>this.find(id)?.blind);
    this.get('manual-blind-hint').hidden=!selected.some(id=>this.find(id)?.blind);
  }
  setupMarkup() {
    const settings=this.editor.settings;
    return `<div class="grid"><div class="full">${selectField({id:'manual-mode',label:this.t('Bedienung'),value:settings.mode,options:[{value:'presets',label:this.t('Feste Positionen')},{value:'sliders',label:this.t('Schieberegler')}]})}</div><div class="full">${row({title:this.t('Fahrpfeile und Stopp'),trailing:toggle({label:this.t('Fahrpfeile und Stopp anzeigen'),action:'show-manual-controls',checked:settings.show_controls!==false,iconOnly:true})})}</div><p class="hint full" id="manual-blind-hint"${settings.selected.some(id=>this.find(id)?.blind)?'':' hidden'}>${escapeHtml(this.t('Jalousien: Höhe über Unten und Oben steuern. Nur die Lamellen sind einstellbar.'))}</p><div class="full" id="manual-presets"${settings.mode==='presets'?'':' hidden'}><div class="grid"><div class="full" id="manual-height-values"${settings.selected.some(id=>this.find(id)&&!this.find(id).blind)?'':' hidden'}>${this.presetEditorMarkup('height')}</div><div class="full" id="manual-tilt-values"${settings.selected.some(id=>this.find(id)?.blind)?'':' hidden'}>${this.presetEditorMarkup('tilt')}</div><p class="hint full">${escapeHtml(this.t('Bis zu vier Werte je Auswahl. Zum Ändern einen Wert antippen.'))}</p></div></div><div class="full">${multiSelect({id:'manual-devices',label:this.t('Rollläden und Jalousien'),items:this.available.map(device=>({value:device.id,label:device.name,hint:device.cover})),values:settings.selected,selectedFirst:true,action:'select-devices',searchLabel:this.t('Name oder Entität suchen'),allLabel:this.t('Alle sichtbaren auswählen'),clearLabel:this.t('Auswahl aufheben'),emptyLabel:this.t('Keine Treffer für diese Auswahl.')})}</div><div class="full" id="manual-selected-order">${this.selectedOrderMarkup()}</div><div class="full">${selectField({id:'manual-columns',label:this.t('Spalten auf breiten Ansichten'),value:settings.columns,options:[['auto','Automatisch'],['1','Eine Spalte'],['2','Zwei Spalten'],['3','Drei Spalten']].map(([value,label])=>({value,label:this.t(label)}))})}</div><div class="full" data-manual-dialog-error></div></div>${versionInfo({frontend:MANUAL_CARD_VERSION,backend:this.data.backend_version,ui:UI_VERSION,label:this.t('Oberfläche')})}`;
  }
  openSetup(element) {
    if(!this.canConfigure)return;
    this.closeDialog();this.opener=element;this.editor={type:'setup',settings:copy(this.settings),revision:this.data.card_revision};this.error='';
    this.mountDialog(this.t('Einstellungen'),this.setupMarkup(),button({label:this.t('Abbrechen'),action:'cancel-dialog'})+button({label:this.t('Übernehmen'),action:'save-settings',variant:'primary'}));
  }
  refreshPresetEditors() { for(const axis of ['height','tilt']){const node=this.get('manual-'+axis+'-values');if(node)node.innerHTML=this.presetEditorMarkup(axis);} }
  openName(id) {
    if(!this.canConfigure||this.editor?.type!=='setup'||!this.editor.settings.selected.includes(id))return;
    const device=this.find(id);if(!device)return;this.closeValueDialog();this.closeNameDialog();this.nameEditor={id};
    const content=`<form id="manual-name-form">${row({title:device.name})}${field({id:'manual-cover-name',label:this.t('Anzeigename'),value:this.editor.settings.names?.[id]||'',placeholder:device.name,maxLength:100,hint:this.t('Dieser Name gilt nur für diese Karte. Leer lassen verwendet den Namen aus Shutter Manager.')})}<div data-manual-name-error></div></form>`;
    this.shadowRoot.querySelector('ha-card').insertAdjacentHTML('beforeend',dialog({id:'manual-name-dialog',title:this.t('Anzeigename bearbeiten'),content,closeLabel:this.t('Schließen'),actions:button({label:this.t('Abbrechen'),action:'cancel-name'})+button({label:this.t('Übernehmen'),action:'save-name',variant:'primary'})}));
    const node=this.get('manual-name-dialog');node.addEventListener('close',()=>{if(this.get('manual-name-dialog')===node)this.nameEditor=null;node.remove();});node.showModal();this.get('manual-cover-name').focus();
  }
  openValue(axis,index=null) {
    if(!this.canConfigure||this.editor?.type!=='setup'||!['height','tilt'].includes(axis))return;
    const values=this.editor.settings[axis==='height'?'height_values':'tilt_values'];
    if(index===null?values.length>=4:!Number.isInteger(index)||index<0||index>=values.length)return;
    this.closeNameDialog();this.closeValueDialog();this.valueEditor={axis,index};
    const value=index===null?[25,50,75,100,0,1,2,3].find(number=>!values.includes(number)):values[index];
    const content=`<form id="manual-preset-form">${numberControl({id:'manual-preset-value',label:this.t('Position (%)'),value,min:0,max:100,step:1,required:true})}<div data-manual-value-error></div></form>`;
    this.shadowRoot.querySelector('ha-card').insertAdjacentHTML('beforeend',dialog({id:'manual-value-dialog',title:this.t(index===null?'Wert hinzufügen':'Wert ändern'),content,closeLabel:this.t('Schließen'),actions:button({label:this.t('Abbrechen'),action:'cancel-value'})+button({label:this.t(index===null?'Hinzufügen':'Übernehmen'),action:'save-value',variant:'primary'})}));
    const node=this.get('manual-value-dialog');node.addEventListener('close',()=>{if(this.get('manual-value-dialog')===node)this.valueEditor=null;node.remove();});node.showModal();this.get('manual-preset-value').focus();
  }
  planMarkup() {
    const editor=this.editor,device=this.find(editor.target);
    const axis=(key,label)=>this.usesPresets(device,key==='position'?'height':'tilt')?this.presetMarkup({id:'plan-'+key,label:this.t(label),value:editor[key],values:this.axisValues(device,key==='position'?'height':'tilt'),action:'plan-preset',data:{axis:key},allowKeep:true,heightLabels:key==='position'}):this.rangeMarkup({id:'plan-'+key,label:this.t(label),value:editor[key],action:'plan-range',allowKeep:true},key==='position');
    return `<form id="manual-plan-form"><div class="grid"><div class="full">${row({title:this.displayName(device)})}</div><div class="toolbar full">${filterButton({label:this.t('Timer'),action:'timer-mode',selected:editor.mode==='timer'})}${filterButton({label:this.t('Uhrzeit'),action:'clock-mode',selected:editor.mode==='clock'})}</div><div class="full">${editor.mode==='timer'?numberControl({id:'manual-minutes',label:this.t('Start in Minuten'),value:editor.minutes,min:1,max:1440,step:1,required:true,presets:[5,15,30,60],action:'minutes-change'}):field({id:'manual-clock',label:this.t('Start um'),type:'time',value:editor.time,required:true,step:60})}</div><div class="full">${axis('position','Zielhöhe')}</div>${device.blind?`<div class="full">${axis('tilt','Lamellen')}</div>`:''}<div class="full" data-manual-start aria-live="polite"></div><div class="full" data-manual-dialog-error></div></div></form>`;
  }
  startSummary() {
    if(this.editor?.type!=='plan')return;
    const editor=this.editor,node=this.shadowRoot.querySelector('[data-manual-start]');if(!node)return;
    const timeZone=this.data.time_zone,now=this.clockNow(),format=new Intl.DateTimeFormat(this.english?'en-GB':'de-DE',{timeZone,weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
    node.innerHTML=feedback(this.t('Start:')+' '+(editor.mode==='timer'&&Number.isFinite(Number(editor.minutes))?format.format(new Date(now+Number(editor.minutes)*60000)):editor.time||'—'));
  }
  openPlan(id,element) {
    const device=this.find(id);if(!device||!this.usable(device,4))return;
    this.closeDialog();this.opener=element;this.error='';
    const time=new Intl.DateTimeFormat('en-GB',{timeZone:this.data.time_zone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(this.clockNow()+30*60000));
    const position=this.safeNumber(device.position);
    this.editor={type:'plan',target:id,mode:'timer',minutes:15,time,position:device.blind?([0,100].includes(position)?position:null):position??100,tilt:null};
    this.mountDialog(this.t('Einzelfahrt planen'),this.planMarkup(),button({label:this.t('Abbrechen'),action:'cancel-dialog'})+button({label:this.t('Einplanen'),action:'save-plan',variant:'primary'}));this.startSummary();
  }
  updatePlanControls() {
    for(const key of ['position','tilt']){
      const control=this.get('plan-'+key+'-control');if(!control)continue;
      const value=this.editor[key],text=value===null?this.t('Unverändert'):this.label(value,key==='position');control.querySelector('output').textContent=text;
      control.querySelector('input[type="range"]')?.setAttribute('aria-valuetext',text);
      control.querySelectorAll('button[data-value]').forEach(element=>{const selected=value===null?element.dataset.value==='keep':element.dataset.value!=='keep'&&Number(element.dataset.value)===value;element.classList.toggle('primary',selected);element.setAttribute('aria-pressed',String(selected));});
    }
  }
  onInput(event) {
    if(this.editor?.type==='setup'&&this.canConfigure){if(event.target.id==='manual-mode'){this.editor.settings.mode=event.target.value;this.get('manual-presets').hidden=event.target.value!=='presets';}return;}
    if(this.editor?.type!=='plan')return;
    if(event.target.id==='manual-minutes')this.editor.minutes=Number(event.target.value);
    if(event.target.id==='manual-clock')this.editor.time=event.target.value;
    this.startSummary();
  }
  async onAction({action,data={},value,phase,element,checked}) {
    if(action==='position-range'&&data.axis==='height'||action==='plan-range'&&element?.id==='plan-position-control')this.updateHeightRanges();
    const setupActions=['save-settings','select-devices','reorder-devices','show-manual-controls','edit-name','save-name','cancel-name','add-value','edit-value','remove-value','save-value','cancel-value'];
    if((setupActions.includes(action)||action==='navigate'&&data.page==='settings')&&!this.canConfigure)return;
    if(this.busy)return;
    if(action==='navigate'&&data.page==='settings'){this.openSetup(element);return;}
    if(action==='reload'){this.closeDialog();await this.refresh();return;}
    if(action==='cancel-dialog'){this.closeDialog();this.error='';this.render();return;}
    if(action==='edit-name'){this.openName(data.device);return;}
    if(action==='cancel-name'){this.closeNameDialog();return;}
    if(action==='save-name'&&this.editor?.type==='setup'&&this.nameEditor){
      if(!this.get('manual-name-form').reportValidity())return;
      const name=this.get('manual-cover-name').value.trim(),id=this.nameEditor.id;
      if(name.length>100){this.shadowRoot.querySelector('[data-manual-name-error]').innerHTML=formError(this.t('Der Anzeigename darf höchstens 100 Zeichen enthalten.'));return;}
      const names={...this.editor.settings.names,[id]:name};if(!name)delete names[id];this.editor.settings.names=names;this.closeNameDialog();this.updateSelectedDevices();return;
    }
    if(action==='show-manual-controls'&&this.editor?.type==='setup'){this.editor.settings.show_controls=Boolean(checked);element.outerHTML=toggle({label:this.t('Fahrpfeile und Stopp anzeigen'),action:'show-manual-controls',checked:Boolean(checked),iconOnly:true});return;}
    if(action==='select-devices'&&this.editor?.type==='setup'){
      if(!Array.isArray(value)||value.some(id=>!this.find(id)))return;
      const previous=this.editor.settings.selected;
      this.editor.settings.selected=[...previous.filter(id=>value.includes(id)),...value.filter(id=>!previous.includes(id))];
      this.updateSelectedDevices();return;
    }
    if(action==='reorder-devices'&&this.editor?.type==='setup'){
      const selected=this.editor.settings.selected,from=selected.indexOf(data.program),offset=Number(data.offset),to=from+offset;
      if(from<0||!Number.isInteger(offset)||!offset||to<0||to>=selected.length)return;
      selected.splice(to,0,...selected.splice(from,1));this.updateSelectedDevices();return;
    }
    if(action==='save-settings'&&this.editor?.type==='setup'){
      const settings=this.editor.settings;settings.mode=this.get('manual-mode').value;settings.columns=this.get('manual-columns').value;
      if(await this.request('save',{settings,card_revision:this.editor.revision})){this.closeDialog();this.render();}return;
    }
    if(action==='add-value'){this.openValue(data.axis);return;}
    if(action==='edit-value'){this.openValue(data.axis,Number(data.index));return;}
    if(action==='cancel-value'){this.closeValueDialog();return;}
    if(action==='remove-value'&&this.editor?.type==='setup'&&['height','tilt'].includes(data.axis)){
      const values=this.editor.settings[data.axis==='height'?'height_values':'tilt_values'],index=Number(data.index);if(Number.isInteger(index)&&index>=0&&index<values.length)values.splice(index,1);this.refreshPresetEditors();return;
    }
    if(action==='save-value'&&this.editor?.type==='setup'&&this.valueEditor){
      if(!this.get('manual-preset-form').reportValidity())return;
      const {axis,index}=this.valueEditor,values=this.editor.settings[axis==='height'?'height_values':'tilt_values'],number=Number(this.get('manual-preset-value').value);
      if(!Number.isInteger(number)||number<0||number>100||values.some((item,i)=>item===number&&i!==index)||index===null&&values.length>=4){this.shadowRoot.querySelector('[data-manual-value-error]').innerHTML=formError(this.t('Bitte einen noch nicht vergebenen ganzen Wert von 0 bis 100 wählen.'));return;}
      if(index===null)values.push(number);else values[index]=number;this.closeValueDialog();this.refreshPresetEditors();return;
    }
    if(action==='plan'){this.openPlan(data.device,element);return;}
    if((action==='timer-mode'||action==='clock-mode')&&this.editor?.type==='plan'){this.editor.mode=action==='timer-mode'?'timer':'clock';this.get('manual-dialog').querySelector('.modal-body').innerHTML=this.planMarkup();this.startSummary();this.queueHeightLabels();return;}
    if(action==='minutes-change'&&this.editor?.type==='plan'){this.editor.minutes=value;this.startSummary();return;}
    if(action==='plan-preset'&&this.editor?.type==='plan'&&['position','tilt'].includes(data.axis)){const number=data.value==='keep'?null:Number(data.value),device=this.find(this.editor.target),axis=data.axis==='position'?'height':'tilt';if(!this.usesPresets(device,axis)||number!==null&&!this.axisValues(device,axis).includes(number))return;this.editor[data.axis]=number;this.updatePlanControls();return;}
    if(action==='plan-range'&&this.editor?.type==='plan'){const axis=element.id==='plan-position-control'?'position':'tilt';if(this.usesPresets(this.find(this.editor.target),axis==='position'?'height':'tilt'))return;this.editor[axis]=value;return;}
    if(action==='save-plan'&&this.editor?.type==='plan'){
      if(!this.get('manual-plan-form').reportValidity())return;
      if(this.editor.mode==='timer')this.editor.minutes=Number(this.get('manual-minutes').value);else this.editor.time=this.get('manual-clock').value;
      const {target,position,tilt,mode,minutes,time}=this.editor;
      if(await this.request('action',{action:'plan',target,position,tilt,mode,minutes,time})){this.closeDialog();this.render();}return;
    }
    const device=this.find(data.device);
    if(!device||!this.settings?.selected.includes(device.id))return;
    if(['up','down','stop'].includes(action)){
      if(!this.usable(device,action==='stop'?8:action==='up'?5:6,action==='stop'))return;
      await this.request('action',{action,target:device.id});this.render();return;
    }
    if(action==='position-preset'){
      if(!['height','tilt'].includes(data.axis)||!this.usesPresets(device,data.axis)||data.axis==='tilt'&&!device.blind)return;
      const number=Number(data.value),tilt=data.axis==='tilt';
      if(!this.axisValues(device,data.axis).includes(number)||!this.usable(device,tilt?128:4))return;
      await this.request('action',{action:'position',target:device.id,position:tilt?null:number,tilt:tilt?number:null});this.render();return;
    }
    if(action==='position-range'){
      const tilt=data.axis==='tilt';if(!['height','tilt'].includes(data.axis)||this.usesPresets(device,data.axis)||tilt&&!device.blind||!this.usable(device,tilt?128:4))return;
      this.interacting=phase==='input';if(phase!=='change')return;
      if(!Number.isFinite(value)||value<0||value>100)return;
      await this.request('action',{action:'position',target:device.id,position:tilt?null:value,tilt:tilt?value:null});this.render();
    }
  }
}

class ShutterManualCardEditor extends HTMLElement {
  setConfig(config) { this.config={...config};if(!this.shadowRoot)this.attachShadow({mode:'open'});this.render(); }
  set hass(hass) { this._hass=hass;this.render(); }
  render() {
    if(!this.shadowRoot||!this._hass)return;
    const admin=this._hass.user?.is_admin;
    const english=(this._hass.locale?.language||this._hass.language||'de').startsWith('en');
    this.shadowRoot.innerHTML=`<style>${UI_CSS}</style>${admin?field({id:'manual-card-id',label:english?'Card ID':'Karten-ID',value:this.config.card_id||'default',required:true,hint:english?'Use a different ID for each independent card. Identical IDs share the same settings.':'Jede unabhängige Karte benötigt eine eigene ID. Gleiche IDs teilen dieselben Einstellungen.'})+button({label:english?'New configuration':'Neue Konfiguration',icon:'add',action:'new-card-configuration'})+feedback(english?'Creates a new empty configuration for this card. Existing configurations are retained.':'Erzeugt eine neue, leere Konfiguration für diese Karte. Bisherige Konfigurationen bleiben erhalten.'):feedback(english?'Only HA administrators can configure the card.':'Nur HA-Administratoren dürfen die Karte einrichten.')}`;
    const commit=id=>{if(!this._hass.user?.is_admin)return;this.config={...this.config,card_id:id};this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:this.config},bubbles:true,composed:true}));};
    this.shadowRoot.getElementById('manual-card-id')?.addEventListener('change',event=>{if(!/^[a-zA-Z0-9_-]{1,80}$/.test(event.target.value))return;commit(event.target.value);});
    this.shadowRoot.querySelector('[data-action="new-card-configuration"]')?.addEventListener('click',()=>{if(!this._hass.user?.is_admin)return;commit(newCardId());this.render();});
  }
}
if(!customElements.get('shutter-manual-card'))customElements.define('shutter-manual-card',ShutterManualCard);
if(!customElements.get('shutter-manual-card-editor'))customElements.define('shutter-manual-card-editor',ShutterManualCardEditor);
window.customCards=window.customCards||[];
if(!window.customCards.some(card=>card.type==='shutter-manual-card'))window.customCards.push({type:'shutter-manual-card',name:'Shutter Manager – Bedienung',description:'Manually move shutters and blinds and schedule one-time movements.',preview:false});
