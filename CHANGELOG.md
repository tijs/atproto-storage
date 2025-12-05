# Changelog

All notable changes to this project will be documented in this file.

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
