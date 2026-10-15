# Component coverage research

Research date: 2026-10-15. This is a scoped comparison of official design-system documentation, not a claim to have surveyed every UI framework. The inventory is a proposed coverage contract for tblu-ui; it is not a statement that every item is already implemented.

## Scope and method

The survey compares 13 ecosystem families: Ant Design, MUI, Chakra UI, Mantine, Fluent, Carbon, Adobe Spectrum/React Aria, Radix, shadcn/ui, PrimeVue/PrimeReact, Web Awesome/Shoelace, PatternFly, and Elastic UI. It combines catalogs with representative advanced documentation. Names that describe the same interaction are consolidated; sizes, colors, checked/disabled states, and several chart renderings are variants rather than artificially separate components.

Some official URLs now redirect: PrimeVue/PrimeReact use `primevue.dev`/`primereact.dev`; React Aria uses `react-aria.adobe.com`. Shoelace's official site says it is sunset and directs continuing development to Web Awesome. Some ecosystems have commercial features. Elastic UI's current documentation declares Elastic License 2.0/SSPL, so it is a source-available comparator, not an assumed permissively licensed dependency. These are taxonomy references, not proposals to install all these frameworks. See [Shoelace's status](https://shoelace.style/), [Web Awesome's catalog](https://webawesome.com/docs/components/), [MUI X's open-core boundary](https://mui.com/x/introduction/), and [Elastic UI's license declaration](https://eui.elastic.co/docs/components/).

| Ecosystem | Official source inspected | Distinct perspective used |
| --- | --- | --- |
| Ant Design | [Component overview](https://ant.design/components/overview/?locale=en-US) | Forms, enterprise tables, descriptions, transfer, workflows, feedback. |
| MUI / MUI X | [Core catalog](https://mui.com/material-ui/all-components/), [advanced catalog](https://mui.com/x/introduction/) | Separates general UI from data grids, pickers, charts and advanced scheduling. |
| Chakra UI | [Component overview](https://chakra-ui.com/docs/components/concepts/overview) | Accessible composition, fields, OTP, tags, editable content, overlays. |
| Mantine | [Core catalog](https://mantine.dev/core/package/) | App shell, extensive selection controls, utility components and form families. |
| Fluent | [Web overview](https://fluent2.microsoft.design/components/web/react/) | People, presence, enterprise navigation and cohesive web implementations. |
| Carbon | [Core component overview](https://www.carbondesignsystem.com/building-blocks/core/components/overview/components) | Enterprise data, structured lists, UI shell, progress and notification semantics. |
| Spectrum / React Aria | [Spectrum](https://spectrum.adobe.com/), [React Aria](https://react-aria.adobe.com/), [date picker](https://react-aria.adobe.com/DatePicker) | Internationalization, keyboard collections, drag/drop and segmented date values. |
| Radix | [Primitive introduction and catalog](https://www.radix-ui.com/primitives/docs/overview/introduction) | Headless behavior, focus management, menus, disclosure and composition. |
| shadcn/ui | [Components](https://ui.shadcn.com/docs/components) | Demonstrates the difference between a primitive and a composed table, command palette or messaging pattern. |
| PrimeVue / PrimeReact | [Vue catalog](https://primevue.dev/components/), [React catalog](https://primereact.dev/components) | Tree tables, transfer/reorder, upload queues, galleries and broad business controls. |
| Web Awesome / Shoelace | [Web Awesome catalog](https://webawesome.com/docs/components/), [Shoelace](https://shoelace.style/) | Framework-neutral Web Components, free/Pro distinction and lifecycle status. |
| PatternFly | [Component overview](https://www.patternfly.org/components/overview/) | Admin applications, notification drawers, wizards, inline editing and extensions. |
| Elastic UI | [Overview](https://eui.elastic.co/docs/components/), [data grid](https://eui.elastic.co/docs/components/data-grid/), [selection comparison](https://eui.elastic.co/v107.0.1/docs/components/forms/selection/overview/index.html) | Data-heavy applications, filtering, dense tables and editor/syntax patterns. |

## Counting and implementation boundary

The inventory contains **112 meaningful types**, in nine groups. It distinguishes:

- **P — primitive:** reusable markup, state and interaction; not merely CSS.
- **C — composed pattern:** a reusable combination with a documented data/event contract; hosts own routing, persistence, permissions and network work.
- **I — specialist integration:** a themed, accessible adapter to an established engine. A decorative mock is not a substitute for the engine.

**P0** means common building blocks required by many sites; **P1** means broad ecosystem coverage beyond the initial bookmark application. Both belong in the coverage plan. **P2** means specialist semantics where an adapter or explicit integration recipe is appropriate. Priority is implementation order, not permission to silently omit a group.

Baseline labels: **Ready** = existing common implementation; **Partial** = styling, native/browser behavior or demo-only composition exists but the shared reusable behavior/contract is incomplete; **Gap** = no reusable implementation found during the baseline inspection. The baseline is the research-start snapshot of `src/index.js`, `src/controls.js`, `src/components.css`, `DESIGN_SYSTEM.md`, and `demo/index.html`. Subsequent code changes should update a separate live coverage matrix. `temporal-math.mjs` alone is not evidence of a mounted date-picker component.

Scenario abbreviations: **All** general websites; **Public** content/marketing; **Account** forms/authentication/settings; **Admin** SaaS/data operations; **Commerce** catalog/cart/checkout; **Schedule** appointments/events; **Collab** chat/team workflows; **Files** file/media management; **Dashboard** monitoring/analysis; **Dev** documentation/editing/developer tools.

## A. Foundations and layout — 10 types

These form the shared language rather than a screen-specific restyling layer. Taxonomy references: [Spectrum tokens](https://spectrum.adobe.com/page/design-tokens), [Mantine layout catalog](https://mantine.dev/core/package/), [PatternFly foundations](https://www.patternfly.org/design-foundations/about-design-foundations/).

| ID | Type | Layer / priority | Baseline | Required variants / why |
| --- | --- | --- | --- | --- |
| 01 | Theme and token provider | P / P0 | Ready | System/light/dark; liquid/solid; scoped theme; reduced motion; contrast. All. |
| 02 | Typography and prose | P / P0 | Partial | Headings, body, code, truncation, localized number/date text. Public/Dev. |
| 03 | Icon and accessible icon | P / P0 | Ready | One glyph family, decorative versus named, consistent sizing. All. |
| 04 | Stack/flex/cluster layout | P / P0 | Partial | Horizontal/vertical, wrap, alignment, responsive gaps. All. |
| 05 | Container/responsive grid | P / P0 | Partial | Content width, responsive columns, aspect ratio, masonry recipe. Public/Files. |
| 06 | Surface/panel | P / P0 | Ready | Raised/inset/quiet, correct clipping and material feedback. All. |
| 07 | Card | P / P0 | Ready | Header/footer/actions; selectable and clickable variants with correct semantics. Public/Admin/Commerce. |
| 08 | Separator and grouping | P / P0 | Partial | Horizontal/vertical; decorative or semantic grouping. All. |
| 09 | Scroll area | P / P0 | Partial | Overflow cue, keyboard access, horizontal/vertical; no trapped nested scrolling. All. |
| 10 | Splitter/resizable panels | P / P1 | Partial | Horizontal/vertical, min/max, keyboard resize, collapsed panes. Admin/Dev. |

## B. Actions and navigation — 15 types

Taxonomy references: [Radix menus/toolbars/navigation primitives](https://www.radix-ui.com/primitives/docs/overview/introduction), [MUI navigation catalog](https://mui.com/material-ui/all-components/), [PrimeVue command and menu families](https://primevue.dev/components/), [Fluent web components](https://fluent2.microsoft.design/components/web/react/).

| ID | Type | Layer / priority | Baseline | Required variants / why |
| --- | --- | --- | --- | --- |
| 11 | Button | P / P0 | Ready | Semantic variants, matched sizes, busy/disabled; submit and link usage. All. |
| 12 | Icon button | P / P0 | Ready | Circular; named; selected/busy; compact touch target. All. |
| 13 | Link | P / P0 | Partial | Inline/standalone, external indicator, visited and disabled guidance. Public/Dev. |
| 14 | Button/toggle group | P / P0 | Partial | Single/multiple selection, roving focus, connected or separated geometry. All. |
| 15 | Split button | C / P1 | Gap | Default action plus menu, independent keyboard targets. Admin/Commerce. |
| 16 | Toolbar/action bar | C / P0 | Partial | Overflow, selection count, bulk actions, responsive grouping. Admin/Files. |
| 17 | Topbar/application shell | C / P0 | Partial | Brand, navigation, search, account, responsive collapse. All. |
| 18 | Sidebar/navigation rail | C / P0 | Partial | Nested items, current location, collapsed/mobile drawer, resizing. Admin/Dev. |
| 19 | Menu/context menu | P / P0 | Partial | Nested and checkable/radio items, disabled items, keyboard invocation. Admin/Files. |
| 20 | Menubar | P / P1 | Gap | Horizontal menus with arrows and submenu focus management. Dev/Admin. |
| 21 | Navigation/mega menu | C / P1 | Gap | Link-rich sections; responsive disclosure; preserve real link semantics. Public/Commerce. |
| 22 | Breadcrumb | P / P0 | Partial | Overflow ancestors, centered anchored overflow, current item. Admin/Files. |
| 23 | Tabs | P / P0 | Partial | Horizontal/vertical, manual/automatic activation, indicator motion. All. |
| 24 | Pagination | P / P0 | Gap | Page size, simple/numbered, server-driven totals and unknown totals. Public/Admin. |
| 25 | Command palette | C / P1 | Gap | Shortcut, fuzzy/search matching, grouped actions, async/empty state. Admin/Dev. |

## C. Forms and validation — 23 types

The broad coverage target needs actual value/reset/submission and error behavior, not a collection of input-shaped boxes. Taxonomy references: [Chakra fields and form controls](https://chakra-ui.com/docs/components/concepts/overview), [Ant Design data entry](https://ant.design/components/overview/?locale=en-US), [Mantine selection families](https://mantine.dev/core/package/), [Elastic selection decision guide](https://eui.elastic.co/v107.0.1/docs/components/forms/selection/overview/index.html).

| ID | Type | Layer / priority | Baseline | Required variants / why |
| --- | --- | --- | --- | --- |
| 26 | Field/label/help/error | P / P0 | Partial | Label associations, required marker, hints, invalid/read-only/disabled distinction. Account. |
| 27 | Form/validation summary | C / P0 | Partial | Native/custom validation, error summary links, async failure, dirty/reset states. Account/Admin. |
| 28 | Fieldset/group | P / P0 | Gap | Legend, related controls, grouped errors; optional disclosure. Account. |
| 29 | Text input/input group | P / P0 | Partial | Prefix/suffix, clear, email/url/tel; preserve IME and native events. All. |
| 30 | Textarea | P / P0 | Partial | Auto-size, length count, read-only, resize guidance. Account/Collab. |
| 31 | Number input | P / P0 | Partial | Step/min/max, localized display, invalid partial entry, quantity controls. Commerce/Admin. |
| 32 | Password input | C / P0 | Partial | Reveal, confirmation, policy hint and strength feedback. Account. |
| 33 | Search field | C / P0 | Partial | Clear, busy, shortcut, suggestions, explicit search versus live filtering. All. |
| 34 | Select/listbox | P / P0 | Ready | Single, grouped, disabled, scroll, typeahead and native form bridge. Account. |
| 35 | Multi-select | P / P0 | Partial | Selection tokens, select/clear all, grouped options, keyboard removal. Admin/Commerce. |
| 36 | Combobox/autocomplete | P / P0 | Gap | Editable/freeform or select-only; async suggestions; custom option rendering. All. |
| 37 | Tags/token input | P / P0 | Gap | Existing plus new values, remove/edit, paste, localized names, duplicates. Admin/Files. |
| 38 | Checkbox/group | P / P0 | Ready | Checked/mixed, master selection and fieldset semantics. Account/Admin. |
| 39 | Radio/group | P / P0 | Partial | Single choice, keyboard group navigation, card choice variant. Account/Commerce. |
| 40 | Switch | P / P0 | Ready | Immediate setting, busy/disabled, visible on/off labels. Account. |
| 41 | Slider/range slider | P / P1 | Partial | One/two thumbs, step marks, value text, keyboard precision. Dashboard/Commerce. |
| 42 | Color picker/swatch | P / P0 | Ready | Current six-digit native value; presets, future alpha contract separate. Account/Dev. |
| 43 | Rating | P / P1 | Gap | Read-only/editable, half steps, numerical accessible value. Commerce/Public. |
| 44 | OTP/PIN input | P / P1 | Gap | Paste, autofill, correction, masked variant; coherent single value. Account. |
| 45 | Masked/structured input | P / P1 | Gap | Phone/postal/identifier format; keep raw versus formatted value explicit. Account/Commerce. |
| 46 | Cascader | P / P1 | Gap | Hierarchical options, path labels, searchable leaves, async children. Admin/Commerce. |
| 47 | Tree select | C / P1 | Gap | Single/multiple paths, disabled branches, mixed descendants. Files/Admin. |
| 48 | Transfer/dual list | C / P1 | Gap | Search, selected/all transfer, keyboard reorder, disabled choices. Admin. |

## D. Date, time and scheduling — 10 types

Taxonomy references: [React Aria DatePicker](https://react-aria.adobe.com/DatePicker), [MUI X pickers](https://mui.com/x/introduction/), [FullCalendar views and date model](https://fullcalendar.io/docs/vanilla-js). The first seven are reusable controls; a scheduler is a separate application-level composition/integration.

| ID | Type | Layer / priority | Baseline | Required variants / why |
| --- | --- | --- | --- | --- |
| 49 | Date field | P / P0 | Gap | Typed/segmented, locale order, min/max, clear and reset. Account/Schedule. |
| 50 | Calendar/date picker | P / P0 | Gap | Inline/popover, month navigation, unavailable dates, keyboard grid. Schedule. |
| 51 | Date-range picker | C / P0 | Gap | Start/end, presets, hover preview, cross-month and reversed-range policy. Dashboard/Schedule. |
| 52 | Time field/picker | P / P0 | Gap | 12/24h, minute/second step, allowed range and localized labels. Schedule. |
| 53 | Date-time picker | C / P1 | Gap | Combine date/time; explicit zone; DST ambiguous/nonexistent times. Schedule/Admin. |
| 54 | Month/year picker | P / P1 | Gap | Coarser granularity without pretending a day is chosen. Dashboard/Account. |
| 55 | Week picker | P / P1 | Gap | ISO/local week rules, year boundary, week labels. Schedule/Dashboard. |
| 56 | Timestamp/relative time | P / P0 | Gap | Absolute tooltip, relative updates, locale and timezone. Admin/Collab. |
| 57 | Duration/countdown | C / P1 | Gap | Duration is not wall-clock time; pause/resume and screen-reader update policy. Media/Schedule. |
| 58 | Scheduler/agenda | C+I / P2 | Gap | Day/week/month/list, event details, recurrence, drag/resize, resources. Schedule. |

## E. Data display and collections — 12 types

Taxonomy references: [Carbon data/table/structured-list catalog](https://www.carbondesignsystem.com/building-blocks/core/components/overview/components), [PrimeVue data families](https://primevue.dev/components/), [Elastic data grid](https://eui.elastic.co/docs/components/data-grid/), [React Aria collections and drag/drop](https://react-aria.adobe.com/). Table, data grid and tree grid are distinct contracts, not styling variants.

| ID | Type | Layer / priority | Baseline | Required variants / why |
| --- | --- | --- | --- | --- |
| 59 | List/grid list | P / P0 | Partial | Selection, actions, keyboard reorder, drag/drop and virtualized adapter. All. |
| 60 | Description/data list | P / P0 | Gap | Key/value, responsive columns, inline edit and missing values. Account/Admin. |
| 61 | Semantic table | P / P0 | Partial | Floating header, sorting, row selection, expansion, aligned cells, responsive overflow. Admin. |
| 62 | Advanced data grid | I / P2 | Gap | Virtualization, resize/reorder/pin, editing, grouping, aggregation, server data. Admin/Dashboard. |
| 63 | Tree | P / P1 | Gap | Expand/collapse, lazy children, selection, keyboard arrows and typeahead. Files/Admin. |
| 64 | Tree grid/table | C+I / P2 | Gap | Hierarchical rows plus columns; separate expansion and selection. Files/Admin. |
| 65 | Data view/catalog grid | C / P1 | Partial | Grid/list mode, sorting, pagination, direct reorder, card actions. Public/Commerce/Files. |
| 66 | Filter/facet bar | C / P0 | Gap | Search plus filters, active chips, clear all, URL/state ownership. Public/Admin. |
| 67 | Query/filter builder | C / P1 | Gap | AND/OR groups, operators, typed values, validation; no backend query injection. Dashboard/Dev. |
| 68 | Avatar/avatar group | P / P0 | Gap | Image/initial fallback, overflow count, presence companion. Collab/Account. |
| 69 | Badge/tag/status | P / P0 | Partial | Count/status/metadata; removable or selectable tags are explicit variants. All. |
| 70 | Empty/result state | C / P0 | Gap | No data, no search match, success, permission denied; useful next action. All. |

## F. Disclosure, overlays and feedback — 15 types

Taxonomy references: [Radix overlays/disclosure](https://www.radix-ui.com/primitives/docs/overview/introduction), [Chakra feedback](https://chakra-ui.com/docs/components/concepts/overview), [PatternFly notifications/wizard patterns](https://www.patternfly.org/components/overview/). A popover does not supply modal focus containment, and a toast does not replace an inline form error.

| ID | Type | Layer / priority | Baseline | Required variants / why |
| --- | --- | --- | --- | --- |
| 71 | Tooltip | P / P0 | Gap | Hover/focus, delay, Escape, noninteractive content. All. |
| 72 | Hover/preview card | P / P1 | Gap | Rich preview, keyboard access, controlled dismissal. Public/Collab. |
| 73 | Popover | P / P0 | Ready | Anchoring, collision/viewport handling, repeated trigger, lifecycle cleanup. All. |
| 74 | Dialog/modal | P / P0 | Partial | Focus containment/restore, background inertness, scroll lock, nested overlays. Account/Admin. |
| 75 | Confirmation/alert dialog | C / P0 | Gap | Destructive action, cancel/default focus, async busy/error; no premature dismissal. Admin. |
| 76 | Drawer | P / P0 | Gap | Side/bottom, modal/nonmodal, mobile navigation and filter panels. All. |
| 77 | Disclosure/accordion | P / P0 | Gap | Single/multiple open, arrow indicator, enter/leave, associated regions. Public/Account. |
| 78 | Inline alert/banner | P / P0 | Gap | Info/success/warning/error, dismissible/persistent, text plus action. All. |
| 79 | Toast/snackbar | C / P0 | Partial | Queue, timer pause, dismiss, undo, polite/assertive announcements. All. |
| 80 | Notification center | C / P1 | Gap | Read/unread, filters, grouped timestamps, actions, empty/loading state. Collab/Admin. |
| 81 | Progress/meter | P / P0 | Gap | Determinate/indeterminate, bar/ring, label and value text. Files/Dashboard. |
| 82 | Spinner/loading overlay | P / P0 | Partial | Local/page loading, prevent duplicate actions; delayed display. All. |
| 83 | Skeleton | P / P0 | Gap | Preserve geometry; text/card/list/table variants; reduced motion. All. |
| 84 | Error/offline/retry boundary | C / P0 | Gap | Network/error/reconnection states, retry ownership and stale-data indication. All. |
| 85 | Tour/onboarding coachmark | C / P1 | Gap | Steps, anchor collision, skip, focus, progress and dismissed preference. Admin/Public. |

## G. Files and media — 9 types

Taxonomy references: [PrimeReact upload/gallery families](https://primereact.dev/components), [Web Awesome media/comparison](https://webawesome.com/docs/components/), [PatternFly file upload coverage](https://www.patternfly.org/components/all-components/). File selection and upload transport are different responsibilities.

| ID | Type | Layer / priority | Baseline | Required variants / why |
| --- | --- | --- | --- | --- |
| 86 | File input/trigger | P / P0 | Partial | Name/type/size display, multiple, clear/reset; retain native chooser. Files/Account. |
| 87 | Dropzone | C / P0 | Gap | Drag target, keyboard trigger, accept/size validation, rejected-file feedback. Files. |
| 88 | Upload queue | C / P1 | Gap | Progress, cancel/retry, success/failure, preview; host owns transport. Files. |
| 89 | File manager/explorer | C / P1 | Gap | Breadcrumb/tree, grid/list, select/move, details and permissions. Files/Admin. |
| 90 | Image/gallery | P+C / P0 | Gap | Alt/loading/failure, thumbnail grid, responsive aspect ratio. Public/Commerce/Files. |
| 91 | Lightbox/media viewer | C / P1 | Gap | Zoom, previous/next, captions, Escape, focus return. Files/Commerce. |
| 92 | Carousel | P / P1 | Gap | Buttons/dots, keyboard, pause, reduced motion; avoid forced autoplay. Public/Commerce. |
| 93 | Audio/video player | C+I / P2 | Gap | Native controls or adapter, captions, speed, seek, playlist and errors. Public/Files. |
| 94 | Image comparison | P / P1 | Gap | Before/after divider, keyboard adjustment, accessible labels. Public/Files. |

## H. Workflows and collaboration — 10 types

Taxonomy references: [Ant Design steps/timeline](https://ant.design/components/overview/?locale=en-US), [PatternFly workflow/extension model](https://www.patternfly.org/components/overview/), [shadcn messaging catalog](https://ui.shadcn.com/docs/components), [React Aria advanced drag/drop example](https://react-aria.adobe.com/), [Fluent people components](https://fluent2.microsoft.design/components/web/react/). These are compositions; realtime delivery and authorization remain with the host.

| ID | Type | Layer / priority | Baseline | Required variants / why |
| --- | --- | --- | --- | --- |
| 95 | Stepper/progress steps | P / P1 | Gap | Current/complete/error, horizontal/vertical, optional steps. Account/Commerce. |
| 96 | Wizard/multi-step form | C / P1 | Gap | Validation per step, back/next, review, resumable draft, final submit. Account/Admin. |
| 97 | Timeline | P / P1 | Gap | Chronological items, icon/status/time, compact/alternating. Public/Admin. |
| 98 | Activity/audit feed | C / P1 | Gap | Actor/action/time, grouping, pagination, detail expansion. Admin/Collab. |
| 99 | Kanban/task board | C / P1 | Gap | Columns, direct drag plus keyboard alternative, filters and card detail. Collab/Admin. |
| 100 | Message bubble | P / P1 | Gap | Incoming/outgoing/system, author/time, delivered/failed, attachments. Collab. |
| 101 | Message composer | C / P1 | Gap | Multiline, send/busy/stop, attachments, mentions, IME-safe Enter policy. Collab. |
| 102 | Conversation/message feed | C / P1 | Gap | Follow-scroll opt-out, unread divider, load older, streaming and retry. Collab. |
| 103 | Comment/review thread | C / P1 | Gap | Reply/edit/delete, resolution, reactions, quoted context. Collab/Commerce. |
| 104 | Presence/collaborator group | C / P1 | Gap | Online/offline, avatar overflow, permission label and shared-session context. Collab. |

## I. Metrics, visualization and editors — 8 types

Taxonomy references: [MUI X advanced boundary](https://mui.com/x/introduction/), [Apache ECharts](https://echarts.apache.org/en/index.html), [Chart.js](https://www.chartjs.org/docs/latest/), [Elastic editor/syntax documentation](https://eui.elastic.co/docs/components/editors-and-syntax/markdown/format/index.html), [Tiptap editor](https://tiptap.dev/docs/editor/getting-started/overview), [Monaco Editor](https://microsoft.github.io/monaco-editor/).

| ID | Type | Layer / priority | Baseline | Required variants / why |
| --- | --- | --- | --- | --- |
| 105 | Statistic/KPI card | C / P1 | Gap | Label/value/unit, trend, comparison, missing/error/loading values. Dashboard. |
| 106 | Chart/plot | I / P2 | Gap | Line/bar/area/scatter/donut, axes/legend/tooltip, brushing, accessible data table. Dashboard. |
| 107 | Sparkline | P+I / P1 | Gap | Compact trend, no misleading scale, value summary and missing data. Dashboard/Admin. |
| 108 | Gauge/meter group | P+I / P1 | Gap | Capacity/threshold, labeled units, multiple categories; accessible numeric values. Dashboard. |
| 109 | Code block/snippet | P / P0 | Partial | Language label, copy feedback, wrap/scroll, line numbers and diff variant. Dev. |
| 110 | Markdown/prose renderer | C+I / P1 | Gap | Sanitized rendering, links, tables/code, contents navigation. Public/Dev/Collab. |
| 111 | Rich-text editor | I / P2 | Gap | Formatting toolbar, history, schema, paste sanitization, serialization. Public/Collab. |
| 112 | Code/JSON/diff editor | I / P2 | Gap | Syntax, validation, completion, line navigation, diff and worker lifecycle. Dev/Admin. |

## Scenario coverage: compose rather than invent another widget per page

The inventory should be exercised in these complete recipes. They are application compositions and are deliberately **not counted again** as new primitives.

| Website scenario | Representative complete recipes | Component dependencies |
| --- | --- | --- |
| Public/content/marketing | Header/mega menu, article with contents, gallery, FAQ, contact form, footer | 02/05/07/13/17/21/29/30/77/90/92/110 |
| Forms/account/settings | Login, password recovery, verification, account profile, consent/settings panels | 26–45/49/74/78/79/95/96; host provides authentication and recovery. |
| SaaS/admin data | Search/filter/table, CRUD detail drawer, bulk selection, audit feed, export preview | 16/18/22/24/25/27/61–67/74–84/98 |
| Commerce | Product card/catalog, faceted search, variants/quantity, cart drawer, checkout wizard | 07/31/35/39/43/48/65/66/76/90–92/95/96 |
| Scheduling/booking | Date range, available slot picker, agenda, event editor, recurring event review | 49–58/27/74/95/96 |
| Collaboration/chat | Conversation list, message feed/composer, thread, presence, notification center | 59/68/80/98–104 |
| Files/media | Upload queue, file tree/browser, move dialog, grid/list, preview/lightbox | 22/47/59/61/63–65/74/81/86–94 |
| Dashboards/visualization | KPI overview, date filter, chart cross-filter, drilldown table, empty/error states | 51/56/61/62/66/70/78/83/84/105–108 |
| Developer/editing | Command palette, resizable workbench, file tree, code/markdown/editor, diff review | 10/20/25/63/73/109–112 |

## Actionable gaps and integration strategy

1. **Close behavior gaps before counting styled surfaces as components.** Introduce shared lifecycle controllers for tabs/disclosure/dialog/drawer/pagination; field error and form reset contracts; table selection/sorting/reorder; real tooltip/toast/progress state. Existing app/demo behavior is a starting point, not proof of a public API.
2. **Expand selection and temporal controls as a coherent family.** A searchable combobox, multi-select, token/tag input, tree select and cascader have different semantics. Date field, calendar, range and time must share parsing/constraints/localization, while datetime declares timezone and DST policy. Never reuse a numeric quantity spinner as an undocumented date model.
3. **Treat collections as a second pillar.** Publish list/grid/table/tree/filter contracts, including identity, controlled state, direct drag plus keyboard alternatives and empty/loading states. A semantic table is not a virtualized spreadsheet; choose a dedicated grid adapter for the latter.
4. **Add file and collaboration compositions.** Use native file selection, expose upload progress/cancel/retry hooks, provide accessible previews and chat follow-scroll behavior. Do not bake network storage, chat delivery or permissions into material widgets.
5. **Make specialist integrations optional and explicit.** Charts, full scheduling, rich text and code editors should be lazy-loaded adapters. The visual contract can cover their toolbar/panel/colors/focus while their engine owns axes, recurrence, text schema or language services. Do not claim full support from a static screenshot.
6. **Preserve one visual and interaction contract.** Every supported type needs light/dark × liquid/solid, hover/press/focus/selected/invalid/disabled/loading, reduced motion, RTL/localization, narrow layouts and lifecycle cleanup. Shared classes and CSS parts must not expose a white browser popup in an otherwise themed interface.

Web Awesome's official current catalog explicitly marks combobox, date input/picker, file input, data grid and charts as Pro. The existing MIT-based project must not assume a paid tag is available from its installed free package. Provide a free implementation or an optional licensed adapter; document the choice. MUI X and Tiptap also distinguish community/core from commercial advanced features. See [Web Awesome catalog](https://webawesome.com/docs/components/), [MUI X licensing boundary](https://mui.com/x/introduction/), and [Tiptap core/Pro distinction](https://tiptap.dev/docs/editor/getting-started/overview).

For specialties outside this 112-type release inventory—maps/geospatial editors, node/diagram canvases, spreadsheets/pivot analytics, PDF/document annotation, terminal emulation, video/audio production, 3D/CAD viewers—publish an integration boundary rather than implying these are basic controls. Such domains deserve separate engine and license evaluation, data contracts and testing. The surveyed catalogs demonstrate breadth; they do not justify promising an implementation of every specialized application.

## Release evidence required

- Maintain a machine-readable/live coverage matrix linked to each demo, source/API and test or browser verification. Research baseline status must not be presented as the final release status.
- For a primitive, verify keyboard/pointer/touch behavior, form semantics where applicable, value/reset/disabled/error and mount/update/destroy.
- For a composed pattern, verify at least one complete user workflow and document which state and callbacks the host owns.
- For an integration, name the actual engine/version/license and exercise real data, resizing, cleanup and an accessible fallback.
- Count a type once. Do not inflate coverage with size/color variants, imports that are never demonstrated, or static cards named after unsupported functionality.

This document is an implementation planning artifact, not a dependency installation or a migration decision.
