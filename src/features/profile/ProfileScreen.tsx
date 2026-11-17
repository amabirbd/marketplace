import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { View } from "react-native";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { demoControls, useMarket } from "../../data/provider";
import type { Profile } from "../../data/types";
import { neighborhoods, neighborhoodKeys } from "../../data/catalog";
import { profileSchema } from "../sell/schema";
import { useListings } from "../listings/queries";
import { usePreferences } from "../../state/preferences";
import {
  Button,
  Chip,
  Confirm,
  ErrorBox,
  Field,
  Page,
  Panel,
  Row,
  Skeleton,
  Text,
  useTheme,
} from "../../ui/primitives";
import { Photo } from "../../ui/Photo";
import { useI18n, type TextKey } from "../../ui/i18n";
import { canPickPhoto, pickPhoto } from "../../platform/media";
function Editor({ profile, done }: { profile: Profile; done(): void }) {
  const market = useMarket();
  const { t, language } = useI18n();
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Omit<Profile, "id">>({
    resolver: zodResolver(profileSchema),
    defaultValues: profile,
  });
  return (
    <Panel style={{ gap: 18 }}>
      <Controller
        control={control}
        name="name"
        render={({ field }) => (
          <Field
            label={t("name")}
            value={field.value}
            onChangeText={field.onChange}
            maxLength={60}
            error={errors.name ? t("error") : undefined}
          />
        )}
      />
      <Controller
        control={control}
        name="bio"
        render={({ field }) => (
          <Field
            label={t("bio")}
            value={field.value}
            onChangeText={field.onChange}
            maxLength={240}
            multiline
          />
        )}
      />
      <Row>
        {neighborhoodKeys.map((key) => (
          <Chip
            key={key}
            label={neighborhoods[key][language]}
            selected={watch("neighborhood") === key}
            onPress={() => setValue("neighborhood", key)}
          />
        ))}
      </Row>
      {canPickPhoto && (
        <Button
          kind="secondary"
          title={t("addPhoto")}
          onPress={() => {
            void pickPhoto()
              .then((id) => {
                if (id) setValue("avatar", id);
              })
              .catch(() => setError(true));
          }}
        />
      )}
      {error && <ErrorBox />}
      <Row>
        <Button title={t("cancel")} kind="ghost" onPress={done} />
        <Button
          title={t("update")}
          busy={busy}
          onPress={() => {
            void handleSubmit(async (input) => {
              setBusy(true);
              try {
                await market.updateProfile(input);
                done();
              } catch {
                setError(true);
              } finally {
                setBusy(false);
              }
            })();
          }}
        />
      </Row>
    </Panel>
  );
}
export default function ProfileScreen() {
  const market = useMarket();
  const { t, language } = useI18n();
  const c = useTheme();
  const preferences = usePreferences();
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState<TextKey>();
  const [error, setError] = useState(false);
  const query = useQuery({
    queryKey: ["demo", "profile", market.identity],
    queryFn: () => market.profile(market.identity),
    networkMode: "always",
  });
  const owned = useListings({ owned: true });
  return (
    <Page>
      <View style={{ gap: 8 }}>
        <Text variant="eyebrow" style={{ color: c.accent }}>
          {t("profile")}
        </Text>
        <Text accessibilityRole="header" variant="title">
          {t("settings")}
        </Text>
      </View>
      {query.isPending ? (
        <Skeleton />
      ) : query.isError ? (
        <ErrorBox
          retry={() => {
            void query.refetch();
          }}
        />
      ) : (
        query.data && (
          <Panel style={{ gap: 16 }}>
            <Row>
              {query.data.avatar ? (
                <Photo
                  id={query.data.avatar}
                  label={query.data.name}
                  style={{ width: 70, height: 70, borderRadius: 35 }}
                />
              ) : (
                <View
                  style={{
                    width: 70,
                    height: 70,
                    borderRadius: 35,
                    backgroundColor: c.soft,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text variant="heading" style={{ color: c.primary }}>
                    {query.data.name.slice(0, 1)}
                  </Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text variant="heading">{query.data.name}</Text>
                <Text muted>
                  {neighborhoods[query.data.neighborhood][language]}
                </Text>
              </View>
              <Button
                kind="secondary"
                title={t("editProfile")}
                onPress={() => setEditing(!editing)}
              />
            </Row>
            <Text muted>{query.data.bio}</Text>
            <Text variant="small" style={{ color: c.accent }}>
              {t("demoNote")}
            </Text>
          </Panel>
        )
      )}
      {editing && query.data && (
        <Editor profile={query.data} done={() => setEditing(false)} />
      )}
      <Panel style={{ gap: 16 }}>
        <Text variant="heading">{t("myListings")}</Text>
        {owned.isError && (
          <ErrorBox
            retry={() => {
              void owned.refetch();
            }}
          />
        )}
        {owned.data?.pages
          .flatMap((p) => p.items)
          .map((listing) => (
            <Row key={listing.id} style={{ justifyContent: "space-between" }}>
              <View style={{ flex: 1 }}>
                <Text>{listing.title[language]}</Text>
                <Text variant="small" muted>
                  {listing.status === "sold" ? t("sold") : t("localOnly")}
                </Text>
              </View>
              <Button
                title={t("details")}
                kind="ghost"
                onPress={() => router.push(`/listing/${listing.id}?mode=demo`)}
              />
            </Row>
          ))}
        {owned.hasNextPage && (
          <Button
            title={t("loadMore")}
            kind="secondary"
            onPress={() => {
              void owned.fetchNextPage();
            }}
          />
        )}
        <Button
          title={t("sell")}
          kind="secondary"
          onPress={() => router.push("/sell")}
        />
      </Panel>
      <Panel style={{ gap: 18 }}>
        <Text variant="heading">{t("theme")}</Text>
        <Row>
          {(["light", "dark", "system"] as const).map((theme) => (
            <Chip
              key={theme}
              label={t(theme)}
              selected={preferences.theme === theme}
              onPress={() => preferences.setTheme(theme)}
            />
          ))}
        </Row>
        <Text variant="heading">{t("language")}</Text>
        <Row>
          <Chip
            label="English"
            selected={language === "en"}
            onPress={() => preferences.setLanguage("en")}
          />
          <Chip
            label="বাংলা"
            selected={language === "bn"}
            onPress={() => preferences.setLanguage("bn")}
          />
        </Row>
      </Panel>
      <Panel style={{ gap: 16 }}>
        <Text variant="heading">{t("demoTools")}</Text>
        <Row>
          {(
            [
              { key: "save", label: "failSave" },
              { key: "send", label: "failSend" },
              { key: "ack", label: "loseAck" },
            ] as const
          ).map((action) => (
            <Button
              key={action.key}
              title={t(action.label)}
              kind="secondary"
              onPress={() => {
                demoControls.failNext(action.key);
                setNotice("armed");
              }}
            />
          ))}
          <Button
            title={t("simulateSold")}
            kind="secondary"
            onPress={() => {
              setError(false);
              void demoControls
                .simulateSold()
                .then(() => router.push("/notifications"))
                .catch(() => setError(true));
            }}
          />
        </Row>
        {notice && <Text accessibilityLiveRegion="polite">{t(notice)}</Text>}
        {error && <ErrorBox />}
        <Text variant="small" muted>
          {t("simulated")}
        </Text>
      </Panel>
      <Panel style={{ gap: 14 }}>
        <Text>{t("liveUnavailable")}</Text>
        <Row>
          <Confirm
            title={t("resetConfirm")}
            buttonTitle={t("resetDemo")}
            danger
            action={async () => {
              await demoControls.reset();
              router.replace("/explore");
            }}
          />
          <Button
            kind="ghost"
            title={t("exit")}
            onPress={() => router.replace("/")}
          />
        </Row>
      </Panel>
    </Page>
  );
}
