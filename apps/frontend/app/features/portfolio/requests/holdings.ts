import type { Holding } from "@repo/robinhood";
import { API_BASE_URL } from "~/global/constants/base-url";
import { RequestError } from "~/global/utils/request-error";

export async function getHoldings(): Promise<{ holdings: Holding[] }> {
    const response = await fetch(`${API_BASE_URL}/holdings`, {
        credentials: "include",
    });

    if (!response.ok) {
        throw new RequestError(response);
    }

    const data: { holdings: Holding[] } = await response.json();
    return data;
}
