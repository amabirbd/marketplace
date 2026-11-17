import { useEffect, useState } from "react";
import { Image } from "expo-image";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { resolvePhoto, releasePhoto } from "../platform/media";
import { Text, useTheme } from "./primitives";
import { useI18n } from "./i18n";
const assets: Record<string, number> = {
  "asset:chair": require("../../assets/images/chair.jpg"),
  "asset:headphones": require("../../assets/images/headphones.jpg"),
  "asset:books": require("../../assets/images/books.jpg"),
  "asset:jacket": require("../../assets/images/jacket.jpg"),
  "asset:bicycle": require("../../assets/images/bicycle.jpg"),
  "asset:lamp": require("../../assets/images/lamp.jpg"),
};
export const samplePhotos = Object.keys(assets);
export function Photo({
  id,
  label,
  style,
}: {
  id?: string;
  label: string;
  style?: StyleProp<ViewStyle>;
}) {
  const [uri, setUri] = useState<string>();
  const [failed, setFailed] = useState(false);
  const c = useTheme();
  const { t } = useI18n();
  useEffect(() => {
    let alive = true;
    let resolved: string | undefined;
    setUri(undefined);
    setFailed(false);
    if (id && !assets[id])
      void resolvePhoto(id)
        .then((value) => {
          resolved = value;
          if (alive) setUri(value);
          else releasePhoto(value);
        })
        .catch(() => {
          if (alive) setFailed(true);
        });
    return () => {
      alive = false;
      if (resolved) releasePhoto(resolved);
    };
  }, [id]);
  return (
    <View style={[{ overflow: "hidden", backgroundColor: c.soft }, style]}>
      {!id || failed ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text variant="small" muted>
            {t("photoUnavailable")}
          </Text>
        </View>
      ) : (
        <Image
          accessibilityLabel={label}
          source={assets[id] ?? (uri ? { uri } : undefined)}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
          transition={0}
          onError={() => setFailed(true)}
        />
      )}
    </View>
  );
}
