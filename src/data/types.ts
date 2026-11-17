export type Language = "en" | "bn";
export type Localized = { en: string; bn: string };
export type Category =
  "furniture" | "electronics" | "books" | "fashion" | "sports" | "home";
export type Condition = "like-new" | "good" | "fair";
export type Neighborhood =
  | "dhanmondi"
  | "mirpur"
  | "uttara"
  | "mohammadpur"
  | "banani"
  | "gulshan"
  | "bashundhara"
  | "lalmatia";
export type Listing = {
  id: string;
  sellerId: string;
  title: Localized;
  description: Localized;
  price: number;
  category: Category;
  condition: Condition;
  neighborhood: Neighborhood;
  photos: string[];
  status: "active" | "sold" | "removed";
  createdAt: number;
  localOnly?: boolean;
};
export type Profile = {
  id: string;
  name: string;
  neighborhood: Neighborhood;
  bio: string;
  avatar: string | null;
};
export type ListingInput = {
  title: string;
  description: string;
  price: number;
  category: Category;
  condition: Condition;
  neighborhood: Neighborhood;
  photos: string[];
};
export type Filters = {
  search?: string;
  category?: Category;
  neighborhood?: Neighborhood;
  condition?: Condition;
  min?: number;
  max?: number;
  sort?: "newest" | "price-low" | "price-high";
  saved?: boolean;
  owned?: boolean;
};
export type Page<T> = { items: T[]; next?: string; total: number };
export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  body: Localized;
  createdAt: number;
  status: "pending" | "sent" | "failed";
  simulated: boolean;
};
export type Conversation = {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  readAt: number;
};
export type InboxEntry = Conversation & {
  title: Localized;
  seller: Profile;
  latest?: Message;
  unread: number;
  removed: boolean;
};
export type Notice = {
  id: string;
  kind: "message" | "sold";
  targetId: string;
  text: Localized;
  read: boolean;
  simulated: boolean;
  createdAt: number;
};
export type Draft = {
  id: string;
  step: number;
  values: ListingInput;
  updatedAt: number;
};
export type DemoState = {
  version: 1;
  listings: Listing[];
  profiles: Profile[];
  saved: string[];
  conversations: Conversation[];
  messages: Message[];
  notices: Notice[];
  drafts: Record<string, Draft>;
};
export interface SnapshotStorage {
  read(): Promise<DemoState | null>;
  write(state: DemoState): Promise<void>;
}
export interface Marketplace {
  readonly identity: string;
  ready(): Promise<void>;
  subscribe(listener: () => void): () => void;
  listings(filters: Filters, cursor?: string): Promise<Page<Listing>>;
  listing(id: string): Promise<Listing | undefined>;
  saved(): Promise<string[]>;
  save(id: string, value: boolean): Promise<void>;
  publish(input: ListingInput, id: string, editing?: boolean): Promise<Listing>;
  changeStatus(id: string, status: "sold" | "removed"): Promise<void>;
  profile(id: string): Promise<Profile>;
  updateProfile(input: Omit<Profile, "id">): Promise<void>;
  inbox(): Promise<InboxEntry[]>;
  conversation(listingId: string): Promise<string>;
  messages(conversationId: string, cursor?: string): Promise<Page<Message>>;
  send(conversationId: string, id: string, body: string): Promise<void>;
  markRead(conversationId: string): Promise<void>;
  notifications(): Promise<Notice[]>;
  readNotifications(): Promise<void>;
  draft(id: string): Promise<Draft | undefined>;
  saveDraft(draft: Draft): Promise<void>;
  discardDraft(id: string): Promise<void>;
}
