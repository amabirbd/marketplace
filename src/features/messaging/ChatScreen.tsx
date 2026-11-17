import { useEffect, useRef, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { demoControls, useMarket } from "../../data/provider";
import {
  Button,
  Chip,
  ErrorBox,
  Field,
  Row,
  Text,
  useTheme,
} from "../../ui/primitives";
import { useI18n } from "../../ui/i18n";
export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const market = useMarket();
  const { t, language } = useI18n();
  const c = useTheme();
  const [text, setText] = useState("");
  const [error, setError] = useState(false);
  const [sending, setSending] = useState(false);
  const scroll = useRef<ScrollView>(null);
  const inbox = useQuery({
    queryKey: ["demo", market.identity, "inbox"],
    queryFn: () => market.inbox(),
    networkMode: "always",
  });
  const conversation = inbox.data?.find((chat) => chat.id === id);
  const query = useInfiniteQuery({
    queryKey: ["demo", market.identity, "messages", id],
    queryFn: ({ pageParam }) => market.messages(id, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.next,
    networkMode: "always",
  });
  const messages = [
    ...new Map(
      (
        query.data?.pages
          .slice()
          .reverse()
          .flatMap((p) => p.items) ?? []
      ).map((m) => [m.id, m]),
    ).values(),
  ];
  useEffect(() => {
    demoControls.setActiveConversation(id);
    void market.markRead(id).catch(() => setError(true));
    return () => demoControls.setActiveConversation(undefined);
  }, [id, market]);
  const attempt = useRef<{ body: string; id: string } | undefined>(undefined);
  const send = async (body: string, retryId?: string) => {
    if (!body.trim() || sending) return;
    const messageId =
      retryId ??
      (attempt.current?.body === body
        ? attempt.current.id
        : `message-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    attempt.current = { body, id: messageId };
    setSending(true);
    setError(false);
    try {
      await market.send(id, messageId, body);
      attempt.current = undefined;
      setText("");
    } catch {
      setError(true);
    } finally {
      setSending(false);
    }
  };
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        style={{
          flex: 1,
          width: "100%",
          maxWidth: 900,
          alignSelf: "center",
          padding: 20,
          gap: 16,
        }}
      >
        <Row>
          <Button
            title={`← ${t("inbox")}`}
            kind="ghost"
            onPress={() => router.replace("/inbox")}
          />
          <View style={{ flex: 1 }}>
            <Text accessibilityRole="header" variant="heading">
              {conversation?.seller.name ?? "…"}
            </Text>
            <Text variant="small" muted>
              {conversation?.title[language]}
            </Text>
          </View>
        </Row>
        <View
          style={{ padding: 12, backgroundColor: c.soft, borderRadius: 12 }}
        >
          <Text variant="small" muted>
            {t("chatNotice")}
          </Text>
        </View>
        <ScrollView
          ref={scroll}
          contentContainerStyle={{ gap: 16, paddingBottom: 12 }}
          onContentSizeChange={() => {
            if (
              !query.isFetchingNextPage &&
              (query.data?.pages.length ?? 0) <= 1
            )
              scroll.current?.scrollToEnd({ animated: false });
          }}
        >
          {query.hasNextPage && (
            <Button
              title={t("older")}
              kind="ghost"
              busy={query.isFetchingNextPage}
              onPress={() => {
                void query.fetchNextPage();
              }}
            />
          )}
          {query.isError && (
            <ErrorBox
              retry={() => {
                void query.refetch();
              }}
            />
          )}
          {messages.map((message) => {
            const own = message.senderId === market.identity;
            return (
              <View
                key={message.id}
                style={{
                  alignSelf: own ? "flex-end" : "flex-start",
                  maxWidth: "88%",
                  padding: 16,
                  gap: 6,
                  borderRadius: 18,
                  borderBottomRightRadius: own ? 4 : 18,
                  borderBottomLeftRadius: own ? 18 : 4,
                  backgroundColor: own ? c.primary : c.surface,
                  borderWidth: own ? 0 : 1,
                  borderColor: c.line,
                }}
              >
                <Text style={{ color: own ? c.onPrimary : c.text }}>
                  {message.body[language]}
                </Text>
                <Text
                  variant="small"
                  style={{ color: own ? c.onPrimary : c.muted }}
                >
                  {message.simulated
                    ? t("simulated")
                    : t(
                        message.status === "pending"
                          ? "pending"
                          : message.status === "failed"
                            ? "failed"
                            : "sent",
                      )}
                </Text>
                {message.status === "failed" && (
                  <Button
                    title={t("retry")}
                    kind="secondary"
                    busy={sending}
                    onPress={() => {
                      void send(message.body.en, message.id);
                    }}
                  />
                )}
              </View>
            );
          })}
          {!messages.length && (
            <Chip
              label={t("quickMessage")}
              onPress={() => setText(t("quickMessage"))}
            />
          )}
        </ScrollView>
        {error && <ErrorBox />}
        {conversation?.removed ? (
          <Text muted>{t("readOnly")}</Text>
        ) : (
          <Row style={{ alignItems: "flex-end", flexWrap: "nowrap" }}>
            <View style={{ flex: 1 }}>
              <Field
                label={t("message")}
                placeholder={t("message")}
                value={text}
                maxLength={2000}
                onChangeText={setText}
                onSubmitEditing={() => {
                  void send(text);
                }}
              />
            </View>
            <Button
              title={t("send")}
              disabled={!text.trim()}
              busy={sending}
              onPress={() => {
                void send(text);
              }}
            />
          </Row>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
