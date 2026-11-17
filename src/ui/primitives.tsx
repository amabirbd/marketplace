import { useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text as RNText,
  TextInput,
  View,
  useColorScheme,
  type TextProps,
  type ViewProps,
  type TextInputProps,
} from "react-native";
import { usePreferences } from "../state/preferences";
import { useI18n } from "./i18n";
export const light = {
  bg: "#F7F6F1",
  surface: "#FFFFFF",
  text: "#202E2B",
  muted: "#62706A",
  primary: "#165B4C",
  onPrimary: "#FFFFFF",
  line: "#DEDED5",
  soft: "#E6EEE8",
  accent: "#934A32",
  danger: "#AA3030",
};
export const dark = {
  bg: "#171F1D",
  surface: "#222E2A",
  text: "#F2F3ED",
  muted: "#B4C2BB",
  primary: "#A9D9C1",
  onPrimary: "#153E32",
  line: "#40524A",
  soft: "#30473D",
  accent: "#EAAF96",
  danger: "#FFB4AA",
};
export function useTheme() {
  const selected = usePreferences((s) => s.theme);
  const system = useColorScheme();
  return selected === "dark" || (selected === "system" && system === "dark")
    ? dark
    : light;
}
export function Text({
  variant = "body",
  muted,
  style,
  ...props
}: TextProps & {
  variant?: "body" | "small" | "title" | "heading" | "price" | "eyebrow";
  muted?: boolean;
}) {
  const c = useTheme();
  const variants = {
    body: { fontSize: 16, lineHeight: 25 },
    small: { fontSize: 13, lineHeight: 20 },
    title: {
      fontSize: 38,
      lineHeight: 46,
      fontWeight: "700" as const,
      letterSpacing: -1.1,
    },
    heading: {
      fontSize: 22,
      lineHeight: 30,
      fontWeight: "600" as const,
      letterSpacing: -0.3,
    },
    price: { fontSize: 24, lineHeight: 32, fontWeight: "700" as const },
    eyebrow: {
      fontSize: 11,
      lineHeight: 18,
      fontWeight: "700" as const,
      letterSpacing: 1.6,
    },
  };
  return (
    <RNText
      {...props}
      style={[{ color: muted ? c.muted : c.text }, variants[variant], style]}
    />
  );
}
export function Button({
  title,
  onPress,
  kind = "primary",
  disabled,
  busy,
  testID,
}: {
  title: string;
  onPress(): void;
  kind?: "primary" | "secondary" | "ghost" | "danger";
  disabled?: boolean;
  busy?: boolean;
  testID?: string;
}) {
  const c = useTheme();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || busy, busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 46,
        paddingHorizontal: 18,
        paddingVertical: 11,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 8,
        backgroundColor:
          kind === "primary"
            ? c.primary
            : kind === "secondary"
              ? c.soft
              : "transparent",
        borderWidth: kind === "danger" ? 1 : 0,
        borderColor: c.danger,
        opacity: disabled || busy ? 0.5 : pressed ? 0.75 : 1,
      })}
    >
      {busy && (
        <ActivityIndicator
          color={kind === "primary" ? c.onPrimary : c.primary}
        />
      )}
      <Text
        style={{
          fontSize: 14,
          fontWeight: "600",
          color:
            kind === "primary"
              ? c.onPrimary
              : kind === "danger"
                ? c.danger
                : c.text,
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress(): void;
}) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      aria-pressed={selected}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        minHeight: 44,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 30,
        backgroundColor: selected ? c.primary : c.surface,
        borderColor: selected ? c.primary : c.line,
        borderWidth: 1,
        justifyContent: "center",
      }}
    >
      <Text
        variant="small"
        style={{ color: selected ? c.onPrimary : c.text, fontWeight: "600" }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
export function Panel({ style, ...props }: ViewProps) {
  const c = useTheme();
  return (
    <View
      {...props}
      style={[
        {
          padding: 24,
          borderWidth: 1,
          borderColor: c.line,
          borderRadius: 20,
          backgroundColor: c.surface,
        },
        style,
      ]}
    />
  );
}
export function Row({ children, style }: ViewProps) {
  return (
    <View
      style={[
        {
          flexDirection: "row",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
export function Field({
  label,
  error,
  style,
  ...props
}: TextInputProps & { label: string; error?: string }) {
  const c = useTheme();
  return (
    <View style={{ gap: 6, flexShrink: 1 }}>
      <Text variant="small" style={{ fontWeight: "600" }}>
        {label}
      </Text>
      <TextInput
        {...props}
        accessibilityLabel={label}
        placeholderTextColor={c.muted}
        style={[
          {
            minHeight: 48,
            borderWidth: 1,
            borderColor: error ? c.danger : c.line,
            borderRadius: 12,
            padding: 13,
            fontSize: 16,
            color: c.text,
            backgroundColor: c.surface,
          },
          props.multiline && { minHeight: 120, textAlignVertical: "top" },
          style,
        ]}
      />
      {error && (
        <Text
          accessibilityRole="alert"
          variant="small"
          style={{ color: c.danger }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}
export function ErrorBox({
  retry,
  message,
}: {
  retry?: () => void;
  message?: string;
}) {
  const { t } = useI18n();
  const c = useTheme();
  return (
    <Panel style={{ gap: 10, borderColor: c.danger }}>
      <Text accessibilityRole="alert">{message ?? t("error")}</Text>
      {retry && <Button kind="secondary" title={t("retry")} onPress={retry} />}
    </Panel>
  );
}
export function Empty({
  title,
  body,
  children,
}: {
  title: string;
  body?: string;
  children?: ReactNode;
}) {
  return (
    <Panel style={{ paddingVertical: 48, gap: 12, alignItems: "center" }}>
      <Text variant="heading" style={{ textAlign: "center" }}>
        {title}
      </Text>
      {body && (
        <Text muted style={{ textAlign: "center", maxWidth: 420 }}>
          {body}
        </Text>
      )}
      {children}
    </Panel>
  );
}
export function Skeleton() {
  const c = useTheme();
  const { t } = useI18n();
  return (
    <View
      accessibilityLabel={t("loading")}
      accessibilityRole="progressbar"
      style={{ gap: 16 }}
    >
      <View
        style={{ height: 220, backgroundColor: c.soft, borderRadius: 16 }}
      />
      <View
        style={{
          width: "65%",
          height: 22,
          backgroundColor: c.soft,
          borderRadius: 8,
        }}
      />
    </View>
  );
}
export function Confirm({
  title,
  action,
  buttonTitle,
  danger,
}: {
  title: string;
  action(): Promise<void>;
  buttonTitle: string;
  danger?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const { t } = useI18n();
  return (
    <>
      <Button
        kind={danger ? "danger" : "secondary"}
        title={buttonTitle}
        onPress={() => setOpen(true)}
      />
      <Modal
        visible={open}
        transparent
        animationType="none"
        onRequestClose={() => setOpen(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#0008",
            padding: 24,
          }}
        >
          <Panel style={{ maxWidth: 460, width: "100%", gap: 20 }}>
            <Text variant="heading">{title}</Text>
            {error && <ErrorBox />}
            <Row>
              <Button
                title={t("cancel")}
                kind="ghost"
                disabled={busy}
                onPress={() => setOpen(false)}
              />
              <Button
                title={t("confirm")}
                busy={busy}
                onPress={() => {
                  setBusy(true);
                  setError(false);
                  void action()
                    .then(() => setOpen(false))
                    .catch(() => setError(true))
                    .finally(() => setBusy(false));
                }}
              />
            </Row>
          </Panel>
        </View>
      </Modal>
    </>
  );
}
export function Page({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      contentContainerStyle={{
        padding: 24,
        paddingBottom: 44,
        gap: 24,
        width: "100%",
        maxWidth: 1240,
        alignSelf: "center",
      }}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}
