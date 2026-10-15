<div align="center">

# tblu-ui

**A coherent interface system for the whole application.**

Liquid glass & solid · light & dark · framework-neutral Web Components

[**Explore the studio →**](https://tonyblur.github.io/tblu-ui/) · [中文](README.zh.md) · [API guide](docs/API.md) · [Design contract](DESIGN_SYSTEM.md)

**0.2.0 beta** · MIT · MingCute icons · Web Awesome · Motion

</div>

![The real tblu-ui studio in dark mode](docs/images/studio-dark.png)

<table><tr><td width="50%">

**Light, with the same components**

![Light theme studio](docs/images/studio-light.png)

</td><td width="50%">

**Shared controls, including calendars**

![Calendar and form controls](docs/images/calendar-dark.png)

</td></tr></table>

## A catalog organized around real websites

The [official-source research](docs/component-coverage-research.md) compares **13 ecosystem families** and consolidates **112 component types**. The studio links **105 types to live interactive evidence**. Seven specialist types have explicit integration boundaries: a local agenda, small chart or JSON textarea is not presented as a professional scheduler, plotting engine or code editor.

| Family | Representative components | Typical sites |
| --- | --- | --- |
| Foundations | Tokens, typography, layouts, surfaces, scroll areas, splitters | Every application |
| Navigation | Menus, split actions, breadcrumbs, tabs, pagination, command palette, resizable sidebar | Content sites, admin, developer tools |
| Forms | Validation summaries, password, quantity, autocomplete, tags, OTP, cascader, tree selection, transfer | Accounts, settings, commerce |
| Dates & scheduling | Calendar, time, constrained range, month, ISO week, zoned instants, countdown, local agenda | Bookings, reporting |
| Collections | Floating table headers, selection, sorting, grid/list, filters, query rules, trees, descriptions | Admin, catalogs, files |
| Feedback | Dialog, confirmation, drawer, tooltip, rich preview, toast, notifications, progress, skeleton, recovery, tour | Every application |
| Files & media | Dropzone, transport-owned queue, gallery, lightbox, carousel, comparison, local player | Files, commerce, publishing |
| Collaboration | Composer, messages, thread, reactions, presence, timeline, activity, wizard, Kanban | Team tools, support, workflows |
| Metrics & editors | KPI, accessible SVG line/bar, sparkline, capacity meter, code, safe Markdown, editor primitives | Dashboards, documentation |

The directory filters by interaction, component family and website scenario. [Coverage and limits](docs/COVERAGE.md) distinguish reusable APIs, composed recipes and unbundled specialist engines.

> **Preview release:** every release before 1.0 is a GitHub prerelease. APIs may evolve. See [release policy](docs/RELEASES.md) and [changelog](CHANGELOG.md).

## What this project provides

- One material and theme contract for the whole application.
- Matching circular icon actions and pill shaped text actions, with three sizes and four semantic variants.
- Web Awesome select, color picker, switch, and radio primitives, styled and enhanced through one adapter.
- Native form controls retain their values, application events, and form submission behavior.
- Shared floating menus and popovers, including dismissal and keyboard interaction.
- Native date/time sources enhanced with custom calendars and time lists; no operating-system date menu.
- Dialogs, actionable notifications, tooltips, resizable sidebars and independent sticky table headers.
- Reusable form, collection, file queue, messaging, Kanban and metric controllers, exercised by scenario recipes.
- A single MingCute icon family, also used for internal control glyphs.
- Keyboard focus, selected, disabled, invalid, loading, and reduced motion states.
- A component studio with real interactions and responsive layouts.

This is a framework layer over Web Awesome and Motion, not an independent implementation of every underlying primitive. Business logic and application layouts stay in the consuming application.

## Run the component studio

Node.js 22.13 or newer is required.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. The studio lives in `demo/index.html`. To check and build it:

```sh
npm test
npm run check
npm run build
npm run preview
```

## Use in an application

The repository is the distribution source for this initial release. It does not require an npm registry publication.

```sh
npm install github:TonyBlur/tblu-ui#v0.2.0-beta.1 @awesome.me/webawesome motion
```

The package name is `@tblu/ui`. Use a bundler that supports CSS imports and ES modules, such as Vite. Mount on the client after the DOM is available.

```js
import '@tblu/ui/styles.css';
import { mountUI, icon, openMenu } from '@tblu/ui';

const ui = await mountUI(document, {
  theme: 'system',
  material: 'liquid',
  motion: 'full',
  accent: '#0284c7',
  enhanceNative: true,
});

ui.setTheme({ material: 'solid', theme: 'dark' });
ui.refresh(); // refresh after explicit DOM changes when needed
// ui.destroy(); // release observers and adapters when the host is unmounted
```

Add `class="tblu-ui"` to the application container. Mounting adds `.tblu-root` to the theme root. For a scoped mount, pass an element and set `themeRoot` explicitly if necessary; keep floating overlays inside the same application theme context.

```html
<div class="tblu-ui">
  <article class="tblu-card" data-tblu-surface="card">
    <h2>Collection preferences</h2>
    <label class="tblu-field">
      <span>Sort order</span>
      <select name="sort">
        <option value="original">Original order</option>
        <option value="title">Name</option>
      </select>
    </label>
    <label class="tblu-switch">
      <input type="checkbox" name="autoSync" />
      <span>Automatic synchronization</span>
    </label>
    <button class="tblu-button" data-tblu-variant="primary">Save changes</button>
  </article>
</div>
```

With `enhanceNative: true`, opened select lists and color picker dialogs are Web Awesome surfaces rather than operating-system menus. They follow the same framework tokens in both themes and materials. The native source controls remain the form data source.

Applications still provide accessible labels and semantic state attributes. Styling a control does not replace `aria-pressed`, `aria-selected`, `aria-invalid`, `disabled`, or a valid label.

### Public API

| API | Purpose |
| --- | --- |
| `mountUI(root, options)` | Initialize theme, form adapters, icons, and material lifecycle; returns a promise for the UI instance. |
| `ui.setTheme(patch)` | Apply a validated theme patch to all components. |
| `ui.refresh()` | Refresh form adapters and material geometry after content changes. |
| `ui.destroy()` | Remove adapters and release the mounted instance. |
| `ui.theme` | Read a copy of the current configuration. |
| `mountControls(root, options)` | Use only the native form adapter when a host manages the rest of the framework. |
| `createMaterial(options)` | Use the material lifecycle directly in an integration adapter. |
| `icon(name)` / `iconURL(name)` | Render a known MingCute glyph as trusted SVG markup or a data URL. |
| `openMenu(anchor, options)` | Create an anchored action menu. |
| `createPopover(anchor, options)` | Create an anchored surface from a content Node. |
| `destroyOverlays(root)` | Remove every overlay anchored inside a root; `ui.destroy()` also calls it. |
| `openDialog(options)` | Native modal focus containment, async actions, inline failure and focus restoration. |
| `showToast(options)` | Timed or persistent feedback with a paused timer and optional action. |
| `attachTooltip(anchor, options)` | Shared focus/hover tooltip; restores the original title on teardown. |
| `mountSidebarResize(options)` | Pointer and keyboard resizing with bounds, cancellation and width callbacks. |
| `mountFloatingTableHeader(root, options)` | Move real header controls into a separate sticky surface, synchronizing widths and horizontal scrolling. |
| `loadPrimitives(names)` | Lazily register documented free Web Components; Pro-only names are rejected. |
| `motion` | Shared enter, leave, and interaction helpers. |

Supported theme options include `theme` (`system`, `light`, `dark`), `material` (`liquid`, `solid`), `motion` (`full`, `reduced`), `accent` (a six digit hex color), `blur`, and `contrast`. Use the package's validation contract rather than bypassing it with visual overrides.

The [API guide](docs/API.md) documents pattern subpath imports and host-owned data/transport contracts. The material studio also exposes content size and density, with shared CSS variables for those layout preferences.

```js
const editButton = document.querySelector('#collectionActions');
editButton.innerHTML = icon('MoreHorizontal');
editButton.addEventListener('click', () => openMenu(editButton, {
  label: 'Collection actions',
  items: [
    { label: 'Edit', icon: 'Pencil', onSelect: () => editCollection() },
    { label: 'Delete', icon: 'Trash2', variant: 'danger', onSelect: () => confirmDeletion() },
  ],
}));
```

The host application owns confirmation, persistence, and permissions for these actions. Escape and clicking outside dismiss the menu. Arrow keys, Home, and End move through enabled menu actions. Tab continues to the next page control. Repeating the same anchor toggles its surface closed; removing the anchor also releases the portal.

Action callbacks run during the click so actions such as `window.open()` retain browser user activation. Provide `onError(error)` to handle rejected work, or listen for the bubbling `tblu-error` event on the anchor. The application owns any visible error message.

## Integration policy

Read [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) before adding controls. Framework tokens, component classes, and adapters are the source of truth. Application CSS belongs in the lower `app` cascade layer and may define layout, spacing between sections, and content typography. It must not restyle control material, shape, shadow, focus, or interaction feedback per screen.

If a new reusable variant is needed, add it here, include it in the studio, and verify its state matrix. Consume a versioned framework update instead of copying a one-off override into the application.

## Contributing

Keep changes focused on the common system. Include a studio example, meaningful tests for adapters or state transitions, and checks in light/dark themes, liquid/solid materials, narrow layouts, keyboard interaction, and reduced motion. The contract checker is a guardrail, not a substitute for browser verification.

## License and acknowledgements

MIT licensed. Derived source retains Pintree.io's MIT notice. MingCute SVG icons use Apache-2.0; Web Awesome and Motion use MIT licenses. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) and the bundled license texts.
## CI and demo deployment

The [CI and demo Pages workflow](.github/workflows/ci-pages.yml) runs `npm ci`, the contract checker, tests, the demo build, and a package inspection on pull requests and pushes to `main`. Pull requests never deploy. Successful `main` runs upload `demo-dist` as the Pages artifact and deploy through the `github-pages` environment.

In the repository's **Settings → Pages**, select **GitHub Actions** as the build and deployment source. Keep `package-lock.json` committed. The workflow builds with `PAGES_BASE=/tblu-ui/` and uses a separate deployment job with only the Pages and OIDC write permissions it needs. Actions are pinned to verified official release commits; update the pins deliberately when upgrading. See [GitHub's custom Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) for publishing requirements.

For a fork using a different repository name, change `PAGES_BASE` and the demo/source links together. No production credentials are needed for the static studio. An npm registry release is a separate process and is not performed by this workflow.
