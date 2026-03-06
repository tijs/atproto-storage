# Changelog

All notable changes to this project will be documented in this file.

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
