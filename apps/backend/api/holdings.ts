import type { Holding } from "@repo/robinhood";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { eq } from "drizzle-orm";
import { db } from "../src/db/index.ts";
import { user as userTable } from "../src/db/schema.ts";
import { RobinhoodClient } from "../src/robinhood.ts";
import { requireAuth, setCorsHeaders } from "./_utils";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    setCorsHeaders(req, res);

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const session = await requireAuth(req, res);
    if (!session) return; // Response already sent by requireAuth

    try {
        // Get user's robinhood token
        const [userData] = await db
            .select()
            .from(userTable)
            .where(eq(userTable.id, session.user.id));

        if (!userData?.robinhoodToken) {
            return res.json({ holdings: [] });
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

        return res.json({ holdings });
    } catch (error) {
        console.error("Error fetching holdings:", error?.toString());
        return res.status(500).json({
            error: "Failed to fetch positions",
            code: "FETCH_FAILED",
        });
    }
}
