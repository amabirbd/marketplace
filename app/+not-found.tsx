import { router } from "expo-router";
import { Button, Empty, Page } from "../src/ui/primitives";
import { useI18n } from "../src/ui/i18n";
export default function NotFound() {
  const { t } = useI18n();
  return (
    <Page>
      <Empty title={t("unavailable")}>
        <Button
          title={t("browse")}
          onPress={() => router.replace("/explore")}
        />
      </Empty>
    </Page>
  );
}
