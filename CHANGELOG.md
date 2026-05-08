# Changelog

All notable changes to this project will be documented in this file.

## [1.3.1] - 2026-05-08

### Changed

- **CI**: Configure npm trusted publisher via `npm-publish.yml` workflow.

## [1.3.0] - 2026-05-08

### Changed

- **CI**: Split publish into separate `jsr-publish.yml` and `npm-publish.yml`
  workflows. npm workflow uses trusted publishing (OIDC, no static token).

## [1.2.9] - 2026-05-08

### Changed

- **CI**: Remove npm publish job — JSR is the only distribution target.

## [1.2.8] - 2026-05-08

### Changed

- **CI**: Explicitly fetch GitHub Actions OIDC token with `audience=npm` and
  pass as `NODE_AUTH_TOKEN`. This is the token npm trusted publishing expects: a
  short-lived JWT that the registry validates against the configured trusted
  publisher (owner/repo/workflow). Removes the `token: ""` workaround that still
  allowed `setup-node` to inject `GITHUB_TOKEN`.

## [1.2.7] - 2026-05-08

### Changed

- **CI**: Set `token: ""` on `setup-node` to prevent it exporting `GITHUB_TOKEN`
  as `NODE_AUTH_TOKEN`. With no legacy token, npm uses OIDC trusted publishing.

## [1.2.6] - 2026-05-08

### Changed

- **CI**: Restore `NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}` in publish step.
  npm CLI does not support token-free OIDC auth; `--provenance` uses OIDC for
  signing only. A granular npm access token scoped to this package is required.

## [1.2.5] - 2026-05-08

### Changed

- **CI**: Also `unset NODE_AUTH_TOKEN` before `npm publish` — npm reads this env
  var directly as a fallback even after the `.npmrc` entry is deleted,
  preventing the OIDC trusted publishing exchange from triggering.

## [1.2.4] - 2026-05-08

### Changed

- **CI**: Delete `setup-node`-injected `GITHUB_TOKEN` from `.npmrc` before
  `npm publish` so npm uses OIDC trusted publishing instead of the invalid
  GitHub token (which caused E404 from npmjs.com).

## [1.2.3] - 2026-05-08

### Changed

- **CI**: Restore `registry-url` to `setup-node` — required for npm to have
  registry context when performing the OIDC trusted publishing token exchange.

## [1.2.2] - 2026-05-08

### Changed

- **CI**: Remove `registry-url` from `setup-node` so npm uses OIDC trusted
  publishing instead of injecting an empty auth token that overrides the OIDC
  exchange.

## [1.2.1] - 2026-05-08

### Changed

- **CI**: Remove `npm install -g npm@latest` from publish workflow — the step
  was failing on Node.js 22.22.2 runners due to a missing `promise-retry`
  transitive dependency in the bundled `@npmcli/arborist`. The npm shipped with
  Node.js 22 is sufficient for publishing.

## [1.2.0] - 2026-05-08

### Fixed

- **SQLiteStorage self-healing schema migration** — `init()` now runs
  `ALTER TABLE ADD COLUMN` for `created_at` and `updated_at` after the initial
  `CREATE TABLE IF NOT EXISTS`. Tables created by older versions (pre-1.1.0)
  that only have `(key, value, expires_at)` are automatically upgraded on first
  use. "Duplicate column name" errors are swallowed so the fix is idempotent on
  already-correct schemas.

## [1.1.0] - 2026-03-06

### Added

- **DenoKvStorage** — uses Deno's built-in KV store with native TTL support
- **RedisStorage** — works with any Redis client via the `RedisAdapter`
  interface
- **UpstashRedisStorage** — serverless Redis via Upstash REST API (no client
  needed)
- Shared conformance test suite (`runStorageSuite`) ensuring all backends behave
  identically
- `RedisAdapter` interface for plugging in any Redis client
- `UpstashRedisOptions` type for Upstash configuration
- Usage examples for all new backends in README

### Improved

- Upstash error messages now include response body for easier debugging
- Upstash test suite properly restores `globalThis.fetch` after each test group
- Test suite refactored: common tests extracted into shared suite,
  backend-specific tests kept separate
- README updated with correct `sqliteAdapter` name and documentation for all
  backends

## [1.0.0] - 2025-12-05

### Breaking Changes

- Renamed `valTownAdapter` to `sqliteAdapter` - the adapter works with any
  SQLite driver using the `execute({ sql, args })` pattern (Val.Town, libSQL,
  Turso, etc.)

### Migration

Replace:

```typescript
import { valTownAdapter } from "@tijs/atproto-storage";
```

With:

```typescript
import { sqliteAdapter } from "@tijs/atproto-storage";
```

## [0.1.1] - 2025-11-27

### Fixed

- Formatting issues in CI workflow

## [0.1.0] - 2025-11-27

### Added

- Initial release
- `OAuthStorage` interface for key-value storage with TTL support
- `MemoryStorage` implementation for testing and development
- `SQLiteStorage` implementation for production use
- Adapter pattern for SQLite backends:
  - `valTownAdapter()` for Val.Town sqlite and libSQL/Turso
  - `denoSqliteAdapter()` for @db/sqlite (Deno native)
  - `betterSqlite3Adapter()` for better-sqlite3 (Node.js)
- Automatic table creation and schema management
- TTL-based expiration with cleanup method
- Comprehensive test suite
