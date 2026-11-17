import type { Category, Condition, Localized, Neighborhood } from "./types.ts";
export const categories: Record<Category, Localized> = {
  furniture: { en: "Furniture", bn: "আসবাব" },
  electronics: { en: "Electronics", bn: "ইলেকট্রনিক্স" },
  books: { en: "Books", bn: "বই" },
  fashion: { en: "Fashion", bn: "পোশাক" },
  sports: { en: "Sports", bn: "খেলাধুলা" },
  home: { en: "Home", bn: "ঘরের জিনিস" },
};
export const neighborhoods: Record<Neighborhood, Localized> = {
  dhanmondi: { en: "Dhanmondi", bn: "ধানমন্ডি" },
  mirpur: { en: "Mirpur", bn: "মিরপুর" },
  uttara: { en: "Uttara", bn: "উত্তরা" },
  mohammadpur: { en: "Mohammadpur", bn: "মোহাম্মদপুর" },
  banani: { en: "Banani", bn: "বনানী" },
  gulshan: { en: "Gulshan", bn: "গুলশান" },
  bashundhara: { en: "Bashundhara", bn: "বসুন্ধরা" },
  lalmatia: { en: "Lalmatia", bn: "লালমাটিয়া" },
};
export const conditions: Record<Condition, Localized> = {
  "like-new": { en: "Like new", bn: "প্রায় নতুন" },
  good: { en: "Good", bn: "ভালো" },
  fair: { en: "Fair", bn: "মোটামুটি" },
};
export const categoryKeys = Object.keys(categories) as Category[];
export const neighborhoodKeys = Object.keys(neighborhoods) as Neighborhood[];
export const conditionKeys = Object.keys(conditions) as Condition[];
