# Release validation — 1.11.4

- The full local Python suite contains 394 tests for the production adapter, scheduling, persistence, permissions and per-card settings. Component checks cover Up=100/Down=0, numeric tilt endpoints, height-only range formatting, raw targets, independent profiles and admin guards.
- Required browser checks compare the actual bottom-right Settings gear with an independent unchanged UI Kit navigation reference: icon markup, dimensions, color, padding and typography, on desktop/mobile and in both themes.
- The manual browser suite verifies current/preset height labels, live height slider output and accessible text at 0/100/intermediate values, the same behavior during planning and after mode changes/Kit initialization, Unchanged/null handling, numeric tilt endpoints and unchanged commands. Planning slider movement itself performs no actuator I/O.
- Existing rollladenplaner-card dashboard YAML is exercised through the current production card by the complete real-Manager save-flow suite. Registration inheritance and the absence of a duplicate old picker entry are checked separately.
- Publication requires all backend, real Wecker interoperability, unchanged upstream UI Kit build/unit/browser, application browser suites, HACS and Hassfest checks on the exact commit. Responsive checks cover 320/390/1100 px and light/dark themes. Chromium runs in GitHub Actions; actuator I/O is simulated.

Restart HA Core and reload the browser/app. Existing card IDs, stored configurations and native/central permissions are retained.
