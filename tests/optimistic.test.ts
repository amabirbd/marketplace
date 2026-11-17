import { test } from "node:test";
import assert from "node:assert/strict";
import { QueryClient } from "@tanstack/react-query";
import {
  beginOptimisticSave,
  rollbackSave,
} from "../src/features/listings/optimistic.ts";
test("failed optimistic save rolls back without erasing a concurrent successful save", async () => {
  const client = new QueryClient();
  const key = ["demo", "visitor", "saved"];
  client.setQueryData(key, ["existing"]);
  const failed = await beginOptimisticSave(client, key, "failed-item", true);
  await beginOptimisticSave(client, key, "successful-item", true);
  assert.deepEqual(client.getQueryData(key), [
    "existing",
    "failed-item",
    "successful-item",
  ]);
  rollbackSave(client, key, failed);
  assert.deepEqual(client.getQueryData(key), ["existing", "successful-item"]);
  client.clear();
});
test("failed optimistic unsave restores membership", async () => {
  const client = new QueryClient();
  const key = ["demo", "visitor", "saved"];
  client.setQueryData(key, ["existing"]);
  const context = await beginOptimisticSave(client, key, "existing", false);
  assert.deepEqual(client.getQueryData(key), []);
  rollbackSave(client, key, context);
  assert.deepEqual(client.getQueryData(key), ["existing"]);
  client.clear();
});
