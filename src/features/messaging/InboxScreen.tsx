import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Pressable, View } from "react-native";
import { useMarket } from "../../data/provider";
import {
  Button,
  Empty,
  ErrorBox,
  Page,
  Row,
  Skeleton,
  Text,
  useTheme,
} from "../../ui/primitives";
import { useI18n } from "../../ui/i18n";
export default function InboxScreen() {
  const market = useMarket();
  const { t, language } = useI18n();
  const c = useTheme();
  const query = useQuery({
    queryKey: ["demo", market.identity, "inbox"],
    queryFn: () => market.inbox(),
    networkMode: "always",
  });
  return (
    <Page>
      <View style={{ gap: 8 }}>
        <Text variant="eyebrow" style={{ color: c.accent }}>
          {t("inbox")}
        </Text>
        <Text accessibilityRole="header" variant="title">
          {t("inboxTitle")}
        </Text>
        <Text muted>{t("inboxBody")}</Text>
      </View>
      <Text variant="small" muted>
        {t("chatNotice")}
      </Text>
      {query.isPending ? (
        <Skeleton />
      ) : query.isError ? (
        <ErrorBox
          retry={() => {
            void query.refetch();
          }}
        />
      ) : query.data?.length === 0 ? (
        <Empty title={t("empty")}>
          <Button title={t("browse")} onPress={() => router.push("/explore")} />
        </Empty>
      ) : (
        query.data?.map((chat) => (
          <Pressable
            key={chat.id}
            accessibilityRole="link"
            accessibilityLabel={`${chat.seller.name}: ${chat.title[language]}`}
            onPress={() => router.push(`/chat/${chat.id}`)}
            style={{
              padding: 24,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: c.line,
              backgroundColor: c.surface,
              gap: 8,
            }}
          >
            <Row style={{ justifyContent: "space-between" }}>
              <Text variant="heading">{chat.seller.name}</Text>
              {chat.unread > 0 && (
                <View
                  style={{
                    borderRadius: 15,
                    backgroundColor: c.primary,
                    paddingHorizontal: 12,
                    paddingVertical: 3,
                  }}
                >
                  <Text variant="small" style={{ color: c.onPrimary }}>
                    {chat.unread}
                  </Text>
                </View>
              )}
            </Row>
            <Text variant="small" style={{ color: c.accent }}>
              {chat.title[language]}
            </Text>
            <Text muted numberOfLines={2}>
              {chat.latest?.simulated ? `${t("simulated")} · ` : ""}
              {chat.latest?.body[language] ?? t("quickMessage")}
            </Text>
          </Pressable>
        ))
      )}
    </Page>
  );
}
