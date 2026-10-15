// Generated from the official-source coverage research. Types are not completion claims.
export const categories = Object.freeze([
  {
    "id": "foundations",
    "title": "Foundations & layout"
  },
  {
    "id": "navigation",
    "title": "Actions & navigation"
  },
  {
    "id": "forms",
    "title": "Forms & validation"
  },
  {
    "id": "temporal",
    "title": "Dates & scheduling"
  },
  {
    "id": "collections",
    "title": "Data & collections"
  },
  {
    "id": "feedback",
    "title": "Overlays & feedback"
  },
  {
    "id": "media",
    "title": "Files & media"
  },
  {
    "id": "workflow",
    "title": "Workflow & collaboration"
  },
  {
    "id": "content",
    "title": "Metrics & editors"
  }
]);
export const componentCatalog = Object.freeze([
  {
    "id": "1",
    "type": "Theme and token provider",
    "category": "foundations",
    "layer": "P / P0",
    "scenarios": [
      "All"
    ],
    "requirements": "System/light/dark; liquid/solid; scoped theme; reduced motion; contrast. All."
  },
  {
    "id": "2",
    "type": "Typography and prose",
    "category": "foundations",
    "layer": "P / P0",
    "scenarios": [
      "Public",
      "Dev"
    ],
    "requirements": "Headings, body, code, truncation, localized number/date text. Public/Dev."
  },
  {
    "id": "3",
    "type": "Icon and accessible icon",
    "category": "foundations",
    "layer": "P / P0",
    "scenarios": [
      "All"
    ],
    "requirements": "One glyph family, decorative versus named, consistent sizing. All."
  },
  {
    "id": "4",
    "type": "Stack/flex/cluster layout",
    "category": "foundations",
    "layer": "P / P0",
    "scenarios": [
      "All"
    ],
    "requirements": "Horizontal/vertical, wrap, alignment, responsive gaps. All."
  },
  {
    "id": "5",
    "type": "Container/responsive grid",
    "category": "foundations",
    "layer": "P / P0",
    "scenarios": [
      "Public",
      "Files"
    ],
    "requirements": "Content width, responsive columns, aspect ratio, masonry recipe. Public/Files."
  },
  {
    "id": "6",
    "type": "Surface/panel",
    "category": "foundations",
    "layer": "P / P0",
    "scenarios": [
      "All"
    ],
    "requirements": "Raised/inset/quiet, correct clipping and material feedback. All."
  },
  {
    "id": "7",
    "type": "Card",
    "category": "foundations",
    "layer": "P / P0",
    "scenarios": [
      "Public",
      "Admin",
      "Commerce"
    ],
    "requirements": "Header/footer/actions; selectable and clickable variants with correct semantics. Public/Admin/Commerce."
  },
  {
    "id": "8",
    "type": "Separator and grouping",
    "category": "foundations",
    "layer": "P / P0",
    "scenarios": [
      "All"
    ],
    "requirements": "Horizontal/vertical; decorative or semantic grouping. All."
  },
  {
    "id": "9",
    "type": "Scroll area",
    "category": "foundations",
    "layer": "P / P0",
    "scenarios": [
      "All"
    ],
    "requirements": "Overflow cue, keyboard access, horizontal/vertical; no trapped nested scrolling. All."
  },
  {
    "id": "10",
    "type": "Splitter/resizable panels",
    "category": "foundations",
    "layer": "P / P1",
    "scenarios": [
      "Admin",
      "Dev"
    ],
    "requirements": "Horizontal/vertical, min/max, keyboard resize, collapsed panes. Admin/Dev."
  },
  {
    "id": "11",
    "type": "Button",
    "category": "navigation",
    "layer": "P / P0",
    "scenarios": [
      "All"
    ],
    "requirements": "Semantic variants, matched sizes, busy/disabled; submit and link usage. All."
  },
  {
    "id": "12",
    "type": "Icon button",
    "category": "navigation",
    "layer": "P / P0",
    "scenarios": [
      "All"
    ],
    "requirements": "Circular; named; selected/busy; compact touch target. All."
  },
  {
    "id": "13",
    "type": "Link",
    "category": "navigation",
    "layer": "P / P0",
    "scenarios": [
      "Public",
      "Dev"
    ],
    "requirements": "Inline/standalone, external indicator, visited and disabled guidance. Public/Dev."
  },
  {
    "id": "14",
    "type": "Button/toggle group",
    "category": "navigation",
    "layer": "P / P0",
    "scenarios": [
      "All"
    ],
    "requirements": "Single/multiple selection, roving focus, connected or separated geometry. All."
  },
  {
    "id": "15",
    "type": "Split button",
    "category": "navigation",
    "layer": "C / P1",
    "scenarios": [
      "Admin",
      "Commerce"
    ],
    "requirements": "Default action plus menu, independent keyboard targets. Admin/Commerce."
  },
  {
    "id": "16",
    "type": "Toolbar/action bar",
    "category": "navigation",
    "layer": "C / P0",
    "scenarios": [
      "Admin",
      "Files"
    ],
    "requirements": "Overflow, selection count, bulk actions, responsive grouping. Admin/Files."
  },
  {
    "id": "17",
    "type": "Topbar/application shell",
    "category": "navigation",
    "layer": "C / P0",
    "scenarios": [
      "All"
    ],
    "requirements": "Brand, navigation, search, account, responsive collapse. All."
  },
  {
    "id": "18",
    "type": "Sidebar/navigation rail",
    "category": "navigation",
    "layer": "C / P0",
    "scenarios": [
      "Admin",
      "Dev"
    ],
    "requirements": "Nested items, current location, collapsed/mobile drawer, resizing. Admin/Dev."
  },
  {
    "id": "19",
    "type": "Menu/context menu",
    "category": "navigation",
    "layer": "P / P0",
    "scenarios": [
      "Admin",
      "Files"
    ],
    "requirements": "Nested and checkable/radio items, disabled items, keyboard invocation. Admin/Files."
  },
  {
    "id": "20",
    "type": "Menubar",
    "category": "navigation",
    "layer": "P / P1",
    "scenarios": [
      "Dev",
      "Admin"
    ],
    "requirements": "Horizontal menus with arrows and submenu focus management. Dev/Admin."
  },
  {
    "id": "21",
    "type": "Navigation/mega menu",
    "category": "navigation",
    "layer": "C / P1",
    "scenarios": [
      "Public",
      "Commerce"
    ],
    "requirements": "Link-rich sections; responsive disclosure; preserve real link semantics. Public/Commerce."
  },
  {
    "id": "22",
    "type": "Breadcrumb",
    "category": "navigation",
    "layer": "P / P0",
    "scenarios": [
      "Admin",
      "Files"
    ],
    "requirements": "Overflow ancestors, centered anchored overflow, current item. Admin/Files."
  },
  {
    "id": "23",
    "type": "Tabs",
    "category": "navigation",
    "layer": "P / P0",
    "scenarios": [
      "All"
    ],
    "requirements": "Horizontal/vertical, manual/automatic activation, indicator motion. All."
  },
  {
    "id": "24",
    "type": "Pagination",
    "category": "navigation",
    "layer": "P / P0",
    "scenarios": [
      "Public",
      "Admin"
    ],
    "requirements": "Page size, simple/numbered, server-driven totals and unknown totals. Public/Admin."
  },
  {
    "id": "25",
    "type": "Command palette",
    "category": "navigation",
    "layer": "C / P1",
    "scenarios": [
      "Admin",
      "Dev"
    ],
    "requirements": "Shortcut, fuzzy/search matching, grouped actions, async/empty state. Admin/Dev."
  },
  {
    "id": "26",
    "type": "Field/label/help/error",
    "category": "forms",
    "layer": "P / P0",
    "scenarios": [
      "Account"
    ],
    "requirements": "Label associations, required marker, hints, invalid/read-only/disabled distinction. Account."
  },
  {
    "id": "27",
    "type": "Form/validation summary",
    "category": "forms",
    "layer": "C / P0",
    "scenarios": [
      "Account",
      "Admin"
    ],
    "requirements": "Native/custom validation, error summary links, async failure, dirty/reset states. Account/Admin."
  },
  {
    "id": "28",
    "type": "Fieldset/group",
    "category": "forms",
    "layer": "P / P0",
    "scenarios": [
      "Account"
    ],
    "requirements": "Legend, related controls, grouped errors; optional disclosure. Account."
  },
  {
    "id": "29",
    "type": "Text input/input group",
    "category": "forms",
    "layer": "P / P0",
    "scenarios": [
      "All"
    ],
    "requirements": "Prefix/suffix, clear, email/url/tel; preserve IME and native events. All."
  },
  {
    "id": "30",
    "type": "Textarea",
    "category": "forms",
    "layer": "P / P0",
    "scenarios": [
      "Account",
      "Collab"
    ],
    "requirements": "Auto-size, length count, read-only, resize guidance. Account/Collab."
  },
  {
    "id": "31",
    "type": "Number input",
    "category": "forms",
    "layer": "P / P0",
    "scenarios": [
      "Commerce",
      "Admin"
    ],
    "requirements": "Step/min/max, localized display, invalid partial entry, quantity controls. Commerce/Admin."
  },
  {
    "id": "32",
    "type": "Password input",
    "category": "forms",
    "layer": "C / P0",
    "scenarios": [
      "Account"
    ],
    "requirements": "Reveal, confirmation, policy hint and strength feedback. Account."
  },
  {
    "id": "33",
    "type": "Search field",
    "category": "forms",
    "layer": "C / P0",
    "scenarios": [
      "All"
    ],
    "requirements": "Clear, busy, shortcut, suggestions, explicit search versus live filtering. All."
  },
  {
    "id": "34",
    "type": "Select/listbox",
    "category": "forms",
    "layer": "P / P0",
    "scenarios": [
      "Account"
    ],
    "requirements": "Single, grouped, disabled, scroll, typeahead and native form bridge. Account."
  },
  {
    "id": "35",
    "type": "Multi-select",
    "category": "forms",
    "layer": "P / P0",
    "scenarios": [
      "Admin",
      "Commerce"
    ],
    "requirements": "Selection tokens, select/clear all, grouped options, keyboard removal. Admin/Commerce."
  },
  {
    "id": "36",
    "type": "Combobox/autocomplete",
    "category": "forms",
    "layer": "P / P0",
    "scenarios": [
      "All"
    ],
    "requirements": "Editable/freeform or select-only; async suggestions; custom option rendering. All."
  },
  {
    "id": "37",
    "type": "Tags/token input",
    "category": "forms",
    "layer": "P / P0",
    "scenarios": [
      "Admin",
      "Files"
    ],
    "requirements": "Existing plus new values, remove/edit, paste, localized names, duplicates. Admin/Files."
  },
  {
    "id": "38",
    "type": "Checkbox/group",
    "category": "forms",
    "layer": "P / P0",
    "scenarios": [
      "Account",
      "Admin"
    ],
    "requirements": "Checked/mixed, master selection and fieldset semantics. Account/Admin."
  },
  {
    "id": "39",
    "type": "Radio/group",
    "category": "forms",
    "layer": "P / P0",
    "scenarios": [
      "Account",
      "Commerce"
    ],
    "requirements": "Single choice, keyboard group navigation, card choice variant. Account/Commerce."
  },
  {
    "id": "40",
    "type": "Switch",
    "category": "forms",
    "layer": "P / P0",
    "scenarios": [
      "Account"
    ],
    "requirements": "Immediate setting, busy/disabled, visible on/off labels. Account."
  },
  {
    "id": "41",
    "type": "Slider/range slider",
    "category": "forms",
    "layer": "P / P1",
    "scenarios": [
      "Dashboard",
      "Commerce"
    ],
    "requirements": "One/two thumbs, step marks, value text, keyboard precision. Dashboard/Commerce."
  },
  {
    "id": "42",
    "type": "Color picker/swatch",
    "category": "forms",
    "layer": "P / P0",
    "scenarios": [
      "Account",
      "Dev"
    ],
    "requirements": "Current six-digit native value; presets, future alpha contract separate. Account/Dev."
  },
  {
    "id": "43",
    "type": "Rating",
    "category": "forms",
    "layer": "P / P1",
    "scenarios": [
      "Commerce",
      "Public"
    ],
    "requirements": "Read-only/editable, half steps, numerical accessible value. Commerce/Public."
  },
  {
    "id": "44",
    "type": "OTP/PIN input",
    "category": "forms",
    "layer": "P / P1",
    "scenarios": [
      "Account"
    ],
    "requirements": "Paste, autofill, correction, masked variant; coherent single value. Account."
  },
  {
    "id": "45",
    "type": "Masked/structured input",
    "category": "forms",
    "layer": "P / P1",
    "scenarios": [
      "Account",
      "Commerce"
    ],
    "requirements": "Phone/postal/identifier format; keep raw versus formatted value explicit. Account/Commerce."
  },
  {
    "id": "46",
    "type": "Cascader",
    "category": "forms",
    "layer": "P / P1",
    "scenarios": [
      "Admin",
      "Commerce"
    ],
    "requirements": "Hierarchical options, path labels, searchable leaves, async children. Admin/Commerce."
  },
  {
    "id": "47",
    "type": "Tree select",
    "category": "forms",
    "layer": "C / P1",
    "scenarios": [
      "Files",
      "Admin"
    ],
    "requirements": "Single/multiple paths, disabled branches, mixed descendants. Files/Admin."
  },
  {
    "id": "48",
    "type": "Transfer/dual list",
    "category": "forms",
    "layer": "C / P1",
    "scenarios": [
      "Admin"
    ],
    "requirements": "Search, selected/all transfer, keyboard reorder, disabled choices. Admin."
  },
  {
    "id": "49",
    "type": "Date field",
    "category": "temporal",
    "layer": "P / P0",
    "scenarios": [
      "Account",
      "Schedule"
    ],
    "requirements": "Typed/segmented, locale order, min/max, clear and reset. Account/Schedule."
  },
  {
    "id": "50",
    "type": "Calendar/date picker",
    "category": "temporal",
    "layer": "P / P0",
    "scenarios": [
      "Schedule"
    ],
    "requirements": "Inline/popover, month navigation, unavailable dates, keyboard grid. Schedule."
  },
  {
    "id": "51",
    "type": "Date-range picker",
    "category": "temporal",
    "layer": "C / P0",
    "scenarios": [
      "Dashboard",
      "Schedule"
    ],
    "requirements": "Start/end, presets, hover preview, cross-month and reversed-range policy. Dashboard/Schedule."
  },
  {
    "id": "52",
    "type": "Time field/picker",
    "category": "temporal",
    "layer": "P / P0",
    "scenarios": [
      "Schedule"
    ],
    "requirements": "12/24h, minute/second step, allowed range and localized labels. Schedule."
  },
  {
    "id": "53",
    "type": "Date-time picker",
    "category": "temporal",
    "layer": "C / P1",
    "scenarios": [
      "Schedule",
      "Admin"
    ],
    "requirements": "Combine date/time; explicit zone; DST ambiguous/nonexistent times. Schedule/Admin."
  },
  {
    "id": "54",
    "type": "Month/year picker",
    "category": "temporal",
    "layer": "P / P1",
    "scenarios": [
      "Dashboard",
      "Account"
    ],
    "requirements": "Coarser granularity without pretending a day is chosen. Dashboard/Account."
  },
  {
    "id": "55",
    "type": "Week picker",
    "category": "temporal",
    "layer": "P / P1",
    "scenarios": [
      "Schedule",
      "Dashboard"
    ],
    "requirements": "ISO/local week rules, year boundary, week labels. Schedule/Dashboard."
  },
  {
    "id": "56",
    "type": "Timestamp/relative time",
    "category": "temporal",
    "layer": "P / P0",
    "scenarios": [
      "Admin",
      "Collab"
    ],
    "requirements": "Absolute tooltip, relative updates, locale and timezone. Admin/Collab."
  },
  {
    "id": "57",
    "type": "Duration/countdown",
    "category": "temporal",
    "layer": "C / P1",
    "scenarios": [
      "Schedule",
      "Dashboard"
    ],
    "requirements": "Duration is not wall-clock time; pause/resume and screen-reader update policy. Media/Schedule."
  },
  {
    "id": "58",
    "type": "Scheduler/agenda",
    "category": "temporal",
    "layer": "C+I / P2",
    "scenarios": [
      "Schedule"
    ],
    "requirements": "Day/week/month/list, event details, recurrence, drag/resize, resources. Schedule."
  },
  {
    "id": "59",
    "type": "List/grid list",
    "category": "collections",
    "layer": "P / P0",
    "scenarios": [
      "All"
    ],
    "requirements": "Selection, actions, keyboard reorder, drag/drop and virtualized adapter. All."
  },
  {
    "id": "60",
    "type": "Description/data list",
    "category": "collections",
    "layer": "P / P0",
    "scenarios": [
      "Account",
      "Admin"
    ],
    "requirements": "Key/value, responsive columns, inline edit and missing values. Account/Admin."
  },
  {
    "id": "61",
    "type": "Semantic table",
    "category": "collections",
    "layer": "P / P0",
    "scenarios": [
      "Admin"
    ],
    "requirements": "Floating header, sorting, row selection, expansion, aligned cells, responsive overflow. Admin."
  },
  {
    "id": "62",
    "type": "Advanced data grid",
    "category": "collections",
    "layer": "I / P2",
    "scenarios": [
      "Admin",
      "Dashboard"
    ],
    "requirements": "Virtualization, resize/reorder/pin, editing, grouping, aggregation, server data. Admin/Dashboard."
  },
  {
    "id": "63",
    "type": "Tree",
    "category": "collections",
    "layer": "P / P1",
    "scenarios": [
      "Files",
      "Admin"
    ],
    "requirements": "Expand/collapse, lazy children, selection, keyboard arrows and typeahead. Files/Admin."
  },
  {
    "id": "64",
    "type": "Tree grid/table",
    "category": "collections",
    "layer": "C+I / P2",
    "scenarios": [
      "Files",
      "Admin"
    ],
    "requirements": "Hierarchical rows plus columns; separate expansion and selection. Files/Admin."
  },
  {
    "id": "65",
    "type": "Data view/catalog grid",
    "category": "collections",
    "layer": "C / P1",
    "scenarios": [
      "Public",
      "Commerce",
      "Files"
    ],
    "requirements": "Grid/list mode, sorting, pagination, direct reorder, card actions. Public/Commerce/Files."
  },
  {
    "id": "66",
    "type": "Filter/facet bar",
    "category": "collections",
    "layer": "C / P0",
    "scenarios": [
      "Public",
      "Admin"
    ],
    "requirements": "Search plus filters, active chips, clear all, URL/state ownership. Public/Admin."
  },
  {
    "id": "67",
    "type": "Query/filter builder",
    "category": "collections",
    "layer": "C / P1",
    "scenarios": [
      "Dashboard",
      "Dev"
    ],
    "requirements": "AND/OR groups, operators, typed values, validation; no backend query injection. Dashboard/Dev."
  },
  {
    "id": "68",
    "type": "Avatar/avatar group",
    "category": "collections",
    "layer": "P / P0",
    "scenarios": [
      "Collab",
      "Account"
    ],
    "requirements": "Image/initial fallback, overflow count, presence companion. Collab/Account."
  },
  {
    "id": "69",
    "type": "Badge/tag/status",
    "category": "collections",
    "layer": "P / P0",
    "scenarios": [
      "All"
    ],
    "requirements": "Count/status/metadata; removable or selectable tags are explicit variants. All."
  },
  {
    "id": "70",
    "type": "Empty/result state",
    "category": "collections",
    "layer": "C / P0",
    "scenarios": [
      "All"
    ],
    "requirements": "No data, no search match, success, permission denied; useful next action. All."
  },
  {
    "id": "71",
    "type": "Tooltip",
    "category": "feedback",
    "layer": "P / P0",
    "scenarios": [
      "All"
    ],
    "requirements": "Hover/focus, delay, Escape, noninteractive content. All."
  },
  {
    "id": "72",
    "type": "Hover/preview card",
    "category": "feedback",
    "layer": "P / P1",
    "scenarios": [
      "Public",
      "Collab"
    ],
    "requirements": "Rich preview, keyboard access, controlled dismissal. Public/Collab."
  },
  {
    "id": "73",
    "type": "Popover",
    "category": "feedback",
    "layer": "P / P0",
    "scenarios": [
      "All"
    ],
    "requirements": "Anchoring, collision/viewport handling, repeated trigger, lifecycle cleanup. All."
  },
  {
    "id": "74",
    "type": "Dialog/modal",
    "category": "feedback",
    "layer": "P / P0",
    "scenarios": [
      "Account",
      "Admin"
    ],
    "requirements": "Focus containment/restore, background inertness, scroll lock, nested overlays. Account/Admin."
  },
  {
    "id": "75",
    "type": "Confirmation/alert dialog",
    "category": "feedback",
    "layer": "C / P0",
    "scenarios": [
      "Admin"
    ],
    "requirements": "Destructive action, cancel/default focus, async busy/error; no premature dismissal. Admin."
  },
  {
    "id": "76",
    "type": "Drawer",
    "category": "feedback",
    "layer": "P / P0",
    "scenarios": [
      "All"
    ],
    "requirements": "Side/bottom, modal/nonmodal, mobile navigation and filter panels. All."
  },
  {
    "id": "77",
    "type": "Disclosure/accordion",
    "category": "feedback",
    "layer": "P / P0",
    "scenarios": [
      "Public",
      "Account"
    ],
    "requirements": "Single/multiple open, arrow indicator, enter/leave, associated regions. Public/Account."
  },
  {
    "id": "78",
    "type": "Inline alert/banner",
    "category": "feedback",
    "layer": "P / P0",
    "scenarios": [
      "All"
    ],
    "requirements": "Info/success/warning/error, dismissible/persistent, text plus action. All."
  },
  {
    "id": "79",
    "type": "Toast/snackbar",
    "category": "feedback",
    "layer": "C / P0",
    "scenarios": [
      "All"
    ],
    "requirements": "Queue, timer pause, dismiss, undo, polite/assertive announcements. All."
  },
  {
    "id": "80",
    "type": "Notification center",
    "category": "feedback",
    "layer": "C / P1",
    "scenarios": [
      "Collab",
      "Admin"
    ],
    "requirements": "Read/unread, filters, grouped timestamps, actions, empty/loading state. Collab/Admin."
  },
  {
    "id": "81",
    "type": "Progress/meter",
    "category": "feedback",
    "layer": "P / P0",
    "scenarios": [
      "Files",
      "Dashboard"
    ],
    "requirements": "Determinate/indeterminate, bar/ring, label and value text. Files/Dashboard."
  },
  {
    "id": "82",
    "type": "Spinner/loading overlay",
    "category": "feedback",
    "layer": "P / P0",
    "scenarios": [
      "All"
    ],
    "requirements": "Local/page loading, prevent duplicate actions; delayed display. All."
  },
  {
    "id": "83",
    "type": "Skeleton",
    "category": "feedback",
    "layer": "P / P0",
    "scenarios": [
      "All"
    ],
    "requirements": "Preserve geometry; text/card/list/table variants; reduced motion. All."
  },
  {
    "id": "84",
    "type": "Error/offline/retry boundary",
    "category": "feedback",
    "layer": "C / P0",
    "scenarios": [
      "All"
    ],
    "requirements": "Network/error/reconnection states, retry ownership and stale-data indication. All."
  },
  {
    "id": "85",
    "type": "Tour/onboarding coachmark",
    "category": "feedback",
    "layer": "C / P1",
    "scenarios": [
      "Admin",
      "Public"
    ],
    "requirements": "Steps, anchor collision, skip, focus, progress and dismissed preference. Admin/Public."
  },
  {
    "id": "86",
    "type": "File input/trigger",
    "category": "media",
    "layer": "P / P0",
    "scenarios": [
      "Files",
      "Account"
    ],
    "requirements": "Name/type/size display, multiple, clear/reset; retain native chooser. Files/Account."
  },
  {
    "id": "87",
    "type": "Dropzone",
    "category": "media",
    "layer": "C / P0",
    "scenarios": [
      "Files"
    ],
    "requirements": "Drag target, keyboard trigger, accept/size validation, rejected-file feedback. Files."
  },
  {
    "id": "88",
    "type": "Upload queue",
    "category": "media",
    "layer": "C / P1",
    "scenarios": [
      "Files"
    ],
    "requirements": "Progress, cancel/retry, success/failure, preview; host owns transport. Files."
  },
  {
    "id": "89",
    "type": "File manager/explorer",
    "category": "media",
    "layer": "C / P1",
    "scenarios": [
      "Files",
      "Admin"
    ],
    "requirements": "Breadcrumb/tree, grid/list, select/move, details and permissions. Files/Admin."
  },
  {
    "id": "90",
    "type": "Image/gallery",
    "category": "media",
    "layer": "P+C / P0",
    "scenarios": [
      "Public",
      "Commerce",
      "Files"
    ],
    "requirements": "Alt/loading/failure, thumbnail grid, responsive aspect ratio. Public/Commerce/Files."
  },
  {
    "id": "91",
    "type": "Lightbox/media viewer",
    "category": "media",
    "layer": "C / P1",
    "scenarios": [
      "Files",
      "Commerce"
    ],
    "requirements": "Zoom, previous/next, captions, Escape, focus return. Files/Commerce."
  },
  {
    "id": "92",
    "type": "Carousel",
    "category": "media",
    "layer": "P / P1",
    "scenarios": [
      "Public",
      "Commerce"
    ],
    "requirements": "Buttons/dots, keyboard, pause, reduced motion; avoid forced autoplay. Public/Commerce."
  },
  {
    "id": "93",
    "type": "Audio/video player",
    "category": "media",
    "layer": "C+I / P2",
    "scenarios": [
      "Public",
      "Files"
    ],
    "requirements": "Native controls or adapter, captions, speed, seek, playlist and errors. Public/Files."
  },
  {
    "id": "94",
    "type": "Image comparison",
    "category": "media",
    "layer": "P / P1",
    "scenarios": [
      "Public",
      "Files"
    ],
    "requirements": "Before/after divider, keyboard adjustment, accessible labels. Public/Files."
  },
  {
    "id": "95",
    "type": "Stepper/progress steps",
    "category": "workflow",
    "layer": "P / P1",
    "scenarios": [
      "Account",
      "Commerce"
    ],
    "requirements": "Current/complete/error, horizontal/vertical, optional steps. Account/Commerce."
  },
  {
    "id": "96",
    "type": "Wizard/multi-step form",
    "category": "workflow",
    "layer": "C / P1",
    "scenarios": [
      "Account",
      "Admin"
    ],
    "requirements": "Validation per step, back/next, review, resumable draft, final submit. Account/Admin."
  },
  {
    "id": "97",
    "type": "Timeline",
    "category": "workflow",
    "layer": "P / P1",
    "scenarios": [
      "Public",
      "Admin"
    ],
    "requirements": "Chronological items, icon/status/time, compact/alternating. Public/Admin."
  },
  {
    "id": "98",
    "type": "Activity/audit feed",
    "category": "workflow",
    "layer": "C / P1",
    "scenarios": [
      "Admin",
      "Collab"
    ],
    "requirements": "Actor/action/time, grouping, pagination, detail expansion. Admin/Collab."
  },
  {
    "id": "99",
    "type": "Kanban/task board",
    "category": "workflow",
    "layer": "C / P1",
    "scenarios": [
      "Collab",
      "Admin"
    ],
    "requirements": "Columns, direct drag plus keyboard alternative, filters and card detail. Collab/Admin."
  },
  {
    "id": "100",
    "type": "Message bubble",
    "category": "workflow",
    "layer": "P / P1",
    "scenarios": [
      "Collab"
    ],
    "requirements": "Incoming/outgoing/system, author/time, delivered/failed, attachments. Collab."
  },
  {
    "id": "101",
    "type": "Message composer",
    "category": "workflow",
    "layer": "C / P1",
    "scenarios": [
      "Collab"
    ],
    "requirements": "Multiline, send/busy/stop, attachments, mentions, IME-safe Enter policy. Collab."
  },
  {
    "id": "102",
    "type": "Conversation/message feed",
    "category": "workflow",
    "layer": "C / P1",
    "scenarios": [
      "Collab"
    ],
    "requirements": "Follow-scroll opt-out, unread divider, load older, streaming and retry. Collab."
  },
  {
    "id": "103",
    "type": "Comment/review thread",
    "category": "workflow",
    "layer": "C / P1",
    "scenarios": [
      "Collab",
      "Commerce"
    ],
    "requirements": "Reply/edit/delete, resolution, reactions, quoted context. Collab/Commerce."
  },
  {
    "id": "104",
    "type": "Presence/collaborator group",
    "category": "workflow",
    "layer": "C / P1",
    "scenarios": [
      "Collab"
    ],
    "requirements": "Online/offline, avatar overflow, permission label and shared-session context. Collab."
  },
  {
    "id": "105",
    "type": "Statistic/KPI card",
    "category": "content",
    "layer": "C / P1",
    "scenarios": [
      "Dashboard"
    ],
    "requirements": "Label/value/unit, trend, comparison, missing/error/loading values. Dashboard."
  },
  {
    "id": "106",
    "type": "Chart/plot",
    "category": "content",
    "layer": "I / P2",
    "scenarios": [
      "Dashboard"
    ],
    "requirements": "Line/bar/area/scatter/donut, axes/legend/tooltip, brushing, accessible data table. Dashboard."
  },
  {
    "id": "107",
    "type": "Sparkline",
    "category": "content",
    "layer": "P+I / P1",
    "scenarios": [
      "Dashboard",
      "Admin"
    ],
    "requirements": "Compact trend, no misleading scale, value summary and missing data. Dashboard/Admin."
  },
  {
    "id": "108",
    "type": "Gauge/meter group",
    "category": "content",
    "layer": "P+I / P1",
    "scenarios": [
      "Dashboard"
    ],
    "requirements": "Capacity/threshold, labeled units, multiple categories; accessible numeric values. Dashboard."
  },
  {
    "id": "109",
    "type": "Code block/snippet",
    "category": "content",
    "layer": "P / P0",
    "scenarios": [
      "Dev"
    ],
    "requirements": "Language label, copy feedback, wrap/scroll, line numbers and diff variant. Dev."
  },
  {
    "id": "110",
    "type": "Markdown/prose renderer",
    "category": "content",
    "layer": "C+I / P1",
    "scenarios": [
      "Public",
      "Dev",
      "Collab"
    ],
    "requirements": "Sanitized rendering, links, tables/code, contents navigation. Public/Dev/Collab."
  },
  {
    "id": "111",
    "type": "Rich-text editor",
    "category": "content",
    "layer": "I / P2",
    "scenarios": [
      "Public",
      "Collab"
    ],
    "requirements": "Formatting toolbar, history, schema, paste sanitization, serialization. Public/Collab."
  },
  {
    "id": "112",
    "type": "Code/JSON/diff editor",
    "category": "content",
    "layer": "I / P2",
    "scenarios": [
      "Dev",
      "Admin"
    ],
    "requirements": "Syntax, validation, completion, line navigation, diff and worker lifecycle. Dev/Admin."
  }
].map(item=>Object.freeze(item)));
export const websiteScenarios = Object.freeze(['All','Public','Account','Admin','Commerce','Schedule','Collab','Files','Dashboard','Dev']);
export function filterCatalog({query='',category='',scenario=''}={}) {
  const words=String(query).toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  return componentCatalog.filter(item=>(!category||item.category===category)&&(!scenario||item.scenarios.includes('All')||item.scenarios.includes(scenario))&&words.every(word=>[item.type,item.category,item.requirements,...item.scenarios].join(' ').toLocaleLowerCase().includes(word)));
}
