import { seed, VISITOR } from "./fixtures.ts";
import {
  listingSchema,
  messageSchema,
  profileSchema,
} from "../features/sell/schema.ts";
import type {
  DemoState,
  Draft,
  Filters,
  ListingInput,
  Marketplace,
  Message,
  Profile,
  SnapshotStorage,
} from "./types.ts";

export class MarketplaceError extends Error {
  code: "storage" | "permission" | "unavailable" | "simulatedFailure" | "reset";
  constructor(code: MarketplaceError["code"], message = code) {
    super(message);
    this.code = code;
  }
}
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value));
export class DemoMarketplace implements Marketplace {
  readonly identity = VISITOR;
  private state = seed();
  private initialization?: Promise<void>;
  private queue: Promise<unknown> = Promise.resolve();
  private listeners = new Set<() => void>();
  private epoch = 0;
  private failure: "none" | "save" | "send" | "ack" = "none";
  private activeConversation?: string;
  private storage: SnapshotStorage;
  private latency: number;
  constructor(storage: SnapshotStorage, latency = 350) {
    this.storage = storage;
    this.latency = latency;
  }
  ready() {
    this.initialization ??= this.storage
      .read()
      .then(async (saved) => {
        if (saved) {
          if (
            saved.version !== 1 ||
            !Array.isArray(saved.listings) ||
            !Array.isArray(saved.messages) ||
            !saved.drafts
          )
            throw new MarketplaceError("storage");
          this.state = saved;
          this.state.messages.forEach((m) => {
            if (m.status === "pending") m.status = "failed";
          });
        } else await this.storage.write(this.state);
      })
      .catch(() => {
        this.initialization = undefined;
        throw new MarketplaceError("storage");
      });
    return this.initialization;
  }
  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  private async read() {
    await this.ready();
    await this.queue;
    return copy(this.state);
  }
  private transaction<T>(action: (draft: DemoState) => T): Promise<T> {
    const result = this.queue.then(async () => {
      await this.ready();
      const next = copy(this.state);
      const value = action(next);
      try {
        await this.storage.write(next);
      } catch {
        throw new MarketplaceError("storage");
      }
      this.state = next;
      this.listeners.forEach((listener) => listener());
      return copy(value ?? null) as T;
    });
    this.queue = result.catch(() => undefined);
    return result;
  }
  failNext(kind: "save" | "send" | "ack") {
    this.failure = kind;
  }
  setActiveConversation(id?: string) {
    this.activeConversation = id;
  }
  async reset() {
    await this.transaction((s) => {
      Object.assign(s, seed());
      this.epoch += 1;
    });
    this.failure = "none";
    this.activeConversation = undefined;
  }
  async listings(filters: Filters, cursor?: string) {
    const s = await this.read();
    const search = (filters.search ?? "").trim().toLocaleLowerCase();
    const items = s.listings
      .filter((l) =>
        filters.owned
          ? l.sellerId === VISITOR && l.status !== "removed"
          : filters.saved
            ? s.saved.includes(l.id)
            : l.status === "active",
      )
      .filter((l) => !filters.category || l.category === filters.category)
      .filter(
        (l) => !filters.neighborhood || l.neighborhood === filters.neighborhood,
      )
      .filter((l) => !filters.condition || l.condition === filters.condition)
      .filter((l) => filters.min === undefined || l.price >= filters.min)
      .filter((l) => filters.max === undefined || l.price <= filters.max)
      .filter((l) =>
        `${l.title.en} ${l.title.bn} ${l.description.en} ${l.description.bn}`
          .toLocaleLowerCase()
          .includes(search),
      )
      .sort(
        (a, b) =>
          (filters.sort === "price-low"
            ? a.price - b.price
            : filters.sort === "price-high"
              ? b.price - a.price
              : b.createdAt - a.createdAt) || a.id.localeCompare(b.id),
      );
    const start = cursor
      ? Math.max(0, items.findIndex((l) => l.id === cursor) + 1)
      : 0;
    const page = items.slice(start, start + 12);
    return {
      items: page,
      total: items.length,
      next: start + page.length < items.length ? page.at(-1)?.id : undefined,
    };
  }
  async listing(id: string) {
    return (await this.read()).listings.find((l) => l.id === id);
  }
  async saved() {
    return (await this.read()).saved;
  }
  save(id: string, value: boolean) {
    return this.transaction((s) => {
      if (this.failure === "save") {
        this.failure = "none";
        throw new MarketplaceError("simulatedFailure");
      }
      if (!s.listings.some((l) => l.id === id))
        throw new MarketplaceError("unavailable");
      s.saved = s.saved.filter((x) => x !== id);
      if (value) s.saved.push(id);
    });
  }
  publish(input: ListingInput, id: string, editing = false) {
    const parsed = listingSchema.parse(input);
    return this.transaction((s) => {
      const old = s.listings.find((l) => l.id === id);
      if (old && old.sellerId !== VISITOR)
        throw new MarketplaceError("permission");
      if (editing && (!old || old.status !== "active"))
        throw new MarketplaceError("unavailable");
      if (old && !editing) return old; // A retried publish keeps its original identifier.
      const listing = {
        ...parsed,
        id,
        title: { en: parsed.title, bn: parsed.title },
        description: { en: parsed.description, bn: parsed.description },
        sellerId: VISITOR,
        createdAt: old?.createdAt ?? Date.now(),
        status: "active" as const,
        localOnly: true,
      };
      s.listings = [listing, ...s.listings.filter((l) => l.id !== id)];
      delete s.drafts[editing ? id : "new"];
      return listing;
    });
  }
  changeStatus(id: string, status: "sold" | "removed") {
    return this.transaction((s) => {
      const listing = s.listings.find((l) => l.id === id);
      if (!listing || listing.sellerId !== VISITOR)
        throw new MarketplaceError("permission");
      listing.status = status;
      if (status === "removed") {
        listing.title = { en: "Listing removed", bn: "বিজ্ঞাপন সরানো হয়েছে" };
        listing.description = { en: "", bn: "" };
        listing.photos = [];
        delete s.drafts[id];
      }
    });
  }
  async profile(id: string) {
    const profile = (await this.read()).profiles.find((p) => p.id === id);
    if (!profile) throw new MarketplaceError("unavailable");
    return profile;
  }
  updateProfile(input: Omit<Profile, "id">) {
    const parsed = profileSchema.parse(input);
    return this.transaction((s) => {
      s.profiles = s.profiles.map((p) =>
        p.id === VISITOR ? { ...parsed, id: VISITOR } : p,
      );
    });
  }
  async inbox() {
    const s = await this.read();
    return s.conversations
      .filter((c) => c.buyerId === VISITOR || c.sellerId === VISITOR)
      .map((c) => {
        const listing = s.listings.find((l) => l.id === c.listingId)!;
        const messages = s.messages.filter((m) => m.conversationId === c.id);
        return {
          ...c,
          title: listing.title,
          seller: s.profiles.find(
            (p) => p.id === (c.buyerId === VISITOR ? c.sellerId : c.buyerId),
          )!,
          latest: messages.at(-1),
          unread: messages.filter(
            (m) => m.senderId !== VISITOR && m.createdAt > c.readAt,
          ).length,
          removed: listing.status === "removed",
        };
      })
      .sort((a, b) => (b.latest?.createdAt ?? 0) - (a.latest?.createdAt ?? 0));
  }
  conversation(listingId: string) {
    return this.transaction((s) => {
      const old = s.conversations.find(
        (c) => c.listingId === listingId && c.buyerId === VISITOR,
      );
      if (old) return old.id;
      const listing = s.listings.find((l) => l.id === listingId);
      if (
        !listing ||
        listing.status !== "active" ||
        listing.sellerId === VISITOR
      )
        throw new MarketplaceError("unavailable");
      const id = `chat-${listingId}`;
      s.conversations.push({
        id,
        listingId,
        buyerId: VISITOR,
        sellerId: listing.sellerId,
        readAt: 0,
      });
      return id;
    });
  }
  private member(s: DemoState, id: string) {
    const c = s.conversations.find(
      (c) => c.id === id && (c.buyerId === VISITOR || c.sellerId === VISITOR),
    );
    if (!c) throw new MarketplaceError("permission");
    return c;
  }
  async messages(id: string, cursor?: string) {
    const s = await this.read();
    this.member(s, id);
    const all = s.messages
      .filter((m) => m.conversationId === id)
      .sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
    const end = cursor
      ? Math.max(
          0,
          all.findIndex((m) => m.id === cursor),
        )
      : all.length;
    const items = all.slice(Math.max(0, end - 20), end);
    return {
      items,
      total: all.length,
      next: end > 20 ? items[0]?.id : undefined,
    };
  }
  async send(conversationId: string, id: string, text: string) {
    const body = messageSchema.parse(text);
    const epoch = this.epoch;
    const failure =
      this.failure === "send" || this.failure === "ack" ? this.failure : "none";
    if (failure !== "none") this.failure = "none";
    const alreadySent = await this.transaction((s) => {
      const c = this.member(s, conversationId);
      if (s.listings.find((l) => l.id === c.listingId)?.status === "removed")
        throw new MarketplaceError("unavailable");
      const existing = s.messages.find((m) => m.id === id);
      if (
        existing &&
        (existing.conversationId !== conversationId ||
          existing.senderId !== VISITOR ||
          existing.body.en !== body)
      )
        throw new MarketplaceError("permission");
      if (existing?.status === "sent") return true;
      if (existing) existing.status = "pending";
      else
        s.messages.push({
          id,
          conversationId,
          senderId: VISITOR,
          body: { en: body, bn: body },
          createdAt: Date.now(),
          simulated: false,
          status: "pending",
        });
      return false;
    });
    if (alreadySent) return;
    if (this.latency)
      await new Promise((resolve) => setTimeout(resolve, this.latency));
    await this.transaction((s) => {
      if (epoch !== this.epoch) throw new MarketplaceError("reset");
      const c = this.member(s, conversationId);
      const message = s.messages.find((m) => m.id === id)!;
      if (s.listings.find((l) => l.id === c.listingId)?.status === "removed") {
        message.status = "failed";
        return;
      }
      if (message.status === "sent") return;
      message.status = failure === "send" ? "failed" : "sent";
      if (failure === "send") return;
      const reply: Message = {
        id: `reply-${id}`,
        conversationId,
        senderId: c.sellerId,
        body: {
          en: "Hi! Thanks for asking. We can arrange a daytime pickup in the neighborhood. This is a simulated reply — no real meeting is being arranged.",
          bn: "হ্যালো! আগ্রহের জন্য ধন্যবাদ। দিনের বেলায় এলাকায় দেখা করা যায়। এটি অনুকরণ করা উত্তর — বাস্তবে দেখা করার ব্যবস্থা হচ্ছে না।",
        },
        status: "sent",
        simulated: true,
        createdAt: Math.max(Date.now(), message.createdAt + 1),
      };
      if (!s.messages.some((m) => m.id === reply.id)) s.messages.push(reply);
      if (this.activeConversation === conversationId)
        c.readAt = reply.createdAt;
      else if (!s.notices.some((n) => n.id === reply.id))
        s.notices.push({
          id: reply.id,
          kind: "message",
          targetId: conversationId,
          text: {
            en: "A neighbor replied to your message",
            bn: "একজন প্রতিবেশী উত্তর দিয়েছেন",
          },
          read: false,
          simulated: true,
          createdAt: reply.createdAt,
        });
    });
    if (failure === "send" || failure === "ack")
      throw new MarketplaceError("simulatedFailure");
  }
  markRead(id: string) {
    return this.transaction((s) => {
      const c = this.member(s, id);
      c.readAt = Math.max(
        Date.now(),
        ...s.messages
          .filter((m) => m.conversationId === id)
          .map((m) => m.createdAt),
      );
    });
  }
  async notifications() {
    return (await this.read()).notices.sort(
      (a, b) => b.createdAt - a.createdAt,
    );
  }
  readNotifications() {
    return this.transaction((s) => {
      s.notices.forEach((n) => {
        n.read = true;
      });
    });
  }
  async simulateSoldNotice() {
    return this.transaction((s) => {
      const listing = s.listings.find(
        (l) =>
          s.saved.includes(l.id) &&
          l.sellerId !== VISITOR &&
          l.status === "active",
      );
      if (!listing) throw new MarketplaceError("unavailable");
      listing.status = "sold";
      s.notices.push({
        id: `sold-${listing.id}`,
        kind: "sold",
        targetId: listing.id,
        text: {
          en: `${listing.title.en} was marked sold`,
          bn: `${listing.title.bn} বিক্রি হয়েছে`,
        },
        read: false,
        simulated: true,
        createdAt: Date.now(),
      });
    });
  }
  async draft(id: string) {
    return (await this.read()).drafts[id];
  }
  saveDraft(draft: Draft) {
    return this.transaction((s) => {
      s.drafts[draft.id] = draft;
    });
  }
  discardDraft(id: string) {
    return this.transaction((s) => {
      delete s.drafts[id];
    });
  }
}
