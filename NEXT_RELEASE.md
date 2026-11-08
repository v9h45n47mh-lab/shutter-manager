# Shutter Manager release requests

Implemented in 1.3.3 on 2026-11-08:

- Reduce the wait between a successful blind tilt service call and the height command from three seconds to one second.
- Trigger the handoff with its own timer while rechecking contacts and the current goal. Cancel pending timers for stopped/replaced movements and integration unload.
- Update both guides and the English changelog, run release tests and publish directly to GitHub.

The 1.3.2 settings cleanup remains in place: Current status contains device names and position/tilt only, and Today's history is a separate collapsible section.

No additional release requests are pending. Verification is recorded in RELEASE_TESTS.md.
