import { router } from "expo-router";
import { Pressable, View } from "react-native";
import type { Listing } from "../../data/types";
import { neighborhoods, conditions } from "../../data/catalog";
import { useSaved } from "./queries";
import { Photo } from "../../ui/Photo";
import { Text, useTheme } from "../../ui/primitives";
import { priceLabel, useI18n } from "../../ui/i18n";
export function ListingCard({ listing }: { listing: Listing }) {
  const { language, t } = useI18n();
  const c = useTheme();
  const saved = useSaved();
  const isSaved = saved.ids.includes(listing.id);
  return (
    <View style={{ flex: 1, minWidth: 0, gap: 8 }}>
      <View style={{ position: "relative" }}>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={listing.title[language]}
          onPress={() => router.push(`/listing/${listing.id}?mode=demo`)}
        >
          <Photo
            id={listing.photos[0]}
            label={listing.title[language]}
            style={{ width: "100%", aspectRatio: 1.12, borderRadius: 16 }}
          />
        </Pressable>
        <Pressable
          testID={`save-${listing.id}`}
          accessibilityRole="button"
          accessibilityLabel={`${t(isSaved ? "unsave" : "save")}: ${listing.title[language]}`}
          aria-pressed={isSaved}
          accessibilityState={{
            selected: isSaved,
            disabled: saved.mutation.isPending,
          }}
          disabled={saved.mutation.isPending}
          onPress={() =>
            saved.mutation.mutate({ id: listing.id, value: !isSaved })
          }
          style={{
            position: "absolute",
            right: 10,
            top: 10,
            width: 44,
            height: 44,
            borderRadius: 24,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: c.surface,
          }}
        >
          <Text style={{ fontSize: 27, color: isSaved ? c.accent : c.text }}>
            {isSaved ? "♥" : "♡"}
          </Text>
        </Pressable>
      </View>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${listing.title[language]} ${priceLabel(listing.price, language)}`}
        onPress={() => router.push(`/listing/${listing.id}?mode=demo`)}
        style={{ gap: 4 }}
      >
        <Text variant="price">
          {listing.status === "removed"
            ? t("unavailable")
            : priceLabel(listing.price, language)}
        </Text>
        <Text style={{ fontSize: 15, fontWeight: "500" }}>
          {listing.title[language]}
        </Text>
        <Text variant="small" muted>
          {neighborhoods[listing.neighborhood][language]} ·{" "}
          {listing.status === "active"
            ? conditions[listing.condition][language]
            : t(listing.status === "sold" ? "sold" : "unavailable")}
        </Text>
      </Pressable>
      {saved.mutation.isError && (
        <Text
          accessibilityRole="alert"
          variant="small"
          style={{ color: c.danger }}
        >
          {t("error")}
        </Text>
      )}
    </View>
  );
}
