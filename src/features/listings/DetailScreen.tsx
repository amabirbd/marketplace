import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Platform, Share, View, useWindowDimensions } from "react-native";
import * as Linking from "expo-linking";
import { useMarket } from "../../data/provider";
import { useListing, useSaved } from "./queries";
import { neighborhoods, conditions } from "../../data/catalog";
import {
  Button,
  Chip,
  Confirm,
  Empty,
  ErrorBox,
  Page,
  Panel,
  Row,
  Skeleton,
  Text,
  useTheme,
} from "../../ui/primitives";
import { Photo } from "../../ui/Photo";
import { priceLabel, useI18n } from "../../ui/i18n";
export default function DetailScreen() {
  const params = useLocalSearchParams<{ id: string; mode?: string }>();
  const id = params.id;
  const market = useMarket();
  const query = useListing(id);
  const saved = useSaved();
  const { t, language } = useI18n();
  const c = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 1050;
  const [photo, setPhoto] = useState(0);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const listing = query.data;
  const seller = useQuery({
    queryKey: ["demo", "profile", listing?.sellerId],
    queryFn: () => market.profile(listing!.sellerId),
    enabled: !!listing,
    networkMode: "always",
  });
  if (params.mode && params.mode !== "demo")
    return (
      <Page>
        <Empty title={t("liveUnavailable")}>
          <Button
            title={t("exploreDemo")}
            onPress={() => router.replace("/explore")}
          />
        </Empty>
      </Page>
    );
  if (query.isPending)
    return (
      <Page>
        <Skeleton />
      </Page>
    );
  if (query.isError)
    return (
      <Page>
        <ErrorBox
          retry={() => {
            void query.refetch();
          }}
        />
      </Page>
    );
  if (!listing || listing.status === "removed")
    return (
      <Page>
        <Empty title={t("unavailable")} body={t("localOnly")}>
          <Button
            title={t("browse")}
            onPress={() => router.replace("/explore")}
          />
        </Empty>
      </Page>
    );
  const own = listing.sellerId === market.identity;
  const share = async () => {
    try {
      const url =
        Platform.OS === "web"
          ? `${window.location.origin}/listing/${id}?mode=demo`
          : Linking.createURL(`listing/${id}`, {
              queryParams: { mode: "demo" },
            });
      if (Platform.OS === "web" && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
      } else await Share.share({ message: url });
    } catch {
      setError(true);
    }
  };
  return (
    <Page>
      <Row style={{ justifyContent: "space-between" }}>
        <Button
          kind="ghost"
          title={`← ${t("back")}`}
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/explore")
          }
        />
        {!listing.localOnly && (
          <Button
            kind="ghost"
            title={t(copied ? "copied" : "share")}
            onPress={() => {
              void share();
            }}
          />
        )}
      </Row>
      <View
        style={{
          flexDirection: isWide ? "row" : "column",
          gap: isWide ? 36 : 24,
        }}
      >
        <View style={{ flex: isWide ? 1.2 : undefined, gap: 12 }}>
          <Photo
            id={listing.photos[photo] ?? listing.photos[0]}
            label={listing.title[language]}
            style={{ width: "100%", aspectRatio: 1, borderRadius: 22 }}
          />
          {listing.photos.length > 1 && (
            <Row>
              {listing.photos.map((p, i) => (
                <Chip
                  key={`${p}-${i}`}
                  label={`${t("photos")} ${i + 1}`}
                  selected={photo === i}
                  onPress={() => setPhoto(i)}
                />
              ))}
            </Row>
          )}
        </View>
        <View style={{ flex: isWide ? 1 : undefined, gap: 22 }}>
          <Row>
            <Chip
              label={conditions[listing.condition][language]}
              onPress={() => {}}
            />
            {listing.status === "sold" && (
              <Text style={{ color: c.accent }}>{t("sold")}</Text>
            )}
          </Row>
          <View style={{ gap: 10 }}>
            <Text accessibilityRole="header" variant="title">
              {listing.title[language]}
            </Text>
            <Text
              variant="price"
              style={{ fontSize: 34, lineHeight: 44, color: c.primary }}
            >
              {priceLabel(listing.price, language)}
            </Text>
            <Text muted>
              {neighborhoods[listing.neighborhood][language]}, Dhaka
            </Text>
          </View>
          {listing.localOnly && (
            <Text variant="small" style={{ color: c.accent }}>
              {t("localOnly")}
            </Text>
          )}
          <Row>
            <Button
              title={t(saved.ids.includes(id) ? "unsave" : "save")}
              kind="secondary"
              busy={saved.mutation.isPending}
              onPress={() =>
                saved.mutation.mutate({ id, value: !saved.ids.includes(id) })
              }
            />
            {!own && (
              <Button
                title={t("messageSeller")}
                disabled={listing.status !== "active"}
                busy={busy}
                onPress={() => {
                  setBusy(true);
                  setError(false);
                  void market
                    .conversation(id)
                    .then((chatId) => router.push(`/chat/${chatId}`))
                    .catch(() => setError(true))
                    .finally(() => setBusy(false));
                }}
              />
            )}
          </Row>
          {(error || saved.mutation.isError) && <ErrorBox />}
          <View
            style={{
              gap: 12,
              paddingTop: 20,
              borderTopWidth: 1,
              borderColor: c.line,
            }}
          >
            <Text variant="heading">{t("aboutItem")}</Text>
            <Text muted>{listing.description[language]}</Text>
          </View>
          <Panel style={{ gap: 8 }}>
            <Text variant="eyebrow">{t("seller")}</Text>
            {seller.isError ? (
              <ErrorBox
                retry={() => {
                  void seller.refetch();
                }}
              />
            ) : (
              <>
                <Text variant="heading">{seller.data?.name ?? "…"}</Text>
                <Text variant="small" muted>
                  {t("fictional")}
                </Text>
              </>
            )}
            <Text variant="small" muted>
              {t("approximate")}
            </Text>
          </Panel>
          {own && (
            <Panel style={{ gap: 12 }}>
              <Text variant="heading">{t("ownListing")}</Text>
              <Row>
                {listing.status === "active" && (
                  <>
                    <Button
                      title={t("edit")}
                      kind="secondary"
                      onPress={() => router.push(`/sell?edit=${id}`)}
                    />
                    <Button
                      title={t("markSold")}
                      kind="secondary"
                      onPress={() => {
                        void market
                          .changeStatus(id, "sold")
                          .catch(() => setError(true));
                      }}
                    />
                  </>
                )}
                <Confirm
                  title={t("confirmDelete")}
                  buttonTitle={t("remove")}
                  danger
                  action={async () => {
                    await market.changeStatus(id, "removed");
                    router.replace("/profile");
                  }}
                />
              </Row>
            </Panel>
          )}
        </View>
      </View>
    </Page>
  );
}
