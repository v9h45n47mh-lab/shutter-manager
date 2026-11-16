"""Production WebSocket endpoints with durable fixtures and simulated cover I/O."""
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
    now=at(message.pop('fixture_now','2026-11-16T12:00'))
    role=message.pop('fixture_role','admin');denied=set(message.pop('fixture_denied',[]));fail=message.pop('fixture_fail',False)
    states={'cover.wohnen':{'state':'open','attributes':{'device_class':'blind','supported_features':140,'current_position':35,'current_tilt_position':50}},
            'cover.bad':{'state':'open','attributes':{'device_class':'shutter','supported_features':12,'current_position':65}}}
    if not path.exists():
        config,_=fixture();config['programs']=[]
        config['windows'][0].update(name='Jalousie Essen',contacts=[],sensor_rules=[],climate=None,cover_type='blind')
        config['windows'].append({'id':'bad','name':'Rollladen Bad','cover':'cover.bad','enabled':True,'cover_type':'shutter','contacts':[]})
        path.write_text(json.dumps({'config':config,'runtime':{},'revision':0}))
    states.update(json.loads(path.read_text()).get('_test_states',{}))
    calls=[]
    async def call(domain,service,data,**kwargs):
        calls.append({'service':service,'data':deepcopy(data)})
        if fail:raise RuntimeError('Fixture connection failure')
        attrs=states[data['entity_id']]['attributes']
        if service=='set_cover_position':attrs['current_position']=data['position']
        if service=='set_cover_tilt_position':attrs['current_tilt_position']=data['tilt_position']
    grants={'view':True,'control':role in ('operator','manager','admin'),'manage':role in ('manager','admin')}
    hass=types.SimpleNamespace(config=types.SimpleNamespace(time_zone='Europe/Berlin'),
        states=types.SimpleNamespace(get=lambda key:FakeState(states[key]['state'],**states[key]['attributes']) if key in states else None),
        services=types.SimpleNamespace(async_call=AsyncMock(side_effect=call)),
        data={'family_access_manager':types.SimpleNamespace(application_protocol=1,application_permissions=lambda *_:grants)})
    class DurableStore:
        async def async_load(self):return json.loads(path.read_text())
        async def async_save(self,data):path.write_text(json.dumps({**data,'_test_states':states}))
    manager=adapter.Manager(hass);manager.store=DurableStore();manager.states=lambda:states;manager.solar=solar
    hass.data[adapter.DOMAIN]=manager;adapter.utcnow=lambda:now
    await manager.load()
    await manager._pulse_locked()
    user=types.SimpleNamespace(is_admin=role=='admin',permissions=types.SimpleNamespace(check_entity=lambda entity,policy:entity not in denied and (policy=='read' or role in ('operator','manager'))))
    result={}
    connection=types.SimpleNamespace(user=user,send_result=lambda _,data:result.update(ok=True,snapshot=data),send_error=lambda _,code,error:result.update(ok=False,error=error))
    endpoints={'rollladenplaner/manual/get':adapter.ws_manual_get,'rollladenplaner/manual/save':adapter.ws_manual_save,'rollladenplaner/manual/action':adapter.ws_manual_action,'rollladenplaner/get':adapter.ws_get}
    try:
        handler=endpoints[message['type']];validated=handler.ws_schema({'id':1,**message})
        await handler(hass,connection,validated)
        await manager.persist()
        # Physical state is owned by HA, independently of the integration store.
        saved=json.loads(path.read_text());saved['_test_states']=states
        path.write_text(json.dumps(saved))
    except Exception as error:result.update(ok=False,error=str(error))
    return {**result,'calls':calls}


if __name__=='__main__':print(json.dumps(asyncio.run(main()),ensure_ascii=False))
