# Shared UI provenance

Shutter Manager 1.5.1 bundles HA UI Kit 1.2.0 from v9h45n47mh-lab/ha-ui-kit, pinned to commit a3b7a7d3bd3a05a97093b2263c5b6fc7d2c4af50. The original bundle, CSS, manifest and MIT license are copied unchanged into frontend/family-ui/1.2.0/ and verified by family-ui.lock.json. The prior fixed version remains available for existing module URLs. No CDN or main/latest request is used at runtime.

Programs now uses the shared programGroup, programRow and actionRow renderers. Controlled fold/toggle adapters preserve the existing application state, authorization and backend contracts. Vacation mode is available only in Settings; the former overview filter is removed.

The user explicitly requested the typography of Light Manager's Programs view. A narrow, documented compatibility profile applies its 14 px program names, group heading weight and desktop/mobile sizing, metadata layout/indentation and compact row spacing instead of the generic program-row defaults. The shared UI bundle is not modified. The reference is Light Manager 1.2.2, commit 4599ef0a4303f2b62706f3b73e7b9990b972f5a8. CI reads that card only for comparisons; no Light Manager runtime files are distributed.

Verification compares both real cards under the same browser/theme at 320, 390 and 1100 px, collapsed and expanded, in light and dark themes. Computed font family, size, weight, line height, letter spacing and color are compared for group/program headings, metadata and action text. Indentation and row padding are checked separately. Existing application and UI Kit tests remain required before publication.

Automation, configuration protocol 7 and the 1.5-second tilt-to-height delay are retained.
