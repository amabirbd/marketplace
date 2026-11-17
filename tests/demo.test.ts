import { test } from "node:test";
import assert from "node:assert/strict";
import { DemoMarketplace } from "../src/data/demo.ts";
import type {
  DemoState,
  ListingInput,
  SnapshotStorage,
} from "../src/data/types.ts";
import { listingSchema } from "../src/features/sell/schema.ts";
const input: ListingInput = {
  title: "A favorite reading chair",
  description: "A comfortable chair in good condition, ready for another home.",
  category: "furniture",
  condition: "good",
  price: 2500,
  neighborhood: "dhanmondi",
  photos: ["asset:chair"],
};
function setup(latency = 0) {
  let snapshot: DemoState | null = null;
  let fail = false;
  const storage: SnapshotStorage = {
    read: async () => structuredClone(snapshot),
    write: async (next) => {
      if (fail) throw new Error("disk full");
      snapshot = structuredClone(next);
    },
  };
  return {
    market: new DemoMarketplace(storage, latency),
    storage,
    failStorage: (value: boolean) => {
      fail = value;
    },
  };
}
test("validation accepts free listings and rejects fractional, excessive prices and missing photos", () => {
  assert.equal(listingSchema.safeParse({ ...input, price: 0 }).success, true);
  for (const price of [-1, 0.5, NaN, 10000001])
    assert.equal(listingSchema.safeParse({ ...input, price }).success, false);
  assert.equal(
    listingSchema.safeParse({ ...input, photos: [] }).success,
    false,
  );
  assert.equal(
    listingSchema.safeParse({ ...input, title: "  abc " }).success,
    false,
  );
});
test("all 30 listings paginate without duplicates; bilingual search and combined filters work", async () => {
  const { market } = setup();
  const ids: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await market.listings({ sort: "price-low" }, cursor);
    ids.push(...page.items.map((l) => l.id));
    cursor = page.next;
  } while (cursor);
  assert.equal(ids.length, 30);
  assert.equal(new Set(ids).size, 30);
  const page = await market.listings({
    search: "বেতের",
    category: "furniture",
    neighborhood: "dhanmondi",
    max: 7000,
  });
  assert.ok(page.items.length > 0);
  assert.ok(
    page.items.every(
      (l) =>
        l.category === "furniture" &&
        l.neighborhood === "dhanmondi" &&
        l.price <= 7000,
    ),
  );
});
test("save failures leave persistent state unchanged; restart restores successful saves", async () => {
  const { market, storage, failStorage } = setup();
  await market.save("fixture-1", true);
  market.failNext("save");
  await assert.rejects(market.save("fixture-1", false));
  assert.deepEqual(await market.saved(), ["fixture-1"]);
  failStorage(true);
  await assert.rejects(market.save("fixture-2", true));
  failStorage(false);
  assert.deepEqual(await new DemoMarketplace(storage).saved(), ["fixture-1"]);
});
test("publishing is idempotent, owns its listing and clears its draft; restart preserves photos", async () => {
  const { market, storage } = setup();
  await market.saveDraft({ id: "new", step: 2, values: input, updatedAt: 1 });
  assert.deepEqual(
    (await new DemoMarketplace(storage).draft("new"))?.values.photos,
    ["asset:chair"],
  );
  await market.publish(input, "local-1");
  await market.publish(input, "local-1");
  assert.equal(
    (await market.listings({ owned: true })).items.filter(
      (l) => l.id === "local-1",
    ).length,
    1,
  );
  assert.equal(await market.draft("new"), undefined);
  await assert.rejects(market.publish(input, "fixture-1", true));
  await assert.rejects(market.changeStatus("fixture-1", "sold"));
  await market.changeStatus("local-1", "sold");
  assert.equal((await market.listing("local-1"))?.status, "sold");
});
test("failed message and lost acknowledgement retries each persist one message and one reply", async () => {
  const { market } = setup();
  const chat = await market.conversation("fixture-1");
  for (const failure of ["send", "ack"] as const) {
    market.failNext(failure);
    const id = `message-${failure}`;
    await assert.rejects(market.send(chat, id, "Still available?"));
    await market.send(chat, id, "Still available?");
    await market.send(chat, id, "Still available?");
    const messages = (await market.messages(chat)).items;
    assert.equal(messages.filter((m) => m.id === id).length, 1);
    assert.equal(messages.filter((m) => m.id === `reply-${id}`).length, 1);
    assert.equal(messages.find((m) => m.id === id)?.status, "sent");
  }
});
test("message ID cannot be reused for different content or a different conversation", async () => {
  const { market } = setup();
  const a = await market.conversation("fixture-1");
  const b = await market.conversation("fixture-3");
  await market.send(a, "stable-id", "Hello there");
  await assert.rejects(market.send(a, "stable-id", "Different text"));
  await assert.rejects(market.send(b, "stable-id", "Hello there"));
  await assert.rejects(market.messages("not-a-member"));
});
test("active conversation suppresses notifications and unread; history paginates", async () => {
  const { market } = setup();
  const chat = await market.conversation("fixture-1");
  market.setActiveConversation(chat);
  for (let i = 0; i < 13; i++)
    await market.send(chat, `send-${i}`, `Message number ${i}`);
  assert.equal((await market.notifications()).length, 0);
  assert.equal((await market.inbox()).find((c) => c.id === chat)?.unread, 0);
  const page = await market.messages(chat);
  assert.equal(page.items.length, 20);
  assert.ok(page.next);
  const older = await market.messages(chat, page.next);
  assert.equal(older.items.length, 6);
  assert.equal(
    new Set([...page.items, ...older.items].map((m) => m.id)).size,
    26,
  );
  market.setActiveConversation(undefined);
  await market.send(chat, "away", "Anyone there?");
  assert.equal((await market.notifications()).length, 1);
});
test("reset during a pending send cannot repopulate the reset demo", async () => {
  const { market } = setup(30);
  const chat = await market.conversation("fixture-1");
  const pending = market.send(chat, "pending-reset", "Hello again");
  await new Promise((resolve) => setTimeout(resolve, 5));
  await market.reset();
  await assert.rejects(pending);
  assert.equal((await market.inbox()).length, 1);
  assert.equal((await market.saved()).length, 0);
});
test("simulated sale updates saved state and generates an explicitly simulated notice", async () => {
  const { market } = setup();
  await market.save("fixture-1", true);
  await market.simulateSoldNotice();
  assert.equal(
    (await market.listings({ saved: true })).items[0]?.status,
    "sold",
  );
  assert.equal((await market.notifications())[0]?.simulated, true);
  await assert.rejects(market.conversation("fixture-1"));
});
