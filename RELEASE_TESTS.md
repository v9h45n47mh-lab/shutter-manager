# Release verification: Shutter Manager 1.5.4

Verified locally on 2026-11-11: all 303 Python tests, JavaScript syntax, pinned UI/checksum checks, sensor-selection checks and release metadata passed. The published release is created only after the complete validation workflow also passes for the exact release commit: seven application browser flows, three upstream UI Kit browser suites, all 16 UI Kit unit tests, HACS and Hassfest. The release notes record that validation result.

Timing tests verify that no height command is issued at 1.0, 1.5 or 1.999 seconds after a successful tilt call and that it is issued at 2.0 seconds. The dedicated timer is tested independently of the five-second regular evaluation and after a slow service call. Contact blocking, stop/disable/unload, obsolete callbacks after replacement, service failures and height-only movements remain covered. The 150-second confirmation deadline is still measured from the height command, with checks immediately before and at expiry.

The change only increases the fixed tilt-to-height delay to 2.0 seconds. The engine, permissions, protocol 7 and the pinned HA UI Kit 1.2.2 remain unchanged. German and English Help have been updated. All HA I/O is simulated; no physical actuators are operated.

Both release ZIP archives are checked for consistent version metadata, CRC, source bytes and the exclusive custom_components/rollladenplaner integration path. After installation, restart Home Assistant Core and reload the browser/app; Settings and Help show card/integration 1.5.4 and UI 1.2.2.
