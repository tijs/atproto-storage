# Changelog

All notable changes to this project will be documented in this file.

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
