# Changelog

All notable changes to this project will be documented in this file.

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
