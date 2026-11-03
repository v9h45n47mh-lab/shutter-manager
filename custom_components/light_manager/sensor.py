"""A compact native diagnostic status sensor."""
from homeassistant.components.sensor import SensorEntity
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from . import DOMAIN, SIGNAL


async def async_setup_entry(hass, entry, async_add_entities):
    async_add_entities([LightManagerSensor(entry.runtime_data)])


class LightManagerSensor(SensorEntity):
    _attr_name = 'Light Manager'
    _attr_unique_id = DOMAIN + '_status'
    _attr_icon = 'mdi:lightbulb-auto'
    _attr_should_poll = False

    def __init__(self, manager):
        self.manager = manager

    async def async_added_to_hass(self):
        self.async_on_remove(async_dispatcher_connect(self.hass, SIGNAL, self.async_write_ha_state))

    @property
    def native_value(self):
        if self.manager.errors or self.manager.engine.warnings: return 'Hinweis'
        return 'Urlaub' if self.manager.engine.config['vacation'] else 'Bereit'

    @property
    def extra_state_attributes(self):
        return {'version': '0.2.0', 'lampen': len(self.manager.engine.config['lamps']),
                'programme': len(self.manager.engine.config['programs']),
                'aktive_sensorregeln': sum(r['active'] for r in self.manager.engine.rules),
                'hinweise': len(self.manager.errors) + len(self.manager.engine.warnings)}
