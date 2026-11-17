import { useState } from "react";
import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormSetValue,
} from "react-hook-form";
import { Pressable, View } from "react-native";
import type { ListingInput } from "../../data/types";
import {
  categories,
  categoryKeys,
  conditions,
  conditionKeys,
  neighborhoods,
  neighborhoodKeys,
} from "../../data/catalog";
import { Button, Chip, Field, Row, Text, useTheme } from "../../ui/primitives";
import { Photo, samplePhotos } from "../../ui/Photo";
import { priceLabel, useI18n } from "../../ui/i18n";
import { canPickPhoto, pickPhoto } from "../../platform/media";
type StepProps = {
  control: Control<ListingInput>;
  values: ListingInput;
  errors: FieldErrors<ListingInput>;
  setValue: UseFormSetValue<ListingInput>;
};

export function DetailsStep({ control, values, errors, setValue }: StepProps) {
  const { t, language } = useI18n();
  return (
    <>
      <Controller
        control={control}
        name="title"
        render={({ field }) => (
          <Field
            label={t("title")}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            maxLength={80}
            error={errors.title ? t("titleError") : undefined}
          />
        )}
      />
      <Controller
        control={control}
        name="description"
        render={({ field }) => (
          <Field
            label={t("description")}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            multiline
            maxLength={2000}
            error={errors.description ? t("descriptionError") : undefined}
          />
        )}
      />
      <Text variant="small">{t("category")}</Text>
      <Row>
        {categoryKeys.map((key) => (
          <Chip
            key={key}
            label={categories[key][language]}
            selected={values.category === key}
            onPress={() => setValue("category", key, { shouldDirty: true })}
          />
        ))}
      </Row>
      <Text variant="small">{t("condition")}</Text>
      <Row>
        {conditionKeys.map((key) => (
          <Chip
            key={key}
            label={conditions[key][language]}
            selected={values.condition === key}
            onPress={() => setValue("condition", key, { shouldDirty: true })}
          />
        ))}
      </Row>
    </>
  );
}

export function PhotosStep({
  photos,
  onChange,
  invalid,
  busy,
  setBusy,
}: {
  photos: string[];
  onChange(photos: string[]): void;
  invalid: boolean;
  busy: boolean;
  setBusy(value: boolean): void;
}) {
  const { t } = useI18n();
  const c = useTheme();
  const [showSamples, setShowSamples] = useState(false);
  const [error, setError] = useState(false);
  const add = (id: string) => {
    if (photos.length < 6) onChange([...photos, id]);
  };
  return (
    <>
      <Text variant="heading">{t("photos")}</Text>
      <Text muted>{t("photoHelp")}</Text>
      <Row>
        {photos.map((id, i) => (
          <View key={`${id}-${i}`} style={{ width: 130, gap: 4 }}>
            <Photo
              id={id}
              label={`${t("photos")} ${i + 1}`}
              style={{ aspectRatio: 1, borderRadius: 12 }}
            />
            <Button
              kind="ghost"
              title={`${t("removePhoto")} ${i + 1}`}
              onPress={() => onChange(photos.filter((_, index) => index !== i))}
            />
          </View>
        ))}
      </Row>
      {invalid && (
        <Text accessibilityRole="alert" style={{ color: c.danger }}>
          {t("photosError")}
        </Text>
      )}
      {error && (
        <Text accessibilityRole="alert" style={{ color: c.danger }}>
          {t("photoTypeError")}
        </Text>
      )}
      <Row>
        {canPickPhoto && (
          <Button
            title={t("addPhoto")}
            kind="secondary"
            disabled={photos.length >= 6}
            busy={busy}
            onPress={() => {
              setBusy(true);
              setError(false);
              void pickPhoto()
                .then((id) => {
                  if (id) add(id);
                })
                .catch(() => setError(true))
                .finally(() => setBusy(false));
            }}
          />
        )}
        <Button
          title={t("samplePhoto")}
          kind="secondary"
          disabled={photos.length >= 6}
          onPress={() => setShowSamples(!showSamples)}
        />
      </Row>
      {!canPickPhoto && (
        <Text variant="small" muted>
          {t("nativePhotoLater")}
        </Text>
      )}
      {showSamples && (
        <Row>
          {samplePhotos.map((id, i) => (
            <Pressable
              key={id}
              accessibilityRole="button"
              accessibilityLabel={`${t("samplePhoto")} ${i + 1}`}
              disabled={photos.length >= 6}
              onPress={() => {
                add(id);
                setShowSamples(false);
              }}
            >
              <Photo
                id={id}
                label={`${t("samplePhoto")} ${i + 1}`}
                style={{ width: 100, height: 100, borderRadius: 12 }}
              />
            </Pressable>
          ))}
        </Row>
      )}
    </>
  );
}

export function PriceStep({ control, values, errors, setValue }: StepProps) {
  const { t, language } = useI18n();
  return (
    <>
      <Controller
        control={control}
        name="price"
        render={({ field }) => (
          <Field
            label={t("price")}
            value={
              typeof field.value !== "number" || Number.isNaN(field.value)
                ? ""
                : String(field.value)
            }
            onChangeText={(value) =>
              field.onChange(value.trim() === "" ? NaN : Number(value))
            }
            onBlur={field.onBlur}
            keyboardType="numeric"
            error={errors.price ? t("priceError") : undefined}
          />
        )}
      />
      <Text variant="small">{t("neighborhood")}</Text>
      <Row>
        {neighborhoodKeys.map((key) => (
          <Chip
            key={key}
            label={neighborhoods[key][language]}
            selected={values.neighborhood === key}
            onPress={() => setValue("neighborhood", key, { shouldDirty: true })}
          />
        ))}
      </Row>
      <Text variant="small" muted>
        {t("approximate")}
      </Text>
    </>
  );
}

export function ReviewStep({ values }: { values: ListingInput }) {
  const { t, language } = useI18n();
  const c = useTheme();
  return (
    <>
      <Photo
        id={values.photos[0]}
        label={values.title}
        style={{ height: 300, borderRadius: 16 }}
      />
      <Text variant="heading">{values.title}</Text>
      <Text variant="price">{priceLabel(values.price, language)}</Text>
      <Text muted>{values.description}</Text>
      <Text variant="small">
        {neighborhoods[values.neighborhood][language]} ·{" "}
        {conditions[values.condition][language]}
      </Text>
      <Text variant="small" style={{ color: c.accent }}>
        {t("publishNote")}
      </Text>
    </>
  );
}
