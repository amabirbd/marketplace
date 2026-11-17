import { useState } from "react";
import { router } from "expo-router";
import { ScrollView, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Panel, Row, Text, useTheme } from "../src/ui/primitives";
import { Photo } from "../src/ui/Photo";
import { useI18n } from "../src/ui/i18n";
import { usePreferences } from "../src/state/preferences";
export default function Welcome() {
  const c = useTheme();
  const { t, language } = useI18n();
  const { width } = useWindowDimensions();
  const wide = width > 800;
  const [live, setLive] = useState(false);
  const setLanguage = usePreferences((s) => s.setLanguage);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView
        contentContainerStyle={{
          padding: wide ? 48 : 24,
          maxWidth: 1360,
          width: "100%",
          alignSelf: "center",
          gap: 40,
        }}
      >
        <Row style={{ justifyContent: "space-between" }}>
          <Text variant="heading" style={{ color: c.primary }}>
            ◎ LocalLoop
          </Text>
          <Button
            kind="ghost"
            title={language === "en" ? "বাংলা" : "English"}
            onPress={() => setLanguage(language === "en" ? "bn" : "en")}
          />
        </Row>
        <View
          style={{
            flexDirection: wide ? "row" : "column",
            gap: wide ? 72 : 30,
            alignItems: wide ? "center" : "stretch",
            paddingVertical: wide ? 40 : 0,
          }}
        >
          <View style={{ flex: 1, gap: 24 }}>
            <Text variant="eyebrow" style={{ color: c.accent }}>
              {t("welcomeEyebrow")}
            </Text>
            <Text
              accessibilityRole="header"
              style={{
                fontSize: wide ? 76 : 52,
                lineHeight: wide ? 84 : 60,
                letterSpacing: -2.5,
                fontWeight: "700",
                color: c.primary,
              }}
            >
              {t("heroTitle")}
            </Text>
            <Text muted style={{ fontSize: 18, lineHeight: 30, maxWidth: 440 }}>
              {t("heroBody")}
            </Text>
            <View style={{ gap: 12, alignItems: "flex-start", marginTop: 10 }}>
              <Button
                title={`${t("exploreDemo")} →`}
                onPress={() => router.push("/explore")}
              />
              <Text variant="small" muted>
                {t("noSignup")}
              </Text>
              <Button
                kind="ghost"
                title={t("live")}
                onPress={() => setLive(!live)}
              />
            </View>
            {live && (
              <Panel>
                <Text>{t("liveUnavailable")}</Text>
              </Panel>
            )}
          </View>
          <View style={{ flex: wide ? 1 : undefined, gap: 12 }}>
            <Photo
              id="asset:chair"
              label="Teak and cane reading chair"
              style={{ width: "100%", aspectRatio: 1, borderRadius: 28 }}
            />
            <Row style={{ justifyContent: "space-between" }}>
              <Text variant="small" muted>
                {language === "en"
                  ? "A new home for a favorite corner."
                  : "প্রিয় কোণের জন্য নতুন ঠিকানা।"}
              </Text>
              <Text variant="small" style={{ color: c.accent }}>
                DHANMONDI ↗
              </Text>
            </Row>
          </View>
        </View>
        <Row
          style={{
            paddingVertical: 20,
            borderTopWidth: 1,
            borderColor: c.line,
            justifyContent: "space-between",
          }}
        >
          {[t("demoNote"), t("privacy")].map((text) => (
            <Text key={text} variant="small" muted>
              {text}
            </Text>
          ))}
        </Row>
      </ScrollView>
    </SafeAreaView>
  );
}
