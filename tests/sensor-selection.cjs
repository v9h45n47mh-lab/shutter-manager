/* Exercise the real card's sensor selection and save flow without a browser. */
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const assert = require('node:assert/strict');
const context = vm.createContext({HTMLElement: class {}, customElements: {get: () => null, define() {}}, window: {}, crypto: require('node:crypto').webcrypto, structuredClone});
const source = fs.readFileSync(path.join(__dirname, '../custom_components/rollladenplaner/frontend/shutter-manager-card.js'), 'utf8');

(async () => {
  await require('./frontend.cjs').loadCardIntoVm(context);
  const card = new context.Card();
  card.render = () => {};
  card._hass = {states: {'sensor.temp': {attributes: {device_class: 'temperature'}}, 'sensor.lux': {attributes: {unit_of_measurement: ' Lux '}}, 'sensor.power': {attributes: {device_class: 'power'}}}};
  card.data = {admin: true, revision: 1, config: {windows: [{id: 'w', name: 'Blind', cover: 'cover.blind', sensor_rules: []}], programs: []}};
  card.editor = {type: 'window', revision: 1, item: structuredClone(card.data.config.windows[0])};
  card._hass.states['sensor.new_unclassified'] = {state: '21', attributes: {friendly_name: 'New temperature'}};
  const select = () => card.entitySelect('sensor_rules.0.temp_entity', '', ['sensor'], 'temp');
  assert.ok(!select().includes('sensor.new_unclassified'));
  assert.ok(!select().includes('sensor.power'));
  assert.ok(card.entitySelect('x', '', ['sensor'], 'lux').includes('sensor.lux'));
  const click = action => card.onClick({target: {closest: () => ({dataset: {action}})}});
  await click('toggle-sensor-filter');
  assert.ok(select().includes('sensor.new_unclassified'), 'new sensor is available without recognized metadata');
  await click('add-rule');
  card.onChange({target: {dataset: {key: 'sensor_rules.0.temp_entity'}, value: 'sensor.new_unclassified', hasAttribute: () => false}});
  card.editor.item.sensor_rules[0].name = 'New rule';
  await click('toggle-sensor-filter');
  assert.ok(card.entitySelect('sensor_rules.0.temp_entity', 'sensor.new_unclassified', ['sensor'], 'temp').includes('sensor.new_unclassified'), 'assigned sensor stays available when filtering returns');
  let saved;
  card.request = async (action, payload) => {saved = structuredClone(payload.config); return true;};
  await card.saveEditor(false);
  assert.equal(saved.windows[0].sensor_rules[0].temp_entity, 'sensor.new_unclassified');
  assert.equal(saved.windows[0].sensor_rules[0].temp_on, undefined, 'cover stores assignments only');
  assert.equal(card.editor, null, 'successful save closes the editor');
  console.log('PASS: new unclassified sensor can be selected, retained and saved; typed suggestions and unit normalization work.');
})().catch(error => {console.error(error); process.exit(1);});
