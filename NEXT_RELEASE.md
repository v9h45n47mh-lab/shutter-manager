# Next Release: 1.3.0

## Requested architecture

- Cover settings contain sensor assignments only: illuminance sensors, optional temperature sensors, and opening contacts. Shading thresholds and delays are no longer defined in named rules on the cover.
- Shading is configured in an overarching program. Activation/release thresholds belong to the program and apply consistently to its selected covers.
- Each cover is evaluated independently using its assigned sensors and the shared program thresholds. Covers sharing the same sensor naturally receive the same measurement. Do not silently substitute one cover's sensor for another cover's sensor.
- Follow the Light Manager program editor for the definition and presentation: program name, enable/vacation controls, weekdays, daily validity window, optional season, shared target selection, expandable actions, activation/end conditions and delays, and an explicit end action. Adapt the conditions for shading rather than copying the Light Manager's darkness comparison direction.
- Keep target height and optional blind tilt in the program actions. End actions should expose fixed return targets, the applicable schedule, restoration of the position before shading, or keeping the current position as appropriate for covers.
- Preserve the existing temperature/illuminance combination semantics unless explicitly changed: all configured activation conditions must hold; either lower release condition can release the shading. Make activation and release delays explicit program settings.

## Migration and delivery requirements

- Migrate existing cover sensor rules and their program references without losing sensor assignments, thresholds, delays, targets, activation flags, or calendar restrictions.
- If one existing program references incompatible threshold sets, split its migrated definitions as necessary rather than choosing one set and changing behavior silently. Preserve multiple existing sensor associations; do not reduce them to a single arbitrary sensor.
- Preserve contact protection, opening-program priority, pending schedule handling, manual-operation behavior, and the separation of Shutter Manager from Light Manager.
- Update the German and English in-card guides, README, and English changelog with the new configuration model.
- Test migration, independent per-cover evaluation under shared thresholds, activation/release delays, return behavior, conflicting programs, persistence, permissions, and the actual desktop/mobile program editor before packaging 1.3.0.

Status: implemented in 1.3.0; validation and release evidence are recorded in RELEASE_TESTS.md.
