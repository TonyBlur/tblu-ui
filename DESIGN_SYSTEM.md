# Design system contract

This file defines how tblu-ui is used and extended. The consuming application must follow the same contract across every screen. New visual rules belong in the framework, with a studio example and verification, before they are used by the application.

## Ownership and cascade layers

The stylesheet declares the following layer order:

```css
@layer app, tblu.tokens, tblu.base, tblu.material, tblu.components;
```

The application owns content, data, permissions, routes, layouts, and placement of controls. It may set section spacing and content typography in `@layer app`. tblu-ui owns control dimensions, material, colors, borders, shadows, corner treatment, selected/focus states, and feedback.

Do not add unlayered application rules that override framework controls. Do not copy framework CSS into a screen, mix icon packs, introduce an alternative menu renderer, or selectively enable material on unrelated controls. If a reusable exception is justified, add a named component or variant to tblu-ui and update this contract.

The normal integration path is:

1. Import `@tblu/ui/styles.css` once.
2. Add `.tblu-ui` to the application host.
3. Initialize `mountUI()` once per root.
4. Apply preferences through `ui.setTheme()`.
5. Render all controls with the component contract below.
6. Use `ui.refresh()` when an explicit refresh is needed after DOM changes.
7. Call `ui.destroy()` when the host is removed.

Mounting the same root returns its current instance. Do not mount competing material or control adapters on that root.

## Shared tokens

| Family | Public examples | Rule |
| --- | --- | --- |
| Color | `--tblu-color-bg`, `--tblu-color-surface`, `--tblu-color-text`, `--tblu-color-muted`, `--tblu-color-accent`, `--tblu-color-danger`, `--tblu-color-border` | Use semantic variables instead of per-screen colors. |
| Geometry | `--tblu-radius-control`, `--tblu-radius-card`, `--tblu-radius-panel` | Geometry is a system rule; do not replace it on an individual control. |
| Size | `--tblu-control-sm`, `--tblu-control-height`, `--tblu-control-lg` | Small: 32 px; medium: 40 px; large: 48 px. Text and icon controls at the same size have equal height. |
| Typography | `--tblu-font-body`, `--tblu-font-size`, `--tblu-line-height` | Base typography belongs to the framework; content headings may use the application layer. |
| Spacing | `--tblu-space-1`, `--tblu-space-2`, `--tblu-space-3`, `--tblu-space-4`, `--tblu-space-6` | Prefer the 4/8/12/16/24 px scale. |
| Motion | `--tblu-motion-enter`, `--tblu-motion-exit`, `--tblu-motion-press`, `--tblu-ease` | Use shared timings and honor both explicit and system reduced-motion preferences. |
| Material | `--tblu-lens-blur`, `--tblu-lens-brightness`, `--tblu-shadow-control`, `--tblu-shadow-floating` | Use material API/configuration; do not fake a second rim with extra borders. |

Public API preferences are validated and applied consistently. Treat implementation-only optics variables as private. A token change affects the whole theme and must be reviewed across the state matrix.

## Component contract

