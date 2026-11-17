import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { router, useLocalSearchParams } from "expo-router";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { useMarket } from "../../data/provider";
import type { Draft, ListingInput } from "../../data/types";
import {
  Button,
  ErrorBox,
  Page,
  Panel,
  Row,
  Text,
  useTheme,
} from "../../ui/primitives";
import { useI18n } from "../../ui/i18n";
import { DetailsStep, PhotosStep, PriceStep, ReviewStep } from "./SellSteps";
import { listingSchema } from "./schema";
const defaults: ListingInput = {
  title: "",
  description: "",
  price: 0,
  category: "furniture",
  condition: "good",
  neighborhood: "dhanmondi",
  photos: [],
};
function SellForm({ editing }: { editing?: string }) {
  const market = useMarket();
  const { t, language } = useI18n();
  const c = useTheme();
  const [step, setStep] = useState(0);
  const [restorable, setRestorable] = useState<Draft>();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const draftId = editing ?? "new";
  const publishId = useRef(
    editing ?? `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  const published = useRef(false);
  const stepRef = useRef(0);
  stepRef.current = step;
  const {
    control,
    watch,
    getValues,
    reset,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<ListingInput>({
    resolver: zodResolver(listingSchema),
    defaultValues: defaults,
  });
  const values = watch();
  useEffect(() => {
    let alive = true;
    void (async () => {
      const draft = await market.draft(draftId);
      if (!alive) return;
      if (editing) {
        const listing = await market.listing(editing);
        if (
          !listing ||
          listing.sellerId !== market.identity ||
          listing.status !== "active"
        )
          throw new Error("unavailable");
        if (!alive) return;
        reset({
          ...listing,
          title: listing.title[language],
          description: listing.description[language],
        });
      }
      if (draft) setRestorable(draft);
      else setReady(true);
    })().catch(() => {
      if (alive) setError(true);
    });
    return () => {
      alive = false;
    };
  }, [draftId, editing, market, reset, language, loadAttempt]);
  useEffect(() => {
    if (!ready) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let dirty = false;
    let mounted = true;
    const persist = () => {
      if (published.current || !dirty) return;
      dirty = false;
      if (mounted) setSaving(true);
      void market
        .saveDraft({
          id: draftId,
          values: getValues(),
          step: stepRef.current,
          updatedAt: Date.now(),
        })
        .then(() => {
          if (mounted) {
            setError(false);
            setHasSaved(true);
          }
        })
        .catch(() => {
          if (mounted) setError(true);
        })
        .finally(() => {
          if (mounted) setSaving(false);
        });
    };
    const subscription = watch(() => {
      dirty = true;
      setSaving(true);
      if (timer) clearTimeout(timer);
      timer = setTimeout(persist, 400);
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (timer) clearTimeout(timer);
      persist();
    };
  }, [ready, watch, draftId, getValues, market]);
  const changeStep = async (next: number) => {
    setStep(next);
    try {
      await market.saveDraft({
        id: draftId,
        values: getValues(),
        step: next,
        updatedAt: Date.now(),
      });
      setHasSaved(true);
    } catch {
      setError(true);
    }
  };
  const next = async () => {
    const fields: (keyof ListingInput)[][] = [
      ["title", "description", "category", "condition"],
      ["photos"],
      ["price", "neighborhood"],
    ];
    if (await trigger(fields[step])) await changeStep(step + 1);
  };
  const publish = async () => {
    if (!(await trigger())) return;
    setBusy(true);
    setError(false);
    published.current = true;
    try {
      const listing = await market.publish(
        getValues(),
        publishId.current,
        !!editing,
      );
      router.replace(`/listing/${listing.id}?mode=demo`);
    } catch {
      published.current = false;
      setError(true);
    } finally {
      setBusy(false);
    }
  };
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Page>
        <View
          style={{ maxWidth: 760, width: "100%", alignSelf: "center", gap: 24 }}
        >
          <View style={{ gap: 8 }}>
            <Text variant="eyebrow" style={{ color: c.accent }}>
              {t("sell")}
            </Text>
            <Text accessibilityRole="header" variant="title">
              {t("sellTitle")}
            </Text>
            <Text muted>{t("sellBody")}</Text>
          </View>
          {restorable && (
            <Panel style={{ gap: 14 }}>
              <Text variant="heading">{t("draftFound")}</Text>
              <Row>
                <Button
                  title={t("restore")}
                  onPress={() => {
                    reset(restorable.values);
                    setStep(restorable.step);
                    setRestorable(undefined);
                    setHasSaved(true);
                    setReady(true);
                  }}
                />
                <Button
                  kind="ghost"
                  title={t("discard")}
                  onPress={() => {
                    void market
                      .discardDraft(draftId)
                      .then(() => {
                        setRestorable(undefined);
                        setReady(true);
                      })
                      .catch(() => setError(true));
                  }}
                />
              </Row>
            </Panel>
          )}
          {error && (
            <ErrorBox
              retry={() => {
                if (!ready) {
                  setError(false);
                  setLoadAttempt((value) => value + 1);
                  return;
                }
                void market
                  .saveDraft({
                    id: draftId,
                    values: getValues(),
                    step,
                    updatedAt: Date.now(),
                  })
                  .then(() => setError(false))
                  .catch(() => setError(true));
              }}
            />
          )}
          {ready && (
            <>
              <Row>
                {(["details", "photos", "priceArea", "review"] as const).map(
                  (name, i) => (
                    <View
                      key={name}
                      style={{
                        flex: 1,
                        minWidth: 90,
                        paddingVertical: 12,
                        borderTopWidth: 3,
                        borderColor: step >= i ? c.primary : c.line,
                      }}
                    >
                      <Text
                        variant="small"
                        style={{ color: step >= i ? c.primary : c.muted }}
                      >
                        {i + 1}. {t(name)}
                      </Text>
                    </View>
                  ),
                )}
              </Row>
              <Panel style={{ gap: 22 }}>
                {step === 0 && (
                  <DetailsStep
                    control={control}
                    values={values}
                    errors={errors}
                    setValue={setValue}
                  />
                )}
                {step === 1 && (
                  <PhotosStep
                    photos={values.photos}
                    onChange={(photos) =>
                      setValue("photos", photos, {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                    }
                    invalid={!!errors.photos}
                    busy={busy}
                    setBusy={setBusy}
                  />
                )}
                {step === 2 && (
                  <PriceStep
                    control={control}
                    values={values}
                    errors={errors}
                    setValue={setValue}
                  />
                )}
                {step === 3 && <ReviewStep values={values} />}
                <Row
                  style={{ justifyContent: "space-between", paddingTop: 12 }}
                >
                  {step > 0 ? (
                    <Button
                      title={t("back")}
                      kind="ghost"
                      disabled={busy}
                      onPress={() => {
                        void changeStep(step - 1);
                      }}
                    />
                  ) : (
                    <View />
                  )}
                  <Button
                    title={t(
                      step === 3 ? (editing ? "update" : "publish") : "next",
                    )}
                    busy={busy}
                    onPress={() => {
                      void (step === 3 ? publish() : next());
                    }}
                  />
                </Row>
              </Panel>
              <Text variant="small" muted style={{ textAlign: "center" }}>
                {saving
                  ? t("savingDraft")
                  : error
                    ? t("draftSaveFailed")
                    : t(hasSaved ? "draftSaved" : "draftLocal")}
              </Text>
            </>
          )}
        </View>
      </Page>
    </KeyboardAvoidingView>
  );
}
export default function SellScreen() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  return <SellForm key={edit ?? "new"} editing={edit} />;
}
