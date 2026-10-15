# Verification notes

Preview target: `0.2.0-beta.1`.

## Automated

- 56 meaningful tests passed locally on Node.js 23.11.0: native value bridges, temporal constraints, overlays, feedback, geometry, sidebar resizing, floating headers, ordered collections, DST, async drafts, chart gaps, engine teardown and release policy.
- Production demo built with Vite 8.3.0, free Web Awesome 3.14.0 and Motion 13.4.0.
- Browser-boundary tests use documented stubs and do not replace real browser inspection.

## Browser evidence

The actual local studio was checked in the Codex in-app browser:

- Dark/light × liquid/solid theme combinations; solid surfaces are opaque and have no backdrop filter.
- Select options are pill shaped with a soft selected fill; no visible thick pointer-focus outline.
- Textarea has one matching 20 px outer/inner radius; switch has an unpainted wrapper and one compact track.
- Skip link stays hidden until keyboard focus. Sidebar width responds to keyboard resize and exposes the new ARIA width.
- Date calendar opens with 42 date cells, a selected day and round day actions; selecting a day changes the original native source.
- Time menu only enables valid min/max/step choices; applying `09:45` updates the native time source.
- Message composer sends a local message and clears its draft; simulated reply is labelled locally.
- Directory search for `timeline` shows the matching timeline/activity recipe and hides unrelated cards.

README images are screenshots of the running studio, not concept images.

## Limits

This is a prerelease. No real message delivery, file upload service, professional grid/scheduler/editor engine, full screen-reader matrix, browser/device matrix or exhaustive RTL/touch certification is claimed. See `COVERAGE.md` for the per-type boundary. The application consumer has its own integration checks.