| Component | Required markup | States and behavior |
| --- | --- | --- |
| Text action | `.tblu-button` on a semantic `button` or link | Pill shape. `data-tblu-size="sm\|md\|lg"`; `data-tblu-variant="primary\|secondary\|quiet\|danger"`. |
| Icon action | `.tblu-icon-button` on a semantic `button` or link | Circular, same height as the matching text action. A meaningful accessible name is required. |
| Card | `.tblu-card`, `data-tblu-surface="card"` | Content grouping. `data-tblu-elevation="1\|2"` indicates hierarchy; level 2 is reserved for raised emphasis. |
| Panel | `.tblu-panel`, `data-tblu-surface="panel"` | Floating/grouped UI; preserves shared radius, material, shadow, and focus language. |
| Positioned surface | `--tblu-surface-position: fixed` or `sticky` | Applications choose positioning; decoration defaults to relative positioning. Use this token for pinned sidebars, floating headers and notifications. |
| Field | `.tblu-field` on a label/group; a visible label plus input/textarea | Keep label, hint, and error associated with the control. `aria-invalid` and `aria-describedby` convey errors. |
| Select | Native `<select>` within the field | Automatically enhanced by `mountUI()`; use real options, values, disabled state, and native change events. |
| Color picker | Native `<input type="color">` within the field | Automatically enhanced through the same adapter; the source value remains a six digit hex color. |
| Switch | `.tblu-switch` label containing a native checkbox and visible text | Automatically enhanced; use `.checked` and native change events. Never use a switch for a one-time action. |
| Checkbox | `<input type="checkbox" class="tblu-checkbox">` | Native checked, disabled, and indeterminate semantics. Multiple selection belongs to checkboxes. |
| Radio/segments | Web Awesome `wa-radio-group` / `wa-radio`; `.tblu-segments` when appropriate | Mutually exclusive choices. The shared adapter standardizes the component family. |
| Range | `<input type="range" class="tblu-range">` | Visible label and associated output. Arrow key operation must remain available. |
| Chip | `.tblu-chip` | Compact metadata. Use a button when interactive; static text must not pretend to be a button. |
| Tabs | `.tblu-tabs` plus semantic `tablist`, `tab`, `tabpanel` roles | App owns active content. Maintain `aria-selected`, `aria-controls`, and roving tabindex. |
| Table | `.tblu-table` inside `.tblu-table-scroll` | Semantic headers, vertically aligned cells, no extra first-row divider. Selection uses native checkboxes and `aria-selected` on rows. |
| Scrolling | Native scroll container or `.tblu-scroll` | Use the global theme scrollbar. Avoid nested scroll regions without a clear purpose. |
| Action menu | `openMenu(anchor, { items, label })` | Shared panel and glyphs, keyboard navigation, disabled/danger options, dismissal. |
| Contextual popover | `createPopover(anchor, { content, title, placement })` | Use a real content Node and an accessible title. Avoid inserting untrusted HTML. |

`primary` is the main action for a group; `secondary` is a supporting action; `quiet` is a low emphasis action; `danger` signals a destructive effect. Selection is semantic state, not another action variant.

Set `aria-pressed="true"` for a persistent toggle button. Tabs use `aria-selected="true"`. A loading action uses `aria-busy="true"` and a descriptive label; disable repeated submission while work is in progress. Setting a visual class never substitutes for these attributes.

## Forms and adapter semantics

When native enhancement is enabled, select lists and color picker dialogs use framework-styled Web Awesome surfaces, not operating-system menus. This covers the opened surface as well as the trigger. File choosers remain browser/operating-system facilities; do not imitate a filesystem picker.

The adapter keeps the native source control in the DOM so existing `FormData`, value access, events, validation, and reset logic can continue to work. It presents the enhanced control as the focus target and keeps the native source out of the accessibility tree. The enhanced control must have the same accessible name and value as its source.

Application event handlers belong on the native control or the enclosing form. Do not attach a second handler to the enhanced control for the same business action. Do not set duplicate names on the generated controls. Update the native value when application state changes; the bridge synchronizes the presentation.

A visible `<label>` is the preferred naming method. An `aria-label` or `aria-labelledby` is required when there is no visible label. Associate errors with `aria-describedby` and set `aria-invalid` only when the value is actually invalid. Disabled state must use the native `disabled` property.

## Material and feedback

The theme offers liquid and solid modes across the same component system. In liquid mode, refraction, edge illumination, tint, and depth are attached to the component's geometry. In solid mode, the same hierarchy, dimensions, semantic colors, and feedback remain available.

- Circular and pill surfaces must never display a rectangular optical boundary.
- Highlights follow the outer surface; they must not appear as a second inset box.
- Containers with scrolling must provide enough space for a child's highlight, or use the framework's tabs/menu wrapper.
- Hover changes emphasis without moving icons upward.
- Pointer press gives a brief depression, and restores on release/cancel.
- Pointer feedback must not remain after leaving an inactive control.
- Focus-visible treatment is reserved for keyboard navigation and must remain legible.
- Dark material preserves readable foreground contrast by darkening the sampled background; light material brightens it.

