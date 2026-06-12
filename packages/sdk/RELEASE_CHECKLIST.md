# SDK Release Checklist

Use this checklist for every `@ahmedrioueche/actocore-sdk` release.

## 1) Sync and quality gate

- [ ] Confirm `@ahmedrioueche/actocore-shared` version compatibility in `packages/sdk/package.json`
- [ ] Run tests: `npm -C packages/sdk test`
- [ ] Build package: `npm -C packages/sdk run build`
- [ ] Verify no unexpected files in git status

## 2) Version and docs

- [ ] Bump SDK version in `packages/sdk/package.json`
- [ ] Add entry to `packages/sdk/CHANGELOG.md` (Keep a Changelog format)
- [ ] Add matching entry to `packages/shared/src/constants/sdk-releases.ts` (include `sharedVersion`)
- [ ] Update `packages/sdk/README.md` examples/config if API changed
- [ ] Update `ROADMAP.md` checkboxes/status if scope changed

## 3) Package dry-run

- [ ] Create tarball:
  - `npm -C packages/sdk pack`
- [ ] Inspect tarball output:
  - expected `dist/**`, `README.md`, `package.json`
  - no secrets (`.npmrc`, env files, local test data)

## 4) External install verification (clean directory)

- [ ] Create clean folder (outside SDK package directory)
- [ ] Initialize temp project: `npm init -y`
- [ ] Install tarball:
  - `npm install <path-to-tgz>`
- [ ] Verify package resolution:
  - `npm ls @ahmedrioueche/actocore-sdk`
- [ ] (Optional) Build a tiny host app importing:
  - `@ahmedrioueche/actocore-sdk`
  - `@ahmedrioueche/actocore-sdk/styles.css`

## 5) Publish (public npm)

- [ ] `npm login` on https://registry.npmjs.org
- [ ] Publish shared first: `npm -C packages/shared run publish:public`
- [ ] Publish SDK: `npm -C packages/sdk run publish:public`
- [ ] Confirm published version is installable in another clean project (no `.npmrc` in host app)

See [`../PUBLISH.md`](../PUBLISH.md).

## 6) Post-publish

- [ ] Pin/record compatible `@ahmedrioueche/actocore-shared` version (in `sdk-releases.ts` per release)
- [ ] Tag release and add changelog summary
- [ ] Update playground to consume the published version when needed
- [ ] Deploy Studio so release banner and Project Docs pick up new `sdk-releases` data

