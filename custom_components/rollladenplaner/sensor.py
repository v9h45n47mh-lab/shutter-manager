"""Native planner status and today's failed-movement count."""
from homeassistant.components.sensor import SensorEntity
from homeassistant.const import EntityCategory
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from . import DOMAIN, SIGNAL, utcnow


async def async_setup_entry(hass, entry, async_add_entities):
    async_add_entities([PlannerSensor(entry.runtime_data), FailedMovementsTodaySensor(entry.runtime_data)])


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


class FailedMovementsTodaySensor(PlannerSensor):
    """Expose an aggregate count without publishing private history details."""

    _attr_name = 'Shutter Manager Failed Movements Today'
    _attr_unique_id = DOMAIN + '_failed_movements_today'
    _attr_icon = 'mdi:alert-circle-outline'
    _attr_entity_category = EntityCategory.DIAGNOSTIC
    _attr_suggested_display_precision = 0

    @property
    def native_value(self):
        windows = self.manager.engine.windows()
        return sum(1 for row in self.manager.engine.command_results_today(utcnow())
                   if row.get('kind') == 'error' and row.get('window') in windows)

    @property
    def extra_state_attributes(self):
        return {}
