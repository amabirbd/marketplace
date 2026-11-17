import { z } from "zod";
export const listingSchema = z.object({
  title: z.string().trim().min(5, "titleError").max(80, "titleError"),
  description: z
    .string()
    .trim()
    .min(20, "descriptionError")
    .max(2000, "descriptionError"),
  price: z
    .number()
    .int("priceError")
    .min(0, "priceError")
    .max(10000000, "priceError"),
  category: z.enum([
    "furniture",
    "electronics",
    "books",
    "fashion",
    "sports",
    "home",
  ]),
  condition: z.enum(["like-new", "good", "fair"]),
  neighborhood: z.enum([
    "dhanmondi",
    "mirpur",
    "uttara",
    "mohammadpur",
    "banani",
    "gulshan",
    "bashundhara",
    "lalmatia",
  ]),
  photos: z
    .array(z.string().min(1))
    .min(1, "photosError")
    .max(6, "photosError"),
});
export const profileSchema = z.object({
  name: z.string().trim().min(2).max(60),
  bio: z.string().trim().max(240),
  neighborhood: listingSchema.shape.neighborhood,
  avatar: z.string().nullable(),
});
export const messageSchema = z.string().trim().min(1).max(2000);
