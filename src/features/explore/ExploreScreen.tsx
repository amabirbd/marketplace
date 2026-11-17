import { useEffect, useState } from "react";
import { FlatList, ScrollView, View, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { useListings } from "../listings/queries";
import { ListingCard } from "../listings/ListingCard";
import {
  categories,
  categoryKeys,
  conditions,
  conditionKeys,
  neighborhoods,
  neighborhoodKeys,
} from "../../data/catalog";
import type { Filters } from "../../data/types";
import {
  Button,
  Chip,
  Empty,
  ErrorBox,
  Field,
  Panel,
  Row,
  Skeleton,
  Text,
  useTheme,
} from "../../ui/primitives";
import { useI18n } from "../../ui/i18n";
export function ExploreScreen({ saved = false }: { saved?: boolean }) {
  const { t, language } = useI18n();
  const c = useTheme();
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width >= 1000 ? width - 218 : width, 1240);
  const columns = contentWidth >= 1050 ? 4 : contentWidth >= 700 ? 3 : 2;
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [filters, setFilters] = useState<Filters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(timer);
  }, [search]);
  const invalid =
    (min !== "" && (!/^\d+$/.test(min) || +min > 10000000)) ||
    (max !== "" && (!/^\d+$/.test(max) || +max > 10000000)) ||
    (min !== "" && max !== "" && +min > +max);
  const query = useListings({
    ...filters,
    saved,
    search: debounced,
    min: invalid || min === "" ? undefined : +min,
    max: invalid || max === "" ? undefined : +max,
  });
  const items = [
    ...new Map(
      (query.data?.pages.flatMap((p) => p.items) ?? []).map((l) => [l.id, l]),
    ).values(),
  ];
  const header = (
    <View style={{ gap: 24, paddingBottom: 24 }}>
      <View style={{ gap: 6 }}>
        <Text variant="eyebrow" style={{ color: c.accent }}>
          {t(saved ? "saved" : "neighborhoodEdit")}
        </Text>
        <Text
          accessibilityRole="header"
          variant="title"
          style={width < 500 ? { fontSize: 32, lineHeight: 40 } : undefined}
        >
          {t(saved ? "savedTitle" : "findTitle")}
        </Text>
        <Text muted>{t(saved ? "savedBody" : "findSubtitle")}</Text>
      </View>
      {!saved && (
        <>
          <View
            style={{ flexDirection: "row", alignItems: "flex-end", gap: 12 }}
          >
            <View style={{ flex: 1 }}>
              <Field
                label={t("searchLabel")}
                placeholder={t("search")}
                value={search}
                onChangeText={setSearch}
              />
            </View>
            <Button
              kind="secondary"
              title={t("filters")}
              onPress={() => setShowFilters(!showFilters)}
            />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Row style={{ flexWrap: "nowrap" }}>
              {[
                { key: undefined, label: t("all") },
                ...categoryKeys.map((key) => ({
                  key,
                  label: categories[key][language],
                })),
              ].map((item) => (
                <Chip
                  key={item.key ?? "all"}
                  label={item.label}
                  selected={filters.category === item.key}
                  onPress={() => setFilters({ ...filters, category: item.key })}
                />
              ))}
            </Row>
          </ScrollView>
        </>
      )}
      {showFilters && (
        <Panel style={{ gap: 18 }}>
          <Text variant="heading">{t("filters")}</Text>
          <Text variant="small">{t("neighborhood")}</Text>
          <Row>
            <Chip
              label={t("allAreas")}
              selected={!filters.neighborhood}
              onPress={() =>
                setFilters({ ...filters, neighborhood: undefined })
              }
            />
            {neighborhoodKeys.map((key) => (
              <Chip
                key={key}
                label={neighborhoods[key][language]}
                selected={filters.neighborhood === key}
                onPress={() => setFilters({ ...filters, neighborhood: key })}
              />
            ))}
          </Row>
          <Text variant="small">{t("condition")}</Text>
          <Row>
            <Chip
              label={t("all")}
              selected={!filters.condition}
              onPress={() => setFilters({ ...filters, condition: undefined })}
            />
            {conditionKeys.map((key) => (
              <Chip
                key={key}
                label={conditions[key][language]}
                selected={filters.condition === key}
                onPress={() => setFilters({ ...filters, condition: key })}
              />
            ))}
          </Row>
          <Row>
            <Field
              label={t("minPrice")}
              value={min}
              onChangeText={setMin}
              keyboardType="numeric"
            />
            <Field
              label={t("maxPrice")}
              value={max}
              onChangeText={setMax}
              keyboardType="numeric"
            />
          </Row>
          {invalid && (
            <Text accessibilityRole="alert" style={{ color: c.danger }}>
              {t("invalidRange")}
            </Text>
          )}
          <Button
            title={t("resetFilters")}
            kind="ghost"
            onPress={() => {
              setFilters({});
              setSearch("");
              setMin("");
              setMax("");
            }}
          />
        </Panel>
      )}
      <Row style={{ justifyContent: "space-between", alignItems: "center" }}>
        <View>
          <Text variant="heading">{t("fresh")}</Text>
          <Text variant="small" muted>
            {query.data?.pages[0]?.total ?? "…"} {t("results")}
          </Text>
        </View>
        {width < 700 && (
          <Button
            kind="secondary"
            title={t(
              filters.sort === "price-low"
                ? "priceLow"
                : filters.sort === "price-high"
                  ? "priceHigh"
                  : "newest",
            )}
            onPress={() => setShowSort(!showSort)}
          />
        )}
        {(width >= 700 || showSort) && (
          <Row style={{ flexShrink: 1 }}>
            {(["newest", "price-low", "price-high"] as const).map((sort) => (
              <Chip
                key={sort}
                label={t(
                  sort === "newest"
                    ? "newest"
                    : sort === "price-low"
                      ? "priceLow"
                      : "priceHigh",
                )}
                selected={(filters.sort ?? "newest") === sort}
                onPress={() => {
                  setFilters({ ...filters, sort });
                  setShowSort(false);
                }}
              />
            ))}
          </Row>
        )}
      </Row>
      {query.isError && (
        <ErrorBox
          retry={() => {
            void query.refetch();
          }}
        />
      )}
    </View>
  );
  return (
    <FlatList
      key={columns}
      data={invalid ? [] : items}
      numColumns={columns}
      keyExtractor={(l) => l.id}
      renderItem={({ item }) => (
        <View
          style={{
            width: `${100 / columns}%`,
            paddingHorizontal: 9,
            paddingBottom: 28,
          }}
        >
          <ListingCard listing={item} />
        </View>
      )}
      contentContainerStyle={{
        padding: width < 500 ? 16 : 28,
        maxWidth: 1240,
        width: "100%",
        alignSelf: "center",
      }}
      ListHeaderComponent={header}
      ListEmptyComponent={
        query.isPending ? (
          <Row>
            {[1, 2].map((i) => (
              <View key={i} style={{ flex: 1 }}>
                <Skeleton />
              </View>
            ))}
          </Row>
        ) : (
          <Empty
            title={t("empty")}
            body={t(saved ? "emptySaved" : "emptySearch")}
          >
            {saved && (
              <Button
                title={t("browse")}
                onPress={() => router.push("/explore")}
              />
            )}
          </Empty>
        )
      }
      ListFooterComponent={
        query.hasNextPage ? (
          <Button
            title={t("loadMore")}
            busy={query.isFetchingNextPage}
            onPress={() => {
              void query.fetchNextPage();
            }}
          />
        ) : (
          <Text
            variant="small"
            muted
            style={{ textAlign: "center", marginTop: 16, marginBottom: 16 }}
          >
            {t("privacy")}
          </Text>
        )
      }
      refreshing={query.isRefetching && !query.isFetchingNextPage}
      onRefresh={() => {
        void query.refetch();
      }}
    />
  );
}