The material lifecycle owns observers, geometry refresh, and cleanup. Never leave duplicate rim layers or observers attached after a screen is rebuilt.

## Icons

Use `icon(name)` or `iconURL(name)` from tblu-ui. Known application glyphs and internal control glyphs belong to the same MingCute family. The occasional regular-style counterpart is from that same family. Icons are decorative by default; controls supply the accessible name.

Do not download a second icon pack, use emoji as action glyphs, or paste an unrelated SVG into a framework control. Add a missing icon to the shared registry with its license attribution and a consistent 24 px geometry.

## Overlay behavior

Anchored surfaces must flip or shift to stay inside the viewport. Menu items are pill shaped and share action dimensions. Escape and pointer interaction outside the overlay close it. Keyboard users can navigate enabled items with arrow keys, Home, and End. On Escape, focus returns to the anchor. Tab continues page navigation without pulling focus back to the trigger. Selected actions return focus only if the application has not moved it elsewhere. Action callbacks execute synchronously inside the click before closing animations are awaited; rejected work is delivered through `onError` or `tblu-error`.

Only one active overlay is retained for a given anchor. Repeating its trigger toggles it closed. A removed anchor or `destroyOverlays(root)` releases the portal, observers, and listeners and restores author-provided ARIA attributes. Scoped themes are copied to the portal and kept synchronized without duplicating stylesheet imports.

`openMenu()` handles menu semantics. `createPopover()` provides the common surface and lifecycle; the application remains responsible for the content's semantic role, initial focus needs, and any modal behavior. Do not present a nonmodal popover as a modal dialog.

## Verification matrix

For any component or adapter change, inspect:

| Dimension | Required cases |
| --- | --- |
| Theme | Light, dark, follow system. |
| Material | Liquid, solid. |
| Interaction | Default, hover, pressed, keyboard focus, selected, disabled. |
| Async/forms | Loading, invalid, reset, programmatic value update, form submission. |
| Layout | Wide desktop, narrow phone, long labels, content overflow. |
| Accessibility | Labels, contrast, focus order, keyboard operation, reduced motion, forced colors where applicable. |
| Lifecycle | Re-render, removed source, repeated mount, destroy. |

Use meaningful automated tests for adapter semantics and state/lifecycle logic. Inspect actual browser rendering for clipping, geometry, menu placement, and shadow alignment. Passing a CSS contract check alone does not establish visual correctness.

## Migration and release policy

Before 1.0, all GitHub releases are prereleases. SemVer-suffixed builds remain prereleases at any major version. Tags stay immutable. See [release policy](docs/RELEASES.md).

The researched [112-type coverage inventory](docs/component-coverage-research.md) and [live coverage matrix](docs/COVERAGE.md) separate primitives, compositions and specialist integrations. A sample card or an engine lifecycle shell does not establish support for advanced grid, scheduler, chart or editor semantics.

Application and studio styles own layout and content typography. The framework owns control skin, focus, material, feedback and scrollbar treatment. A new variant belongs in the common component layer and its state gallery, never in a demo-only override.

A consuming application should keep one integration adapter that maps legacy markup into the public classes and attributes during migration. Track every component family in an inventory: dropdowns, buttons, cards, tables, tabs, form inputs, switches, checkboxes, radio groups, color pickers, ranges, overlays, and scroll regions.

Move common visual rules into tblu-ui, replace legacy styles with the shared contract, then remove duplicate application rules. Keep the existing behavior and form semantics covered while migrating. The adapter is a transition boundary; new code should use public classes directly.

Use a pinned Git commit, tag, or locked package version for reproducible deployments. Framework changes should include a changelog, examples, and tests. Breaking changes to tokens, markup, semantics, or API require a clear migration note and an appropriate version bump.
