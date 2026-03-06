import { assertEquals, assertExists } from "@std/assert";
import { UpstashRedisStorage } from "./upstash.ts";

// Upstash tests use inline tests (not runStorageSuite) so we can properly
// mock and restore globalThis.fetch around each test group.

const originalFetch = globalThis.fetch;

function createMockUpstash(): UpstashRedisStorage {
  const store = new Map<string, { value: string; expiresAt?: number }>();

  globalThis.fetch = ((_input: string | URL | Request, init?: RequestInit) => {
    const args = JSON.parse(init?.body as string) as (string | number)[];
    const cmd = (args[0] as string).toUpperCase();

    let result: unknown = null;

    if (cmd === "GET") {
      const key = args[1] as string;
      const entry = store.get(key);
      if (entry) {
        if (entry.expiresAt && entry.expiresAt <= Date.now()) {
          store.delete(key);
          result = null;
        } else {
          result = entry.value;
        }
      }
    } else if (cmd === "SET") {
      const key = args[1] as string;
      const value = args[2] as string;
      let expiresAt: number | undefined;
      if (args[3] === "EX" && args[4]) {
        expiresAt = Date.now() + (args[4] as number) * 1000;
      } else if (args[3] === "PX" && args[4]) {
        expiresAt = Date.now() + (args[4] as number);
      }
      store.set(key, { value, expiresAt });
      result = "OK";
    } else if (cmd === "DEL") {
      const key = args[1] as string;
      store.delete(key);
      result = 1;
    }

    return Promise.resolve(
      new Response(JSON.stringify({ result }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
  }) as typeof globalThis.fetch;

  return new UpstashRedisStorage({
    url: "https://fake-upstash.example.com",
    token: "fake-token",
  });
}

function restoreFetch() {
  globalThis.fetch = originalFetch;
}

Deno.test("UpstashRedisStorage - basic operations", async (t) => {
  const storage = createMockUpstash();
  try {
    await t.step("set and get value", async () => {
      await storage.set("key1", { foo: "bar" });
      const result = await storage.get<{ foo: string }>("key1");
      assertExists(result);
      assertEquals(result.foo, "bar");
    });

    await t.step("get non-existent key returns null", async () => {
      const result = await storage.get("nonexistent");
      assertEquals(result, null);
    });

    await t.step("delete removes value", async () => {
      await storage.set("key2", "value");
      await storage.delete("key2");
      const result = await storage.get("key2");
      assertEquals(result, null);
    });

    await t.step("overwrite existing value", async () => {
      await storage.set("key3", "first");
      await storage.set("key3", "second");
      const result = await storage.get("key3");
      assertEquals(result, "second");
    });
  } finally {
    restoreFetch();
  }
});

Deno.test("UpstashRedisStorage - TTL expiration", async (t) => {
  const storage = createMockUpstash();
  try {
    await t.step("value available before TTL", async () => {
      await storage.set("ttl-key", "value", { ttl: 10 });
      const result = await storage.get("ttl-key");
      assertEquals(result, "value");
    });

    await t.step("value expired after TTL", async () => {
      await storage.set("expired-key", "value", { ttl: 0.001 }); // 1ms
      await new Promise((r) => setTimeout(r, 50));
      const result = await storage.get("expired-key");
      assertEquals(result, null);
    });

    await t.step("value without TTL never expires", async () => {
      await storage.set("no-ttl", "value");
      const result = await storage.get("no-ttl");
      assertEquals(result, "value");
    });
  } finally {
    restoreFetch();
  }
});

Deno.test("UpstashRedisStorage - complex values", async (t) => {
  const storage = createMockUpstash();
  try {
    await t.step("stores objects", async () => {
      const obj = { nested: { deep: { value: 123 } } };
      await storage.set("obj", obj);
      const result = await storage.get<typeof obj>("obj");
      assertEquals(result, obj);
    });

    await t.step("stores arrays", async () => {
      const arr = [1, 2, 3, { four: 4 }];
      await storage.set("arr", arr);
      const result = await storage.get<typeof arr>("arr");
      assertEquals(result, arr);
    });

    await t.step("stores strings", async () => {
      await storage.set("str", "hello world");
      const result = await storage.get<string>("str");
      assertEquals(result, "hello world");
    });

    await t.step("stores numbers", async () => {
      await storage.set("num", 42);
      const result = await storage.get<number>("num");
      assertEquals(result, 42);
    });

    await t.step("stores booleans", async () => {
      await storage.set("bool", true);
      const result = await storage.get<boolean>("bool");
      assertEquals(result, true);
    });
  } finally {
    restoreFetch();
  }
});
