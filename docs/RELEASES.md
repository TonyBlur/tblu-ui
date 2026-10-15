# Release policy

Every `0.x` release is a prerelease. Versions with `alpha`, `beta`, `rc` or another SemVer prerelease suffix remain prereleases at any major version. A stable `1.0.0` requires the documented state and accessibility matrix, integration coverage, migration notes and reproducible validation.

- Current preview: `v0.2.0-beta.1`.
- Existing `v0.1.0` and `v0.1.1` retain their immutable tags and are marked as GitHub prereleases.
- The release-policy workflow corrects an accidentally stable pre-1.0 GitHub release. It does not delete or rewrite tags.
- Run `node scripts/release-policy.mjs <tag> <prerelease-boolean>` before publishing.
- Pin a tag or commit in consuming applications. An npm registry publication is a separate explicit step; these versions are distributed through GitHub.

Publish only after `npm ci`, `npm run check`, `npm test`, `npm run build` and the browser verification documented in `COVERAGE.md`. Report any incomplete check without presenting a preview as production-certified.
