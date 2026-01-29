import { type UseQueryOptions, useQuery } from "@tanstack/react-query";
import type { RequestError } from "~/global/utils/request-error";
import { getHoldings } from "../requests/holdings";

type GetHoldingsOutput = Awaited<ReturnType<typeof getHoldings>>;
type GetHoldingsData = GetHoldingsOutput["holdings"];
type QKGetHoldings = readonly ["holdings"];

export function useHoldings(
    queryOptions?: Omit<
        UseQueryOptions<
            GetHoldingsOutput,
            RequestError,
            GetHoldingsData,
            QKGetHoldings
        >,
        "queryKey" | "queryFn" | "select"
    >,
) {
    const {
        data: holdings,
        fetchStatus,
        error,
        dataUpdatedAt,
    } = useQuery({
        queryKey: ["holdings"] as const,
        queryFn: getHoldings,
        ...queryOptions,

        select: (data) => data.holdings,
    });

    return {
        holdings,
        fetchStatus,
        error,
        dataUpdatedAt,
    };
}
