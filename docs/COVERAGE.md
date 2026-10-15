# Component coverage and boundaries

Version: **0.2.0-beta.1**, prerelease. Inventory: **112 consolidated types**, with **105 common types linked to interactive evidence** and **7 specialist types explicitly bounded**. A type is counted once; color/size/state variants do not inflate the count.

The [official-source research](component-coverage-research.md) explains taxonomy, required scenarios and the research-start baseline. The [live directory](https://tonyblur.github.io/tblu-ui/#catalog) links to actual examples. A recipe is not a guarantee that every variant in another framework exists here.

## Scope of this preview

- Shared controllers own focus, geometry, value/events and teardown; applications own routing, data, transport, permissions and persistence.
- Date fields use ISO Gregorian values and 24-hour typed time. Calendar captions are localized; host-supplied labels own action/error translations. Range couples two sources and clamps a reversed end. Month and ISO week keep their own value models.
- Menu examples cover actions, disabled items, keyboard navigation and context/menubar composition. Nested submenu and radio-menu variants are not yet a stable public contract.
- Tables are semantic HTML with an independent floating header, selection, filtering and sorting. This is not a virtualized spreadsheet.
- Local chat replies and processing/recovery rehearsals are explicitly labelled; no service, delivery or authentication is simulated as a real backend.
- Markdown is a safe documented subset. Charts preserve missing-data gaps and expose exact values; they support line/bar only.
- Native files are read locally in the demo; a queue requires a host transport. File explorer entries are an in-memory sample workspace.
- Broad keyboard and lifecycle tests exist; no claim of a full assistive-technology, touch-device, RTL or all-browser certification is made.

## Live type matrix

### Foundations & layout

| ID | Type | Preview evidence | Source |
| --- | --- | --- | --- |
| 1 | Theme and token provider | Shared primitive or interactive composed recipe | [Implementation](../src/index.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-foundations) |
| 2 | Typography and prose | Shared primitive or interactive composed recipe | [Implementation](../src/index.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-foundations) |
| 3 | Icon and accessible icon | Shared primitive or interactive composed recipe | [Implementation](../src/index.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-foundations) |
| 4 | Stack/flex/cluster layout | Shared primitive or interactive composed recipe | [Implementation](../src/index.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-foundations) |
| 5 | Container/responsive grid | Shared primitive or interactive composed recipe | [Implementation](../src/index.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-foundations) |
| 6 | Surface/panel | Shared primitive or interactive composed recipe | [Implementation](../src/index.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-foundations) |
| 7 | Card | Shared primitive or interactive composed recipe | [Implementation](../src/index.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-foundations) |
| 8 | Separator and grouping | Shared primitive or interactive composed recipe | [Implementation](../src/index.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-foundations) |
| 9 | Scroll area | Shared primitive or interactive composed recipe | [Implementation](../src/index.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-foundations) |
| 10 | Splitter/resizable panels | Shared primitive or interactive composed recipe | [Implementation](../src/index.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-foundations) |

### Actions & navigation

| ID | Type | Preview evidence | Source |
| --- | --- | --- | --- |
| 11 | Button | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-navigation.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-navigation) |
| 12 | Icon button | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-navigation.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-navigation) |
| 13 | Link | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-navigation.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-navigation) |
| 14 | Button/toggle group | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-navigation.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-navigation) |
| 15 | Split button | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-navigation.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-navigation) |
| 16 | Toolbar/action bar | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-navigation.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-navigation) |
| 17 | Topbar/application shell | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-navigation.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-navigation) |
| 18 | Sidebar/navigation rail | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-navigation.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-navigation) |
| 19 | Menu/context menu | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-navigation.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-navigation) |
| 20 | Menubar | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-navigation.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-navigation) |
| 21 | Navigation/mega menu | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-navigation.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-navigation) |
| 22 | Breadcrumb | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-navigation.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-navigation) |
| 23 | Tabs | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-navigation.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-navigation) |
| 24 | Pagination | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-navigation.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-navigation) |
| 25 | Command palette | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-navigation.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-navigation) |

### Forms & validation

