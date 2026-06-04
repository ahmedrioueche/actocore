# Publishing to public npm

Packages: `@ahmedrioueche/actocore-shared`, `@ahmedrioueche/actocore-sdk`.

Registry: **https://registry.npmjs.org** (scoped, `access: public`). Host apps do **not** need a project `.npmrc`.

## One-time setup

```bash
npm login
```

Use the npm account that owns the `@ahmedrioueche` scope.

## Publish order

Always publish **shared** first, then **SDK** (SDK depends on shared).

```bash
# 1) Shared
cd packages/shared
npm run build
npm test   # if you add tests later
npm run publish:public

# 2) SDK (after shared 0.0.24+ is on npm)
cd ../sdk
npm install
npm run test
npm run publish:public
```

`publish:public` runs `npm publish --registry https://registry.npmjs.org --access public`, so a local `.npmrc` that points `@ahmedrioueche` at GitHub Packages does not affect publish.

## Verify

```bash
npm view @ahmedrioueche/actocore-shared version
npm view @ahmedrioueche/actocore-sdk version
```

Clean install check: see `packages/sdk/RELEASE_CHECKLIST.md`.

## Version bumps

- Bump `packages/shared/package.json` for contract/API changes.
- Bump `packages/sdk/package.json` and set `"@ahmedrioueche/actocore-shared": "^x.y.z"` to the published shared version.
