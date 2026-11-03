"""Validate actual browser-created configs using the shipped backend validator."""
import importlib.util
import json
from pathlib import Path
import sys
p=Path(__file__).resolve().parents[1]/'custom_components/light_manager/engine.py'
spec=importlib.util.spec_from_file_location('ui_engine',p)
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
try:
    checked=m.validate(json.load(sys.stdin));print(json.dumps({'ok':True,'config':checked}))
except (ValueError,TypeError,KeyError) as e:
    print(json.dumps({'ok':False,'error':str(e)}))
