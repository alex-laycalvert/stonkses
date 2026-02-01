import type { Holding } from "@repo/robinhood";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { user as userTable } from "../src/db/schema";
import { RobinhoodClient } from "../src/robinhood";
import { requireAuth, setCorsHeaders } from "./_utils";

export default async function handler(req: Request): Promise<Response> {
    const corsHeaders = setCorsHeaders(req);

    if (req.method === "OPTIONS") {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    if (req.method !== "GET") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405,
            headers: { "Content-Type": "application/json", ...corsHeaders },
        });
    }

    const { session, response } = await requireAuth(req);
    if (response) return response;

    try {
        // Get user's robinhood token
        const [userData] = await db
            .select({ robinhoodToken: userTable.robinhoodToken })
            .from(userTable)
            .where(eq(userTable.id, session!.user.id));

        if (!userData?.robinhoodToken) {
            return new Response(JSON.stringify({ holdings: [] }), {
                headers: { "Content-Type": "application/json", ...corsHeaders },
            });
        }

        const rh = await RobinhoodClient.newClient(userData.robinhoodToken);

        // Get stock positions
        const positions = await rh.positions();

        const holdings: Holding[] = [];
        holdings.push(
            ...positions.map<Holding>((pos) => ({
                type: "stock",
                symbol: pos.symbol,
                quantity: pos.quantity,
                averageBuyPrice: pos.averageBuyPrice,
                amount: pos.equity,
            })),
        );

        const cashAccounts = await rh.accounts();
        holdings.push(
            ...cashAccounts.map<Holding>((acc) => ({
                type: "account",
                accountType: acc.brokerageAccountType,
                nickname: acc.nickname,
                amount: acc.cash,
            })),
        );

        return new Response(JSON.stringify({ holdings }), {
            headers: { "Content-Type": "application/json", ...corsHeaders },
        });
    } catch (error) {
        console.error("Error fetching holdings:", error?.toString());
        return new Response(
            JSON.stringify({
                error: "Failed to fetch positions",
                code: "FETCH_FAILED",
            }),
            {
                status: 500,
                headers: { "Content-Type": "application/json", ...corsHeaders },
            },
        );
    }
}
