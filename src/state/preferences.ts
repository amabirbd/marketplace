import { create } from "zustand";
import { readValue, writeValue } from "../platform/storage";
import type { Language } from "../data/types";
type Preferences = {
  language: Language;
  theme: "light" | "dark" | "system";
  setLanguage(value: Language): void;
  setTheme(value: Preferences["theme"]): void;
};
export const usePreferences = create<Preferences>((set) => ({
  language: "en",
  theme: "system",
  setLanguage: (language) => set({ language }),
  setTheme: (theme) => set({ theme }),
}));
let loaded = false;
export async function loadPreferences() {
  if (loaded) return;
  try {
    const value =
      await readValue<Pick<Preferences, "language" | "theme">>("preferences");
    if (
      value &&
      ["en", "bn"].includes(value.language) &&
      ["light", "dark", "system"].includes(value.theme)
    )
      usePreferences.setState(value);
  } catch {
    /* Preferences are optional; demo persistence errors are surfaced separately. */
  }
  loaded = true;
  usePreferences.subscribe(({ language, theme }) => {
    void writeValue("preferences", { language, theme }).catch(() => undefined);
  });
}
