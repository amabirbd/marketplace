import { File, Paths } from "expo-file-system";
import type { DemoState, SnapshotStorage } from "../data/types";
const snapshot = () => new File(Paths.document, "localloop-demo-v1.json");
export const storage: SnapshotStorage = {
  async read() {
    const file = snapshot();
    return file.exists ? (JSON.parse(await file.text()) as DemoState) : null;
  },
  async write(state) {
    snapshot().write(JSON.stringify(state));
  },
};
export async function readValue<T>(key: string): Promise<T | undefined> {
  const file = new File(Paths.document, `localloop-${key}.json`);
  return file.exists ? (JSON.parse(await file.text()) as T) : undefined;
}
export async function writeValue(key: string, value: unknown) {
  new File(Paths.document, `localloop-${key}.json`).write(
    JSON.stringify(value),
  );
}
export async function clearMedia() {
  /* Native demo currently uses bundled image assets. */
}