| ID | Type | Preview evidence | Source |
| --- | --- | --- | --- |
| 26 | Field/label/help/error | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-forms.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-forms) |
| 27 | Form/validation summary | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-forms.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-forms) |
| 28 | Fieldset/group | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-forms.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-forms) |
| 29 | Text input/input group | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-forms.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-forms) |
| 30 | Textarea | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-forms.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-forms) |
| 31 | Number input | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-forms.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-forms) |
| 32 | Password input | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-forms.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-forms) |
| 33 | Search field | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-forms.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-forms) |
| 34 | Select/listbox | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-forms.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-forms) |
| 35 | Multi-select | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-forms.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-forms) |
| 36 | Combobox/autocomplete | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-forms.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-forms) |
| 37 | Tags/token input | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-forms.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-forms) |
| 38 | Checkbox/group | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-forms.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-forms) |
| 39 | Radio/group | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-forms.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-forms) |
| 40 | Switch | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-forms.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-forms) |
| 41 | Slider/range slider | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-forms.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-forms) |
| 42 | Color picker/swatch | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-forms.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-forms) |
| 43 | Rating | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-forms.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-forms) |
| 44 | OTP/PIN input | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-forms.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-forms) |
| 45 | Masked/structured input | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-forms.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-forms) |
| 46 | Cascader | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-forms.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-forms) |
| 47 | Tree select | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-forms.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-forms) |
| 48 | Transfer/dual list | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-forms.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-forms) |

### Dates & scheduling

| ID | Type | Preview evidence | Source |
| --- | --- | --- | --- |
| 49 | Date field | Shared primitive or interactive composed recipe | [Implementation](../src/temporal.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-temporal) |
| 50 | Calendar/date picker | Shared primitive or interactive composed recipe | [Implementation](../src/temporal.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-temporal) |
| 51 | Date-range picker | Shared primitive or interactive composed recipe | [Implementation](../src/temporal.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-temporal) |
| 52 | Time field/picker | Shared primitive or interactive composed recipe | [Implementation](../src/temporal.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-temporal) |
| 53 | Date-time picker | Shared primitive or interactive composed recipe | [Implementation](../src/temporal.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-temporal) |
| 54 | Month/year picker | Shared primitive or interactive composed recipe | [Implementation](../src/temporal.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-temporal) |
| 55 | Week picker | Shared primitive or interactive composed recipe | [Implementation](../src/temporal.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-temporal) |
| 56 | Timestamp/relative time | Shared primitive or interactive composed recipe | [Implementation](../src/temporal.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-temporal) |
| 57 | Duration/countdown | Shared primitive or interactive composed recipe | [Implementation](../src/temporal.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-temporal) |
| 58 | Scheduler/agenda | Local agenda; recurrence, resources and drag-resize scheduling need a scheduler engine. | [Implementation](../src/temporal.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-temporal) |

### Data & collections

| ID | Type | Preview evidence | Source |
| --- | --- | --- | --- |
| 59 | List/grid list | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-collections.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-collections) |
| 60 | Description/data list | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-collections.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-collections) |
| 61 | Semantic table | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-collections.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-collections) |
| 62 | Advanced data grid | No virtualized/editable professional grid engine is bundled. | [Implementation](../src/patterns-collections.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-collections) |
| 63 | Tree | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-collections.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-collections) |
| 64 | Tree grid/table | No hierarchical tree-grid engine is bundled. | [Implementation](../src/patterns-collections.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-collections) |
| 65 | Data view/catalog grid | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-collections.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-collections) |
| 66 | Filter/facet bar | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-collections.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-collections) |
| 67 | Query/filter builder | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-collections.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-collections) |
| 68 | Avatar/avatar group | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-collections.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-collections) |
| 69 | Badge/tag/status | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-collections.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-collections) |
| 70 | Empty/result state | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-collections.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-collections) |

### Overlays & feedback

