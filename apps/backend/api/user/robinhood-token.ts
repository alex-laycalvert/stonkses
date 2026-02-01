import type { VercelRequest, VercelResponse } from "@vercel/node";
import { eq } from "drizzle-orm";
import { db } from "../../src/db";
import { user as userTable } from "../../src/db/schema";
import { requireAuth, setCorsHeaders } from "../_utils";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    setCorsHeaders(req, res);

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method !== "PUT") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const session = await requireAuth(req, res);
    if (!session) return; // Response already sent by requireAuth

    const body = req.body as { token?: string };

    if (!body.token || typeof body.token !== "string") {
        return res.status(400).json({
            error: "Token is required",
            code: "INVALID_INPUT",
        });
    }

    try {
        await db
            .update(userTable)
            .set({ robinhoodToken: body.token })
            .where(eq(userTable.id, session.user.id))
            .execute();

        return res.json({ success: true });
    } catch (error) {
        console.error("Error updating robinhood token:", error);
        return res.status(500).json({
            error: "Failed to update token",
            code: "UPDATE_FAILED",
        });
    }
}
