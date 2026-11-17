import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useMarket } from "../../data/provider";
import type { Filters } from "../../data/types";
import { beginOptimisticSave, rollbackSave } from "./optimistic";
export function useListings(filters: Filters) {
  const market = useMarket();
  return useInfiniteQuery({
    queryKey: ["demo", market.identity, "listings", filters],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => market.listings(filters, pageParam),
    getNextPageParam: (page) => page.next,
    networkMode: "always",
  });
}
export function useListing(id: string) {
  const market = useMarket();
  return useQuery({
    queryKey: ["demo", market.identity, "listing", id],
    queryFn: () => market.listing(id),
    networkMode: "always",
  });
}
export function useSaved() {
  const market = useMarket();
  const client = useQueryClient();
  const key = ["demo", market.identity, "saved"];
  const query = useQuery({
    queryKey: key,
    queryFn: () => market.saved(),
    networkMode: "always",
  });
  const mutation = useMutation({
    mutationFn: ({ id, value }: { id: string; value: boolean }) =>
      market.save(id, value),
    onMutate: ({ id, value }) => beginOptimisticSave(client, key, id, value),
    onError: (_error, _input, context) => {
      if (context) rollbackSave(client, key, context);
    },
    onSettled: () => client.invalidateQueries({ queryKey: ["demo"] }),
  });
  return { ids: query.data ?? [], query, mutation };
}
