import type { QueryClient, QueryKey } from "@tanstack/react-query";
export function setSavedMembership(ids: string[], id: string, saved: boolean) {
  return saved
    ? [...new Set([...ids, id])]
    : ids.filter((value) => value !== id);
}
export async function beginOptimisticSave(
  client: QueryClient,
  key: QueryKey,
  id: string,
  value: boolean,
) {
  await client.cancelQueries({ queryKey: key });
  const wasSaved = (client.getQueryData<string[]>(key) ?? []).includes(id);
  client.setQueryData<string[]>(key, (previous) =>
    setSavedMembership(previous ?? [], id, value),
  );
  return { id, wasSaved };
}
export function rollbackSave(
  client: QueryClient,
  key: QueryKey,
  context: { id: string; wasSaved: boolean },
) {
  // Restore only the failed item. A concurrent successful save must survive rollback.
  client.setQueryData<string[]>(key, (current) =>
    setSavedMembership(current ?? [], context.id, context.wasSaved),
  );
}
