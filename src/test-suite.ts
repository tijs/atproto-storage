/**
 * Shared conformance test suite for OAuthStorage implementations.
 * Ensures all backends behave identically.
 */

import { assertEquals, assertExists } from "@std/assert";
import type { OAuthStorage } from "./types.ts";

/**
 * Run the standard conformance test suite against any OAuthStorage implementation.
 *
 * @param name - Display name for the test group
 * @param factory - Creates a fresh storage instance for each test group
 */
export function runStorageSuite(
  name: string,
  factory: () => OAuthStorage | Promise<OAuthStorage>,
): void {
  Deno.test(`${name} - basic operations`, async (t) => {
    const storage = await factory();

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
  });

  Deno.test(`${name} - TTL expiration`, async (t) => {
    const storage = await factory();

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
  });

  Deno.test(`${name} - complex values`, async (t) => {
    const storage = await factory();

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
  });
}
