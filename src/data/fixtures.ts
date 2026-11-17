import type { Category, DemoState, Listing, Localized } from "./types.ts";
import { neighborhoodKeys } from "./catalog.ts";
export const VISITOR = "demo-visitor";
const products: {
  photo: string;
  category: Category;
  price: number;
  title: Localized;
  description: Localized;
}[] = [
  {
    photo: "chair",
    category: "furniture",
    price: 6500,
    title: { en: "Teak & cane reading chair", bn: "সেগুন কাঠ ও বেতের চেয়ার" },
    description: {
      en: "A lovely sunny-corner chair. Solid teak frame, freshly cleaned cane seat. A few small signs of use on the legs. Moving to a smaller flat, so it is ready for a new home.",
      bn: "রোদেলা কোণের জন্য সুন্দর চেয়ার। মজবুত সেগুন কাঠ ও পরিষ্কার বেতের আসন। পায়ায় ব্যবহারের সামান্য দাগ আছে। ছোট বাসায় যাচ্ছি, তাই বিক্রি করছি।",
    },
  },
  {
    photo: "headphones",
    category: "electronics",
    price: 3200,
    title: { en: "Wireless over-ear headphones", bn: "ওয়্যারলেস হেডফোন" },
    description: {
      en: "Comfortable wireless headphones with soft cushions. Charging cable included. Both sides work well; you are welcome to check before taking them home.",
      bn: "নরম কুশনসহ আরামদায়ক ওয়্যারলেস হেডফোন। চার্জিং কেবল আছে। দুই পাশই ভালো চলে, নেওয়ার আগে পরীক্ষা করতে পারেন।",
    },
  },
  {
    photo: "books",
    category: "books",
    price: 950,
    title: {
      en: "A little weekend reading bundle",
      bn: "অবসরের জন্য বইয়ের সেট",
    },
    description: {
      en: "Five well-loved novels for your next quiet weekend. Complete pages, a little wear on the covers. Selling together as a bundle.",
      bn: "শান্ত অবসরের জন্য পাঁচটি উপন্যাস। সব পৃষ্ঠা আছে, মলাটে সামান্য ব্যবহারের চিহ্ন। একসাথে বিক্রি হবে।",
    },
  },
  {
    photo: "lamp",
    category: "home",
    price: 1800,
    title: { en: "Cream mushroom table lamp", bn: "ক্রিম রঙের টেবিল ল্যাম্প" },
    description: {
      en: "A warm little light for your bedside or desk. Works perfectly; bulb included. Carefully packed for collection.",
      bn: "বিছানা বা ডেস্কের পাশে সুন্দর উষ্ণ আলো। ভালো চলে, বাল্বসহ। নেওয়ার জন্য যত্ন করে প্যাক করা হবে।",
    },
  },
  {
    photo: "bicycle",
    category: "sports",
    price: 12500,
    title: { en: "Teal city bicycle with basket", bn: "ঝুড়িসহ টিল রঙের সাইকেল" },
    description: {
      en: "An easy everyday ride with a handy front basket. Brakes serviced recently. Some wear on the saddle. Please inspect and try it before buying.",
      bn: "সামনের ঝুড়িসহ প্রতিদিন চলার সাইকেল। সম্প্রতি ব্রেক সারানো হয়েছে। সিটে ব্যবহারের চিহ্ন আছে। কেনার আগে দেখে চালিয়ে নিন।",
    },
  },
  {
    photo: "jacket",
    category: "fashion",
    price: 1200,
    title: { en: "Classic indigo denim jacket", bn: "ইন্ডিগো ডেনিম জ্যাকেট" },
    description: {
      en: "Relaxed medium fit, soft denim, all buttons intact. Freshly washed and ready to wear. Let me know if you need measurements.",
      bn: "মিডিয়াম সাইজ, নরম ডেনিম, সব বোতাম ঠিক আছে। ধোয়া ও পরার জন্য প্রস্তুত। মাপ জানতে চাইলে বলুন।",
    },
  },
];
export function seed(): DemoState {
  const base = Date.UTC(2026, 10, 17, 8);
  const profiles = [
    "Nadia Rahman",
    "Arif Hasan",
    "Meher Ahmed",
    "Rafi Islam",
    "Tania Karim",
    "Sami Chowdhury",
    "Farah Khan",
    "Imran Ali",
  ].map((name, i) => ({
    id: `seller-${i}`,
    name,
    neighborhood: neighborhoodKeys[i]!,
    bio: "Fictional LocalLoop neighbor.",
    avatar: null,
  }));
  profiles.push({
    id: VISITOR,
    name: "Alex · Demo visitor",
    neighborhood: "dhanmondi",
    bio: "Finding good things a little closer to home.",
    avatar: null,
  });
  const listings: Listing[] = Array.from({ length: 30 }, (_, i) => {
    const p = products[i % products.length]!;
    return {
      id: `fixture-${i + 1}`,
      sellerId: i === 29 ? VISITOR : `seller-${i % 8}`,
      title: p.title,
      description: p.description,
      category: p.category,
      price: i === 26 ? 0 : p.price + Math.floor(i / 6) * 150,
      condition: i % 5 === 0 ? "like-new" : i % 7 === 0 ? "fair" : "good",
      neighborhood: neighborhoodKeys[i % 8]!,
      photos: [`asset:${p.photo}`],
      status: "active",
      createdAt: base - i * 3600000,
    };
  });
  return {
    version: 1,
    profiles,
    listings,
    saved: [],
    drafts: {},
    notices: [],
    conversations: [
      {
        id: "sample-chat",
        listingId: "fixture-2",
        buyerId: VISITOR,
        sellerId: "seller-1",
        readAt: base,
      },
    ],
    messages: [
      {
        id: "sample-1",
        conversationId: "sample-chat",
        senderId: VISITOR,
        body: {
          en: "Hi! Does it come with a charging cable?",
          bn: "হ্যালো! চার্জিং কেবল আছে?",
        },
        createdAt: base - 120000,
        status: "sent",
        simulated: false,
      },
      {
        id: "sample-2",
        conversationId: "sample-chat",
        senderId: "seller-1",
        body: {
          en: "Yes, the cable is included. Happy to help!",
          bn: "হ্যাঁ, কেবল আছে। আর কিছু জানতে চাইলে বলুন!",
        },
        createdAt: base - 60000,
        status: "sent",
        simulated: true,
      },
    ],
  };
}
