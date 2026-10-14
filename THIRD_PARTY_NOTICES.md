# Third-party notices

## tblu-ui and derived source

The original tblu-ui code and documentation are licensed under MIT, copyright © 2026 TonyBlur. Material and interaction code was extracted and adapted from the tblu-bookmark workspace, which derives from Pintree. Pintree's MIT notice is retained in the repository's [LICENSE](LICENSE): copyright © 2024 Pintree.io. The original upstream license is also retained at [licenses/Pintree-LICENSE](licenses/Pintree-LICENSE).

Source extraction includes changes to naming, public component contracts, lifecycle handling, tokens, and form adapters. It does not imply endorsement by Pintree or the dependencies listed below.

## MingCute SVG icons

- Package/source: `@mingcute/svg` / MingCute Design.
- License: Apache License, Version 2.0.
- Upstream: <https://github.com/mingcute-design/mingcute-icons>.
- License text: [licenses/MingCute-LICENSE](licenses/MingCute-LICENSE).

The shared icon registry contains selected MingCute Core Filled SVG geometry and its Core Regular star counterpart. SVG markup is adapted for sizing, class names, accessible decorative rendering, and internal control replacement. The underlying icon designs remain MingCute's work. No ownership of the upstream designs is claimed.

## Web Awesome

- Package/source: `@awesome.me/webawesome` / Fonticons, Inc.
- License: MIT.
- Copyright: © 2025 Fonticons, Inc.
- Upstream: <https://github.com/shoelace-style/webawesome>.
- License text: [licenses/WebAwesome-LICENSE](licenses/WebAwesome-LICENSE).

Web Awesome supplies select, option, color-picker, switch, radio, popup, and icon infrastructure. tblu-ui applies its own common tokens, styling, icon registry, and native control adapter. Dependency licenses must remain available when redistributing a bundled application.

## Motion

- Package/source: `motion` / Motion B.V.
- License: MIT.
- Copyright: © 2024 Motion B.V.
- Upstream: <https://github.com/motiondivision/motion>.
- License text: [licenses/Motion-LICENSE](licenses/Motion-LICENSE).

Motion supplies the animation engine used by the shared interaction helpers.

## Development tooling

Vite and its dependencies are used to develop and bundle the demo. They remain governed by their individual package licenses. Development tooling is not incorporated into the public component source as owned tblu-ui code.

When redistributing this project, retain the MIT notices and the Apache-2.0 license text applicable to the selected icon source, together with any upstream notices required by the dependencies included in your distribution.
