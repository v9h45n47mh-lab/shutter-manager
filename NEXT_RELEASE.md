# Shutter Manager release requests

Implemented in 1.3.1 on 2026-11-06:

- Full illuminance values in lx with dotted thousands separators and no decimal places; no k abbreviation. Convert klx before formatting and preserve raw readings/thresholds.
- Keep Programs as text at the left; place clock and sensor icon tabs directly beside it. Keep Help and Settings on the right with translated tooltips and accessible labels.
- Keep Current status collapsible, with device names on the left and height/tilt on the right. Remove Open/Closed and duplicate position lines. Include recent movement commands within Current status.
- Add separate, independently collapsible Today's history with chronological times, devices, command targets and completion/failure results.
- Persist daily results across reloads/restarts, use the HA local day, and respect device read permissions. Keep planned and waiting actions in Schedule.
- Update both guides and the English changelog and run release checks.

Validation is recorded in RELEASE_TESTS.md. No further release requests are currently pending.
