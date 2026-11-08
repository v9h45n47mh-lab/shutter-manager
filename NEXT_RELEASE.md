# Shutter Manager release requests

Implemented in 1.3.4 on 2026-11-08:

- Expand and collapse Current status and Today's history through chevron headings, matching the other Settings sections. Remove the separate Show/Hide buttons and preserve saved fold states.
- Rename selected sensors through a pencil beside each sensor in the expanded Sensors section. Keep each edit scoped to that sensor and preserve existing local display names.
- Remove the separate Sensor display names section.
- Update the German/English help and English changelog, run release tests and publish directly to GitHub.

The one-second tilt-to-height handoff introduced in 1.3.3 remains covered by the release tests. Current status retains device names and position/tilt only; Today's history remains independently collapsible.

No additional release requests are pending. Verification is recorded in RELEASE_TESTS.md.
