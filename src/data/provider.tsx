import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DemoMarketplace } from "./demo";
import type { Marketplace } from "./types";
import { storage, clearMedia } from "../platform/storage";
import { loadPreferences } from "../state/preferences";
import { Button, Text, Panel } from "../ui/primitives";
import { useI18n } from "../ui/i18n";
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 15000, retry: 1 },
    mutations: { retry: false, networkMode: "always" },
  },
});
const demo = new DemoMarketplace(storage);
const DataContext = createContext<Marketplace>(demo);
export function useMarket() {
  return useContext(DataContext);
}
export const demoControls = {
  failNext: (kind: "save" | "send" | "ack") => demo.failNext(kind),
  setActiveConversation: (id?: string) => demo.setActiveConversation(id),
  simulateSold: () => demo.simulateSoldNotice(),
  async reset() {
    await demo.reset();
    await clearMedia();
    queryClient.clear();
  },
};
export function DataProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const { t } = useI18n();
  const initialize = () => {
    setStatus("loading");
    void demo
      .ready()
      .then(() => setStatus("ready"))
      .catch(() => setStatus("error"));
  };
  useEffect(() => {
    initialize();
    void loadPreferences();
    return demo.subscribe(() => {
      void queryClient.invalidateQueries({ queryKey: ["demo"] });
    });
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <DataContext.Provider value={demo}>
        {status === "ready" ? (
          children
        ) : (
          <Panel style={{ margin: 32, gap: 20 }}>
            <Text variant="title">LocalLoop</Text>
            <Text>{t(status === "error" ? "storageError" : "loading")}</Text>
            {status === "error" && (
              <Button title={t("retry")} onPress={initialize} />
            )}
          </Panel>
        )}
      </DataContext.Provider>
    </QueryClientProvider>
  );
}
