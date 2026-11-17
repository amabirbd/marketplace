import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Pressable } from "react-native";
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
export default function NotificationsScreen() {
  const market = useMarket();
  const { t, language } = useI18n();
  const c = useTheme();
  const [error, setError] = useState(false);
  const query = useQuery({
    queryKey: ["demo", market.identity, "notifications"],
    queryFn: () => market.notifications(),
    networkMode: "always",
  });
  return (
    <Page>
      <Row style={{ justifyContent: "space-between" }}>
        <Text accessibilityRole="header" variant="title">
          {t("notifications")}
        </Text>
        <Button
          title={t("markRead")}
          kind="ghost"
          onPress={() => {
            void market.readNotifications().catch(() => setError(true));
          }}
        />
      </Row>
      <Text muted>{t("notificationsBody")}</Text>
      {error && <ErrorBox />}
      {query.isPending ? (
        <Skeleton />
      ) : query.isError ? (
        <ErrorBox
          retry={() => {
            void query.refetch();
          }}
        />
      ) : query.data?.length === 0 ? (
        <Empty title={t("noNotifications")} />
      ) : (
        query.data?.map((notice) => (
          <Pressable
            key={notice.id}
            accessibilityRole="link"
            onPress={() =>
              router.push(
                notice.kind === "message"
                  ? `/chat/${notice.targetId}`
                  : `/listing/${notice.targetId}?mode=demo`,
              )
            }
            style={{
              backgroundColor: notice.read ? c.surface : c.soft,
              borderWidth: 1,
              borderColor: c.line,
              borderRadius: 16,
              padding: 24,
              gap: 8,
            }}
          >
            <Text>{notice.text[language]}</Text>
            <Text variant="small" style={{ color: c.accent }}>
              {notice.simulated ? t("simulated") : ""}
            </Text>
          </Pressable>
        ))
      )}
    </Page>
  );
}
