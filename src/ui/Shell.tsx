import { Slot, router, usePathname } from "expo-router";
import { Pressable, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useMarket } from "../data/provider";
import { Row, Text, useTheme } from "./primitives";
import { Icon } from "./Icon";
import { useOffline } from "../platform/useOffline";
import { useI18n, type TextKey } from "./i18n";
const tabs: {
  path: "/explore" | "/saved" | "/sell" | "/inbox" | "/profile";
  label: TextKey;
  icon: string;
}[] = [
  { path: "/explore", label: "explore", icon: "⌕" },
  { path: "/saved", label: "saved", icon: "♡" },
  { path: "/sell", label: "sell", icon: "+" },
  { path: "/inbox", label: "inbox", icon: "☏" },
  { path: "/profile", label: "profile", icon: "○" },
];
export function Shell() {
  const { width } = useWindowDimensions();
  const desktop = width >= 1000;
  const c = useTheme();
  const { t } = useI18n();
  const path = usePathname();
  const market = useMarket();
  const inbox = useQuery({
    queryKey: ["demo", market.identity, "inbox"],
    queryFn: () => market.inbox(),
    networkMode: "always",
  });
  const notices = useQuery({
    queryKey: ["demo", market.identity, "notifications"],
    queryFn: () => market.notifications(),
    networkMode: "always",
  });
  const offline = useOffline();
  const unread = inbox.data?.reduce((n, x) => n + x.unread, 0) ?? 0;
  const navigation = tabs.map((tab) => {
    const active =
      path.startsWith(tab.path) ||
      (tab.path === "/inbox" && path.startsWith("/chat"));
    return (
      <Pressable
        key={tab.path}
        accessibilityRole="tab"
        accessibilityLabel={t(tab.label)}
        aria-selected={active}
        accessibilityState={{ selected: active }}
        onPress={() => router.navigate(tab.path)}
        style={{
          minHeight: 56,
          flex: desktop ? undefined : 1,
          flexDirection: desktop ? "row" : "column",
          alignItems: "center",
          justifyContent: desktop ? "flex-start" : "center",
          gap: desktop ? 14 : 2,
          paddingHorizontal: desktop ? 16 : 2,
          paddingVertical: 8,
          borderRadius: 12,
          backgroundColor: active ? c.soft : "transparent",
        }}
      >
        <Icon
          name={tab.label as "explore" | "saved" | "sell" | "inbox" | "profile"}
          color={active ? c.primary : c.muted}
        />
        <Text
          variant="small"
          style={{
            fontWeight: active ? "700" : "500",
            color: active ? c.primary : c.muted,
          }}
        >
          {t(tab.label)}
          {tab.label === "inbox" && unread > 0 ? ` (${unread})` : ""}
        </Text>
      </Pressable>
    );
  });
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: c.bg }}
      edges={["top", "bottom"]}
    >
      <View style={{ flex: 1, flexDirection: "row" }}>
        {desktop && (
          <View
            style={{
              width: 218,
              padding: 24,
              borderRightWidth: 1,
              borderColor: c.line,
              backgroundColor: c.surface,
              gap: 30,
            }}
          >
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="LocalLoop"
              onPress={() => router.push("/explore")}
            >
              <Text variant="heading" style={{ color: c.primary }}>
                ◎ LocalLoop
              </Text>
            </Pressable>
            <View style={{ gap: 8 }}>{navigation}</View>
            <View style={{ flex: 1 }} />
            <Text variant="small" muted>
              {t("privacy")}
            </Text>
            <Text variant="eyebrow" style={{ color: c.accent }}>
              DHAKA, BANGLADESH
            </Text>
          </View>
        )}
        <View style={{ flex: 1, minWidth: 0 }}>
          <View
            style={{
              paddingHorizontal: desktop ? 32 : 20,
              paddingVertical: 10,
              borderBottomWidth: 1,
              borderColor: c.line,
              backgroundColor: c.surface,
            }}
          >
            <Row
              style={{ justifyContent: "space-between", flexWrap: "nowrap" }}
            >
              <Row>
                <Text
                  variant={desktop ? "small" : "heading"}
                  style={{ fontWeight: "700", color: c.primary }}
                >
                  {desktop ? "◎ DHAKA" : "◎ LocalLoop"}
                </Text>
                <View
                  style={{
                    backgroundColor: c.soft,
                    borderRadius: 6,
                    paddingHorizontal: 9,
                    paddingVertical: 4,
                  }}
                >
                  <Text
                    variant="small"
                    style={{ color: c.primary, fontWeight: "600" }}
                  >
                    {t("demo")}
                  </Text>
                </View>
              </Row>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("notifications")}
                onPress={() => router.push("/notifications")}
                style={{
                  minWidth: 44,
                  minHeight: 44,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="bell" color={c.primary} />
                {notices.data?.some((n) => !n.read) && (
                  <View
                    style={{
                      position: "absolute",
                      top: 5,
                      right: 7,
                      width: 7,
                      height: 7,
                      borderRadius: 4,
                      backgroundColor: c.accent,
                    }}
                  />
                )}
              </Pressable>
            </Row>
          </View>
          {offline && (
            <View
              style={{
                paddingHorizontal: 20,
                paddingVertical: 8,
                backgroundColor: c.soft,
              }}
            >
              <Text accessibilityLiveRegion="polite" variant="small">
                {t("offline")}
              </Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Slot />
          </View>
          {!desktop && (
            <View
              style={{
                flexDirection: "row",
                paddingHorizontal: 6,
                paddingTop: 6,
                borderTopWidth: 1,
                borderColor: c.line,
                backgroundColor: c.surface,
              }}
            >
              {navigation}
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
