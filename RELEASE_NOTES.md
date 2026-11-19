# Shutter Manager 1.11.5

- Fixed direct manual-card commands being rejected by a known-open contact when no eligible opening program applies to that cover. Immediate direction, height and tilt commands now respect the opening program's enabled state, enabled target ride, weekday, time window, season and pause state.
- Kept the existing contact behavior for recurring time programs, sensor/shading programs and scheduled one-time movements. An opening hold already triggered during a valid program retains priority until confirmed closure, including after a restart or after the validity period ends. Unavailable-contact handling, device permissions and the two-second tilt-to-height sequence are unchanged.
- Preserved the direct-command marker through the movement engine and restart so ongoing manual goals use the same eligibility check as the initial request. If opening validity starts during a manual movement, the normal contact interlock takes effect again before subsequent motor commands.
- Added production regressions for direct native/position/tilt commands, missing or ineligible programs, paused and disabled rides, unrelated targets, retained holds, restart, validity changes during tilt delay and unchanged deferred/skipped time programs. Added real-card browser coverage with open contacts and missing, disabled, out-of-season and valid opening programs on desktop/mobile in both themes. Updated both guides.

Restart HA Core and reload the browser/app. No program, card or permission reconfiguration is required.
