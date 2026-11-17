import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { DataProvider } from "../src/data/provider";
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <DataProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false, animation: "none" }} />
      </DataProvider>
    </SafeAreaProvider>
  );
}
