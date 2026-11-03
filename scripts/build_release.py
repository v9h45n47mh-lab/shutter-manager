"""Build the manual upload archive without VCS or cloud operations."""
from pathlib import Path
import json
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parents[1]
version = json.loads((root/'custom_components/light_manager/manifest.json').read_text())['version']
output = root.parent / f'Light-Manager-{version}.zip'
temporary = output.with_suffix('.zip.tmp')
with ZipFile(temporary, 'w', ZIP_DEFLATED) as z:
    for path in sorted(root.rglob('*')):
        if path.is_file() and '__pycache__' not in path.parts and path.suffix != '.pyc':
            z.write(path, path.relative_to(root))
with ZipFile(temporary) as z:
    assert z.testzip() is None
temporary.replace(output)
print(output)
