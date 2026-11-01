"""A native diagnostic status entity for the planner."""
from homeassistant.components.sensor import SensorEntity
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from . import DOMAIN, SIGNAL


async def async_setup_entry(hass, entry, async_add_entities):
    async_add_entities([PlannerSensor(entry.runtime_data)])


class PlannerSensor(SensorEntity):
    _attr_name = 'Shutter Manager'
    _attr_unique_id = DOMAIN + '_status'
    _attr_icon = 'mdi:window-shutter-auto'
    _attr_should_poll = False

    def __init__(self, manager):
        self.manager = manager

    async def async_added_to_hass(self):
        self.async_on_remove(async_dispatcher_connect(self.hass, SIGNAL, self.async_write_ha_state))

    @property
    def native_value(self):
        c = self.manager.engine.config
        return 'Aus' if not c['enabled'] else 'Urlaub' if c['vacation'] else 'Aktiv'

    @property
    def extra_state_attributes(self):
        return {'programme': len(self.manager.engine.config['programs']),
                'fenster': len(self.manager.engine.config['windows']),
                'wartende_fahrten': sum(len(s) for s in self.manager.engine.rt['pending'].values()),
                'bewegungen': len(self.manager.moving)}
