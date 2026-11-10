# Shared UI provenance

Shutter Manager 1.5.2 bundles HA UI Kit 1.2.0 from v9h45n47mh-lab/ha-ui-kit, pinned to commit a3b7a7d3bd3a05a97093b2263c5b6fc7d2c4af50. The original bundle, CSS, manifest and MIT license are copied unchanged into frontend/family-ui/1.2.0/ and verified by family-ui.lock.json. The prior fixed version remains available for existing module URLs. No CDN or main/latest request is used at runtime.

Programs uses the shared programGroup, programRow and actionRow renderers. Font family, size, weight, line height, indentation, spacing and shared-control geometry are supplied exclusively by UI_CSS. The local Light Manager compatibility profile and all duplicate shared-component CSS were removed. Remaining local CSS only arranges cover-specific timetable, shading and assignment content; it uses UI Kit spacing tokens. Common editor, sensor, Settings, history, slider and help styles also come from the kit.

Behavior, stable-ID, translation, authorization and accessibility adapters preserve the application contracts. Switches retain compact captions and accessible names; their visible geometry comes from the unmodified shared controls. Vacation mode remains in Settings.

The program-layout browser test creates an independent ShadowRoot reference with only the original UI Kit CSS and its programGroup, programRow and actionRow output. No application CSS reaches that reference. It compares computed typography, indentation, spacing, controls and relative layout in light/dark themes at 320/390/1100 px, collapsed/expanded and admin/non-admin states. A static check rejects local rules targeting shared selectors or setting typography. Workflow screenshots and numeric measurements provide review evidence.

Automation, configuration protocol 7 and the 1.5-second tilt-to-height delay are unchanged. No Light Manager code or checkout is required.
