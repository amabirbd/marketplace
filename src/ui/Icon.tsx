import { View } from "react-native";
import { Text } from "./primitives";
export function Icon({
  name,
  color,
}: {
  name: "explore" | "saved" | "sell" | "inbox" | "profile" | "bell";
  color: string;
}) {
  const stroke = { borderColor: color, borderWidth: 1.6 };
  return (
    <View
      aria-hidden
      accessibilityElementsHidden
      style={{
        width: 24,
        height: 24,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {name === "explore" && (
        <>
          <View
            style={[
              stroke,
              {
                width: 15,
                height: 15,
                borderRadius: 9,
                position: "absolute",
                left: 2,
                top: 2,
              },
            ]}
          />
          <View
            style={{
              position: "absolute",
              width: 9,
              height: 1.6,
              backgroundColor: color,
              transform: [{ rotate: "45deg" }],
              top: 18,
              left: 14,
            }}
          />
        </>
      )}
      {name === "saved" && (
        <Text style={{ fontSize: 26, lineHeight: 28, color }}>♡</Text>
      )}
      {name === "sell" && (
        <>
          <View style={{ width: 20, height: 1.6, backgroundColor: color }} />
          <View
            style={{
              position: "absolute",
              width: 1.6,
              height: 20,
              backgroundColor: color,
            }}
          />
        </>
      )}
      {name === "inbox" && (
        <>
          <View style={[stroke, { width: 22, height: 17, borderRadius: 4 }]} />
          <View
            style={{
              position: "absolute",
              top: 7,
              width: 12,
              height: 1.6,
              backgroundColor: color,
              transform: [{ rotate: "28deg" }],
              left: 2,
            }}
          />
          <View
            style={{
              position: "absolute",
              top: 7,
              width: 12,
              height: 1.6,
              backgroundColor: color,
              transform: [{ rotate: "-28deg" }],
              right: 2,
            }}
          />
        </>
      )}
      {name === "profile" && (
        <>
          <View
            style={[
              stroke,
              {
                width: 9,
                height: 9,
                borderRadius: 5,
                position: "absolute",
                top: 0,
              },
            ]}
          />
          <View
            style={[
              stroke,
              {
                width: 20,
                height: 11,
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12,
                borderBottomWidth: 0,
                position: "absolute",
                bottom: 1,
              },
            ]}
          />
        </>
      )}
      {name === "bell" && (
        <>
          <View
            style={[
              stroke,
              {
                width: 16,
                height: 17,
                borderTopLeftRadius: 10,
                borderTopRightRadius: 10,
                borderBottomLeftRadius: 3,
                borderBottomRightRadius: 3,
                position: "absolute",
                top: 1,
              },
            ]}
          />
          <View
            style={{
              width: 4,
              height: 3,
              borderRadius: 3,
              backgroundColor: color,
              position: "absolute",
              bottom: 1,
            }}
          />
        </>
      )}
    </View>
  );
}
