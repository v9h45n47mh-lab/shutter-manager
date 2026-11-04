"""Validate the distribution layout and preserve source timestamps in release archives."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import re
import zipfile

ROOT = Path(__file__).resolve().parents[1]
COMPONENT = ROOT / 'custom_components' / 'rollladenplaner'


def validate_layout(tag=None):
    manifest = json.loads((COMPONENT / 'manifest.json').read_text())
    hacs = json.loads((ROOT / 'hacs.json').read_text())
    version = manifest['version']
    if tag and tag.removeprefix('v') != version:
        raise ValueError(f'Tag {tag} stimmt nicht mit manifest.json {version} überein.')
    if manifest['domain'] != 'rollladenplaner':
        raise ValueError('Die bestehende Integrations-Domain muss erhalten bleiben.')
    for key in ('documentation', 'issue_tracker', 'name', 'version', 'codeowners'):
        if not manifest.get(key):
            raise ValueError(f'Manifest-Feld fehlt: {key}')
    if not manifest['documentation'].startswith('https://github.com/'):
        raise ValueError('Eigene Repository-Dokumentation fehlt.')
    if hacs.get('zip_release') or hacs.get('content_in_root'):
        raise ValueError('Dieses Repository verwendet das Standardlayout custom_components/rollladenplaner.')
    if not hacs.get('render_readme') or not hacs.get('name'):
        raise ValueError('HACS-Name oder README-Anzeige fehlt.')
    folders = [p.name for p in (ROOT / 'custom_components').iterdir() if p.is_dir() and not p.name.startswith('.') and p.name != '__pycache__']
    if folders != ['rollladenplaner']:
        raise ValueError('Genau eine Integration pro Repository ist erforderlich.')
    for relative in ('README.md', 'HOWTO.md', 'LICENSE', 'hacs.json', 'custom_components/rollladenplaner/brand/icon.png',
                     'custom_components/rollladenplaner/translations/en.json',
                     'custom_components/rollladenplaner/frontend/shutter-manager-card.js'):
        if not (ROOT / relative).is_file():
            raise ValueError(f'Datei fehlt: {relative}')
    frontend = (COMPONENT / 'frontend/shutter-manager-card.js').read_text()
    adapter = (COMPONENT / '__init__.py').read_text()
    if f"const CARD_VERSION = '{version}'" not in frontend or f"INTEGRATION_VERSION = '{version}'" not in adapter:
        raise ValueError('Versionsangaben von Frontend und Integration unterscheiden sich.')
    if f'shutter-manager-card.js?v={version}' not in adapter:
        raise ValueError('Der Ressourcenpfad benötigt die aktuelle Version.')
    py_schema = re.search(r'^CONFIG_SCHEMA_VERSION = (\d+)$', adapter, re.M)
    js_schema = re.search(r'^const CONFIG_SCHEMA = (\d+);$', frontend, re.M)
    if not py_schema or not js_schema or py_schema[1] != js_schema[1]:
        raise ValueError('Die Protokollversionen unterscheiden sich.')
    return version


def source_files(root):
    return sorted(p for p in root.rglob('*') if p.is_file() and '__pycache__' not in p.parts and p.suffix != '.pyc')


def write_zip(path, files, base):
    with zipfile.ZipFile(path, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
        for file in sorted(files):
            info = zipfile.ZipInfo.from_file(file, arcname=file.relative_to(base).as_posix())
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, file.read_bytes())
    with zipfile.ZipFile(path) as archive:
        if archive.testzip() is not None:
            raise ValueError(f'ZIP beschädigt: {path}')
        for file in files:
            if archive.read(file.relative_to(base).as_posix()) != file.read_bytes():
                raise ValueError(f'ZIP-Inhalt weicht ab: {file}')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--tag')
    parser.add_argument('--output-dir', type=Path, default=ROOT / 'dist')
    parser.add_argument('--check-only', action='store_true')
    args = parser.parse_args()
    version = validate_layout(args.tag)
    if args.check_only:
        print(f'Layout und Metadaten gültig: {version}')
        return
    args.output_dir.mkdir(parents=True, exist_ok=True)
    integration_files = source_files(COMPONENT)
    integration_zip = args.output_dir / 'shutter-manager.zip'
    write_zip(integration_zip, integration_files, COMPONENT)
    allowed = {'README.md','HOWTO.md','LICENSE','CHANGELOG.md','hacs.json','dashboard.yaml',
               '.gitignore'}
    files = [p for p in ROOT.iterdir() if p.is_file() and p.name in allowed]
    for directory in ('custom_components','tests','scripts','.github'):
        if (ROOT / directory).is_dir():
            files.extend(source_files(ROOT / directory))
    manual_zip = args.output_dir / f'Shutter-Manager-{version}.zip'
    write_zip(manual_zip, files, ROOT)
    print(json.dumps({'version':version,'integration_zip':str(integration_zip.resolve()),'manual_zip':str(manual_zip.resolve())}))


if __name__ == '__main__':
    main()
