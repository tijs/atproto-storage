# @tijs/atproto-storage

[![Test](https://github.com/tijs/atproto-storage/actions/workflows/test.yml/badge.svg)](https://github.com/tijs/atproto-storage/actions/workflows/test.yml)

Storage implementations for AT Protocol OAuth applications. Provides a simple
key-value storage interface with implementations for in-memory and SQLite
backends.

## Installation

```typescript
import {
  MemoryStorage,
  SQLiteStorage,
  valTownAdapter,
} from "jsr:@tijs/atproto-storage";
```

## Usage

### In-Memory Storage (Testing/Development)

```typescript
import { MemoryStorage } from "jsr:@tijs/atproto-storage";

const storage = new MemoryStorage();

// Store with TTL (seconds)
await storage.set("session:123", { did: "did:plc:abc" }, { ttl: 3600 });

// Retrieve
const session = await storage.get("session:123");

// Delete
await storage.delete("session:123");
```

### SQLite Storage (Production)

SQLiteStorage works with any SQLite driver via adapters:

#### Val.Town / libSQL / Turso

```typescript
import { sqlite } from "https://esm.town/v/std/sqlite";
import { SQLiteStorage, valTownAdapter } from "jsr:@tijs/atproto-storage";

const storage = new SQLiteStorage(valTownAdapter(sqlite));
```

#### Deno Native SQLite

```typescript
import { Database } from "jsr:@db/sqlite";
import { denoSqliteAdapter, SQLiteStorage } from "jsr:@tijs/atproto-storage";

const db = new Database("storage.db");
const storage = new SQLiteStorage(denoSqliteAdapter(db));
```

#### better-sqlite3 (Node.js)

```typescript
import Database from "better-sqlite3";
import { betterSqlite3Adapter, SQLiteStorage } from "jsr:@tijs/atproto-storage";

const db = new Database("storage.db");
const storage = new SQLiteStorage(betterSqlite3Adapter(db));
```

#### Custom Adapter

```typescript
import { SQLiteAdapter, SQLiteStorage } from "jsr:@tijs/atproto-storage";

const customAdapter: SQLiteAdapter = {
  execute: async (sql, params) => {
    const result = await myDriver.query(sql, params);
    return result.rows;
  },
};

const storage = new SQLiteStorage(customAdapter);
```

### Options

```typescript
const storage = new SQLiteStorage(adapter, {
  tableName: "my_storage", // Default: "oauth_storage"
  logger: console, // Optional logger for debugging
});
```

### Cleanup

For SQLite storage, periodically clean up expired entries:

```typescript
const deletedCount = await storage.cleanup();
```

## API

### OAuthStorage Interface

```typescript
interface OAuthStorage {
  get<T = unknown>(key: string): Promise<T | null>;
  set<T = unknown>(
    key: string,
    value: T,
    options?: { ttl?: number },
  ): Promise<void>;
  delete(key: string): Promise<void>;
}
```

### SQLiteAdapter Interface

```typescript
interface SQLiteAdapter {
  execute(sql: string, params: unknown[]): Promise<unknown[][]>;
}
```

## License

MIT
