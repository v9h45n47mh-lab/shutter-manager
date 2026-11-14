"""JSON test host using the production Manager, a durable fixture store and fake HA I/O."""
import asyncio
from copy import deepcopy
import json
from pathlib import Path
import sys
import types
from unittest.mock import AsyncMock
from test_manager import adapter, FakeState
from test_engine import fixture, at, solar


async def main():
    path=Path(sys.argv[1]);message=json.loads(sys.argv[2])
    if not path.exists():
        config,_=fixture();config['windows'][0]['contacts']=[]
        config['windows'][0]['climate']={'temp_entity':'sensor.temp','lux_entity':'sensor.lux','temp_on':25,'temp_off':23,
            'lux_on':30000,'lux_off':20000,'auto_shade':True,'shade_position':0,'shade_tilt':100,'release_delay_seconds':45}
        config['windows'].append({'id':'offline','name':'Nicht verbunden','cover':'cover.offline','enabled':True,'contacts':[]})
        ride=deepcopy(config['programs'][0]['rides'][0]);ride.update(id='offline_ride',targets=['offline'],time='18:00',earliest='17:00',latest='20:00',position=80,tilt=50)
        config['programs'][0]['rides'].append(ride)
        path.write_text(json.dumps({'config':config,'runtime':{},'revision':0}))
    states={'cover.wohnen':{'state':'open','attributes':{'friendly_name':'Wohnen','device_class':'blind','supported_features':140,'current_position':100,'current_tilt_position':50}},
            'sensor.temp':{'state':'22','attributes':{'friendly_name':'Temperatur','device_class':'temperature','unit_of_measurement':'°C'}},
            'sensor.lux':{'state':'1000','attributes':{'friendly_name':'Helligkeit','device_class':'illuminance','unit_of_measurement':'lx'}}}
    states.update(message.get('fixture_states',{}))
    hass=types.SimpleNamespace(config=types.SimpleNamespace(time_zone='Europe/Berlin'),
        states=types.SimpleNamespace(get=lambda key:FakeState(states[key]['state'],**states[key]['attributes']) if key in states else None),
        services=types.SimpleNamespace(async_call=AsyncMock()))
    class DurableStore:
        async def async_load(self):return json.loads(path.read_text())
        async def async_save(self,data):path.write_text(json.dumps(data))
    manager=adapter.Manager(hass);manager.store=DurableStore();manager.states=lambda:states;manager.solar=solar
    adapter.utcnow=lambda:at(message.get('fixture_now','2026-10-30T12:00'))
    await manager.load()
    if message.get('fixture_previous'):
        manager.engine.last=at(message['fixture_previous'])
    read_only = message.get('fixture_read_only', False)
    user = types.SimpleNamespace(is_admin=not read_only,
        permissions=types.SimpleNamespace(check_entity=lambda entity, policy: policy == 'read'))
    try:
        if message['type'].endswith('/save'):await manager.save(message['config'],message['revision'])
        elif message['type'].endswith('/action'):await manager.action(user,message)
        elif not message['type'].endswith('/get'):raise ValueError('Unexpected test message')
        for _ in range(message.get('fixture_pulses', 1 if message.get('fixture_pulse') else 0)):
            await manager._pulse_locked()
        return {'ok':True,'snapshot':manager.snapshot(user),'states':states,'motor_calls':hass.services.async_call.call_count}
    except (ValueError,KeyError,TypeError) as error:
        return {'ok':False,'error':str(error)}


if __name__=='__main__':print(json.dumps(asyncio.run(main()),ensure_ascii=False))