| ID | Type | Preview evidence | Source |
| --- | --- | --- | --- |
| 71 | Tooltip | Shared primitive or interactive composed recipe | [Implementation](../src/feedback.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-feedback) |
| 72 | Hover/preview card | Shared primitive or interactive composed recipe | [Implementation](../src/feedback.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-feedback) |
| 73 | Popover | Shared primitive or interactive composed recipe | [Implementation](../src/feedback.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-feedback) |
| 74 | Dialog/modal | Shared primitive or interactive composed recipe | [Implementation](../src/feedback.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-feedback) |
| 75 | Confirmation/alert dialog | Shared primitive or interactive composed recipe | [Implementation](../src/feedback.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-feedback) |
| 76 | Drawer | Shared primitive or interactive composed recipe | [Implementation](../src/feedback.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-feedback) |
| 77 | Disclosure/accordion | Shared primitive or interactive composed recipe | [Implementation](../src/feedback.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-feedback) |
| 78 | Inline alert/banner | Shared primitive or interactive composed recipe | [Implementation](../src/feedback.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-feedback) |
| 79 | Toast/snackbar | Shared primitive or interactive composed recipe | [Implementation](../src/feedback.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-feedback) |
| 80 | Notification center | Shared primitive or interactive composed recipe | [Implementation](../src/feedback.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-feedback) |
| 81 | Progress/meter | Shared primitive or interactive composed recipe | [Implementation](../src/feedback.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-feedback) |
| 82 | Spinner/loading overlay | Shared primitive or interactive composed recipe | [Implementation](../src/feedback.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-feedback) |
| 83 | Skeleton | Shared primitive or interactive composed recipe | [Implementation](../src/feedback.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-feedback) |
| 84 | Error/offline/retry boundary | Shared primitive or interactive composed recipe | [Implementation](../src/feedback.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-feedback) |
| 85 | Tour/onboarding coachmark | Shared primitive or interactive composed recipe | [Implementation](../src/feedback.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-feedback) |

### Files & media

| ID | Type | Preview evidence | Source |
| --- | --- | --- | --- |
| 86 | File input/trigger | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-collections.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-media) |
| 87 | Dropzone | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-collections.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-media) |
| 88 | Upload queue | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-collections.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-media) |
| 89 | File manager/explorer | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-collections.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-media) |
| 90 | Image/gallery | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-collections.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-media) |
| 91 | Lightbox/media viewer | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-collections.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-media) |
| 92 | Carousel | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-collections.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-media) |
| 93 | Audio/video player | Real local HTML media plus themed controls; streaming, caption services and production playback require an adapter. | [Implementation](../src/patterns-collections.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-media) |
| 94 | Image comparison | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-collections.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-media) |

### Workflow & collaboration

| ID | Type | Preview evidence | Source |
| --- | --- | --- | --- |
| 95 | Stepper/progress steps | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-workflow.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-workflow) |
| 96 | Wizard/multi-step form | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-workflow.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-workflow) |
| 97 | Timeline | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-workflow.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-workflow) |
| 98 | Activity/audit feed | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-workflow.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-workflow) |
| 99 | Kanban/task board | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-workflow.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-workflow) |
| 100 | Message bubble | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-workflow.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-workflow) |
| 101 | Message composer | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-workflow.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-workflow) |
| 102 | Conversation/message feed | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-workflow.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-workflow) |
| 103 | Comment/review thread | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-workflow.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-workflow) |
| 104 | Presence/collaborator group | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-workflow.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-workflow) |

### Metrics & editors

| ID | Type | Preview evidence | Source |
| --- | --- | --- | --- |
| 105 | Statistic/KPI card | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-content.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-content) |
| 106 | Chart/plot | Working bounded SVG line/bar and exact-value table; professional analytics/plotting requires an engine. | [Implementation](../src/patterns-content.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-content) |
| 107 | Sparkline | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-content.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-content) |
| 108 | Gauge/meter group | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-content.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-content) |
| 109 | Code block/snippet | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-content.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-content) |
| 110 | Markdown/prose renderer | Shared primitive or interactive composed recipe | [Implementation](../src/patterns-content.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-content) |
| 111 | Rich-text editor | Working minimal selection formatting and plain-text paste; schema/history/collaboration requires an editor engine. | [Implementation](../src/patterns-content.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-content) |
| 112 | Code/JSON/diff editor | Working JSON textarea, line numbers, validation and format; syntax/completion/diff/workers require an editor engine. | [Implementation](../src/patterns-content.js) · [Studio](https://tonyblur.github.io/tblu-ui/#catalog-content) |

## Reproducible evidence

Run `npm run check`, `npm test`, and `npm run build`. The contract check enforces generic styles and notices; tests exercise values/constraints, lifecycle, async drafts, state/order, geometry and integration cleanup. [API guide](API.md) describes imports and host contracts. [Verification notes](VERIFICATION.md) record actual browser checks and their limits.
